const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "workshop_db",
  password: process.env.DB_PASSWORD || "admin123",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function addPerformanceIndexes() {
  const client = await pool.connect();
  
  try {
    console.log("🚀 Starting performance index creation...");
    
    // Start transaction
    await client.query("BEGIN");
    
    // Check existing indexes
    const checkIndexQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'auth', 'user_roles', 'user_divisions')
      ORDER BY tablename, indexname;
    `;
    
    const existingIndexes = await client.query(checkIndexQuery);
    console.log("\n📊 Existing indexes:");
    existingIndexes.rows.forEach(row => {
      console.log(`  - ${row.tablename}.${row.indexname}`);
    });
    
    // Create indexes for foreign key columns
    console.log("\n🔨 Creating foreign key indexes...");
    
    // Index on users.auth_id for JOIN with auth table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_auth_id 
      ON users(auth_id);
    `);
    console.log("✅ Created index: idx_users_auth_id");
    
    // Index on user_roles.user_id for JOIN with users table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
      ON user_roles(user_id);
    `);
    console.log("✅ Created index: idx_user_roles_user_id");
    
    // Index on user_divisions.user_id for JOIN with users table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_divisions_user_id 
      ON user_divisions(user_id);
    `);
    console.log("✅ Created index: idx_user_divisions_user_id");
    
    // Create covering indexes for better performance
    console.log("\n🔨 Creating covering indexes...");
    
    // Covering index for user_roles (includes role column)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
      ON user_roles(user_id) 
      INCLUDE (role);
    `);
    console.log("✅ Created covering index: idx_user_roles_lookup");
    
    // Covering index for user_divisions (includes division_name column)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_divisions_lookup 
      ON user_divisions(user_id) 
      INCLUDE (division_name);
    `);
    console.log("✅ Created covering index: idx_user_divisions_lookup");
    
    // Additional index for division filtering (/api/users?division=Tech)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_divisions_division_name 
      ON user_divisions(division_name);
    `);
    console.log("✅ Created index: idx_user_divisions_division_name");
    
    // Index for username lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username 
      ON users(username);
    `);
    console.log("✅ Created index: idx_users_username");
    
    // Commit transaction
    await client.query("COMMIT");
    
    // Analyze tables to update statistics
    console.log("\n📊 Analyzing tables to update statistics...");
    await client.query("ANALYZE users;");
    await client.query("ANALYZE auth;");
    await client.query("ANALYZE user_roles;");
    await client.query("ANALYZE user_divisions;");
    
    // Show final index list
    const finalIndexes = await client.query(checkIndexQuery);
    console.log("\n✨ Final index list:");
    finalIndexes.rows.forEach(row => {
      console.log(`  - ${row.tablename}.${row.indexname}`);
    });
    
    // Test query performance
    console.log("\n🧪 Testing query performance...");
    
    // Test single user query
    console.time("Single user query");
    const userResult = await client.query(`
      SELECT 
        u.id,
        u.username,
        u.full_name,
        a.email,
        ur.role,
        ud.division_name
      FROM users u
      LEFT JOIN auth a ON u.auth_id = a.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
      WHERE u.id = 1
      LIMIT 1;
    `);
    console.timeEnd("Single user query");
    
    // Test division filter query
    console.time("Division filter query");
    const divisionResult = await client.query(`
      SELECT COUNT(*) 
      FROM users u
      JOIN user_divisions ud ON u.id = ud.user_id
      WHERE ud.division_name = 'Tech';
    `);
    console.timeEnd("Division filter query");
    console.log(`Found ${divisionResult.rows[0].count} users in Tech division`);
    
    console.log("\n✅ All indexes created successfully!");
    console.log("🎉 Database performance optimization complete!");
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating indexes:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
addPerformanceIndexes()
  .then(() => {
    console.log("\n👋 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });