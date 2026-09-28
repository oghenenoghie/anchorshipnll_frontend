CREATE TYPE "public"."vessel_status" AS ENUM('draft', 'published', 'under_offer', 'sold', 'chartered', 'archived');--> statement-breakpoint
CREATE TYPE "public"."vessel_transaction" AS ENUM('sale', 'charter', 'sale_and_charter');--> statement-breakpoint
ALTER TYPE "public"."enquiry_kind" ADD VALUE 'vessel';--> statement-breakpoint
CREATE TABLE "vessel_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_key" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessel_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vessel_id" uuid NOT NULL,
	"key" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessel_specs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vessel_id" uuid NOT NULL,
	"group_name" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"unit" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vessels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_number" integer GENERATED ALWAYS AS IDENTITY (sequence name "vessels_listing_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"transaction_type" "vessel_transaction" NOT NULL,
	"status" "vessel_status" DEFAULT 'draft' NOT NULL,
	"category_id" uuid NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"location" text,
	"country" text,
	"year_built" integer,
	"builder" text,
	"flag" text,
	"imo_number" text,
	"class_notation" text,
	"dwt" integer,
	"gt" integer,
	"nt" integer,
	"loa_m" numeric(7, 2),
	"lbp_m" numeric(7, 2),
	"beam_m" numeric(6, 2),
	"depth_m" numeric(6, 2),
	"draft_m" numeric(6, 2),
	"asking_terms" text,
	"charter_availability" text,
	"featured" boolean DEFAULT false NOT NULL,
	"featured_rank" integer,
	"seo_title" text,
	"seo_description" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"search_key" text DEFAULT '' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vessels_listing_number_unique" UNIQUE("listing_number"),
	CONSTRAINT "vessels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "vessel_id" uuid;--> statement-breakpoint
ALTER TABLE "vessel_categories" ADD CONSTRAINT "vessel_categories_parent_id_vessel_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vessel_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_images" ADD CONSTRAINT "vessel_images_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessel_specs" ADD CONSTRAINT "vessel_specs_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_category_id_vessel_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."vessel_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vessel_categories_parent_slug_idx" ON "vessel_categories" USING btree ("parent_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "vessel_categories_root_slug_idx" ON "vessel_categories" USING btree ("slug") WHERE "vessel_categories"."parent_id" IS NULL;--> statement-breakpoint
CREATE INDEX "vessel_categories_parent_sort_idx" ON "vessel_categories" USING btree ("parent_id","sort_order");--> statement-breakpoint
CREATE INDEX "vessel_images_vessel_idx" ON "vessel_images" USING btree ("vessel_id","sort_order");--> statement-breakpoint
CREATE INDEX "vessel_specs_vessel_idx" ON "vessel_specs" USING btree ("vessel_id","sort_order");--> statement-breakpoint
CREATE INDEX "vessels_category_idx" ON "vessels" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "vessels_status_published_idx" ON "vessels" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "vessels_transaction_idx" ON "vessels" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "vessels_country_idx" ON "vessels" USING btree ("country");--> statement-breakpoint
CREATE INDEX "vessels_year_idx" ON "vessels" USING btree ("year_built");--> statement-breakpoint
CREATE INDEX "vessels_dwt_idx" ON "vessels" USING btree ("dwt");--> statement-breakpoint
CREATE INDEX "vessels_loa_idx" ON "vessels" USING btree ("loa_m");--> statement-breakpoint
CREATE INDEX "vessels_featured_idx" ON "vessels" USING btree ("featured","featured_rank");--> statement-breakpoint
CREATE INDEX "vessels_updated_idx" ON "vessels" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "vessels_search_key_trgm_idx" ON "vessels" USING gin ("search_key" gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE set null ON UPDATE no action;