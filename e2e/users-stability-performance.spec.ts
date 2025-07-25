import { test, expect } from "@playwright/test";

async function sendMetric(
  baseUrl: string,
  metricName: string,
  value: number,
  labels: Record<string, string> = {}
) {
  try {
    const response = await fetch(`${baseUrl}/api/metrics/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metric: metricName,
        value: value,
        labels: labels,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error(`Error sending metric ${metricName}:`, error);
    return false;
  }
}

async function loginUser(page: any, baseUrl: string) {
  console.log("🔐 Logging in user...");

  // Go to login page
  await page.goto(`${baseUrl}/login`);

  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"]');
  await page.waitForSelector('input[type="password"]');

  // Fill login form with demo credentials
  await page.fill('input[type="email"]', "aku123@gmail.com"); // Use fixed test account
  await page.fill('input[type="password"]', "password123");

  // Submit login form
  await page.click('button[type="submit"]');

  // Wait a bit for the request to process
  await page.waitForTimeout(3000);

  // Check if login was successful
  const currentUrl = page.url();
  if (currentUrl.includes("/users")) {
    console.log("✅ Login successful, redirected to /users");
  } else {
    console.log(`⚠️  Login may have failed. Current URL: ${currentUrl}`);
    // Take screenshot for debugging
    await page.screenshot({ path: "performance-test-login-error.png" });
    throw new Error("Login failed - not redirected to /users page");
  }
}

test("Performance Test with Metrics: buka halaman /users 20x dan kirim metrics ke Prometheus", async ({
  page,
}) => {
  test.setTimeout(3600000); // 1 jam

  const baseUrl = "http://localhost:3000";
  const results: Array<{
    iteration: number;
    loadTime: number;
    userCount: number;
    status: "success" | "error";
    error?: string;
  }> = [];

  console.log("🚀 Starting Performance Test with Metrics - 20 iterations");
  console.log("📊 Metrics will be sent to Prometheus/Grafana");
  console.log("=".repeat(60));

  // Login first before running performance tests
  await loginUser(page, baseUrl);

  for (let i = 1; i <= 20; i++) {
    console.log(`🔄 Iterasi ke-${i}: Loading halaman /users...`);

    const startTime = Date.now();

    try {
      // Buka halaman users dan ukur waktu
      await page.goto("http://localhost:3000/users", {
        waitUntil: "domcontentloaded", // Tunggu sampai DOM selesai load (tidak tunggu network)
        timeout: 600000, // 10 menit timeout untuk query yang sangat lamban (workshop demo)
      });

      const loadTime = Date.now() - startTime;

      // Tunggu sampai ada konten users di halaman
      const selectors = [
        "table tbody tr", // Table rows
        '[data-testid="user-item"]', // Test ID
        ".user-item", // CSS class
        '[class*="user"]', // Partial class
        "li", // List items
        'div[class*="card"]', // Card elements
      ];

      let userElements = 0;
      let usedSelector = "";

      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          userElements = await page.locator(selector).count();
          if (userElements > 0) {
            usedSelector = selector;
            break;
          }
        } catch {
          // Continue to next selector
        }
      }

      // Fallback: cek apakah ada text yang menunjukkan ada users
      if (userElements === 0) {
        const pageText = await page.textContent("body");
        if (
          pageText &&
          (pageText.includes("user") ||
            pageText.includes("User") ||
            pageText.includes("@"))
        ) {
          userElements = 1; // At least some user data is present
          usedSelector = "text-content";
        }
      }

      // Send metrics to Prometheus
      const loadTimeSeconds = loadTime / 1000; // Convert to seconds

      // Send page load time metric
      await sendMetric(
        baseUrl,
        "e2e_page_load_duration_seconds",
        loadTimeSeconds,
        {
          page: "users",
          test_type: "playwright",
          iteration: i.toString(),
        }
      );

      // Send user count metric
      await sendMetric(baseUrl, "e2e_user_count", userElements, {
        page: "users",
        test_type: "playwright",
        iteration: i.toString(),
      });

      // Send test iteration metric
      await sendMetric(baseUrl, "e2e_test_iteration_total", 1, {
        page: "users",
        test_type: "playwright",
        status: "success",
      });

      // Log progress setiap 10 iterasi
      if (i % 10 === 0) {
        console.log(
          `✅ Iterasi ke-${i}: Load time: ${loadTime}ms, Users: ${userElements} (selector: ${usedSelector}) - Metrics sent to Prometheus`
        );
      } else {
        console.log(
          `✅ Iterasi ke-${i}: Load time: ${loadTime}ms, Users: ${userElements} - Metrics sent`
        );
      }

      results.push({
        iteration: i,
        loadTime,
        userCount: userElements,
        status: "success",
      });

      // Validasi minimal ada data
      expect(userElements).toBeGreaterThan(0);

      // Tunggu sebentar sebelum iterasi berikutnya
      await page.waitForTimeout(2000);
    } catch (error: unknown) {
      const loadTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Send error metrics
      const loadTimeSeconds = loadTime / 1000;

      await sendMetric(
        baseUrl,
        "e2e_page_load_duration_seconds",
        loadTimeSeconds,
        {
          page: "users",
          test_type: "playwright",
          iteration: i.toString(),
          status: "error",
        }
      );

      await sendMetric(baseUrl, "e2e_test_iteration_total", 1, {
        page: "users",
        test_type: "playwright",
        status: "error",
        error: errorMessage,
      });

      console.log(
        `❌ Iterasi ke-${i}: Error after ${loadTime}ms - ${errorMessage} - Error metrics sent`
      );

      results.push({
        iteration: i,
        loadTime,
        userCount: 0,
        status: "error",
        error: errorMessage,
      });

      throw error;
    }
  }

  // Analisis hasil
  console.log("=".repeat(60));
  console.log("📊 Performance Test Results:");
  console.log("=".repeat(60));

  const successfulResults = results.filter((r) => r.status === "success");
  const failedResults = results.filter((r) => r.status === "error");

  if (successfulResults.length > 0) {
    const loadTimes = successfulResults.map((r) => r.loadTime);
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    const minLoadTime = Math.min(...loadTimes);
    const maxLoadTime = Math.max(...loadTimes);

    // Send summary metrics
    await sendMetric(
      baseUrl,
      "e2e_test_summary_avg_load_time_seconds",
      avgLoadTime / 1000,
      {
        page: "users",
        test_type: "playwright",
        metric_type: "average",
      }
    );

    await sendMetric(
      baseUrl,
      "e2e_test_summary_min_load_time_seconds",
      minLoadTime / 1000,
      {
        page: "users",
        test_type: "playwright",
        metric_type: "minimum",
      }
    );

    await sendMetric(
      baseUrl,
      "e2e_test_summary_max_load_time_seconds",
      maxLoadTime / 1000,
      {
        page: "users",
        test_type: "playwright",
        metric_type: "maximum",
      }
    );

    await sendMetric(
      baseUrl,
      "e2e_test_summary_success_rate",
      (successfulResults.length / 20) * 100,
      {
        page: "users",
        test_type: "playwright",
        metric_type: "success_rate",
      }
    );

    console.log(
      `📈 Success Rate: ${successfulResults.length}/${results.length} (${(
        (successfulResults.length / results.length) *
        100
      ).toFixed(1)}%)`
    );
    console.log(`⏱️  Page Load Time:`);
    console.log(`   - Average: ${avgLoadTime.toFixed(2)}ms`);
    console.log(`   - Min: ${minLoadTime.toFixed(2)}ms`);
    console.log(`   - Max: ${maxLoadTime.toFixed(2)}ms`);

    // Performance analysis
    console.log(`🎯 Performance Analysis:`);
    if (avgLoadTime < 1000) {
      console.log(`   - ✅ Excellent performance (< 1s average)`);
    } else if (avgLoadTime < 3000) {
      console.log(
        `   - ⚠️  Moderate performance (1-3s average) - needs optimization`
      );
    } else {
      console.log(
        `   - ❌ Poor performance (> 3s average) - requires optimization`
      );
    }
  }

  if (failedResults.length > 0) {
    console.log(`❌ Failed iterations: ${failedResults.length}`);
    failedResults.forEach((r, i) => {
      console.log(`   - Iteration ${r.iteration}: ${r.error}`);
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Performance test completed!");
  console.log("📊 Metrics sent to Prometheus/Grafana:");
  console.log("   - e2e_page_load_duration_seconds");
  console.log("   - e2e_user_count");
  console.log("   - e2e_test_iteration_total");
  console.log("   - e2e_test_summary_*");
  console.log("💡 Check Grafana dashboard for E2E performance data");
  console.log("🔍 Look for panels:");
  console.log("   - E2E Page Load Duration - /users");
  console.log("   - E2E Test Success Rate");
  console.log("   - E2E User Count - /users");
});
