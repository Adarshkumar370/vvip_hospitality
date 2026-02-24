import postgres from "postgres";

// Basic connection setup
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn("DATABASE_URL is not defined in environment variables. Database operations will fail.");
}

// Singleton pattern to prevent multiple connections during hot-reloading in dev
const globalForSql = global as unknown as { sql: ReturnType<typeof postgres> };

const sql = globalForSql.sql || postgres(connectionString as string, {
    ssl: "require",
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

if (process.env.NODE_ENV !== "production") globalForSql.sql = sql;

export default sql;
