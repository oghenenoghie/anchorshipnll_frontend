import type { Metadata } from "next";
import { VesselCatalog } from "@/components/vessels/vessel-catalog";
import type { SearchParams } from "@/lib/search-params";
import { vesselListMetadata } from "@/lib/seo";
import { hasActiveFilters, parseVesselFilters } from "@/lib/vessels";

export const dynamic = "force-dynamic";

const COPY = {
  all: {
    title: "Vessels for sale and charter",
    intro: "Tugs, barges, dredgers, tankers, offshore and passenger tonnage — browse by type or narrow down by size, age and location.",
  },
  sale: {
    title: "Vessels for sale",
    intro: "Second-hand tonnage offered for sale through AnchorShip NL, from harbour tugs to offshore support vessels.",
  },
  charter: {
    title: "Vessels for charter",
    intro: "Vessels and floating equipment available on time, bareboat or project charter.",
  },
};

function copyFor(searchParams: SearchParams) {
  return COPY[parseVesselFilters(searchParams).type ?? "all"];
}

export function generateMetadata({ searchParams }: { searchParams: SearchParams }): Metadata {
  const filters = parseVesselFilters(searchParams);
  const copy = copyFor(searchParams);
  // "For sale" / "for charter" are the two landing pages the nav links to,
  // so they stay indexable; every other filter combination is not.
  const onlyType = filters.type && !hasActiveFilters({ ...filters, type: null });
  return vesselListMetadata({
    title: copy.title,
    description: copy.intro,
    path: onlyType ? `/vessels?type=${filters.type}` : "/vessels",
    page: filters.page,
    filtered: hasActiveFilters(filters) && !onlyType,
  });
}

export default function VesselsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseVesselFilters(searchParams);
  const copy = copyFor(searchParams);
  return (
    <VesselCatalog
      pathname="/vessels"
      eyebrow="Ship brokerage"
      title={copy.title}
      intro={copy.intro}
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Vessels" }]}
      filters={filters}
    />
  );
}
