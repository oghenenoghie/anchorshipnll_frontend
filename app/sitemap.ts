import type { MetadataRoute } from "next";
import { getBrandModels, getSitemapEntries } from "@/lib/db/queries";
import { BRANDS, modelHref } from "@/lib/data/stock";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const STATIC_PATHS = ["/", "/parts", "/engines", "/drawings", "/brands", "/stock", "/faq", "/sell-to-us", "/rfq", "/about", "/contact", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  let entries: Awaited<ReturnType<typeof getSitemapEntries>> = [];
  let models: Awaited<ReturnType<typeof getBrandModels>> = [];
  try {
    [entries, models] = await Promise.all([getSitemapEntries(), getBrandModels()]);
  } catch (err) {
    // A database hiccup still serves the static pages rather than a 500.
    console.error("Building the sitemap's listing entries failed", err);
  }
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${base}${path}` })),
    ...BRANDS.map((brand) => ({ url: `${base}/brands/${brand.slug}` })),
    ...models.map(({ brand, model }) => ({ url: `${base}${modelHref(brand, model)}` })),
    ...entries.map((entry) => ({ url: `${base}${entry.path}`, lastModified: entry.updatedAt })),
  ];
}
