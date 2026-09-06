import { getDb } from "../lib/db";
import { drawings, stockItems } from "../lib/db/schema";
import { SEED_LISTINGS } from "../lib/data/stock";
import { SEED_DRAWINGS } from "../lib/data/drawings";

async function main() {
  const db = getDb();

  for (const drawing of SEED_DRAWINGS) {
    await db
      .insert(drawings)
      .values({
        slug: drawing.slug,
        title: drawing.title,
        brand: drawing.brand,
        imageUrl: drawing.imageUrl,
        hotspots: drawing.hotspots,
      })
      .onConflictDoUpdate({
        target: drawings.slug,
        set: {
          title: drawing.title,
          brand: drawing.brand,
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

  console.log(
    `\nDone — ${SEED_LISTINGS.length} listings and ${SEED_DRAWINGS.length} drawings seeded.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
