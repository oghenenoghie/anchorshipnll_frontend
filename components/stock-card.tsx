import Link from "next/link";
import Image from "next/image";
import { StatusBadge, type StockStatus } from "@/components/ui/status-badge";

export interface StockCardProps {
  href: string;
  title: string;
  subtitle: string;
  sku: string;
  quantity: number;
  status: StockStatus;
  image?: { url: string; alt: string };
}

export function StockCard({ href, title, subtitle, sku, quantity, status, image }: StockCardProps) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-md border border-border bg-surface-1 shadow-[0_1px_2px_rgb(14_22_33/.06)] transition-all hover:border-border-strong hover:-translate-y-0.5 motion-reduce:transform-none"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-snow">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || `${title} — ${subtitle}`}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain"
          />
        ) : (
          <span className="font-mono text-xs text-fog">[ photo on request ]</span>
        )}
        <StatusBadge status={status} className="absolute right-3 top-3" />
      </div>
      <div className="border-t border-border p-4">
        <h3 className="font-body text-base font-semibold text-hull">{title}</h3>
        <p className="mt-1 font-body text-sm text-steel">{subtitle}</p>
        <p className="mt-2 font-mono text-data data-num text-fog">
          SKU {sku} · {quantity} in stock
        </p>
        <span className="mt-3 inline-block font-body text-sm font-semibold text-signal">
          POA →
        </span>
      </div>
    </Link>
  );
}
