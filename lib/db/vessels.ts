import { cache } from "react";
import { and, asc, desc, eq, inArray, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, getPublicDb } from "./index";
import {
  PUBLIC_VESSEL_STATUSES,
  vesselCategories,
  vesselImages,
  vessels,
  vesselSpecs,
  type VesselStatusValue,
  type VesselTransactionValue,
} from "./schema";
import { publicUrl } from "@/lib/storage";
import { listingRef, vesselHref, type VesselFilters } from "@/lib/vessels";

// Public vessel queries. They run through getPublicDb() — as web_public, RLS
// already hides drafts, archived listings and inactive categories — but also
// filter on status and `active` themselves, because until DATABASE_URL_PUBLIC
// is set the public connection is the owner, which bypasses RLS.

const publicStatus = inArray(vessels.status, [...PUBLIC_VESSEL_STATUSES]);
const leaf = alias(vesselCategories, "leaf_category");
const top = alias(vesselCategories, "top_category");

// The vessel's own category is `leaf`; `top` is its parent, or null when the
// vessel sits directly in a top-level category.
const visibleCategory = and(eq(leaf.active, true), or(isNull(top.id), eq(top.active, true)));

export interface VesselImageView {
  key: string;
  url: string;
  alt: string;
}

export interface VesselCard {
  id: string;
  slug: string;
  href: string;
  ref: string;
  title: string;
  summary: string;
  transactionType: VesselTransactionValue;
  status: VesselStatusValue;
  categoryName: string;
  categorySlug: string;
  subcategoryName: string | null;
  subcategorySlug: string | null;
  location: string | null;
  country: string | null;
  yearBuilt: number | null;
  loaM: string | null;
  beamM: string | null;
  draftM: string | null;
  dwt: number | null;
  gt: number | null;
  flag: string | null;
  classNotation: string | null;
  isDemo: boolean;
  image: VesselImageView | null;
}

const cardColumns = {
  id: vessels.id,
  slug: vessels.slug,
  listingNumber: vessels.listingNumber,
  title: vessels.title,
  summary: vessels.summary,
  transactionType: vessels.transactionType,
  status: vessels.status,
  location: vessels.location,
  country: vessels.country,
  yearBuilt: vessels.yearBuilt,
  loaM: vessels.loaM,
  beamM: vessels.beamM,
  draftM: vessels.draftM,
  dwt: vessels.dwt,
  gt: vessels.gt,
  flag: vessels.flag,
  classNotation: vessels.classNotation,
  isDemo: vessels.isDemo,
  leafName: leaf.name,
  leafSlug: leaf.slug,
  topName: top.name,
  topSlug: top.slug,
};

type CardRow = { [K in keyof typeof cardColumns]: (typeof cardColumns)[K]["_"]["data"] } & {
  topName: string | null;
  topSlug: string | null;
};

function categoryPath(row: Pick<CardRow, "leafName" | "leafSlug" | "topName" | "topSlug">) {
  return row.topSlug
    ? { categoryName: row.topName!, categorySlug: row.topSlug, subcategoryName: row.leafName, subcategorySlug: row.leafSlug }
    : { categoryName: row.leafName, categorySlug: row.leafSlug, subcategoryName: null, subcategorySlug: null };
}

function toCard(row: CardRow, image: VesselImageView | null): VesselCard {
  const path = categoryPath(row);
  return {
    id: row.id,
    slug: row.slug,
    href: vesselHref({ categorySlug: path.categorySlug, subcategorySlug: path.subcategorySlug, slug: row.slug }),
    ref: listingRef(row.listingNumber),
    title: row.title,
    summary: row.summary,
    transactionType: row.transactionType,
    status: row.status,
    ...path,
    location: row.location,
    country: row.country,
    yearBuilt: row.yearBuilt,
    loaM: row.loaM,
    beamM: row.beamM,
    draftM: row.draftM,
    dwt: row.dwt,
    gt: row.gt,
    flag: row.flag,
    classNotation: row.classNotation,
    isDemo: row.isDemo,
    image,
  };
}

