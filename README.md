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
- **Drizzle ORM** over **Neon Postgres** — no Supabase; Neon is the single backend for data, auth (Neon Auth / Stack), and object storage
- **Cloudinary** as the image/DAM layer for condition photography
- Deploys to **Railway** as a Nixpacks service; `next start -p $PORT`

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Neon / Cloudinary / Stack values
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
| `npm run db:studio` | Drizzle Studio |

## Project structure

```
app/                  App Router routes, layouts, globals.css
components/
  layout/             Header, Footer
  ui/                 Button, StatusBadge — design-system primitives
  stock-card.tsx       Product/listing card
  spec-table.tsx       Drawing-sheet style spec table
lib/
  fonts.ts             next/font Google font config
  utils.ts             cn() class-merge helper
  db/
    schema.ts          Drizzle schema (Neon Postgres)
    index.ts            Drizzle client (neon-http, pooled DATABASE_URL)
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

- `DATABASE_URL` — pooled connection string, used at runtime.
- `DIRECT_URL` — unpooled connection string, used only for Drizzle migrations.
- Schema lives in `lib/db/schema.ts`; run `npm run db:generate` then
  `npm run db:migrate` to apply changes.
- Part-number search will use `pg_trgm` + a GIN index over `oem_numbers`
  (added via a Drizzle migration once search is implemented).
- Row-Level Security enforces the trust model at the database layer: public
  read of `available`/`reserved`/`sold`/`expected` stock, writes restricted
  to the admin role.

## Deployment

- **Hosting**: Railway (Nixpacks, see `railway.toml`). The app binds
  `next start -p $PORT`.
- **Database**: Neon Postgres, with a throwaway branch per PR/preview wired
  into Railway preview deploys.
- **Auth**: Neon Auth (Stack Auth).
- **CI**: GitHub Actions runs lint, typecheck, and build on every push and PR
  (`.github/workflows/ci.yml`) — keep it green before deploying.
