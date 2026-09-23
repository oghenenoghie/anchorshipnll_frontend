import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getEnquiryByIdAdmin } from "@/lib/db/queries";
import { DeleteButton } from "@/components/admin/delete-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { deleteEnquiryAction, setEnquiryStatusAction } from "../actions";
import { KIND_LABEL, STATUS_CLASS, STATUS_LABEL, formatReceived } from "../labels";

export const metadata: Metadata = {
  title: "Enquiry",
};

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminEnquiryPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SearchParams;
}) {
  const enquiry = UUID_RE.test(params.id) ? await getEnquiryByIdAdmin(params.id) : undefined;
  if (!enquiry) redirect("/admin/enquiries?error=not_found");

  const notice = firstParam(searchParams, "handled") === "1"
    ? "Marked as handled."
    : firstParam(searchParams, "reopened") === "1"
      ? "Reopened."
      : undefined;
  const nextStatus = enquiry.status === "new" ? "handled" : "new";
  const replySubject = `Re: ${KIND_LABEL[enquiry.kind]}${enquiry.sku ? ` — ${enquiry.sku}` : ""}`;

  const details: { label: string; value: string | null; mono?: boolean }[] = [
    { label: "Name", value: enquiry.name },
    { label: "Company", value: enquiry.company },
    { label: "Email", value: enquiry.email },
    { label: "Phone", value: enquiry.phone, mono: true },
    { label: "SKU / part no.", value: enquiry.sku, mono: true },
    { label: "Quantity", value: enquiry.quantity === null ? null : String(enquiry.quantity), mono: true },
    { label: "Brand", value: enquiry.brand },
    { label: "Location", value: enquiry.location },
    { label: "Notification email", value: enquiry.emailSent ? "Sent" : "Not sent" },
  ];

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/admin/enquiries" className="font-body text-xs font-medium text-blueprint hover:underline">
        ← All enquiries
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-body text-label font-medium uppercase text-blueprint">{KIND_LABEL[enquiry.kind]}</p>
          <h1 className="mt-2 font-display text-display-lg font-bold text-hull">{enquiry.name}</h1>
          <p className="mt-1 font-mono text-xs data-num text-fog">Received {formatReceived(enquiry.createdAt)}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-1 font-body text-xs font-medium",
            STATUS_CLASS[enquiry.status],
          )}
        >
          {STATUS_LABEL[enquiry.status]}
        </span>
      </div>

      {notice && (
        <p className="mt-6 rounded-md border border-patina/30 bg-[rgb(110_139_123_/_0.10)] px-4 py-3 font-body text-sm text-hull">
          {notice}
        </p>
      )}

      <dl className="mt-8 divide-y divide-border rounded-md border border-border font-body text-sm">
        {details
          .filter((row) => row.value)
          .map((row) => (
            <div key={row.label} className="grid grid-cols-[10rem_1fr] gap-4 px-4 py-3">
              <dt className="text-label uppercase text-fog">{row.label}</dt>
              <dd className={cn("break-words text-hull", row.mono && "font-mono data-num")}>{row.value}</dd>
            </div>
          ))}
      </dl>

      <div className="mt-6 rounded-md border border-border bg-surface-1 p-4">
        <p className="font-body text-label uppercase text-fog">Message</p>
        <p className="mt-2 whitespace-pre-wrap break-words font-body text-sm text-hull">
          {enquiry.message || "(no additional details)"}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${enquiry.email}?subject=${encodeURIComponent(replySubject)}`}
          className={buttonVariants({ variant: "primary" })}
        >
          Reply by email
        </a>
        <form action={setEnquiryStatusAction.bind(null, enquiry.id, nextStatus)}>
          <button type="submit" className={buttonVariants({ variant: "secondary" })}>
            {nextStatus === "handled" ? "Mark as handled" : "Reopen"}
          </button>
        </form>
        <form action={deleteEnquiryAction.bind(null, enquiry.id)} className="ml-auto">
          <DeleteButton confirmMessage={`Delete the enquiry from ${enquiry.name}? This cannot be undone.`} />
        </form>
      </div>
    </section>
  );
}
