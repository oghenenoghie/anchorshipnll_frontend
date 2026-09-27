CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
ALTER TABLE "stock_items" ADD COLUMN "search_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE OR REPLACE FUNCTION stock_items_search_key() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  base text;
BEGIN
  base := lower(unaccent(concat_ws(' ', NEW.sku, NEW.title, NEW.subtitle, NEW.brand, array_to_string(NEW.oem_numbers, ' '))));
  NEW.search_key := base || ' ' || regexp_replace(base, '[^a-z0-9 ]', '', 'g') || ' ' ||
    (SELECT coalesce(string_agg(regexp_replace(lower(unaccent(x)), '[^a-z0-9]', '', 'g'), ' '), '')
     FROM unnest(array_prepend(NEW.sku, NEW.oem_numbers)) AS x);
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER stock_items_search_key BEFORE INSERT OR UPDATE ON "stock_items" FOR EACH ROW EXECUTE FUNCTION stock_items_search_key();--> statement-breakpoint
UPDATE "stock_items" SET "sku" = "sku";--> statement-breakpoint
CREATE INDEX "stock_items_search_key_trgm_idx" ON "stock_items" USING gin ("search_key" gin_trgm_ops);
