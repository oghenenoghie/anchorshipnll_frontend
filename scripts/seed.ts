import { getDb } from "../lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { drawings, stockItems, vesselCategories, vessels, vesselSpecs } from "../lib/db/schema";
import { SEED_LISTINGS } from "../lib/data/stock";
import { SEED_DRAWINGS } from "../lib/data/drawings";
import { SEED_VESSELS } from "../lib/data/vessels";

async function main() {
  const db = getDb();

  for (const drawing of SEED_DRAWINGS) {
    await db
      .insert(drawings)
      .values({
        slug: drawing.slug,
        title: drawing.title,
        brand: drawing.brand,
        model: drawing.model,
        imageUrl: drawing.imageUrl,
        hotspots: drawing.hotspots,
      })
      .onConflictDoUpdate({
        target: drawings.slug,
        set: {
          title: drawing.title,
          brand: drawing.brand,
          model: drawing.model,
          imageUrl: drawing.imageUrl,
          hotspots: drawing.hotspots,
          updatedAt: new Date(),
        },
      });
    console.log(`seeded drawing ${drawing.slug} — ${drawing.title}`);
  }

  for (const listing of SEED_LISTINGS) {
    await db
      .insert(stockItems)
      .values({
        sku: listing.sku,
        title: listing.title,
        subtitle: listing.subtitle,
        brand: listing.brand,
        model: listing.model,
        category: listing.category,
        oemNumbers: listing.oemNumbers,
        status: listing.status,
        quantity: listing.quantity,
        description: listing.description,
        specs: listing.specs,
      })
      .onConflictDoUpdate({
        target: stockItems.sku,
        set: {
          title: listing.title,
          subtitle: listing.subtitle,
          brand: listing.brand,
          model: listing.model,
          category: listing.category,
          oemNumbers: listing.oemNumbers,
          status: listing.status,
          quantity: listing.quantity,
          description: listing.description,
          specs: listing.specs,
          updatedAt: new Date(),
        },
      });
    console.log(`seeded ${listing.sku} — ${listing.title}`);
  }

  // Sample vessels (is_demo). The category tree itself comes from migration
  // 0010, so a vessel whose category is missing is reported and skipped.
  for (const vessel of SEED_VESSELS) {
    const [parentSlug, childSlug] = vessel.category;
    const [parent] = await db
      .select({ id: vesselCategories.id })
      .from(vesselCategories)
      .where(and(eq(vesselCategories.slug, parentSlug), isNull(vesselCategories.parentId)));
    const [child] = parent
      ? await db
          .select({ id: vesselCategories.id })
          .from(vesselCategories)
          .where(and(eq(vesselCategories.slug, childSlug), eq(vesselCategories.parentId, parent.id)))
      : [];
    if (!child) {
      console.warn(`skipped vessel ${vessel.slug}: category ${parentSlug}/${childSlug} not found`);
      continue;
    }

    const values = {
      slug: vessel.slug,
      title: vessel.title,
      transactionType: vessel.transactionType,
      status: vessel.status,
      categoryId: child.id,
      summary: vessel.summary,
      description: vessel.description,
      location: vessel.location,
      country: vessel.country,
      yearBuilt: vessel.yearBuilt,
      builder: vessel.builder,
      flag: vessel.flag,
      classNotation: vessel.classNotation,
      dwt: vessel.dwt ?? null,
      gt: vessel.gt ?? null,
      nt: vessel.nt ?? null,
      loaM: String(vessel.loaM),
      lbpM: vessel.lbpM != null ? String(vessel.lbpM) : null,
      beamM: String(vessel.beamM),
      depthM: vessel.depthM != null ? String(vessel.depthM) : null,
      draftM: vessel.draftM != null ? String(vessel.draftM) : null,
      askingTerms: vessel.askingTerms ?? null,
      charterAvailability: vessel.charterAvailability ?? null,
      featured: vessel.featured ?? false,
      isDemo: true,
      publishedAt: vessel.status === "draft" ? null : new Date(),
    };
    const [row] = await db
      .insert(vessels)
      .values(values)
      .onConflictDoUpdate({ target: vessels.slug, set: { ...values, updatedAt: new Date() } })
      .returning({ id: vessels.id });

    await db.delete(vesselSpecs).where(eq(vesselSpecs.vesselId, row.id));
    if (vessel.specs.length > 0) {
      await db.insert(vesselSpecs).values(
        vessel.specs.map((spec, index) => ({
          vesselId: row.id,
          groupName: spec.group,
          label: spec.label,
          value: spec.value,
          unit: spec.unit ?? null,
          sortOrder: index,
        })),
      );
    }
    console.log(`seeded vessel ${vessel.slug} — ${vessel.title}`);
  }

  console.log(
    `\nDone — ${SEED_LISTINGS.length} listings, ${SEED_DRAWINGS.length} drawings and ${SEED_VESSELS.length} sample vessels seeded.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
