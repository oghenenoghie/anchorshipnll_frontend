import type { Metadata } from "next";
import type { StockListing } from "@/lib/db/queries";
import { absoluteUrl } from "@/lib/site";

export function listingPath(listing: Pick<StockListing, "category" | "sku">): string {
  return `/${listing.category === "engine" ? "engines" : "parts"}/${encodeURIComponent(listing.sku)}`;
}

export function listingMetadata(listing: StockListing): Metadata {
  const title = `${listing.title} — ${listing.subtitle}`;
  const path = listingPath(listing);
  const images = listing.images.slice(0, 4).map((image) => ({ url: image.url, alt: image.alt || title }));
  return {
    title,
    description: listing.description,
    alternates: { canonical: path },
    openGraph: { type: "website", title, description: listing.description, url: path, images },
    twitter: { card: images.length > 0 ? "summary_large_image" : "summary", title, description: listing.description },
  };
}

const AVAILABILITY: Record<StockListing["status"], string> = {
  available: "https://schema.org/InStock",
  reserved: "https://schema.org/LimitedAvailability",
  expected: "https://schema.org/PreOrder",
  sold: "https://schema.org/SoldOut",
};

// schema.org Product data for search engines. Prices are on application, so
// the offer carries availability only.
export function listingJsonLd(listing: StockListing): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${listing.title} — ${listing.subtitle}`,
    sku: listing.sku,
    mpn: listing.oemNumbers[0],
    brand: { "@type": "Brand", name: listing.brand },
    description: listing.description,
    image: listing.images.map((image) => image.url),
    url: absoluteUrl(listingPath(listing)),
    offers: {
      "@type": "Offer",
      availability: AVAILABILITY[listing.status],
      seller: { "@type": "Organization", name: "AnchorShip NL" },
    },
  };
  // Escape "<" so a description can never close the script element.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
