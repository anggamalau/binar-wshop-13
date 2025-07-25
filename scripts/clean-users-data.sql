-- Clean NULL and duplicate rows from users table
-- This script removes duplicates and NULL values from the users table

-- Start transaction for safety
BEGIN;

-- 1. Remove rows with NULL values in critical fields
DELETE FROM users 
WHERE username IS NULL 
   OR full_name IS NULL
   OR bio IS NULL
   OR address IS NULL
   OR phone IS NULL;

-- 2. Remove duplicate usernames (keep the one with lowest id)
DELETE FROM users u1
WHERE EXISTS (
    SELECT 1 
    FROM users u2 
    WHERE u2.username = u1.username 
    AND u2.id < u1.id
);

-- 3. Remove duplicate phone numbers (keep the one with lowest id)
DELETE FROM users u1
WHERE EXISTS (
    SELECT 1 
    FROM users u2 
    WHERE u2.phone = u1.phone 
    AND u2.id < u1.id
);

-- 4. Clean up orphaned records in related tables
DELETE FROM user_roles 
WHERE user_id NOT IN (SELECT id FROM users);

DELETE FROM user_logs 
WHERE user_id NOT IN (SELECT id FROM users);

DELETE FROM user_divisions 
WHERE user_id NOT IN (SELECT id FROM users);

DELETE FROM auth 
WHERE user_id NOT IN (SELECT id FROM users);

-- Show statistics after cleanup
SELECT 'Users remaining:' as metric, COUNT(*) as count FROM users
UNION ALL
SELECT 'Auth records remaining:', COUNT(*) FROM auth
UNION ALL
SELECT 'User roles remaining:', COUNT(*) FROM user_roles
UNION ALL
SELECT 'User logs remaining:', COUNT(*) FROM user_logs
UNION ALL
SELECT 'User divisions remaining:', COUNT(*) FROM user_divisions;

-- Commit transaction
COMMIT;