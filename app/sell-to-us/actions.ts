"use server";

import { redirect } from "next/navigation";
import { recordEnquiry } from "@/lib/enquiries";
import type { EnquiryPhoto } from "@/lib/db/schema";
import {
  MAX_ENQUIRY_PHOTOS,
  MAX_ENQUIRY_PHOTO_BYTES,
  PHOTO_TYPES,
  isStorageConfigured,
  newEnquiryPhotoKey,
  putEnquiryPhoto,
} from "@/lib/storage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  return qs.toString();
}

// FormDataEntryValue is File | string; File isn't a global on Node 18, so
// narrow by excluding strings rather than with instanceof.
function attachedPhotos(formData: FormData) {
  return formData
    .getAll("photos")
    .filter((entry): entry is Exclude<FormDataEntryValue, string> => typeof entry !== "string" && entry.size > 0);
}

function photosAreValid(files: ReturnType<typeof attachedPhotos>): boolean {
  return (
    files.length <= MAX_ENQUIRY_PHOTOS &&
    files.every((file) => PHOTO_TYPES[file.type] && file.size <= MAX_ENQUIRY_PHOTO_BYTES)
  );
}

// Uploads each photo to the private enquiry bucket. A failed upload never
// blocks the enquiry itself; the count of failures goes into the email.
async function uploadPhotos(files: ReturnType<typeof attachedPhotos>) {
  if (files.length === 0) return { photos: [] as EnquiryPhoto[], failed: 0 };
  if (!isStorageConfigured()) {
    console.error("Sell-to-us photos dropped: Neon storage is not configured");
    return { photos: [] as EnquiryPhoto[], failed: files.length };
  }

  const results = await Promise.allSettled(
    files.map(async (file) => {
      const key = newEnquiryPhotoKey(file.type);
      await putEnquiryPhoto(key, new Uint8Array(await file.arrayBuffer()), file.type);
      return { key, name: file.name.slice(0, 200) };
    }),
  );
  const photos: EnquiryPhoto[] = [];
  results.forEach((result) => {
    if (result.status === "fulfilled") photos.push(result.value);
    else console.error("Sell-to-us photo upload failed", result.reason);
  });
  return { photos, failed: files.length - photos.length };
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
  const files = attachedPhotos(formData);
  if (!photosAreValid(files)) missing.push("photos");

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

  const { photos, failed } = await uploadPhotos(files);
  const photoLines = [
    photos.length > 0 &&
      `Photos: ${photos.length} attached — open this enquiry in the admin enquiries inbox to view them.`,
    failed > 0 && `Photos: ${failed} failed to upload — ask the seller to email them.`,
  ].filter((line): line is string => Boolean(line));

  const recorded = await recordEnquiry(
    {
      kind: "sell_to_us",
      name,
      email,
      company,
      phone: phone || null,
      brand,
      location: location || null,
      message: description,
      photos,
    },
    {
      subject: `Sell to us — ${brand}`,
      replyTo: email,
      text: [
        `Name: ${name}`,
        `Company: ${company}`,
        `Email: ${email}`,
        `Phone: ${phone || "—"}`,
        `Brand / manufacturer: ${brand}`,
        `Location: ${location || "—"}`,
        ...photoLines,
        "",
        description,
      ].join("\n"),
    },
  );

  if (!recorded) {
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
