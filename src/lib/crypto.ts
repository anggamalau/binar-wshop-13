import crypto from "crypto";

// Bad practice: using simple hash instead of bcrypt for demo
export function hashPassword(password: string): string {
  console.time("Password Hashing");
  try {
    // Bad practice: using SHA-256 instead of bcrypt for demo
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    console.timeEnd("Password Hashing");
    return hash;
  } catch (error) {
    console.error("Password hashing error:", error);
    console.timeEnd("Password Hashing");
    throw error;
  }
}

// Bad practice: simple comparison instead of bcrypt.compare
export function comparePassword(password: string, hash: string): boolean {
  console.time("Password Comparison");
  try {
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");
    const isValid = passwordHash === hash;
    console.timeEnd("Password Comparison");
    return isValid;
  } catch (error) {
    console.error("Password comparison error:", error);
    console.timeEnd("Password Comparison");
    return false;
  }
}
