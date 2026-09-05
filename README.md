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
- **Cloudinary** as the image/DAM layer for condition photography
- Deploys to **Railway** as a Nixpacks service; `next start -p $PORT`

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Neon / Cloudinary / admin values
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

- `DATABASE_URL` — pooled connection string, used at runtime.
- `DIRECT_URL` — unpooled connection string, used only for Drizzle migrations.
- Schema lives in `lib/db/schema.ts` (`stock_items`, plus `stock_status` and
  `stock_category` enums); run `npm run db:generate` then `npm run db:migrate`
  to apply changes, then `npm run db:seed` to backfill sample data.
- Part-number search runs `ILIKE` over `sku`/`title`/`subtitle` plus an
  `EXISTS (... unnest(oem_numbers) ...)` check, backed by a GIN index on
  `oem_numbers`. `pg_trgm` (fuzzy/typo-tolerant matching) isn't wired in yet.
- Row-Level Security is not yet implemented — the app connects with a single
  owner role with full read/write access to `stock_items`. There is no direct
  client-to-Postgres path (no Data API, no browser-side Postgres client), so
  every write already goes through `lib/db/queries.ts` on the server, gated by
  `requireAdmin()`; adding RLS on top would be defense-in-depth, not a
  functional gap, and is still open.

## Admin

`/admin` is a CRUD UI over `stock_items` — create, edit, and delete listings
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
