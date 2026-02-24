import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    forcePathStyle: true,
    region: "ap-south-1", // Supabase storage is regional, this is a placeholder but often required
    endpoint: process.env.SUPABASE_S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "",
    },
});

export default s3Client;
