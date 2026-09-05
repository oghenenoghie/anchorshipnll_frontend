import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/auth/session";
import { logout } from "./login/actions";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s — Admin — AnchorShip NL",
  },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const authed = await verifyAdminSessionToken(token);

  return (
    <div className="min-h-[70vh]">
      <div className="border-b border-white/10 bg-hull">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="font-display text-sm font-bold uppercase tracking-wide text-paper">
            Admin
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/" className="font-body text-xs text-fog transition-colors hover:text-paper">
              View site
            </Link>
            {authed && (
              <form action={logout}>
                <button type="submit" className="font-body text-xs text-fog transition-colors hover:text-paper">
                  Sign out
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
