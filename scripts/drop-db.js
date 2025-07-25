const { Pool } = require("pg");

// Database configuration for initial connection (without specific database)
const initialPool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: "postgres", // Connect to default postgres database first
  password: process.env.DB_PASSWORD || "admin123",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function dropDatabase() {
  console.time("Database Drop");

  try {
    console.log("🔍 Checking if database exists...");

    try {
      const result = await initialPool.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        ["workshop_db"]
      );

      if (result.rows.length > 0) {
        console.log("🗑️ Dropping database workshop_db...");

        // Terminate all connections to the database first
        await initialPool.query(`
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = 'workshop_db' AND pid <> pg_backend_pid()
        `);

        // Drop the database
        await initialPool.query("DROP DATABASE workshop_db");
        console.log("✅ Database workshop_db dropped successfully");
      } else {
        console.log("ℹ️ Database workshop_db does not exist - nothing to drop");
      }
    } catch (error) {
      console.log("ℹ️ Database workshop_db does not exist - nothing to drop");
    }

    console.log("✅ Database drop completed successfully!");
    console.timeEnd("Database Drop");
  } catch (error) {
    console.error("❌ Database drop error:", error);
    console.timeEnd("Database Drop");
    process.exit(1);
  } finally {
    await initialPool.end();
  }
}

// Run the database drop
dropDatabase();
