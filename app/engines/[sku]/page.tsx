import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingDetail } from "@/components/listing-detail";
import { STOCK_LISTINGS, getListingBySku } from "@/lib/data/stock";

export function generateStaticParams() {
  return STOCK_LISTINGS.filter((item) => item.category === "engine").map((item) => ({
    sku: item.sku.toLowerCase(),
  }));
}

export function generateMetadata({ params }: { params: { sku: string } }): Metadata {
  const listing = getListingBySku("engine", params.sku);
  if (!listing) return {};
  return {
    title: `${listing.title} — ${listing.subtitle}`,
    description: listing.description,
  };
}

export default function EngineDetailPage({ params }: { params: { sku: string } }) {
  const listing = getListingBySku("engine", params.sku);
  if (!listing) notFound();

  return <ListingDetail listing={listing} backHref="/engines" backLabel="Engines" />;
}
