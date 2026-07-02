import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const requestTimeoutMs = getTimeoutMs("S3_REQUEST_TIMEOUT_MS", 15_000);
const connectionTimeoutMs = getTimeoutMs("S3_CONNECTION_TIMEOUT_MS", 5_000);

function getTimeoutMs(envName: string, fallbackMs: number) {
    const value = Number(process.env[envName]);
    return Number.isFinite(value) && value > 0 ? value : fallbackMs;
}

const s3Client = new S3Client({
    forcePathStyle: true,
    region: process.env.STORAGE_S3_REGION || "auto",
    endpoint: process.env.STORAGE_S3_ENDPOINT,
    requestHandler: {
        connectionTimeout: connectionTimeoutMs,
        requestTimeout: requestTimeoutMs,
        socketTimeout: requestTimeoutMs,
    },
    credentials: {
        accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY || "",
    },
});

function getSeconds(envName: string, fallbackSeconds: number) {
    const value = Number(process.env[envName]);
    return Number.isFinite(value) && value > 0 ? value : fallbackSeconds;
}

const presignedUrlTtlSeconds = getSeconds("STORAGE_S3_PRESIGN_TTL_SECONDS", 3_600);

// The bucket is private; this "public" URL is never fetched directly — it's a stable,
// parseable identifier stored in the DB and turned back into a presigned URL on read.
export function buildStorageIdentifierUrl(bucket: string, key: string) {
    const base = (process.env.STORAGE_S3_PUBLIC_URL || process.env.STORAGE_S3_ENDPOINT || "").replace(/\/$/, "");
    return `${base}/${bucket}/${key}`;
}

export function parseStorageIdentifierUrl(url: string): { bucket: string; key: string } | null {
    const base = (process.env.STORAGE_S3_PUBLIC_URL || process.env.STORAGE_S3_ENDPOINT || "").replace(/\/$/, "");
    if (!base || !url.startsWith(`${base}/`)) return null;

    const [bucket, ...keyParts] = url.slice(base.length + 1).split("/");
    if (!bucket || keyParts.length === 0) return null;

    return { bucket, key: keyParts.join("/") };
}

// A presigned URL is `{identifier}?X-Amz-...`; strip the query string to recover
// the stable identifier before persisting a client-submitted image URL to the DB.
export function stripPresignQuery(url: string) {
    const idx = url.indexOf("?");
    return idx === -1 ? url : url.slice(0, idx);
}

export async function getPresignedObjectUrl(bucket: string, key: string, expiresIn = presignedUrlTtlSeconds) {
    return getSignedUrl(s3Client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

// Resolves a stored identifier URL to a fresh presigned URL. Passes through anything
// that isn't one of our own identifiers (legacy/external URLs, local placeholder paths).
export async function toSignedUrl(url: string | null | undefined, expiresIn = presignedUrlTtlSeconds): Promise<string | null> {
    if (!url) return null;
    const parsed = parseStorageIdentifierUrl(url);
    if (!parsed) return url;
    return getPresignedObjectUrl(parsed.bucket, parsed.key, expiresIn);
}

export default s3Client;
