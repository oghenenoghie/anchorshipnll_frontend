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
} from "drizzle-orm/pg-core";

export const stockStatusEnum = pgEnum("stock_status", [
  "available",
  "reserved",
  "expected",
  "sold",
]);

export const stockCategoryEnum = pgEnum("stock_category", ["part", "engine"]);

export type StockStatusValue = (typeof stockStatusEnum.enumValues)[number];
export type StockCategoryValue = (typeof stockCategoryEnum.enumValues)[number];

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
    category: stockCategoryEnum("category").notNull(),
    // OEM part numbers this listing matches, searched via the GIN index below.
    oemNumbers: text("oem_numbers").array().notNull().default([]),
    status: stockStatusEnum("status").notNull().default("available"),
    quantity: integer("quantity").notNull().default(0),
    description: text("description").notNull().default(""),
    specs: jsonb("specs").$type<SpecRow[]>().notNull().default([]),
    priceOnApplication: numeric("price_on_application", { precision: 12, scale: 2 }),
    cloudinaryPublicId: text("cloudinary_public_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("stock_items_oem_numbers_gin_idx").using("gin", table.oemNumbers)],
);
