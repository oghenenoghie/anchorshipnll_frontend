import type { Metadata } from "next";
import Link from "next/link";
import { BRANDS, modelHref } from "@/lib/data/stock";
import { getBrandSummaries } from "@/lib/db/queries";

export const metadata: Metadata = {
  title: "Brands",
  description: "Marine diesel engines and spare parts by manufacturer — Wärtsilä, MAN, MaK, Deutz and Caterpillar.",
  alternates: { canonical: "/brands" },
};

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const summaries = await getBrandSummaries();
  const byBrand = new Map(summaries.map((s) => [s.brand, s]));

  return (
    <>
      <section className="border-b border-border bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="font-body text-label font-medium uppercase text-blueprint">Catalog</p>
          <h1 className="mt-2 font-display text-display-lg font-bold text-hull">Brands</h1>
          <p className="mt-3 max-w-xl font-body text-steel">
            Browse by manufacturer, then by engine model — each model page gathers its exploded drawings, engines and
            spare parts in one place.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BRANDS.map((brand) => {
            const summary = byBrand.get(brand.name);
            return (
              <li key={brand.slug} className="rounded-md border border-border bg-surface-1 p-5">
                <Link href={`/brands/${brand.slug}`} className="group block">
                  <h2 className="font-display text-xl font-bold text-hull group-hover:text-blueprint">{brand.name}</h2>
                  <p className="mt-1 font-mono text-data data-num text-fog">{summary?.listings ?? 0} listings</p>
                </Link>
                {summary && summary.models.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {summary.models.map((model) => (
                      <li key={model}>
                        <Link
                          href={modelHref(brand.name, model)}
                          className="inline-block rounded-md border border-border px-2 py-1 font-mono text-xs text-hull hover:border-blueprint hover:text-blueprint"
                        >
                          {model}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
