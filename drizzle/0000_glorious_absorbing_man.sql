CREATE TYPE "public"."stock_category" AS ENUM('part', 'engine');--> statement-breakpoint
CREATE TYPE "public"."stock_status" AS ENUM('available', 'reserved', 'expected', 'sold');--> statement-breakpoint
CREATE TABLE "stock_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"brand" text NOT NULL,
	"category" "stock_category" NOT NULL,
	"oem_numbers" text[] DEFAULT '{}' NOT NULL,
	"status" "stock_status" DEFAULT 'available' NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"specs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_on_application" numeric(12, 2),
	"cloudinary_public_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_items_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE INDEX "stock_items_oem_numbers_gin_idx" ON "stock_items" USING gin ("oem_numbers");