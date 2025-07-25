import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/metrics";

// Force Node.js runtime for prom-client compatibility
export const runtime = "nodejs";

export async function GET() {
  try {
    const metrics = await getMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error getting metrics:", error);
    return new NextResponse("Error getting metrics", { status: 500 });
  }
}
