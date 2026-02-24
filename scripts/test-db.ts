import "dotenv/config";
import sql from "../lib/db";

async function testConnection() {
    console.log("Attempting to connect to PostgreSQL...");
    try {
        const result = await sql`SELECT 1 as connected`;
        if (result && result[0] && result[0].connected === 1) {
            console.log("✅ Success! Successfully connected to the database.");
        } else {
            console.log("❌ Failed! Unexpected result from the database.");
        }
    } catch (error) {
        console.error("❌ Error! Could not connect to the database:");
        console.error(error);
    } finally {
        await sql.end();
        process.exit();
    }
}

testConnection();
