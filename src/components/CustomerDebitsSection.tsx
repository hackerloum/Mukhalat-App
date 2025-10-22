import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  RefreshCw
} from 'lucide-react'
import { AddTransactionModal } from './AddTransactionModal'
import { supabase } from '../lib/supabase'
import { AuditLogService, AuditAction } from '../services/auditLogService'

// Types
interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  created_at: string
  is_active: boolean
  created_by: string
  current_balance: number
  total_transactions: number
  last_transaction_date?: string
}

interface CustomerDebit {
  id: string
  customer_id: string
  transaction_type: 'debit' | 'payment'
  amount: number
  description: string
  status: 'pending' | 'approved' | 'rejected'
  payment_method?: string
  notes?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
  created_by: string
  approved_by?: string
  approved_at?: string
  customer?: Customer
  created_by_name?: string
  approved_by_name?: string
}

interface Notification {
  id: string
  user_id: string
  type_id: string
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
  read_at?: string
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

interface CustomerDebitsSectionProps {
  user: any
  appUser: AppUser | null
}

// Transactions Table Component
function TransactionsTable({ 
  transactions, 
  onViewTransaction, 
  userRole 
}: { 
  transactions: CustomerDebit[]
  onViewTransaction: (transaction: CustomerDebit) => void
  userRole?: string
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'debit':
        return 'text-red-600'
      case 'payment':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
        <p className="text-gray-500">Start by adding your first customer transaction</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Type
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Description
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Date
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50">
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {transaction.customer?.name || 'Unknown Customer'}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    Balance: ${transaction.customer?.current_balance?.toFixed(2) || '0.00'}
                  </div>
                  {/* Show type on mobile */}
                  <div className="sm:hidden text-xs text-gray-500 mt-1">
                    <span className={`font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                      {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                <span className={`text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                  {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                </span>
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${transaction.amount.toFixed(2)}
              </td>
              <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                <div className="text-sm text-gray-900">{transaction.description}</div>
                {transaction.notes && (
                  <div className="text-sm text-gray-500">{transaction.notes}</div>
                )}
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                  {getStatusIcon(transaction.status)}
                  <span className="ml-1">{transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
                </span>
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                {new Date(transaction.created_at).toLocaleDateString()}
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => onViewTransaction(transaction)}
                    className="text-blue-600 hover:text-blue-900 flex items-center text-xs sm:text-sm"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    View
                  </button>
                  {(userRole === 'manager' || userRole === 'admin') && transaction.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          // Handle approve
                          console.log('Approve transaction:', transaction.id)
                        }}
                        className="text-green-600 hover:text-green-900 flex items-center text-xs sm:text-sm"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          // Handle reject
                          console.log('Reject transaction:', transaction.id)
                        }}
                        className="text-red-600 hover:text-red-900 flex items-center text-xs sm:text-sm"
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Customers Table Component
function CustomersTable({ 
  customers, 
  onViewCustomer 
}: { 
  customers: Customer[]
  onViewCustomer: (customer: Customer) => void
}) {
  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
        <p className="text-gray-500">Start by adding your first customer</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Contact
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Balance
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Transactions
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
              Last Activity
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  {customer.address && (
                    <div className="text-xs sm:text-sm text-gray-500">{customer.address}</div>
                  )}
                  {/* Show contact on mobile */}
                  <div className="sm:hidden text-xs text-gray-500 mt-1">
                    <div>{customer.email || 'No email'}</div>
                    <div>{customer.phone || 'No phone'}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                <div className="text-sm text-gray-900">{customer.email || 'No email'}</div>
                <div className="text-sm text-gray-500">{customer.phone || 'No phone'}</div>
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                <span className={`text-sm font-medium ${
                  customer.current_balance > 0 ? 'text-red-600' : 
                  customer.current_balance < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  ${customer.current_balance.toFixed(2)}
                </span>
                <div className="text-xs text-gray-500">
                  {customer.current_balance > 0 ? 'Owes' : 
                   customer.current_balance < 0 ? 'Credit' : 'Settled'}
                </div>
                {/* Show transactions count on mobile */}
                <div className="sm:hidden text-xs text-gray-500 mt-1">
                  {customer.total_transactions} transactions
                </div>
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                {customer.total_transactions}
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                {customer.last_transaction_date 
                  ? new Date(customer.last_transaction_date).toLocaleDateString()
                  : 'Never'
                }
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onViewCustomer(customer)}
                  className="text-blue-600 hover:text-blue-900 flex items-center text-xs sm:text-sm"
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Approvals Table Component
function ApprovalsTable({ 
  transactions, 
  onApprove, 
  onReject
}: { 
  transactions: CustomerDebit[]
  onApprove: (transactionId: string) => void
  onReject: (transactionId: string, reason: string) => void
}) {
  const [processingTransaction, setProcessingTransaction] = useState<string | null>(null)

  const handleApprove = async (transactionId: string) => {
    setProcessingTransaction(transactionId)
    try {
      await onApprove(transactionId)
    } finally {
      setProcessingTransaction(null)
    }
  }

  const handleReject = async (transactionId: string) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required')
      return
    }
    
    setProcessingTransaction(transactionId)
    try {
      await onReject(transactionId, reason.trim())
    } finally {
      setProcessingTransaction(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
        <p className="text-gray-500">All transactions are up to date</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                  {transaction.customer?.name || 'Unknown Customer'}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    transaction.transaction_type === 'debit' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                  </span>
                  <span className="text-base sm:text-lg font-semibold text-gray-900">
                    ${transaction.amount.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-2 space-y-1">
                <p><strong>Description:</strong> {transaction.description}</p>
                {transaction.notes && <p><strong>Notes:</strong> {transaction.notes}</p>}
                {transaction.payment_method && <p><strong>Payment Method:</strong> {transaction.payment_method}</p>}
              </div>
              
              <div className="text-xs text-gray-500">
                Created by {transaction.created_by_name || 'Unknown'} on {new Date(transaction.created_at).toLocaleString()}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:ml-4">
              <button
                onClick={() => handleApprove(transaction.id)}
                disabled={processingTransaction === transaction.id}
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {processingTransaction === transaction.id ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Approve
                  </>
                )}
              </button>
              <button
                onClick={() => handleReject(transaction.id)}
                disabled={processingTransaction === transaction.id}
                className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {processingTransaction === transaction.id ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Reject
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Placeholder components for modals
function CustomerListModal({ isOpen, onClose }: any) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Select Customer</h2>
          <p className="text-sm sm:text-base text-gray-600">Customer list modal will be implemented next...</p>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApprovalModal({ isOpen, onClose }: any) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Transaction Details</h2>
          <p className="text-sm sm:text-base text-gray-600">Approval modal will be implemented next...</p>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CustomerDebitsSection({ user, appUser }: CustomerDebitsSectionProps) {
  const [activeTab, setActiveTab] = useState<'transactions' | 'customers' | 'approvals'>('transactions')
  const [transactions, setTransactions] = useState<CustomerDebit[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<CustomerDebit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [renderError, setRenderError] = useState<string | null>(null)

  useEffect(() => {
    try {
      console.log('CustomerDebitsSection mounted with user:', user, 'appUser:', appUser)
      loadData()
    } catch (err: any) {
      console.error('Error in CustomerDebitsSection useEffect:', err)
      setError(err.message || 'Failed to load data')
    }
  }, [])

  // Error boundary for render errors
  if (renderError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-800">
            <h3 className="text-lg font-semibold mb-2">Rendering Error</h3>
            <p className="mb-4">{renderError}</p>
            <button
              onClick={() => {
                setRenderError(null)
                window.location.reload()
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        loadTransactions(),
        loadCustomers(),
        loadNotifications()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      console.log('Loading transactions...')
      const { data, error } = await supabase
        .from('customer_debits')
        .select(`
          *,
          customer:customers(*),
          created_by_user:app_users!created_by(id, full_name),
          approved_by_user:app_users!approved_by(id, full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading transactions:', error)
        throw error
      }
      
      // Transform the data to extract full_name from nested objects
      const transformedData = data?.map(transaction => ({
        ...transaction,
        created_by_name: transaction.created_by_user?.full_name || 'Unknown',
        approved_by_name: transaction.approved_by_user?.full_name || 'Unknown'
      })) || []
      
      console.log('Loaded transactions:', transformedData)
      setTransactions(transformedData)
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_summary')
        .select('*')
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const handleTransactionAdded = () => {
    loadData()
  }

  const handleApproveTransaction = async (transactionId: string) => {
    try {
      console.log('Approving transaction:', transactionId, 'by user:', user?.id)
      
      // Validate user
      if (!user || !user.id) {
        throw new Error('User not authenticated. Please sign in again.')
      }
      
      console.log('Updating transaction status to approved...')
      
      // Get the transaction details for audit logging
      const { data: transactionData } = await supabase
        .from('customer_debits')
        .select('*')
        .eq('id', transactionId)
        .single()

      const { error } = await supabase
        .from('customer_debits')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', transactionId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // Log the approval action
      if (transactionData) {
        await AuditLogService.logCustomerDebitAction({
          userId: user.id,
          action: AuditAction.customerDebitApproved,
          transactionId: transactionId,
          customerId: transactionData.customer_id,
          description: `Customer debit transaction approved by ${user.full_name || user.email}`,
          oldValues: transactionData,
          newValues: {
            ...transactionData,
            status: 'approved',
            approved_by: user.id,
            approved_at: new Date().toISOString()
          },
          metadata: {
            amount: transactionData.amount,
            status: 'approved',
            transaction_type: transactionData.transaction_type,
            payment_method: transactionData.payment_method,
            approved_by: user.full_name || user.email
          }
        })
      }
      
      console.log('Transaction approved successfully')
      alert('Transaction approved successfully!')
      
      // Reload data to reflect changes
      await loadData()
    } catch (error: any) {
      console.error('Error approving transaction:', error)
      alert(`Failed to approve transaction: ${error.message || 'Unknown error'}`)
    }
  }

  const handleRejectTransaction = async (transactionId: string, reason: string) => {
    try {
      console.log('Rejecting transaction:', transactionId, 'by user:', user?.id, 'reason:', reason)
      
      // Validate user
      if (!user || !user.id) {
        throw new Error('User not authenticated. Please sign in again.')
      }
      
      // Get the transaction details for audit logging
      const { data: transactionData } = await supabase
        .from('customer_debits')
        .select('*')
        .eq('id', transactionId)
        .single()

      const { error } = await supabase
        .from('customer_debits')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', transactionId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // Log the rejection action
      if (transactionData) {
        await AuditLogService.logCustomerDebitAction({
          userId: user.id,
          action: AuditAction.customerDebitRejected,
          transactionId: transactionId,
          customerId: transactionData.customer_id,
          description: `Customer debit transaction rejected by ${user.full_name || user.email}. Reason: ${reason}`,
          oldValues: transactionData,
          newValues: {
            ...transactionData,
            status: 'rejected',
            rejection_reason: reason,
            approved_by: user.id,
            approved_at: new Date().toISOString()
          },
          metadata: {
            amount: transactionData.amount,
            status: 'rejected',
            transaction_type: transactionData.transaction_type,
            payment_method: transactionData.payment_method,
            rejection_reason: reason,
            rejected_by: user.full_name || user.email
          }
        })
      }
      
      console.log('Transaction rejected successfully')
      alert('Transaction rejected successfully!')
      loadData()
    } catch (error: any) {
      console.error('Error rejecting transaction:', error)
      alert(`Failed to reject transaction: ${error.message || 'Unknown error'}`)
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  )

  const pendingTransactions = transactions.filter(t => t.status === 'pending')
  const totalOutstanding = customers.reduce((sum, customer) => sum + Math.max(0, customer.current_balance), 0)

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-800">
            <h3 className="text-lg font-semibold mb-2">Error Loading Customer Debits</h3>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null)
                loadData()
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  try {
    return (
      <>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Debits</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage customer transactions and payments</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Notification Badge */}
              {notifications.length > 0 && (
                <div className="relative">
                  <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center absolute -top-2 -right-2">
                    {notifications.length}
                  </div>
                  <button
                    onClick={() => setActiveTab('approvals')}
                    className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg hover:bg-orange-200 flex items-center justify-center w-full sm:w-auto"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="text-sm">{pendingTransactions.length} Pending</span>
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-sm">Add Transaction</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Outstanding</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">${totalOutstanding.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending Approvals</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{pendingTransactions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Customers</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 sm:space-x-8 px-2 sm:px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'transactions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'customers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Customers
              </button>
              {(appUser?.role === 'manager' || appUser?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center ${
                    activeTab === 'approvals'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Approvals
                  {pendingTransactions.length > 0 && (
                    <span className="ml-1 sm:ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 sm:px-2 py-0.5">
                      {pendingTransactions.length}
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers or transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {activeTab === 'transactions' && (
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="flex-1 sm:flex-none px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  
                  <button
                    onClick={loadData}
                    className="text-gray-600 hover:text-gray-900 p-2"
                  >
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'transactions' && (
              <TransactionsTable 
                transactions={filteredTransactions}
                onViewTransaction={(transaction) => {
                  setSelectedTransaction(transaction)
                  setShowApprovalModal(true)
                }}
                userRole={appUser?.role}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersTable 
                customers={filteredCustomers}
                onViewCustomer={(customer) => {
                  // Show customer details modal
                  console.log('View customer:', customer)
                }}
              />
            )}

            {activeTab === 'approvals' && (
              <ApprovalsTable 
                transactions={pendingTransactions}
                onApprove={handleApproveTransaction}
                onReject={(transactionId, reason) => handleRejectTransaction(transactionId, reason)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddTransactionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onTransactionAdded={handleTransactionAdded}
          user={user}
        />
      )}

      {showCustomerModal && (
        <CustomerListModal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          customers={customers}
          onSelectCustomer={() => {
            setShowCustomerModal(false)
            setShowAddModal(true)
            // Pass selected customer to AddTransactionModal
          }}
        />
      )}

      {showApprovalModal && selectedTransaction && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false)
            setSelectedTransaction(null)
          }}
          transaction={selectedTransaction}
          onApprove={handleApproveTransaction}
          onReject={handleRejectTransaction}
        />
      )}
    </>
  )
  } catch (renderErr: any) {
    console.error('Error rendering CustomerDebitsSection:', renderErr)
    setRenderError(renderErr.message || 'Rendering error occurred')
    return null
  }
}
