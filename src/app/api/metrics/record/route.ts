import { NextResponse } from "next/server";
import {
  reactComponentRenderTime,
  apiResponseTime,
  apiRequestsTotal,
} from "@/lib/metrics";

export async function POST(request: Request) {
  try {
    const { metric, value, labels } = await request.json();

    switch (metric) {
      case "react_component_render_duration_seconds":
        reactComponentRenderTime.observe(labels, value);
        break;
      case "api_response_duration_seconds":
        apiResponseTime.observe(labels, value);
        break;
      case "api_requests_total":
        apiRequestsTotal.inc(labels);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording metric:", error);
    return NextResponse.json(
      { error: "Failed to record metric" },
      { status: 500 }
    );
  }
}
