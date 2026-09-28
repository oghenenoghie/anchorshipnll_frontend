import { submitVesselEnquiry } from "@/app/vessels/actions";
import { Field, inputClass } from "@/components/ui/form-field";
import { FormStatusBanner } from "@/components/ui/form-status";
import { SubmitButton } from "@/components/ui/submit-button";
import { firstParam, paramValues, type SearchParams } from "@/lib/search-params";

const FIELD_ERROR: Record<string, string> = {
  name: "Enter your name.",
  email: "Enter a valid email address.",
};

export function VesselEnquiryForm({
  vesselSlug,
  vesselTitle,
  searchParams,
}: {
  vesselSlug: string;
  vesselTitle: string;
  searchParams: SearchParams;
}) {
  const sent = firstParam(searchParams, "enquiry") === "sent";
  const hasError = firstParam(searchParams, "error") === "1";
  const missing = new Set(paramValues(searchParams, "missing").flatMap((v) => v.split(",")));
  const value = (name: string) => firstParam(searchParams, name);

  if (sent) {
    return (
      <FormStatusBanner
        status="success"
        message={`Thank you — your enquiry about ${vesselTitle} is with our brokers. We'll reply by email, normally within one working day.`}
      />
    );
  }

  return (
    <>
      {hasError && missing.has("send") && (
        <FormStatusBanner status="error" message="Something went wrong sending your enquiry. Please try again, or email us directly." />
      )}
      {hasError && missing.has("rate") && (
        <FormStatusBanner status="error" message="Too many enquiries from your connection in a short time. Please wait a few minutes and try again." />
      )}
      {hasError && (missing.has("name") || missing.has("email")) && (
        <FormStatusBanner status="error" message="Please check the highlighted fields below." />
      )}

      <form action={submitVesselEnquiry} className="space-y-5">
        <input type="hidden" name="vessel" value={vesselSlug} />
        {/* Honeypot — hidden from people and assistive tech; bots fill it in. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="enquiry-website">Website</label>
          <input id="enquiry-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="enquiry-name" required error={missing.has("name") ? FIELD_ERROR.name : undefined}>
            <input id="enquiry-name" name="name" type="text" required autoComplete="name" defaultValue={value("name")} className={inputClass(missing.has("name"))} />
          </Field>
          <Field label="Company" htmlFor="enquiry-company">
            <input id="enquiry-company" name="company" type="text" autoComplete="organization" defaultValue={value("company")} className={inputClass()} />
          </Field>
          <Field label="Email" htmlFor="enquiry-email" required error={missing.has("email") ? FIELD_ERROR.email : undefined}>
            <input id="enquiry-email" name="email" type="email" required autoComplete="email" defaultValue={value("email")} className={inputClass(missing.has("email"))} />
          </Field>
          <Field label="Phone" htmlFor="enquiry-phone">
            <input id="enquiry-phone" name="phone" type="tel" autoComplete="tel" defaultValue={value("phone")} className={inputClass()} />
          </Field>
        </div>
        <Field label="Message" htmlFor="enquiry-message">
          <textarea
            id="enquiry-message"
            name="message"
            rows={4}
            defaultValue={value("message") || `I'd like more information about ${vesselTitle}.`}
            className={inputClass()}
          />
        </Field>
        <p className="font-body text-xs text-fog">
          Enquiries are confidential and go straight to our brokers. See our{" "}
          <a href="/privacy" className="text-blueprint hover:underline">
            privacy notice
          </a>
          .
        </p>
        <SubmitButton pendingLabel="Sending…">Send enquiry</SubmitButton>
      </form>
    </>
  );
}
