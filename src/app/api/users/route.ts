import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import {
  httpRequestsTotal,
  httpRequestDuration,
  databaseQueryDuration,
} from "@/lib/metrics";

// Constants for pagination
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: Request) {
  console.time("Users API Execution");
  const start = Date.now();
  const method = request.method;
  const route = "/api/users";

  try {
    // Parse query parameters properly
    const url = new URL(request.url);
    const divisionFilter = url.searchParams.get("division");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10))
    );
    const offset = (page - 1) * limit;

    // Optimized query using CTEs and proper parameterization
    const query = `
      WITH user_aggregates AS (
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
        SELECT COUNT(*) as total_count FROM users
      ),
      user_creation_rank AS (
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
        tc.total_count as total_users,
        ucr.newer_users,
        COALESCE(ua.log_count, 0) as log_count,
        1 as role_count,
        1 as division_count,
        COALESCE(ua.login_count, 0) as login_count,
        COALESCE(ua.update_count, 0) as update_count,
        COALESCE(ua.recent_logs, 0) as recent_logs,
        u.full_name || ' (' || COALESCE(ur.role, 'no role') || ')' as display_name,
        COALESCE(NULLIF(u.bio, ''), 'No bio available') as bio_display,
        COALESCE(u.profile_json->'social_media'->>'instagram', 'No Instagram') as instagram_handle,
        -- Calculate derived fields in SQL
        EXTRACT(DAY FROM CURRENT_TIMESTAMP - u.created_at) as days_since_created,
        CASE WHEN COALESCE(ua.log_count, 0) > 5 THEN true ELSE false END as is_active,
        CASE WHEN ur.role IN ('admin', 'moderator') THEN true ELSE false END as is_senior,
        CASE 
          WHEN u.bio IS NOT NULL AND u.address IS NOT NULL 
               AND u.phone_number IS NOT NULL AND u.profile_json IS NOT NULL 
          THEN 100
          WHEN (u.bio IS NOT NULL)::int + (u.address IS NOT NULL)::int + 
               (u.phone_number IS NOT NULL)::int + (u.profile_json IS NOT NULL)::int = 3
          THEN 75
          WHEN (u.bio IS NOT NULL)::int + (u.address IS NOT NULL)::int + 
               (u.phone_number IS NOT NULL)::int + (u.profile_json IS NOT NULL)::int = 2
          THEN 50
          WHEN (u.bio IS NOT NULL)::int + (u.address IS NOT NULL)::int + 
               (u.phone_number IS NOT NULL)::int + (u.profile_json IS NOT NULL)::int = 1
          THEN 25
          ELSE 0
        END as profile_completeness
      FROM users u
      LEFT JOIN auth a ON u.auth_id = a.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
      LEFT JOIN user_aggregates ua ON u.id = ua.user_id
      LEFT JOIN user_creation_rank ucr ON u.id = ucr.id
      CROSS JOIN total_users_count tc
      WHERE 
        ($1::text IS NULL OR $1 = 'all' OR ud.division_name = $1)
      ORDER BY u.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    // Get total count for pagination metadata
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
      WHERE ($1::text IS NULL OR $1 = 'all' OR ud.division_name = $1)
    `;

    // Execute queries in parallel for better performance
    const dbStart = Date.now();
    const [result, countResult] = await Promise.all([
      executeQuery(query, [divisionFilter, limit, offset]),
      executeQuery(countQuery, [divisionFilter])
    ]);
    const dbDuration = (Date.now() - dbStart) / 1000;
    databaseQueryDuration.observe({ query_type: "users_query_optimized" }, dbDuration);

    const totalCount = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalCount / limit);

    // Simplified data transformation - most work done in SQL
    const users = result.rows.map((user: any) => ({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      birthDate: user.birth_date,
      bio: user.bio,
      longBio: user.long_bio,
      profileJson: user.profile_json,
      address: user.address,
      phoneNumber: user.phone_number,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      role: user.role,
      division: user.division_name,
      displayName: user.display_name,
      bioDisplay: user.bio_display,
      instagramHandle: user.instagram_handle,
      totalUsers: user.total_users,
      newerUsers: user.newer_users,
      logCount: user.log_count,
      roleCount: user.role_count,
      divisionCount: user.division_count,
      loginCount: user.login_count,
      updateCount: user.update_count,
      recentLogs: user.recent_logs,
      daysSinceCreated: Math.floor(user.days_since_created),
      isActive: user.is_active,
      isSenior: user.is_senior,
      socialMedia: user.profile_json?.social_media || {},
      preferences: user.profile_json?.preferences || {},
      skills: user.profile_json?.skills || [],
      interests: user.profile_json?.interests || [],
      hasProfile: !!user.profile_json,
      hasBio: !!user.bio,
      hasAddress: !!user.address,
      hasPhone: !!user.phone_number,
      profileCompleteness: user.profile_completeness,
    }));

    // Calculate summary statistics efficiently
    const summary = users.reduce(
      (acc, user) => {
        if (user.isActive) acc.activeUsers++;
        if (user.isSenior) acc.seniorUsers++;
        if (user.profileCompleteness > 75) acc.usersWithCompleteProfiles++;
        acc.usersByDivision[user.division] =
          (acc.usersByDivision[user.division] || 0) + 1;
        return acc;
      },
      {
        activeUsers: 0,
        seniorUsers: 0,
        usersWithCompleteProfiles: 0,
        usersByDivision: {} as Record<string, number>,
      }
    );

    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe({ method, route }, duration);
    httpRequestsTotal.inc({ method, route, status: "200" });

    console.timeEnd("Users API Execution");
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      summary: {
        activeUsers: summary.activeUsers,
        seniorUsers: summary.seniorUsers,
        usersWithCompleteProfiles: summary.usersWithCompleteProfiles,
        usersByDivision: summary.usersByDivision,
      },
      filteredBy: divisionFilter || "all",
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("Users API error:", error);
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe({ method, route }, duration);
    httpRequestsTotal.inc({ method, route, status: "500" });

    console.timeEnd("Users API Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}