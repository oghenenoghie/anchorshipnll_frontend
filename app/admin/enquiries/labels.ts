import type { EnquiryKindValue, EnquiryStatusValue } from "@/lib/db/schema";

export const KIND_LABEL: Record<EnquiryKindValue, string> = {
  rfq: "RFQ",
  contact: "Contact",
  sell_to_us: "Sell to us",
};

export const STATUS_LABEL: Record<EnquiryStatusValue, string> = {
  new: "New",
  handled: "Handled",
};

export const STATUS_CLASS: Record<EnquiryStatusValue, string> = {
  new: "text-signal bg-[rgb(198_96_43_/_0.12)]",
  handled: "text-steel bg-[rgb(59_74_90_/_0.10)]",
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Amsterdam",
});

export function formatReceived(date: Date): string {
  return DATE_FORMAT.format(date);
}
