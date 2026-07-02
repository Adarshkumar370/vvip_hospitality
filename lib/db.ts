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

const client = globalForSql.sql || postgres(connectionString as string, {
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

if (process.env.NODE_ENV !== "production") globalForSql.sql = client;

// The DB host (Supabase/Railway) pauses when idle, so the first query after a cold
// start hits Postgres mid-boot and fails with 57P03 ("the database system is
// starting up"). That window is usually a few seconds, so retrying with backoff
// rides it out instead of surfacing a false failure. Transactions (sql.begin) are
// intentionally left unwrapped since retrying multi-statement side effects isn't safe.
const COLD_START_RETRY_DELAYS_MS = [500, 1500, 3000];

function isColdStartError(err: unknown) {
    return typeof err === "object" && err !== null && (err as { code?: string }).code === "57P03";
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const sql = new Proxy(client, {
    apply(target, thisArg, args) {
        return (async () => {
            for (let attempt = 0; ; attempt++) {
                try {
                    return await Reflect.apply(target, thisArg, args);
                } catch (err) {
                    if (attempt >= COLD_START_RETRY_DELAYS_MS.length || !isColdStartError(err)) throw err;
                    await sleep(COLD_START_RETRY_DELAYS_MS[attempt]);
                }
            }
        })();
    },
}) as typeof client;

export default sql;
