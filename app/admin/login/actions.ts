"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, createAdminSessionToken } from "@/lib/auth/session";

function safeNextPath(next: string): string {
  return next.startsWith("/admin") ? next : "/admin";
}

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  const valid =
    Boolean(adminEmail) && Boolean(adminHash) && email === adminEmail && verifyPassword(password, adminHash!);

  if (!valid) {
    const qs = new URLSearchParams({ error: "1" });
    if (next) qs.set("next", next);
    redirect(`/admin/login?${qs.toString()}`);
  }

  const token = await createAdminSessionToken();
  cookies().set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  redirect(safeNextPath(next));
}

export async function logout(): Promise<void> {
  cookies().set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  redirect("/admin/login");
}
