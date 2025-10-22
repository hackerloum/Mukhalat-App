# Audit Logs Database Setup

## Overview
This document provides instructions for setting up the database views and functions needed for the audit logs system to work properly.

## Current Status
✅ You already have the audit logs tables (`audit_logs` and `customer_debit_audit_logs`) with data
❌ Missing database views for the frontend to display the logs

## Required Database Views

### 1. Execute the SQL Script
Run the following SQL commands in your Supabase SQL editor:

```sql
-- 1. Create combined_audit_logs view (corrected for actual table structure)
CREATE OR REPLACE VIEW combined_audit_logs AS
SELECT 
    id,
    action,
    description,
    user_id,
    NULL as target_id,  -- audit_logs table doesn't have target_id
    NULL as target_type,  -- audit_logs table doesn't have target_type
    metadata,
    timestamp,
    ip_address,
    user_agent,
    'system' as log_type,
    NULL as transaction_id,
    NULL as customer_id,
    NULL as old_values,
    NULL as new_values
FROM audit_logs

UNION ALL

SELECT 
    id,
    action,
    description,
    user_id,
    target_id,
    target_type,
    metadata,
    timestamp,
    ip_address,
    user_agent,
    'customer_debit' as log_type,
    transaction_id,
    customer_id,
    old_values,
    new_values
FROM customer_debit_audit_logs

ORDER BY timestamp DESC;

-- 2. Create audit_logs_with_users view
CREATE OR REPLACE VIEW audit_logs_with_users AS
SELECT 
    cal.*,
    au.full_name as user_name,
    au.email as user_email,
    au.role as user_role,
    c.name as customer_name
FROM combined_audit_logs cal
LEFT JOIN app_users au ON cal.user_id = au.id
LEFT JOIN customers c ON cal.customer_id = c.id;

-- 3. Grant permissions
GRANT SELECT ON combined_audit_logs TO authenticated;
GRANT SELECT ON audit_logs_with_users TO authenticated;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_customer_debit_audit_logs_user_id ON customer_debit_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_debit_audit_logs_action ON customer_debit_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_customer_debit_audit_logs_timestamp ON customer_debit_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_customer_debit_audit_logs_customer_id ON customer_debit_audit_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_debit_audit_logs_transaction_id ON customer_debit_audit_logs(transaction_id);
```

### 2. Verify the Setup
After running the SQL, you should be able to query:

```sql
-- Test the combined view
SELECT * FROM combined_audit_logs LIMIT 5;

-- Test the view with user information
SELECT * FROM audit_logs_with_users LIMIT 5;
```

## Frontend Fallback
The frontend has been updated with a fallback mechanism:
- First tries to load from the `audit_logs_with_users` view
- If the view doesn't exist, falls back to direct table queries
- This ensures the audit logs will display even without the views

## What You'll See
After setting up the views, the Audit Logs section will show:

### System Events
- Perfume additions/updates/deletions
- Order creation and status changes
- User management actions
- Other system activities

### Customer Debit Events
- Transaction creation
- Transaction approval/rejection
- Status changes
- Complete audit trail with old/new values

### Features Available
- ✅ Search by description, action, customer name, user name
- ✅ Filter by log type (System vs Customer Debits)
- ✅ Filter by specific actions
- ✅ Date range filtering
- ✅ Detailed view with complete information
- ✅ Real-time updates

## Troubleshooting

### If Views Don't Work
The frontend will automatically fall back to direct table queries, so audit logs should still display.

### If No Data Shows
1. Check browser console for errors
2. Verify RLS policies allow reading audit logs
3. Ensure user has proper permissions

### Performance Issues
The indexes created will improve query performance for large datasets.

## Next Steps
1. Execute the SQL script in Supabase
2. Refresh the Audit Logs page
3. Test creating/approving/rejecting customer debit transactions
4. Verify all audit logs appear correctly

The system is now ready to provide complete audit trail functionality! 🎉
