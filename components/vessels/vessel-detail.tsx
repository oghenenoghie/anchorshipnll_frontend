import Link from "next/link";
import { Breadcrumb, type BreadcrumbItem } from "@/components/breadcrumb";
import { ListingGallery } from "@/components/listing-gallery";
import { buttonVariants } from "@/components/ui/button";
import { SpecificationGroup, type SpecTableRow } from "@/components/vessels/spec-table-group";
import { SampleBadge, TransactionBadge, VesselStatusBadge } from "@/components/vessels/vessel-badges";
import { VesselCard } from "@/components/vessels/vessel-card";
import { VesselEnquiryForm } from "@/components/vessels/vessel-enquiry-form";
import { VesselPlaceholder } from "@/components/vessels/vessel-placeholder";
import { getBrandModels } from "@/lib/db/queries";
import { getRelatedVessels, type VesselDetail as VesselDetailData } from "@/lib/db/vessels";
import type { SearchParams } from "@/lib/search-params";
import { breadcrumbJsonLd, vesselJsonLd } from "@/lib/seo";
import { partsLinkFor } from "@/lib/vessel-parts-links";
import { categoryHref, formatNumber, TRANSACTION_LABEL, withUnit } from "@/lib/vessels";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function rows(entries: [label: string, value: string | null | undefined][]): SpecTableRow[] {
  return entries.filter((e): e is [string, string] => Boolean(e[1])).map(([label, value]) => ({ label, value }));
}

export function vesselBreadcrumb(vessel: VesselDetailData): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Vessels", href: "/vessels" },
    { label: vessel.categoryName, href: categoryHref({ categorySlug: vessel.categorySlug, subcategorySlug: null }) },
  ];
  if (vessel.subcategorySlug && vessel.subcategoryName && vessel.subcategoryName !== vessel.categoryName) {
    items.push({ label: vessel.subcategoryName, href: categoryHref(vessel) });
  }
  items.push({ label: vessel.title });
  return items;
}

