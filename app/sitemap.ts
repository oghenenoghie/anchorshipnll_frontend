import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/db/queries";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const STATIC_PATHS = ["/", "/parts", "/engines", "/drawings", "/stock", "/faq", "/sell-to-us", "/rfq", "/about", "/contact", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  let entries: Awaited<ReturnType<typeof getSitemapEntries>> = [];
  try {
    entries = await getSitemapEntries();
  } catch (err) {
    // A database hiccup still serves the static pages rather than a 500.
    console.error("Building the sitemap's listing entries failed", err);
  }
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${base}${path}` })),
    ...entries.map((entry) => ({ url: `${base}${entry.path}`, lastModified: entry.updatedAt })),
  ];
}
