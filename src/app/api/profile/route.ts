import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import { authMiddleware } from "@/lib/jwt";

export type ProfileData = {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  bio?: string;
  longBio?: string;
  address?: string;
  profileJson?: any;
};

async function getProfile(request: Request) {
  console.time("Profile Get Execution");

  try {
    // Bad practice: getting user from request without proper typing
    const user = (request as any).user;

    // Bad practice: inefficient query with complex joins and subqueries
    const selectQuery = `
      SELECT 
        u.*,
        a.email,
        ur.role,
        ud.division_name,
        (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id) as log_count,
        (SELECT COUNT(*) FROM user_roles WHERE user_id = u.id) as role_count,
        (SELECT COUNT(*) FROM user_divisions WHERE user_id = u.id) as division_count
      FROM users u
      LEFT JOIN auth a ON u.auth_id = a.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
      WHERE u.id = $1
    `;

    const result = await executeQuery(selectQuery, [user.userId]);

    if (result.rows.length === 0) {
      console.timeEnd("Profile Get Execution");
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const userData = result.rows[0];

    console.timeEnd("Profile Get Execution");
    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        authId: userData.auth_id,
        username: userData.username,
        fullName: userData.full_name,
        email: userData.email,
        bio: userData.bio,
        longBio: userData.long_bio,
        profileJson: userData.profile_json,
        address: userData.address,
        phoneNumber: userData.phone_number,
        birthDate: userData.birth_date,
        role: userData.role,
        division: userData.division_name,
        logCount: userData.log_count,
        roleCount: userData.role_count,
        divisionCount: userData.division_count,
      },
    });
  } catch (error) {
    console.error("Profile get error:", error);
    console.timeEnd("Profile Get Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

async function updateProfile(request: Request) {
  console.time("Profile Update Execution");

  try {
    const {
      username,
      fullName,
      email,
      phone,
      birthDate,
      bio,
      longBio,
      address,
      profileJson,
    }: ProfileData = await request.json();

    const errors: Partial<Record<keyof ProfileData, string>> = {};

    if (!username || username.length < 6) {
      errors.username = "Username must be at least 6 characters.";
    }

    if (!fullName) {
      errors.fullName = "Full name is required.";
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Must be a valid email format.";
    }

    if (!phone || !/^\d{10,15}$/.test(phone)) {
      errors.phone = "Phone must be 10-15 digits.";
    }

    if (birthDate) {
      const date = new Date(birthDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        errors.birthDate = "Birth date cannot be in the future.";
      }
    }

    if (bio && bio.length > 160) {
      errors.bio = "Bio must be 160 characters or less.";
    }

    if (longBio && longBio.length > 2000) {
      errors.longBio = "Long bio must be 2000 characters or less.";
    }

    if (Object.keys(errors).length > 0) {
      console.timeEnd("Profile Update Execution");
      return NextResponse.json(
        { message: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Bad practice: getting user from request without proper typing
    const user = (request as any).user;

    // Bad practice: inefficient update query with unnecessary operations
    const updateQuery = `
      UPDATE users 
      SET username = $1, full_name = $2, bio = $3, long_bio = $4, 
          address = $5, phone_number = $6, profile_json = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `;

    await executeQuery(updateQuery, [
      username,
      fullName,
      bio,
      longBio,
      address,
      phone,
      profileJson ? JSON.stringify(profileJson) : null,
      user.userId,
    ]);

    // Bad practice: unnecessary select after update with complex joins
    const selectQuery = `
      SELECT 
        u.*,
        ur.role,
        ud.division_name,
        (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id) as log_count,
        (SELECT COUNT(*) FROM user_roles WHERE user_id = u.id) as role_count
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
      WHERE u.id = $1
    `;

    const result = await executeQuery(selectQuery, [user.userId]);
    const updatedUser = result.rows[0];

    // Log the profile update action
    await executeQuery(
      "INSERT INTO user_logs (user_id, action) VALUES ($1, $2)",
      [user.userId, "update_profile"]
    );

    console.timeEnd("Profile Update Execution");
    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        authId: updatedUser.auth_id,
        username: updatedUser.username,
        fullName: updatedUser.full_name,
        bio: updatedUser.bio,
        longBio: updatedUser.long_bio,
        profileJson: updatedUser.profile_json,
        address: updatedUser.address,
        phoneNumber: updatedUser.phone_number,
        birthDate: updatedUser.birth_date,
        role: updatedUser.role,
        division: updatedUser.division_name,
        logCount: updatedUser.log_count,
        roleCount: updatedUser.role_count,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    console.timeEnd("Profile Update Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

// Bad practice: wrapping with auth middleware
export const GET = authMiddleware(getProfile);
export const PUT = authMiddleware(updateProfile);
