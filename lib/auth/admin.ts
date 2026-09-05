import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "./session";

// Defense in depth alongside middleware.ts — re-checked inside every admin
// Server Action in case it's ever invoked outside a route middleware covers.
export async function requireAdmin(): Promise<void> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const valid = await verifyAdminSessionToken(token);
  if (!valid) redirect("/admin/login");
}
