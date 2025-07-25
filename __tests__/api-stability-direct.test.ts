import { executeQuery } from "../src/lib/database";

describe("API Stability Test - Direct Database Query", () => {
  test("should handle 20 consecutive database queries with stable responses", async () => {
    const totalRequests = 20;
    const results: Array<{
      requestNumber: number;
      status: "success" | "error";
      responseTime: number;
      dataLength: number;
      error?: string;
    }> = [];

    console.log(
      `🚀 Starting stability test: ${totalRequests} database queries`
    );
    console.log("=".repeat(60));

    // Execute 20 database queries
    for (let i = 1; i <= totalRequests; i++) {
      const startTime = Date.now();

      try {
        // Direct database query (same as API but without NextRequest)
        const query = `
          SELECT 
            u.id,
            u.username,
            u.full_name,
            u.birth_date,
            u.bio,
            u.long_bio,
            u.profile_json,
            u.address,
            u.phone_number,
            u.created_at,
            u.updated_at,
            a.email,
            ur.role,
            ud.division_name
          FROM users u
          LEFT JOIN auth a ON u.auth_id = a.id
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          LEFT JOIN user_divisions ud ON u.id = ud.user_id
          ORDER BY u.created_at DESC
        `;

        const result = await executeQuery(query);
        const responseTime = Date.now() - startTime;
        const userCount = result.rows.length;

        results.push({
          requestNumber: i,
          status: "success",
          responseTime,
          dataLength: userCount,
        });

        // Log progress every 5 requests
        if (i % 5 === 0) {
          console.log(
            `✅ Query ${i}/${totalRequests} - Time: ${responseTime}ms, Users: ${userCount}`
          );
        }
      } catch (error: unknown) {
        const responseTime = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        results.push({
          requestNumber: i,
          status: "error",
          responseTime,
          dataLength: 0,
          error: errorMessage,
        });

        console.log(`❌ Query ${i}/${totalRequests} - Error: ${errorMessage}`);
      }
    }

    console.log("=".repeat(60));
    console.log("📊 Test Results Summary:");
    console.log("=".repeat(60));

    // Analyze results
    const successfulRequests = results.filter((r) => r.status === "success");
    const failedRequests = results.filter((r) => r.status === "error");
    const responseTimes = successfulRequests.map((r) => r.responseTime);
    const dataLengths = successfulRequests.map((r) => r.dataLength);

    // Calculate statistics
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const minResponseTime =
      responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime =
      responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    const avgDataLength =
      dataLengths.length > 0
        ? dataLengths.reduce((a, b) => a + b, 0) / dataLengths.length
        : 0;

    // Print statistics
    console.log(
      `📈 Success Rate: ${successfulRequests.length}/${totalRequests} (${(
        (successfulRequests.length / totalRequests) *
        100
      ).toFixed(2)}%)`
    );
    console.log(`❌ Failed Requests: ${failedRequests.length}`);

    if (successfulRequests.length > 0) {
      console.log(`⏱️  Response Time Statistics:`);
      console.log(`   - Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   - Min: ${minResponseTime}ms`);
      console.log(`   - Max: ${maxResponseTime}ms`);

      console.log(`📊 Data Length Statistics:`);
      console.log(`   - Average: ${avgDataLength.toFixed(2)} users`);
    }

    // Stability checks
    console.log("=".repeat(60));
    console.log("🔍 Stability Validation:");
    console.log("=".repeat(60));

    // Test 1: All successful requests should have data
    expect(successfulRequests.length).toBeGreaterThan(0);
    expect(successfulRequests.every((r) => r.dataLength > 0)).toBe(true);

    // Test 2: Response time should be reasonable (less than 5 minutes for bad query)
    expect(maxResponseTime).toBeLessThan(300000);

    // Test 3: Success rate should be high (at least 80%)
    const successRate = (successfulRequests.length / totalRequests) * 100;
    expect(successRate).toBeGreaterThanOrEqual(80);

    // Test 4: Data consistency - all responses should have similar user counts
    if (dataLengths.length > 1) {
      const dataLengthVariance =
        Math.max(...dataLengths) - Math.min(...dataLengths);
      expect(dataLengthVariance).toBeLessThanOrEqual(10); // Allow small variance
    }

    console.log(`✅ All stability checks passed!`);
    console.log(`🎯 Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`⚡ Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`📊 Consistent Data: ${dataLengths.length > 0 ? "Yes" : "No"}`);
  }, 600000); // 10 minute timeout for 20 requests
});
