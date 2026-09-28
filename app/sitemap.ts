import type { MetadataRoute } from "next";
import { getBrandModels, getSitemapEntries } from "@/lib/db/queries";
import { getCategoryTree, getVesselSitemapEntries } from "@/lib/db/vessels";
import { BRANDS, modelHref } from "@/lib/data/stock";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const STATIC_PATHS = ["/", "/vessels", "/vessels?type=sale", "/vessels?type=charter", "/parts", "/engines", "/drawings", "/brands", "/stock", "/faq", "/sell-to-us", "/rfq", "/about", "/contact", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  let entries: Awaited<ReturnType<typeof getSitemapEntries>> = [];
  let models: Awaited<ReturnType<typeof getBrandModels>> = [];
  let vesselEntries: Awaited<ReturnType<typeof getVesselSitemapEntries>> = [];
  let categoryPaths: string[] = [];
  try {
    const [listingEntries, brandModels, vessels, tree] = await Promise.all([
      getSitemapEntries(),
      getBrandModels(),
      getVesselSitemapEntries(),
      getCategoryTree(),
    ]);
    [entries, models, vesselEntries] = [listingEntries, brandModels, vessels];
    // Only categories with vessels — empty ones are thin pages.
    categoryPaths = tree.flatMap((category) =>
      category.count === 0 ? [] : [category.href, ...category.children.filter((c) => c.count > 0).map((c) => c.href)],
    );
  } catch (err) {
    // A database hiccup still serves the static pages rather than a 500.
    console.error("Building the sitemap's listing entries failed", err);
  }
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${base}${path}` })),
    ...BRANDS.map((brand) => ({ url: `${base}/brands/${brand.slug}` })),
    ...models.map(({ brand, model }) => ({ url: `${base}${modelHref(brand, model)}` })),
    ...entries.map((entry) => ({ url: `${base}${entry.path}`, lastModified: entry.updatedAt })),
    ...categoryPaths.map((path) => ({ url: `${base}${path}` })),
    ...vesselEntries.map((entry) => ({ url: `${base}${entry.path}`, lastModified: entry.updatedAt })),
  ];
}
