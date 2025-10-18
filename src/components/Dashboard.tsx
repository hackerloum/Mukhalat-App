import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Perfume } from '../lib/supabase'
import { AddProductModal } from './AddProductModal'
import { 
  ShoppingBag, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Search,
  LogOut,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react'

export function Dashboard() {
  const { appUser, signOut } = useAuth()
  const [perfumes, setPerfumes] = useState<Perfume[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    totalCostValue: 0,
    profitMargin: 0,
    lowStock: 0,
    outOfStock: 0,
    totalProducts: 0,
  })

  useEffect(() => {
    loadPerfumes()
  }, [])

  const loadPerfumes = async () => {
    try {
      const { data, error } = await supabase
        .from('perfumes')
        .select('*')
        .order('added_date', { ascending: false })

      if (error) throw error
      setPerfumes(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error loading perfumes:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (perfumeData: Perfume[]) => {
    const totalItems = perfumeData.reduce((sum, p) => sum + p.quantity, 0)
    const totalValue = perfumeData.reduce((sum, p) => sum + (p.sell_price * p.quantity), 0)
    const totalCostValue = perfumeData.reduce((sum, p) => sum + (p.cost_price * p.quantity), 0)
    const profitMargin = totalValue - totalCostValue
    const lowStock = perfumeData.filter(p => p.quantity < 5 && p.quantity > 0).length
    const outOfStock = perfumeData.filter(p => p.quantity === 0).length
    const totalProducts = perfumeData.length

    setStats({ 
      totalItems, 
      totalValue, 
      totalCostValue, 
      profitMargin, 
      lowStock, 
      outOfStock, 
      totalProducts 
    })
  }

  const filteredPerfumes = perfumes.filter(perfume =>
    perfume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perfume.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perfume.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSignOut = async () => {
    await signOut()
  }

  const handleProductAdded = () => {
    loadPerfumes() // Reload the perfumes list
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <h1 className="ml-2 text-lg sm:text-xl font-semibold text-gray-900">Mukhallat App</h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block text-sm text-gray-600">
                Welcome, {appUser?.full_name || appUser?.email}
              </div>
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {appUser?.role}
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-900 p-1 sm:p-0"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalProducts}</p>
                <p className="text-xs text-blue-500 mt-1">Unique items</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-green-900">${stats.totalValue.toFixed(2)}</p>
                <p className="text-xs text-green-500 mt-1">At sell price</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Profit Margin</p>
                <p className="text-2xl font-bold text-purple-900">${stats.profitMargin.toFixed(2)}</p>
                <p className="text-xs text-purple-500 mt-1">Potential profit</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Total Items</p>
                <p className="text-2xl font-bold text-orange-900">{stats.totalItems}</p>
                <p className="text-xs text-orange-500 mt-1">In inventory</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stock Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm border border-emerald-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">In Stock</p>
                <p className="text-2xl font-bold text-emerald-900">{stats.totalProducts - stats.lowStock - stats.outOfStock}</p>
                <p className="text-xs text-emerald-500 mt-1">Healthy stock levels</p>
              </div>
              <div className="bg-emerald-500 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-sm border border-yellow-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 mb-1">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.lowStock}</p>
                <p className="text-xs text-yellow-500 mt-1">Need restocking</p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Out of Stock</p>
                <p className="text-2xl font-bold text-red-900">{stats.outOfStock}</p>
                <p className="text-xs text-red-500 mt-1">Urgent restock needed</p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="w-full lg:flex-1 lg:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, brands, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                Showing {filteredPerfumes.length} of {perfumes.length} products
              </div>
              
              {(appUser?.role === 'admin' || appUser?.role === 'manager') && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center shadow-sm transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Product Inventory</h3>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cost Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Sell Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Store Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Profit Margin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPerfumes.map((perfume) => (
                  <tr key={perfume.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{perfume.name}</div>
                        <div className="text-sm text-gray-500">{perfume.brand}</div>
                        {perfume.size && (
                          <div className="text-xs text-gray-400 mt-1">{perfume.size}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {perfume.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      ${perfume.cost_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${perfume.sell_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      ${perfume.store_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                      ${(perfume.sell_price - perfume.cost_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {perfume.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {perfume.quantity === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Out of Stock
                        </span>
                      ) : perfume.quantity < 5 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Enhanced Mobile Card Layout */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-200">
              {filteredPerfumes.map((perfume) => (
                <div key={perfume.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900">{perfume.name}</h4>
                      <p className="text-sm text-gray-500">{perfume.brand}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {perfume.category}
                        </span>
                        {perfume.size && (
                          <span className="text-xs text-gray-400">{perfume.size}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {perfume.quantity === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Out of Stock
                        </span>
                      ) : perfume.quantity < 5 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-red-50 p-3 rounded-lg">
                      <span className="text-red-600 font-medium">Cost Price:</span>
                      <div className="text-red-800 font-semibold">${perfume.cost_price.toFixed(2)}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <span className="text-green-600 font-medium">Sell Price:</span>
                      <div className="text-green-800 font-semibold">${perfume.sell_price.toFixed(2)}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="text-blue-600 font-medium">Store Price:</span>
                      <div className="text-blue-800 font-semibold">${perfume.store_price.toFixed(2)}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <span className="text-purple-600 font-medium">Profit:</span>
                      <div className="text-purple-800 font-semibold">${(perfume.sell_price - perfume.cost_price).toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Stock Quantity:</span>
                      <span className="font-semibold text-gray-900">{perfume.quantity} units</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {filteredPerfumes.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
              </p>
              {(appUser?.role === 'admin' || appUser?.role === 'manager') && !searchTerm && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Product Modal */}
        <AddProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onProductAdded={handleProductAdded}
        />
      </div>
    </div>
  )
}
