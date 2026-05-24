/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const postgres = require("postgres");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
    ssl: "require",
    connect_timeout: 10,
    connection: {
        statement_timeout: 15000,
        lock_timeout: 5000,
    },
});

(async () => {
    const query = fs.readFileSync("./lib/migrations/create_order_feedback_table.sql", "utf8");
    await sql.unsafe(query);
    console.log("Table 'order_feedback' and storage bucket ensured.");
})()
    .catch((error) => {
        console.error("Failed to migrate order feedback schema:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sql.end({ timeout: 5 });
    });
