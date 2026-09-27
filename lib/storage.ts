import { createHash, createHmac } from "node:crypto";

// Listing photos live in Neon Object Storage, which branches with the
// database. The bucket is `public_read`, so photos are served straight from
// the bucket URL. Writes use the storage API with a branch-scoped Neon
// credential (storage:read + storage:write), signed below.

// Accepted upload types → file extension. No SVG: the bucket serves files
// publicly as-is, and an SVG can carry script.
export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export const PHOTO_KEY_RE = /^stock\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/;

// Photos sent with a sell-to-us enquiry go to a separate private bucket: they
// come from the public and are only for the team, so admins view them through
// an admin-gated route instead of a public URL.
export const MAX_ENQUIRY_PHOTOS = 6;
export const MAX_ENQUIRY_PHOTO_BYTES = 10 * 1024 * 1024;

export const ENQUIRY_PHOTO_KEY_RE =
  /^enquiries\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/;

interface StorageConfig {
  endpoint: string;
  region: string;
  keyId: string;
  secret: string;
}

function readConfig(): StorageConfig | null {
  const endpoint = process.env.NEON_STORAGE_ENDPOINT?.replace(/\/+$/, "");
  const region = process.env.NEON_STORAGE_REGION;
  const keyId = process.env.NEON_STORAGE_KEY_ID;
  const secret = process.env.NEON_STORAGE_SECRET;
  if (!endpoint || !region || !keyId || !secret) return null;
  return { endpoint, region, keyId, secret };
}

function bucketName(): string {
  return process.env.NEON_STORAGE_BUCKET || "stock-photos";
}

function enquiryBucketName(): string {
  return process.env.NEON_STORAGE_ENQUIRY_BUCKET || "enquiry-uploads";
}

export function isStorageConfigured(): boolean {
  return readConfig() !== null;
}

// Null when the storage endpoint isn't set, so pages render without photos
// instead of emitting broken URLs.
export function publicUrl(key: string): string | null {
  const endpoint = process.env.NEON_STORAGE_ENDPOINT?.replace(/\/+$/, "");
  return endpoint ? `${endpoint}/${bucketName()}/${key}` : null;
}

export function newPhotoKey(contentType: string): string {
  return `stock/${crypto.randomUUID()}.${PHOTO_TYPES[contentType]}`;
}

export function newEnquiryPhotoKey(contentType: string): string {
  return `enquiries/${crypto.randomUUID()}.${PHOTO_TYPES[contentType]}`;
}

// --- Request signing ------------------------------------------------------
// Neon Object Storage speaks the S3 protocol, which authenticates each request
// with a Signature Version 4 HMAC. The algorithm name, scope suffix and
// `x-amz-*` header names below are fixed by that protocol and can't be renamed.

function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

// RFC 3986 encoding, as the protocol requires (encodeURIComponent leaves !'()* alone).
function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function signRequest(
  config: Pick<StorageConfig, "region" | "keyId" | "secret">,
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: Uint8Array | string,
  now: Date = new Date(),
): Record<string, string> {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);

  const signed: Record<string, string> = {
    ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v.trim()])),
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  const names = Object.keys(signed).sort();
  const canonicalHeaders = names.map((n) => `${n}:${signed[n]}\n`).join("");
  const signedHeaders = names.join(";");

  const canonicalPath = url.pathname.split("/").map((s) => encodeRfc3986(decodeURIComponent(s))).join("/");
  const canonicalQuery = Array.from(url.searchParams.entries())
    .map(([k, v]) => [encodeRfc3986(k), encodeRfc3986(v)])
    .sort(([a, x], [b, y]) => (a === b ? (x < y ? -1 : 1) : a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const canonicalRequest = [method, canonicalPath, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join(
    "\n",
  );
  const scope = `${date}/${config.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");

  const signingKey = hmac(hmac(hmac(hmac(`AWS4${config.secret}`, date), config.region), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  // fetch sets Host itself from the URL; it's signed above, not sent from here.
  const sent = Object.fromEntries(Object.entries(signed).filter(([name]) => name !== "host"));
  return {
    ...sent,
    authorization: `AWS4-HMAC-SHA256 Credential=${config.keyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

async function storageRequest(
  bucket: string,
  method: string,
  key: string,
  headers: Record<string, string> = {},
  body: Uint8Array | string = "",
  unsignedHeaders: Record<string, string> = {},
) {
  const config = readConfig();
  if (!config) throw new Error("Neon storage is not configured — see .env.example");
  const url = new URL(`${config.endpoint}/${bucket}/${key}`);
  const response = await fetch(url, {
    method,
    headers: { ...unsignedHeaders, ...signRequest(config, method, url, headers, body) },
    body: method === "PUT" ? (body as BodyInit) : undefined,
  });
  if (!response.ok) {
    throw new Error(`Neon storage ${method} ${key} failed: ${response.status} ${await response.text()}`);
  }
  return response;
}

export async function putPhoto(key: string, body: Uint8Array, contentType: string): Promise<void> {
  await storageRequest(
    bucketName(),
    "PUT",
    key,
    { "content-type": contentType },
    body,
    // Keys are random and never overwritten, so the file can be cached forever.
    // Sent unsigned, as standard S3 clients do: servers treat cache-control
    // as unsignable.
    { "cache-control": "public, max-age=31536000, immutable" },
  );
}

// Best effort: a failed delete only leaves an orphaned file behind, which
// must never block saving or deleting the listing itself.
export async function deletePhotos(keys: string[]): Promise<void> {
  if (keys.length === 0 || !isStorageConfigured()) return;
  const results = await Promise.allSettled(keys.map((key) => storageRequest(bucketName(), "DELETE", key)));
  results.forEach((result, i) => {
    if (result.status === "rejected") console.error(`Deleting listing photo ${keys[i]} failed`, result.reason);
  });
}

export async function putEnquiryPhoto(key: string, body: Uint8Array, contentType: string): Promise<void> {
  await storageRequest(enquiryBucketName(), "PUT", key, { "content-type": contentType }, body);
}

// The caller streams the body back to an admin; the bucket itself is private.
export async function getEnquiryPhoto(key: string): Promise<Response> {
  return storageRequest(enquiryBucketName(), "GET", key);
}

// Best effort, like deletePhotos: never blocks deleting the enquiry.
export async function deleteEnquiryPhotos(keys: string[]): Promise<void> {
  if (keys.length === 0 || !isStorageConfigured()) return;
  const results = await Promise.allSettled(
    keys.map((key) => storageRequest(enquiryBucketName(), "DELETE", key)),
  );
  results.forEach((result, i) => {
    if (result.status === "rejected") console.error(`Deleting enquiry photo ${keys[i]} failed`, result.reason);
  });
}
