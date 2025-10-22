// Audit logging service for web application
import { supabase } from '../lib/supabase'

export enum AuditAction {
  // User Management
  userCreated = 'userCreated',
  userUpdated = 'userUpdated',
  userDeleted = 'userDeleted',
  userRoleChanged = 'userRoleChanged',
  userStatusChanged = 'userStatusChanged',
  
  // Order Management
  orderCreated = 'orderCreated',
  orderConfirmed = 'orderConfirmed',
  orderCancelled = 'orderCancelled',
  orderStatusChanged = 'orderStatusChanged',
  
  // Inventory Management
  perfumeAdded = 'perfumeAdded',
  perfumeUpdated = 'perfumeUpdated',
  perfumeDeleted = 'perfumeDeleted',
  stockAdjusted = 'stockAdjusted',
  
  // System Events
  login = 'login',
  logout = 'logout',
  systemSettingsChanged = 'systemSettingsChanged',
  
  // Financial
  expenseAdded = 'expenseAdded',
  expenseUpdated = 'expenseUpdated',
  expenseDeleted = 'expenseDeleted',
  dailySalesClosed = 'dailySalesClosed',
  
  // Bank Transactions
  bankDeposit = 'bankDeposit',
  bankWithdrawal = 'bankWithdrawal',
  bankTransactionUpdated = 'bankTransactionUpdated',
  bankTransactionDeleted = 'bankTransactionDeleted',
  
  // Customer Debit Transactions
  customerDebitCreated = 'customerDebitCreated',
  customerDebitUpdated = 'customerDebitUpdated',
  customerDebitDeleted = 'customerDebitDeleted',
  customerDebitApproved = 'customerDebitApproved',
  customerDebitRejected = 'customerDebitRejected',
}

export interface AuditLog {
  id: string
  action: AuditAction
  description: string
  user_id: string
  target_id?: string
  target_type?: string
  metadata?: any
  timestamp: string
  ip_address?: string
  user_agent?: string
}

export interface CustomerDebitAuditLog {
  id: string
  action: AuditAction
  description: string
  user_id: string
  target_id?: string
  target_type?: string
  transaction_id?: string
  customer_id?: string
  old_values?: any
  new_values?: any
  metadata?: any
  timestamp: string
  ip_address?: string
  user_agent?: string
}

export interface CombinedAuditLog extends AuditLog {
  log_type: 'system' | 'customer_debit'
  transaction_id?: string
  customer_id?: string
  customer_name?: string
  user_name?: string
  user_email?: string
  user_role?: string
  old_values?: any
  new_values?: any
}

