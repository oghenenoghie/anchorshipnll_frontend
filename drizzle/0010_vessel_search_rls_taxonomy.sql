-- Vessel search key, public read access with row-level security, and the
-- vessel category tree.

-- Search key: lowercased, accent-free text of the listing, its category
-- names and its spec values (so "wartsila" or "3512c" finds vessels by
-- engine), matched by position() and word_similarity() like stock_items.
CREATE OR REPLACE FUNCTION vessels_search_key() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cats text;
  specs text;
BEGIN
  SELECT concat_ws(' ', c.name, p.name) INTO cats
  FROM vessel_categories c LEFT JOIN vessel_categories p ON p.id = c.parent_id
  WHERE c.id = NEW.category_id;
  SELECT string_agg(s.value, ' ') INTO specs FROM vessel_specs s WHERE s.vessel_id = NEW.id;
  NEW.search_key := lower(unaccent(concat_ws(' ', NEW.title, NEW.summary, cats, NEW.builder, NEW.location,
    NEW.country, NEW.flag, NEW.class_notation, NEW.imo_number, 'AS-V-' || lpad(NEW.listing_number::text, 4, '0'), specs)));
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER vessels_search_key BEFORE INSERT OR UPDATE ON "vessels" FOR EACH ROW EXECUTE FUNCTION vessels_search_key();--> statement-breakpoint
-- Renaming a category refreshes the search key of the vessels under it.
CREATE OR REPLACE FUNCTION vessel_categories_refresh_search() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE vessels SET search_key = search_key
    WHERE category_id = NEW.id OR category_id IN (SELECT id FROM vessel_categories WHERE parent_id = NEW.id);
  END IF;
  RETURN NULL;
END $$;--> statement-breakpoint
CREATE TRIGGER vessel_categories_refresh_search AFTER UPDATE ON "vessel_categories" FOR EACH ROW EXECUTE FUNCTION vessel_categories_refresh_search();--> statement-breakpoint
-- Spec edits refresh the vessel's search key too.
CREATE OR REPLACE FUNCTION vessel_specs_refresh_search() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE vessels SET search_key = search_key
  WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.vessel_id ELSE NEW.vessel_id END;
  RETURN NULL;
END $$;--> statement-breakpoint
CREATE TRIGGER vessel_specs_refresh_search AFTER INSERT OR UPDATE OR DELETE ON "vessel_specs"
  FOR EACH ROW EXECUTE FUNCTION vessel_specs_refresh_search();--> statement-breakpoint

-- web_public (see 0008) reads active categories and public vessels with
-- their photos and specs. Drafts and archived listings stay invisible to it;
-- vessel enquiries go through the existing enquiries insert policy.
GRANT SELECT ON "vessel_categories", "vessels", "vessel_images", "vessel_specs" TO web_public;--> statement-breakpoint
ALTER TABLE "vessel_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vessels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vessel_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vessel_specs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "web_public reads active categories" ON "vessel_categories" FOR SELECT TO web_public USING ("active");--> statement-breakpoint
CREATE POLICY "web_public reads public vessels" ON "vessels" FOR SELECT TO web_public
  USING ("status" IN ('published', 'under_offer', 'sold', 'chartered'));--> statement-breakpoint
CREATE POLICY "web_public reads public vessel images" ON "vessel_images" FOR SELECT TO web_public
  USING (EXISTS (SELECT 1 FROM vessels v WHERE v.id = vessel_id AND v.status IN ('published', 'under_offer', 'sold', 'chartered')));--> statement-breakpoint
CREATE POLICY "web_public reads public vessel specs" ON "vessel_specs" FOR SELECT TO web_public
  USING (EXISTS (SELECT 1 FROM vessels v WHERE v.id = vessel_id AND v.status IN ('published', 'under_offer', 'sold', 'chartered')));--> statement-breakpoint

