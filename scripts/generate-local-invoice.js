/* eslint-disable @typescript-eslint/no-require-imports */
const postgres = require("postgres");
const dotenv = require("dotenv");
const { generateLocalInvoicePdfForOrder } = require("../lib/invoice-service");

dotenv.config({ path: ".env.local" });

const orderId = process.argv[2];
const outputPath = process.argv[3];

if (!orderId) {
    console.error("Usage: node scripts/generate-local-invoice.js <order-id>");
    process.exit(1);
}

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
    ssl: "require",
});

(async () => {
    const result = await generateLocalInvoicePdfForOrder(sql, orderId, outputPath ? { outputPath } : {});
    console.log(`Invoice ${result.invoiceNumber} created at ${result.outputPath}`);
})()
    .catch((error) => {
        console.error("Failed to generate invoice:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sql.end();
    });
