require("dotenv").config({ path: ".env.local" });
const sql = require("./lib/db").default;

async function migrateDbV2() {
    console.log("Starting DB Migration V2 (Categories & Product Metadata)...");
    try {
        // 1. Create categories table
        await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log("✅ Categories table ensured.");

        // 2. Add description and unit to products table
        await sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'per piece';
    `;
        console.log("✅ Product table columns added.");

        // 3. Seed initial categories from existing products
        const existingProducts = await sql`SELECT DISTINCT category FROM products`;
        for (const p of existingProducts) {
            await sql`
        INSERT INTO categories (name)
        VALUES (${p.category})
        ON CONFLICT (name) DO NOTHING
      `;
        }
        console.log("✅ Initial categories seeded from existing products.");

        console.log("🚀 Migration V2 complete.");
    } catch (err) {
        console.error("❌ Migration V2 failed:", err);
    } finally {
        process.exit();
    }
}

migrateDbV2();
