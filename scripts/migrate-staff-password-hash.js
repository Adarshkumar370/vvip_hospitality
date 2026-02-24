/**
 * Migration: Rename staff.password → staff.password_hash
 *
 * Run ONCE after deploying the bcrypt password hashing fix.
 * Existing plaintext passwords will NOT work after this migration —
 * staff members will need their passwords reset by an admin.
 *
 * Usage:
 *   node scripts/migrate-staff-password-hash.js
 */

const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is not set in .env.local");
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

    try {
        console.log("🔄 Checking staff table columns...");

        // Check if migration has already been run
        const cols = await sql`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'staff'
        `;
        const colNames = cols.map((c) => c.column_name);

        if (colNames.includes("password_hash") && !colNames.includes("password")) {
            console.log("✅ Migration already applied. Nothing to do.");
            await sql.end();
            return;
        }

        if (!colNames.includes("password")) {
            console.error("❌ Neither 'password' nor 'password_hash' column found. Check your schema.");
            await sql.end();
            process.exit(1);
        }

        console.log("⚙️  Renaming column 'password' → 'password_hash'...");
        await sql`ALTER TABLE staff RENAME COLUMN password TO password_hash`;

        console.log("⚙️  Adding marker to indicate passwords are now invalid (require reset)...");
        // Prefix all existing plaintext passwords with 'PLAINTEXT:' so bcrypt.compare will fail safely
        await sql`UPDATE staff SET password_hash = CONCAT('NEEDS_RESET:', password_hash)`;

        console.log("✅ Migration complete.");
        console.log("");
        console.log("⚠️  ACTION REQUIRED: All existing staff passwords are now invalidated.");
        console.log("   An admin must reset each staff member's password through the admin panel.");
        console.log("   New passwords will be automatically stored as bcrypt hashes.");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
