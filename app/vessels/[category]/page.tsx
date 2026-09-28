import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VesselCatalog } from "@/components/vessels/vessel-catalog";
import { findCategory } from "@/lib/db/vessels";
import type { SearchParams } from "@/lib/search-params";
import { breadcrumbJsonLd, vesselListMetadata } from "@/lib/seo";
import { hasActiveFilters, parseVesselFilters } from "@/lib/vessels";

export const dynamic = "force-dynamic";

type Props = { params: { category: string }; searchParams: SearchParams };

function intro(name: string, description: string | null): string {
  return description || `${name} vessels currently offered for sale or charter through AnchorShip NL.`;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const resolved = await findCategory(params.category);
  if (!resolved) return { title: "Category not found" };
  const filters = parseVesselFilters(searchParams);
  const { category } = resolved;
  return vesselListMetadata({
    title: `${category.name} for sale and charter`,
    description: intro(category.name, category.description),
    path: category.href,
    page: filters.page,
    filtered: hasActiveFilters(filters),
  });
}

export default async function VesselCategoryPage({ params, searchParams }: Props) {
  const resolved = await findCategory(params.category);
  if (!resolved) notFound();
  const { category } = resolved;
  const breadcrumb = [
    { label: "Home", href: "/" },
    { label: "Vessels", href: "/vessels" },
    { label: category.name },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(breadcrumb) }} />
      <VesselCatalog
        pathname={category.href}
        eyebrow="Vessel category"
        title={category.name}
        intro={intro(category.name, category.description)}
        breadcrumb={breadcrumb}
        filters={parseVesselFilters(searchParams)}
        scope={{ categoryId: category.id }}
        activeCategory={category.slug}
        subcategories={category.children}
      />
    </>
  );
}
