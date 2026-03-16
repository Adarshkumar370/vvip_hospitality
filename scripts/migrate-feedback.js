const { execSync } = require('child_process');
const fs = require('fs');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.error("No DATABASE_URL found in environment variables.");
        process.exit(1);
    }
    
    console.log("Connecting to database...");
    const sql = postgres(connectionString, { ssl: "require" });
    
    try {
        const query = fs.readFileSync('./lib/migrations/create_feedback_table.sql', 'utf8');
        console.log("Executing query...");
        await sql.unsafe(query);
        console.log("Table 'guest_feedback' created successfully!");
        process.exit(0);
    } catch (e) {
        console.error("Error creating table:", e);
        process.exit(1);
    }
}

runMigration();
