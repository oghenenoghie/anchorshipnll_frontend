"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  createListing,
  deleteListing,
  getListingByIdAdmin,
  isUniqueViolation,
  updateListing,
  type StockItemInput,
} from "@/lib/db/queries";
import type { SpecRow, StockCategoryValue, StockImage, StockStatusValue } from "@/lib/db/schema";
import { PHOTO_KEY_RE, deletePhotos } from "@/lib/storage";
import { STATUSES } from "@/lib/data/stock";

const CATEGORIES: StockCategoryValue[] = ["part", "engine"];

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseSpecs(value: string): SpecRow[] {
  return parseLines(value).map((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return { label: line, value: "" };
    return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
  });
}

// Only keys minted by the upload route are accepted, so a tampered form can't
// point a listing at an arbitrary object.
function parseImages(value: string): StockImage[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed
      .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
      .map((i) => ({ key: String(i.key ?? ""), alt: String(i.alt ?? "").trim().slice(0, 200) }))
      .filter((i) => PHOTO_KEY_RE.test(i.key) && !seen.has(i.key) && seen.add(i.key))
      .slice(0, 30);
  } catch {
    return [];
  }
}

function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  return qs.toString();
}

function readInput(formData: FormData): { input: StockItemInput; missing: string[] } {
  const sku = String(formData.get("sku") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const priceRaw = String(formData.get("priceOnApplication") ?? "").trim();
  const oemNumbers = parseLines(String(formData.get("oemNumbers") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  const specs = parseSpecs(String(formData.get("specs") ?? ""));
  const images = parseImages(String(formData.get("images") ?? "[]"));

  const missing: string[] = [];
  if (!sku) missing.push("sku");
  if (!title) missing.push("title");
  if (!brand) missing.push("brand");
  if (!CATEGORIES.includes(category as StockCategoryValue)) missing.push("category");
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) missing.push("status");

  const quantity = Number(quantityRaw || "0");
  if (!Number.isInteger(quantity) || quantity < 0) missing.push("quantity");

  return {
    input: {
      sku,
      title,
      subtitle,
      brand,
      category: category as StockCategoryValue,
      status: status as StockStatusValue,
      quantity,
      oemNumbers,
      description,
      specs,
      images,
      priceOnApplication: priceRaw || null,
    },
    missing,
  };
}

export async function createStockItemAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { input, missing } = readInput(formData);

  if (missing.length > 0) {
    redirect(`/admin/stock/new?${buildQuery({ error: "1", missing: missing.join(",") })}`);
  }

  let failure: string | undefined;
  try {
    await createListing(input);
  } catch (err) {
    failure = isUniqueViolation(err) ? "sku_taken" : "save_failed";
  }

  if (failure) {
    redirect(`/admin/stock/new?${buildQuery({ error: "1", missing: failure })}`);
  }

  revalidatePath("/admin");
  revalidatePath("/parts");
  revalidatePath("/engines");
  redirect("/admin?created=1");
}

export async function updateStockItemAction(id: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const { input, missing } = readInput(formData);

  if (missing.length > 0) {
    redirect(`/admin/stock/${id}/edit?${buildQuery({ error: "1", missing: missing.join(",") })}`);
  }

  let failure: string | undefined;
  let notFound = false;
  let removedKeys: string[] = [];
  try {
    const previous = await getListingByIdAdmin(id);
    const updated = previous ? await updateListing(id, input) : undefined;
    if (!previous || !updated) {
      notFound = true;
    } else {
      const kept = new Set(input.images.map((image) => image.key));
      removedKeys = previous.images.map((image) => image.key).filter((key) => !kept.has(key));
    }
  } catch (err) {
    failure = isUniqueViolation(err) ? "sku_taken" : "save_failed";
  }

  if (notFound) redirect("/admin?error=not_found");
  if (failure) {
    redirect(`/admin/stock/${id}/edit?${buildQuery({ error: "1", missing: failure })}`);
  }

  await deletePhotos(removedKeys);

  revalidatePath("/admin");
  revalidatePath("/parts");
  revalidatePath("/engines");
  redirect("/admin?updated=1");
}

export async function deleteStockItemAction(id: string): Promise<void> {
  await requireAdmin();
  const images = await deleteListing(id);
  await deletePhotos(images.map((image) => image.key));

  revalidatePath("/admin");
  revalidatePath("/parts");
  revalidatePath("/engines");
  redirect("/admin?deleted=1");
}
