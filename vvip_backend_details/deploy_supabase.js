const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const root = __dirname;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

function getIncludes(mainFile) {
  const content = fs.readFileSync(mainFile, "utf8");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("\\i "))
    .map((line) => line.slice(3).trim());
}

async function runFile(client, fileName) {
  const filePath = path.join(root, fileName);
  const sql = fs.readFileSync(filePath, "utf8");
  console.log(`Applying ${fileName}`);
  try {
    await client.query(sql);
  } catch (error) {
    error.message = `${fileName}: ${error.message}`;
    throw error;
  }
}

async function main() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const includes = getIncludes(path.join(root, "main.txt"));

  const resetSql = `
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
SET search_path TO public, extensions;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        GRANT USAGE ON SCHEMA public TO anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT USAGE ON SCHEMA public TO authenticated;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT USAGE ON SCHEMA public TO service_role;
        GRANT ALL ON SCHEMA public TO service_role;
    END IF;
END
$$;
`;

  const expectedTables = [
    "app_users",
    "user_addresses",
    "product_categories",
    "products",
    "user_product_prices",
    "staff_members",
    "permissions",
    "staff_permissions",
    "orders",
    "order_items",
    "order_status_history",
    "work_orders",
    "invoices",
    "invoice_items",
    "payments",
    "payment_status_history",
    "receipts",
    "guest_feedback",
  ];

  await client.connect();

  try {
    console.log("Connected. Dropping and recreating public schema.");
    await client.query("BEGIN");
    await client.query(resetSql);

    for (const include of includes) {
      await runFile(client, include);
    }

    await client.query("COMMIT");
    console.log("Schema deployment committed.");

    const result = await client.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1)
      ORDER BY table_name
      `,
      [expectedTables],
    );

    const found = new Set(result.rows.map((row) => row.table_name));
    const missing = expectedTables.filter((tableName) => !found.has(tableName));

    console.log(`Verified ${result.rowCount}/${expectedTables.length} expected tables.`);
    if (missing.length > 0) {
      console.error(`Missing tables: ${missing.join(", ")}`);
      process.exitCode = 2;
    }
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // Ignore rollback errors and report the original failure.
    }

    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();

