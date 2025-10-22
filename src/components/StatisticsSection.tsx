import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  Calendar,
  Download,
  FileText,
  Table,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Types
interface StatisticsData {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  averageOrderValue: number
  totalTransactions: number
  pendingTransactions: number
  approvedTransactions: number
  rejectedTransactions: number
  totalOutstanding: number
  totalPaid: number
  topCustomers: Array<{
    id: string
    name: string
    total_spent: number
    order_count: number
  }>
  topProducts: Array<{
    id: string
    name: string
    brand: string
    total_sold: number
    revenue: number
  }>
  dailyStats: Array<{
    date: string
    revenue: number
    orders: number
    customers: number
  }>
  monthlyStats: Array<{
    month: string
    revenue: number
    orders: number
    profit: number
  }>
}

interface StatisticsSectionProps {
  user: any
  appUser: any
}

type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
type ExportFormat = 'pdf' | 'excel'

export function StatisticsSection({ user, appUser }: StatisticsSectionProps) {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  })
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  useEffect(() => {
    loadStatistics()
  }, [timeRange, customDateRange])

  const getDateRange = () => {
    const now = new Date()
    const start = new Date()
    
    switch (timeRange) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        return { start: start.toISOString(), end: now.toISOString() }
      case 'week':
        start.setDate(now.getDate() - 7)
        return { start: start.toISOString(), end: now.toISOString() }
      case 'month':
        start.setMonth(now.getMonth() - 1)
        return { start: start.toISOString(), end: now.toISOString() }
      case 'quarter':
        start.setMonth(now.getMonth() - 3)
        return { start: start.toISOString(), end: now.toISOString() }
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        return { start: start.toISOString(), end: now.toISOString() }
      case 'custom':
        return { 
          start: customDateRange.start ? new Date(customDateRange.start).toISOString() : '', 
          end: customDateRange.end ? new Date(customDateRange.end).toISOString() : '' 
        }
      default:
        return { start: start.toISOString(), end: now.toISOString() }
    }
  }

  const loadStatistics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { start, end } = getDateRange()
      
      // Load all statistics in parallel
      const [
        ordersData,
        customersData,
        productsData,
        transactionsData,
        topCustomersData,
        topProductsData,
        dailyStatsData,
        monthlyStatsData
      ] = await Promise.all([
        loadOrdersStats(start, end),
        loadCustomersStats(start, end),
        loadProductsStats(),
        loadTransactionsStats(start, end),
        loadTopCustomers(start, end),
        loadTopProducts(start, end),
        loadDailyStats(start, end),
        loadMonthlyStats(start, end)
      ])

      const stats: StatisticsData = {
        totalRevenue: ordersData.totalRevenue,
        totalCost: ordersData.totalCost,
        totalProfit: ordersData.totalRevenue - ordersData.totalCost,
        totalOrders: ordersData.totalOrders,
        totalCustomers: customersData.totalCustomers,
        totalProducts: productsData.totalProducts,
        averageOrderValue: ordersData.totalOrders > 0 ? ordersData.totalRevenue / ordersData.totalOrders : 0,
        totalTransactions: transactionsData.totalTransactions,
        pendingTransactions: transactionsData.pendingTransactions,
        approvedTransactions: transactionsData.approvedTransactions,
        rejectedTransactions: transactionsData.rejectedTransactions,
        totalOutstanding: transactionsData.totalOutstanding,
        totalPaid: transactionsData.totalPaid,
        topCustomers: topCustomersData,
        topProducts: topProductsData,
        dailyStats: dailyStatsData,
        monthlyStats: monthlyStatsData
      }

      setStatistics(stats)
    } catch (err: any) {
      console.error('Error loading statistics:', err)
      setError(err.message || 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const loadOrdersStats = async (start: string, end: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        total_amount,
        status
      `)
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('status', 'completed')

    if (error) throw error

    const totalRevenue = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0
    
    // For now, estimate cost as 70% of revenue (30% profit margin)
    // This can be improved later with proper order_items relationship
    const totalCost = totalRevenue * 0.7

    return {
      totalRevenue,
      totalCost,
      totalOrders: data?.length || 0
    }
  }

  const loadCustomersStats = async (start: string, end: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .gte('created_at', start)
      .lte('created_at', end)

    if (error) throw error

    return {
      totalCustomers: data?.length || 0
    }
  }

  const loadProductsStats = async () => {
    const { data, error } = await supabase
      .from('perfumes')
      .select('id')

    if (error) throw error

    return {
      totalProducts: data?.length || 0
    }
  }

  const loadTransactionsStats = async (start: string, end: string) => {
    const { data, error } = await supabase
      .from('customer_debits')
      .select('amount, status, transaction_type')
      .gte('created_at', start)
      .lte('created_at', end)

    if (error) throw error

    const totalTransactions = data?.length || 0
    const pendingTransactions = data?.filter(t => t.status === 'pending').length || 0
    const approvedTransactions = data?.filter(t => t.status === 'approved').length || 0
    const rejectedTransactions = data?.filter(t => t.status === 'rejected').length || 0
    
    const totalOutstanding = data?.filter(t => t.status === 'approved' && t.transaction_type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0) || 0
    
    const totalPaid = data?.filter(t => t.status === 'approved' && t.transaction_type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0) || 0

    return {
      totalTransactions,
      pendingTransactions,
      approvedTransactions,
      rejectedTransactions,
      totalOutstanding,
      totalPaid
    }
  }

  const loadTopCustomers = async (start: string, end: string) => {
    const { data, error } = await supabase
      .from('customer_summary')
      .select('id, name, current_balance, total_transactions')
      .order('current_balance', { ascending: false })
      .limit(10)

    if (error) throw error

    return data?.map(customer => ({
      id: customer.id,
      name: customer.name,
      total_spent: Math.abs(customer.current_balance),
      order_count: customer.total_transactions
    })) || []
  }

  const loadTopProducts = async (start: string, end: string) => {
    const { data, error } = await supabase
      .from('perfumes')
      .select(`
        id,
        name,
        brand,
        sell_price,
        quantity
      `)
      .order('sell_price', { ascending: false })
      .limit(10)

    if (error) throw error

    return data?.map(product => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      total_sold: product.quantity,
      revenue: product.sell_price * product.quantity
    })) || []
  }

  const loadDailyStats = async (start: string, end: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('status', 'completed')

    if (error) throw error

    // Group by date
    const dailyMap = new Map()
    data?.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, revenue: 0, orders: 0, customers: 0 })
      }
      const day = dailyMap.get(date)
      day.revenue += order.total_amount
      day.orders += 1
    })

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }

  const loadMonthlyStats = async (start: string, end: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('status', 'completed')

    if (error) throw error

    // Group by month
    const monthlyMap = new Map()
    data?.forEach(order => {
      const date = new Date(order.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { month: monthKey, revenue: 0, orders: 0, profit: 0 })
      }
      const month = monthlyMap.get(monthKey)
      month.revenue += order.total_amount
      month.orders += 1
      month.profit += order.total_amount * 0.3 // Assuming 30% profit margin
    })

    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))
  }

  const exportToPDF = async () => {
    if (!statistics) return
    
    setExporting('pdf')
    try {
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(20)
      doc.text('Business Statistics Report', 20, 20)
      
      // Date range
      doc.setFontSize(12)
      const { start, end } = getDateRange()
      doc.text(`Period: ${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`, 20, 30)
      
      // Key metrics
      doc.setFontSize(16)
      doc.text('Key Metrics', 20, 50)
      
      const metrics = [
        ['Total Revenue', `$${statistics.totalRevenue.toFixed(2)}`],
        ['Total Profit', `$${statistics.totalProfit.toFixed(2)}`],
        ['Total Orders', statistics.totalOrders.toString()],
        ['Total Customers', statistics.totalCustomers.toString()],
        ['Average Order Value', `$${statistics.averageOrderValue.toFixed(2)}`],
        ['Total Outstanding', `$${statistics.totalOutstanding.toFixed(2)}`]
      ]
      
      doc.autoTable({
        startY: 60,
        head: [['Metric', 'Value']],
        body: metrics,
        theme: 'grid'
      })
      
      // Top customers
      doc.setFontSize(16)
      doc.text('Top Customers', 20, doc.lastAutoTable.finalY + 20)
      
      const customerData = statistics.topCustomers.map(customer => [
        customer.name,
        customer.order_count.toString(),
        `$${customer.total_spent.toFixed(2)}`
      ])
      
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 30,
        head: [['Customer', 'Orders', 'Total Spent']],
        body: customerData,
        theme: 'grid'
      })
      
      // Top products
      doc.setFontSize(16)
      doc.text('Top Products', 20, doc.lastAutoTable.finalY + 20)
      
      const productData = statistics.topProducts.map(product => [
        product.name,
        product.brand,
        product.total_sold.toString(),
        `$${product.revenue.toFixed(2)}`
      ])
      
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 30,
        head: [['Product', 'Brand', 'Quantity', 'Revenue']],
        body: productData,
        theme: 'grid'
      })
      
      // Save PDF
      doc.save(`statistics-report-${new Date().toISOString().split('T')[0]}.pdf`)
      
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert('Failed to export PDF')
    } finally {
      setExporting(null)
    }
  }

  const exportToExcel = async () => {
    if (!statistics) return
    
    setExporting('excel')
    try {
      const workbook = XLSX.utils.book_new()
      
      // Key metrics sheet
      const metricsData = [
        ['Metric', 'Value'],
        ['Total Revenue', statistics.totalRevenue],
        ['Total Profit', statistics.totalProfit],
        ['Total Orders', statistics.totalOrders],
        ['Total Customers', statistics.totalCustomers],
        ['Average Order Value', statistics.averageOrderValue],
        ['Total Outstanding', statistics.totalOutstanding],
        ['Total Transactions', statistics.totalTransactions],
        ['Pending Transactions', statistics.pendingTransactions],
        ['Approved Transactions', statistics.approvedTransactions],
        ['Rejected Transactions', statistics.rejectedTransactions]
      ]
      
      const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData)
      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Key Metrics')
      
      // Top customers sheet
      const customersData = [
        ['Customer Name', 'Orders', 'Total Spent'],
        ...statistics.topCustomers.map(customer => [
          customer.name,
          customer.order_count,
          customer.total_spent
        ])
      ]
      
      const customersSheet = XLSX.utils.aoa_to_sheet(customersData)
      XLSX.utils.book_append_sheet(workbook, customersSheet, 'Top Customers')
      
      // Top products sheet
      const productsData = [
        ['Product Name', 'Brand', 'Quantity', 'Revenue'],
        ...statistics.topProducts.map(product => [
          product.name,
          product.brand,
          product.total_sold,
          product.revenue
        ])
      ]
      
      const productsSheet = XLSX.utils.aoa_to_sheet(productsData)
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Products')
      
      // Daily stats sheet
      const dailyData = [
        ['Date', 'Revenue', 'Orders', 'Customers'],
        ...statistics.dailyStats.map(day => [
          day.date,
          day.revenue,
          day.orders,
          day.customers
        ])
      ]
      
      const dailySheet = XLSX.utils.aoa_to_sheet(dailyData)
      XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Statistics')
      
      // Monthly stats sheet
      const monthlyData = [
        ['Month', 'Revenue', 'Orders', 'Profit'],
        ...statistics.monthlyStats.map(month => [
          month.month,
          month.revenue,
          month.orders,
          month.profit
        ])
      ]
      
      const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData)
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Statistics')
      
      // Save Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `statistics-report-${new Date().toISOString().split('T')[0]}.xlsx`)
      
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Failed to export Excel')
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-800">
            <h3 className="text-lg font-semibold mb-2">Error Loading Statistics</h3>
            <p className="mb-4">{error}</p>
            <button
              onClick={loadStatistics}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!statistics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Business Statistics</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Comprehensive business analytics and reporting</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            onClick={loadStatistics}
            className="text-gray-600 hover:text-gray-900 p-2"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          
          <button
            onClick={exportToPDF}
            disabled={exporting === 'pdf'}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === 'pdf' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </>
            )}
          </button>
          
          <button
            onClick={exportToExcel}
            disabled={exporting === 'excel'}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting === 'excel' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Table className="h-4 w-4 mr-2" />
                Export Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(['today', 'week', 'month', 'quarter', 'year', 'custom'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          {timeRange === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Revenue</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">${statistics.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Profit</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">${statistics.totalProfit.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Orders</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{statistics.totalOrders}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Customers</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{statistics.totalCustomers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Average Order Value</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">${statistics.averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Outstanding Amount</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">${statistics.totalOutstanding.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Approved Transactions</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">{statistics.approvedTransactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Status Overview */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-orange-800">Pending</span>
            </div>
            <span className="text-lg font-semibold text-orange-900">{statistics.pendingTransactions}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Approved</span>
            </div>
            <span className="text-lg font-semibold text-green-900">{statistics.approvedTransactions}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">Rejected</span>
            </div>
            <span className="text-lg font-semibold text-red-900">{statistics.rejectedTransactions}</span>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statistics.topCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.order_count}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${customer.total_spent.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statistics.topProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.brand}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.total_sold}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
