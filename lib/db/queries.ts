import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "./index";
import { stockItems, type SpecRow, type StockCategoryValue, type StockStatusValue } from "./schema";
import { BRANDS, brandSlug } from "@/lib/data/stock";

export type StockCategory = StockCategoryValue;

export interface StockListing {
  sku: string;
  title: string;
  subtitle: string;
  brand: string;
  category: StockCategory;
  status: StockStatusValue;
  quantity: number;
  oemNumbers: string[];
  description: string;
  specs: SpecRow[];
}

function toListing(row: typeof stockItems.$inferSelect): StockListing {
  return {
    sku: row.sku,
    title: row.title,
    subtitle: row.subtitle ?? "",
    brand: row.brand,
    category: row.category,
    status: row.status,
    quantity: row.quantity,
    oemNumbers: row.oemNumbers,
    description: row.description,
    specs: row.specs,
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

export async function getListings(
  category: StockCategory,
  filters: StockFilters,
): Promise<StockListing[]> {
  const db = getDb();
  const conditions: SQL[] = [eq(stockItems.category, category)];

  if (filters.brands.length > 0) {
    const names = slugsToBrandNames(filters.brands);
    if (names.length > 0) conditions.push(inArray(stockItems.brand, names));
  }

  if (filters.statuses.length > 0) {
    conditions.push(inArray(stockItems.status, filters.statuses as StockStatusValue[]));
  }

  const q = filters.q?.trim();
  if (q) {
    const pattern = `%${q}%`;
    const match = or(
      ilike(stockItems.sku, pattern),
      ilike(stockItems.title, pattern),
      ilike(stockItems.subtitle, pattern),
      sql`EXISTS (SELECT 1 FROM unnest(${stockItems.oemNumbers}) AS oem WHERE oem ILIKE ${pattern})`,
    );
    if (match) conditions.push(match);
  }

  const rows = await db
    .select()
    .from(stockItems)
    .where(and(...conditions))
    .orderBy(stockItems.title);

  return rows.map(toListing);
}

export interface FacetCounts {
  brands: Record<string, number>; // brand slug -> count
  statuses: Record<string, number>; // status -> count
}

export async function getFacetCounts(category: StockCategory): Promise<FacetCounts> {
  const db = getDb();

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

export async function getListingBySku(
  category: StockCategory,
  sku: string,
): Promise<StockListing | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(stockItems)
    .where(and(eq(stockItems.category, category), ilike(stockItems.sku, sku)))
    .limit(1);

  return rows[0] ? toListing(rows[0]) : undefined;
}

// Used to resolve a ?sku= prefill on the RFQ/contact forms, where the category isn't known.
export async function findListingBySku(sku: string): Promise<StockListing | undefined> {
  const trimmed = sku.trim();
  if (!trimmed) return undefined;

  const db = getDb();
  const rows = await db.select().from(stockItems).where(ilike(stockItems.sku, trimmed)).limit(1);

  return rows[0] ? toListing(rows[0]) : undefined;
}

export async function getRelatedListings(item: StockListing, limit = 3): Promise<StockListing[]> {
  const db = getDb();
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

export interface AdminListing extends StockListing {
  id: string;
  priceOnApplication: string | null;
  createdAt: string;
  updatedAt: string;
}

function toAdminListing(row: typeof stockItems.$inferSelect): AdminListing {
  return {
    ...toListing(row),
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
  category: StockCategoryValue;
  status: StockStatusValue;
  quantity: number;
  oemNumbers: string[];
  description: string;
  specs: SpecRow[];
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

export async function deleteListing(id: string): Promise<void> {
  const db = getDb();
  await db.delete(stockItems).where(eq(stockItems.id, id));
}

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}
