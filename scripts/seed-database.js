const { Pool } = require("pg");
const crypto = require("crypto");

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "workshop_db",
  password: process.env.DB_PASSWORD || "password",
  port: parseInt(process.env.DB_PORT || "5432"),
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
    "Wahyu",
    "Yanto",
    "Zainal",
    "Ade",
    "Bambang",
    "Cecep",
    "Darmawan",
    "Edy",
    "Firman",
    "Gatot",
    "Hendra",
    "Iwan",
    "Jaya",
    "Kartika",
    "Lukas",
    "Mulyadi",
    "Nugraha",
    "Oki",
    "Purnama",
    "Rahmat",
    "Samsul",
    "Taufik",
    "Udin",
    "Wawan",
    "Yusuf",
    "Asep",
    "Bakti",
    "Cahya",
    "Doni",
    "Erik",
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
    "Putri",
    "Rini",
    "Sukiyem",
    "Tika",
    "Umi",
    "Vina",
    "Wati",
    "Yani",
    "Zahra",
    "Aisyah",
    "Bunga",
    "Citra",
    "Dinda",
    "Eva",
    "Fina",
    "Gadis",
    "Hilda",
    "Indri",
    "Juwita",
    "Kartini",
    "Lestari",
    "Murni",
    "Nurul",
    "Oktavia",
    "Puspita",
    "Ratna",
    "Saminem",
    "Tuti",
    "Uswah",
    "Vivi",
    "Widya",
    "Yulia",
    "Zahira",
    "Aida",
    "Bella",
    "Cinta",
    "Dara",
    "Elsa",
    "Fika",
    "Gina",
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
    "Siregar",
    "Nasution",
    "Lubis",
    "Harahap",
    "Siregar",
    "Nasution",
    "Lubis",
    "Harahap",
    "Siregar",
    "Nasution",
    "Ginting",
    "Tarigan",
    "Sembiring",
    "Sinaga",
    "Sitepu",
    "Purba",
    "Saragih",
    "Sianturi",
    "Manurung",
    "Sitorus",
    "Simanjuntak",
    "Sihombing",
    "Panggabean",
    "Silitonga",
    "Sihotang",
    "Samosir",
    "Situmorang",
    "Sibagariang",
    "Siboro",
    "Sihite",
    "Siahaan",
    "Simatupang",
    "Siregar",
    "Nasution",
    "Lubis",
    "Harahap",
    "Siregar",
    "Nasution",
    "Lubis",
    "Harahap",
  ],
};

const indonesianBios = [
  "Suka ngopi di warung kopi tradisional",
  "Pecinta kuliner Indonesia",
  "Hobi main badminton di lapangan dekat rumah",
  "Suka nonton wayang kulit",
  "Pecinta musik dangdut",
  "Hobi berkebun di halaman rumah",
  "Suka masak rendang dan sate",
  "Pecinta batik dan budaya tradisional",
  "Hobi main catur di warung kopi",
  "Suka jalan-jalan ke pasar tradisional",
  "Pecinta kerajinan tangan",
  "Hobi memancing di sungai",
  "Suka nonton sinetron Indonesia",
  "Pecinta makanan pedas",
  "Hobi berkumpul dengan keluarga besar",
  "Suka main gitar dan nyanyi lagu daerah",
  "Pecinta tanaman hias",
  "Hobi memasak untuk keluarga",
  "Suka nonton pertandingan sepak bola",
  "Pecinta wisata kuliner",
  "Hobi berkebun sayuran",
  "Suka main kartu dengan tetangga",
  "Pecinta lagu-lagu lawas Indonesia",
  "Hobi membuat kerajinan dari bambu",
  "Suka nonton wayang golek",
  "Pecinta makanan tradisional",
  "Hobi berkumpul di pos ronda",
  "Suka main domino dengan teman",
  "Pecinta budaya Sunda",
  "Hobi membuat batik tulis",
  "Suka nonton pertunjukan wayang",
  "Pecinta makanan Betawi",
  "Hobi berkebun bunga",
  "Suka main angklung",
  "Pecinta lagu-lagu keroncong",
  "Hobi membuat kerajinan dari kayu",
  "Suka nonton pertunjukan tari tradisional",
  "Pecinta makanan Padang",
  "Hobi berkumpul di masjid",
  "Suka main gamelan",
  "Pecinta budaya Jawa",
  "Hobi membuat kerajinan dari tanah liat",
  "Suka nonton pertunjukan ludruk",
  "Pecinta makanan Manado",
  "Hobi berkebun buah-buahan",
  "Suka main kendang",
  "Pecinta lagu-lagu daerah",
  "Hobi membuat kerajinan dari rotan",
  "Suka nonton pertunjukan lenong",
  "Pecinta makanan Aceh",
  "Hobi berkumpul di balai desa",
  "Suka main suling",
  "Pecinta budaya Minang",
  "Hobi membuat kerajinan dari kulit",
];

const domains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "yandex.com",
];

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

  const username = `${firstName.toLowerCase()}${Math.floor(
    Math.random() * 999
  )}`;
  const email = `${username}@${
    domains[Math.floor(Math.random() * domains.length)]
  }`;

  // All users have password: User123@
  const password = "User123@";

  const birthDate = generateRandomDate(
    new Date(1960, 0, 1),
    new Date(2005, 11, 31)
  );
  const bio = indonesianBios[Math.floor(Math.random() * indonesianBios.length)];

  return {
    username,
    fullName,
    email,
    password,
    birthDate: birthDate.toISOString().split("T")[0],
    bio,
  };
}

async function seedDatabase() {
  console.time("Database Seeding");

  try {
    // Create users table if not exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        birth_date DATE,
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createTableQuery);
    console.log("Users table created/verified");

    // Clear existing data
    await pool.query("DELETE FROM users");
    console.log("Cleared existing users");

    // Generate and insert 1000 users
    const users = [];
    for (let i = 0; i < 1000; i++) {
      users.push(generateIndonesianUser(i));
    }

    // Hash passwords and insert users
    const insertQuery = `
      INSERT INTO users (username, full_name, email, password_hash, birth_date, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const user of users) {
      const passwordHash = hashPassword(user.password);
      await pool.query(insertQuery, [
        user.username,
        user.fullName,
        user.email,
        passwordHash,
        user.birthDate,
        user.bio,
      ]);
    }

    console.log(`Successfully seeded ${users.length} Indonesian users`);
    console.log("All users have password: User123@");
    console.timeEnd("Database Seeding");
  } catch (error) {
    console.error("Seeding error:", error);
    console.timeEnd("Database Seeding");
  } finally {
    await pool.end();
  }
}

// Run the seeder
seedDatabase();
