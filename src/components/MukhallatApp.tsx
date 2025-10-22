import React, { useState, useEffect } from 'react'
import { 
  ShoppingBag, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Search,
  LogOut,
  Eye,
  EyeOff,
  Save,
  X,
  Users,
  Activity,
  Edit,
  Trash2
} from 'lucide-react'
import { OrdersSection } from './OrdersSection'
import { AuditLogsSection } from './AuditLogsSection'
import { EditProductModal } from './EditProductModal'
import { CustomerDebitsSection } from './CustomerDebitsSection'
import { StatisticsSection } from './StatisticsSection'
import { AuditLogService, AuditAction } from '../services/auditLogService'
import { supabase } from '../lib/supabase'

// Types
interface Perfume {
  id: string
  name: string
  brand: string
  category: string
  cost_price: number
  sell_price: number
  store_price: number
  quantity: number
  size: string
  notes: string
  added_date: string
  expiry_date?: string
  description: string
  image_url: string
}

interface AppUser {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'manager' | 'staff'
  created_at: string
  last_login_at?: string
  is_active: boolean
}

export function MukhallatApp() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState('Initializing...')

  useEffect(() => {
    const init = async () => {
      try {
        setStep('Getting session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`)
        }
        
        setStep('Session retrieved')
        setUser(session?.user || null)
        
        if (session?.user) {
          setStep('Loading user profile...')
          await loadAppUser(session.user)
        }
        
        setLoading(false)
        
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
        console.error('Initialization error:', err)
      }
    }

    init()
  }, [])

  const loadAppUser = async (user: any) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // Create default user if not found
        const defaultUser: AppUser = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          role: (user.user_metadata?.role as 'admin' | 'manager' | 'staff') || 'staff',
          created_at: new Date().toISOString(),
          is_active: true,
        }
        setAppUser(defaultUser)
      } else {
        setAppUser(data)
      }
    } catch (err) {
      console.error('Error loading app user:', err)
      // Create default user
      const defaultUser: AppUser = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        role: 'staff',
        created_at: new Date().toISOString(),
        is_active: true,
      }
      setAppUser(defaultUser)
    }
  }

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      setStep('Signing in...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      setUser(data.user)
      await loadAppUser(data.user)
      setStep('Signed in successfully')
      setLoading(false)
      
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      setStep('Sign in failed')
    }
  }

  const handleSignUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      setLoading(true)
      setError(null)
      setStep('Creating account...')
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      setUser(data.user)
      if (data.user) {
        // Create app_users record
        const { error: insertError } = await supabase
          .from('app_users')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            full_name: fullName,
            role: role,
            created_at: new Date().toISOString(),
            is_active: true,
          })

        if (insertError) {
          console.error('Error creating app user record:', insertError)
        }

        await loadAppUser(data.user)
      }
      setStep('Account created successfully')
      setLoading(false)
      
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      setStep('Sign up failed')
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setAppUser(null)
      setStep('Signed out')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{step}</p>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onSignIn={handleSignIn} onSignUp={handleSignUp} error={error} />
  }

  return <Dashboard user={user} appUser={appUser} onSignOut={handleSignOut} />
}

