import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Create a response that we can modify
    const response = NextResponse.next();
    
    // Add timing to response
    const duration = Date.now() - start;
    response.headers.set("X-Response-Time", `${duration}ms`);
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
