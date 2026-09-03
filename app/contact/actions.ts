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

export async function submitContact(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const missing: string[] = [];
  if (!name) missing.push("name");
  if (!email || !EMAIL_RE.test(email)) missing.push("email");
  if (!message) missing.push("message");

  if (missing.length > 0) {
    redirect(
      `/contact?${buildQuery({ error: "1", missing: missing.join(","), name, email, sku, message })}`,
    );
  }

  try {
    await sendNotificationEmail({
      subject: sku ? `Contact — re: ${sku}` : "Contact form",
      replyTo: email,
      text: [`Name: ${name}`, `Email: ${email}`, sku ? `Regarding SKU: ${sku}` : undefined, "", message]
        .filter((line): line is string => Boolean(line))
        .join("\n"),
    });
  } catch (err) {
    console.error("Contact email send failed", err);
    redirect(`/contact?${buildQuery({ error: "1", missing: "send", name, email, sku, message })}`);
  }

  redirect("/contact?submitted=1");
}
