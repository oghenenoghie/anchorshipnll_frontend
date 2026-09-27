import { StockCard } from "@/components/stock-card";
import { DrawingCard } from "@/components/drawings/drawing-card";
import { listingHref } from "@/lib/data/stock";
import type { DrawingSummary, StockListing } from "@/lib/db/queries";

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-12 first:mt-0">
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display text-xl font-bold text-hull">{title}</h2>
        <span className="font-mono text-data data-num text-fog">{count}</span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

// The drawings, engines and parts for a brand or engine model, in the order
// the skill puts discovery: drawings first, then stock. Empty groups are
// left out.
export function CatalogSections({ listings, drawings }: { listings: StockListing[]; drawings: DrawingSummary[] }) {
  const engines = listings.filter((l) => l.category === "engine");
  const parts = listings.filter((l) => l.category === "part");
  const card = (item: StockListing) => (
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
  );

  return (
    <>
      {drawings.length > 0 && (
        <Section title="Exploded drawings" count={drawings.length}>
          {drawings.map((drawing) => (
            <DrawingCard key={drawing.slug} drawing={drawing} />
          ))}
        </Section>
      )}
      {engines.length > 0 && (
        <Section title="Complete engines" count={engines.length}>
          {engines.map(card)}
        </Section>
      )}
      {parts.length > 0 && (
        <Section title="Spare parts" count={parts.length}>
          {parts.map(card)}
        </Section>
      )}
    </>
  );
}
