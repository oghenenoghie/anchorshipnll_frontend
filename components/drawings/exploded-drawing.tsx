"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { listingHref } from "@/lib/data/stock";
import type { ResolvedHotspot } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

export function ExplodedDrawing({
  imageUrl,
  title,
  hotspots,
}: {
  imageUrl: string;
  title: string;
  hotspots: ResolvedHotspot[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <figure className="relative w-full overflow-hidden rounded-md border border-border bg-snow">
      {/* eslint-disable-next-line @next/next/no-img-element -- local static SVG, no next/image loader configured */}
      <img src={imageUrl} alt={title} className="block w-full select-none" draggable={false} />

      {hotspots.map((h) => {
        const inStock = Boolean(h.listing);
        const active = activeId === h.id;
        return (
          <div
            key={h.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}
          >
            <button
              type="button"
              onClick={() => setActiveId(active ? null : h.id)}
              aria-expanded={active}
              aria-label={h.label}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full border-2 bg-paper/95 font-mono text-xs font-medium backdrop-blur transition-colors",
                inStock
                  ? "border-signal text-signal"
                  : "border-steel text-steel",
                active && "ring-2 ring-blueprint ring-offset-1 ring-offset-paper",
              )}
            >
              {h.id}
            </button>

            {active && (
              <div className="absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-md border border-border bg-surface-1 p-4 text-left shadow-[0_4px_16px_rgb(14_22_33/.14)]">
                <p className="font-mono text-xs data-num text-fog">Callout {h.id}</p>
                <p className="mt-1 font-body text-sm font-semibold text-hull">{h.label}</p>
                {h.listing ? (
                  <>
                    <div className="mt-2">
                      <StatusBadge status={h.listing.status} />
                    </div>
                    <Link
                      href={listingHref(h.listing)}
                      className="mt-3 inline-block font-body text-xs font-medium text-blueprint hover:underline"
                    >
                      View listing →
                    </Link>
                  </>
                ) : (
                  <p className="mt-2 font-body text-xs text-fog">Not currently linked to stock.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </figure>
  );
}
