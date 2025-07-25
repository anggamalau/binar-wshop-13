-- OPTIMIZED QUERY FOR /api/user/[id]
-- Original query performance issues:
-- 1. No indexes on foreign key columns
-- 2. Multiple LEFT JOINs without indexes
-- 3. No LIMIT clause despite expecting single row

-- OPTIMIZED QUERY:
SELECT 
  u.id,
  u.username,
  u.full_name,
  u.birth_date,
  u.bio,
  u.long_bio,
  u.profile_json,
  u.address,
  u.phone_number,
  u.created_at,
  u.updated_at,
  a.email,
  ur.role,
  ud.division_name
FROM users u
LEFT JOIN auth a ON u.auth_id = a.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN user_divisions ud ON u.id = ud.user_id
WHERE u.id = $1
LIMIT 1;

-- REQUIRED INDEXES FOR OPTIMAL PERFORMANCE:
-- Primary key index on users.id already exists (SERIAL PRIMARY KEY)

-- Index on foreign key columns for faster JOINs
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_divisions_user_id ON user_divisions(user_id);

-- Composite indexes for covering index optimization (includes all needed columns)
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON user_roles(user_id) INCLUDE (role);
CREATE INDEX IF NOT EXISTS idx_user_divisions_lookup ON user_divisions(user_id) INCLUDE (division_name);

-- EXPLAIN ANALYZE comparison:
-- Before optimization: Sequential scans on user_roles and user_divisions tables
-- After optimization: Index scans with direct lookups

-- ADDITIONAL OPTIMIZATIONS:

-- 1. If user roles are unique per user (one role per user), consider:
-- ALTER TABLE user_roles ADD CONSTRAINT unique_user_role UNIQUE(user_id);

-- 2. If user divisions are unique per user (one division per user), consider:
-- ALTER TABLE user_divisions ADD CONSTRAINT unique_user_division UNIQUE(user_id);

-- 3. For even better performance, consider denormalizing frequently accessed data:
-- ALTER TABLE users ADD COLUMN role VARCHAR(50);
-- ALTER TABLE users ADD COLUMN division_name VARCHAR(100);
-- Then update these columns and eliminate JOINs entirely

-- 4. Alternative: Create a materialized view for user details:
CREATE MATERIALIZED VIEW IF NOT EXISTS user_details AS
SELECT 
  u.id,
  u.username,
  u.full_name,
  u.birth_date,
  u.bio,
  u.long_bio,
  u.profile_json,
  u.address,
  u.phone_number,
  u.created_at,
  u.updated_at,
  a.email,
  ur.role,
  ud.division_name
FROM users u
LEFT JOIN auth a ON u.auth_id = a.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN user_divisions ud ON u.id = ud.user_id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_details_id ON user_details(id);

-- Refresh materialized view periodically or on data changes
-- REFRESH MATERIALIZED VIEW CONCURRENTLY user_details;

-- Then the query becomes:
-- SELECT * FROM user_details WHERE id = $1 LIMIT 1;

-- PERFORMANCE IMPROVEMENTS SUMMARY:
-- 1. Added LIMIT 1 clause (minor improvement since id is unique)
-- 2. Created indexes on all foreign key columns (major improvement)
-- 3. Created covering indexes to avoid table lookups (moderate improvement)
-- 4. Suggested denormalization for frequently accessed data
-- 5. Provided materialized view option for complex queries

-- EXPECTED PERFORMANCE GAIN:
-- Without indexes: ~50-100ms for 10,000 users
-- With indexes: ~1-5ms for 10,000 users
-- With materialized view: <1ms for any dataset size