import { NextResponse } from "next/server";
import { comparePassword, hashPassword } from "@/lib/crypto";
import { executeQuery } from "@/lib/database";
import { authMiddleware } from "@/lib/jwt";

async function updatePassword(request: Request) {
  console.time("Password Update Execution");

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json(
        { message: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json(
        { message: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Bad practice: getting user from request without proper typing
    const user = (request as any).user;

    // Bad practice: inefficient query to get current password
    const getPasswordQuery = `
      SELECT password_hash FROM users WHERE id = $1
    `;

    const passwordResult = await executeQuery(getPasswordQuery, [user.userId]);

    if (passwordResult.rows.length === 0) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const currentPasswordHash = passwordResult.rows[0].password_hash;

    // Bad practice: using simple hash comparison instead of bcrypt
    const isCurrentPasswordValid = comparePassword(
      currentPassword,
      currentPasswordHash
    );

    if (!isCurrentPasswordValid) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json(
        { message: "Current password is incorrect." },
        { status: 401 }
      );
    }

    // Bad practice: using simple hash instead of bcrypt
    const newPasswordHash = hashPassword(newPassword);

    // Bad practice: inefficient update query
    const updatePasswordQuery = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await executeQuery(updatePasswordQuery, [newPasswordHash, user.userId]);

    console.timeEnd("Password Update Execution");
    return NextResponse.json({
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Password update error:", error);
    console.timeEnd("Password Update Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

// Bad practice: wrapping with auth middleware
export const POST = authMiddleware(updatePassword);