// Images for a page of vessels in one query, keyed by vessel id. Photos whose
// URL can't be built (storage not configured) are dropped, like listings.
async function imagesFor(vesselIds: string[], primaryOnly: boolean): Promise<Map<string, VesselImageView[]>> {
  const byVessel = new Map<string, VesselImageView[]>();
  if (vesselIds.length === 0) return byVessel;
  const rows = await getPublicDb()
    .select({ vesselId: vesselImages.vesselId, key: vesselImages.key, alt: vesselImages.alt })
    .from(vesselImages)
    .where(inArray(vesselImages.vesselId, vesselIds))
    .orderBy(desc(vesselImages.isPrimary), asc(vesselImages.sortOrder));
  for (const row of rows) {
    const url = publicUrl(row.key);
    if (!url) continue;
    const list = byVessel.get(row.vesselId) ?? [];
    if (primaryOnly && list.length > 0) continue;
    list.push({ key: row.key, url, alt: row.alt });
    byVessel.set(row.vesselId, list);
  }
  return byVessel;
}

async function toCards(rows: CardRow[]): Promise<VesselCard[]> {
  const images = await imagesFor(rows.map((r) => r.id), true);
  return rows.map((row) => toCard(row, images.get(row.id)?.[0] ?? null));
}

function cardQuery() {
  return getPublicDb()
    .select(cardColumns)
    .from(vessels)
    .innerJoin(leaf, eq(leaf.id, vessels.categoryId))
    .leftJoin(top, eq(top.id, leaf.parentId));
}

// --- Category tree ----------------------------------------------------------

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number; // public vessels, including those in child categories
  href: string;
  children: CategoryNode[];
}

export const getCategoryTree = cache(async function getCategoryTree(): Promise<CategoryNode[]> {
  const db = getPublicDb();
  const [categories, counts] = await Promise.all([
    db
      .select()
      .from(vesselCategories)
      .where(eq(vesselCategories.active, true))
      .orderBy(asc(vesselCategories.sortOrder), asc(vesselCategories.name)),
    db
      .select({ categoryId: vessels.categoryId, count: sql<number>`count(*)::int` })
      .from(vessels)
      .where(publicStatus)
      .groupBy(vessels.categoryId),
  ]);
  const countById = new Map(counts.map((c) => [c.categoryId, c.count]));
  const roots = categories.filter((c) => !c.parentId);
  return roots.map((root) => {
    const children = categories
      .filter((c) => c.parentId === root.id)
      .map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        count: countById.get(child.id) ?? 0,
        href: `/vessels/${root.slug}/${child.slug}`,
        children: [],
      }));
    return {
      id: root.id,
      name: root.name,
      slug: root.slug,
      description: root.description,
      count: (countById.get(root.id) ?? 0) + children.reduce((sum, c) => sum + c.count, 0),
      href: `/vessels/${root.slug}`,
      children,
    };
  });
});

export interface ResolvedCategory {
  category: CategoryNode;
  subcategory: CategoryNode | null;
}

export async function findCategory(categorySlug: string, subcategorySlug?: string): Promise<ResolvedCategory | null> {
  const tree = await getCategoryTree();
  const category = tree.find((c) => c.slug === categorySlug);
  if (!category) return null;
  if (!subcategorySlug) return { category, subcategory: null };
  const subcategory = category.children.find((c) => c.slug === subcategorySlug);
  return subcategory ? { category, subcategory } : null;
}

// --- Search -----------------------------------------------------------------

export interface VesselScope {
  categoryId?: string; // a top-level category: includes its children
  subcategoryId?: string;
}

export interface VesselSearchResult {
  vessels: VesselCard[];
  total: number;
  page: number;
  pageSize: number;
  fuzzy: boolean;
}

