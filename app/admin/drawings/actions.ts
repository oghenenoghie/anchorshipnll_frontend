"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  createDrawing,
  deleteDrawing,
  isUniqueViolation,
  updateDrawing,
  type DrawingInput,
} from "@/lib/db/queries";
import type { Hotspot } from "@/lib/db/schema";
import { BRANDS } from "@/lib/data/stock";

function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  return qs.toString();
}

function parseHotspots(value: string): Hotspot[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((h): h is Record<string, unknown> => typeof h === "object" && h !== null)
      .map((h) => ({
        id: String(h.id ?? ""),
        x: Number(h.x ?? 0),
        y: Number(h.y ?? 0),
        label: String(h.label ?? ""),
        sku: typeof h.sku === "string" && h.sku ? h.sku : null,
      }));
  } catch {
    return [];
  }
}

function readInput(formData: FormData): { input: DrawingInput; missing: string[] } {
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const hotspots = parseHotspots(String(formData.get("hotspots") ?? "[]"));

  const missing: string[] = [];
  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) missing.push("slug");
  if (!title) missing.push("title");
  if (!BRANDS.some((b) => b.name === brand)) missing.push("brand");
  if (!imageUrl) missing.push("imageUrl");

  return { input: { slug, title, brand, imageUrl, hotspots }, missing };
}

export async function createDrawingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { input, missing } = readInput(formData);

  if (missing.length > 0) {
    redirect(`/admin/drawings/new?${buildQuery({ error: "1", missing: missing.join(",") })}`);
  }

  let failure: string | undefined;
  let newId: string | undefined;
  try {
    const created = await createDrawing(input);
    newId = created.id;
  } catch (err) {
    failure = isUniqueViolation(err) ? "slug_taken" : "save_failed";
  }

  if (failure) {
    redirect(`/admin/drawings/new?${buildQuery({ error: "1", missing: failure })}`);
  }

  revalidatePath("/admin/drawings");
  revalidatePath("/drawings");
  redirect(`/admin/drawings/${newId}/edit?created=1`);
}

export async function updateDrawingAction(id: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const { input, missing } = readInput(formData);

  if (missing.length > 0) {
    redirect(`/admin/drawings/${id}/edit?${buildQuery({ error: "1", missing: missing.join(",") })}`);
  }

  let failure: string | undefined;
  let notFound = false;
  try {
    const updated = await updateDrawing(id, input);
    if (!updated) notFound = true;
  } catch (err) {
    failure = isUniqueViolation(err) ? "slug_taken" : "save_failed";
  }

  if (notFound) redirect("/admin/drawings?error=not_found");
  if (failure) {
    redirect(`/admin/drawings/${id}/edit?${buildQuery({ error: "1", missing: failure })}`);
  }

  revalidatePath("/admin/drawings");
  revalidatePath("/drawings");
  revalidatePath(`/drawings/${input.slug}`);
  redirect("/admin/drawings?updated=1");
}

export async function deleteDrawingAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteDrawing(id);

  revalidatePath("/admin/drawings");
  revalidatePath("/drawings");
  redirect("/admin/drawings?deleted=1");
}
