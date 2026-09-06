import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DrawingForm } from "@/components/admin/drawing-form";
import { getAllListingsAdmin, getDrawingByIdAdmin } from "@/lib/db/queries";
import { updateDrawingAction } from "../../actions";
import { firstParam, paramValues, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Edit diagram",
};

export const dynamic = "force-dynamic";

export default async function EditDrawingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SearchParams;
}) {
  const [drawing, listings] = await Promise.all([
    getDrawingByIdAdmin(params.id),
    getAllListingsAdmin(),
  ]);
  if (!drawing) notFound();

  const hasError = firstParam(searchParams, "error") === "1";
  const created = firstParam(searchParams, "created") === "1";
  const missing = new Set(hasError ? paramValues(searchParams, "missing").flatMap((v) => v.split(",")) : []);
  const stockItems = listings.map((l) => ({ sku: l.sku, title: l.title }));

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-body text-label font-medium uppercase text-blueprint">Discovery</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">Edit diagram</h1>

      {created && (
        <p className="mt-4 rounded-md border border-patina/30 bg-[rgb(110_139_123_/_0.10)] px-4 py-3 font-body text-sm text-hull">
          Diagram created — place callouts on the image below, then save.
        </p>
      )}

      <div className="mt-8">
        <DrawingForm
          action={updateDrawingAction.bind(null, drawing.id)}
          submitLabel="Save changes"
          missing={missing}
          defaults={drawing}
          stockItems={stockItems}
        />
      </div>
    </section>
  );
}
