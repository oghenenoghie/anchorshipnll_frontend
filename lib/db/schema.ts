import { pgTable, pgEnum, text, integer, numeric, timestamp, uuid } from "drizzle-orm/pg-core";

export const stockStatusEnum = pgEnum("stock_status", [
  "available",
  "reserved",
  "expected",
  "sold",
]);

export const stockItems = pgTable("stock_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: text("sku").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  brand: text("brand").notNull(),
  category: text("category").notNull(),
  // OEM part numbers this listing matches, searched via a GIN index (see drizzle migration).
  oemNumbers: text("oem_numbers").array().notNull().default([]),
  status: stockStatusEnum("status").notNull().default("available"),
  quantity: integer("quantity").notNull().default(0),
  priceOnApplication: numeric("price_on_application", { precision: 12, scale: 2 }),
  cloudinaryPublicId: text("cloudinary_public_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
