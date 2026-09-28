import Link from "next/link";
import Image from "next/image";
import type { VesselCard as VesselCardData } from "@/lib/db/vessels";
import { withUnit, formatNumber } from "@/lib/vessels";
import { SampleBadge, TransactionBadge, VesselStatusBadge } from "@/components/vessels/vessel-badges";
import { VesselPlaceholder } from "@/components/vessels/vessel-placeholder";

// At most four key figures, so the card stays scannable.
function keyFacts(vessel: VesselCardData): { label: string; value: string }[] {
  const facts = [
    { label: "Built", value: vessel.yearBuilt ? String(vessel.yearBuilt) : null },
    { label: "LOA", value: withUnit(vessel.loaM, "m") },
    { label: "DWT", value: vessel.dwt ? `${formatNumber(vessel.dwt)} t` : null },
    { label: "GT", value: formatNumber(vessel.gt) },
    { label: "Beam", value: withUnit(vessel.beamM, "m") },
  ];
  return facts.filter((f): f is { label: string; value: string } => Boolean(f.value)).slice(0, 4);
}

export function VesselCard({ vessel, headingLevel = "h3" }: { vessel: VesselCardData; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const facts = keyFacts(vessel);
  const place = [vessel.location, vessel.country].filter(Boolean).join(", ");

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-surface-1 shadow-[0_1px_2px_rgb(14_22_33/.06)] transition-all hover:-translate-y-0.5 hover:border-border-strong focus-within:ring-2 focus-within:ring-blueprint motion-reduce:transform-none">
      <div className="relative aspect-[4/3] bg-snow">
        {vessel.image ? (
          <Image
            src={vessel.image.url}
            alt={vessel.image.alt || vessel.title}
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover"
          />
        ) : (
          <VesselPlaceholder />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <TransactionBadge type={vessel.transactionType} className="bg-snow/95 backdrop-blur" />
          <VesselStatusBadge status={vessel.status} className="bg-snow/95 backdrop-blur" />
        </div>
      </div>

      <div className="flex flex-1 flex-col border-t border-border p-4">
        <p className="font-body text-label font-medium uppercase text-blueprint">
          {vessel.subcategoryName ?? vessel.categoryName}
        </p>
        <Heading className="mt-1 font-display text-lg font-bold text-hull">
          {/* The stretched link makes the whole card clickable. */}
          <Link href={vessel.href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {vessel.title}
          </Link>
        </Heading>
        {vessel.summary && <p className="mt-1 line-clamp-2 font-body text-sm text-steel">{vessel.summary}</p>}

        {facts.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-data">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-baseline justify-between gap-2 border-b border-border py-1">
                <dt className="text-xs uppercase tracking-[.06em] text-fog">{fact.label}</dt>
                <dd className="data-num text-hull">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="font-body text-sm text-steel">{place || "Location on request"}</p>
          <span className="whitespace-nowrap font-body text-sm font-semibold text-blueprint group-hover:underline">
            View vessel →
          </span>
        </div>
        {vessel.isDemo && <SampleBadge className="mt-3 self-start" />}
      </div>
    </article>
  );
}
