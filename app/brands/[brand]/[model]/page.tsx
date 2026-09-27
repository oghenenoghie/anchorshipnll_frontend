import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { CatalogSections } from "@/components/catalog-sections";
import { buttonVariants } from "@/components/ui/button";
import { findBrand, modelSlug } from "@/lib/data/stock";
import { getBrandCatalog } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

async function load(params: { brand: string; model: string }) {
  const brand = findBrand(params.brand);
  if (!brand) return undefined;
  const catalog = await getBrandCatalog(brand.name);
  const inModel = <T extends { model: string | null }>(items: T[]) =>
    items.filter((item) => item.model && modelSlug(item.model) === params.model);
  const listings = inModel(catalog.listings);
  const drawings = inModel(catalog.drawings);
  const model = listings[0]?.model ?? drawings[0]?.model;
  return model ? { brand, model, listings, drawings } : undefined;
}

export async function generateMetadata({ params }: { params: { brand: string; model: string } }): Promise<Metadata> {
  const hub = await load(params);
  if (!hub) return {};
  const name = `${hub.brand.name} ${hub.model}`;
  return {
    title: `${name} — drawings, engines & spare parts`,
    description: `Exploded drawings, complete engines and spare parts for the ${name}.`,
    alternates: { canonical: `/brands/${hub.brand.slug}/${params.model}` },
  };
}

export default async function ModelPage({ params }: { params: { brand: string; model: string } }) {
  const hub = await load(params);
  if (!hub) notFound();
  const { brand, model, listings, drawings } = hub;

  return (
    <>
      <section className="border-b border-border bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[{ label: "Brands", href: "/brands" }, { label: brand.name, href: `/brands/${brand.slug}` }, { label: model }]}
          />
          <p className="mt-4 font-body text-label font-medium uppercase text-blueprint">{brand.name}</p>
          <h1 className="mt-1 font-display text-display-lg font-bold text-hull">
            <span className="font-mono">{model}</span>
          </h1>
          <p className="mt-3 max-w-xl font-body text-steel">
            Everything we hold for the {brand.name} {model}. Can&apos;t see the part you need? Send the OEM number and
            we&apos;ll check the yard.
          </p>
          <Link href="/rfq" className={`${buttonVariants({ variant: "primary" })} mt-6`}>
            Request a {model} part
          </Link>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CatalogSections listings={listings} drawings={drawings} />
      </div>
    </>
  );
}