// Per query word. On the sample data "ancor" scores 0.50 against
// "anchor-handling" and "hoper" 0.63 against "hopper"; unrelated words ~0.2.
const FUZZY_THRESHOLD = 0.45;

function sortOrder(sort: VesselFilters["sort"]): SQL[] {
  switch (sort) {
    case "updated":
      return [desc(vessels.updatedAt)];
    case "featured":
      return [desc(vessels.featured), sql`${vessels.featuredRank} asc nulls last`, sql`${vessels.publishedAt} desc nulls last`];
    case "year-desc":
      return [sql`${vessels.yearBuilt} desc nulls last`];
    case "year-asc":
      return [sql`${vessels.yearBuilt} asc nulls last`];
    case "loa-desc":
      return [sql`${vessels.loaM} desc nulls last`];
    case "dwt-desc":
      return [sql`${vessels.dwt} desc nulls last`];
    case "name":
      return [asc(vessels.title)];
    default:
      return [sql`${vessels.publishedAt} desc nulls last`, desc(vessels.createdAt)];
  }
}

export async function searchVessels(
  filters: VesselFilters,
  scope: VesselScope = {},
  pageSize = 12,
): Promise<VesselSearchResult> {
  const conditions: SQL[] = [publicStatus, visibleCategory!];

  if (scope.subcategoryId) conditions.push(eq(vessels.categoryId, scope.subcategoryId));
  else if (scope.categoryId) conditions.push(or(eq(leaf.id, scope.categoryId), eq(leaf.parentId, scope.categoryId))!);

  if (filters.type === "sale") conditions.push(inArray(vessels.transactionType, ["sale", "sale_and_charter"]));
  if (filters.type === "charter") conditions.push(inArray(vessels.transactionType, ["charter", "sale_and_charter"]));
  if (filters.country) conditions.push(sql`lower(${vessels.country}) = lower(${filters.country})`);
  if (filters.minYear !== null) conditions.push(sql`${vessels.yearBuilt} >= ${filters.minYear}`);
  if (filters.maxYear !== null) conditions.push(sql`${vessels.yearBuilt} <= ${filters.maxYear}`);
  if (filters.minDwt !== null) conditions.push(sql`${vessels.dwt} >= ${filters.minDwt}`);
  if (filters.maxDwt !== null) conditions.push(sql`${vessels.dwt} <= ${filters.maxDwt}`);
  if (filters.minLoa !== null) conditions.push(sql`${vessels.loaM} >= ${filters.minLoa}`);
  if (filters.maxLoa !== null) conditions.push(sql`${vessels.loaM} <= ${filters.maxLoa}`);
  if (filters.maxDraft !== null) conditions.push(sql`${vessels.draftM} <= ${filters.maxDraft}`);
  if (filters.statuses.length > 0) conditions.push(inArray(vessels.status, filters.statuses));

  const run = async (where: SQL, order: SQL[], limitOverride?: number) => {
    const offset = (filters.page - 1) * pageSize;
    const rows = await cardQuery()
      .where(where)
      .orderBy(...order, asc(vessels.id))
      .limit(limitOverride ?? pageSize)
      .offset(limitOverride ? 0 : offset);
    const [{ total }] = await getPublicDb()
      .select({ total: sql<number>`count(*)::int` })
      .from(vessels)
      .innerJoin(leaf, eq(leaf.id, vessels.categoryId))
      .leftJoin(top, eq(top.id, leaf.parentId))
      .where(where);
    return { rows: rows as CardRow[], total };
  };

  // Every word of the query must appear in the search key (see migration
  // 0010), so "wartsila tug" narrows rather than widens.
  const words = filters.q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
  const textMatch = words.map((word) => sql`position(lower(unaccent(${word})) in ${vessels.searchKey}) > 0`);

  const exact = await run(and(...conditions, ...textMatch)!, sortOrder(filters.sort));
  if (exact.total > 0 || words.length === 0) {
    return { vessels: await toCards(exact.rows), total: exact.total, page: filters.page, pageSize, fuzzy: false };
  }

  // Nothing matched exactly: fall back to listings where every word is a
  // close trigram match, e.g. "ancor handling" or "hoper barge", best first.
  const scores = words.map((word) => sql`word_similarity(lower(unaccent(${word})), ${vessels.searchKey})`);
  const fuzzy = await run(
    and(...conditions, ...scores.map((score) => sql`${score} >= ${FUZZY_THRESHOLD}`))!,
    [desc(sql.join(scores, sql` + `))],
    pageSize,
  );
  return {
    vessels: await toCards(fuzzy.rows),
    total: fuzzy.rows.length,
    page: 1,
    pageSize,
    fuzzy: fuzzy.rows.length > 0,
  };
}

