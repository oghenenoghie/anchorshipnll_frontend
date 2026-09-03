import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of service for AnchorShip NL.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Company"
      title="Terms of Service"
      lastUpdated="September 3, 2026"
      intro="These terms govern your use of the AnchorShip NL website and any purchase, sale, or enquiry made through it. They're a general-purpose template — parts of a live agreement (payment terms, incoterms, warranty periods) are confirmed in writing on a per-order basis and take precedence over this page."
      sections={[
        {
          heading: "Acceptance of terms",
          body: (
            <p>
              By browsing this site, submitting a request for quote, or contacting us to buy or
              sell equipment, you agree to these terms. If you don&apos;t agree with any part of
              them, please don&apos;t use the site — you&apos;re always welcome to reach us
              directly instead.
            </p>
          ),
        },
        {
          heading: "Listings, pricing & availability",
          body: (
            <>
              <p>
                Prices marked &ldquo;POA&rdquo; (price on application) are indicative and
                confirmed only once we&apos;ve reviewed your request. Listed quantities and
                condition are believed accurate at time of publishing but are not guaranteed —
                used engines and parts move quickly, and stock can sell between when a page is
                generated and when you submit an enquiry.
              </p>
              <p>
                A quote we send in response to a request is valid for the period stated in that
                quote, or 14 days if none is stated, and is not a binding offer until we confirm
                your order in writing.
              </p>
            </>
          ),
        },
        {
          heading: "Orders & payment",
          body: (
            <p>
              An order is confirmed once we&apos;ve issued a written order confirmation and, where
              applicable, received payment or an agreed deposit. Payment terms, currency, and
              method are set out on the order confirmation itself. Title to goods passes on
              receipt of full payment.
            </p>
          ),
        },
        {
          heading: "Shipping & delivery",
          body: (
            <p>
              Unless otherwise agreed in writing, goods are made available ex-works from our
              Rotterdam yard, and the buyer is responsible for arranging and insuring transport
              from that point. Delivery dates given before dispatch are estimates, not
              commitments — we&apos;ll flag it as soon as we know if something will run late.
            </p>
          ),
        },
        {
          heading: "Condition, warranty & returns",
          body: (
            <p>
              Used engines and parts are sold in the condition described in the listing or quote,
              on an as-is / where-is basis unless a specific warranty is agreed in writing for
              that order. Because condition is central to what we sell, we&apos;d rather you ask
              questions before you buy than be surprised after — get in touch and we&apos;ll tell
              you what we know.
            </p>
          ),
        },
        {
          heading: "Sell-to-us submissions",
          body: (
            <p>
              A valuation we give in response to a sell-to-us submission is an estimate, not a
              binding offer to purchase, until we confirm terms and collection details in
              writing. You confirm that you have the right to sell any equipment or parts you
              submit to us.
            </p>
          ),
        },
        {
          heading: "Intellectual property",
          body: (
            <p>
              The AnchorShip NL name, catalog structure, and original photography and text on
              this site are our property or used under licence. You&apos;re welcome to reference
              or link to a listing; please don&apos;t republish our content or images as your
              own.
            </p>
          ),
        },
        {
          heading: "Limitation of liability",
          body: (
            <p>
              To the fullest extent permitted by law, AnchorShip NL is not liable for indirect or
              consequential loss arising from use of this site or a purchase made through it. Our
              total liability for any single order is limited to the amount paid for that order.
              Nothing here limits liability that cannot lawfully be excluded, such as for death,
              personal injury, or fraud.
            </p>
          ),
        },
        {
          heading: "Governing law & disputes",
          body: (
            <p>
              These terms are governed by the laws of the Netherlands. Any dispute arising from
              them or from an order will be submitted to the competent court in Rotterdam, without
              prejudice to any mandatory consumer-protection rules that may apply.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions about these terms? Reach us through the{" "}
              <a href="/contact" className="font-medium text-blueprint">
                contact page
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
