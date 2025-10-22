import React, { useState, useEffect } from 'react'
import { X, Save, Plus, User, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AuditLogService, AuditAction } from '../services/auditLogService'

// Types
interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  current_balance: number
}

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onTransactionAdded: () => void
  user: any
  selectedCustomer?: Customer | null
}

export function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onTransactionAdded, 
  user,
  selectedCustomer 
}: AddTransactionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    customerId: '',
    transactionType: 'debit',
    amount: '',
    description: '',
    paymentMethod: '',
    notes: '',
    // New customer form
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadCustomers()
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customerId: selectedCustomer.id
        }))
      }
    }
  }, [isOpen, selectedCustomer])

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
      let customerId = formData.customerId

      // If creating a new customer
      if (showCustomerForm) {
        if (!formData.customerName.trim()) {
          throw new Error('Customer name is required')
        }

        // Check for duplicate customer
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('name', formData.customerName.trim())
          .eq('is_active', true)
          .single()

        if (existingCustomer) {
          throw new Error('Customer with this name already exists')
        }

        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            name: formData.customerName.trim(),
            email: formData.customerEmail.trim() || null,
            phone: formData.customerPhone.trim() || null,
            address: formData.customerAddress.trim() || null,
            created_by: user.id
          }])
          .select()
          .single()

        if (customerError) throw customerError
        customerId = newCustomer.id
      }

      // Validate transaction data
      if (!customerId) {
        throw new Error('Please select a customer')
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid amount')
      }

      if (!formData.description.trim()) {
        throw new Error('Please enter a description')
      }

      // Create transaction
      const { data: newTransaction, error: transactionError } = await supabase
        .from('customer_debits')
        .insert([{
          customer_id: customerId,
          transaction_type: formData.transactionType,
          amount: parseFloat(formData.amount),
          description: formData.description.trim(),
          payment_method: formData.paymentMethod.trim() || null,
          notes: formData.notes.trim() || null,
          status: 'pending',
          created_by: user.id
        }])
        .select()
        .single()

      if (transactionError) throw transactionError

      // Log the transaction creation
      if (newTransaction) {
        await AuditLogService.logCustomerDebitAction({
          userId: user.id,
          action: AuditAction.customerDebitCreated,
          transactionId: newTransaction.id,
          customerId: customerId,
          description: `Customer debit transaction created by ${user.full_name || user.email}`,
          newValues: newTransaction,
          metadata: {
            amount: newTransaction.amount,
            status: 'pending',
            transaction_type: newTransaction.transaction_type,
            payment_method: newTransaction.payment_method,
            description: newTransaction.description,
            created_by: user.full_name || user.email
          }
        })
      }

      // Reset form
      setFormData({
        customerId: '',
        transactionType: 'debit',
        amount: '',
        description: '',
        paymentMethod: '',
        notes: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: ''
      })
      setShowCustomerForm(false)
      setSearchTerm('')

      onTransactionAdded()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the transaction')
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add Transaction</h2>
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

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer *
            </label>
            
            {!showCustomerForm ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, customerId: customer.id }))}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        formData.customerId === customer.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">
                        {customer.email && `${customer.email} • `}
                        Balance: ${customer.current_balance.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowCustomerForm(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Customer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">New Customer Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Customer full name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="customerEmail"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="customer@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        name="customerAddress"
                        value={formData.customerAddress}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123 Main St, City, State"
                      />
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowCustomerForm(false)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  ← Back to customer selection
                </button>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type *
              </label>
              <select
                name="transactionType"
                value={formData.transactionType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="debit">Debit (Customer owes money)</option>
                <option value="payment">Payment (Customer paying back)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Perfume purchase, Partial payment"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select payment method (if applicable)</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes or comments..."
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Record Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
