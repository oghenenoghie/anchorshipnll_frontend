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

// --- Vessels ------------------------------------------------------------------

export function breadcrumbJsonLd(items: { label: string; href?: string }[]): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Listing pages are indexable as the plain category path (and its later
// pages); filtered and sorted variants point back to it and stay out of the
// index so they don't compete with it.
export function vesselListMetadata({
  title,
  description,
  path,
  page,
  filtered,
}: {
  title: string;
  description: string;
  path: string;
  page: number;
  filtered: boolean;
}): Metadata {
  const canonical = page > 1 && !filtered ? `${path}?page=${page}` : path;
  return {
    title: page > 1 ? `${title} — page ${page}` : title,
    description,
    alternates: { canonical },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", title, description, url: canonical },
  };
}

interface VesselSeoInput {
  title: string;
  href: string;
  summary: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryName: string;
  subcategoryName: string | null;
  transactionType: "sale" | "charter" | "sale_and_charter";
  status: string;
  ref: string;
  builder: string | null;
  images: { url: string; alt: string }[];
}

const DEAL_PHRASE = { sale: "for sale", charter: "for charter", sale_and_charter: "for sale or charter" } as const;

export function vesselMetadata(vessel: VesselSeoInput): Metadata {
  const type = vessel.subcategoryName ?? vessel.categoryName;
  const title = vessel.seoTitle || `${vessel.title} | ${type} ${DEAL_PHRASE[vessel.transactionType]}`;
  const description =
    vessel.seoDescription ||
    (vessel.summary
      ? `${vessel.summary} Specifications, photos and enquiries for this ${type.toLowerCase()}.`
      : `Technical specifications, photos and enquiry details for the ${type.toLowerCase()} ${vessel.title}.`);
  const images = vessel.images.slice(0, 4).map((image) => ({ url: image.url, alt: image.alt || vessel.title }));
  return {
    title,
    description,
    alternates: { canonical: vessel.href },
    openGraph: { type: "website", title, description, url: vessel.href, images },
    twitter: { card: images.length > 0 ? "summary_large_image" : "summary", title, description },
  };
}

const VESSEL_AVAILABILITY: Record<string, string> = {
  published: "https://schema.org/InStock",
  under_offer: "https://schema.org/LimitedAvailability",
  sold: "https://schema.org/SoldOut",
  chartered: "https://schema.org/SoldOut",
};

// Vessels are offered like products: prices are on application, so the offer
// carries availability only.
export function vesselJsonLd(vessel: VesselSeoInput): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: vessel.title,
    sku: vessel.ref,
    category: [vessel.categoryName, vessel.subcategoryName].filter(Boolean).join(" > "),
    description: vessel.summary || vessel.description,
    ...(vessel.builder ? { manufacturer: { "@type": "Organization", name: vessel.builder } } : {}),
    image: vessel.images.map((image) => image.url),
    url: absoluteUrl(vessel.href),
    offers: {
      "@type": "Offer",
      availability: VESSEL_AVAILABILITY[vessel.status] ?? "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "AnchorShip NL" },
    },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
