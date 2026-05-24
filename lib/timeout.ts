export const DEFAULT_API_TIMEOUT_MS = getTimeoutMs("API_TIMEOUT_MS", 15_000);
export const EXTERNAL_API_TIMEOUT_MS = getTimeoutMs("EXTERNAL_API_TIMEOUT_MS", 12_000);
export const INVOICE_API_TIMEOUT_MS = getTimeoutMs("INVOICE_API_TIMEOUT_MS", 20_000);

export class AppTimeoutError extends Error {
    constructor(label: string, timeoutMs: number) {
        super(`${label} timed out after ${timeoutMs}ms`);
        this.name = "TimeoutError";
    }
}

export function getTimeoutMs(envName: string, fallbackMs: number) {
    const value = Number(process.env[envName]);
    return Number.isFinite(value) && value > 0 ? value : fallbackMs;
}

export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs = DEFAULT_API_TIMEOUT_MS,
    label = "Request"
) {
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
        return await Promise.race([
            promise,
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => reject(new AppTimeoutError(label, timeoutMs)), timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

export function isTimeoutError(err: unknown) {
    if (!err || typeof err !== "object") return false;

    const error = err as {
        name?: string;
        code?: string;
        message?: string;
        cause?: { code?: string; name?: string; message?: string };
    };
    const name = `${error.name || ""} ${error.cause?.name || ""}`.toLowerCase();
    const code = `${error.code || ""} ${error.cause?.code || ""}`.toUpperCase();
    const message = `${error.message || ""} ${error.cause?.message || ""}`.toLowerCase();

    return (
        name.includes("timeout") ||
        name.includes("abort") ||
        code.includes("ETIMEDOUT") ||
        code.includes("ECONNABORTED") ||
        message.includes("timed out") ||
        message.includes("timeout") ||
        message.includes("aborted")
    );
}

export function getSafeErrorMessage(err: unknown, fallback: string) {
    if (isTimeoutError(err)) {
        return "The request timed out. Please try again.";
    }

    return fallback;
}