-- The category tree, as observed on the reference site (overlaps included;
-- labels that look like placeholders are flagged needs_review for the admin).
INSERT INTO "vessel_categories" ("name", "slug", "description", "sort_order") VALUES
  ('AHT/AHTS', 'aht-ahts', 'Anchor-handling tugs and anchor-handling tug/supply vessels for rig moves, towage and offshore support.', 0),
  ('Barge', 'barge', 'Deck, cargo and hopper barges for construction, dredging support and inland or coastal transport.', 10),
  ('Bulk Carrier', 'bulk-carrier', 'Dry bulk tonnage for grain, ore, coal and other free-flowing cargoes.', 20),
  ('Cable Laying Vessel', 'cable-laying-vessel', 'Purpose-built vessels for laying, burying and repairing subsea power and telecom cables.', 30),
  ('Container Ship', 'container-ship', 'Cellular and geared container tonnage from feeder to regional sizes.', 40),
  ('Dry Cargo', 'dry-cargo', 'Breakbulk, general, reefer and ro-ro dry cargo tonnage.', 50),
  ('Dredger', 'dredger', 'Mechanical and hydraulic dredgers for port maintenance, reclamation and marine works.', 60),
  ('Equipment', 'equipment', 'Offshore and marine equipment: cranes, platforms, pontoons, ROVs and engines.', 70),
  ('Fishing Boat', 'fishing-boat', 'Longliners, seiners and trawlers.', 80),
  ('Ferry', 'ferry', 'Passenger and vehicle ferries.', 90),
  ('General Cargo', 'general-cargo', 'General cargo tonnage for mixed and project cargoes.', 100),
  ('Jackup Barge', 'jackup-barge', 'Self-elevating platforms and submersible units for offshore and nearshore work.', 110),
  ('Mobile Refinery', 'mobile-refinery', 'Floating and modular refining units.', 120),
  ('Multi-Purpose', 'multi-purpose', 'Multi-purpose vessels that switch between container, breakbulk and project cargo.', 130),
  ('Offshore Supply', 'offshore-supply', 'Platform supply and offshore support vessels.', 140),
  ('Passenger', 'passenger', 'Accommodation units, crew and patrol boats, cruise ships and ferries.', 150),
  ('Pipe Laying Vessel', 'pipe-laying-vessel', 'J-lay and S-lay pipelay barges and vessels.', 160),
  ('Research Vessel', 'research-vessel', 'Survey, oceanographic, seismic and tender vessels.', 170),
  ('Tanker Vessels', 'tanker-vessels', 'Chemical, product, crude, gas, bunker and asphalt tankers.', 180),
  ('Tanker', 'tanker', 'Tankers not listed under a more specific tanker type.', 190),
  ('Tug', 'tug', 'Harbour, coastal and ocean-going tugs.', 200)
