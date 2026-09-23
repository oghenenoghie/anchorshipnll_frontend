import type { Metadata } from "next";
import Link from "next/link";
import { getEnquiriesAdmin } from "@/lib/db/queries";
import { enquiryKindEnum, enquiryStatusEnum, type EnquiryKindValue, type EnquiryStatusValue } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { KIND_LABEL, STATUS_CLASS, STATUS_LABEL, formatReceived } from "./labels";

export const metadata: Metadata = {
  title: "Enquiries",
};

export const dynamic = "force-dynamic";

function filterHref(kind: string, status: string): string {
  const qs = new URLSearchParams();
  if (kind) qs.set("kind", kind);
  if (status) qs.set("status", status);
  const query = qs.toString();
  return query ? `/admin/enquiries?${query}` : "/admin/enquiries";
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md border px-3 py-1.5 font-body text-xs font-medium transition-colors",
        active ? "border-hull bg-hull text-paper" : "border-border text-steel hover:border-border-strong",
      )}
    >
      {children}
    </Link>
  );
}

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  const kindParam = firstParam(searchParams, "kind");
  const statusParam = firstParam(searchParams, "status");
  const kind = (enquiryKindEnum.enumValues as readonly string[]).includes(kindParam)
    ? (kindParam as EnquiryKindValue)
    : undefined;
  const status = (enquiryStatusEnum.enumValues as readonly string[]).includes(statusParam)
    ? (statusParam as EnquiryStatusValue)
    : undefined;

  const rows = await getEnquiriesAdmin({ kind, status });
  const deleted = firstParam(searchParams, "deleted") === "1";
  const notFound = firstParam(searchParams, "error") === "not_found";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="font-body text-label font-medium uppercase text-blueprint">Leads</p>
        <h1 className="mt-2 font-display text-display-lg font-bold text-hull">Enquiries</h1>
      </div>

      {deleted && (
        <p className="mt-6 rounded-md border border-patina/30 bg-[rgb(110_139_123_/_0.10)] px-4 py-3 font-body text-sm text-hull">
          Enquiry deleted.
        </p>
      )}
      {notFound && (
        <p className="mt-6 rounded-md border border-rust/30 bg-[rgb(155_44_44_/_0.08)] px-4 py-3 font-body text-sm text-hull">
          That enquiry no longer exists.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <FilterLink href={filterHref("", statusParam)} active={!kind}>
          All types
        </FilterLink>
        {enquiryKindEnum.enumValues.map((value) => (
          <FilterLink key={value} href={filterHref(value, statusParam)} active={kind === value}>
            {KIND_LABEL[value]}
          </FilterLink>
        ))}
        <span className="mx-2 h-5 w-px bg-border" aria-hidden />
        <FilterLink href={filterHref(kindParam, "")} active={!status}>
          Any status
        </FilterLink>
        {enquiryStatusEnum.enumValues.map((value) => (
          <FilterLink key={value} href={filterHref(kindParam, value)} active={status === value}>
            {STATUS_LABEL[value]}
          </FilterLink>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[760px] font-body text-sm">
          <thead className="bg-surface-1 text-left text-label uppercase text-fog">
            <tr>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">Regarding</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((enquiry) => (
              <tr key={enquiry.id} className="border-t border-border">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs data-num text-steel">
                  {formatReceived(enquiry.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-steel">{KIND_LABEL[enquiry.kind]}</td>
                <td className="px-4 py-3">
                  <div className="text-hull">{enquiry.name}</div>
                  <div className="text-xs text-fog">{enquiry.company ?? enquiry.email}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs data-num text-steel">
                  {enquiry.sku ?? enquiry.brand ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
                      STATUS_CLASS[enquiry.status],
                    )}
                  >
                    {STATUS_LABEL[enquiry.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link
                    href={`/admin/enquiries/${enquiry.id}`}
                    className="font-body text-xs font-medium text-blueprint hover:underline"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-steel">
                  No enquiries match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