export async function getVesselCountries(): Promise<string[]> {
  const rows = await getPublicDb()
    .selectDistinct({ country: vessels.country })
    .from(vessels)
    .where(and(publicStatus, sql`${vessels.country} is not null`))
    .orderBy(asc(vessels.country));
  return rows.map((r) => r.country!).filter(Boolean);
}

// Homepage and hub sections: featured first, then newest.
export async function getVesselShowcase(type: "sale" | "charter", limit = 6): Promise<VesselCard[]> {
  const types: VesselTransactionValue[] = type === "sale" ? ["sale", "sale_and_charter"] : ["charter", "sale_and_charter"];
  const rows = await cardQuery()
    .where(and(inArray(vessels.status, ["published", "under_offer"]), visibleCategory, inArray(vessels.transactionType, types)))
    .orderBy(desc(vessels.featured), sql`${vessels.featuredRank} asc nulls last`, sql`${vessels.publishedAt} desc nulls last`)
    .limit(limit);
  return toCards(rows as CardRow[]);
}

// --- Detail -----------------------------------------------------------------

export interface VesselSpecView {
  label: string;
  value: string;
  unit: string | null;
}

export interface VesselSpecGroup {
  name: string;
  rows: VesselSpecView[];
}

export interface VesselDetail extends VesselCard {
  description: string;
  builder: string | null;
  imoNumber: string | null;
  nt: number | null;
  lbpM: string | null;
  depthM: string | null;
  askingTerms: string | null;
  charterAvailability: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string;
  parentCategoryId: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  images: VesselImageView[];
  specGroups: VesselSpecGroup[];
}

// cache(): generateMetadata and the page both load the vessel.
export const getVesselBySlug = cache(async function getVesselBySlug(slug: string): Promise<VesselDetail | null> {
  const db = getPublicDb();
  const [row] = await db
    .select({
      ...cardColumns,
      description: vessels.description,
      builder: vessels.builder,
      imoNumber: vessels.imoNumber,
      nt: vessels.nt,
      lbpM: vessels.lbpM,
      depthM: vessels.depthM,
      askingTerms: vessels.askingTerms,
      charterAvailability: vessels.charterAvailability,
      seoTitle: vessels.seoTitle,
      seoDescription: vessels.seoDescription,
      categoryId: vessels.categoryId,
      parentCategoryId: leaf.parentId,
      publishedAt: vessels.publishedAt,
      updatedAt: vessels.updatedAt,
    })
    .from(vessels)
    .innerJoin(leaf, eq(leaf.id, vessels.categoryId))
    .leftJoin(top, eq(top.id, leaf.parentId))
    .where(and(eq(vessels.slug, slug), publicStatus, visibleCategory))
    .limit(1);
  if (!row) return null;

  const [images, specs] = await Promise.all([
    imagesFor([row.id], false),
    db
      .select()
      .from(vesselSpecs)
      .where(eq(vesselSpecs.vesselId, row.id))
      .orderBy(asc(vesselSpecs.sortOrder)),
  ]);

  // Groups keep the order of their first row.
  const groups = new Map<string, VesselSpecView[]>();
  for (const spec of specs) {
    const list = groups.get(spec.groupName) ?? [];
    list.push({ label: spec.label, value: spec.value, unit: spec.unit });
    groups.set(spec.groupName, list);
  }

  const vesselImagesList = images.get(row.id) ?? [];
  return {
    ...toCard(row as CardRow, vesselImagesList[0] ?? null),
    description: row.description,
    builder: row.builder,
    imoNumber: row.imoNumber,
    nt: row.nt,
    lbpM: row.lbpM,
    depthM: row.depthM,
    askingTerms: row.askingTerms,
    charterAvailability: row.charterAvailability,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    categoryId: row.categoryId,
    parentCategoryId: row.parentCategoryId,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    images: vesselImagesList,
    specGroups: Array.from(groups, ([name, rows]) => ({ name, rows })),
  };
});

