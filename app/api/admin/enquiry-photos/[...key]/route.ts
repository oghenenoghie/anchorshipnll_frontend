import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/auth/session";
import { ENQUIRY_PHOTO_KEY_RE, getEnquiryPhoto, isStorageConfigured } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Streams a sell-to-us photo from the private enquiry bucket to a signed-in
// admin. middleware.ts only covers /admin/*, so this route checks the session
// itself.
export async function GET(_request: Request, { params }: { params: { key: string[] } }) {
  const authed = await verifyAdminSessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value);
  if (!authed) return new NextResponse(null, { status: 401 });

  const key = params.key.join("/");
  if (!ENQUIRY_PHOTO_KEY_RE.test(key)) return new NextResponse(null, { status: 404 });
  if (!isStorageConfigured()) return new NextResponse(null, { status: 503 });

  let photo: Response;
  try {
    photo = await getEnquiryPhoto(key);
  } catch (err) {
    console.error(`Reading enquiry photo ${key} failed`, err);
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(photo.body, {
    headers: {
      "content-type": photo.headers.get("content-type") ?? "application/octet-stream",
      // Private: only the signed-in admin's browser may keep a copy.
      "cache-control": "private, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
}
