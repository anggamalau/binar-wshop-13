/**
 * @jest-environment node
 */
import { POST } from "@/app/api/login/route";
import { NextRequest } from "next/server";

describe("POST /api/login", () => {
  it("should return 400 if email is missing", async () => {
      // TODO: Implement this test
  });

  // unit test untuk api login if email is missing
  it("should return 400 if email is missing", async () => {
      const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ password: "validPassword123" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ message: "Email and password are required." });
  });

  it("should return 400 if password is missing", async () => {
      const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ message: "Email and password are required." });
  });

  it("should return 400 if password is less than 6 characters", async () => {
      const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "123" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ message: "Password must be at least 6 characters." });
  });

  it("should return 401 if credentials are invalid", async () => {
      const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ email: "wrong@example.com", password: "wrongPassword" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toEqual({ message: "Invalid credentials." });
  });
});
