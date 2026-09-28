import type { VesselStatusValue, VesselTransactionValue } from "@/lib/db/schema";
import { TRANSACTION_LABEL, VESSEL_STATUS_LABEL } from "@/lib/vessels";
import { cn } from "@/lib/utils";

const badge = "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-body text-xs font-medium";

// Sale is blueprint, charter harbor; both shows the two colours side by side.
export function TransactionBadge({ type, className }: { type: VesselTransactionValue; className?: string }) {
  const tone =
    type === "charter"
      ? "bg-[rgb(21_122_140_/_0.12)] text-harbor"
      : "bg-[rgb(46_110_158_/_0.12)] text-blueprint";
  return (
    <span className={cn(badge, tone, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {type === "sale_and_charter" && <span className="h-1.5 w-1.5 -ml-1 rounded-full bg-harbor" aria-hidden />}
      {TRANSACTION_LABEL[type]}
    </span>
  );
}

const STATUS_TONE: Partial<Record<VesselStatusValue, string>> = {
  under_offer: "bg-[rgb(138_109_31_/_0.14)] text-[#8A6D1F]",
  sold: "bg-[rgb(59_74_90_/_0.10)] text-steel",
  chartered: "bg-[rgb(59_74_90_/_0.10)] text-steel",
  draft: "bg-[rgb(59_74_90_/_0.10)] text-steel",
  archived: "bg-[rgb(59_74_90_/_0.10)] text-steel",
};

// Nothing for plain "published" — the transaction badge already says it's live.
export function VesselStatusBadge({ status, className }: { status: VesselStatusValue; className?: string }) {
  const tone = STATUS_TONE[status];
  if (!tone) return null;
  return (
    <span className={cn(badge, tone, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {VESSEL_STATUS_LABEL[status]}
    </span>
  );
}

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(badge, "border border-dashed border-border-strong bg-surface-1 text-steel", className)}
      title="A fictional listing used to demonstrate the marketplace"
    >
      Sample listing
    </span>
  );
}
