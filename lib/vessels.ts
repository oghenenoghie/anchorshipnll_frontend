import type { VesselStatusValue, VesselTransactionValue } from "@/lib/db/schema";
import { firstParam, paramValues, type SearchParams } from "@/lib/search-params";

// Display helpers and URL-state parsing for the vessel marketplace. No DB
// access here, so client and server components can both import it.

export const TRANSACTION_LABEL: Record<VesselTransactionValue, string> = {
  sale: "For sale",
  charter: "For charter",
  sale_and_charter: "Sale & charter",
};

export const VESSEL_STATUS_LABEL: Record<VesselStatusValue, string> = {
  draft: "Draft",
  published: "Available",
  under_offer: "Under offer",
  sold: "Sold",
  chartered: "Chartered",
  archived: "Archived",
};

export function listingRef(listingNumber: number): string {
  return `AS-V-${String(listingNumber).padStart(4, "0")}`;
}

export interface CategoryPath {
  categorySlug: string; // top-level
  subcategorySlug: string | null;
}

export function categoryHref({ categorySlug, subcategorySlug }: CategoryPath): string {
  return subcategorySlug ? `/vessels/${categorySlug}/${subcategorySlug}` : `/vessels/${categorySlug}`;
}

export function vesselHref(path: CategoryPath & { slug: string }): string {
  return `${categoryHref(path)}/${path.slug}`;
}

const numberFormat = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });

export function formatNumber(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? numberFormat.format(n) : null;
}

export function withUnit(value: number | string | null | undefined, unit: string): string | null {
  const formatted = formatNumber(value);
  return formatted ? `${formatted} ${unit}` : null;
}

// --- Search / filter URL state ----------------------------------------------

export const SORTS = {
  newest: "Newest",
  updated: "Recently updated",
  featured: "Featured first",
  "year-desc": "Year built (newest)",
  "year-asc": "Year built (oldest)",
  "loa-desc": "Length (largest)",
  "dwt-desc": "Deadweight (largest)",
  name: "Name (A–Z)",
} as const;
export type VesselSort = keyof typeof SORTS;

export const PUBLIC_STATUS_FILTERS = ["published", "under_offer", "sold", "chartered"] as const;
export type PublicStatusFilter = (typeof PUBLIC_STATUS_FILTERS)[number];

export interface VesselFilters {
  q: string;
  type: "sale" | "charter" | null;
  country: string;
  minYear: number | null;
  maxYear: number | null;
  minDwt: number | null;
  maxDwt: number | null;
  minLoa: number | null;
  maxLoa: number | null;
  maxDraft: number | null;
  statuses: PublicStatusFilter[];
  sort: VesselSort;
  page: number;
}

function boundedNumber(raw: string, min: number, max: number): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

// Every value is clamped or dropped, so a hand-edited URL can't produce an
// invalid query — it just loses the bad filter.
export function parseVesselFilters(searchParams: SearchParams): VesselFilters {
  const type = firstParam(searchParams, "type");
  const sort = firstParam(searchParams, "sort");
  const page = Math.floor(boundedNumber(firstParam(searchParams, "page"), 1, 10_000) ?? 1);
  return {
    q: firstParam(searchParams, "q").trim().slice(0, 100),
    type: type === "sale" || type === "charter" ? type : null,
    country: firstParam(searchParams, "country").trim().slice(0, 80),
    minYear: boundedNumber(firstParam(searchParams, "minYear"), 1800, 2200),
    maxYear: boundedNumber(firstParam(searchParams, "maxYear"), 1800, 2200),
    minDwt: boundedNumber(firstParam(searchParams, "minDwt"), 0, 1_000_000),
    maxDwt: boundedNumber(firstParam(searchParams, "maxDwt"), 0, 1_000_000),
    minLoa: boundedNumber(firstParam(searchParams, "minLoa"), 0, 1_000),
    maxLoa: boundedNumber(firstParam(searchParams, "maxLoa"), 0, 1_000),
    maxDraft: boundedNumber(firstParam(searchParams, "maxDraft"), 0, 100),
    statuses: paramValues(searchParams, "status").filter((s): s is PublicStatusFilter =>
      (PUBLIC_STATUS_FILTERS as readonly string[]).includes(s),
    ),
    sort: sort in SORTS ? (sort as VesselSort) : "newest",
    page,
  };
}

const FILTER_KEYS = ["q", "type", "country", "minYear", "maxYear", "minDwt", "maxDwt", "minLoa", "maxLoa", "maxDraft"] as const;

export function hasActiveFilters(filters: VesselFilters): boolean {
  return FILTER_KEYS.some((key) => {
    const value = filters[key];
    return value !== null && value !== "";
  }) || filters.statuses.length > 0;
}

// Rebuilds the query string from parsed filters (so it only ever carries
// clean values), with overrides — used for pagination and sort links.
export function filtersQuery(filters: VesselFilters, overrides: Partial<Record<string, string | null>> = {}): string {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value !== null && value !== "") params.set(key, String(value));
  }
  for (const status of filters.statuses) params.append("status", status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === undefined) params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
