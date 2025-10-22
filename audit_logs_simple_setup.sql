-- SIMPLE Audit Logs Setup - Step by Step
-- Run these commands one by one to avoid errors

-- Step 1: Check your table structures first
-- Run this to see what columns exist in audit_logs:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- Run this to see what columns exist in customer_debit_audit_logs:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customer_debit_audit_logs' 
ORDER BY ordinal_position;

-- Step 2: Create a simple combined view (adjust columns based on Step 1 results)
CREATE OR REPLACE VIEW combined_audit_logs AS
SELECT 
    id,
    action,
    description,
    user_id,
    metadata,
    timestamp,
    ip_address,
    user_agent,
    'system' as log_type
FROM audit_logs

UNION ALL

SELECT 
    id,
    action,
    description,
    user_id,
    metadata,
    timestamp,
    ip_address,
    user_agent,
    'customer_debit' as log_type
FROM customer_debit_audit_logs

ORDER BY timestamp DESC;

-- Step 3: Create the view with user information
CREATE OR REPLACE VIEW audit_logs_with_users AS
SELECT 
    cal.*,
    au.full_name as user_name,
    au.email as user_email,
    au.role as user_role
FROM combined_audit_logs cal
LEFT JOIN app_users au ON cal.user_id = au.id;

-- Step 4: Grant permissions
GRANT SELECT ON combined_audit_logs TO authenticated;
GRANT SELECT ON audit_logs_with_users TO authenticated;

-- Step 5: Test the views
-- SELECT * FROM combined_audit_logs LIMIT 5;
-- SELECT * FROM audit_logs_with_users LIMIT 5;
