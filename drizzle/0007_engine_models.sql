ALTER TABLE "drawings" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "stock_items" ADD COLUMN "model" text;--> statement-breakpoint
-- Backfill the model family for the listings and drawings that existed when
-- the column was added (matched by SKU / slug; no-op on a fresh database).
UPDATE "stock_items" AS s SET "model" = v.model
FROM (VALUES
  ('DR-2231', 'W32'), ('DR-1000', 'W32'), ('DR-1902', 'L20'),
  ('DR-1187', 'S50MC'), ('DR-1440', 'L23/30H'),
  ('DR-1355', 'M32C'), ('DR-1041', 'M32C'), ('DR-1078', 'M25'),
  ('DR-0771', 'TBD620'), ('DR-1063', 'TBD620'), ('DR-0533', 'BF6M1015'),
  ('DR-0942', '3512C'), ('DR-0685', 'C32'), ('DR-1092', '3516C')
) AS v(sku, model)
WHERE s."sku" = v.sku AND s."model" IS NULL;--> statement-breakpoint
UPDATE "drawings" AS d SET "model" = v.model
FROM (VALUES ('wartsila-w32-cylinder-head', 'W32'), ('mak-m32c-piston', 'M32C')) AS v(slug, model)
WHERE d."slug" = v.slug AND d."model" IS NULL;
