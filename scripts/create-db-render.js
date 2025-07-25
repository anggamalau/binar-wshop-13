const { Pool } = require("pg");
const crypto = require("crypto");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

// Log database configuration for debugging
console.log("🔧 Database Configuration:");
console.log("Host:", process.env.DB_HOST || "localhost");
console.log("Port:", process.env.DB_PORT || "5432");
console.log("User:", process.env.DB_USER || "postgres");
console.log("Database:", process.env.DB_NAME || "workshop_db");
console.log("Password:", process.env.DB_PASSWORD ? "***" : "admin123");
console.log(
  "SSL:",
  process.env.DB_HOST && process.env.DB_HOST !== "localhost"
    ? "Enabled"
    : "Disabled"
);

// Database configuration for Render with SSL
const renderPool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "workshop_db",
  password: process.env.DB_PASSWORD || "admin123",
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl:
    process.env.DB_HOST && process.env.DB_HOST !== "localhost"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

// Simple hash function to replace bcrypt
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Indonesian names and data for realistic user generation
const indonesianNames = {
  male: [
    "Ahmad",
    "Budi",
    "Candra",
    "Dedi",
    "Eko",
    "Fajar",
    "Gunawan",
    "Hadi",
    "Indra",
    "Joko",
    "Kusuma",
    "Lukman",
    "Maman",
    "Nugroho",
    "Oscar",
    "Prabowo",
    "Rudi",
    "Sukarno",
    "Tono",
    "Ujang",
  ],
  female: [
    "Siti",
    "Rina",
    "Dewi",
    "Nina",
    "Yuni",
    "Sari",
    "Maya",
    "Lina",
    "Dina",
    "Eka",
    "Fitri",
    "Gita",
    "Hani",
    "Indah",
    "Juli",
    "Kartika",
    "Lusi",
    "Mira",
    "Nia",
    "Oki",
  ],
  surnames: [
    "Saputra",
    "Wijaya",
    "Purnama",
    "Kusuma",
    "Nugraha",
    "Rahmat",
    "Surya",
    "Pratama",
    "Hidayat",
    "Wibowo",
  ],
};

const indonesianBios = [
  "Suka ngopi di warung kopi tradisional",
  "Pecinta kuliner Indonesia",
  "Hobi main badminton di lapangan dekat rumah",
  "Suka nonton wayang kulit",
  "Pecinta musik dangdut",
];

const domains = ["gmail.com", "yahoo.com", "hotmail.com"];
const divisions = ["Tech", "QA", "HR", "Marketing", "Finance"];
const roles = ["admin", "user", "moderator"];
const actions = ["login", "logout", "update_profile"];

function generateRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function generateIndonesianUser(index) {
  const isMale = Math.random() > 0.5;
  const firstName = isMale
    ? indonesianNames.male[
        Math.floor(Math.random() * indonesianNames.male.length)
      ]
    : indonesianNames.female[
        Math.floor(Math.random() * indonesianNames.female.length)
      ];

  const lastName =
    indonesianNames.surnames[
      Math.floor(Math.random() * indonesianNames.surnames.length)
    ];
  const fullName = `${firstName} ${lastName}`;
  const username = `${firstName.toLowerCase()}${index}${Math.floor(
    Math.random() * 999
  )}`;
  const email = `${username}@${
    domains[Math.floor(Math.random() * domains.length)]
  }`;
  const password = "User123@";
  const birthDate = generateRandomDate(
    new Date(1960, 0, 1),
    new Date(2005, 11, 31)
  );
  const bio = indonesianBios[Math.floor(Math.random() * indonesianBios.length)];
  const phoneNumber = `+62${Math.floor(Math.random() * 900000000) + 100000000}`;
  const address = `Jl. ${
    ["Mangga", "Jeruk", "Apel"][Math.floor(Math.random() * 3)]
  } No. ${Math.floor(Math.random() * 100) + 1}, Jakarta`;

  return {
    username,
    fullName,
    email,
    password,
    birthDate: birthDate.toISOString().split("T")[0],
    bio,
    phoneNumber,
    address,
  };
}

