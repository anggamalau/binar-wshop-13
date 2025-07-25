const axios = require("axios");

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendMetric(baseUrl, metricName, value, labels = {}) {
  try {
    const response = await axios.post(
      `${baseUrl}/api/metrics/record`,
      {
        metric: metricName,
        value: value,
        labels: labels,
      },
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return response.status === 200;
  } catch (error) {
    console.error(`Error sending metric ${metricName}:`, error.message);
    return false;
  }
}

async function testEndpointAndRecordMetrics(baseUrl, endpoint, method = "GET") {
  const startTime = Date.now();

  try {
    const response = await axios({
      method,
      url: `${baseUrl}${endpoint}`,
      timeout: 600000, // 10 minutes for very heavy queries (workshop demo)
      headers: { "Content-Type": "application/json" },
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds

    // Send API response time metric
    await sendMetric(baseUrl, "api_response_duration_seconds", duration, {
      method: method,
      route: endpoint,
      status_code: response.status.toString(),
      endpoint_type: "api",
    });

    // Send API request count metric
    await sendMetric(baseUrl, "api_requests_total", 1, {
      method: method,
      route: endpoint,
      status_code: response.status.toString(),
      endpoint_type: "api",
    });

    return {
      success: true,
      duration: duration,
      status: response.status,
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Send error metrics
    await sendMetric(baseUrl, "api_response_duration_seconds", duration, {
      method: method,
      route: endpoint,
      status_code: error.response?.status?.toString() || "0",
      endpoint_type: "api",
    });

    await sendMetric(baseUrl, "api_requests_total", 1, {
      method: method,
      route: endpoint,
      status_code: error.response?.status?.toString() || "0",
      endpoint_type: "api",
    });

    return {
      success: false,
      duration: duration,
      error: error.message,
      status: error.response?.status || "NETWORK_ERROR",
    };
  }
}

async function generateApiMetrics() {
  console.log("🚀 Starting API Metrics Generation for Prometheus/Grafana...\n");

  const baseUrl = "http://localhost:3000";
  const testConfig = {
    totalRequests: 20,
    concurrentRequests: 3, // Reduced for metrics generation
    delayBetweenBatches: 2000, // 2 seconds between batches
    endpoints: [
      { path: "/api/users", method: "GET", name: "Users API" },
      { path: "/api/metrics", method: "GET", name: "Metrics API" },
    ],
  };

  let totalMetricsSent = 0;
  let totalRequests = 0;

  console.log(`📊 Metrics Generation Configuration:`);
  console.log(`   - Total Requests: ${testConfig.totalRequests}`);
  console.log(`   - Concurrent Requests: ${testConfig.concurrentRequests}`);
  console.log(`   - Endpoints: ${testConfig.endpoints.length}`);
  console.log(`   - Base URL: ${baseUrl}`);
  console.log(`   - Metrics will be sent to: ${baseUrl}/api/metrics/record\n`);

  // Test each endpoint
  for (const endpoint of testConfig.endpoints) {
    console.log(
      `🎯 Generating metrics for ${endpoint.name} (${endpoint.method} ${endpoint.path})`
    );

    let endpointSuccess = 0;
    let endpointFailed = 0;

    // Make requests in batches
    for (
      let batch = 0;
      batch <
      Math.ceil(testConfig.totalRequests / testConfig.concurrentRequests);
      batch++
    ) {
      const batchPromises = [];

      // Create concurrent requests for this batch
      for (let i = 0; i < testConfig.concurrentRequests; i++) {
        const requestNumber = batch * testConfig.concurrentRequests + i + 1;
        if (requestNumber <= testConfig.totalRequests) {
          batchPromises.push(
            testEndpointAndRecordMetrics(
              baseUrl,
              endpoint.path,
              endpoint.method
            ).then((result) => {
              totalRequests++;

              if (result.success) {
                endpointSuccess++;
                console.log(
                  `   ✅ Request ${requestNumber}/${
                    testConfig.totalRequests
                  } - ${result.duration.toFixed(3)}s (Status: ${result.status})`
                );
              } else {
                endpointFailed++;
                console.log(
                  `   ❌ Request ${requestNumber}/${
                    testConfig.totalRequests
                  } - ${result.error} (${result.duration.toFixed(3)}s)`
                );
              }

              // Each request generates 2 metrics (duration + count)
              totalMetricsSent += 2;

              return result;
            })
          );
        }
      }

      // Wait for all requests in this batch to complete
      await Promise.all(batchPromises);

      // Delay between batches
      if (
        batch <
        Math.ceil(testConfig.totalRequests / testConfig.concurrentRequests) - 1
      ) {
        await delay(testConfig.delayBetweenBatches);
      }
    }

    console.log(`\n📊 ${endpoint.name} Metrics Generated:`);
    console.log(
      `   - Successful Requests: ${endpointSuccess}/${testConfig.totalRequests}`
    );
    console.log(
      `   - Failed Requests: ${endpointFailed}/${testConfig.totalRequests}`
    );
    console.log(
      `   - Metrics Sent: ${endpointSuccess * 2 + endpointFailed * 2}\n`
    );
  }

  console.log("🎉 API Metrics Generation Completed!");
  console.log("============================================================");
  console.log("📊 Summary:");
  console.log("============================================================");
  console.log(`📈 Total Requests: ${totalRequests}`);
  console.log(`📊 Total Metrics Sent: ${totalMetricsSent}`);
  console.log(`🎯 Metrics Types:`);
  console.log(`   - api_response_duration_seconds (response time)`);
  console.log(`   - api_requests_total (request count)`);
  console.log("============================================================");

  console.log("\n📈 Next Steps:");
  console.log("1. Check Prometheus at: http://localhost:9090");
  console.log("2. Query: api_response_duration_seconds");
  console.log("3. Check Grafana dashboard for updated data");
  console.log("4. Wait 1-2 minutes for data to appear in Grafana");

  console.log("\n🔗 Useful URLs:");
  console.log(`- Prometheus: http://localhost:9090`);
  console.log(`- Metrics Endpoint: ${baseUrl}/api/metrics`);
  console.log(`- Grafana Dashboard: Your Grafana Cloud URL`);

  return {
    totalRequests,
    totalMetricsSent,
    success: true,
  };
}

// Check if axios is available
try {
  require("axios");
  generateApiMetrics();
} catch (error) {
  console.log("📦 Installing axios...");
  const { execSync } = require("child_process");
  execSync("npm install axios", { stdio: "inherit" });
  console.log("✅ axios installed, running metrics generation...");
  generateApiMetrics();
}
