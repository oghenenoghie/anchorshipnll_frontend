import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SpecTable } from "@/components/spec-table";

export const metadata: Metadata = {
  title: "About",
  description:
    "AnchorShip NL is a B2B marketplace for complete marine diesel engines and spare parts — Wärtsilä, MAN, MaK, Deutz, Caterpillar.",
};

const PRINCIPLES = [
  {
    number: "01",
    title: "Drawing-driven discovery",
    body: "Marine parts are hard to search for by name alone. We're building toward exploded-diagram, hotspot-based browsing so you can find the exact part by clicking where it sits on the engine — not guessing at a description.",
  },
  {
    number: "02",
    title: "Condition transparency",
    body: "Used parts and complete engines are sold on trust as much as spec. Every listing carries an honest condition note, and photography is shot to show wear as it actually is — not hidden behind a stock image.",
  },
  {
    number: "03",
    title: "Part-number-first",
    body: "Buyers scan OEM numbers before anything else, so that's how we built the catalog: part numbers and cross-references get room and monospace type, not buried in a paragraph.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-border bg-surface-0 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="font-body text-label font-medium uppercase text-blueprint">Company</p>
          <h1 className="mt-2 font-display text-display-lg font-bold text-hull">
            About AnchorShip NL
          </h1>
          <p className="mt-6 font-body text-lg leading-relaxed text-steel">
            AnchorShip NL is a B2B marketplace for complete marine diesel engines and spare
            parts — Wärtsilä, MAN, MaK, Deutz, Caterpillar. We work with owners, yards and
            operators on both sides of a transaction: sourcing precisely-catalogued stock for
            buyers, and turning surplus equipment into cash for sellers.
          </p>
        </div>
      </section>

      <section className="bg-hull py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-body text-label font-medium uppercase text-blueprint">
            What guides us
          </p>
          <h2 className="mt-2 max-w-2xl font-display text-display-lg font-bold text-paper">
            Every competitor sells similar inventory. We built the catalog around three ideas.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3">
            {PRINCIPLES.map((principle) => (
              <div key={principle.number}>
                <span className="font-mono text-sm text-blueprint">{principle.number}</span>
                <h3 className="mt-2 font-body text-base font-semibold text-paper">
                  {principle.title}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-fog">{principle.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface-0 py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="font-body text-label font-medium uppercase text-blueprint">
              Where we operate
            </p>
            <h2 className="mt-2 font-display text-display-lg font-bold text-hull">
              Rotterdam yard, worldwide buyers.
            </h2>
            <p className="mt-4 max-w-md font-body text-steel">
              Stock moves through our yard in Rotterdam, one of the busiest marine hubs in
              Europe — well placed for collection, inspection and onward shipping wherever
              your vessel or workshop is.
            </p>
          </div>
          <div className="rounded-md border border-border bg-surface-1 p-6">
            <SpecTable
              rows={[
                { label: "Base", value: "Rotterdam, NL" },
                { label: "Shipping", value: "Worldwide" },
                { label: "Brands", value: "5+ OEMs" },
                { label: "Catalog", value: "Engines & parts" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="bg-surface-0 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-display-lg font-bold text-hull">
            Looking for a part, or have stock to sell?
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/parts" className={buttonVariants({ variant: "primary" })}>
              Browse parts
            </Link>
            <Link href="/sell-to-us" className={buttonVariants({ variant: "secondary" })}>
              Sell to us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