export async function VesselDetail({ vessel, searchParams }: { vessel: VesselDetailData; searchParams: SearchParams }) {
  const [related, brandModels] = await Promise.all([getRelatedVessels(vessel), getBrandModels().catch(() => [])]);
  const breadcrumb = vesselBreadcrumb(vessel);
  const type = vessel.subcategoryName ?? vessel.categoryName;
  const place = [vessel.location, vessel.country].filter(Boolean).join(", ");
  const closed = vessel.status === "sold" || vessel.status === "chartered";

  const quickFacts = [
    { label: "Built", value: vessel.yearBuilt ? String(vessel.yearBuilt) : null },
    { label: "LOA", value: withUnit(vessel.loaM, "m") },
    { label: "Beam", value: withUnit(vessel.beamM, "m") },
    { label: "Draft", value: withUnit(vessel.draftM, "m") },
    { label: "DWT", value: vessel.dwt ? `${formatNumber(vessel.dwt)} t` : null },
    { label: "GT", value: formatNumber(vessel.gt) },
    { label: "Flag", value: vessel.flag },
    { label: "Class", value: vessel.classNotation },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  // Headline columns first, then the listing's own grouped specifications.
  const groups: { name: string; rows: SpecTableRow[] }[] = [
    {
      name: "Main particulars",
      rows: rows([
        ["Vessel type", type],
        ["Year built", vessel.yearBuilt ? String(vessel.yearBuilt) : null],
        ["Builder", vessel.builder],
        ["Flag", vessel.flag],
        ["IMO number", vessel.imoNumber],
        ["Class", vessel.classNotation],
      ]),
    },
    {
      name: "Dimensions",
      rows: rows([
        ["Length overall", withUnit(vessel.loaM, "m")],
        ["Length BP", withUnit(vessel.lbpM, "m")],
        ["Beam", withUnit(vessel.beamM, "m")],
        ["Depth", withUnit(vessel.depthM, "m")],
        ["Draft", withUnit(vessel.draftM, "m")],
      ]),
    },
    {
      name: "Tonnage",
      rows: rows([
        ["Deadweight", vessel.dwt ? `${formatNumber(vessel.dwt)} t` : null],
        ["Gross tonnage", formatNumber(vessel.gt)],
        ["Net tonnage", formatNumber(vessel.nt)],
      ]),
    },
    ...vessel.specGroups.map((group) => ({
      name: group.name,
      rows: group.rows.map((row) => ({
        label: row.label,
        value: row.unit ? `${row.value} ${row.unit}` : row.value,
        partsLink: /machinery|engine|generator/i.test(`${group.name} ${row.label}`) ? partsLinkFor(row.value, brandModels) : null,
      })),
    })),
  ].filter((group) => group.rows.length > 0);

  const seo = { ...vessel, images: vessel.images };
  const paragraphs = vessel.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: vesselJsonLd(seo) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(breadcrumb) }} />

      <section className="border-b border-border bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumb items={breadcrumb} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-body text-label font-medium uppercase text-blueprint">{type}</p>
            <h1 className="mt-2 font-display text-display-lg font-bold text-hull">{vessel.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TransactionBadge type={vessel.transactionType} />
              <VesselStatusBadge status={vessel.status} />
              {vessel.isDemo && <SampleBadge />}
            </div>
            <p className="mt-3 font-body text-sm text-steel">
              {place || "Location on request"}
              <span className="mx-2 text-fog" aria-hidden>
                ·
              </span>
              <span className="font-mono text-xs data-num text-fog">{vessel.ref}</span>
              <span className="mx-2 text-fog" aria-hidden>
                ·
              </span>
              <span className="text-fog">Updated {dateFormat.format(vessel.updatedAt)}</span>
            </p>
          </div>
          <div className="hidden gap-3 sm:flex">
            <a href="#enquire" className={buttonVariants({ variant: "primary" })}>
              {closed ? "Ask about similar vessels" : "Enquire about this vessel"}
            </a>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ListingGallery
              alt={`${vessel.title} — ${type}`}
              images={vessel.images}
              aspectClass="aspect-[4/3]"
              fit="cover"
              placeholder={<VesselPlaceholder />}
            />
          </div>

          <aside className="lg:col-span-2" aria-label="Key facts">
            <div className="rounded-md border border-border bg-surface-1">
              <h2 className="border-b border-border px-5 py-3 font-body text-label font-medium uppercase text-fog">Key facts</h2>
              <dl className="grid grid-cols-2 gap-px bg-border">
                {quickFacts.map((fact) => (
                  <div key={fact.label} className="bg-surface-1 px-5 py-3">
                    <dt className="font-mono text-xs uppercase tracking-[.06em] text-fog">{fact.label}</dt>
                    <dd className="mt-1 font-mono text-base data-num text-hull">{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="space-y-3 border-t border-border px-5 py-4 font-body text-sm">
                <p className="flex justify-between gap-4">
                  <span className="text-fog">Deal</span>
                  <span className="text-right text-hull">{TRANSACTION_LABEL[vessel.transactionType]}</span>
                </p>
                <p className="flex justify-between gap-4">
                  <span className="text-fog">Terms</span>
                  <span className="text-right text-hull">{vessel.askingTerms || "Price on application"}</span>
                </p>
                {vessel.charterAvailability && (
                  <p className="flex justify-between gap-4">
                    <span className="text-fog">Charter</span>
                    <span className="text-right text-hull">{vessel.charterAvailability}</span>
                  </p>
                )}
              </div>
              <div className="border-t border-border p-5">
                <a href="#enquire" className={buttonVariants({ variant: "primary" }) + " w-full"}>
                  {closed ? "Ask about similar vessels" : "Enquire about this vessel"}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-border bg-surface-0 py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-3">
            <h2 className="font-display text-2xl font-bold text-hull">Overview</h2>
            {vessel.summary && <p className="mt-4 font-body text-lg text-hull">{vessel.summary}</p>}
            {paragraphs.map((paragraph, i) => (
              <p key={i} className="mt-4 max-w-2xl font-body leading-relaxed text-steel">
                {paragraph}
              </p>
            ))}
            {vessel.isDemo && (
              <p className="mt-6 rounded-md border border-dashed border-border-strong px-4 py-3 font-body text-sm text-steel">
                This is a fictional sample listing that shows how vessels are presented. Contact us for current tonnage.
              </p>
            )}
          </div>
          <div className="lg:col-span-2">
            <h2 className="font-body text-label font-medium uppercase text-fog">Listing</h2>
            <dl className="mt-3 divide-y divide-border rounded-md border border-border bg-surface-1 font-body text-sm">
              {[
                ["Listing ID", vessel.ref],
                ["Listed", vessel.publishedAt ? dateFormat.format(vessel.publishedAt) : null],
                ["Updated", dateFormat.format(vessel.updatedAt)],
                ["Location", place || null],
                ["Broker", "AnchorShip NL"],
              ]
                .filter((entry): entry is [string, string] => Boolean(entry[1]))
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-fog">{label}</dt>
                    <dd className="text-right text-hull">{value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-12" aria-labelledby="specs-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-body text-label font-medium uppercase text-blueprint">Specification</p>
          <h2 id="specs-heading" className="mt-2 font-display text-display-lg font-bold text-hull">
            Technical data
          </h2>
          <p className="mt-2 max-w-2xl font-body text-sm text-steel">
            Particulars as supplied by the owner; buyers should verify them on inspection.
          </p>
          <div className="mt-8 gap-6 space-y-6 md:columns-2">
            {groups.map((group) => (
              <SpecificationGroup key={group.name} name={group.name} rows={group.rows} />
            ))}
          </div>
        </div>
      </section>

      <section id="enquire" className="scroll-mt-20 border-t border-border bg-surface-0 py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-2">
            <p className="font-body text-label font-medium uppercase text-blueprint">Enquiry</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-hull">
              {closed ? `${vessel.title} is ${vessel.status}` : `Enquire about ${vessel.title}`}
            </h2>
            <p className="mt-3 font-body text-steel">
              {closed
                ? "This vessel is no longer available, but similar tonnage often is — tell us what you need and our brokers will search the market."
                : "Ask for the full specification, inspection arrangements or commercial terms. Enquiries are handled in confidence by our brokers."}
            </p>
            <p className="mt-4 font-mono text-xs data-num text-fog">Reference {vessel.ref}</p>
          </div>
          <div className="relative rounded-md border border-border bg-surface-1 p-6 lg:col-span-3">
            <VesselEnquiryForm vesselSlug={vessel.slug} vesselTitle={vessel.title} searchParams={searchParams} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-hull py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="font-body text-label font-medium uppercase text-blueprint">Related</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-display-lg font-bold text-paper">More {vessel.categoryName.toLowerCase()} vessels</h2>
              <Link href={categoryHref({ categorySlug: vessel.categorySlug, subcategorySlug: null })} className="font-body text-sm font-semibold text-paper hover:underline">
                View all {vessel.categoryName} →
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <VesselCard key={item.id} vessel={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile: the enquiry action stays in reach while scrolling specs. */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-surface-1/95 px-4 py-3 backdrop-blur sm:hidden">
        <a href="#enquire" className={buttonVariants({ variant: "primary" }) + " w-full"}>
          {closed ? "Ask about similar vessels" : "Enquire"}
        </a>
      </div>
    </>
  );
}
