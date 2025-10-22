import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AuditLogsSection } from './AuditLogsSection'
import { OrdersSection } from './OrdersSection'
import { ExpensesSection } from './ExpensesSection'
import { DatabaseTest } from './DatabaseTest'
import { AddProductModal } from './AddProductModal'
import { EditProductModal } from './EditProductModal'
import { 
  ShoppingBag, 
  Package, 
  DollarSign, 
  Plus, 
  Search,
  LogOut,
  Eye,
  EyeOff,
  Menu,
  X as CloseIcon,
  BarChart3,
  FileText,
  Settings,
  Users,
  Bell,
  Activity,
  Receipt,
  TrendingDown,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

// Supabase client
const supabaseUrl = 'https://prsxpmhfbdhekrkjiuti.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByc3hwbWhmYmRoZWtya2ppdXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTMwNDYsImV4cCI6MjA3NDI4OTA0Nn0.HiPS3ibFT3Zv2SBTVduWngl0Y4rbSyw91XW8cQL3N6w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

type ActiveSection = 
  | 'dashboard' 
  | 'inventory' 
  | 'orders' 
  | 'sales' 
  | 'expenses' 
  | 'reports' 
  | 'audit-logs' 
  | 'users' 
  | 'settings' 
  | 'notifications'

export function MukhallatApp() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState('Initializing...')
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={appUser?.role}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Header */}
        <Header 
          appUser={appUser} 
          onSignOut={handleSignOut}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <ContentArea 
            activeSection={activeSection}
            user={user}
            appUser={appUser}
          />
        </main>
      </div>
    </div>
  )
}

// Sidebar Component
function Sidebar({ 
  activeSection, 
  setActiveSection, 
  isOpen, 
  onClose, 
  userRole 
}: {
  activeSection: ActiveSection
  setActiveSection: (section: ActiveSection) => void
  isOpen: boolean
  onClose: () => void
  userRole?: string
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'manager', 'staff'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin', 'manager', 'staff'] },
    { id: 'orders', label: 'Orders', icon: Receipt, roles: ['admin', 'manager', 'staff'] },
    { id: 'sales', label: 'Daily Sales', icon: DollarSign, roles: ['admin', 'manager', 'staff'] },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown, roles: ['admin', 'manager'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['admin', 'manager'] },
    { id: 'audit-logs', label: 'Audit Logs', icon: Activity, roles: ['admin', 'manager', 'staff'] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['admin'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'manager', 'staff'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ]

  const filteredItems = menuItems.filter(item => 
    userRole && item.roles.includes(userRole as any)
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">Mukhallat</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id as ActiveSection)
                    onClose()
                  }}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${activeSection === item.id
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}

// Header Component
function Header({ 
  appUser, 
  onSignOut, 
  onMenuClick 
}: {
  appUser: AppUser | null
  onSignOut: () => void
  onMenuClick: () => void
}) {
  return (
    <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-600 hover:text-gray-900 mr-3 flex-shrink-0"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
            {appUser?.full_name || appUser?.email}
          </h1>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          <span className="hidden sm:inline text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {appUser?.role || 'No Role'}
          </span>
        </div>
      </div>
      
      <button
        onClick={onSignOut}
        className="flex items-center text-gray-600 hover:text-gray-900 flex-shrink-0 ml-2"
      >
        <LogOut className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </header>
  )
}

// Content Area Component
function ContentArea({ 
  activeSection, 
  user, 
  appUser 
}: {
  activeSection: ActiveSection
  user: any
  appUser: AppUser | null
}) {
  switch (activeSection) {
    case 'dashboard':
      return <DashboardSection />
    case 'inventory':
      return <InventorySection appUser={appUser} />
    case 'orders':
      return <OrdersSection user={user} appUser={appUser} />
    case 'sales':
      return <SalesSection />
    case 'expenses':
      return <ExpensesSection user={user} appUser={appUser} />
    case 'reports':
      return <ReportsSection />
    case 'audit-logs':
      return <AuditLogsSection />
    case 'users':
      return <UsersSection />
    case 'notifications':
      return <NotificationsSection />
    case 'settings':
      return <SettingsSection />
    default:
      return <DashboardSection />
  }
}

// Auth Screen Component (same as before)
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
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
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
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

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
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
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

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

// Placeholder components for each section
function DashboardSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      
      {/* Database Connection Test */}
      <DatabaseTest />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">$0.00</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Receipt className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">$0.00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InventorySection({ appUser }: { appUser: AppUser | null }) {
  const [perfumes, setPerfumes] = useState<Perfume[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Perfume | null>(null)

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
    } catch (error) {
      console.error('Error loading perfumes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductAdded = () => {
    loadPerfumes()
  }

  const handleProductUpdated = () => {
    loadPerfumes()
  }

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
      loadPerfumes()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

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
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full lg:w-auto">
            <div className="w-full lg:w-80">
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
            <h3 className="text-lg font-semibold text-gray-900">Product Inventory</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sell Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {(appUser?.role === 'admin' || appUser?.role === 'manager') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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

// OrdersSection is now imported from separate file

function SalesSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Sales</h2>
      <p className="text-gray-600">Daily sales section - coming soon!</p>
    </div>
  )
}

// ExpensesSection is now imported from separate file

function ReportsSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h2>
      <p className="text-gray-600">Reports section - coming soon!</p>
    </div>
  )
}

// AuditLogsSection is now imported from separate file

function UsersSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
      <p className="text-gray-600">User management section - coming soon!</p>
    </div>
  )
}

function NotificationsSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>
      <p className="text-gray-600">Notifications section - coming soon!</p>
    </div>
  )
}

function SettingsSection() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h2>
      <p className="text-gray-600">Settings section - coming soon!</p>
    </div>
  )
}
