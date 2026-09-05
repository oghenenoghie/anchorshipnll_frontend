import type { Metadata } from "next";
import Link from "next/link";
import { getAllListingsAdmin } from "@/lib/db/queries";
import { deleteStockItemAction } from "./stock/actions";
import { DeleteButton } from "@/components/admin/delete-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { firstParam, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Stock",
};

export const dynamic = "force-dynamic";

const NOTICE: Record<string, string> = {
  created: "Listing created.",
  updated: "Listing updated.",
  deleted: "Listing deleted.",
};

export default async function AdminDashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const listings = await getAllListingsAdmin();
  const notFound = firstParam(searchParams, "error") === "not_found";
  const noticeKey = (["created", "updated", "deleted"] as const).find(
    (key) => firstParam(searchParams, key) === "1",
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-body text-label font-medium uppercase text-blueprint">Inventory</p>
          <h1 className="mt-2 font-display text-display-lg font-bold text-hull">Stock items</h1>
        </div>
        <Link href="/admin/stock/new" className={buttonVariants({ variant: "primary" })}>
          + New listing
        </Link>
      </div>

      {noticeKey && (
        <p className="mt-6 rounded-md border border-patina/30 bg-[rgb(110_139_123_/_0.10)] px-4 py-3 font-body text-sm text-hull">
          {NOTICE[noticeKey]}
        </p>
      )}
      {notFound && (
        <p className="mt-6 rounded-md border border-rust/30 bg-[rgb(155_44_44_/_0.08)] px-4 py-3 font-body text-sm text-hull">
          That listing no longer exists.
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[760px] font-body text-sm">
          <thead className="bg-surface-1 text-left text-label uppercase text-fog">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {listings.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs data-num text-fog">{item.sku}</td>
                <td className="px-4 py-3 text-hull">{item.title}</td>
                <td className="whitespace-nowrap px-4 py-3 text-steel">{item.brand}</td>
                <td className="whitespace-nowrap px-4 py-3 capitalize text-steel">{item.category}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 data-num text-hull">{item.quantity}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/stock/${item.id}/edit`}
                      className="font-body text-xs font-medium text-blueprint hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={deleteStockItemAction.bind(null, item.id)}>
                      <DeleteButton confirmMessage={`Delete ${item.sku} — ${item.title}? This cannot be undone.`} />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-steel">
                  No listings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