async function createDatabase() {
  console.time("Database Creation");

  try {
    console.log("🔍 Testing connection to Render database...");

    // Test connection first
    const testClient = await renderPool.connect();
    console.log("✅ Successfully connected to Render database!");
    testClient.release();

    // Step 1: Create auth table
    console.log("📋 Creating auth table...");
    const createAuthTableQuery = `
      CREATE TABLE IF NOT EXISTS auth (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await renderPool.query(createAuthTableQuery);
    console.log("✅ Auth table created/verified");

    // Step 2: Create users table
    console.log("📋 Creating users table...");
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        auth_id INTEGER REFERENCES auth(id),
        full_name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        birth_date DATE,
        bio TEXT,
        long_bio TEXT,
        profile_json JSON,
        address TEXT,
        phone_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await renderPool.query(createUsersTableQuery);
    console.log("✅ Users table created/verified");

    // Step 3: Create user_roles table
    console.log("📋 Creating user_roles table...");
    const createUserRolesTableQuery = `
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await renderPool.query(createUserRolesTableQuery);
    console.log("✅ User roles table created/verified");

    // Step 4: Create user_logs table
    console.log("📋 Creating user_logs table...");
    const createUserLogsTableQuery = `
      CREATE TABLE IF NOT EXISTS user_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await renderPool.query(createUserLogsTableQuery);
    console.log("✅ User logs table created/verified");

    // Step 5: Create user_divisions table
    console.log("📋 Creating user_divisions table...");
    const createUserDivisionsTableQuery = `
      CREATE TABLE IF NOT EXISTS user_divisions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        division_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await renderPool.query(createUserDivisionsTableQuery);
    console.log("✅ User divisions table created/verified");

    // Step 6: Clear existing data
    console.log("🧹 Clearing existing data...");
    await renderPool.query("DELETE FROM user_divisions");
    await renderPool.query("DELETE FROM user_logs");
    await renderPool.query("DELETE FROM user_roles");
    await renderPool.query("DELETE FROM users");
    await renderPool.query("DELETE FROM auth");
    console.log("✅ Cleared existing data");

    // Step 7: Generate and insert 100 users (reduced for Render)
    console.log("👥 Generating 100 Indonesian users...");
    const users = [];
    for (let i = 0; i < 100; i++) {
      users.push(generateIndonesianUser(i));
    }

    // Step 8: Insert auth records first
    console.log("💾 Inserting auth records...");
    const authInsertQuery = `
      INSERT INTO auth (email, password)
      VALUES ($1, $2)
      RETURNING id
    `;

    const authIds = [];
    for (const user of users) {
      const passwordHash = hashPassword(user.password);
      const result = await renderPool.query(authInsertQuery, [
        user.email,
        passwordHash,
      ]);
      authIds.push(result.rows[0].id);
    }

    // Step 9: Insert users
    console.log("💾 Inserting users...");
    const userInsertQuery = `
      INSERT INTO users (auth_id, full_name, username, birth_date, bio, address, phone_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const userIds = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const result = await renderPool.query(userInsertQuery, [
        authIds[i],
        user.fullName,
        user.username,
        user.birthDate,
        user.bio,
        user.address,
        user.phoneNumber,
      ]);
      userIds.push(result.rows[0].id);
    }

    // Step 10: Insert user roles
    console.log("💾 Inserting user roles...");
    const roleInsertQuery = `
      INSERT INTO user_roles (user_id, role)
      VALUES ($1, $2)
    `;

    for (let i = 0; i < userIds.length; i++) {
      const role = roles[Math.floor(Math.random() * roles.length)];
      await renderPool.query(roleInsertQuery, [userIds[i], role]);
    }

    // Step 11: Insert user divisions
    console.log("💾 Inserting user divisions...");
    const divisionInsertQuery = `
      INSERT INTO user_divisions (user_id, division_name)
      VALUES ($1, $2)
    `;

    for (let i = 0; i < userIds.length; i++) {
      const division = divisions[Math.floor(Math.random() * divisions.length)];
      await renderPool.query(divisionInsertQuery, [userIds[i], division]);
    }

    // Step 12: Insert user logs
    console.log("💾 Inserting user logs...");
    for (let i = 0; i < userIds.length; i++) {
      const logCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < logCount; j++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const randomDate = generateRandomDate(new Date(2023, 0, 1), new Date());
        await renderPool.query(
          `INSERT INTO user_logs (user_id, action, created_at) VALUES ($1, $2, $3)`,
          [userIds[i], action, randomDate]
        );
      }
    }

    console.log(`✅ Successfully seeded ${users.length} Indonesian users`);
    console.log("✅ All users have password: User123@");
    console.log("✅ Database setup completed successfully on Render!");
    console.timeEnd("Database Creation");
  } catch (error) {
    console.error("❌ Database creation error:", error);
    console.timeEnd("Database Creation");
    process.exit(1);
  } finally {
    await renderPool.end();
  }
}

// Run the database creation
createDatabase();
