import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import { authMiddleware } from "@/lib/jwt";

async function getUserById(request: Request) {
  console.time("Get User by ID Execution");

  try {
    // Extract user ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const userId = pathParts[pathParts.length - 1];

    if (!userId || isNaN(parseInt(userId))) {
      console.timeEnd("Get User by ID Execution");
      return NextResponse.json(
        { message: "Invalid user ID." },
        { status: 400 }
      );
    }

    // Bad practice: inefficient query with wildcard select
    const query = `
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
    `;

    const result = await executeQuery(query, [userId]);

    if (result.rows.length === 0) {
      console.timeEnd("Get User by ID Execution");
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const user = result.rows[0];

    console.timeEnd("Get User by ID Execution");
    return NextResponse.json({
      user: {
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
      },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    console.timeEnd("Get User by ID Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

// Bad practice: wrapping with auth middleware
export const GET = authMiddleware(getUserById);
