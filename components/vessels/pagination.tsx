import Link from "next/link";
import { cn } from "@/lib/utils";

// Page links with the neighbours of the current page and the ends, e.g.
// 1 … 4 5 6 … 12.
function pageList(current: number, last: number): (number | "gap")[] {
  const pages = new Set([1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last));
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) out.push("gap");
    out.push(page);
  });
  return out;
}

export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const linkClass = "inline-flex min-w-9 items-center justify-center rounded-md border px-3 py-1.5 font-mono text-sm data-num";
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(linkClass, "border-border font-body text-steel hover:border-border-strong")}>
          ← Previous
        </Link>
      ) : null}
      {pageList(page, pageCount).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-fog" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            className={cn(linkClass, item === page ? "border-hull bg-hull text-paper" : "border-border text-steel hover:border-border-strong")}
          >
            {item}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(linkClass, "border-border font-body text-steel hover:border-border-strong")}>
          Next →
        </Link>
      ) : null}
    </nav>
  );
}
