import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "How to find, reserve and buy marine diesel engines and spare parts from AnchorShip NL — and how to sell your surplus to us.",
  alternates: { canonical: "/faq" },
};

// Answers only restate what the site already commits to elsewhere (sell-to-us
// process, terms). Order-specific terms are confirmed in writing per order.
const SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Finding parts",
    items: [
      {
        q: "What's the fastest way to find a part?",
        a: "Search by OEM part number in the bar at the top of every page. Search ignores spaces, dashes and capitals, and suggests close matches if a number is slightly off. You can also filter the catalog by brand and condition, or open an exploded drawing and tap a callout to go straight to the part.",
      },
      {
        q: "What if the part I need isn't listed?",
        a: "Send us a request for quote with the part number and quantity. Our catalog is a snapshot of the yard — we can often source parts that aren't online yet.",
      },
      {
        q: "What do the status labels mean?",
        a: "Available means in stock now. Reserved means held for a buyer pending confirmation. Expected means in transit or awaiting teardown — it can be reserved before it arrives. Sold listings stay online for reference.",
      },
    ],
  },
  {
    title: "Buying",
    items: [
      {
        q: "Why is there no price on most listings?",
        a: "Most trades in used and surplus marine parts are priced on application, depending on quantity, condition and destination. Use the enquiry button on any listing and we'll come back with a quote.",
      },
      {
        q: "Can I reserve expected stock?",
        a: "Yes. Send an enquiry for the listing and we'll confirm the reservation and expected arrival date.",
      },
      {
        q: "Can I see more photos or details before buying?",
        a: "Every listing shows its condition photos — tap a photo to zoom in on wear. If you need more angles or information, ask in your enquiry.",
      },
      {
        q: "Where is the stock, and do you sell abroad?",
        a: "Stock is held at our Rotterdam yard, and we sell to buyers worldwide. Payment terms, delivery terms and any warranty are confirmed in writing for each order.",
      },
    ],
  },
  {
    title: "Selling to us",
    items: [
      {
        q: "How do I sell my surplus engines or parts?",
        a: "Fill in the sell-to-us form with the brand, model, part numbers and condition, and attach up to six photos. The more detail you give, the faster our quote.",
      },
      {
        q: "How quickly will I hear back?",
        a: "We review every submission and come back with a firm offer, usually within two business days.",
      },
      {
        q: "How do collection and payment work?",
        a: "We arrange collection, or you ship to our Rotterdam yard — whichever works best for you. Payment is made on collection and inspection, so you're not waiting on a resale.",
      },
    ],
  },
];

function faqJsonLd(): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SECTIONS.flatMap((section) =>
      section.items.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
    ),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd() }} />
      <section className="border-b border-border bg-surface-0">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="font-body text-label font-medium uppercase text-blueprint">Help</p>
          <h1 className="mt-2 font-display text-display-lg font-bold text-hull">Frequently asked questions</h1>
          <p className="mt-3 font-body text-steel">
            Can&apos;t find your answer? <Link href="/contact" className="font-medium text-blueprint hover:underline">Contact us</Link>{" "}
            and we&apos;ll get back to you.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {SECTIONS.map((section) => (
          <section key={section.title} className="mb-12">
            <h2 className="font-display text-xl font-bold text-hull">{section.title}</h2>
            <div className="mt-4 divide-y divide-border rounded-md border border-border bg-surface-1">
              {section.items.map((item) => (
                <details key={item.q} className="group px-4 py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-body text-base font-semibold text-hull focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blueprint [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span aria-hidden="true" className="font-mono text-fog transition-transform group-open:rotate-45 motion-reduce:transition-none">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 font-body text-sm leading-relaxed text-steel">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap gap-4">
          <Link href="/rfq" className={buttonVariants({ variant: "primary" })}>
            Request a quote
          </Link>
          <Link href="/sell-to-us" className={buttonVariants({ variant: "secondary" })}>
            Sell to us
          </Link>
        </div>
      </div>
    </>
  );
}
