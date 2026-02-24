const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
});

async function migrateDbV4() {
    console.log("Starting DB Migration V4 (User Addresses)...");
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS addresses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_name TEXT NOT NULL,
                receiver_phone TEXT NOT NULL,
                address_line1 TEXT NOT NULL,
                address_line2 TEXT,
                city TEXT NOT NULL DEFAULT 'Delhi',
                pincode TEXT NOT NULL,
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("✅ Addresses table ensured.");

        console.log("🚀 Migration V4 complete.");
    } catch (err) {
        console.error("❌ Migration V4 failed:", err);
    } finally {
        process.exit();
    }
}

migrateDbV4();
