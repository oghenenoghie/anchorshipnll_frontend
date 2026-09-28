import {
  pgTable,
  pgEnum,
  text,
  integer,
  numeric,
  timestamp,
  uuid,
  jsonb,
  index,
  boolean,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const stockStatusEnum = pgEnum("stock_status", [
  "available",
  "reserved",
  "expected",
  "sold",
]);

export const stockCategoryEnum = pgEnum("stock_category", ["part", "engine"]);

export type StockStatusValue = (typeof stockStatusEnum.enumValues)[number];
export type StockCategoryValue = (typeof stockCategoryEnum.enumValues)[number];

// A listing photo in object storage (see lib/storage.ts). Array order is
// display order; the first photo is the primary one shown on cards.
export interface StockImage {
  key: string;
  alt: string;
}

// A photo a seller attached to a sell-to-us enquiry, in the private enquiry
// bucket (see lib/storage.ts). `name` is the file name as uploaded, for the
// admin's reference only.
export interface EnquiryPhoto {
  key: string;
  name: string;
}

export interface SpecRow {
  label: string;
  value: string;
}

// A callout on an exploded diagram. `sku` links to stock_items.sku (not a
// DB foreign key — jsonb can't enforce one) so a hotspot can point at a
// listing without knowing its uuid, matching the sku-first identity the rest
// of the app uses. Null until an admin assigns it.
export interface Hotspot {
  id: string;
  x: number;
  y: number;
  label: string;
  sku: string | null;
}

export const drawings = pgTable("drawings", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  brand: text("brand").notNull(),
  // Engine model family the drawing belongs to (e.g. "W32"); links it to the
  // /brands/[brand]/[model] hub. Optional.
  model: text("model"),
  imageUrl: text("image_url").notNull(),
  hotspots: jsonb("hotspots").$type<Hotspot[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stockItems = pgTable(
  "stock_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sku: text("sku").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    brand: text("brand").notNull(),
    // Engine model family (e.g. "W32", "3512C") for the /brands/[brand]/[model]
    // hub. Optional — generic parts may fit several models.
    model: text("model"),
    category: stockCategoryEnum("category").notNull(),
    // OEM part numbers this listing matches, searched via the GIN index below.
    oemNumbers: text("oem_numbers").array().notNull().default([]),
    status: stockStatusEnum("status").notNull().default("available"),
    quantity: integer("quantity").notNull().default(0),
    description: text("description").notNull().default(""),
    specs: jsonb("specs").$type<SpecRow[]>().notNull().default([]),
    images: jsonb("images").$type<StockImage[]>().notNull().default([]),
    // Lowercased, accent-free text of the sku, title, subtitle, brand and OEM
    // numbers, plus punctuation-free copies of the part numbers ("dr2231").
    // Maintained by a database trigger (migration 0005); never written by the app.
    searchKey: text("search_key").notNull().default(""),
    priceOnApplication: numeric("price_on_application", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("stock_items_oem_numbers_gin_idx").using("gin", table.oemNumbers),
    index("stock_items_search_key_trgm_idx").using("gin", sql`${table.searchKey} gin_trgm_ops`),
  ],
);

export const enquiryKindEnum = pgEnum("enquiry_kind", ["rfq", "contact", "sell_to_us", "vessel"]);
export const enquiryStatusEnum = pgEnum("enquiry_status", ["new", "handled"]);

export type EnquiryKindValue = (typeof enquiryKindEnum.enumValues)[number];
export type EnquiryStatusValue = (typeof enquiryStatusEnum.enumValues)[number];

// Every public-form submission (RFQ, contact, sell-to-us), saved before the
// notification email goes out so a lead survives a failed send. Fields a given
// form doesn't collect stay null. `sku` is free text, not a foreign key — buyers
// quote OEM numbers and SKUs that may not match a listing.
export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: enquiryKindEnum("kind").notNull(),
    status: enquiryStatusEnum("status").notNull().default("new"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    phone: text("phone"),
    sku: text("sku"),
    quantity: integer("quantity"),
    brand: text("brand"),
    location: text("location"),
    message: text("message").notNull().default(""),
    photos: jsonb("photos").$type<EnquiryPhoto[]>().notNull().default([]),
    // The vessel a "vessel" enquiry is about. Kept when the listing is
    // deleted (set null) so the lead survives.
    vesselId: uuid("vessel_id").references(() => vessels.id, { onDelete: "set null" }),
    emailSent: boolean("email_sent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("enquiries_status_created_at_idx").on(table.status, table.createdAt)],
);

// --- Vessel brokerage ---------------------------------------------------

// Two-level vessel taxonomy (e.g. BARGE → Deck Barge). Rows, not code, so the
// admin can rename, reorder, nest and retire categories. Slugs are unique
// among siblings: "tug" is both a top-level category and a child of AHT/AHTS.
export const vesselCategories = pgTable(
  "vessel_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id").references((): AnyPgColumn => vesselCategories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    imageKey: text("image_key"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    // Labels copied as observed from the reference site that look like
    // placeholders (e.g. "Mobile 1"); flagged for the admin to rename.
    needsReview: boolean("needs_review").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("vessel_categories_parent_slug_idx").on(table.parentId, table.slug),
    uniqueIndex("vessel_categories_root_slug_idx").on(table.slug).where(sql`${table.parentId} IS NULL`),
    index("vessel_categories_parent_sort_idx").on(table.parentId, table.sortOrder),
  ],
);

export const vesselTransactionEnum = pgEnum("vessel_transaction", ["sale", "charter", "sale_and_charter"]);
// draft and archived are admin-only; the rest are public, and sold /
// chartered / under_offer stay live as trust signals.
export const vesselStatusEnum = pgEnum("vessel_status", [
  "draft",
  "published",
  "under_offer",
  "sold",
  "chartered",
  "archived",
]);

export type VesselTransactionValue = (typeof vesselTransactionEnum.enumValues)[number];
export type VesselStatusValue = (typeof vesselStatusEnum.enumValues)[number];

export const PUBLIC_VESSEL_STATUSES = ["published", "under_offer", "sold", "chartered"] as const satisfies readonly VesselStatusValue[];

export const vessels = pgTable(
  "vessels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Human-facing listing number, shown as AS-V-0001.
    listingNumber: integer("listing_number").generatedAlwaysAsIdentity().notNull().unique(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    transactionType: vesselTransactionEnum("transaction_type").notNull(),
    status: vesselStatusEnum("status").notNull().default("draft"),
    // The most specific category — normally a subcategory; its parent is the
    // top-level category. Kept as one column so the two can't disagree.
    categoryId: uuid("category_id")
      .notNull()
      .references(() => vesselCategories.id, { onDelete: "restrict" }),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    location: text("location"),
    country: text("country"),
    yearBuilt: integer("year_built"),
    builder: text("builder"),
    flag: text("flag"),
    imoNumber: text("imo_number"),
    classNotation: text("class_notation"),
    dwt: integer("dwt"),
    gt: integer("gt"),
    nt: integer("nt"),
    loaM: numeric("loa_m", { precision: 7, scale: 2 }),
    lbpM: numeric("lbp_m", { precision: 7, scale: 2 }),
    beamM: numeric("beam_m", { precision: 6, scale: 2 }),
    depthM: numeric("depth_m", { precision: 6, scale: 2 }),
    draftM: numeric("draft_m", { precision: 6, scale: 2 }),
    // Free text: "Price on application", "EUR 1.25m", "USD 4,500/day".
    askingTerms: text("asking_terms"),
    charterAvailability: text("charter_availability"),
    featured: boolean("featured").notNull().default(false),
    featuredRank: integer("featured_rank"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    // Fictional sample listings carry a visible "Sample listing" marker.
    isDemo: boolean("is_demo").notNull().default(false),
    // Maintained by a trigger (migration 0010), like stock_items.search_key.
    searchKey: text("search_key").notNull().default(""),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("vessels_category_idx").on(table.categoryId),
    index("vessels_status_published_idx").on(table.status, table.publishedAt),
    index("vessels_transaction_idx").on(table.transactionType),
    index("vessels_country_idx").on(table.country),
    index("vessels_year_idx").on(table.yearBuilt),
    index("vessels_dwt_idx").on(table.dwt),
    index("vessels_loa_idx").on(table.loaM),
    index("vessels_featured_idx").on(table.featured, table.featuredRank),
    index("vessels_updated_idx").on(table.updatedAt),
    index("vessels_search_key_trgm_idx").using("gin", sql`${table.searchKey} gin_trgm_ops`),
  ],
);

// Object keys in the public stock-photos bucket (vessels/<uuid>.<ext>);
// URLs are built at read time. sort_order 0 / is_primary is the lead photo.
export const vesselImages = pgTable(
  "vessel_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vesselId: uuid("vessel_id")
      .notNull()
      .references(() => vessels.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    alt: text("alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("vessel_images_vessel_idx").on(table.vesselId, table.sortOrder)],
);

// Grouped key/value technical data (Machinery → Main engine → "Wärtsilä
// 6L32", "3,000", "kW"). Vessel data varies too much for fixed columns.
export const vesselSpecs = pgTable(
  "vessel_specs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vesselId: uuid("vessel_id")
      .notNull()
      .references(() => vessels.id, { onDelete: "cascade" }),
    groupName: text("group_name").notNull(),
    label: text("label").notNull(),
    value: text("value").notNull(),
    unit: text("unit"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("vessel_specs_vessel_idx").on(table.vesselId, table.sortOrder)],
);
