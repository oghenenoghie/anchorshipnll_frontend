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

export async function submitRfq(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const quantity = String(formData.get("quantity") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const missing: string[] = [];
  if (!name) missing.push("name");
  if (!company) missing.push("company");
  if (!email || !EMAIL_RE.test(email)) missing.push("email");
  if (!sku) missing.push("sku");
  if (quantity && (!/^\d+$/.test(quantity) || Number(quantity) < 1)) missing.push("quantity");

  if (missing.length > 0) {
    redirect(
      `/rfq?${buildQuery({
        error: "1",
        missing: missing.join(","),
        name,
        company,
        email,
        phone,
        sku,
        quantity,
        message,
      })}`,
    );
  }

  try {
    await sendNotificationEmail({
      subject: `RFQ — ${sku}`,
      replyTo: email,
      text: [
        `Name: ${name}`,
        `Company: ${company}`,
        `Email: ${email}`,
        `Phone: ${phone || "—"}`,
        `SKU: ${sku}`,
        `Quantity: ${quantity || "1"}`,
        "",
        message || "(no additional details)",
      ].join("\n"),
    });
  } catch (err) {
    console.error("RFQ email send failed", err);
    redirect(
      `/rfq?${buildQuery({ error: "1", missing: "send", name, company, email, phone, sku, quantity, message })}`,
    );
  }

  redirect("/rfq?submitted=1");
}
