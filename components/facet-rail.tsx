import { BRANDS, STATUSES, type StockListing } from "@/lib/data/stock";
import { STATUS_LABEL } from "@/components/ui/status-badge";
import { FacetCheckbox } from "@/components/ui/facet-checkbox";
import { paramValues, toggleParamHref, type SearchParams } from "@/lib/search-params";

function FacetGroup({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <details className="border-b border-border py-4 first:pt-0 last:border-b-0" open>
      <summary className="cursor-pointer list-none font-body text-label font-medium uppercase text-fog [&::-webkit-details-marker]:hidden">
        {heading}
      </summary>
      <div className="mt-3 space-y-0.5">{children}</div>
    </details>
  );
}

export function FacetRail({
  pathname,
  searchParams,
  listingsInCategory,
}: {
  pathname: string;
  searchParams: SearchParams;
  listingsInCategory: StockListing[];
}) {
  const selectedBrands = paramValues(searchParams, "brand");
  const selectedStatuses = paramValues(searchParams, "condition");

  return (
    <nav aria-label="Filters" className="rounded-md border border-border bg-surface-1 p-4">
      <FacetGroup heading="Brand">
        {BRANDS.map((brand) => {
          const count = listingsInCategory.filter((item) => item.brand === brand.name).length;
          if (count === 0) return null;
          return (
            <FacetCheckbox
              key={brand.slug}
              href={toggleParamHref(pathname, searchParams, "brand", brand.slug)}
              checked={selectedBrands.includes(brand.slug)}
              label={brand.name}
              count={count}
            />
          );
        })}
      </FacetGroup>

      <FacetGroup heading="Condition">
        {STATUSES.map((status) => {
          const count = listingsInCategory.filter((item) => item.status === status).length;
          if (count === 0) return null;
          return (
            <FacetCheckbox
              key={status}
              href={toggleParamHref(pathname, searchParams, "condition", status)}
              checked={selectedStatuses.includes(status)}
              label={STATUS_LABEL[status]}
              count={count}
            />
          );
        })}
      </FacetGroup>
    </nav>
  );
}
