import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Parts",
  description: "Marine diesel spare parts — search by OEM part number or browse by brand.",
};

export const dynamic = "force-dynamic";

export default function PartsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <CatalogView
      category="part"
      pathname="/parts"
      eyebrow="Catalog"
      title="Spare parts"
      description="Cylinder heads, injectors, turbochargers and more — search by OEM part number or filter by brand and condition."
      searchParams={searchParams}
    />
  );
}
