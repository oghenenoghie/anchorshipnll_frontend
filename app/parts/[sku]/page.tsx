import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingDetail } from "@/components/listing-detail";
import { getListingBySku } from "@/lib/db/queries";

// Data lives in Neon now, so this can't be statically known at build time —
// render per-request instead of prerendering (and don't require DB access
// during `next build`, which CI runs with no DATABASE_URL).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { sku: string };
}): Promise<Metadata> {
  const listing = await getListingBySku("part", params.sku);
  if (!listing) return {};
  return {
    title: `${listing.title} — ${listing.subtitle}`,
    description: listing.description,
  };
}

export default async function PartDetailPage({ params }: { params: { sku: string } }) {
  const listing = await getListingBySku("part", params.sku);
  if (!listing) notFound();

  return <ListingDetail listing={listing} backHref="/parts" backLabel="Parts" />;
}
