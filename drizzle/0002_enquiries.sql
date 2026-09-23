CREATE TYPE "public"."enquiry_kind" AS ENUM('rfq', 'contact', 'sell_to_us');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'handled');--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "enquiry_kind" NOT NULL,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"phone" text,
	"sku" text,
	"quantity" integer,
	"brand" text,
	"location" text,
	"message" text DEFAULT '' NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "enquiries_status_created_at_idx" ON "enquiries" USING btree ("status","created_at");