ON CONFLICT ("slug") WHERE "parent_id" IS NULL DO NOTHING;--> statement-breakpoint
INSERT INTO "vessel_categories" ("parent_id", "name", "slug", "sort_order", "needs_review")
SELECT p.id, c.name, c.slug, c.sort_order, c.needs_review
FROM (VALUES
  ('aht-ahts', 'Anchor-Handling Tug (AHT)', 'anchor-handling-tug-aht', 0, false),
  ('aht-ahts', 'Anchor-Handling Tug/Supply (AHTS)', 'anchor-handling-tug-supply-ahts', 10, false),
  ('aht-ahts', 'Tug Boats', 'tug-boats', 20, false),
  ('barge', 'Deck Barge', 'deck-barge', 0, false),
  ('barge', 'Dry Bulk Cargo Barges', 'dry-bulk-cargo-barges', 10, false),
  ('barge', 'Liquid Cargo Barges', 'liquid-cargo-barges', 20, false),
  ('barge', 'Split Hopper Barge', 'split-hopper-barge', 30, false),
  ('bulk-carrier', 'Bulk Carrier', 'bulk-carrier', 0, false),
  ('cable-laying-vessel', 'Cable Laying Ship', 'cable-laying-ship', 0, false),
  ('cable-laying-vessel', 'Cable Repair Ships', 'cable-repair-ships', 10, false),
  ('container-ship', 'Container Ship', 'container-ship', 0, false),
  ('dry-cargo', 'Breakbulk Dry Cargo', 'breakbulk-dry-cargo', 0, false),
  ('dry-cargo', 'Container Cargo', 'container-cargo', 10, false),
  ('dry-cargo', 'General Dry Cargo', 'general-dry-cargo', 20, false),
  ('dry-cargo', 'Reefer Cargo', 'reefer-cargo', 30, false),
  ('dry-cargo', 'Ro-Ro', 'ro-ro', 40, false),
  ('dredger', 'Backhoe/Dipper Dredgers', 'backhoe-dipper-dredgers', 0, false),
  ('dredger', 'Bucket Dredgers', 'bucket-dredgers', 10, false),
  ('dredger', 'Cutter-Suction', 'cutter-suction', 20, false),
  ('dredger', 'Grab Dredgers', 'grab-dredgers', 30, false),
  ('dredger', 'Trailing Suction', 'trailing-suction', 40, false),
  ('equipment', 'Crane', 'crane', 0, false),
  ('equipment', 'Gas Production Platform', 'gas-production-platform', 10, false),
  ('equipment', 'Outbound Engines', 'outbound-engines', 20, true),
  ('equipment', 'Pontoon', 'pontoon', 30, false),
  ('equipment', 'ROV', 'rov', 40, false),
  ('fishing-boat', 'Longliner Fishing Boats', 'longliner-fishing-boats', 0, false),
  ('fishing-boat', 'Seiner Fishing Boats', 'seiner-fishing-boats', 10, false),
  ('fishing-boat', 'Trawler Fishing Boats', 'trawler-fishing-boats', 20, false),
  ('ferry', 'Ferry', 'ferry', 0, false),
  ('general-cargo', 'General Cargo', 'general-cargo', 0, false),
  ('jackup-barge', 'Platforms', 'platforms', 0, false),
  ('jackup-barge', 'Submersibles', 'submersibles', 10, false),
  ('mobile-refinery', 'Mobile 1', 'mobile-1', 0, true),
  ('mobile-refinery', 'Mobile 2', 'mobile-2', 10, true),
  ('multi-purpose', 'Multi-Purpose Vessel', 'multi-purpose-vessel', 0, false),
  ('offshore-supply', 'Offshore Supply Vessel', 'offshore-supply-vessel', 0, false),
  ('passenger', 'Accommodation', 'accommodation', 0, false),
  ('passenger', 'Crew/Patrol Boat', 'crew-patrol-boat', 10, false),
  ('passenger', 'Cruise Ships', 'cruise-ships', 20, false),
  ('passenger', 'Ferries', 'ferries', 30, false),
  ('pipe-laying-vessel', 'J-Lay Barges', 'j-lay-barges', 0, false),
  ('pipe-laying-vessel', 'S-Lay Barges', 's-lay-barges', 10, false),
  ('research-vessel', 'Hydrographic Survey', 'hydrographic-survey', 0, false),
  ('research-vessel', 'Oceanographic Research', 'oceanographic-research', 10, false),
  ('research-vessel', 'Passenger/Pilot Crew Tender', 'passenger-pilot-crew-tender', 20, false),
  ('research-vessel', 'Seismic Vessel', 'seismic-vessel', 30, false),
  ('tanker-vessels', 'Asphalt/Bitumen Carriers', 'asphalt-bitumen-carriers', 0, false),
  ('tanker-vessels', 'Bunker Tanker', 'bunker-tanker', 10, false),
  ('tanker-vessels', 'Chemical Tanker', 'chemical-tanker', 20, false),
  ('tanker-vessels', 'Crude Oil Tanker', 'crude-oil-tanker', 30, false),
  ('tanker-vessels', 'LNG/LPG', 'lng-lpg', 40, false),
  ('tanker-vessels', 'Product Tankers', 'product-tankers', 50, false),
  ('tanker', 'Tanker', 'tanker', 0, false),
  ('tug', 'Tug', 'tug', 0, false)
) AS c(parent_slug, name, slug, sort_order, needs_review)
JOIN "vessel_categories" p ON p.slug = c.parent_slug AND p.parent_id IS NULL
ON CONFLICT ("parent_id", "slug") DO NOTHING;
