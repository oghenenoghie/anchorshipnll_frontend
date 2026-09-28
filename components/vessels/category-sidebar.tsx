import Link from "next/link";
import type { CategoryNode } from "@/lib/db/vessels";
import { cn } from "@/lib/utils";

// The vessel taxonomy as a disclosure tree: each top-level category opens to
// its subcategories, and the one being viewed starts open. <details> works
// without JavaScript and is keyboard accessible.
export function CategorySidebar({
  tree,
  activeCategory,
  activeSubcategory,
  query = "",
}: {
  tree: CategoryNode[];
  activeCategory?: string;
  activeSubcategory?: string;
  query?: string; // current filters, kept when switching category
}) {
  return (
    <nav aria-label="Vessel categories" className="rounded-md border border-border bg-surface-1">
      <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <p className="font-body text-label font-medium uppercase text-fog">Categories</p>
        <Link
          href={`/vessels${query}`}
          className={cn("font-body text-xs font-medium", activeCategory ? "text-blueprint hover:underline" : "text-hull")}
          aria-current={activeCategory ? undefined : "page"}
        >
          All vessels
        </Link>
      </div>
      <ul className="max-h-none divide-y divide-border lg:max-h-[70vh] lg:overflow-y-auto">
        {tree.map((category) => {
          const isActive = category.slug === activeCategory;
          const single = category.children.length === 1 && category.children[0].name === category.name;
          return (
            <li key={category.id}>
              <details open={isActive} className="group/cat">
                <summary
                  className={cn(
                    "flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 font-body text-sm [&::-webkit-details-marker]:hidden",
                    isActive ? "font-semibold text-hull" : "text-steel hover:text-hull",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 font-mono text-xs text-fog transition-transform group-open/cat:rotate-90 motion-reduce:transition-none"
                      aria-hidden
                    >
                      ›
                    </span>
                    {category.name}
                  </span>
                  <span className="font-mono text-xs data-num text-fog">{category.count}</span>
                </summary>
                <ul className="pb-2 pl-9 pr-4">
                  <li>
                    <Link
                      href={`${category.href}${query}`}
                      aria-current={isActive && !activeSubcategory ? "page" : undefined}
                      className={cn(
                        "block py-1 font-body text-sm",
                        isActive && !activeSubcategory ? "font-semibold text-blueprint" : "text-steel hover:text-blueprint",
                      )}
                    >
                      All {category.name}
                    </Link>
                  </li>
                  {!single &&
                    category.children.map((child) => {
                      const childActive = isActive && child.slug === activeSubcategory;
                      return (
                        <li key={child.id}>
                          <Link
                            href={`${child.href}${query}`}
                            aria-current={childActive ? "page" : undefined}
                            className={cn(
                              "flex items-baseline justify-between gap-2 py-1 font-body text-sm",
                              childActive ? "font-semibold text-blueprint" : "text-steel hover:text-blueprint",
                            )}
                          >
                            <span>{child.name}</span>
                            <span className="font-mono text-xs data-num text-fog">{child.count}</span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
