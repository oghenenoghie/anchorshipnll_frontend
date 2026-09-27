import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingDetail } from "@/components/listing-detail";
import { getListingBySku } from "@/lib/db/queries";
import { listingJsonLd, listingMetadata } from "@/lib/seo";

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
  return listing ? listingMetadata(listing) : {};
}

export default async function PartDetailPage({ params }: { params: { sku: string } }) {
  const listing = await getListingBySku("part", params.sku);
  if (!listing) notFound();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: listingJsonLd(listing) }} />
      <ListingDetail listing={listing} backHref="/parts" backLabel="Parts" />
    </>
  );
}
