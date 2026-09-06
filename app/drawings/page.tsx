import type { Metadata } from "next";
import { DrawingCard } from "@/components/drawings/drawing-card";
import { getAllDrawings } from "@/lib/db/queries";

export const metadata: Metadata = {
  title: "Exploded diagrams",
  description:
    "Browse in-stock parts directly from an interactive exploded diagram — tap a callout to see condition, availability, and pricing.",
};

export const dynamic = "force-dynamic";

export default async function DrawingsIndexPage() {
  const drawings = await getAllDrawings();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-body text-label font-medium uppercase text-blueprint">Discovery</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">Exploded diagrams</h1>
      <p className="mt-3 max-w-2xl font-body text-steel">
        Find the part you need the way our own techs do — from the drawing. Tap a callout on any
        diagram below to jump straight to that part&apos;s condition, availability, and pricing.
      </p>

      {drawings.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {drawings.map((drawing) => (
            <DrawingCard key={drawing.slug} drawing={drawing} />
          ))}
        </div>
      ) : (
        <p className="mt-10 font-body text-steel">No diagrams published yet — check back soon.</p>
      )}
    </section>
  );
}
