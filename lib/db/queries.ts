import { cache } from "react";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { getDb, getPublicDb } from "./index";
import {
  drawings,
  enquiries,
  stockItems,
  type EnquiryKindValue,
  type EnquiryStatusValue,
  type Hotspot,
  type SpecRow,
  type StockCategoryValue,
  type EnquiryPhoto,
  type StockImage,
  type StockStatusValue,
} from "./schema";
import { BRANDS, brandSlug } from "@/lib/data/stock";
import { publicUrl } from "@/lib/storage";

export type StockCategory = StockCategoryValue;

export interface StockListing {
  sku: string;
  title: string;
  subtitle: string;
  brand: string;
  model: string | null;
  category: StockCategory;
  status: StockStatusValue;
  quantity: number;
  oemNumbers: string[];
  description: string;
  specs: SpecRow[];
  images: ListingImage[];
}

export interface ListingImage extends StockImage {
  url: string;
}

// Drops photos when storage isn't configured (publicUrl returns null), so the
// UI falls back to its placeholder rather than rendering broken images.
function toListingImages(images: StockImage[]): ListingImage[] {
  return images.flatMap((image) => {
    const url = publicUrl(image.key);
    return url ? [{ ...image, url }] : [];
  });
}

function toListing(row: typeof stockItems.$inferSelect): StockListing {
  return {
    sku: row.sku,
    title: row.title,
    subtitle: row.subtitle ?? "",
    brand: row.brand,
    model: row.model,
    category: row.category,
    status: row.status,
    quantity: row.quantity,
    oemNumbers: row.oemNumbers,
    description: row.description,
    specs: row.specs,
    images: toListingImages(row.images),
  };
}

export interface StockFilters {
  q?: string;
  brands: string[]; // brand slugs, e.g. "wartsila"
  statuses: string[];
}

function slugsToBrandNames(slugs: string[]): string[] {
  const bySlug = new Map(BRANDS.map((b) => [b.slug, b.name]));
  return slugs.map((slug) => bySlug.get(slug)).filter((name): name is string => Boolean(name));
}

// A trigram word-similarity score of at least this counts as a close match.
// Tuned on the live catalog: the intended part scored 0.63-1.0 for typos like
// "DR-2213", "bf6m1051" or "turbocharer", unrelated parts 0.38 or less, and
// neighbours such as "Cylinder liner" for "cylindr head" 0.50.
const FUZZY_THRESHOLD = 0.55;

export interface ListingSearchResult {
  listings: StockListing[];
  // True when nothing matched the query exactly and these are close matches.
  fuzzy: boolean;
}

export async function getListings(
  category: StockCategory,
  filters: StockFilters,
): Promise<ListingSearchResult> {
  const db = getPublicDb();
  const conditions: SQL[] = [eq(stockItems.category, category)];

  if (filters.brands.length > 0) {
    const names = slugsToBrandNames(filters.brands);
    if (names.length > 0) conditions.push(inArray(stockItems.brand, names));
  }

  if (filters.statuses.length > 0) {
    conditions.push(inArray(stockItems.status, filters.statuses as StockStatusValue[]));
  }

  const q = filters.q?.trim().slice(0, 100);
  if (!q) {
    const rows = await db.select().from(stockItems).where(and(...conditions)).orderBy(stockItems.title);
    return { listings: rows.map(toListing), fuzzy: false };
  }

  // Normalised the same way as stock_items.search_key (see migration 0005):
  // lowercase and accent-free, plus a punctuation-free form so "DR2231",
  // "dr-2231" and "DR 2231" all find the same part.
  const normalized = sql`lower(unaccent(${q}))`;
  const compact = sql`regexp_replace(lower(unaccent(${q})), '[^a-z0-9]', '', 'g')`;

  // position() rather than LIKE so user input needs no wildcard escaping. The
  // catalog is small enough that these scans are cheap; the trigram index on
  // search_key is there for when it grows and the operator forms are adopted.
  const exact = or(
    sql`position(${normalized} in ${stockItems.searchKey}) > 0`,
    sql`(length(${compact}) >= 3 AND position(${compact} in ${stockItems.searchKey}) > 0)`,
  )!;
  const exactRows = await db
    .select()
    .from(stockItems)
    .where(and(...conditions, exact))
    .orderBy(stockItems.title);
  if (exactRows.length > 0) return { listings: exactRows.map(toListing), fuzzy: false };

  const score = sql`greatest(word_similarity(${normalized}, ${stockItems.searchKey}), word_similarity(${compact}, ${stockItems.searchKey}))`;
  const fuzzyRows = await db
    .select()
    .from(stockItems)
    .where(and(...conditions, sql`${score} >= ${FUZZY_THRESHOLD}`))
    .orderBy(desc(score), stockItems.title)
    .limit(24);
  return { listings: fuzzyRows.map(toListing), fuzzy: fuzzyRows.length > 0 };
}

