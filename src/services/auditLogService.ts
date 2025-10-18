// Audit logging service for web application
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://prsxpmhfbdhekrkjiuti.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByc3hwbWhmYmRoZWtya2ppdXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTMwNDYsImV4cCI6MjA3NDI4OTA0Nn0.HiPS3ibFT3Zv2SBTVduWngl0Y4rbSyw91XW8cQL3N6w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
}
