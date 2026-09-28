# AnchorShip NL — Frontend

Next.js frontend for **AnchorShip NL** (internal name **Drydock**), a B2B
marketplace for complete marine diesel engines and spare parts (Wärtsilä,
MAN, MaK, Deutz, Caterpillar). See [`anchorshipnll`](https://github.com/oghenenoghie/anchorshipnll)
for the existing Django site this frontend is being built alongside.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS 3** with the AnchorShip design tokens (`tailwind.config.ts`, `app/globals.css`)
- **Fonts**: Archivo (display), IBM Plex Sans (body/UI), IBM Plex Mono (technical data) via `next/font/google`
- **Framer Motion** for restrained, reduced-motion-aware animation
- **Drizzle ORM** over **Neon Postgres** — no Supabase; Neon is the single backend for data and object storage
- **Admin auth**: a single-admin credential (env-configured, scrypt-hashed) behind a signed session cookie — see [Admin](#admin) below
- Deploys to **Railway** as a Nixpacks service; `next start -p $PORT`

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Neon / storage / admin values
npm run admin:hash-password -- "your-password"   # paste output into ADMIN_PASSWORD_HASH
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server (`-p $PORT`, Railway-compatible) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate a Drizzle migration from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations (run against `DIRECT_URL`, the unpooled connection) |
| `npm run db:seed` | Insert/upsert the sample listings in `lib/data/stock.ts` into `stock_items` |
| `npm run db:studio` | Drizzle Studio |
| `npm run admin:hash-password -- <password>` | Print a salted scrypt hash for `ADMIN_PASSWORD_HASH` |

## Project structure

```
app/                  App Router routes, layouts, globals.css
  admin/              Admin-only stock CRUD (see Admin below)
components/
  admin/              Admin form + delete-confirm button
  layout/             Header, Footer
  ui/                 Button, StatusBadge — design-system primitives
  stock-card.tsx       Product/listing card
  spec-table.tsx       Drawing-sheet style spec table
lib/
  fonts.ts             next/font Google font config
  utils.ts             cn() class-merge helper
  auth/                Session token signing, password hashing, requireAdmin()
  data/stock.ts        Brand list + sample listings for `db:seed` (not read at runtime)
  db/
    schema.ts          Drizzle schema (Neon Postgres)
    index.ts            getDb() — lazy Drizzle client (neon-http, pooled DATABASE_URL)
    queries.ts           All app-facing DB reads/writes (catalog, facets, detail, search, admin CRUD)
scripts/seed.ts        Upserts lib/data/stock.ts's sample listings into stock_items
scripts/hash-password.ts   Prints an ADMIN_PASSWORD_HASH value
middleware.ts          Gates /admin/* behind a valid session cookie
drizzle.config.ts      Drizzle Kit config (migrations run against DIRECT_URL)
railway.toml           Railway build/deploy config
.github/workflows/ci.yml   Lint, typecheck, build on every push/PR
```

## Design system

Full design spec — colors, type scale, component patterns, motion and
accessibility rules — lives in the `anchorship-design` skill. In short:

- **Palette**: `hull` (dark navy-black), `steel`/`fog` (muted), `paper`/`snow`
  (warm off-white surfaces), `blueprint`/`harbor` (technical accents),
  `signal` (rationed CTA orange), `patina`/`rust` (success/danger).
- **Type**: Archivo for display, IBM Plex Sans for body/UI, IBM Plex Mono
  (`tabular-nums`) for all part numbers and spec data — never set technical
  data in the body sans.
- Small border radii, hairline borders over drop shadows, alternating
  `paper`/`hull` section bands, one primary CTA per view.

## Data layer (Neon)

The catalog is backed by a real Neon Postgres database — `/`, `/parts`,
`/engines`, and both `[sku]` detail routes all query it live via
`lib/db/queries.ts`. Those routes are marked `export const dynamic =
"force-dynamic"` and `lib/db/index.ts`'s client is constructed lazily
(`getDb()`, not a top-level `neon(...)` call), so `next build` — including
CI, which has no `DATABASE_URL` — never touches the database and stays
static/dynamic-classified correctly without needing DB credentials at build
time.

- `DATABASE_URL` — pooled connection string, used at runtime by the admin.
- `DATABASE_URL_PUBLIC` — optional pooled connection string for the
  `web_public` role (`getPublicDb()`). Public pages and the enquiry forms go
  through it: that role can only read `stock_items` and `drawings` and insert
  new enquiries, enforced by grants plus row-level security (migration 0008).
  Unset, it falls back to `DATABASE_URL`.
- `DIRECT_URL` — unpooled connection string, used only for Drizzle migrations.
- Schema lives in `lib/db/schema.ts` (`stock_items`, plus `stock_status` and
  `stock_category` enums); run `npm run db:generate` then `npm run db:migrate`
  to apply changes, then `npm run db:seed` to backfill sample data.
- Part-number search (`getListings` in `lib/db/queries.ts`) runs against
  `stock_items.search_key`: the sku, title, subtitle, brand and OEM numbers,
  lowercased and accent-free (`unaccent`), plus punctuation-free copies of the
  part numbers. A database trigger keeps it current on every insert and update
  (migration `0005`), so the app never writes it.
  - **Exact first:** a substring match on the normalised query, or on its
    punctuation-free form, so `DR2231`, `dr-2231` and `DR 2231` all find
    `DR-2231`, and `wartsila` finds `Wärtsilä`.
  - **Close matches only when nothing matches exactly:** `pg_trgm`
    `word_similarity` of at least 0.55 (see `FUZZY_THRESHOLD`), ranked by score.
    The catalog shows a "No exact match … closest part numbers" notice with an
    enquiry link.
  - The 0.55 threshold was tuned on the live catalog; revisit it if close
    matches get noisy as the catalog grows.
- Row-Level Security is not yet implemented — the app connects with a single
  owner role with full read/write access to `stock_items`. There is no direct
  client-to-Postgres path (no Data API, no browser-side Postgres client), so
  every write already goes through `lib/db/queries.ts` on the server, gated by
  `requireAdmin()`; adding RLS on top would be defense-in-depth, not a
  functional gap, and is still open.

## Listing photos

Photos live in Neon Object Storage, in the `public_read` bucket named by
`NEON_STORAGE_BUCKET` (default `stock-photos`) on the same branch as the database.
The database only stores each photo's key and description, in
`stock_items.images` (first photo = primary).

- **Upload:** the admin stock form's photo manager posts each file to
  `POST /api/admin/photos` (admin session required; JPEG/PNG/WebP/AVIF, max
  15 MB), which writes it to the bucket under `stock/<uuid>.<ext>` and returns
  the key. The photo is attached to the listing when the form is saved.
- **Delete:** removing a photo from a listing, or deleting the listing, deletes
  the file from the bucket after the save succeeds (best effort). Photos
  uploaded to a form that is never saved are left in the bucket.
- **Display:** pages build the public URL from `NEON_STORAGE_ENDPOINT` and serve
  it through `next/image`, which resizes and converts to AVIF/WebP. Without
  storage env vars, listings fall back to a placeholder and uploads return 503.
- **Drawings:** the admin drawing form uploads its image through the same
  route with `kind=drawing` (PNG, WebP or SVG line art — never JPEG), stored
  under `drawings/<uuid>.<ext>`. SVGs containing scripts, event handlers,
  `javascript:` URLs or embedded HTML are refused. A path such as
  `/drawings/example.svg` can still be typed instead. Replacing or deleting a
  drawing deletes its old uploaded image.
- **Branches:** storage branches with the database, so a preview branch sees
  the parent's photos and its own uploads stay on that branch.

## Enquiries

RFQ, contact, and sell-to-us submissions are saved to the `enquiries` table
before the notification email goes out (`lib/enquiries.ts`). Either one
succeeding counts as received: if the DB write fails the email still goes out,
and if the email fails the lead is still in the database. The submitter only
sees the "try again" error when both fail. `email_sent` records whether the
notification actually went out.

`/admin/enquiries` lists them newest first, filterable by type and status
(`new` / `handled`). Each one opens to the full message, with a reply-by-email
link, mark handled / reopen, and delete.

**Sell-to-us photos:** sellers can attach up to 6 photos (JPEG/PNG/WebP/AVIF,
10 MB each), sent with the form. The server action writes them to the
**private** bucket named by `NEON_STORAGE_ENQUIRY_BUCKET` (default
`enquiry-uploads`) under `enquiries/<uuid>.<ext>` and stores the keys in
`enquiries.photos`. A failed upload never loses the enquiry; the notification
email says how many photos arrived or failed. Admins see them on the enquiry
page, served through the session-checked `GET /api/admin/enquiry-photos/<key>`;
deleting the enquiry deletes its photos. `next.config.mjs` raises the server
action body limit to 64 MB for these uploads.

## Vessel marketplace

The ship-brokerage side of the site lives under `/vessels`, next to the parts
and engines catalogue.

- **Taxonomy:** `vessel_categories` is a two-level tree (e.g. Barge → Deck
  Barge), seeded by migration 0010 with the reference site's categories.
  Placeholder-looking labels ("Mobile 1", "Outbound Engines") are flagged
  `needs_review`.
- **Listings:** `vessels`, with photos in `vessel_images` (object keys, like
  `stock_items.images`) and grouped key/value data in `vessel_specs`. A vessel
  points at its most specific category.
- **Statuses:** `published`, `under_offer`, `sold` and `chartered` are public;
  `draft` and `archived` are admin-only. RLS enforces this for `web_public`,
  and the queries in `lib/db/vessels.ts` filter on it too.
- **Routes:**
  - `/vessels` (plus `?type=sale|charter`)
  - `/vessels/[category]`
  - `/vessels/[category]/[subcategory]`
  - `/vessels/[category]/[subcategory]/[slug]`
  - `/vessels/search`
  - Old `/listings/...` addresses redirect.
- **Filters:** all in the URL and applied in SQL, 12 results per page.
- **Search:** keyword search needs every word to appear in `search_key`,
  maintained by a trigger. The key includes category names and spec values,
  so "wartsila" finds vessels by engine. With no exact hit, search falls back
  to per-word trigram matches.
- **Parts links:** machinery specs that name a catalogued engine brand and
  model link to that model's parts hub (`lib/vessel-parts-links.ts`).
- **Enquiries:** vessel enquiries are stored in `enquiries` with
  `kind = 'vessel'` and a `vessel_id`. The form has a honeypot and an
  in-memory per-IP rate limit (`lib/rate-limit.ts`).
- **Sample data:** `npm run db:seed` adds 20 fictional sample vessels
  (`is_demo`), shown with a "Sample listing" badge.

## Admin

`/admin` is a CRUD UI over `stock_items` (plus `drawings`, and the `enquiries` inbox above) — create, edit, and delete listings
of any status/category without touching the database directly.

- **Auth**: a single admin credential, not a full identity provider. Neon
  Auth (Stack Auth) was provisioned on the project during this phase, but the
  Neon MCP tools available in this environment only ever exposed the public
  project ID and publishable key — `STACK_SECRET_SERVER_KEY` is only visible
  in the Neon Console's Auth tab UI, which wasn't reachable from here, and
  email/password sign-in was still disabled on that Stack Auth project. Since
  finishing a real Stack Auth integration wasn't possible without that key,
  admin auth is instead: `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (scrypt, see
  `lib/auth/password.ts`) checked in `app/admin/login/actions.ts`, backing an
  HMAC-signed session cookie (`lib/auth/session.ts`, Web Crypto so it works in
  both `middleware.ts`'s Edge runtime and Server Actions' Node runtime).
  `middleware.ts` gates every `/admin/*` route, and `requireAdmin()` re-checks
  the session inside each admin Server Action as defense in depth.
- **Whoever picks this up later**: if you want full Neon Auth/Stack Auth
  instead, the Stack Auth project already exists
  (`b8dae578-32b7-447f-ba2e-12aa61887e41`) — grab
  `STACK_SECRET_SERVER_KEY` from the Neon Console's Auth tab, install
  `@stackframe/stack`, and swap it in for `lib/auth/*`.
- No UI yet for changing the admin password/adding more admins — update
  `ADMIN_PASSWORD_HASH` via `npm run admin:hash-password` and redeploy.

## Deployment

- **Hosting**: Railway (Nixpacks, see `railway.toml`). The app binds
  `next start -p $PORT`.
- **Database**: Neon Postgres, with a throwaway branch per PR/preview wired
  into Railway preview deploys.
- **Admin auth**: `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` set as Railway service variables (see Admin above).
- **CI**: GitHub Actions runs lint, typecheck, and build on every push and PR
  (`.github/workflows/ci.yml`) — keep it green before deploying.
