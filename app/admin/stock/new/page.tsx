import type { Metadata } from "next";
import { StockForm } from "@/components/admin/stock-form";
import { createStockItemAction } from "../actions";
import { firstParam, paramValues, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "New listing",
};

export const dynamic = "force-dynamic";

export default function NewStockItemPage({ searchParams }: { searchParams: SearchParams }) {
  const hasError = firstParam(searchParams, "error") === "1";
  const missing = new Set(hasError ? paramValues(searchParams, "missing").flatMap((v) => v.split(",")) : []);

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-body text-label font-medium uppercase text-blueprint">Inventory</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">New listing</h1>

      <div className="mt-8">
        <StockForm action={createStockItemAction} submitLabel="Create listing" missing={missing} />
      </div>
    </section>
  );
}
