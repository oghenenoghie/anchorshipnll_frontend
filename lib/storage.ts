import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Listing photos live in Neon Object Storage (S3-compatible, branches with the
// database). The bucket is `public_read`, so photos are served straight from
// the bucket URL; writes go through the S3 API with a branch-scoped credential.
// Env names are the AWS-standard ones Neon's credential export uses.

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

function endpoint(): string | undefined {
  return process.env.AWS_ENDPOINT_URL_S3?.replace(/\/+$/, "") || undefined;
}

function bucket(): string {
  return process.env.STORAGE_BUCKET || "stock-photos";
}

export function isStorageConfigured(): boolean {
  return Boolean(
    endpoint() && process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
  );
}

let cachedClient: S3Client | undefined;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  if (!isStorageConfigured()) {
    throw new Error("Object storage is not configured — see .env.example");
  }
  cachedClient = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: endpoint(),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
  return cachedClient;
}

// Null when the storage endpoint isn't set, so pages render without photos
// instead of emitting broken URLs.
export function publicUrl(key: string): string | null {
  const base = endpoint();
  return base ? `${base}/${bucket()}/${key}` : null;
}

export function newPhotoKey(contentType: string): string {
  return `stock/${crypto.randomUUID()}.${PHOTO_TYPES[contentType]}`;
}

export async function putPhoto(key: string, body: Uint8Array, contentType: string): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      // Keys are random and never overwritten, so the file can be cached forever.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

// Best effort: a failed delete only leaves an orphaned file behind, which
// must never block saving or deleting the listing itself.
export async function deletePhotos(keys: string[]): Promise<void> {
  if (keys.length === 0 || !isStorageConfigured()) return;
  try {
    await getClient().send(
      new DeleteObjectsCommand({
        Bucket: bucket(),
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  } catch (err) {
    console.error("Deleting listing photos failed", keys, err);
  }
}
