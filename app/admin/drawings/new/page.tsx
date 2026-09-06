import type { Metadata } from "next";
import { DrawingForm } from "@/components/admin/drawing-form";
import { createDrawingAction } from "../actions";
import { firstParam, paramValues, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "New diagram",
};

export const dynamic = "force-dynamic";

export default function NewDrawingPage({ searchParams }: { searchParams: SearchParams }) {
  const hasError = firstParam(searchParams, "error") === "1";
  const missing = new Set(hasError ? paramValues(searchParams, "missing").flatMap((v) => v.split(",")) : []);

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-body text-label font-medium uppercase text-blueprint">Discovery</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">New diagram</h1>
      <p className="mt-3 max-w-xl font-body text-steel">
        Save the diagram&apos;s details first — you&apos;ll place callouts on the next screen once the
        image is showing.
      </p>

      <div className="mt-8">
        <DrawingForm action={createDrawingAction} submitLabel="Create diagram" missing={missing} stockItems={[]} />
      </div>
    </section>
  );
}
