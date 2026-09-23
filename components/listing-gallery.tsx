"use client";

import { useState } from "react";
import Image from "next/image";
import { StatusBadge, type StockStatus } from "@/components/ui/status-badge";
import type { ListingImage } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

export function ListingGallery({
  status,
  alt,
  images,
}: {
  status: StockStatus;
  alt: string;
  images: ListingImage[];
}) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  if (!current) {
    return (
      <div className="relative flex aspect-square items-center justify-center rounded-md border border-border bg-snow">
        <StatusBadge status={status} className="absolute right-3 top-3" />
        <span className="font-mono text-xs text-fog">[ photos on request ]</span>
      </div>
    );
  }

  return (
    <div>
      <a
        href={current.url}
        target="_blank"
        rel="noopener"
        className="relative block aspect-square overflow-hidden rounded-md border border-border bg-snow"
      >
        <Image
          src={current.url}
          alt={current.alt || alt}
          fill
          priority={selected === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain"
        />
        <StatusBadge status={status} className="absolute right-3 top-3" />
        <span className="sr-only">Open full-size photo</span>
      </a>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image.key}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show photo ${index + 1}${image.alt ? `: ${image.alt}` : ""}`}
              aria-pressed={index === selected}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border bg-snow transition-colors",
                index === selected ? "border-blueprint ring-1 ring-blueprint" : "border-border hover:border-border-strong",
              )}
            >
              <Image src={image.url} alt="" fill sizes="120px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
