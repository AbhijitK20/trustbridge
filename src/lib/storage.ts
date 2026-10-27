import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const bucket = process.env.STORAGE_BUCKET;
const endpoint = process.env.STORAGE_ENDPOINT;

export const storageConfigured = Boolean(bucket && process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY);

const client = storageConfigured ? new S3Client({
  region: process.env.STORAGE_REGION ?? "auto",
  endpoint: endpoint || undefined,
  credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY_ID as string, secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY as string },
}) : null;

export async function createUploadUrl(key: string, contentType: string) {
  if (!client || !bucket) throw new Error("Evidence storage is not configured");
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 600 });
}

export async function createDownloadUrl(key: string) {
  if (!client || !bucket) throw new Error("Evidence storage is not configured");
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 300 });
}
