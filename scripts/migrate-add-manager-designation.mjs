/**
 * One-time migration: add 'manager' to the staff_designation enum.
 *
 * Usage:
 *   node scripts/migrate-add-manager-designation.mjs
 */

import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set in .env.local");
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

    try {
        const existing = await sql`
            SELECT e.enumlabel
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'staff_designation'
            ORDER BY e.enumsortorder
        `;

        const labels = existing.map((row) => row.enumlabel);

        if (labels.includes("manager")) {
            console.log("staff_designation already includes 'manager'. Nothing to do.");
            await sql.end();
            return;
        }

        await sql`ALTER TYPE staff_designation ADD VALUE 'manager' BEFORE 'admin'`;
        console.log("Added 'manager' to staff_designation.");
    } catch (err) {
        console.error("Migration failed:", err instanceof Error ? err.message : err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
