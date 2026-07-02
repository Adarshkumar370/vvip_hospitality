import postgres from "postgres";

// Basic connection setup
const connectionString = process.env.DATABASE_URL;
const statementTimeoutMs = getTimeoutMs("DB_STATEMENT_TIMEOUT_MS", 15_000);
const lockTimeoutMs = getTimeoutMs("DB_LOCK_TIMEOUT_MS", 5_000);
const idleTransactionTimeoutMs = getTimeoutMs("DB_IDLE_TRANSACTION_TIMEOUT_MS", 15_000);

if (!connectionString) {
    console.warn("DATABASE_URL is not defined in environment variables. Database operations will fail.");
}

function getTimeoutMs(envName: string, fallbackMs: number) {
    const value = Number(process.env[envName]);
    return Number.isFinite(value) && value > 0 ? value : fallbackMs;
}

// Singleton pattern to prevent multiple connections during hot-reloading in dev
const globalForSql = global as unknown as { sql: ReturnType<typeof postgres> };

const sql = globalForSql.sql || postgres(connectionString as string, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    connection: {
        statement_timeout: statementTimeoutMs,
        lock_timeout: lockTimeoutMs,
        idle_in_transaction_session_timeout: idleTransactionTimeoutMs,
    },
});

if (process.env.NODE_ENV !== "production") globalForSql.sql = sql;

export default sql;
