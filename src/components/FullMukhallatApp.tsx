import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AuditLogsSection } from './AuditLogsSection'
import { OrdersSection } from './OrdersSection'
import { ExpensesSection } from './ExpensesSection'
import { DatabaseTest } from './DatabaseTest'
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
  Menu,
  X as CloseIcon,
  BarChart3,
  FileText,
  CreditCard,
  Settings,
  Users,
  Bell,
  Database,
  Activity,
  Receipt,
  Wallet,
  TrendingDown,
  Calendar,
  Filter
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

interface Order {
  id: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  total_amount: number
  payment_method: 'cash' | 'card' | 'bank_transfer'
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  created_by: string
  closed_by?: string
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  created_by: string
  notes?: string
}

interface AuditLog {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id: string
  old_values?: any
  new_values?: any
  created_at: string
  ip_address?: string
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header 
          user={user} 
          appUser={appUser} 
          onSignOut={handleSignOut}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
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
        lg:translate-x-0 lg:static lg:inset-0
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
  user, 
  appUser, 
  onSignOut, 
  onMenuClick 
}: {
  user: any
  appUser: AppUser | null
  onSignOut: () => void
  onMenuClick: () => void
}) {
  return (
    <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-600 hover:text-gray-900 mr-4"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          {appUser?.full_name || appUser?.email}
        </h1>
        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {appUser?.role || 'No Role'}
        </span>
        {/* Debug info */}
        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
          Debug: {appUser ? 'User Found' : 'No User'}
        </span>
      </div>
      
      <button
        onClick={onSignOut}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <LogOut className="h-4 w-4 mr-1" />
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
      return <DashboardSection user={user} appUser={appUser} />
    case 'inventory':
      return <InventorySection user={user} appUser={appUser} />
    case 'orders':
      return <OrdersSection user={user} appUser={appUser} />
    case 'sales':
      return <SalesSection user={user} appUser={appUser} />
    case 'expenses':
      return <ExpensesSection user={user} appUser={appUser} />
    case 'reports':
      return <ReportsSection user={user} appUser={appUser} />
    case 'audit-logs':
      return <AuditLogsSection user={user} appUser={appUser} />
    case 'users':
      return <UsersSection user={user} appUser={appUser} />
    case 'notifications':
      return <NotificationsSection user={user} appUser={appUser} />
    case 'settings':
      return <SettingsSection user={user} appUser={appUser} />
    default:
      return <DashboardSection user={user} appUser={appUser} />
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
function DashboardSection({ user, appUser }: { user: any, appUser: AppUser | null }) {
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

function InventorySection({ user, appUser }: { user: any, appUser: AppUser | null }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Inventory Management</h2>
      <p className="text-gray-600">Inventory management section - coming soon!</p>
    </div>
  )
}

// OrdersSection is now imported from separate file

function SalesSection({ user, appUser }: { user: any, appUser: AppUser | null }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Sales</h2>
      <p className="text-gray-600">Daily sales section - coming soon!</p>
    </div>
  )
}

// ExpensesSection is now imported from separate file

function ReportsSection({ user, appUser }: { user: any, appUser: AppUser | null }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h2>
      <p className="text-gray-600">Reports section - coming soon!</p>
    </div>
  )
}

// AuditLogsSection is now imported from separate file

function UsersSection({ user, appUser }: { user: any, appUser: AppUser | null }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
      <p className="text-gray-600">User management section - coming soon!</p>
    </div>
  )
}

function NotificationsSection({ user, appUser }: { user: any, appUser: AppUser | null }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>
      <p className="text-gray-600">Notifications section - coming soon!</p>
    </div>
  )
}

function SettingsSection({ user, appUser }: { user: any, appUser: AppUser | null }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h2>
      <p className="text-gray-600">Settings section - coming soon!</p>
    </div>
  )
}
