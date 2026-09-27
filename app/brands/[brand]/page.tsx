import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { CatalogSections } from "@/components/catalog-sections";
import { findBrand, modelHref } from "@/lib/data/stock";
import { getBrandCatalog } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { brand: string } }): Metadata {
  const brand = findBrand(params.brand);
  if (!brand) return {};
  return {
    title: `${brand.name} engines & spare parts`,
    description: `${brand.name} marine diesel engines, spare parts and exploded drawings, by engine model.`,
    alternates: { canonical: `/brands/${brand.slug}` },
  };
}

export default async function BrandPage({ params }: { params: { brand: string } }) {
  const brand = findBrand(params.brand);
  if (!brand) notFound();
  const { listings, drawings } = await getBrandCatalog(brand.name);

  const counts = new Map<string, number>();
  for (const item of [...listings, ...drawings]) {
    if (item.model) counts.set(item.model, (counts.get(item.model) ?? 0) + 1);
  }
  const models = Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <section className="border-b border-border bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ label: "Brands", href: "/brands" }, { label: brand.name }]} />
          <h1 className="mt-4 font-display text-display-lg font-bold text-hull">{brand.name}</h1>
          <p className="mt-3 max-w-xl font-body text-steel">
            {listings.length} listings{drawings.length > 0 ? ` and ${drawings.length} exploded drawings` : ""}. Pick an
            engine model to see everything that fits it.
          </p>
          {models.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Engine models">
              {models.map(([model, count]) => (
                <li key={model}>
                  <Link
                    href={modelHref(brand.name, model)}
                    className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface-1 px-3 py-1.5 font-mono text-sm text-hull hover:border-blueprint hover:text-blueprint"
                  >
                    {model}
                    <span className="text-xs text-fog">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {listings.length + drawings.length > 0 ? (
          <CatalogSections listings={listings} drawings={drawings} />
        ) : (
          <p className="font-body text-steel">
            Nothing listed for {brand.name} right now —{" "}
            <Link href="/rfq" className="font-medium text-blueprint hover:underline">
              send us the part number
            </Link>{" "}
            and we&apos;ll source it.
          </p>
        )}
      </div>
    </>
  );
}
