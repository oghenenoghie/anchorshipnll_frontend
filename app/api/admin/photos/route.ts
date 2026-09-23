import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/auth/session";
import {
  MAX_PHOTO_BYTES,
  PHOTO_TYPES,
  isStorageConfigured,
  newPhotoKey,
  publicUrl,
  putPhoto,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSameHost(origin: string, host: string | null): boolean {
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function error(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}

// Uploads one listing photo to object storage and returns its key. The photo
// is only attached to a listing when the stock form is saved. middleware.ts
// only covers /admin/*, so this route checks the session itself.
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !isSameHost(origin, request.headers.get("host"))) {
    return error("forbidden", 403);
  }

  const authed = await verifyAdminSessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value);
  if (!authed) return error("unauthorized", 401);

  if (!isStorageConfigured()) return error("not_configured", 503);

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return error("bad_request", 400);
  }
  if (!(file instanceof File)) return error("bad_request", 400);
  if (!PHOTO_TYPES[file.type]) return error("unsupported_type", 415);
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) return error("too_large", 413);

  const key = newPhotoKey(file.type);
  try {
    await putPhoto(key, new Uint8Array(await file.arrayBuffer()), file.type);
  } catch (err) {
    console.error("Photo upload failed", err);
    return error("upload_failed", 502);
  }

  return NextResponse.json({ key, url: publicUrl(key) });
}
