import type { Metadata } from "next";
import Link from "next/link";
import { submitContact } from "./actions";
import { Field, inputClass } from "@/components/ui/form-field";
import { FormStatusBanner } from "@/components/ui/form-status";
import { buttonVariants } from "@/components/ui/button";
import { findListingBySku, listingHref } from "@/lib/data/stock";
import { firstParam, paramValues, type SearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with AnchorShip NL.",
};

const FIELD_ERROR: Record<string, string> = {
  name: "Enter your name.",
  email: "Enter a valid email address.",
  message: "Enter a message.",
};

export default function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  const submitted = firstParam(searchParams, "submitted") === "1";
  const hasError = firstParam(searchParams, "error") === "1";
  const missing = new Set(paramValues(searchParams, "missing").flatMap((v) => v.split(",")));

  const sku = firstParam(searchParams, "sku");
  const listing = findListingBySku(sku);

  const defaults = {
    name: firstParam(searchParams, "name"),
    email: firstParam(searchParams, "email"),
    sku,
    message: firstParam(searchParams, "message"),
  };

  const hasFieldErrors = ["name", "email", "message"].some((k) => missing.has(k));

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-body text-label font-medium uppercase text-blueprint">Company</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">Contact</h1>
      <p className="mt-3 max-w-xl font-body text-steel">
        Questions about a listing, an order, or anything else — send us a message and we&apos;ll
        reply as soon as we can.
      </p>

      {listing && (
        <div className="mt-6 rounded-md border border-border bg-surface-1 px-4 py-3">
          <p className="font-body text-sm text-steel">
            Regarding <span className="font-semibold text-hull">{listing.title}</span> —{" "}
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
            message="Thanks for reaching out — we'll get back to you shortly."
          />
        )}

        {hasError && missing.has("send") && (
          <FormStatusBanner
            status="error"
            message="Something went wrong sending your message. Please try again, or email us directly."
          />
        )}

        {hasError && hasFieldErrors && (
          <FormStatusBanner status="error" message="Please check the highlighted fields below." />
        )}

        {!submitted && (
          <form action={submitContact} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field
                label="Full name"
                htmlFor="name"
                required
                error={missing.has("name") ? FIELD_ERROR.name : undefined}
              >
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
            </div>

            <Field label="Part number / SKU (optional)" htmlFor="sku">
              <input
                id="sku"
                name="sku"
                type="text"
                defaultValue={defaults.sku}
                className={cn(inputClass(), "font-mono")}
              />
            </Field>

            <Field
              label="Message"
              htmlFor="message"
              required
              error={missing.has("message") ? FIELD_ERROR.message : undefined}
            >
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                defaultValue={defaults.message}
                className={inputClass(missing.has("message"))}
              />
            </Field>

            <button type="submit" className={buttonVariants({ variant: "primary" })}>
              Send message
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
