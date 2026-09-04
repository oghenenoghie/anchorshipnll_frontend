import type { Metadata } from "next";
import Link from "next/link";
import { submitRfq } from "./actions";
import { Field, inputClass } from "@/components/ui/form-field";
import { FormStatusBanner } from "@/components/ui/form-status";
import { buttonVariants } from "@/components/ui/button";
import { listingHref } from "@/lib/data/stock";
import { findListingBySku } from "@/lib/db/queries";
import { firstParam, paramValues, type SearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Request a quote",
  description: "Request a quote for a part number or complete engine from AnchorShip NL.",
};

const FIELD_ERROR: Record<string, string> = {
  name: "Enter your name.",
  company: "Enter your company.",
  email: "Enter a valid email address.",
  sku: "Enter a part number or SKU.",
  quantity: "Enter a whole number.",
};

export const dynamic = "force-dynamic";

export default async function RfqPage({ searchParams }: { searchParams: SearchParams }) {
  const submitted = firstParam(searchParams, "submitted") === "1";
  const hasError = firstParam(searchParams, "error") === "1";
  const missing = new Set(paramValues(searchParams, "missing").flatMap((v) => v.split(",")));

  const sku = firstParam(searchParams, "sku");
  const listing = await findListingBySku(sku);

  const defaults = {
    name: firstParam(searchParams, "name"),
    company: firstParam(searchParams, "company"),
    email: firstParam(searchParams, "email"),
    phone: firstParam(searchParams, "phone"),
    sku,
    quantity: firstParam(searchParams, "quantity") || "1",
    message: firstParam(searchParams, "message"),
  };

  const hasFieldErrors = ["name", "company", "email", "sku", "quantity"].some((k) => missing.has(k));

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-body text-label font-medium uppercase text-blueprint">Trade</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">Request a quote</h1>
      <p className="mt-3 max-w-xl font-body text-steel">
        Tell us what you need and we&apos;ll come back with pricing and availability — usually
        within one business day.
      </p>

      {listing && (
        <div className="mt-6 rounded-md border border-border bg-surface-1 px-4 py-3">
          <p className="font-body text-sm text-steel">
            Quoting <span className="font-semibold text-hull">{listing.title}</span> —{" "}
            {listing.subtitle}
          </p>
          <p className="mt-1 font-mono text-xs data-num text-fog">SKU {listing.sku}</p>
          <Link
            href={listingHref(listing)}
            className="mt-1 inline-block font-body text-xs font-medium text-blueprint"
          >
            View listing →
          </Link>
        </div>
      )}

      <div className="mt-8">
        {submitted && (
          <FormStatusBanner
            status="success"
            message="Thanks — your request is in. We'll get back to you within one business day."
          />
        )}

        {hasError && missing.has("send") && (
          <FormStatusBanner
            status="error"
            message="Something went wrong sending your request. Please try again, or email us directly."
          />
        )}

        {hasError && hasFieldErrors && (
          <FormStatusBanner status="error" message="Please check the highlighted fields below." />
        )}

        {!submitted && (
          <form action={submitRfq} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name" required error={missing.has("name") ? FIELD_ERROR.name : undefined}>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={defaults.name}
                  className={inputClass(missing.has("name"))}
                />
              </Field>

              <Field
                label="Company"
                htmlFor="company"
                required
                error={missing.has("company") ? FIELD_ERROR.company : undefined}
              >
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  defaultValue={defaults.company}
                  className={inputClass(missing.has("company"))}
                />
              </Field>

              <Field
                label="Email"
                htmlFor="email"
                required
                error={missing.has("email") ? FIELD_ERROR.email : undefined}
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={defaults.email}
                  className={inputClass(missing.has("email"))}
                />
              </Field>

              <Field label="Phone" htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={defaults.phone}
                  className={inputClass()}
                />
              </Field>

              <Field
                label="Part number / SKU"
                htmlFor="sku"
                required
                error={missing.has("sku") ? FIELD_ERROR.sku : undefined}
              >
                <input
                  id="sku"
                  name="sku"
                  type="text"
                  required
                  defaultValue={defaults.sku}
                  className={cn(inputClass(missing.has("sku")), "font-mono")}
                />
              </Field>

              <Field
                label="Quantity"
                htmlFor="quantity"
                error={missing.has("quantity") ? FIELD_ERROR.quantity : undefined}
              >
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={defaults.quantity}
                  className={inputClass(missing.has("quantity"))}
                />
              </Field>
            </div>

            <Field label="Additional details" htmlFor="message">
              <textarea
                id="message"
                name="message"
                rows={5}
                defaultValue={defaults.message}
                placeholder="Vessel, application, timeline, condition preferences…"
                className={inputClass()}
              />
            </Field>

            <button type="submit" className={buttonVariants({ variant: "primary" })}>
              Send request
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
