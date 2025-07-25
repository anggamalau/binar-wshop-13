-- =====================================================
-- DATABASE SCHEMA FOR UPDATE-PROFILE WORKSHOP PROJECT
-- =====================================================

-- Create database (if not exists)
-- CREATE DATABASE workshop_db;

-- =====================================================
-- TABLE DEFINITIONS
-- =====================================================

-- 1. AUTH TABLE - Stores authentication information
CREATE TABLE IF NOT EXISTS auth (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLE - Stores user profile information
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  auth_id INTEGER REFERENCES auth(id),
  full_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  birth_date DATE,
  bio TEXT,
  long_bio TEXT,
  profile_json JSON,
  address TEXT,
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USER_ROLES TABLE - Stores user role assignments
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. USER_LOGS TABLE - Stores user activity logs
CREATE TABLE IF NOT EXISTS user_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. USER_DIVISIONS TABLE - Stores user division assignments
CREATE TABLE IF NOT EXISTS user_divisions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  division_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_divisions_user_id ON user_divisions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_divisions_division_name ON user_divisions(division_name);
CREATE INDEX IF NOT EXISTS idx_auth_email ON auth(email);

-- =====================================================
-- SAMPLE DATA STRUCTURE
-- =====================================================

-- Sample auth record
-- INSERT INTO auth (email, password) VALUES ('user@example.com', 'hashed_password');

-- Sample user record
-- INSERT INTO users (auth_id, full_name, username, birth_date, bio, long_bio, profile_json, address, phone_number) 
-- VALUES (1, 'John Doe', 'johndoe', '1990-01-01', 'Short bio', 'Long detailed bio...', '{"social_media": {"instagram": "johndoe"}, "preferences": {"theme": "light"}}', 'Jl. Sudirman No. 123, Jakarta', '+6281234567890');

-- Sample user role
-- INSERT INTO user_roles (user_id, role) VALUES (1, 'user');

-- Sample user division
-- INSERT INTO user_divisions (user_id, division_name) VALUES (1, 'Tech');

-- Sample user log
-- INSERT INTO user_logs (user_id, action) VALUES (1, 'profile_updated');

-- =====================================================
-- RELATIONSHIPS OVERVIEW
-- =====================================================

/*
RELATIONSHIP DIAGRAM:

auth (1) -----> (1) users
                |
                v
            user_roles (many)
                |
                v
            user_divisions (many)
                |
                v
            user_logs (many)

DETAILED RELATIONSHIPS:
- auth.id -> users.auth_id (One-to-One)
- users.id -> user_roles.user_id (One-to-Many)
- users.id -> user_divisions.user_id (One-to-Many)
- users.id -> user_logs.user_id (One-to-Many)
*/

-- =====================================================
-- COMMON QUERIES USED IN THE APPLICATION
-- =====================================================

-- Query to get user with all related data (used in /api/user/[id])
/*
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
LEFT JOIN LATERAL (
  SELECT division_name
  FROM user_divisions
  WHERE user_id = u.id
  ORDER BY id DESC
  LIMIT 1
) ud ON true
WHERE u.id = $1
*/

-- Query to get users with division filter (used in /api/users)
/*
SELECT 
  u.id,
  u.username,
  u.full_name,
  u.birth_date,
  u.bio,
  u.address,
  u.phone_number,
  ud.division_name
FROM users u
LEFT JOIN user_divisions ud ON u.id = ud.user_id
WHERE ud.division_name = $1
*/

-- =====================================================
-- AVAILABLE DIVISIONS
-- =====================================================

/*
The application supports these divisions:
- HR
- Tech
- Finance
- Ops
*/

-- =====================================================
-- NOTES FOR WORKSHOP PRACTICE
-- =====================================================

/*
PERFORMANCE ISSUES INTENTIONALLY INCLUDED FOR PRACTICE:

1. No proper indexing on frequently queried columns
2. Complex JOIN operations without optimization
3. LATERAL JOINs that could be simplified
4. No query result limiting
5. String concatenation in WHERE clauses
6. Multiple state variables in frontend
7. Inefficient filtering logic
8. No memoization
9. Complex sorting algorithms
10. Unnecessary re-renders

These issues are intentionally included for refactoring practice in the workshop.
*/ 