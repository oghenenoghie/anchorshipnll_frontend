import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StockForm } from "@/components/admin/stock-form";
import { getListingByIdAdmin } from "@/lib/db/queries";
import { updateStockItemAction } from "../../actions";
import { firstParam, paramValues, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Edit listing",
};

export const dynamic = "force-dynamic";

export default async function EditStockItemPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SearchParams;
}) {
  const listing = await getListingByIdAdmin(params.id);
  if (!listing) notFound();

  const hasError = firstParam(searchParams, "error") === "1";
  const missing = new Set(hasError ? paramValues(searchParams, "missing").flatMap((v) => v.split(",")) : []);

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-body text-label font-medium uppercase text-blueprint">Inventory</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">
        Edit <span className="font-mono">{listing.sku}</span>
      </h1>

      <div className="mt-8">
        <StockForm
          action={updateStockItemAction.bind(null, listing.id)}
          submitLabel="Save changes"
          missing={missing}
          defaults={listing}
        />
      </div>
    </section>
  );
}
