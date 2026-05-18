/* eslint-disable @typescript-eslint/no-require-imports */
const postgres = require("postgres");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
    ssl: "require",
});

(async () => {
    await sql`
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('invoices', 'invoices', true, 5242880, ARRAY['application/pdf'])
        ON CONFLICT (id) DO UPDATE
        SET public = true,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types
    `;

    await sql`
        ALTER TABLE invoices
        ADD COLUMN IF NOT EXISTS invoice_pdf_bucket TEXT,
        ADD COLUMN IF NOT EXISTS invoice_pdf_key TEXT,
        ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT,
        ADD COLUMN IF NOT EXISTS invoice_pdf_uploaded_at TIMESTAMPTZ
    `;

    await sql`
        CREATE INDEX IF NOT EXISTS idx_invoices_invoice_pdf_key
        ON invoices (invoice_pdf_key)
        WHERE invoice_pdf_key IS NOT NULL
    `;

    console.log("Invoice PDF storage columns ensured.");
})()
    .catch((error) => {
        console.error("Failed to migrate invoice PDF storage columns:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sql.end();
    });
