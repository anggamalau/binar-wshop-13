// Bad queries for optimization practice - Session 11 & 12
// These queries are intentionally inefficient to demonstrate optimization techniques

export const badQueries = {
  // Bad practice: Nested if-else structure for user data processing
  getUserDataWithNestedLogic: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.bio,
      u.long_bio,
      u.profile_json,
      u.address,
      u.phone_number,
      a.email,
      ur.role,
      ud.division_name,
      -- Bad practice: multiple subqueries for the same data
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id) as log_count,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'login') as login_count,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'update_profile') as update_count,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'logout') as logout_count,
      -- Bad practice: unnecessary string concatenations
      CONCAT(u.full_name, ' (', COALESCE(ur.role, 'no role'), ')') as display_name,
      CONCAT(u.username, '@', a.email) as user_identifier,
      -- Bad practice: complex CASE statements that could be simplified
      CASE 
        WHEN u.bio IS NULL THEN 'No bio available'
        WHEN u.bio = '' THEN 'Empty bio'
        WHEN LENGTH(u.bio) < 10 THEN 'Short bio'
        WHEN LENGTH(u.bio) < 50 THEN 'Medium bio'
        ELSE 'Long bio'
      END as bio_status,
      -- Bad practice: nested CASE statements
      CASE 
        WHEN ur.role = 'admin' THEN 'Administrator'
        WHEN ur.role = 'moderator' THEN 'Moderator'
        WHEN ur.role = 'editor' THEN 'Editor'
        WHEN ur.role = 'viewer' THEN 'Viewer'
        WHEN ur.role = 'user' THEN 'Regular User'
        ELSE 'Unknown Role'
      END as role_display,
              -- Bad practice: complex JSON operations without proper indexing
        CASE 
          WHEN u.profile_json IS NOT NULL THEN 
            CASE 
              WHEN u.profile_json->'social_media' IS NOT NULL THEN
                CASE 
                  WHEN u.profile_json->'social_media'->>'instagram' IS NOT NULL THEN
                    u.profile_json->'social_media'->>'instagram'
                  ELSE 'No Instagram'
                END
              ELSE 'No social media'
            END
          ELSE 'No profile data'
        END as instagram_handle,
      -- Bad practice: date calculations in SQL
      EXTRACT(DAY FROM (NOW() - u.created_at)) as days_since_created,
      EXTRACT(MONTH FROM (NOW() - u.created_at)) as months_since_created,
      EXTRACT(YEAR FROM (NOW() - u.created_at)) as years_since_created
    FROM users u
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN user_divisions ud ON u.id = ud.user_id
    -- Bad practice: unnecessary CROSS JOIN
    CROSS JOIN (SELECT 1 as dummy) d
    -- Bad practice: no WHERE clause for filtering
    ORDER BY u.created_at DESC
  `,

  // Bad practice: Complex nested subqueries for user statistics
  getUserStatisticsWithNestedSubqueries: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      -- Bad practice: multiple subqueries for related data
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id) as total_logs,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'login') as login_logs,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'logout') as logout_logs,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'update_profile') as update_logs,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'view_users') as view_logs,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'export_data') as export_logs,
      -- Bad practice: nested subqueries for date-based calculations
      (SELECT COUNT(*) FROM user_logs 
       WHERE user_id = u.id 
       AND created_at > (SELECT MAX(created_at) FROM user_logs WHERE user_id = u.id) - INTERVAL '7 days') as recent_logs_7d,
      (SELECT COUNT(*) FROM user_logs 
       WHERE user_id = u.id 
       AND created_at > (SELECT MAX(created_at) FROM user_logs WHERE user_id = u.id) - INTERVAL '30 days') as recent_logs_30d,
      (SELECT COUNT(*) FROM user_logs 
       WHERE user_id = u.id 
       AND created_at > (SELECT MAX(created_at) FROM user_logs WHERE user_id = u.id) - INTERVAL '90 days') as recent_logs_90d,
      -- Bad practice: subqueries for role and division counts
      (SELECT COUNT(*) FROM user_roles WHERE user_id = u.id) as role_count,
      (SELECT COUNT(*) FROM user_divisions WHERE user_id = u.id) as division_count,
      -- Bad practice: complex conditional subqueries
      (SELECT COUNT(*) FROM user_logs 
       WHERE user_id = u.id 
       AND action IN ('login', 'logout')
       AND created_at > NOW() - INTERVAL '24 hours') as today_auth_actions,
      -- Bad practice: subquery for user activity score
      (SELECT 
        CASE 
          WHEN COUNT(*) > 50 THEN 'Very Active'
          WHEN COUNT(*) > 20 THEN 'Active'
          WHEN COUNT(*) > 5 THEN 'Moderate'
          ELSE 'Inactive'
        END
       FROM user_logs WHERE user_id = u.id) as activity_level
    FROM users u
    -- Bad practice: no WHERE clause, processing all users
    ORDER BY u.created_at DESC
  `,

  // Bad practice: Complex data cleaning query with multiple conditions
  getDataForCleaning: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.bio,
      u.long_bio,
      u.address,
      u.phone_number,
      u.profile_json,
      a.email,
      ur.role,
      ud.division_name,
      -- Bad practice: complex NULL checking with multiple conditions
      CASE 
        WHEN u.bio IS NULL THEN 'MISSING_BIO'
        WHEN u.bio = '' THEN 'EMPTY_BIO'
        WHEN LENGTH(TRIM(u.bio)) < 3 THEN 'SHORT_BIO'
        WHEN u.bio LIKE '%test%' OR u.bio LIKE '%demo%' OR u.bio LIKE '%example%' THEN 'TEST_BIO'
        ELSE 'VALID_BIO'
      END as bio_status,
      -- Bad practice: complex phone number validation
      CASE 
        WHEN u.phone_number IS NULL THEN 'MISSING_PHONE'
        WHEN u.phone_number = '' THEN 'EMPTY_PHONE'
        WHEN u.phone_number NOT LIKE '+62%' THEN 'INVALID_FORMAT'
        WHEN LENGTH(u.phone_number) < 10 THEN 'TOO_SHORT'
        WHEN LENGTH(u.phone_number) > 15 THEN 'TOO_LONG'
        WHEN u.phone_number REGEXP '^[0-9+]+$' = 0 THEN 'INVALID_CHARS'
        ELSE 'VALID_PHONE'
      END as phone_status,
      -- Bad practice: complex address validation
      CASE 
        WHEN u.address IS NULL THEN 'MISSING_ADDRESS'
        WHEN u.address = '' THEN 'EMPTY_ADDRESS'
        WHEN LENGTH(TRIM(u.address)) < 10 THEN 'SHORT_ADDRESS'
        WHEN u.address NOT LIKE '%Jakarta%' 
             AND u.address NOT LIKE '%Bandung%' 
             AND u.address NOT LIKE '%Surabaya%' 
             AND u.address NOT LIKE '%Medan%' 
             AND u.address NOT LIKE '%Semarang%' THEN 'UNKNOWN_CITY'
        ELSE 'VALID_ADDRESS'
      END as address_status,
      -- Bad practice: complex JSON validation
      CASE 
        WHEN u.profile_json IS NULL THEN 'MISSING_PROFILE'
        WHEN u.profile_json = '{}' THEN 'EMPTY_PROFILE'
        WHEN u.profile_json->>'social_media' IS NULL THEN 'NO_SOCIAL_MEDIA'
        WHEN u.profile_json->'social_media'->>'instagram' IS NULL THEN 'NO_INSTAGRAM'
        ELSE 'VALID_PROFILE'
      END as profile_status,
      -- Bad practice: duplicate detection
      (SELECT COUNT(*) FROM users u2 
       WHERE u2.bio = u.bio AND u2.id != u.id AND u.bio IS NOT NULL) as bio_duplicates,
      (SELECT COUNT(*) FROM users u2 
       WHERE u2.address = u.address AND u2.id != u.id AND u.address IS NOT NULL) as address_duplicates,
      (SELECT COUNT(*) FROM users u2 
       WHERE u2.phone_number = u.phone_number AND u2.id != u.id AND u.phone_number IS NOT NULL) as phone_duplicates
    FROM users u
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN user_divisions ud ON u.id = ud.user_id
    -- Bad practice: no WHERE clause, processing all data
    ORDER BY u.created_at DESC
  `,

  // Bad practice: Performance testing query with multiple joins and calculations
  getPerformanceTestData: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.bio,
      u.long_bio,
      u.profile_json,
      u.address,
      u.phone_number,
      a.email,
      ur.role,
      ud.division_name,
      -- Bad practice: multiple subqueries for the same table
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id) as total_logs,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'login') as login_count,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'logout') as logout_count,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'update_profile') as update_count,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'view_users') as view_count,
      (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id AND action = 'export_data') as export_count,
      -- Bad practice: complex date calculations
      EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 86400 as days_since_created,
      EXTRACT(EPOCH FROM (NOW() - u.updated_at)) / 86400 as days_since_updated,
      -- Bad practice: string operations on large text fields
      LENGTH(u.long_bio) as long_bio_length,
      LENGTH(u.bio) as bio_length,
      LENGTH(u.address) as address_length,
      -- Bad practice: complex JSON path operations
      CASE 
        WHEN u.profile_json IS NOT NULL THEN
          CASE 
            WHEN u.profile_json->>'social_media' IS NOT NULL THEN
              CASE 
                WHEN u.profile_json->'social_media'->>'instagram' IS NOT NULL THEN
                  LENGTH(u.profile_json->'social_media'->>'instagram')
                ELSE 0
              END
            ELSE 0
          END
        ELSE 0
      END as instagram_length,
      -- Bad practice: complex conditional calculations
      CASE 
        WHEN u.bio IS NOT NULL AND u.address IS NOT NULL AND u.phone_number IS NOT NULL THEN 100
        WHEN u.bio IS NOT NULL AND u.address IS NOT NULL THEN 75
        WHEN u.bio IS NOT NULL OR u.address IS NOT NULL OR u.phone_number IS NOT NULL THEN 50
        ELSE 0
      END as profile_completeness,
      -- Bad practice: nested calculations
      CASE 
        WHEN (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id) > 50 THEN 'Very Active'
        WHEN (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id) > 20 THEN 'Active'
        WHEN (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id) > 5 THEN 'Moderate'
        ELSE 'Inactive'
      END as activity_level
    FROM users u
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN user_divisions ud ON u.id = ud.user_id
    -- Bad practice: CROSS JOIN for no reason
    CROSS JOIN (SELECT 1 as dummy) d
    -- Bad practice: no WHERE clause, no LIMIT
    ORDER BY u.created_at DESC
  `,
};

