const { Pool } = require("pg");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "workshop_db",
  password: process.env.DB_PASSWORD || "admin123",
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl:
    process.env.DB_HOST && process.env.DB_HOST !== "localhost"
      ? {
          rejectUnauthorized: false,
          require: true,
        }
      : false,
});

async function cleanUsersData() {
  console.time("Data Cleaning");
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query("BEGIN");
    console.log("🔧 Starting data cleanup...");

    // 1. Count initial records
    const initialCounts = await client.query(`
      SELECT 
        'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'auth', COUNT(*) FROM auth
      UNION ALL
      SELECT 'user_roles', COUNT(*) FROM user_roles
      UNION ALL
      SELECT 'user_logs', COUNT(*) FROM user_logs
      UNION ALL
      SELECT 'user_divisions', COUNT(*) FROM user_divisions
    `);
    
    console.log("\n📊 Initial record counts:");
    initialCounts.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.count} records`);
    });

    // 2. Identify users to be deleted (NULL values)
    console.log("\n🔍 Identifying users with NULL values...");
    const usersWithNulls = await client.query(`
      SELECT id FROM users 
      WHERE username IS NULL 
         OR full_name IS NULL
         OR bio IS NULL
         OR address IS NULL
         OR phone_number IS NULL
    `);
    const nullUserIds = usersWithNulls.rows.map(row => row.id);
    console.log(`   Found ${nullUserIds.length} users with NULL values`);

    // 3. Identify duplicate usernames (keep the one with lowest id)
    console.log("\n🔍 Identifying duplicate usernames...");
    const duplicateUsernames = await client.query(`
      SELECT u1.id FROM users u1
      WHERE EXISTS (
        SELECT 1 
        FROM users u2 
        WHERE u2.username = u1.username 
        AND u2.id < u1.id
      )
    `);
    const duplicateUsernameIds = duplicateUsernames.rows.map(row => row.id);
    console.log(`   Found ${duplicateUsernameIds.length} duplicate usernames`);

    // 4. Identify duplicate phone numbers (keep the one with lowest id)
    console.log("\n🔍 Identifying duplicate phone numbers...");
    const duplicatePhones = await client.query(`
      SELECT u1.id FROM users u1
      WHERE EXISTS (
        SELECT 1 
        FROM users u2 
        WHERE u2.phone_number = u1.phone_number 
        AND u2.id < u1.id
      )
    `);
    const duplicatePhoneIds = duplicatePhones.rows.map(row => row.id);
    console.log(`   Found ${duplicatePhoneIds.length} duplicate phone numbers`);

    // 5. Combine all user IDs to be deleted
    const allUserIdsToDelete = [...new Set([...nullUserIds, ...duplicateUsernameIds, ...duplicatePhoneIds])];
    console.log(`\n📋 Total unique users to delete: ${allUserIdsToDelete.length}`);

    if (allUserIdsToDelete.length === 0) {
      console.log("✅ No users need to be deleted - database is already clean!");
      await client.query("COMMIT");
      return;
    }

    // 6. Delete related records first (to avoid foreign key violations)
    console.log("\n🧹 Deleting related records for users to be removed...");
    
    const userIdsString = allUserIdsToDelete.join(',');
    
    const deletedRoles = await client.query(`
      DELETE FROM user_roles 
      WHERE user_id IN (${userIdsString})
      RETURNING id
    `);
    console.log(`   ✅ Deleted ${deletedRoles.rowCount} user_roles records`);

    const deletedLogs = await client.query(`
      DELETE FROM user_logs 
      WHERE user_id IN (${userIdsString})
      RETURNING id
    `);
    console.log(`   ✅ Deleted ${deletedLogs.rowCount} user_logs records`);

    const deletedDivisions = await client.query(`
      DELETE FROM user_divisions 
      WHERE user_id IN (${userIdsString})
      RETURNING id
    `);
    console.log(`   ✅ Deleted ${deletedDivisions.rowCount} user_divisions records`);

    // 7. Now delete the users
    console.log("\n🧹 Deleting users with NULL values and duplicates...");
    const deletedUsers = await client.query(`
      DELETE FROM users 
      WHERE id IN (${userIdsString})
      RETURNING id
    `);
    console.log(`   ✅ Deleted ${deletedUsers.rowCount} users`);

    // 8. Clean up remaining orphaned records
    console.log("\n🧹 Cleaning up any remaining orphaned records...");
    
    const orphanedRoles = await client.query(`
      DELETE FROM user_roles 
      WHERE user_id NOT IN (SELECT id FROM users)
      RETURNING id
    `);
    console.log(`   ✅ Removed ${orphanedRoles.rowCount} orphaned user_roles`);

    const orphanedLogs = await client.query(`
      DELETE FROM user_logs 
      WHERE user_id NOT IN (SELECT id FROM users)
      RETURNING id
    `);
    console.log(`   ✅ Removed ${orphanedLogs.rowCount} orphaned user_logs`);

    const orphanedDivisions = await client.query(`
      DELETE FROM user_divisions 
      WHERE user_id NOT IN (SELECT id FROM users)
      RETURNING id
    `);
    console.log(`   ✅ Removed ${orphanedDivisions.rowCount} orphaned user_divisions`);

    // Note: We need to get auth_ids from users table before deleting auth records
    const orphanedAuth = await client.query(`
      DELETE FROM auth 
      WHERE id NOT IN (SELECT auth_id FROM users WHERE auth_id IS NOT NULL)
      RETURNING id
    `);
    console.log(`   ✅ Removed ${orphanedAuth.rowCount} orphaned auth records`);

    // 6. Show final statistics
    const finalCounts = await client.query(`
      SELECT 
        'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'auth', COUNT(*) FROM auth
      UNION ALL
      SELECT 'user_roles', COUNT(*) FROM user_roles
      UNION ALL
      SELECT 'user_logs', COUNT(*) FROM user_logs
      UNION ALL
      SELECT 'user_divisions', COUNT(*) FROM user_divisions
    `);

    console.log("\n📊 Final record counts:");
    finalCounts.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.count} records`);
    });

    // Calculate total removed
    const totalRemoved = deletedUsers.rowCount;

    console.log(`\n🎉 Cleanup completed successfully!`);
    console.log(`   Total users removed: ${totalRemoved}`);
    console.log(`   Total orphaned records cleaned: ${
      orphanedRoles.rowCount + 
      orphanedLogs.rowCount + 
      orphanedDivisions.rowCount + 
      orphanedAuth.rowCount
    }`);

    // Commit transaction
    await client.query("COMMIT");
    console.log("\n✅ Transaction committed successfully");

  } catch (error) {
    // Rollback on error
    await client.query("ROLLBACK");
    console.error("\n❌ Error during cleanup:", error);
    console.error("⚠️  Transaction rolled back");
    throw error;
  } finally {
    client.release();
    console.timeEnd("Data Cleaning");
    await pool.end();
  }
}

// Run the cleanup
cleanUsersData().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});