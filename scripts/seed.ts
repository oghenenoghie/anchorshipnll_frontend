import { getDb } from "../lib/db";
import { stockItems } from "../lib/db/schema";
import { SEED_LISTINGS } from "../lib/data/stock";

async function main() {
  const db = getDb();

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

  console.log(`\nDone — ${SEED_LISTINGS.length} listings seeded.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
