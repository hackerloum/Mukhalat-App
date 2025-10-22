-- Audit Logs Database Views Setup
-- Copy and paste this entire script into your Supabase SQL Editor

-- 1. Create combined_audit_logs view
CREATE OR REPLACE VIEW combined_audit_logs AS
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON audit_logs(target_type);

CREATE INDEX IF NOT EXISTS idx_customer_debit_audit_logs_user_id ON customer_debit_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_debit_audit_logs_action ON customer_debit_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_customer_debit_audit_logs_timestamp ON customer_debit_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_customer_debit_audit_logs_customer_id ON customer_debit_audit_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_debit_audit_logs_transaction_id ON customer_debit_audit_logs(transaction_id);

-- 5. Test queries (optional - you can run these to verify)
-- SELECT * FROM combined_audit_logs LIMIT 5;
-- SELECT * FROM audit_logs_with_users LIMIT 5;
