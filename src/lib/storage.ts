import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "trustbridge-evidence";
const s3Bucket = process.env.STORAGE_BUCKET;
const s3Endpoint = process.env.STORAGE_ENDPOINT;

export const storageProvider = supabaseUrl && supabaseKey ? "supabase" : "s3";
export const storageConfigured =
  storageProvider === "supabase" ||
  Boolean(s3Bucket && process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY);

const s3Client = storageConfigured && storageProvider === "s3" ? new S3Client({
  region: process.env.STORAGE_REGION ?? "auto",
  endpoint: s3Endpoint || undefined,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY as string,
  },
}) : null;

function supabaseHeaders() {
  return {
    Authorization: `Bearer ${supabaseKey}`,
    apikey: supabaseKey as string,
    "Content-Type": "application/json",
  };
}

async function supabaseSignedPath(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${supabaseUrl}/storage/v1${path}`, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as {
    signedURL?: string;
    url?: string;
    message?: string;
  };
  const signed = data.signedURL ?? data.url;
  if (!response.ok || !signed) {
    throw new Error(data.message ?? "Supabase Storage did not return a signed URL.");
  }
  return `${supabaseUrl}/storage/v1${signed}`;
}

export async function createUploadUrl(key: string, contentType: string) {
  if (storageProvider === "supabase") {
    return supabaseSignedPath(
      `/object/upload/sign/${encodeURIComponent(supabaseBucket)}/${key}`,
      {},
    );
  }
  if (!s3Client || !s3Bucket) throw new Error("Evidence storage is not configured");
  return getSignedUrl(
    s3Client,
    new PutObjectCommand({ Bucket: s3Bucket, Key: key, ContentType: contentType }),
    { expiresIn: 600 },
  );
}

export async function createDownloadUrl(key: string) {
  if (storageProvider === "supabase") {
    return supabaseSignedPath(
      `/object/sign/${encodeURIComponent(supabaseBucket)}/${key}`,
      { expiresIn: 300 },
    );
  }
  if (!s3Client || !s3Bucket) throw new Error("Evidence storage is not configured");
  return getSignedUrl(s3Client, new GetObjectCommand({ Bucket: s3Bucket, Key: key }), { expiresIn: 300 });
}
