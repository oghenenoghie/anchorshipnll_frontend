"use server";

import { redirect } from "next/navigation";
import { sendNotificationEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  return qs.toString();
}

export async function submitSellToUs(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const missing: string[] = [];
  if (!name) missing.push("name");
  if (!company) missing.push("company");
  if (!email || !EMAIL_RE.test(email)) missing.push("email");
  if (!brand) missing.push("brand");
  if (!description) missing.push("description");

  if (missing.length > 0) {
    redirect(
      `/sell-to-us?${buildQuery({
        error: "1",
        missing: missing.join(","),
        name,
        company,
        email,
        phone,
        brand,
        location,
        description,
      })}`,
    );
  }

  try {
    await sendNotificationEmail({
      subject: `Sell to us — ${brand}`,
      replyTo: email,
      text: [
        `Name: ${name}`,
        `Company: ${company}`,
        `Email: ${email}`,
        `Phone: ${phone || "—"}`,
        `Brand / manufacturer: ${brand}`,
        `Location: ${location || "—"}`,
        "",
        description,
      ].join("\n"),
    });
  } catch (err) {
    console.error("Sell-to-us email send failed", err);
    redirect(
      `/sell-to-us?${buildQuery({
        error: "1",
        missing: "send",
        name,
        company,
        email,
        phone,
        brand,
        location,
        description,
      })}`,
    );
  }

  redirect("/sell-to-us?submitted=1");
}
