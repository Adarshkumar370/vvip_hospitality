import { S3Client } from "@aws-sdk/client-s3";

const requestTimeoutMs = getTimeoutMs("S3_REQUEST_TIMEOUT_MS", 15_000);
const connectionTimeoutMs = getTimeoutMs("S3_CONNECTION_TIMEOUT_MS", 5_000);

function getTimeoutMs(envName: string, fallbackMs: number) {
    const value = Number(process.env[envName]);
    return Number.isFinite(value) && value > 0 ? value : fallbackMs;
}

const s3Client = new S3Client({
    forcePathStyle: true,
    region: "ap-south-1", // Supabase storage is regional, this is a placeholder but often required
    endpoint: process.env.SUPABASE_S3_ENDPOINT,
    requestHandler: {
        connectionTimeout: connectionTimeoutMs,
        requestTimeout: requestTimeoutMs,
        socketTimeout: requestTimeoutMs,
    },
    credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "",
    },
});

export default s3Client;
