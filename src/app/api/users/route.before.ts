import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import {
  httpRequestsTotal,
  httpRequestDuration,
  databaseQueryDuration,
} from "@/lib/metrics";

export async function GET(request: Request) {
  console.time("Users API Execution");
  const start = Date.now();
  const method = request.method;
  const route = "/api/users";

  try {
    // Bad practice: extract query params manually without proper parsing
    const url = new URL(request.url);
    const divisionFilter = url.searchParams.get("division");

    // Bad practice: extremely inefficient query with multiple joins, subqueries, and no pagination
    let query = `
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
        -- Bad practice: unnecessary subqueries for demo
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at > u.created_at) as newer_users,
        (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id) as log_count,
        (SELECT COUNT(*) FROM user_roles WHERE user_id = u.id) as role_count,
        (SELECT COUNT(*) FROM user_divisions WHERE user_id = u.id) as division_count,
        -- Bad practice: more unnecessary subqueries
        (SELECT COUNT(*) FROM user_logs WHERE action = 'login' AND user_id = u.id) as login_count,
        (SELECT COUNT(*) FROM user_logs WHERE action = 'update_profile' AND user_id = u.id) as update_count,
        -- Bad practice: complex nested subqueries
        (SELECT COUNT(*) FROM user_logs ul 
         WHERE ul.user_id = u.id 
         AND ul.created_at > (SELECT MAX(created_at) FROM user_logs WHERE user_id = u.id) - INTERVAL '30 days') as recent_logs,
        -- Bad practice: unnecessary string operations
        CONCAT(u.full_name, ' (', COALESCE(ur.role, 'no role'), ')') as display_name,
        CASE 
          WHEN u.bio IS NULL THEN 'No bio available'
          WHEN u.bio = '' THEN 'Empty bio'
          ELSE u.bio
        END as bio_display,
        -- Bad practice: complex JSON operations (fixed for PostgreSQL compatibility)
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
        END as instagram_handle
      FROM users u
      LEFT JOIN auth a ON u.auth_id = a.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
      -- Bad practice: unnecessary cross join for demo
      CROSS JOIN (SELECT 1 as dummy) d
    `;

    // Bad practice: inefficient filtering without proper indexing
    if (divisionFilter && divisionFilter !== "all") {
      query += ` WHERE ud.division_name = '${divisionFilter}'`;
    }

    query += ` ORDER BY u.created_at DESC`;

    const dbStart = Date.now();
    const result = await executeQuery(query);
    const dbDuration = (Date.now() - dbStart) / 1000;
    databaseQueryDuration.observe({ query_type: "users_query" }, dbDuration);

    // Bad practice: processing all data in memory with complex transformations
    const users = result.rows.map((user: any) => {
      // Bad practice: complex data processing in application layer
      // PostgreSQL JSON type already returns object, no need to parse
      const profileJson = user.profile_json || null;
      const socialMedia = profileJson?.social_media || {};
      const preferences = profileJson?.preferences || {};
      const skills = profileJson?.skills || [];
      const interests = profileJson?.interests || [];

      // Bad practice: unnecessary calculations
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const isActive = user.log_count > 5;
      const isSenior = user.role === "admin" || user.role === "moderator";

      return {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        birthDate: user.birth_date,
        bio: user.bio,
        longBio: user.long_bio,
        profileJson: profileJson,
        address: user.address,
        phoneNumber: user.phone_number,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        role: user.role,
        division: user.division_name,
        displayName: user.display_name,
        bioDisplay: user.bio_display,
        instagramHandle: user.instagram_handle,
        // Bad practice: calculated fields that could be computed in SQL
        totalUsers: user.total_users,
        newerUsers: user.newer_users,
        logCount: user.log_count,
        roleCount: user.role_count,
        divisionCount: user.division_count,
        loginCount: user.login_count,
        updateCount: user.update_count,
        recentLogs: user.recent_logs,
        // Bad practice: application-level calculations
        daysSinceCreated,
        isActive,
        isSenior,
        socialMedia,
        preferences,
        skills,
        interests,
        // Bad practice: redundant data
        hasProfile: !!user.profile_json,
        hasBio: !!user.bio,
        hasAddress: !!user.address,
        hasPhone: !!user.phone_number,
        // Bad practice: more redundant calculations
        profileCompleteness:
          ([
            !!user.bio,
            !!user.address,
            !!user.phone_number,
            !!user.profile_json,
          ].filter(Boolean).length /
            4) *
          100,
      };
    });

    // Bad practice: additional processing after mapping
    // const activeUsers = users.filter((u) => u.isActive);
    // const seniorUsers = users.filter((u) => u.isSenior);
    // const usersWithCompleteProfiles = users.filter(
    //   (u) => u.profileCompleteness > 75
    // );
    // const usersByDivision = users.reduce((acc, user) => {
    //   acc[user.division] = (acc[user.division] || 0) + 1;
    //   return acc;
    // }, {} as Record<string, number>);

    // [Imam] - refactored simplify processing
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

    const {
      activeUsers: activeUserCount,
      seniorUsers: seniorUserCount,
      usersWithCompleteProfiles: usersWithCompleteProfileCount,
      usersByDivision: summarizedUsersByDivision,
    } = summary;

    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe({ method, route }, duration);
    httpRequestsTotal.inc({ method, route, status: "200" });

    console.timeEnd("Users API Execution");
    return NextResponse.json({
      users,
      total: users.length,
      activeUsers: activeUserCount,
      seniorUsers: seniorUserCount,
      usersWithCompleteProfiles: usersWithCompleteProfileCount,
      usersByDivision: summarizedUsersByDivision,
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
