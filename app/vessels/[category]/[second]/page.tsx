import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { VesselCatalog } from "@/components/vessels/vessel-catalog";
import { VesselDetail } from "@/components/vessels/vessel-detail";
import { findCategory, getVesselBySlug } from "@/lib/db/vessels";
import type { SearchParams } from "@/lib/search-params";
import { breadcrumbJsonLd, vesselListMetadata, vesselMetadata } from "@/lib/seo";
import { hasActiveFilters, parseVesselFilters } from "@/lib/vessels";

export const dynamic = "force-dynamic";

type Props = { params: { category: string; second: string }; searchParams: SearchParams };

// /vessels/[category]/[second] is a subcategory page — or, for a vessel filed
// directly under a top-level category, that vessel's detail page.
async function resolve(params: Props["params"]) {
  const sub = await findCategory(params.category, params.second);
  if (sub?.subcategory) return { kind: "subcategory" as const, ...sub, subcategory: sub.subcategory };
  const vessel = await getVesselBySlug(params.second);
  if (vessel) return { kind: "vessel" as const, vessel };
  return null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const found = await resolve(params);
  if (!found) return { title: "Not found" };
  if (found.kind === "vessel") return vesselMetadata(found.vessel);
  const filters = parseVesselFilters(searchParams);
  const { category, subcategory } = found;
  return vesselListMetadata({
    title: `${subcategory.name} for sale and charter`,
    description: subcategory.description || `${subcategory.name} (${category.name}) offered for sale or charter through AnchorShip NL.`,
    path: subcategory.href,
    page: filters.page,
    filtered: hasActiveFilters(filters),
  });
}

export default async function VesselSubcategoryPage({ params, searchParams }: Props) {
  const found = await resolve(params);
  if (!found) notFound();

  if (found.kind === "vessel") {
    const requested = `/vessels/${params.category}/${params.second}`;
    if (found.vessel.href !== requested) permanentRedirect(found.vessel.href);
    return <VesselDetail vessel={found.vessel} searchParams={searchParams} />;
  }

  const { category, subcategory } = found;
  const breadcrumb = [
    { label: "Home", href: "/" },
    { label: "Vessels", href: "/vessels" },
    { label: category.name, href: category.href },
    { label: subcategory.name },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(breadcrumb) }} />
      <VesselCatalog
        pathname={subcategory.href}
        eyebrow={category.name}
        title={subcategory.name}
        intro={subcategory.description || `${subcategory.name} vessels offered for sale or charter through AnchorShip NL.`}
        breadcrumb={breadcrumb}
        filters={parseVesselFilters(searchParams)}
        scope={{ subcategoryId: subcategory.id }}
        activeCategory={category.slug}
        activeSubcategory={subcategory.slug}
        subcategories={category.children}
      />
    </>
  );
}
