import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/auth/session";
import {
  DRAWING_TYPES,
  MAX_PHOTO_BYTES,
  PHOTO_TYPES,
  isStorageConfigured,
  isUnsafeSvg,
  newDrawingKey,
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

// Uploads one listing photo (or, with kind=drawing, one exploded-drawing
// image) to object storage and returns its key and public URL. It's only
// attached to a listing or drawing when that form is saved. middleware.ts
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
  let isDrawing: boolean;
  try {
    const form = await request.formData();
    file = form.get("file");
    isDrawing = form.get("kind") === "drawing";
  } catch {
    return error("bad_request", 400);
  }
  // Not `instanceof File`: the global File class only exists from Node 20,
  // and Railway runs Node 18. FormDataEntryValue is File | string.
  if (!file || typeof file === "string") return error("bad_request", 400);
  const types = isDrawing ? DRAWING_TYPES : PHOTO_TYPES;
  if (!types[file.type]) return error("unsupported_type", 415);
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) return error("too_large", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.type === "image/svg+xml" && isUnsafeSvg(new TextDecoder().decode(bytes))) {
    return error("unsafe_svg", 415);
  }

  const key = isDrawing ? newDrawingKey(file.type) : newPhotoKey(file.type);
  try {
    await putPhoto(key, bytes, file.type);
  } catch (err) {
    console.error("Photo upload failed", err);
    return error("upload_failed", 502);
  }

  return NextResponse.json({ key, url: publicUrl(key) });
}
