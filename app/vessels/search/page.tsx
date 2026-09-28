import type { Metadata } from "next";
import { VesselCatalog } from "@/components/vessels/vessel-catalog";
import type { SearchParams } from "@/lib/search-params";
import { parseVesselFilters } from "@/lib/vessels";

export const dynamic = "force-dynamic";

// Search results are for people, not the index — /vessels is the canonical list.
export const metadata: Metadata = {
  title: "Search vessels",
  description: "Search the AnchorShip NL vessel inventory by name, type, builder, location and size.",
  alternates: { canonical: "/vessels" },
  robots: { index: false, follow: true },
};

export default function VesselSearchPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseVesselFilters(searchParams);
  return (
    <VesselCatalog
      pathname="/vessels/search"
      eyebrow="Search"
      title={filters.q ? `Results for “${filters.q}”` : "Search vessels"}
      intro="Search by vessel name, type, builder, class or port, then narrow the results with the filters."
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Vessels", href: "/vessels" }, { label: "Search" }]}
      filters={filters}
    />
  );
}
