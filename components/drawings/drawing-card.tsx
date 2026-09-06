import Link from "next/link";
import type { DrawingSummary } from "@/lib/db/queries";

export function DrawingCard({ drawing }: { drawing: DrawingSummary }) {
  return (
    <Link
      href={`/drawings/${drawing.slug}`}
      className="group block overflow-hidden rounded-md border border-border bg-surface-1 shadow-[0_1px_2px_rgb(14_22_33/.06)] transition-all hover:border-border-strong hover:-translate-y-0.5 motion-reduce:transform-none"
    >
      <div className="aspect-[4/3] bg-snow">
        {/* eslint-disable-next-line @next/next/no-img-element -- local static SVG thumbnail */}
        <img src={drawing.imageUrl} alt={drawing.title} className="h-full w-full object-cover" />
      </div>
      <div className="border-t border-border p-4">
        <p className="font-body text-label font-medium uppercase text-blueprint">{drawing.brand}</p>
        <h3 className="mt-1 font-body text-base font-semibold text-hull">{drawing.title}</h3>
        <span className="mt-3 inline-block font-body text-sm font-semibold text-signal">
          Explore diagram →
        </span>
      </div>
    </Link>
  );
}
