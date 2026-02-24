require("dotenv").config({ path: ".env.local" });
const sql = require("./lib/db").default;

async function initDb() {
    console.log("Initializing database...");
    try {
        await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        name TEXT,
        email TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log("✅ Users table ensured.");
    } catch (err) {
        console.error("❌ Error initializing database:", err);
    } finally {
        process.exit();
    }
}

initDb();
