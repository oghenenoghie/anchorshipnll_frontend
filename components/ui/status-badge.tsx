import { cn } from "@/lib/utils";

export type StockStatus = "available" | "in-stock" | "reserved" | "expected" | "sold";

const STATUS_CONFIG: Record<StockStatus, { label: string; text: string; fill: string }> = {
  available: { label: "Available", text: "text-patina", fill: "bg-[rgb(110_139_123_/_0.14)]" },
  "in-stock": { label: "In stock", text: "text-signal", fill: "bg-[rgb(198_96_43_/_0.12)]" },
  reserved: { label: "Reserved", text: "text-[#8A6D1F]", fill: "bg-[rgb(138_109_31_/_0.14)]" },
  expected: { label: "Expected", text: "text-blueprint", fill: "bg-[rgb(46_110_158_/_0.12)]" },
  sold: { label: "Sold", text: "text-steel", fill: "bg-[rgb(59_74_90_/_0.10)]" },
};

export const STATUS_LABEL: Record<StockStatus, string> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([status, config]) => [status, config.label]),
) as Record<StockStatus, string>;

export function StatusBadge({ status, className }: { status: StockStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium font-body",
        config.text,
        config.fill,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {config.label}
    </span>
  );
}
