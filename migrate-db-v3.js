const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
});

async function migrateDbV3() {
    console.log("Starting DB Migration V3 (Staff & Orders)...");
    try {
        // 1. Create staff table
        await sql`
            CREATE TABLE IF NOT EXISTS staff (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL DEFAULT 'baker',
                password TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("✅ Staff table ensured.");

        // 2. Create orders table
        await sql`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                total_price INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                acknowledged_by INTEGER REFERENCES staff(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("✅ Orders table ensured.");

        // 3. Create order_items table
        await sql`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price_at_time INTEGER NOT NULL
            );
        `;
        console.log("✅ Order Items table ensured.");

        console.log("🚀 Migration V3 complete.");
    } catch (err) {
        console.error("❌ Migration V3 failed:", err);
    } finally {
        process.exit();
    }
}

migrateDbV3();