export interface FacetCounts {
  brands: Record<string, number>; // brand slug -> count
  statuses: Record<string, number>; // status -> count
}

export async function getFacetCounts(category: StockCategory): Promise<FacetCounts> {
  const db = getPublicDb();

  const [brandRows, statusRows] = await Promise.all([
    db
      .select({ brand: stockItems.brand, count: sql<number>`count(*)::int` })
      .from(stockItems)
      .where(eq(stockItems.category, category))
      .groupBy(stockItems.brand),
    db
      .select({ status: stockItems.status, count: sql<number>`count(*)::int` })
      .from(stockItems)
      .where(eq(stockItems.category, category))
      .groupBy(stockItems.status),
  ]);

  const brands: Record<string, number> = {};
  for (const row of brandRows) {
    brands[brandSlug(row.brand)] = row.count;
  }

  const statuses: Record<string, number> = {};
  for (const row of statusRows) {
    statuses[row.status] = row.count;
  }

  return { brands, statuses };
}

// cache(): generateMetadata and the page both look the listing up, and
// queries aren't fetch-cached (see lib/db/index.ts), so this dedupes the two
// calls within one request.
export const getListingBySku = cache(async function getListingBySku(
  category: StockCategory,
  sku: string,
): Promise<StockListing | undefined> {
  const db = getPublicDb();
  const rows = await db
    .select()
    .from(stockItems)
    .where(and(eq(stockItems.category, category), ilike(stockItems.sku, sku)))
    .limit(1);

  return rows[0] ? toListing(rows[0]) : undefined;
});

// Used to resolve a ?sku= prefill on the RFQ/contact forms, where the category isn't known.
export async function findListingBySku(sku: string): Promise<StockListing | undefined> {
  const trimmed = sku.trim();
  if (!trimmed) return undefined;

  const db = getPublicDb();
  const rows = await db.select().from(stockItems).where(ilike(stockItems.sku, trimmed)).limit(1);

  return rows[0] ? toListing(rows[0]) : undefined;
}

export async function getRelatedListings(item: StockListing, limit = 3): Promise<StockListing[]> {
  const db = getPublicDb();
  const rows = await db
    .select()
    .from(stockItems)
    .where(
      and(
        eq(stockItems.category, item.category),
        eq(stockItems.brand, item.brand),
        sql`${stockItems.sku} <> ${item.sku}`,
      ),
    )
    .limit(limit);

  return rows.map(toListing);
}

// --- Admin CRUD -------------------------------------------------------
// Unlike the public queries above, these see every status/category and are
// only ever called from code behind lib/auth/admin.ts's requireAdmin() gate.

// Unlike the public listing, admin keeps every stored photo even when its URL
// can't be built, so saving the form never silently drops photos.
export interface AdminImage extends StockImage {
  url: string | null;
}

