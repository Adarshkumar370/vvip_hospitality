const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL is not defined");
    process.exit(1);
}

console.log("Testing connection to:", connectionString.split('@')[1]); // Log host only for safety

const sql = postgres(connectionString, {
    ssl: 'require',
    connect_timeout: 10
});

async function test() {
    try {
        const start = Date.now();
        const result = await sql`SELECT 1 as connected`;
        const latency = Date.now() - start;
        console.log("Successfully connected!");
        console.log("Result:", result);
        console.log("Latency:", latency + "ms");
        process.exit(0);
    } catch (err) {
        console.error("Connection failed!");
        console.error("Error Code:", err.code);
        console.error("Error Detail:", err.detail);
        console.error("Error Message:", err.message);
        console.error("Full Error:", JSON.stringify(err, null, 2));
        process.exit(1);
    }
}

test();
