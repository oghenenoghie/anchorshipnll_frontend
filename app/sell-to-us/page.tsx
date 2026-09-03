import type { Metadata } from "next";
import { submitSellToUs } from "./actions";
import { Field, inputClass } from "@/components/ui/form-field";
import { FormStatusBanner } from "@/components/ui/form-status";
import { buttonVariants } from "@/components/ui/button";
import { firstParam, paramValues, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Sell to us",
  description:
    "Sell complete marine diesel engines and spare parts to AnchorShip NL — Wärtsilä, MAN, MaK, Deutz, Caterpillar and more.",
};

const FIELD_ERROR: Record<string, string> = {
  name: "Enter your name.",
  company: "Enter your company.",
  email: "Enter a valid email address.",
  brand: "Enter the brand or manufacturer.",
  description: "Tell us what you're selling.",
};

const STEPS = [
  {
    number: "01",
    title: "Tell us what you have",
    body: "Brand, model, part numbers, condition and photos if you have them — the more detail, the faster our quote.",
  },
  {
    number: "02",
    title: "We assess & quote",
    body: "Our team reviews your submission and comes back with a firm offer, usually within two business days.",
  },
  {
    number: "03",
    title: "Agree logistics",
    body: "We arrange collection, or you ship to our Rotterdam yard — whichever works best for you.",
  },
  {
    number: "04",
    title: "Get paid",
    body: "Payment on collection and inspection. No waiting on a resale to get your money.",
  },
];

export default function SellToUsPage({ searchParams }: { searchParams: SearchParams }) {
  const submitted = firstParam(searchParams, "submitted") === "1";
  const hasError = firstParam(searchParams, "error") === "1";
  const missing = new Set(paramValues(searchParams, "missing").flatMap((v) => v.split(",")));

  const defaults = {
    name: firstParam(searchParams, "name"),
    company: firstParam(searchParams, "company"),
    email: firstParam(searchParams, "email"),
    phone: firstParam(searchParams, "phone"),
    brand: firstParam(searchParams, "brand"),
    location: firstParam(searchParams, "location"),
    description: firstParam(searchParams, "description"),
  };

  const hasFieldErrors = ["name", "company", "email", "brand", "description"].some((k) =>
    missing.has(k),
  );

  return (
    <>
      <section className="hero-fill blueprint-grid relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <p className="font-body text-label font-medium uppercase text-blueprint">Trade</p>
          <h1 className="mt-4 max-w-2xl font-display text-display-xl font-extrabold text-paper">
            Sell your surplus engines &amp; parts.
          </h1>
          <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-fog">
            We buy complete marine diesel engines and spare parts — Wärtsilä, MAN, MaK, Deutz,
            Caterpillar and more. Tell us what you have and we&apos;ll come back with a firm offer,
            usually within two business days.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#sell-form" className={buttonVariants({ variant: "primary" })}>
              Get a valuation
            </a>
            <a href="#how-it-works" className={buttonVariants({ variant: "onDark" })}>
              How it works
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-border bg-surface-0 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-body text-label font-medium uppercase text-blueprint">How it works</p>
          <h2 className="mt-2 font-display text-display-lg font-bold text-hull">
            From surplus to sold, in four steps
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
            {STEPS.map((step) => (
              <div key={step.number} className="flex gap-4">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-border-strong font-mono text-sm text-hull">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-body text-base font-semibold text-hull">{step.title}</h3>
                  <p className="mt-1 font-body text-sm text-steel">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sell-form" className="bg-surface-0 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="font-body text-label font-medium uppercase text-blueprint">Get started</p>
          <h2 className="mt-2 font-display text-display-lg font-bold text-hull">
            Tell us what you have
          </h2>
          <p className="mt-3 max-w-xl font-body text-steel">
            No listing is too small or too large — from a single reconditioned part to a complete
            engine room.
          </p>

          <div className="mt-8">
            {submitted && (
              <FormStatusBanner
                status="success"
                message="Thanks — we've got your submission and will come back with a valuation within two business days."
              />
            )}

            {hasError && missing.has("send") && (
              <FormStatusBanner
                status="error"
                message="Something went wrong sending your submission. Please try again, or email us directly."
              />
            )}

            {hasError && hasFieldErrors && (
              <FormStatusBanner status="error" message="Please check the highlighted fields below." />
            )}

            {!submitted && (
              <form action={submitSellToUs} className="space-y-6">
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
                    label="Brand / manufacturer"
                    htmlFor="brand"
                    required
                    error={missing.has("brand") ? FIELD_ERROR.brand : undefined}
                  >
                    <input
                      id="brand"
                      name="brand"
                      type="text"
                      required
                      placeholder="e.g. Wärtsilä, MAN, MaK, Deutz, Caterpillar"
                      defaultValue={defaults.brand}
                      className={inputClass(missing.has("brand"))}
                    />
                  </Field>

                  <Field label="Location" htmlFor="location">
                    <input
                      id="location"
                      name="location"
                      type="text"
                      placeholder="City, country"
                      defaultValue={defaults.location}
                      className={inputClass()}
                    />
                  </Field>
                </div>

                <Field
                  label="What are you selling"
                  htmlFor="description"
                  required
                  error={missing.has("description") ? FIELD_ERROR.description : undefined}
                >
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    required
                    placeholder="Model, part numbers, condition, quantity, and whether photos are available…"
                    defaultValue={defaults.description}
                    className={inputClass(missing.has("description"))}
                  />
                </Field>

                <button type="submit" className={buttonVariants({ variant: "primary" })}>
                  Send details
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
