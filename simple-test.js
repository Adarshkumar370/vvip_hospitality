require("dotenv").config({ path: ".env.local" });
const postgres = require("postgres");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL is not defined.");
    process.exit(1);
}

const sql = postgres(connectionString, {
    ssl: "require",
    max: 1,
});

async function test() {
    console.log("Connecting to:", connectionString.replace(/:([^:@]+)@/, ":****@"));
    try {
        const result = await sql`SELECT 1 as connected`;
        console.log("✅ Database test successful:", result);
    } catch (err) {
        console.error("❌ Database test failed:", err);
    } finally {
        await sql.end();
        process.exit();
    }
}

test();