// Auth Screen Component
function AuthScreen({ onSignIn, onSignUp, error }: { 
  onSignIn: (email: string, password: string) => void, 
  onSignUp: (email: string, password: string, fullName: string, role: string) => void,
  error: string | null 
}) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'staff',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        await onSignIn(formData.email, formData.password)
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        await onSignUp(formData.email, formData.password, formData.fullName, formData.role)
      }
    } catch (err: any) {
      // Error is handled by parent component
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mukhallat App</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Full Name (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {/* Role (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          {/* Toggle Login/Register */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  fullName: '',
                  role: 'staff',
                })
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Main Dashboard Component with Navigation
function Dashboard({ user, appUser, onSignOut }: { 
  user: any,
  appUser: AppUser | null, 
  onSignOut: () => void 
}) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [perfumes, setPerfumes] = useState<Perfume[]>([])
  const [loading, setLoading] = useState(true)
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

  const handleProductAdded = () => {
    loadPerfumes() // Reload the perfumes list
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent
          perfumes={perfumes}
          loading={loading}
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          handleProductAdded={handleProductAdded}
          stats={stats}
          user={user}
        />
      case 'inventory':
        return <InventoryContent
          perfumes={perfumes}
          loading={loading}
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          handleProductAdded={handleProductAdded}
          appUser={appUser}
          user={user}
        />
      case 'customer-debits':
        return <CustomerDebitsSection user={user} appUser={appUser} />
      case 'stats':
        return <StatisticsSection user={user} appUser={appUser} />
      case 'orders':
        return <OrdersContent user={user} appUser={appUser} />
      case 'users':
        return <UsersContent user={user} appUser={appUser} />
      case 'audit':
        return <AuditContent />
      default:
        return <DashboardContent
          perfumes={perfumes}
          loading={loading}
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          handleProductAdded={handleProductAdded}
          stats={stats}
          user={user}
        />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 min-w-0">
            <div className="flex items-center min-w-0 flex-1">
              <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <h1 className="ml-2 text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">Mukhallat App</h1>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
              <div className="hidden lg:block text-sm text-gray-600 truncate max-w-32">
                Welcome, {(appUser?.full_name || appUser?.email)?.slice(0, 20)}
              </div>
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {appUser?.role}
              </div>
              <button
                onClick={onSignOut}
                className="flex items-center text-gray-600 hover:text-gray-900 p-1 sm:p-2"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Package },
              { id: 'inventory', label: 'Inventory', icon: Package },
              { id: 'customer-debits', label: 'Customer Debits', icon: DollarSign },
              { id: 'stats', label: 'Statistics', icon: TrendingUp },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              ...(appUser?.role === 'admin' ? [
                { id: 'users', label: 'Users', icon: Users },
                { id: 'audit', label: 'Audit Logs', icon: Activity }
              ] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="overflow-x-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

// Dashboard Content Component
function DashboardContent({ perfumes, loading, showAddModal, setShowAddModal, handleProductAdded, stats, user }: {
  perfumes: Perfume[]
  loading: boolean
  showAddModal: boolean
  setShowAddModal: (show: boolean) => void
  handleProductAdded: () => void
  stats: any
  user: any
}) {
  const [searchTerm] = useState('')
  
  const filteredPerfumes = perfumes.filter(perfume =>
    perfume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perfume.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perfume.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1 truncate">Total Products</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-900">{perfumes.length.toLocaleString()}</p>
              <p className="text-xs text-blue-500 mt-1 hidden sm:block">Unique items</p>
            </div>
            <div className="bg-blue-500 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
              <Package className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-green-600 mb-1 truncate">Total Value</p>
              <p className="text-lg sm:text-2xl font-bold text-green-900">${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-green-500 mt-1 hidden sm:block">At sell price</p>
            </div>
            <div className="bg-green-500 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
              <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-purple-600 mb-1 truncate">Profit Margin</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-900">${stats.profitMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-purple-500 mt-1 hidden sm:block">Potential profit</p>
            </div>
            <div className="bg-purple-500 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-orange-600 mb-1 truncate">Total Items</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-900">{stats.totalItems.toLocaleString()}</p>
              <p className="text-xs text-orange-500 mt-1 hidden sm:block">In inventory</p>
            </div>
            <div className="bg-orange-500 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
              <Package className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900">Add Product</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <ShoppingBag className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-900">New Order</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900">View Reports</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Package className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-900">Inventory</span>
          </button>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Products</h3>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredPerfumes.slice(0, 5).map((perfume) => (
            <div key={perfume.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex justify-between items-start">
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
                <div className="ml-4 text-right">
                  <div className="text-lg font-semibold text-green-600">${perfume.sell_price.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">Qty: {perfume.quantity}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={handleProductAdded}
        user={user}
      />
    </>
  )
}

// Inventory Content Component
function InventoryContent({ perfumes, loading, showAddModal, setShowAddModal, handleProductAdded, appUser, user }: {
  perfumes: Perfume[]
  loading: boolean
  showAddModal: boolean
  setShowAddModal: (show: boolean) => void
  handleProductAdded: () => void
  appUser: AppUser | null
  user: any
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Perfume | null>(null)
  
  const filteredPerfumes = perfumes.filter(perfume =>
    perfume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perfume.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perfume.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEditProduct = (product: Perfume) => {
    setEditingProduct(product)
    setShowEditModal(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('perfumes')
        .delete()
        .eq('id', productId)

      if (error) throw error
      
      // Log the deletion
      await AuditLogService.logInventoryAction({
        userId: user.id,
        action: AuditAction.perfumeDeleted,
        perfumeId: productId,
        description: `Product deleted: ${productId}`,
        metadata: { deleted: true }
      })
      
      handleProductAdded() // Reload the products
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  const handleProductUpdated = () => {
    handleProductAdded() // Reload the products
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
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
                {(appUser?.role === 'admin' || appUser?.role === 'manager') && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                )}
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
                        <X className="h-3 w-3 mr-1" />
                        Out of Stock
                      </span>
                    ) : perfume.quantity < 5 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Package className="h-3 w-3 mr-1" />
                        In Stock
                      </span>
                    )}
                  </td>
                  {(appUser?.role === 'admin' || appUser?.role === 'manager') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditProduct(perfume)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(perfume.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
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
                        <X className="h-3 w-3 mr-1" />
                        Out of Stock
                      </span>
                    ) : perfume.quantity < 5 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Package className="h-3 w-3 mr-1" />
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
        user={user}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingProduct(null)
        }}
        onProductUpdated={handleProductUpdated}
        product={editingProduct}
      />
    </>
  )
}

// Orders Content Component
function OrdersContent({ user, appUser }: { user: any, appUser: AppUser | null }) {
  return <OrdersSection user={user} appUser={appUser} />
}

// Users Content Component
function UsersContent({ user }: { user: any, appUser: AppUser | null }) {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      console.log('Loading users from app_users table...')
      
      // Get users from app_users table
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Users query result:', { data, error })

      if (error) {
        console.error('Error loading users:', error)
        setUsers([])
        return
      }

      console.log('Successfully loaded users:', data)
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const syncAuthUsers = async () => {
    try {
      console.log('Testing app_users table access...')
      
      // Test simple query first
      const { data: testData, error: testError } = await supabase
        .from('app_users')
        .select('count')
        .limit(1)
      
      console.log('Test query result:', { testData, testError })
      
      if (testError) {
        console.error('Cannot access app_users table:', testError)
        alert(`Cannot access app_users table: ${testError.message}`)
        return
      }
      
      // Now try to get actual users
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('*')
      
      console.log('Users data:', { usersData, usersError })
      
      if (usersError) {
        console.error('Error getting users:', usersError)
        alert(`Error getting users: ${usersError.message}`)
        return
      }
      
      console.log('Found users:', usersData)
      alert(`Found ${(usersData?.length || 0).toLocaleString()} users in app_users table`)
      
      // Reload the users
      await loadUsers()
      
    } catch (error) {
      console.error('Error syncing users:', error)
      alert(`Error: ${error}`)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      
      // Log audit action
      await AuditLogService.logUserManagementAction({
        userId: user.id,
        action: AuditAction.userRoleChanged,
        targetUserId: userId,
        description: `Changed user role to ${newRole}`,
        metadata: { new_role: newRole }
      })
      
      await loadUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ is_active: !isActive })
        .eq('id', userId)

      if (error) throw error
      
      // Log audit action
      await AuditLogService.logUserManagementAction({
        userId: user.id,
        action: AuditAction.userStatusChanged,
        targetUserId: userId,
        description: `${isActive ? 'Deactivated' : 'Activated'} user`,
        metadata: { is_active: !isActive }
      })
      
      await loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-500">Manage system users and their roles</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              {filteredUsers.length.toLocaleString()} of {users.length.toLocaleString()} users
            </div>
            <button
              onClick={syncAuthUsers}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
            >
              <Users className="h-4 w-4 mr-2" />
              Sync Users
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">System Users</h3>
          </div>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{userItem.full_name || 'No Name'}</div>
                      <div className="text-sm text-gray-500">{userItem.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={userItem.role}
                      onChange={(e) => handleUpdateUserRole(userItem.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={userItem.id === user?.id} // Can't change own role
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleUserStatus(userItem.id, userItem.is_active)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        userItem.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                      disabled={userItem.id === user?.id} // Can't deactivate self
                    >
                      {userItem.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(userItem.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {userItem.last_login_at ? new Date(userItem.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="text-gray-400">Edit</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden">
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((userItem) => (
              <div key={userItem.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900">{userItem.full_name || 'No Name'}</h4>
                    <p className="text-sm text-gray-500">{userItem.email}</p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => handleToggleUserStatus(userItem.id, userItem.is_active)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        userItem.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                      disabled={userItem.id === user?.id}
                    >
                      {userItem.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <select
                      value={userItem.role}
                      onChange={(e) => handleUpdateUserRole(userItem.id, e.target.value)}
                      className="ml-2 text-sm border border-gray-300 rounded px-2 py-1"
                      disabled={userItem.id === user?.id}
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2">{new Date(userItem.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Last Login:</span>
                    <span>{userItem.last_login_at ? new Date(userItem.last_login_at).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'No users in the system yet'}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Only users who have signed up through this app will appear here. 
                If you have other users who signed up elsewhere, they need to sign up through this app to be added to the user management system.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal - Coming Soon */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Add User Feature</h3>
              <p className="text-gray-500 mb-6">User creation functionality coming soon...</p>
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Audit Content Component
function AuditContent() {
  return <AuditLogsSection />
}

// Add Product Modal Component
function AddProductModal({ isOpen, onClose, onProductAdded, user }: {
  isOpen: boolean
  onClose: () => void
  onProductAdded: () => void
  user: any
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    costPrice: '',
    sellPrice: '',
    storePrice: '',
    quantity: '',
    size: '',
    notes: '',
    description: '',
    expiryDate: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.name || !formData.brand || !formData.category) {
        throw new Error('Please fill in all required fields')
      }

      if (!formData.costPrice || !formData.sellPrice || !formData.storePrice) {
        throw new Error('Please enter all price fields')
      }

      if (!formData.quantity) {
        throw new Error('Please enter quantity')
      }

      // Validate prices are numbers
      const costPrice = parseFloat(formData.costPrice)
      const sellPrice = parseFloat(formData.sellPrice)
      const storePrice = parseFloat(formData.storePrice)
      const quantity = parseInt(formData.quantity)

      if (isNaN(costPrice) || isNaN(sellPrice) || isNaN(storePrice) || isNaN(quantity)) {
        throw new Error('Please enter valid numbers for prices and quantity')
      }

      if (costPrice < 0 || sellPrice < 0 || storePrice < 0 || quantity < 0) {
        throw new Error('Prices and quantity must be positive numbers')
      }

      if (sellPrice < costPrice) {
        throw new Error('Sell price should be greater than or equal to cost price')
      }

      // Create perfume object
      const perfumeData: Omit<Perfume, 'id' | 'added_date' | 'image_url'> = {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        category: formData.category.trim(),
        cost_price: costPrice,
        sell_price: sellPrice,
        store_price: storePrice,
        quantity: quantity,
        size: formData.size.trim(),
        notes: formData.notes.trim(),
        expiry_date: formData.expiryDate || undefined,
        description: formData.description.trim(),
      }

      // Insert into database
      const { data: insertedData, error: insertError } = await supabase
        .from('perfumes')
        .insert([perfumeData])
        .select()

      if (insertError) throw insertError

      // Log audit action
      if (insertedData && insertedData.length > 0) {
        await AuditLogService.logInventoryAction({
          userId: user.id,
          action: AuditAction.perfumeAdded,
          perfumeId: insertedData[0].id,
          description: `Added new perfume: ${perfumeData.name} by ${perfumeData.brand}`,
          metadata: {
            perfume_name: perfumeData.name,
            perfume_brand: perfumeData.brand,
            quantity: perfumeData.quantity,
            cost_price: perfumeData.cost_price,
            sell_price: perfumeData.sell_price,
            store_price: perfumeData.store_price,
          }
        })
      }

      // Reset form and close modal
      setFormData({
        name: '',
        brand: '',
        category: '',
        costPrice: '',
        sellPrice: '',
        storePrice: '',
        quantity: '',
        size: '',
        notes: '',
        description: '',
        expiryDate: '',
      })

      onProductAdded()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding the product')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add New Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter brand name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                <option value="Perfume">Perfume</option>
                <option value="Cologne">Cologne</option>
                <option value="Body Spray">Body Spray</option>
                <option value="Essential Oil">Essential Oil</option>
                <option value="Incense">Incense</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 100ml, 50ml"
              />
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-4">Pricing Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">What you paid for it</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sell Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="sellPrice"
                    value={formData.sellPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">What you sell it for</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="storePrice"
                    value={formData.storePrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Retail price from store</p>
              </div>
            </div>
          </div>

          {/* Quantity and Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description and Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Product description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
