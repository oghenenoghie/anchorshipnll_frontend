import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { ListingGallery } from "@/components/listing-gallery";
import { SpecTable } from "@/components/spec-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { StockCard } from "@/components/stock-card";
import { listingHref, relatedListings, type StockListing } from "@/lib/data/stock";

export function ListingDetail({
  listing,
  backHref,
  backLabel,
}: {
  listing: StockListing;
  backHref: string;
  backLabel: string;
}) {
  const related = relatedListings(listing);
  const isSold = listing.status === "sold";

  return (
    <>
      <section className="border-b border-border bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: backLabel, href: backHref },
              { label: listing.title },
            ]}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <ListingGallery status={listing.status} alt={`${listing.title} — ${listing.subtitle}`} />

          <div>
            <p className="font-body text-label font-medium uppercase text-blueprint">
              {listing.brand}
            </p>
            <h1 className="mt-2 font-display text-display-lg font-bold text-hull">
              {listing.title}
            </h1>
            <p className="mt-1 font-body text-lg text-steel">{listing.subtitle}</p>

            <div className="mt-4 flex items-center gap-3">
              <StatusBadge status={listing.status} />
              <span className="font-mono text-data data-num text-fog">SKU {listing.sku}</span>
            </div>

            <p className="mt-6 max-w-md font-body leading-relaxed text-steel">
              {listing.description}
            </p>

            <p className="mt-4 font-mono text-data data-num text-fog">
              {isSold ? "Sold — similar listings below" : `${listing.quantity} in stock`}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/rfq?sku=${listing.sku}`}
                className={buttonVariants({ variant: "primary" })}
              >
                Request a quote
              </Link>
              <Link
                href={`/contact?sku=${listing.sku}`}
                className={buttonVariants({ variant: "secondary" })}
              >
                Ask a question
              </Link>
            </div>

            <div className="mt-10 border-t border-border pt-6">
              <p className="font-body text-label font-medium uppercase text-fog">
                OEM / cross-reference numbers
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.oemNumbers.map((number) => (
                  <span
                    key={number}
                    className="rounded-md border border-border bg-surface-1 px-2 py-1 font-mono text-xs text-hull"
                  >
                    {number}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-0 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-body text-label font-medium uppercase text-blueprint">
            Specification
          </p>
          <h2 className="mt-2 font-display text-display-lg font-bold text-hull">
            Technical data
          </h2>
          <div className="mt-8 max-w-xl rounded-md border border-border bg-surface-1 p-6">
            <SpecTable rows={listing.specs} variant="light" />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-hull py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="font-body text-label font-medium uppercase text-blueprint">
              Related
            </p>
            <h2 className="mt-2 font-display text-display-lg font-bold text-paper">
              More from {listing.brand}
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <StockCard
                  key={item.sku}
                  href={listingHref(item)}
                  title={item.title}
                  subtitle={item.subtitle}
                  sku={item.sku}
                  quantity={item.quantity}
                  status={item.status}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