// Bad practice: Nested if-else logic for data processing
export const processUserDataWithNestedLogic = (user: any) => {
  let result = {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    processedData: {},
  };

  // Bad practice: deeply nested if-else statements
  if (user.bio) {
    if (user.bio.length < 10) {
      result.processedData.bioStatus = "short";
      if (user.bio.includes("test")) {
        result.processedData.bioQuality = "test_data";
      } else {
        result.processedData.bioQuality = "valid_short";
      }
    } else if (user.bio.length < 50) {
      result.processedData.bioStatus = "medium";
      if (user.bio.includes("demo")) {
        result.processedData.bioQuality = "demo_data";
      } else {
        result.processedData.bioQuality = "valid_medium";
      }
    } else {
      result.processedData.bioStatus = "long";
      if (user.bio.includes("example")) {
        result.processedData.bioQuality = "example_data";
      } else {
        result.processedData.bioQuality = "valid_long";
      }
    }
  } else {
    result.processedData.bioStatus = "missing";
    result.processedData.bioQuality = "no_data";
  }

  if (user.phone_number) {
    if (user.phone_number.startsWith("+62")) {
      if (user.phone_number.length >= 10 && user.phone_number.length <= 15) {
        result.processedData.phoneStatus = "valid";
        result.processedData.phoneQuality = "good_format";
      } else {
        result.processedData.phoneStatus = "invalid_length";
        result.processedData.phoneQuality = "bad_format";
      }
    } else {
      result.processedData.phoneStatus = "invalid_country_code";
      result.processedData.phoneQuality = "wrong_format";
    }
  } else {
    result.processedData.phoneStatus = "missing";
    result.processedData.phoneQuality = "no_data";
  }

  if (user.address) {
    if (user.address.length < 10) {
      result.processedData.addressStatus = "too_short";
      result.processedData.addressQuality = "incomplete";
    } else if (
      user.address.includes("Jakarta") ||
      user.address.includes("Bandung")
    ) {
      result.processedData.addressStatus = "valid";
      result.processedData.addressQuality = "major_city";
    } else {
      result.processedData.addressStatus = "valid";
      result.processedData.addressQuality = "other_city";
    }
  } else {
    result.processedData.addressStatus = "missing";
    result.processedData.addressQuality = "no_data";
  }

  if (user.profile_json) {
    try {
      const profile = JSON.parse(user.profile_json);
      if (profile.social_media) {
        if (profile.social_media.instagram) {
          result.processedData.profileStatus = "complete";
          result.processedData.profileQuality = "has_social";
        } else {
          result.processedData.profileStatus = "partial";
          result.processedData.profileQuality = "no_instagram";
        }
      } else {
        result.processedData.profileStatus = "incomplete";
        result.processedData.profileQuality = "no_social";
      }
    } catch (error) {
      result.processedData.profileStatus = "invalid_json";
      result.processedData.profileQuality = "parse_error";
    }
  } else {
    result.processedData.profileStatus = "missing";
    result.processedData.profileQuality = "no_data";
  }

  return result;
};
