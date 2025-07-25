const { Pool } = require("pg");
const crypto = require("crypto");
const { faker } = require("@faker-js/faker");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

// Database configuration for initial connection (without specific database)
const initialPool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: "postgres", // Connect to default postgres database first
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

// Database configuration for workshop_db
const workshopPool = new Pool({
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

// Simple hash function to replace bcrypt
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const divisions = ["HR", "Tech", "Finance", "Ops"];

const roles = ["admin", "user", "moderator", "editor", "viewer"];

const actions = [
  "login",
  "logout",
  "update_profile",
  "create_user",
  "delete_user",
  "view_users",
  "export_data",
];

function generateRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function generateIndonesianUserWithFaker(index) {
  // Generate realistic Indonesian user data with faker
  const fullName = faker.person.fullName();
  const baseUsername = faker.internet.username({
    firstName: fullName.split(" ")[0],
  });
  const username = `${baseUsername}_${index}`;

  // Generate a base email username and domain
  const baseEmailUser = baseUsername.toLowerCase();
  const domain = faker.helpers.arrayElement([
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "yandex.com",
  ]);
  const email = `${baseEmailUser}.${index}@${domain}`;

  // All users have password: User123@
  const password = "User123@";

  const birthDate = faker.date.birthdate({ min: 18, max: 65, mode: "age" });

  // Generate realistic Indonesian bio
  const bio = faker.lorem.sentence({ min: 10, max: 20 });
  const longBio = faker.lorem.paragraphs({ min: 2, max: 4 });

  // Generate comprehensive profile JSON
  const profileJson = {
    social_media: {
      instagram: faker.internet.username(),
      twitter: `@${faker.internet.username()}`,
      linkedin: faker.internet.username(),
    },
    preferences: {
      theme: faker.helpers.arrayElement(["light", "dark"]),
      language: "id",
      notifications: faker.datatype.boolean(),
    },
    skills: faker.helpers.arrayElements(
      [
        "JavaScript",
        "React",
        "Node.js",
        "PostgreSQL",
        "Python",
        "Java",
        "TypeScript",
        "Vue.js",
        "Angular",
        "MongoDB",
        "MySQL",
        "Docker",
        "Kubernetes",
        "AWS",
        "Azure",
        "Git",
        "Docker",
        "Jenkins",
        "Jira",
      ],
      { min: 3, max: 6 }
    ),
    interests: faker.helpers.arrayElements(
      [
        "Technology",
        "Music",
        "Sports",
        "Travel",
        "Cooking",
        "Reading",
        "Photography",
        "Gaming",
        "Fitness",
        "Art",
        "Movies",
        "Nature",
      ],
      { min: 2, max: 4 }
    ),
    personal_data: {
      nationality: "Indonesian",
      religion: faker.helpers.arrayElement([
        "Islam",
        "Kristen",
        "Katolik",
        "Hindu",
        "Buddha",
      ]),
      marital_status: faker.helpers.arrayElement([
        "single",
        "married",
        "divorced",
      ]),
      children: faker.number.int({ min: 0, max: 4 }),
    },
    education: {
      degree: faker.helpers.arrayElement(["S1", "S2", "S3", "D3"]),
      major: faker.helpers.arrayElement([
        "Computer Science",
        "Engineering",
        "Business",
        "Arts",
        "Medicine",
        "Law",
      ]),
      university: faker.helpers.arrayElement([
        "UI",
        "ITB",
        "UGM",
        "IPB",
        "ITS",
        "UNPAD",
        "UNDIP",
        "UNS",
      ]),
    },
    work_info: {
      department: faker.helpers.arrayElement(divisions),
      position: faker.helpers.arrayElement([
        "Junior",
        "Senior",
        "Lead",
        "Manager",
        "Director",
      ]),
      join_date: faker.date.past({ years: 5 }).toISOString().split("T")[0],
    },
  };

  // Generate Indonesian phone number (ensure it fits in VARCHAR(20))
  const phoneNumber = `+62${faker.number.int({
    min: 800000000,
    max: 899999999,
  })}`;

  // Generate Indonesian address
  const address =
    faker.location.streetAddress({ useFullAddress: true }) +
    ", " +
    faker.location.city() +
    ", " +
    faker.location.state();

  return {
    username,
    fullName,
    email,
    password,
    birthDate: birthDate.toISOString().split("T")[0],
    bio,
    longBio,
    profileJson,
    phoneNumber,
    address,
  };
}

async function createDatabase() {
  console.time("Database Creation");

  try {
    // Step 1: Check if database exists and handle gracefully
    console.log("🔍 Checking if database exists...");
    let databaseExists = false;

    try {
      const result = await initialPool.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        ["workshop_db"]
      );
      databaseExists = result.rows.length > 0;

      if (databaseExists) {
        console.log(
          "✅ Database workshop_db already exists - proceeding with table creation and seeding"
        );
      } else {
        console.log("📝 Creating database workshop_db...");
        await initialPool.query("CREATE DATABASE workshop_db");
        console.log("✅ Database workshop_db created successfully");
      }
    } catch {
      console.log("📝 Creating database workshop_db...");
      await initialPool.query("CREATE DATABASE workshop_db");
      console.log("✅ Database workshop_db created successfully");
    }

    // Close initial pool and use workshop pool
    await initialPool.end();

    // Step 2: Create auth table
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
    await workshopPool.query(createAuthTableQuery);
    console.log("✅ Auth table created/verified");

    // Step 3: Create users table (updated structure)
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
    await workshopPool.query(createUsersTableQuery);
    console.log("✅ Users table created/verified");

    // Step 4: Create user_roles table
    console.log("📋 Creating user_roles table...");
    const createUserRolesTableQuery = `
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await workshopPool.query(createUserRolesTableQuery);
    console.log("✅ User roles table created/verified");

    // Step 5: Create user_logs table
    console.log("📋 Creating user_logs table...");
    const createUserLogsTableQuery = `
      CREATE TABLE IF NOT EXISTS user_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await workshopPool.query(createUserLogsTableQuery);
    console.log("✅ User logs table created/verified");

    // Step 6: Create user_divisions table
    console.log("📋 Creating user_divisions table...");
    const createUserDivisionsTableQuery = `
      CREATE TABLE IF NOT EXISTS user_divisions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        division_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await workshopPool.query(createUserDivisionsTableQuery);
    console.log("✅ User divisions table created/verified");

    // Step 7: Clear existing data
    console.log("🧹 Clearing existing data...");
    await workshopPool.query("DELETE FROM user_divisions");
    await workshopPool.query("DELETE FROM user_logs");
    await workshopPool.query("DELETE FROM user_roles");
    await workshopPool.query("DELETE FROM users");
    await workshopPool.query("DELETE FROM auth");
    console.log("✅ Cleared existing data");

    // Step 8: Generate and insert 10,000 users + 3 fixed accounts
    console.log("👥 Generating 10,000 Indonesian users with faker...");
    const users = [];

    // Add 3 fixed accounts first
    const fixedAccounts = [
      {
        username: "aku123",
        fullName: "Aku User",
        email: "aku123@gmail.com",
        password: "password123",
        birthDate: "1990-01-01",
        bio: "Fixed account for testing",
        longBio:
          "This is a fixed account created for testing purposes. User with email aku123@gmail.com and password password123.",
        profileJson: {
          social_media: {
            instagram: "aku123",
            twitter: "@aku123",
            linkedin: "aku123",
          },
          preferences: {
            theme: "light",
            language: "id",
            notifications: true,
          },
          skills: ["Testing", "Development"],
          interests: ["Technology", "Testing"],
        },
        phoneNumber: "+6281234567890",
        address: "Jl. Testing No. 123, Jakarta",
      },
      {
        username: "kamu123",
        fullName: "Kamu User",
        email: "kamu123@yopmail.com",
        password: "password123",
        birthDate: "1992-05-15",
        bio: "Fixed account for testing",
        longBio:
          "This is a fixed account created for testing purposes. User with email kamu123@yopmail.com and password password123.",
        profileJson: {
          social_media: {
            instagram: "kamu123",
            twitter: "@kamu123",
            linkedin: "kamu123",
          },
          preferences: {
            theme: "dark",
            language: "id",
            notifications: false,
          },
          skills: ["Testing", "QA"],
          interests: ["Quality Assurance", "Testing"],
        },
        phoneNumber: "+6281234567891",
        address: "Jl. Testing No. 456, Bandung",
      },
      {
        username: "user123",
        fullName: "User Test",
        email: "user123@test.com",
        password: "password123",
        birthDate: "1988-12-20",
        bio: "Fixed account for testing",
        longBio:
          "This is a fixed account created for testing purposes. User with email user123@test.com and password password123.",
        profileJson: {
          social_media: {
            instagram: "user123",
            twitter: "@user123",
            linkedin: "user123",
          },
          preferences: {
            theme: "light",
            language: "id",
            notifications: true,
          },
          skills: ["Development", "Testing"],
          interests: ["Programming", "Technology"],
        },
        phoneNumber: "+6281234567892",
        address: "Jl. Testing No. 789, Surabaya",
      },
    ];

    // Add fixed accounts to users array
    users.push(...fixedAccounts);

    // Generate 10,000 users with faker
    for (let i = 0; i < 10000; i++) {
      users.push(generateIndonesianUserWithFaker(i));
    }

    // Step 9: Insert auth records first
    console.log("💾 Inserting auth records...");
    const authInsertQuery = `
      INSERT INTO auth (email, password)
      VALUES ($1, $2)
      RETURNING id
    `;

    const authIds = [];
    for (const user of users) {
      const passwordHash = hashPassword(user.password);
      const result = await workshopPool.query(authInsertQuery, [
        user.email,
        passwordHash,
      ]);
      authIds.push(result.rows[0].id);
    }

    // Step 10: Insert users with auth_id reference
    console.log("💾 Inserting users...");
    const userInsertQuery = `
      INSERT INTO users (auth_id, full_name, username, birth_date, bio, long_bio, profile_json, address, phone_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const userIds = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // Add NULL and DUPLICATE variations for testing
      let bio = user.bio;
      let address = user.address;
      let phoneNumber = user.phoneNumber;
      let profileJson = user.profileJson;

      // Randomly set some fields to NULL (10% chance)
      if (Math.random() < 0.1) bio = null;
      if (Math.random() < 0.1) address = null;
      if (Math.random() < 0.1) phoneNumber = null;
      if (Math.random() < 0.1) profileJson = null;

      // Randomly duplicate some data (5% chance)
      if (Math.random() < 0.05 && i > 0) {
        bio = users[i - 1].bio;
        address = users[i - 1].address;
        phoneNumber = users[i - 1].phoneNumber;
        profileJson = users[i - 1].profileJson;
      }

      const result = await workshopPool.query(userInsertQuery, [
        authIds[i],
        user.fullName,
        user.username,
        user.birthDate,
        bio,
        user.longBio,
        JSON.stringify(profileJson),
        address,
        phoneNumber,
      ]);
      userIds.push(result.rows[0].id);
    }

    // Step 11: Insert user roles
    console.log("💾 Inserting user roles...");
    const roleInsertQuery = `
      INSERT INTO user_roles (user_id, role)
      VALUES ($1, $2)
    `;

    for (let i = 0; i < userIds.length; i++) {
      const role = roles[Math.floor(Math.random() * roles.length)];
      await workshopPool.query(roleInsertQuery, [userIds[i], role]);
    }

    // Step 12: Insert user divisions
    console.log("💾 Inserting user divisions...");
    const divisionInsertQuery = `
      INSERT INTO user_divisions (user_id, division_name)
      VALUES ($1, $2)
    `;

    for (let i = 0; i < userIds.length; i++) {
      const division = divisions[Math.floor(Math.random() * divisions.length)];
      await workshopPool.query(divisionInsertQuery, [userIds[i], division]);
    }

    // Step 13: Insert user logs
    console.log("💾 Inserting user logs...");

    for (let i = 0; i < userIds.length; i++) {
      // Generate 1-5 random logs per user
      const logCount = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < logCount; j++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const randomDate = generateRandomDate(new Date(2023, 0, 1), new Date());

        await workshopPool.query(
          `
          INSERT INTO user_logs (user_id, action, created_at)
          VALUES ($1, $2, $3)
        `,
          [userIds[i], action, randomDate]
        );
      }
    }

    console.log(
      `✅ Successfully seeded ${users.length} users (10,000 faker + 3 fixed accounts)`
    );
    console.log("✅ All users have password: User123@");
    console.log("✅ Fixed accounts created:");
    console.log("   - aku123@gmail.com / password123");
    console.log("   - kamu123@yopmail.com / password123");
    console.log("   - user123@test.com / password123");
    console.log("✅ Database structure updated for sessions 11 & 12");
    console.log("✅ Added NULL and DUPLICATE variations for testing");
    console.log("✅ Database setup completed successfully!");
    console.timeEnd("Database Creation");
  } catch (error) {
    console.error("❌ Database creation error:", error);
    console.timeEnd("Database Creation");
    process.exit(1);
  } finally {
    await workshopPool.end();
  }
}

// Run the database creation
createDatabase();
