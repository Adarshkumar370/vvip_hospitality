const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text");
    await client.query("ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS password_hash text");
    await client.query("ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'online_gateway'");
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'chk_products_image_url'
            AND conrelid = 'public.products'::regclass
        ) THEN
          ALTER TABLE public.products
          ADD CONSTRAINT chk_products_image_url
          CHECK (image_url IS NULL OR length(btrim(image_url)) > 0);
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'chk_staff_members_password_hash'
            AND conrelid = 'public.staff_members'::regclass
        ) THEN
          ALTER TABLE public.staff_members
          ADD CONSTRAINT chk_staff_members_password_hash
          CHECK (password_hash IS NULL OR length(btrim(password_hash)) > 0);
        END IF;
      END
      $$;
    `);
    await client.query("COMMIT");
    console.log("Live schema patch applied");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