// Old /listings/<n> links: a listing number ("51", "AS-V-0051") or a slug.
export async function findVesselHref(idOrSlug: string): Promise<string | null> {
  const numeric = /^(?:as-v-)?0*(\d{1,9})$/i.exec(idOrSlug.trim());
  const [row] = await cardQuery()
    .where(
      and(
        publicStatus,
        visibleCategory,
        numeric ? eq(vessels.listingNumber, Number(numeric[1])) : eq(vessels.slug, idOrSlug.trim().toLowerCase()),
      ),
    )
    .limit(1);
  return row ? toCard(row as CardRow, null).href : null;
}

// Same subcategory first, then the rest of the top-level category; the same
// deal type and a similar length rank higher. Never the vessel itself.
export async function getRelatedVessels(vessel: VesselDetail, limit = 4): Promise<VesselCard[]> {
  const topId = vessel.parentCategoryId ?? vessel.categoryId;
  const loa = vessel.loaM ? Number(vessel.loaM) : null;
  const rows = await cardQuery()
    .where(
      and(
        publicStatus,
        visibleCategory,
        ne(vessels.id, vessel.id),
        or(eq(leaf.id, topId), eq(leaf.parentId, topId)),
      ),
    )
    .orderBy(
      sql`(${vessels.categoryId} = ${vessel.categoryId}) desc`,
      sql`(${vessels.transactionType} = ${vessel.transactionType}) desc`,
      loa !== null ? sql`abs(coalesce(${vessels.loaM}, 0) - ${loa}) asc` : sql`1`,
      sql`${vessels.publishedAt} desc nulls last`,
    )
    .limit(limit);
  return toCards(rows as CardRow[]);
}

export interface VesselSitemapEntry {
  path: string;
  updatedAt: Date;
}

export async function getVesselSitemapEntries(): Promise<VesselSitemapEntry[]> {
  const rows = await getPublicDb()
    .select({ ...cardColumns, updatedAt: vessels.updatedAt })
    .from(vessels)
    .innerJoin(leaf, eq(leaf.id, vessels.categoryId))
    .leftJoin(top, eq(top.id, leaf.parentId))
    .where(and(publicStatus, visibleCategory));
  return rows.map((row) => ({ path: toCard(row as CardRow, null).href, updatedAt: row.updatedAt }));
}

// Admin (owner connection, any status): the vessel an enquiry refers to.
export async function getVesselLabelAdmin(
  id: string,
): Promise<{ title: string; ref: string; href: string | null } | null> {
  const [row] = await getDb()
    .select(cardColumns)
    .from(vessels)
    .innerJoin(leaf, eq(leaf.id, vessels.categoryId))
    .leftJoin(top, eq(top.id, leaf.parentId))
    .where(eq(vessels.id, id))
    .limit(1);
  if (!row) return null;
  const card = toCard(row as CardRow, null);
  const isPublic = (PUBLIC_VESSEL_STATUSES as readonly string[]).includes(row.status);
  return { title: card.title, ref: card.ref, href: isPublic ? card.href : null };
}
