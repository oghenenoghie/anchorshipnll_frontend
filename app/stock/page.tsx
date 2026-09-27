import type { Metadata } from "next";
import Link from "next/link";
import { StockCard } from "@/components/stock-card";
import { buttonVariants } from "@/components/ui/button";
import { listingHref } from "@/lib/data/stock";
import { getStockOverview, type StockListing } from "@/lib/db/queries";

export const metadata: Metadata = {
  title: "Stock updates",
  description:
    "New arrivals, expected stock and recently sold marine diesel engines and spare parts at AnchorShip NL.",
  alternates: { canonical: "/stock" },
};

export const dynamic = "force-dynamic";

function Shelf({
  id,
  eyebrow,
  title,
  description,
  items,
  empty,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: StockListing[];
  empty: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-b border-border py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="font-body text-label font-medium uppercase text-fog">{eyebrow}</p>
        <h2 id={`${id}-title`} className="mt-2 font-display text-display-lg font-bold text-hull">
          {title}
        </h2>
        <p className="mt-2 max-w-xl font-body text-steel">{description}</p>
        {items.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <StockCard
                key={item.sku}
                href={listingHref(item)}
                title={item.title}
                subtitle={item.subtitle}
                sku={item.sku}
                quantity={item.quantity}
                status={item.status}
                image={item.images[0]}
              />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-md border border-border bg-surface-1 px-4 py-3 font-body text-sm text-steel">
            {empty}
          </p>
        )}
      </div>
    </section>
  );
}

export default async function StockPage() {
  const { newArrivals, expected, recentlySold } = await getStockOverview();

  return (
    <>
      <section className="border-b border-border bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="font-body text-label font-medium uppercase text-blueprint">Stock</p>
          <h1 className="mt-2 font-display text-display-lg font-bold text-hull">What&apos;s moving in the yard</h1>
          <p className="mt-3 max-w-xl font-body text-steel">
            The latest arrivals, stock on its way to our Rotterdam yard, and what has recently sold. Expected items
            can be reserved before they land.
          </p>
          <nav aria-label="Stock sections" className="mt-6 flex flex-wrap gap-3">
            {[
              ["#new-arrivals", "New arrivals"],
              ["#expected", "Expected"],
              ["#recently-sold", "Recently sold"],
            ].map(([href, label]) => (
              <a key={href} href={href} className={buttonVariants({ variant: "secondary" })}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <Shelf
        id="new-arrivals"
        eyebrow="Available now"
        title="New arrivals"
        description="Recently catalogued and available now."
        items={newArrivals}
        empty="Nothing new this week — browse the full catalog below."
      />
      <Shelf
        id="expected"
        eyebrow="Inbound"
        title="Expected stock"
        description="In transit or awaiting teardown. Enquire now to reserve ahead of arrival."
        items={expected}
        empty="No inbound stock listed right now."
      />
      <Shelf
        id="recently-sold"
        eyebrow="Track record"
        title="Recently sold"
        description="Kept online for reference — if you need the same part, ask and we'll source another."
        items={recentlySold}
        empty="No recent sales to show yet."
      />

      <section className="py-14">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/parts" className={buttonVariants({ variant: "primary" })}>
            Browse all parts
          </Link>
          <Link href="/engines" className={buttonVariants({ variant: "secondary" })}>
            Browse engines
          </Link>
        </div>
      </section>
    </>
  );
}
