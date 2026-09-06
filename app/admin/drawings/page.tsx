import type { Metadata } from "next";
import Link from "next/link";
import { getAllDrawings } from "@/lib/db/queries";
import { deleteDrawingAction } from "./actions";
import { DeleteButton } from "@/components/admin/delete-button";
import { buttonVariants } from "@/components/ui/button";
import { firstParam, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Drawings",
};

export const dynamic = "force-dynamic";

const NOTICE: Record<string, string> = {
  created: "Diagram created — add callouts below.",
  updated: "Diagram updated.",
  deleted: "Diagram deleted.",
};

export default async function AdminDrawingsPage({ searchParams }: { searchParams: SearchParams }) {
  const drawings = await getAllDrawings();
  const notFound = firstParam(searchParams, "error") === "not_found";
  const noticeKey = (["created", "updated", "deleted"] as const).find(
    (key) => firstParam(searchParams, key) === "1",
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-body text-label font-medium uppercase text-blueprint">Discovery</p>
          <h1 className="mt-2 font-display text-display-lg font-bold text-hull">Exploded diagrams</h1>
        </div>
        <Link href="/admin/drawings/new" className={buttonVariants({ variant: "primary" })}>
          + New diagram
        </Link>
      </div>

      {noticeKey && (
        <p className="mt-6 rounded-md border border-patina/30 bg-[rgb(110_139_123_/_0.10)] px-4 py-3 font-body text-sm text-hull">
          {NOTICE[noticeKey]}
        </p>
      )}
      {notFound && (
        <p className="mt-6 rounded-md border border-rust/30 bg-[rgb(155_44_44_/_0.08)] px-4 py-3 font-body text-sm text-hull">
          That diagram no longer exists.
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] font-body text-sm">
          <thead className="bg-surface-1 text-left text-label uppercase text-fog">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {drawings.map((drawing) => (
              <tr key={drawing.id} className="border-t border-border">
                <td className="px-4 py-3 text-hull">{drawing.title}</td>
                <td className="whitespace-nowrap px-4 py-3 text-steel">{drawing.brand}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs data-num text-fog">
                  {drawing.slug}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/drawings/${drawing.id}/edit`}
                      className="font-body text-xs font-medium text-blueprint hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={deleteDrawingAction.bind(null, drawing.id)}>
                      <DeleteButton confirmMessage={`Delete "${drawing.title}"? This cannot be undone.`} />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {drawings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-steel">
                  No diagrams yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
