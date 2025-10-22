import { useState, useEffect } from 'react'
import { AuditLogService, CombinedAuditLog } from '../services/auditLogService'
import { supabase } from '../lib/supabase'
import { Activity, Calendar, Search, User, Database, Eye, Filter, Download, RefreshCw } from 'lucide-react'

export function AuditLogsSection() {
  const [auditLogs, setAuditLogs] = useState<CombinedAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterLogType, setFilterLogType] = useState<'all' | 'system' | 'customer_debit'>('all')
  const [selectedLog, setSelectedLog] = useState<CombinedAuditLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  
  useEffect(() => {
    loadAuditLogs()
  }, [])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      
      let logs: CombinedAuditLog[] = []
      
      // Try to load from the view first, fallback to direct table queries
      try {
        if (dateRange) {
          logs = await AuditLogService.getAuditLogsByDateRange(
            dateRange.start,
            dateRange.end,
            200
          )
        } else if (searchTerm) {
          logs = await AuditLogService.searchAuditLogs(
            searchTerm,
            filterLogType === 'all' ? undefined : filterLogType,
            200
          )
        } else {
          logs = await AuditLogService.getCombinedAuditLogs(200)
        }
      } catch (viewError) {
        console.warn('View not available, falling back to direct queries:', viewError)
        // Fallback to direct table queries
        logs = await loadAuditLogsDirect()
      }

      setAuditLogs(logs)
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAuditLogsDirect = async (): Promise<CombinedAuditLog[]> => {
    try {
      // Load system audit logs
      const { data: systemLogs, error: systemError } = await supabase
        .from('audit_logs')
        .select(`
          *,
          app_users!audit_logs_user_id_fkey (
            full_name,
            email,
            role
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (systemError) {
        console.error('Error loading system audit logs:', systemError)
      }

      // Load customer debit audit logs
      const { data: customerDebitLogs, error: customerDebitError } = await supabase
        .from('customer_debit_audit_logs')
        .select(`
          *,
          app_users!customer_debit_audit_logs_user_id_fkey (
            full_name,
            email,
            role
          ),
          customers!customer_debit_audit_logs_customer_id_fkey (
            name
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (customerDebitError) {
        console.error('Error loading customer debit audit logs:', customerDebitError)
      }

      // Transform system logs
      const transformedSystemLogs: CombinedAuditLog[] = (systemLogs || []).map(log => ({
        ...log,
        log_type: 'system' as const,
        transaction_id: undefined,
        customer_id: undefined,
        customer_name: undefined,
        user_name: log.app_users?.full_name || 'Unknown User',
        user_email: log.app_users?.email || 'Unknown',
        user_role: log.app_users?.role || 'Unknown',
        old_values: undefined,
        new_values: undefined
      }))

      // Transform customer debit logs
      const transformedCustomerDebitLogs: CombinedAuditLog[] = (customerDebitLogs || []).map(log => ({
        ...log,
        log_type: 'customer_debit' as const,
        user_name: log.app_users?.full_name || 'Unknown User',
        user_email: log.app_users?.email || 'Unknown',
        user_role: log.app_users?.role || 'Unknown',
        customer_name: log.customers?.name || 'Unknown Customer'
      }))

      // Combine and sort by timestamp
      const allLogs = [...transformedSystemLogs, ...transformedCustomerDebitLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 200)

      return allLogs
    } catch (error) {
      console.error('Error in direct audit logs loading:', error)
      return []
    }
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.target_type && log.target_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.customer_name && log.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesAction = !filterAction || log.action === filterAction
    const matchesLogType = filterLogType === 'all' || log.log_type === filterLogType
    
    return matchesSearch && matchesAction && matchesLogType
  })

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))]
  const uniqueLogTypes = [...new Set(auditLogs.map(log => log.log_type))]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'customerdebitcreated':
        return 'bg-green-100 text-green-800'
      case 'customerdebitupdated':
        return 'bg-blue-100 text-blue-800'
      case 'customerdebitapproved':
        return 'bg-emerald-100 text-emerald-800'
      case 'customerdebitrejected':
        return 'bg-red-100 text-red-800'
      case 'customerdebitdeleted':
        return 'bg-red-100 text-red-800'
      case 'ordercreated':
        return 'bg-green-100 text-green-800'
      case 'perfumeadded':
        return 'bg-blue-100 text-blue-800'
      case 'perfumeupdated':
        return 'bg-yellow-100 text-yellow-800'
      case 'perfumedeleted':
        return 'bg-red-100 text-red-800'
      case 'userrolechanged':
        return 'bg-purple-100 text-purple-800'
      case 'userstatuschanged':
        return 'bg-indigo-100 text-indigo-800'
      case 'login':
        return 'bg-purple-100 text-purple-800'
      case 'logout':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLogTypeColor = (logType: string) => {
    switch (logType) {
      case 'system':
        return 'bg-blue-100 text-blue-800'
      case 'customer_debit':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const showLogDetails = (log: CombinedAuditLog) => {
    setSelectedLog(log)
    setShowDetails(true)
  }

  const handleSearch = () => {
    loadAuditLogs()
  }

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ start, end })
    loadAuditLogs()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterAction('')
    setFilterLogType('all')
    setDateRange(null)
    loadAuditLogs()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600">Track all system activities and customer debit transactions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
          <button
            onClick={loadAuditLogs}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Log Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Type
            </label>
            <select
              value={filterLogType}
              onChange={(e) => setFilterLogType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="system">System Events</option>
              <option value="customer_debit">Customer Debits</option>
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange?.start || ''}
                onChange={(e) => {
                  const start = e.target.value
                  const end = dateRange?.end || new Date().toISOString().split('T')[0]
                  handleDateRangeChange(start, end)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="date"
                value={dateRange?.end || ''}
                onChange={(e) => {
                  const start = dateRange?.start || new Date().toISOString().split('T')[0]
                  const end = e.target.value
                  handleDateRangeChange(start, end)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Audit Logs ({filteredLogs.length} logs)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Log Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {formatDate(log.timestamp)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.user_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.user_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLogTypeColor(log.log_type)}`}>
                      {log.log_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {log.description}
                    </div>
                    {log.log_type === 'customer_debit' && log.metadata && (
                      <div className="text-xs text-gray-500 mt-1">
                        Amount: ${log.metadata.amount || 'N/A'} | 
                        Status: {log.metadata.status || 'N/A'} | 
                        Type: {log.metadata.transaction_type || 'N/A'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.customer_name ? (
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium">{log.customer_name}</div>
                          {log.customer_id && (
                            <div className="text-xs text-gray-500">ID: {log.customer_id}</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => showLogDetails(log)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timestamp</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                  <p className="text-sm text-gray-900">{selectedLog.user_name || 'Unknown User'} ({selectedLog.user_id})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Log Type</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLogTypeColor(selectedLog.log_type)}`}>
                    {selectedLog.log_type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Type</label>
                  <p className="text-sm text-gray-900">{selectedLog.target_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target ID</label>
                  <p className="text-sm text-gray-900">{selectedLog.target_id || 'N/A'}</p>
                </div>
                {selectedLog.customer_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                    <p className="text-sm text-gray-900">{selectedLog.customer_name} ({selectedLog.customer_id})</p>
                  </div>
                )}
                {selectedLog.transaction_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                    <p className="text-sm text-gray-900">{selectedLog.transaction_id}</p>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
                    <p className="text-sm text-gray-900">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedLog.description}</p>
              </div>

              {/* Customer Debit Specific Info */}
              {selectedLog.log_type === 'customer_debit' && (
                <div className="space-y-4">
                  {selectedLog.old_values && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Previous Values</label>
                      <pre className="bg-red-50 p-4 rounded-lg text-sm overflow-x-auto border border-red-200">
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.new_values && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Values</label>
                      <pre className="bg-green-50 p-4 rounded-lg text-sm overflow-x-auto border border-green-200">
                        {JSON.stringify(selectedLog.new_values, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metadata</label>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetails(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
