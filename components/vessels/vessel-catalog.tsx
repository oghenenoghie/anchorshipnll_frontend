import Link from "next/link";
import { Breadcrumb, type BreadcrumbItem } from "@/components/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form-field";
import { AutoSubmitSelect } from "@/components/vessels/auto-submit-select";
import { CategorySidebar } from "@/components/vessels/category-sidebar";
import { Pagination } from "@/components/vessels/pagination";
import { VesselCard } from "@/components/vessels/vessel-card";
import { VesselFiltersForm } from "@/components/vessels/vessel-filters";
import { getCategoryTree, getVesselCountries, searchVessels, type CategoryNode, type VesselScope } from "@/lib/db/vessels";
import { SORTS, filtersQuery, hasActiveFilters, type VesselFilters } from "@/lib/vessels";
import { cn } from "@/lib/utils";

export async function VesselCatalog({
  pathname,
  eyebrow,
  title,
  intro,
  breadcrumb,
  filters,
  scope = {},
  activeCategory,
  activeSubcategory,
  subcategories = [],
}: {
  pathname: string;
  eyebrow: string;
  title: string;
  intro: string;
  breadcrumb: BreadcrumbItem[];
  filters: VesselFilters;
  scope?: VesselScope;
  activeCategory?: string;
  activeSubcategory?: string;
  subcategories?: CategoryNode[];
}) {
  const [result, tree, countries] = await Promise.all([
    searchVessels(filters, scope),
    getCategoryTree(),
    getVesselCountries(),
  ]);
  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
  const first = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const last = Math.min(result.total, result.page * result.pageSize);
  const active = hasActiveFilters(filters);
  // Filters carry over when switching category, but not the page number.
  const carry = filtersQuery({ ...filters, page: 1 });
  const hiddenParams = new URLSearchParams(filtersQuery({ ...filters, page: 1 }, { sort: null }).slice(1));

  return (
    <>
      <section className="border-b border-border bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumb} />
          <p className="mt-6 font-body text-label font-medium uppercase text-blueprint">{eyebrow}</p>
          <h1 className="mt-2 font-display text-display-lg font-bold text-hull">{title}</h1>
          <p className="mt-3 max-w-2xl font-body text-steel">{intro}</p>
          {subcategories.length > 1 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label={`${title} types`}>
              {subcategories.map((sub) => (
                <li key={sub.id}>
                  <Link
                    href={`${sub.href}${carry}`}
                    aria-current={sub.slug === activeSubcategory ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-body text-sm transition-colors",
                      sub.slug === activeSubcategory
                        ? "border-hull bg-hull text-paper"
                        : "border-border bg-surface-1 text-steel hover:border-border-strong hover:text-hull",
                    )}
                  >
                    {sub.name}
                    <span className="font-mono text-xs data-num opacity-70">{sub.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            {/* Below lg the categories and filters fold behind a toggle; the
                checkbox keeps it working without JavaScript. */}
            <input type="checkbox" id="vessel-filters-toggle" className="peer sr-only" />
            <label
              htmlFor="vessel-filters-toggle"
              className="flex cursor-pointer items-center justify-between rounded-md border border-border-strong bg-surface-1 px-4 py-2.5 font-body text-sm font-semibold text-hull peer-focus-visible:ring-2 peer-focus-visible:ring-blueprint lg:hidden"
            >
              Categories &amp; filters
              {active && <span className="font-mono text-xs font-normal text-blueprint">filters on</span>}
            </label>
            <aside className="mt-4 hidden space-y-6 peer-checked:block lg:sticky lg:top-20 lg:mt-0 lg:block">
              <CategorySidebar tree={tree} activeCategory={activeCategory} activeSubcategory={activeSubcategory} query={carry} />
              <VesselFiltersForm action={pathname} filters={filters} countries={countries} />
            </aside>
          </div>

          <div className="lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <p className="font-mono text-data data-num text-fog" aria-live="polite">
                {result.fuzzy
                  ? `${result.total} close ${result.total === 1 ? "match" : "matches"}`
                  : result.total === 0
                    ? "No vessels"
                    : `Showing ${first}–${last} of ${result.total} ${result.total === 1 ? "vessel" : "vessels"}`}
                {filters.q && <> for &ldquo;{filters.q}&rdquo;</>}
              </p>
              <form action={pathname} method="get" className="flex items-center gap-2">
                {Array.from(hiddenParams).map(([key, value], i) => (
                  <input key={`${key}-${i}`} type="hidden" name={key} value={value} />
                ))}
                <label htmlFor="vessel-sort" className="font-body text-sm text-steel">
                  Sort
                </label>
                <AutoSubmitSelect id="vessel-sort" name="sort" defaultValue={filters.sort} className={cn(inputClass(), "w-auto py-1.5")}>
                  {Object.entries(SORTS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </AutoSubmitSelect>
                <noscript>
                  <button type="submit" className="font-body text-sm font-medium text-blueprint">
                    Go
                  </button>
                </noscript>
              </form>
            </div>

            {result.fuzzy && (
              <p className="mt-4 rounded-md border border-border bg-surface-1 px-4 py-3 font-body text-sm text-steel">
                Nothing matched <span className="font-mono text-hull">&ldquo;{filters.q}&rdquo;</span> exactly. These
                are the closest listings — or{" "}
                <Link href="/contact" className="font-medium text-blueprint hover:underline">
                  tell us what you&apos;re looking for
                </Link>{" "}
                and we&apos;ll search the market.
              </p>
            )}

            {result.vessels.length === 0 ? (
              <div className="mt-10 rounded-md border border-dashed border-border-strong px-6 py-14 text-center">
                <p className="font-display text-xl font-bold text-hull">No vessels match your current search.</p>
                <p className="mx-auto mt-2 max-w-md font-body text-sm text-steel">
                  Many vessels change hands off-market. Tell us what you need and our brokers will look for it.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {active && (
                    <Link href={pathname} className={buttonVariants({ variant: "secondary" })}>
                      Clear filters
                    </Link>
                  )}
                  <Link href="/vessels" className={buttonVariants({ variant: "secondary" })}>
                    Browse all vessels
                  </Link>
                  <Link href="/contact" className={buttonVariants({ variant: "primary" })}>
                    Contact brokerage
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {result.vessels.map((vessel) => (
                  <VesselCard key={vessel.id} vessel={vessel} />
                ))}
              </div>
            )}

            <Pagination
              page={result.page}
              pageCount={result.fuzzy ? 1 : pageCount}
              hrefFor={(page) => `${pathname}${filtersQuery({ ...filters, page })}`}
            />
          </div>
        </div>
      </section>
    </>
  );
}
