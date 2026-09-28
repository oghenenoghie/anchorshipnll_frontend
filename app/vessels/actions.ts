"use server";

import { redirect } from "next/navigation";
import { getVesselBySlug } from "@/lib/db/vessels";
import { recordEnquiry } from "@/lib/enquiries";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, name: string, max: number): string {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

// Enquiry about one vessel. The vessel is looked up again from its slug (not
// trusted from a hidden id), so the saved vessel_id always points at a
// public listing.
export async function submitVesselEnquiry(formData: FormData): Promise<void> {
  const slug = field(formData, "vessel", 200);
  const vessel = await getVesselBySlug(slug);
  if (!vessel) redirect("/vessels");

  const back = (params: Record<string, string>) =>
    redirect(`${vessel.href}?${new URLSearchParams(params).toString()}#enquire`);

  // Honeypot: people never see this field; bots fill it in. Pretend success.
  if (field(formData, "website", 200)) back({ enquiry: "sent" });

  const values = {
    name: field(formData, "name", 200),
    email: field(formData, "email", 320),
    company: field(formData, "company", 200),
    phone: field(formData, "phone", 60),
    message: field(formData, "message", 5000),
  };

  const missing: string[] = [];
  if (!values.name) missing.push("name");
  if (!EMAIL_RE.test(values.email)) missing.push("email");
  if (missing.length > 0) back({ error: "1", missing: missing.join(","), ...values });

  if (rateLimited("vessel-enquiry", clientIp(), 5, 10 * 60 * 1000)) {
    back({ error: "1", missing: "rate", ...values });
  }

  const recorded = await recordEnquiry(
    {
      kind: "vessel",
      vesselId: vessel.id,
      name: values.name,
      email: values.email,
      company: values.company || null,
      phone: values.phone || null,
      location: [vessel.location, vessel.country].filter(Boolean).join(", ") || null,
      message: values.message,
    },
    {
      subject: `Vessel enquiry — ${vessel.title} (${vessel.ref})`,
      replyTo: values.email,
      text: [
        `Vessel: ${vessel.title} (${vessel.ref})`,
        absoluteUrl(vessel.href),
        "",
        `Name: ${values.name}`,
        `Email: ${values.email}`,
        values.company ? `Company: ${values.company}` : undefined,
        values.phone ? `Phone: ${values.phone}` : undefined,
        "",
        values.message || "(no message)",
      ]
        .filter((line): line is string => line !== undefined)
        .join("\n"),
    },
  );

  if (!recorded) back({ error: "1", missing: "send", ...values });
  back({ enquiry: "sent" });
}
