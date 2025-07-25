const axios = require("axios");

const BASE_URL = "http://localhost:3000";
const TOTAL_REQUESTS = 20;
const CONCURRENT_REQUESTS = 3;
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

async function sendMetric(metricName, value, labels = {}) {
  try {
    const response = await axios.post(`${BASE_URL}/api/metrics/record`, {
      metric: metricName,
      value: value,
      labels: labels,
    });
    return response.status === 200;
  } catch (error) {
    console.error(`Error sending metric ${metricName}:`, error.message);
    return false;
  }
}

async function makeRequest(requestNumber) {
  const startTime = Date.now();

  try {
    console.log(`🔄 Request ${requestNumber}: Calling /api/users...`);

    const response = await axios.get(`${BASE_URL}/api/users`, {
      timeout: 600000, // 10 minutes timeout for very heavy queries (workshop demo)
      headers: {
        Accept: "application/json",
      },
    });

    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const userCount = response.data?.users?.length || 0;

    // Send API response time metric
    await sendMetric("api_response_duration_seconds", duration, {
      endpoint: "/api/users",
      method: "GET",
      status: "200",
    });

    // Send API request count metric
    await sendMetric("api_requests_total", 1, {
      endpoint: "/api/users",
      method: "GET",
      status: "200",
    });

    // Send database query duration metric (simulated based on API response time)
    // In real scenario, this would come from the actual database query timing
    const dbQueryDuration = duration * 0.8; // Assume 80% of time is DB query
    await sendMetric("database_query_duration_seconds", dbQueryDuration, {
      query_type: "users_query",
    });

    console.log(
      `✅ Request ${requestNumber}: ${duration.toFixed(
        2
      )}s, Users: ${userCount}, DB Query: ${dbQueryDuration.toFixed(2)}s`
    );

    return {
      success: true,
      duration,
      userCount,
      dbQueryDuration,
      status: response.status,
    };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    const errorMessage = error.response?.status || error.message;

    // Send error metrics
    await sendMetric("api_response_duration_seconds", duration, {
      endpoint: "/api/users",
      method: "GET",
      status: "error",
    });

    await sendMetric("api_requests_total", 1, {
      endpoint: "/api/users",
      method: "GET",
      status: "error",
    });

    console.log(
      `❌ Request ${requestNumber}: Error after ${duration.toFixed(
        2
      )}s - ${errorMessage}`
    );

    return {
      success: false,
      duration,
      error: errorMessage,
      status: "error",
    };
  }
}

async function runBatch(startIndex) {
  const promises = [];
  const endIndex = Math.min(startIndex + CONCURRENT_REQUESTS, TOTAL_REQUESTS);

  for (let i = startIndex; i < endIndex; i++) {
    promises.push(makeRequest(i + 1));
  }

  return Promise.all(promises);
}

async function generateDatabaseMetrics() {
  console.log("🚀 Starting Database Query Metrics Generation");
  console.log(`📊 Target: ${TOTAL_REQUESTS} requests to /api/users`);
  console.log(`⚡ Concurrency: ${CONCURRENT_REQUESTS} requests per batch`);
  console.log(`📈 Metrics will be sent to Prometheus/Grafana`);
  console.log("=".repeat(60));

  const results = [];

  for (
    let batch = 0;
    batch < Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS);
    batch++
  ) {
    const startIndex = batch * CONCURRENT_REQUESTS;
    console.log(
      `\n🔄 Batch ${batch + 1}: Requests ${startIndex + 1}-${Math.min(
        startIndex + CONCURRENT_REQUESTS,
        TOTAL_REQUESTS
      )}`
    );

    const batchResults = await runBatch(startIndex);
    results.push(...batchResults);

    // Wait between batches
    if (batch < Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS) - 1) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_BATCHES)
      );
    }
  }

  // Analyze results
  console.log("\n" + "=".repeat(60));
  console.log("📊 Database Query Metrics Results:");
  console.log("=".repeat(60));

  const successfulResults = results.filter((r) => r.success);
  const failedResults = results.filter((r) => !r.success);

  if (successfulResults.length > 0) {
    const durations = successfulResults.map((r) => r.duration);
    const dbQueryDurations = successfulResults.map((r) => r.dbQueryDuration);
    const userCounts = successfulResults.map((r) => r.userCount);

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const avgDbQueryDuration =
      dbQueryDurations.reduce((a, b) => a + b, 0) / dbQueryDurations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const avgUserCount =
      userCounts.reduce((a, b) => a + b, 0) / userCounts.length;

    console.log(
      `📈 Success Rate: ${successfulResults.length}/${TOTAL_REQUESTS} (${(
        (successfulResults.length / TOTAL_REQUESTS) *
        100
      ).toFixed(1)}%)`
    );
    console.log(`⏱️  API Response Time:`);
    console.log(`   - Average: ${avgDuration.toFixed(2)}s`);
    console.log(`   - Min: ${minDuration.toFixed(2)}s`);
    console.log(`   - Max: ${maxDuration.toFixed(2)}s`);
    console.log(`🗄️  Database Query Time:`);
    console.log(`   - Average: ${avgDbQueryDuration.toFixed(2)}s`);
    console.log(
      `   - Percentage of API time: ${(
        (avgDbQueryDuration / avgDuration) *
        100
      ).toFixed(1)}%`
    );
    console.log(`👥 User Data:`);
    console.log(`   - Average users returned: ${avgUserCount.toFixed(0)}`);

    // Performance analysis
    console.log(`🎯 Performance Analysis:`);
    if (avgDbQueryDuration < 1) {
      console.log(`   - ✅ Excellent database performance (< 1s average)`);
    } else if (avgDbQueryDuration < 5) {
      console.log(
        `   - ⚠️  Moderate database performance (1-5s average) - needs optimization`
      );
    } else {
      console.log(
        `   - ❌ Poor database performance (> 5s average) - requires query optimization`
      );
    }
  }

  if (failedResults.length > 0) {
    console.log(`❌ Failed requests: ${failedResults.length}`);
    failedResults.forEach((r, i) => {
      console.log(`   - Request ${i + 1}: ${r.error}`);
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Database query metrics generation completed!");
  console.log("📊 Metrics sent to Prometheus/Grafana:");
  console.log("   - api_response_duration_seconds");
  console.log("   - api_requests_total");
  console.log("   - database_query_duration_seconds");
  console.log("💡 Check Grafana dashboard for database query performance");
  console.log("🔍 Look for panels:");
  console.log("   - Database Query Duration - /api/users");
  console.log("   - Database Query 95th Percentile - /api/users");
  console.log("   - Database Query Count - /api/users");
}

// Run the script
generateDatabaseMetrics().catch(console.error);
