// Using built-in fetch (available in Node.js 18+)
// No need to import fetch as it's globally available

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendMetric(baseUrl, componentName, page, renderTime) {
  try {
    const response = await fetch(`${baseUrl}/api/metrics/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metric: "react_component_render_duration_seconds",
        value: renderTime,
        labels: {
          component_name: componentName,
          page: page,
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error(`Error sending metric for ${componentName}:`, error.message);
    return false;
  }
}

async function generateConsistentReactData() {
  console.log("🚀 Generating Consistent React Metrics Data...\n");

  const baseUrl = "http://localhost:3000";
  const duration = 30 * 60 * 1000; // 30 minutes
  const interval = 5 * 1000; // 5 seconds
  const startTime = Date.now();

  console.log(`📊 Will generate data for ${duration / 1000 / 60} minutes`);
  console.log(`⏱️  Sending metrics every ${interval / 1000} seconds`);
  console.log(`🎯 Target components: UsersPage, UserCard`);

  let totalSent = 0;
  let totalFailed = 0;

  while (Date.now() - startTime < duration) {
    const currentTime = new Date().toLocaleTimeString();

    // Generate realistic render times
    const usersPageRenderTime = Math.random() * 0.05 + 0.01; // 0.01-0.06 seconds
    const userCardRenderTime = Math.random() * 0.03 + 0.005; // 0.005-0.035 seconds

    // Send UsersPage metric
    const usersPageSuccess = await sendMetric(
      baseUrl,
      "UsersPage",
      "users",
      usersPageRenderTime
    );
    if (usersPageSuccess) {
      totalSent++;
    } else {
      totalFailed++;
    }

    // Send multiple UserCard metrics (since there are multiple cards)
    const userCardCount = Math.floor(Math.random() * 5) + 1; // 1-5 cards
    for (let i = 0; i < userCardCount; i++) {
      const cardRenderTime = Math.random() * 0.03 + 0.005;
      const cardSuccess = await sendMetric(
        baseUrl,
        "UserCard",
        "users",
        cardRenderTime
      );
      if (cardSuccess) {
        totalSent++;
      } else {
        totalFailed++;
      }
    }

    console.log(
      `[${currentTime}] Sent ${
        userCardCount + 1
      } metrics (UsersPage: ${usersPageRenderTime.toFixed(
        3
      )}s, ${userCardCount} UserCards: ~${userCardRenderTime.toFixed(3)}s each)`
    );

    // Wait for next interval
    await delay(interval);
  }

  console.log("\n🎉 Data generation completed!");
  console.log(`📊 Total metrics sent: ${totalSent}`);
  console.log(`❌ Total failed: ${totalFailed}`);
  console.log(
    `✅ Success rate: ${((totalSent / (totalSent + totalFailed)) * 100).toFixed(
      1
    )}%`
  );

  console.log("\n📈 Next steps:");
  console.log("1. Check Grafana dashboard for consistent React metrics");
  console.log("2. Verify that data appears throughout the time range");
  console.log("3. Check that both UsersPage and UserCard components show data");

  console.log("\n🔗 Useful URLs:");
  console.log(`- Grafana Dashboard: Your Grafana Cloud URL`);
  console.log(`- Prometheus: http://localhost:9090`);
  console.log(`- Metrics: ${baseUrl}/api/metrics`);
}

// Run the data generation
generateConsistentReactData().catch(console.error);
