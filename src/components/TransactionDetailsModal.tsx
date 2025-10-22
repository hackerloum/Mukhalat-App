import React, { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Download,
  Copy,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AuditLogService, AuditAction } from '../services/auditLogService'
import { Customer, CustomerDebit } from './CustomerDebitsSection'

interface TransactionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: CustomerDebit | null
  user: any
  appUser: any
  onTransactionUpdated: () => void
}

export function TransactionDetailsModal({ 
  isOpen, 
  onClose, 
  transaction, 
  user, 
  appUser,
  onTransactionUpdated 
}: TransactionDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showEditForm, setShowEditForm] = useState(false)
  const [editData, setEditData] = useState({
    description: '',
    notes: '',
    payment_method: ''
  })

  useEffect(() => {
    if (transaction) {
      setEditData({
        description: transaction.description || '',
        notes: transaction.notes || '',
        payment_method: transaction.payment_method || ''
      })
    }
  }, [transaction])

  if (!isOpen || !transaction) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionTypeColor = (type: string) => {
    return type === 'debit' ? 'text-red-600' : 'text-green-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleSaveEdit = async () => {
    try {
      setLoading(true)
      setError('')

      const { error: updateError } = await supabase
        .from('customer_debits')
        .update({
          description: editData.description,
          notes: editData.notes,
          payment_method: editData.payment_method,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (updateError) throw updateError

      // Log audit action
      await AuditLogService.logCustomerDebitAction({
        userId: user.id,
        action: AuditAction.customerDebitUpdated,
        transactionId: transaction.id,
        customerId: transaction.customer_id,
        description: `Transaction details updated by ${user.full_name || user.email}`,
        oldValues: {
          description: transaction.description,
          notes: transaction.notes,
          payment_method: transaction.payment_method
        },
        newValues: editData,
        metadata: {
          amount: transaction.amount,
          status: transaction.status,
          transaction_type: transaction.transaction_type,
          updated_by: user.full_name || user.email
        }
      })

      setShowEditForm(false)
      onTransactionUpdated()
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditData({
      description: transaction.description || '',
      notes: transaction.notes || '',
      payment_method: transaction.payment_method || ''
    })
    setShowEditForm(false)
    setError('')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const { error: deleteError } = await supabase
        .from('customer_debits')
        .delete()
        .eq('id', transaction.id)

      if (deleteError) throw deleteError

      // Log audit action
      await AuditLogService.logCustomerDebitAction({
        userId: user.id,
        action: AuditAction.customerDebitDeleted,
        transactionId: transaction.id,
        customerId: transaction.customer_id,
        description: `Transaction deleted by ${user.full_name || user.email}`,
        oldValues: transaction,
        metadata: {
          amount: transaction.amount,
          status: transaction.status,
          transaction_type: transaction.transaction_type,
          deleted_by: user.full_name || user.email
        }
      })

      onTransactionUpdated()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to delete transaction')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-2 mr-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
                <p className="text-sm text-gray-500">ID: {transaction.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(transaction.id)}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Copy Transaction ID"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold disabled:opacity-50"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Transaction Info */}
            <div className="space-y-6">
              {/* Transaction Overview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Transaction Overview
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className={`text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className={`text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                      {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span className="ml-1">{transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
                    </span>
                  </div>
                  {transaction.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Method:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {transaction.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Description
                </h4>
                {showEditForm ? (
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    disabled={loading}
                  />
                ) : (
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {transaction.description || 'No description provided'}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Notes
                </h4>
                {showEditForm ? (
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    disabled={loading}
                    placeholder="Add notes..."
                  />
                ) : (
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {transaction.notes || 'No notes provided'}
                  </p>
                )}
              </div>

              {/* Rejection Reason */}
              {transaction.status === 'rejected' && transaction.rejection_reason && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    Rejection Reason
                  </h4>
                  <p className="text-sm text-red-800 bg-red-50 p-3 rounded-lg">
                    {transaction.rejection_reason}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Customer & Timeline */}
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Customer Information
                </h4>
                {transaction.customer ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium text-gray-900">{transaction.customer.name}</span>
                    </div>
                    {transaction.customer.email && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="text-sm text-gray-900 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {transaction.customer.email}
                        </span>
                      </div>
                    )}
                    {transaction.customer.phone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="text-sm text-gray-900 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {transaction.customer.phone}
                        </span>
                      </div>
                    )}
                    {transaction.customer.address && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Address:</span>
                        <span className="text-sm text-gray-900 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {transaction.customer.address}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Balance:</span>
                      <span className={`text-sm font-medium ${transaction.customer.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transaction.customer.current_balance)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Customer information not available</p>
                )}
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Timeline
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                      <Clock className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Transaction Created</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                      <p className="text-xs text-gray-600">by {transaction.created_by_name || 'Unknown User'}</p>
                    </div>
                  </div>

                  {transaction.updated_at !== transaction.created_at && (
                    <div className="flex items-start">
                      <div className="bg-yellow-100 rounded-full p-1 mr-3 mt-0.5">
                        <Edit className="h-3 w-3 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Transaction Updated</p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.updated_at)}</p>
                      </div>
                    </div>
                  )}

                  {transaction.approved_at && (
                    <div className="flex items-start">
                      <div className={`rounded-full p-1 mr-3 mt-0.5 ${transaction.status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {transaction.status === 'approved' ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Transaction {transaction.status === 'approved' ? 'Approved' : 'Rejected'}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.approved_at)}</p>
                        <p className="text-xs text-gray-600">by {transaction.approved_by_name || 'Unknown User'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            {showEditForm ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {(appUser?.role === 'admin' || appUser?.role === 'manager') && transaction.status === 'pending' && (
                  <button
                    onClick={handleEdit}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                )}
                {appUser?.role === 'admin' && (
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                )}
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
