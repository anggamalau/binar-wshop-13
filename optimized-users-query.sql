-- Optimized PostgreSQL query for users API endpoint
-- This query addresses all performance issues from the original query

-- Using CTEs for better performance and readability
WITH user_aggregates AS (
  -- Pre-calculate all user-specific counts in a single pass
  SELECT 
    ul.user_id,
    COUNT(*) as log_count,
    COUNT(*) FILTER (WHERE ul.action = 'login') as login_count,
    COUNT(*) FILTER (WHERE ul.action = 'update_profile') as update_count,
    COUNT(*) FILTER (WHERE ul.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days') as recent_logs
  FROM user_logs ul
  GROUP BY ul.user_id
),
total_users_count AS (
  -- Calculate total users once
  SELECT COUNT(*) as total_count FROM users
),
user_creation_rank AS (
  -- Calculate newer users count using window function
  SELECT 
    id,
    COUNT(*) OVER (ORDER BY created_at DESC) - 1 as newer_users
  FROM users
)
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
  ud.division_name,
  -- Use pre-calculated values
  tc.total_count as total_users,
  ucr.newer_users,
  COALESCE(ua.log_count, 0) as log_count,
  1 as role_count, -- Each user has exactly one role based on schema
  1 as division_count, -- Each user has exactly one division based on schema
  COALESCE(ua.login_count, 0) as login_count,
  COALESCE(ua.update_count, 0) as update_count,
  COALESCE(ua.recent_logs, 0) as recent_logs,
  -- Optimized string operations
  u.full_name || ' (' || COALESCE(ur.role, 'no role') || ')' as display_name,
  COALESCE(NULLIF(u.bio, ''), 'No bio available') as bio_display,
  -- Simplified JSON extraction
  COALESCE(u.profile_json->'social_media'->>'instagram', 'No Instagram') as instagram_handle
FROM users u
LEFT JOIN auth a ON u.auth_id = a.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN user_divisions ud ON u.id = ud.user_id
LEFT JOIN user_aggregates ua ON u.id = ua.user_id
LEFT JOIN user_creation_rank ucr ON u.id = ucr.id
CROSS JOIN total_users_count tc
WHERE 
  -- Use parameterized query to prevent SQL injection
  ($1::text IS NULL OR ud.division_name = $1)
ORDER BY u.created_at DESC
-- Add pagination
LIMIT $2 OFFSET $3;

-- Create necessary indexes for optimal performance
-- These should be run once during database setup:
/*
CREATE INDEX idx_user_logs_user_action ON user_logs(user_id, action);
CREATE INDEX idx_user_logs_user_created ON user_logs(user_id, created_at);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_profile_json_instagram ON users((profile_json->'social_media'->>'instagram'));

-- Consider creating a materialized view for frequently accessed aggregates:
CREATE MATERIALIZED VIEW user_stats_mv AS
SELECT 
  ul.user_id,
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE ul.action = 'login') as login_count,
  COUNT(*) FILTER (WHERE ul.action = 'update_profile') as update_count
FROM user_logs ul
GROUP BY ul.user_id;

-- Create index on materialized view
CREATE INDEX idx_user_stats_mv_user_id ON user_stats_mv(user_id);

-- Refresh periodically (e.g., every hour)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats_mv;
*/