export interface AdminListing extends Omit<StockListing, "images"> {
  images: AdminImage[];
  id: string;
  priceOnApplication: string | null;
  createdAt: string;
  updatedAt: string;
}

function toAdminListing(row: typeof stockItems.$inferSelect): AdminListing {
  return {
    ...toListing(row),
    images: row.images.map((image) => ({ ...image, url: publicUrl(image.key) })),
    id: row.id,
    priceOnApplication: row.priceOnApplication,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface StockItemInput {
  sku: string;
  title: string;
  subtitle: string;
  brand: string;
  model: string | null;
  category: StockCategoryValue;
  status: StockStatusValue;
  quantity: number;
  oemNumbers: string[];
  description: string;
  specs: SpecRow[];
  images: StockImage[];
  priceOnApplication: string | null;
}

export async function getAllListingsAdmin(): Promise<AdminListing[]> {
  const db = getDb();
  const rows = await db.select().from(stockItems).orderBy(desc(stockItems.updatedAt));
  return rows.map(toAdminListing);
}

export async function getListingByIdAdmin(id: string): Promise<AdminListing | undefined> {
  const db = getDb();
  const rows = await db.select().from(stockItems).where(eq(stockItems.id, id)).limit(1);
  return rows[0] ? toAdminListing(rows[0]) : undefined;
}

export async function createListing(input: StockItemInput): Promise<AdminListing> {
  const db = getDb();
  const [row] = await db.insert(stockItems).values(input).returning();
  return toAdminListing(row);
}

export async function updateListing(id: string, input: StockItemInput): Promise<AdminListing | undefined> {
  const db = getDb();
  const [row] = await db
    .update(stockItems)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(stockItems.id, id))
    .returning();
  return row ? toAdminListing(row) : undefined;
}

// Returns the deleted listing's photos so the caller can remove them from storage.
export async function deleteListing(id: string): Promise<StockImage[]> {
  const db = getDb();
  const rows = await db.delete(stockItems).where(eq(stockItems.id, id)).returning({ images: stockItems.images });
  return rows[0]?.images ?? [];
}

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

// --- Drawings (exploded-diagram hotspot discovery) ---------------------

export interface DrawingSummary {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string | null;
  imageUrl: string;
}

export interface ResolvedHotspot extends Hotspot {
  listing?: Pick<StockListing, "sku" | "title" | "subtitle" | "status" | "category">;
}

export interface DrawingDetail extends DrawingSummary {
  hotspots: ResolvedHotspot[];
}

function toDrawingSummary(row: typeof drawings.$inferSelect): DrawingSummary {
  return { id: row.id, slug: row.slug, title: row.title, brand: row.brand, model: row.model, imageUrl: row.imageUrl };
}

async function resolveHotspots(hotspots: Hotspot[]): Promise<ResolvedHotspot[]> {
  const skus = hotspots.map((h) => h.sku).filter((sku): sku is string => Boolean(sku));
  if (skus.length === 0) return hotspots.map((h) => ({ ...h }));

  const db = getPublicDb();
  const rows = await db.select().from(stockItems).where(inArray(stockItems.sku, skus));
  const bySku = new Map(rows.map((row) => [row.sku, toListing(row)]));

  return hotspots.map((h) => ({
    ...h,
    listing: h.sku ? bySku.get(h.sku) : undefined,
  }));
}

export async function getAllDrawings(): Promise<DrawingSummary[]> {
  const db = getPublicDb();
  const rows = await db.select().from(drawings).orderBy(drawings.title);
  return rows.map(toDrawingSummary);
}

// cache(): see getListingBySku.
export const getDrawingBySlug = cache(async function getDrawingBySlug(slug: string): Promise<DrawingDetail | undefined> {
  const db = getPublicDb();
  const rows = await db.select().from(drawings).where(eq(drawings.slug, slug)).limit(1);
  const row = rows[0];
  if (!row) return undefined;

  return { ...toDrawingSummary(row), hotspots: await resolveHotspots(row.hotspots) };
});

// Reverse lookup for the "find this on the exploded diagram" cross-link on
// listing detail pages — scans the jsonb hotspots array for this sku.
export async function getDrawingsForSku(sku: string): Promise<DrawingSummary[]> {
  const db = getPublicDb();
  const rows = await db
    .select()
    .from(drawings)
    .where(sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${drawings.hotspots}) elem WHERE elem->>'sku' = ${sku})`);
  return rows.map(toDrawingSummary);
}

// --- Drawings admin CRUD -------------------------------------------------

export interface DrawingInput {
  slug: string;
  title: string;
  brand: string;
  model: string | null;
  imageUrl: string;
  hotspots: Hotspot[];
}

export async function getAllDrawingsAdmin(): Promise<DrawingDetail[]> {
  const db = getDb();
  const rows = await db.select().from(drawings).orderBy(desc(drawings.updatedAt));
  return Promise.all(rows.map(async (row) => ({ ...toDrawingSummary(row), hotspots: await resolveHotspots(row.hotspots) })));
}

export async function getDrawingByIdAdmin(id: string): Promise<DrawingDetail | undefined> {
  const db = getDb();
  const rows = await db.select().from(drawings).where(eq(drawings.id, id)).limit(1);
  const row = rows[0];
  if (!row) return undefined;
  return { ...toDrawingSummary(row), hotspots: await resolveHotspots(row.hotspots) };
}

export async function createDrawing(input: DrawingInput): Promise<DrawingSummary> {
  const db = getDb();
  const [row] = await db.insert(drawings).values(input).returning();
  return toDrawingSummary(row);
}

export async function updateDrawing(id: string, input: DrawingInput): Promise<DrawingSummary | undefined> {
  const db = getDb();
  const [row] = await db
    .update(drawings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(drawings.id, id))
    .returning();
  return row ? toDrawingSummary(row) : undefined;
}

export async function deleteDrawing(id: string): Promise<void> {
  const db = getDb();
  await db.delete(drawings).where(eq(drawings.id, id));
}

// --- Enquiries (RFQ / contact / sell-to-us submissions) ----------------

export type Enquiry = typeof enquiries.$inferSelect;

export interface EnquiryInput {
  kind: EnquiryKindValue;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  sku?: string | null;
  quantity?: number | null;
  brand?: string | null;
  location?: string | null;
  message?: string;
  photos?: EnquiryPhoto[];
}

// Runs as web_public, which may insert enquiries but not read them back, so
// the id is generated here instead of using RETURNING.
export async function createEnquiry(input: EnquiryInput): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  await getPublicDb().insert(enquiries).values({ ...input, id });
  return { id };
}

export async function markEnquiryEmailSent(id: string): Promise<void> {
  const db = getDb();
  await db.update(enquiries).set({ emailSent: true }).where(eq(enquiries.id, id));
}

export interface EnquiryFilters {
  kind?: EnquiryKindValue;
  status?: EnquiryStatusValue;
}

export async function getEnquiriesAdmin(filters: EnquiryFilters = {}): Promise<Enquiry[]> {
  const db = getDb();
  const conditions: SQL[] = [];
  if (filters.kind) conditions.push(eq(enquiries.kind, filters.kind));
  if (filters.status) conditions.push(eq(enquiries.status, filters.status));
  return db
    .select()
    .from(enquiries)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(enquiries.createdAt));
}

export async function getEnquiryByIdAdmin(id: string): Promise<Enquiry | undefined> {
  const db = getDb();
  const rows = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  return rows[0];
}

export async function setEnquiryStatus(id: string, status: EnquiryStatusValue): Promise<void> {
  const db = getDb();
  await db.update(enquiries).set({ status, updatedAt: new Date() }).where(eq(enquiries.id, id));
}

export async function deleteEnquiry(id: string): Promise<void> {
  const db = getDb();
  await db.delete(enquiries).where(eq(enquiries.id, id));
}

export interface SitemapEntry {
  path: string;
  updatedAt: Date;
}

// Every public listing (sold ones stay live as reference) and drawing.
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const db = getPublicDb();
  const [listings, diagrams] = await Promise.all([
    db
      .select({ sku: stockItems.sku, category: stockItems.category, updatedAt: stockItems.updatedAt })
      .from(stockItems),
    db.select({ slug: drawings.slug, updatedAt: drawings.updatedAt }).from(drawings),
  ]);
  return [
    ...listings.map((row) => ({
      path: `/${row.category === "engine" ? "engines" : "parts"}/${encodeURIComponent(row.sku)}`,
      updatedAt: row.updatedAt,
    })),
    ...diagrams.map((row) => ({ path: `/drawings/${encodeURIComponent(row.slug)}`, updatedAt: row.updatedAt })),
  ];
}

// Every brand + engine-model pair that has a listing or drawing, for the
// /brands/[brand]/[model] hubs in the sitemap.
export async function getBrandModels(): Promise<{ brand: string; model: string }[]> {
  const db = getPublicDb();
  const [fromListings, fromDrawings] = await Promise.all([
    db.selectDistinct({ brand: stockItems.brand, model: stockItems.model }).from(stockItems),
    db.selectDistinct({ brand: drawings.brand, model: drawings.model }).from(drawings),
  ]);
  const seen = new Map<string, { brand: string; model: string }>();
  for (const row of [...fromListings, ...fromDrawings]) {
    if (row.model) seen.set(`${row.brand}\u0000${row.model}`, { brand: row.brand, model: row.model });
  }
  return Array.from(seen.values());
}

export interface StockOverview {
  newArrivals: StockListing[];
  expected: StockListing[];
  recentlySold: StockListing[];
}

// The /stock page: what's just come in, what's on its way, and what recently
// sold (sold listings stay live as a trust signal).
export async function getStockOverview(limit = 6): Promise<StockOverview> {
  const db = getPublicDb();
  const byStatus = (status: StockStatusValue, order: SQL) =>
    db.select().from(stockItems).where(eq(stockItems.status, status)).orderBy(order).limit(limit);

  const [newArrivals, expected, recentlySold] = await Promise.all([
    byStatus("available", desc(stockItems.createdAt)),
    byStatus("expected", desc(stockItems.createdAt)),
    byStatus("sold", desc(stockItems.updatedAt)),
  ]);
  return {
    newArrivals: newArrivals.map(toListing),
    expected: expected.map(toListing),
    recentlySold: recentlySold.map(toListing),
  };
}

export interface BrandCatalog {
  listings: StockListing[];
  drawings: DrawingSummary[];
}

// Everything listed under one brand, for the /brands hubs. Models and
// sections are grouped in the page; a brand's catalog is small.
export async function getBrandCatalog(brand: string): Promise<BrandCatalog> {
  const db = getPublicDb();
  const [listingRows, drawingRows] = await Promise.all([
    db.select().from(stockItems).where(eq(stockItems.brand, brand)).orderBy(stockItems.category, stockItems.title),
    db.select().from(drawings).where(eq(drawings.brand, brand)).orderBy(drawings.title),
  ]);
  return { listings: listingRows.map(toListing), drawings: drawingRows.map(toDrawingSummary) };
}

export interface BrandSummary {
  brand: string;
  listings: number;
  models: string[];
}

export async function getBrandSummaries(): Promise<BrandSummary[]> {
  const db = getPublicDb();
  const rows = await db
    .select({
      brand: stockItems.brand,
      listings: sql<number>`count(*)::int`,
      models: sql<string[]>`coalesce(array_agg(distinct ${stockItems.model}) filter (where ${stockItems.model} is not null), '{}')`,
    })
    .from(stockItems)
    .groupBy(stockItems.brand);
  return rows.map((row) => ({ ...row, models: [...row.models].sort() }));
}
