// One-time script: create/update admin user in staff_members
// Usage: node scripts/seed-admin.mjs
import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve } from "path";

const require = createRequire(import.meta.url);

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
try {
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
    }
} catch {
    console.warn(".env.local not found — relying on environment variables already set");
}

const bcrypt = require("bcryptjs");
const postgres = require("postgres");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set");
    process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

const EMAIL = "adarshkumar370@gmail.com";
const PASSWORD = "123456";
const NAME = "Adarsh Kumar";
const PHONE = "+919910412444";

async function run() {
    const passwordHash = await bcrypt.hash(PASSWORD, 12);

    const [existing] = await sql`
        SELECT id FROM staff_members WHERE email = ${EMAIL}
    `;

    if (existing) {
        await sql`
            UPDATE staff_members
            SET staff_name    = ${NAME},
                designation   = 'admin',
                password_hash = ${passwordHash},
                status        = 'active'
            WHERE id = ${existing.id}
        `;
        console.log(`Updated existing staff record (id=${existing.id}) → admin`);
    } else {
        const [created] = await sql`
            INSERT INTO staff_members (staff_name, email, mobile_no, designation, password_hash, status)
            VALUES (${NAME}, ${EMAIL}, ${PHONE}, 'admin', ${passwordHash}, 'active')
            RETURNING id
        `;
        console.log(`Created admin staff record (id=${created.id})`);
    }

    await sql.end();
    console.log("Done. Login with:", EMAIL, "/ 123456");
}

run().catch((err) => {
    console.error("Failed:", err.message);
    process.exit(1);
});
