-- Least-privilege role for public traffic (see lib/db/index.ts getPublicDb).
-- Created NOLOGIN here so the migration also runs on a fresh database; in each
-- environment it's given a password and LOGIN separately, and its connection
-- string goes in DATABASE_URL_PUBLIC. Create it with SQL, not the Neon
-- console/API: roles made there join neon_superuser, which bypasses RLS.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'web_public') THEN
    CREATE ROLE web_public NOLOGIN;
  END IF;
END
$$;--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO web_public;--> statement-breakpoint
GRANT SELECT ON "stock_items", "drawings" TO web_public;--> statement-breakpoint
GRANT INSERT ON "enquiries" TO web_public;--> statement-breakpoint
-- Row-level security. The owner role (admin, migrations) owns the tables and
-- is unaffected; web_public only gets what these policies allow.
ALTER TABLE "stock_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "drawings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "enquiries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Every status (available, reserved, expected, sold) is public by design.
CREATE POLICY "web_public reads listings" ON "stock_items" FOR SELECT TO web_public USING (true);--> statement-breakpoint
CREATE POLICY "web_public reads drawings" ON "drawings" FOR SELECT TO web_public USING (true);--> statement-breakpoint
-- Submissions only: new, unhandled, not yet emailed. No SELECT/UPDATE/DELETE.
CREATE POLICY "web_public submits enquiries" ON "enquiries" FOR INSERT TO web_public
  WITH CHECK ("status" = 'new' AND "email_sent" = false);
