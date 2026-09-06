import type { Hotspot } from "@/lib/db/schema";

export interface SeedDrawing {
  slug: string;
  title: string;
  brand: string;
  imageUrl: string;
  hotspots: Hotspot[];
}

// Seed data for `npm run db:seed` — hand-drawn blueprint-style exploded
// views (public/drawings/*.svg) with hotspots pointing at real seeded SKUs
// from lib/data/stock.ts. Not every hotspot needs a linked SKU: most parts
// on a real exploded diagram aren't individually stocked at any given time,
// so a mix of linked/unlinked callouts is the realistic case, not a gap.
export const SEED_DRAWINGS: SeedDrawing[] = [
  {
    slug: "wartsila-w32-cylinder-head",
    title: "Wärtsilä W32 — Cylinder head, exploded view",
    brand: "Wärtsilä",
    imageUrl: "/drawings/wartsila-w32-cylinder-head.svg",
    hotspots: [
      { id: "01", x: 0.75, y: 0.1556, label: "Rocker cover", sku: null },
      { id: "02", x: 0.7667, y: 0.3667, label: "Cylinder head, complete", sku: "DR-2231" },
      { id: "03", x: 0.25, y: 0.5222, label: "Head gasket", sku: null },
      { id: "04", x: 0.25, y: 0.7333, label: "Exhaust valve", sku: null },
    ],
  },
  {
    slug: "mak-m32c-piston",
    title: "MaK M32C — Piston assembly, exploded view",
    brand: "MaK",
    imageUrl: "/drawings/mak-m32c-piston.svg",
    hotspots: [
      { id: "01", x: 0.75, y: 0.1444, label: "Piston crown", sku: null },
      { id: "02", x: 0.25, y: 0.3, label: "Piston ring set", sku: null },
      { id: "03", x: 0.7667, y: 0.4667, label: "Piston with connecting rod", sku: "DR-1355" },
      { id: "04", x: 0.25, y: 0.7222, label: "Connecting rod, big end", sku: null },
    ],
  },
];
