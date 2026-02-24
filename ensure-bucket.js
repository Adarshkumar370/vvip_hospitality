require("dotenv").config({ path: ".env.local" });
const sql = require("./lib/db").default;

async function ensureBucket() {
    console.log("Ensuring storage bucket exists...");
    try {
        await sql`
            INSERT INTO storage.buckets (id, name, public)
            VALUES ('product-images', 'product-images', true)
            ON CONFLICT (id) DO NOTHING
        `;
        console.log("✅ Storage bucket 'product-images' ensured.");
    } catch (err) {
        console.error("❌ Failed to ensure storage bucket:", err.message);
        console.log("Note: This might be normal if the storage schema isn't present or permissions are restricted.");
    } finally {
        process.exit();
    }
}

ensureBucket();