export class AuditLogService {
  // Create a new audit log entry
  static async logAction(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const logEntry: AuditLog = {
        ...auditLog,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      }

      await supabase
        .from('audit_logs')
        .insert(logEntry)
    } catch (error) {
      console.error('Error logging audit action:', error)
      // Don't throw error - audit logging shouldn't break the main functionality
    }
  }

  // Helper method to create audit log entries for common actions
  static async logUserAction({
    userId,
    action,
    description,
    targetId,
    targetType,
    metadata,
  }: {
    userId: string
    action: AuditAction
    description: string
    targetId?: string
    targetType?: string
    metadata?: any
  }): Promise<void> {
    await this.logAction({
      action,
      description,
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
      metadata,
    })
  }

  // Convenience methods for common actions
  static async logOrderAction({
    userId,
    action,
    orderId,
    description,
    metadata,
  }: {
    userId: string
    action: AuditAction
    orderId: string
    description?: string
    metadata?: any
  }): Promise<void> {
    await this.logUserAction({
      userId,
      action,
      description: description || `Order ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      targetId: orderId,
      targetType: 'order',
      metadata,
    })
  }

  static async logUserManagementAction({
    userId,
    action,
    targetUserId,
    description,
    metadata,
  }: {
    userId: string
    action: AuditAction
    targetUserId: string
    description?: string
    metadata?: any
  }): Promise<void> {
    await this.logUserAction({
      userId,
      action,
      description: description || `User ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      targetId: targetUserId,
      targetType: 'user',
      metadata,
    })
  }

  static async logInventoryAction({
    userId,
    action,
    perfumeId,
    description,
    metadata,
  }: {
    userId: string
    action: AuditAction
    perfumeId: string
    description?: string
    metadata?: any
  }): Promise<void> {
    await this.logUserAction({
      userId,
      action,
      description: description || `Perfume ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      targetId: perfumeId,
      targetType: 'perfume',
      metadata,
    })
  }

  // Customer Debit Audit Logging Methods
  static async logCustomerDebitAction({
    userId,
    action,
    transactionId,
    customerId,
    description,
    oldValues,
    newValues,
    metadata,
  }: {
    userId: string
    action: AuditAction
    transactionId: string
    customerId?: string
    description?: string
    oldValues?: any
    newValues?: any
    metadata?: any
  }): Promise<void> {
    try {
      const logEntry: CustomerDebitAuditLog = {
        id: Date.now().toString(),
        action,
        description: description || `Customer debit ${action.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
        user_id: userId,
        target_id: transactionId,
        target_type: 'customer_debit',
        transaction_id: transactionId,
        customer_id: customerId,
        old_values: oldValues,
        new_values: newValues,
        metadata,
        timestamp: new Date().toISOString(),
      }

      await supabase
        .from('customer_debit_audit_logs')
        .insert(logEntry)
    } catch (error) {
      console.error('Error logging customer debit audit action:', error)
      // Don't throw error - audit logging shouldn't break the main functionality
    }
  }

  // Get combined audit logs (system + customer debit)
  static async getCombinedAuditLogs(limit: number = 100): Promise<CombinedAuditLog[]> {
    try {
      // Load both types of audit logs
      const [systemLogsResult, customerDebitLogsResult] = await Promise.all([
        supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(limit),
        supabase
          .from('customer_debit_audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(limit)
      ])

      if (systemLogsResult.error) console.error('Error loading system logs:', systemLogsResult.error)
      if (customerDebitLogsResult.error) console.error('Error loading customer debit logs:', customerDebitLogsResult.error)

      const systemLogs = systemLogsResult.data || []
      const customerDebitLogs = customerDebitLogsResult.data || []
      
      // Get all unique user IDs from both log types
      const allUserIds = [...new Set([
        ...systemLogs.map(log => log.user_id),
        ...customerDebitLogs.map(log => log.user_id)
      ])]
      
      // Get all unique customer IDs from customer debit logs
      const customerIds = [...new Set(customerDebitLogs.map(log => log.customer_id).filter(Boolean))]
      
      // Fetch users and customers
      const [usersResult, customersResult] = await Promise.all([
        supabase
          .from('app_users')
          .select('id, full_name, email, role')
          .in('id', allUserIds),
        supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIds)
      ])

      // Create lookup maps
      const userMap = new Map(usersResult.data?.map(user => [user.id, user]) || [])
      const customerMap = new Map(customersResult.data?.map(customer => [customer.id, customer]) || [])
      
      // Transform system logs
      const transformedSystemLogs = systemLogs.map(log => {
        const user = userMap.get(log.user_id)
        return {
          ...log,
          log_type: 'system' as const,
          user_name: user?.full_name || 'Unknown User',
          user_email: user?.email || 'Unknown',
          user_role: user?.role || 'Unknown',
          customer_name: null,
          transaction_id: undefined,
          customer_id: undefined,
          target_id: log.target_id,
          target_type: log.target_type
        }
      })
      
      // Transform customer debit logs
      const transformedCustomerDebitLogs = customerDebitLogs.map(log => {
        const user = userMap.get(log.user_id)
        const customer = customerMap.get(log.customer_id)
        return {
          ...log,
          log_type: 'customer_debit' as const,
          user_name: user?.full_name || 'Unknown User',
          user_email: user?.email || 'Unknown',
          user_role: user?.role || 'Unknown',
          customer_name: customer?.name || null,
          target_id: log.transaction_id,
          target_type: 'customer_debit'
        }
      })

      // Combine and sort by timestamp
      const allLogs = [...transformedSystemLogs, ...transformedCustomerDebitLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)

      return allLogs
    } catch (error) {
      console.error('Error fetching combined audit logs:', error)
      return []
    }
  }

  // Get audit logs by date range
  static async getAuditLogsByDateRange(
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<CombinedAuditLog[]> {
    try {
      // Load both types of audit logs within date range
      const [systemLogsResult, customerDebitLogsResult] = await Promise.all([
        supabase
          .from('audit_logs')
          .select('*')
          .gte('timestamp', startDate)
          .lte('timestamp', endDate)
          .order('timestamp', { ascending: false })
          .limit(limit),
        supabase
          .from('customer_debit_audit_logs')
          .select('*')
          .gte('timestamp', startDate)
          .lte('timestamp', endDate)
          .order('timestamp', { ascending: false })
          .limit(limit)
      ])

      if (systemLogsResult.error) console.error('Error loading system logs:', systemLogsResult.error)
      if (customerDebitLogsResult.error) console.error('Error loading customer debit logs:', customerDebitLogsResult.error)

      const systemLogs = systemLogsResult.data || []
      const customerDebitLogs = customerDebitLogsResult.data || []
      
      // Get all unique user IDs from both log types
      const allUserIds = [...new Set([
        ...systemLogs.map(log => log.user_id),
        ...customerDebitLogs.map(log => log.user_id)
      ])]
      
      // Get all unique customer IDs from customer debit logs
      const customerIds = [...new Set(customerDebitLogs.map(log => log.customer_id).filter(Boolean))]
      
      // Fetch users and customers
      const [usersResult, customersResult] = await Promise.all([
        supabase
          .from('app_users')
          .select('id, full_name, email, role')
          .in('id', allUserIds),
        supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIds)
      ])

      // Create lookup maps
      const userMap = new Map(usersResult.data?.map(user => [user.id, user]) || [])
      const customerMap = new Map(customersResult.data?.map(customer => [customer.id, customer]) || [])
      
      // Transform system logs
      const transformedSystemLogs = systemLogs.map(log => {
        const user = userMap.get(log.user_id)
        return {
          ...log,
          log_type: 'system' as const,
          user_name: user?.full_name || 'Unknown User',
          user_email: user?.email || 'Unknown',
          user_role: user?.role || 'Unknown',
          customer_name: null,
          transaction_id: undefined,
          customer_id: undefined,
          target_id: log.target_id,
          target_type: log.target_type
        }
      })
      
      // Transform customer debit logs
      const transformedCustomerDebitLogs = customerDebitLogs.map(log => {
        const user = userMap.get(log.user_id)
        const customer = customerMap.get(log.customer_id)
        return {
          ...log,
          log_type: 'customer_debit' as const,
          user_name: user?.full_name || 'Unknown User',
          user_email: user?.email || 'Unknown',
          user_role: user?.role || 'Unknown',
          customer_name: customer?.name || null,
          target_id: log.transaction_id,
          target_type: 'customer_debit'
        }
      })

      // Combine and sort by timestamp
      const allLogs = [...transformedSystemLogs, ...transformedCustomerDebitLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)

      return allLogs
    } catch (error) {
      console.error('Error fetching audit logs by date range:', error)
      return []
    }
  }

  // Search audit logs
  static async searchAuditLogs(
    searchTerm: string,
    limit: number = 100
  ): Promise<CombinedAuditLog[]> {
    try {
      // Search both types of audit logs
      const [systemLogsResult, customerDebitLogsResult] = await Promise.all([
        supabase
          .from('audit_logs')
          .select('*')
          .or(`description.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%`)
          .order('timestamp', { ascending: false })
          .limit(limit),
        supabase
          .from('customer_debit_audit_logs')
          .select('*')
          .or(`description.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%`)
          .order('timestamp', { ascending: false })
          .limit(limit)
      ])

      if (systemLogsResult.error) console.error('Error searching system logs:', systemLogsResult.error)
      if (customerDebitLogsResult.error) console.error('Error searching customer debit logs:', customerDebitLogsResult.error)

      const systemLogs = systemLogsResult.data || []
      const customerDebitLogs = customerDebitLogsResult.data || []
      
      // Get all unique user IDs from both log types
      const allUserIds = [...new Set([
        ...systemLogs.map(log => log.user_id),
        ...customerDebitLogs.map(log => log.user_id)
      ])]
      
      // Get all unique customer IDs from customer debit logs
      const customerIds = [...new Set(customerDebitLogs.map(log => log.customer_id).filter(Boolean))]
      
      // Fetch users and customers
      const [usersResult, customersResult] = await Promise.all([
        supabase
          .from('app_users')
          .select('id, full_name, email, role')
          .in('id', allUserIds),
        supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIds)
      ])

      // Create lookup maps
      const userMap = new Map(usersResult.data?.map(user => [user.id, user]) || [])
      const customerMap = new Map(customersResult.data?.map(customer => [customer.id, customer]) || [])
      
      // Transform system logs
      const transformedSystemLogs = systemLogs.map(log => {
        const user = userMap.get(log.user_id)
        return {
          ...log,
          log_type: 'system' as const,
          user_name: user?.full_name || 'Unknown User',
          user_email: user?.email || 'Unknown',
          user_role: user?.role || 'Unknown',
          customer_name: null,
          transaction_id: undefined,
          customer_id: undefined,
          target_id: log.target_id,
          target_type: log.target_type
        }
      })
      
      // Transform customer debit logs
      const transformedCustomerDebitLogs = customerDebitLogs.map(log => {
        const user = userMap.get(log.user_id)
        const customer = customerMap.get(log.customer_id)
        return {
          ...log,
          log_type: 'customer_debit' as const,
          user_name: user?.full_name || 'Unknown User',
          user_email: user?.email || 'Unknown',
          user_role: user?.role || 'Unknown',
          customer_name: customer?.name || null,
          target_id: log.transaction_id,
          target_type: 'customer_debit'
        }
      })

      // Combine and sort by timestamp
      const allLogs = [...transformedSystemLogs, ...transformedCustomerDebitLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)

      return allLogs
    } catch (error) {
      console.error('Error searching audit logs:', error)
      return []
    }
  }
}
