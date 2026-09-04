import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Engines",
  description: "Complete marine diesel engines and generator sets, ready to ship.",
};

export const dynamic = "force-dynamic";

export default function EnginesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <CatalogView
      category="engine"
      pathname="/engines"
      eyebrow="Catalog"
      title="Complete engines"
      description="Complete marine diesel engines and generator sets — Wärtsilä, MAN, MaK, Deutz, Caterpillar."
      searchParams={searchParams}
    />
  );
}
