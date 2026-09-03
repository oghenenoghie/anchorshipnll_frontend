import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { StockCard } from "@/components/stock-card";
import { SpecTable } from "@/components/spec-table";

const FEATURED_STOCK = [
  {
    href: "/parts/dr-2231",
    title: "Wärtsilä W32",
    subtitle: "Cylinder head, complete",
    sku: "DR-2231",
    quantity: 4,
    status: "available" as const,
  },
  {
    href: "/parts/dr-1187",
    title: "MAN B&W 6S50MC",
    subtitle: "Fuel injection pump",
    sku: "DR-1187",
    quantity: 1,
    status: "in-stock" as const,
  },
  {
    href: "/parts/dr-0942",
    title: "Caterpillar 3512C",
    subtitle: "Turbocharger assembly",
    sku: "DR-0942",
    quantity: 2,
    status: "expected" as const,
  },
];

const SPECS = [
  { label: "Bore", value: "320 mm" },
  { label: "Stroke", value: "350 mm" },
  { label: "RPM", value: "750" },
  { label: "Output", value: "1,920 kW" },
  { label: "Year", value: "2011" },
];

export default function Home() {
  return (
    <>
      <section className="hero-fill blueprint-grid relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <p className="font-body text-label font-medium uppercase text-blueprint">
            Marine diesel engines &amp; spare parts
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-display-xl font-extrabold text-paper">
            Find the exact part, precisely catalogued.
          </h1>
          <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-fog">
            AnchorShip NL is a B2B marketplace for complete marine diesel engines and spare
            parts — Wärtsilä, MAN, MaK, Deutz, Caterpillar. Search by OEM part number, browse
            by exploded drawing, or request a quote directly.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/parts" className={buttonVariants({ variant: "primary" })}>
              Browse parts
            </Link>
            <Link href="/sell-to-us" className={buttonVariants({ variant: "onDark" })}>
              Sell to us
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface-0 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-body text-label font-medium uppercase text-fog">In the catalog</p>
              <h2 className="mt-2 font-display text-display-lg font-bold text-hull">
                Featured stock
              </h2>
            </div>
            <Link href="/parts" className="hidden font-body text-sm font-semibold text-blueprint sm:block">
              View all parts →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_STOCK.map((item) => (
              <StockCard key={item.sku} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-hull py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="font-body text-label font-medium uppercase text-blueprint">
              Specification
            </p>
            <h2 className="mt-2 font-display text-display-lg font-bold text-paper">
              Wärtsilä W32 — generator set
            </h2>
            <p className="mt-4 max-w-md font-body text-fog">
              Every listing carries the technical data buyers scan first — bore, stroke, RPM,
              output — set in monospace so it reads as data, not decoration.
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-6">
            <SpecTable rows={SPECS} variant="dark" />
          </div>
        </div>
      </section>
    </>
  );
}
