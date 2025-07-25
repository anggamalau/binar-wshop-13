import { NextResponse } from "next/server";
import { comparePassword } from "@/lib/crypto";
import { executeQuery } from "@/lib/database";
import { generateToken } from "@/lib/jwt";
import { withMetrics } from "@/lib/metrics-middleware";

// Force Node.js runtime for prom-client compatibility
export const runtime = "nodejs";

const loginHandler = async (request: Request) => {
  console.time("Login API Execution");

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Bad practice: inefficient query with multiple joins and wildcard select
    const query = `
      SELECT 
        a.id as auth_id,
        a.email,
        a.password,
        u.id as user_id,
        u.username,
        u.full_name,
        u.birth_date,
        u.bio,
        u.long_bio,
        u.profile_json,
        u.address,
        u.phone_number,
        ur.role,
        ud.division_name,
        -- Bad practice: unnecessary subqueries for demo
        (SELECT COUNT(*) FROM user_logs WHERE user_id = u.id) as log_count,
        (SELECT COUNT(*) FROM user_roles WHERE user_id = u.id) as role_count
      FROM auth a
      LEFT JOIN users u ON a.id = u.auth_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
      WHERE a.email = $1
    `;

    const result = await executeQuery(query, [email]);

    if (result.rows.length === 0) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Bad practice: using simple hash comparison instead of bcrypt
    const isPasswordValid = comparePassword(password, user.password);

    if (!isPasswordValid) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const tokenPayload = {
      userId: user.user_id,
      email: user.email,
      role: user.role,
      username: user.username,
      fullName: user.full_name,
    };

    const token = generateToken(tokenPayload);

    // Log the login action
    await executeQuery(
      "INSERT INTO user_logs (user_id, action) VALUES ($1, $2)",
      [user.user_id, "login"]
    );

    console.timeEnd("Login API Execution");
    return NextResponse.json({
      message: "Login successful!",
      token,
      user: {
        id: user.user_id,
        authId: user.auth_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        division: user.division_name,
        bio: user.bio,
        longBio: user.long_bio,
        profileJson: user.profile_json,
        address: user.address,
        phoneNumber: user.phone_number,
        birthDate: user.birth_date,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    console.timeEnd("Login API Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
};

export const POST = withMetrics(loginHandler);
