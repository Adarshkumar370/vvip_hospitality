const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
});

async function migrateDbV5() {
    console.log("Starting DB Migration V5 (Order Payments)...");
    try {
        await sql`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
            ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
            ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
            ADD COLUMN IF NOT EXISTS delivery_address_id INTEGER REFERENCES addresses(id);
        `;
        console.log("✅ Payment columns and address reference added to orders table.");

        console.log("🚀 Migration V5 complete.");
    } catch (err) {
        console.error("❌ Migration V5 failed:", err);
    } finally {
        process.exit();
    }
}

migrateDbV5();
