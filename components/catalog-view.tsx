import { FacetRail } from "@/components/facet-rail";
import { StockCard } from "@/components/stock-card";
import { STOCK_LISTINGS, filterStock, type StockCategory } from "@/lib/data/stock";
import { paramValues, type SearchParams } from "@/lib/search-params";

export function CatalogView({
  category,
  pathname,
  eyebrow,
  title,
  description,
  searchParams,
}: {
  category: StockCategory;
  pathname: string;
  eyebrow: string;
  title: string;
  description: string;
  searchParams: SearchParams;
}) {
  const listingsInCategory = STOCK_LISTINGS.filter((item) => item.category === category);

  const q = paramValues(searchParams, "q")[0];
  const filters = {
    q,
    brands: paramValues(searchParams, "brand"),
    statuses: paramValues(searchParams, "condition"),
  };
  const results = filterStock(STOCK_LISTINGS, category, filters);
  const hasActiveFilters = filters.brands.length > 0 || filters.statuses.length > 0 || Boolean(q);

  return (
    <>
      <section className="border-b border-border bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="font-body text-label font-medium uppercase text-blueprint">{eyebrow}</p>
          <h1 className="mt-2 font-display text-display-lg font-bold text-hull">{title}</h1>
          <p className="mt-3 max-w-xl font-body text-steel">{description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <FacetRail
              pathname={pathname}
              searchParams={searchParams}
              listingsInCategory={listingsInCategory}
            />
          </aside>

          <div className="lg:col-span-3">
            <div className="flex items-baseline justify-between border-b border-border pb-4">
              <p className="font-mono text-data data-num text-fog">
                {results.length} {results.length === 1 ? "result" : "results"}
                {q && <> for &ldquo;{q}&rdquo;</>}
              </p>
              {hasActiveFilters && (
                <a href={pathname} className="font-body text-sm font-medium text-blueprint">
                  Clear filters
                </a>
              )}
            </div>

            {results.length === 0 ? (
              <div className="mt-10 rounded-md border border-dashed border-border-strong p-12 text-center">
                <p className="font-body text-steel">No listings match your filters.</p>
                <a
                  href={pathname}
                  className="mt-3 inline-block font-body text-sm font-semibold text-blueprint"
                >
                  Clear filters and start over
                </a>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((item) => (
                  <StockCard
                    key={item.sku}
                    href={`/${category === "engine" ? "engines" : "parts"}/${item.sku.toLowerCase()}`}
                    title={item.title}
                    subtitle={item.subtitle}
                    sku={item.sku}
                    quantity={item.quantity}
                    status={item.status}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
