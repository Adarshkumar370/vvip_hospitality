require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL is not defined");
    process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

async function setup() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS user_prices (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                price INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id)
            )
        `;
        console.log('user_prices table created or already exists.');

        // Also add a helper to update updated_at if it's a common pattern, 
        // but for now simple setup is enough.

        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
}

setup();
