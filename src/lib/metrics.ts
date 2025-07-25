import {
  register,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from "prom-client";

// Enable default metrics collection
collectDefaultMetrics();

// Legacy metrics (keeping for backward compatibility)
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
});

// Enhanced API metrics
export const apiResponseTime = new Histogram({
  name: "api_response_duration_seconds",
  help: "API endpoint response duration in seconds",
  labelNames: ["method", "route", "status_code", "endpoint_type"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
});

export const apiRequestsTotal = new Counter({
  name: "api_requests_total",
  help: "Total number of API requests",
  labelNames: ["method", "route", "status_code", "endpoint_type"],
});

// React Component metrics
export const reactComponentRenderTime = new Histogram({
  name: "react_component_render_duration_seconds",
  help: "React component render duration in seconds",
  labelNames: ["component_name", "page"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
});

// Other metrics
export const activeUsers = new Gauge({
  name: "active_users_total",
  help: "Total number of active users",
});

export const databaseQueryDuration = new Histogram({
  name: "database_query_duration_seconds",
  help: "Database query duration in seconds",
  labelNames: ["query_type"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
});

export const jwtTokenGenerationDuration = new Histogram({
  name: "jwt_token_generation_duration_seconds",
  help: "JWT token generation duration in seconds",
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
});

// Function to get metrics
export async function getMetrics() {
  return await register.metrics();
}

// Function to reset metrics (useful for testing)
export function resetMetrics() {
  register.clear();
}
