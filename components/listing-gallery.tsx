import { StatusBadge, type StockStatus } from "@/components/ui/status-badge";

// Placeholder gallery — swap for next/image against the Cloudinary public_id
// stored on stock_items once condition photography is wired in.
export function ListingGallery({ status, alt }: { status: StockStatus; alt: string }) {
  return (
    <div>
      <div className="relative flex aspect-square items-center justify-center rounded-md border border-border bg-snow">
        <StatusBadge status={status} className="absolute right-3 top-3" />
        <span className="font-mono text-xs text-fog">[ image — {alt} ]</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="flex aspect-square items-center justify-center rounded-md border border-border bg-snow first:ring-1 first:ring-blueprint"
          >
            <span className="font-mono text-[10px] text-fog">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
