"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
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
  const [open, setOpen] = useState(false);
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
      {/* Buyers inspect wear up close, so the main photo opens a full-screen
          viewer with pinch, scroll-wheel and double-tap zoom. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-md border border-border bg-snow"
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
        <span className="absolute bottom-3 right-3 rounded-md bg-hull/75 px-2 py-1 font-body text-xs text-paper">
          Tap to zoom
        </span>
      </button>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={selected}
        on={{ view: ({ index }) => setSelected(index) }}
        slides={images.map((image) => ({ src: image.url, alt: image.alt || alt }))}
        plugins={[Zoom, Counter]}
        zoom={{ maxZoomPixelRatio: 4, scrollToZoom: true }}
        carousel={{ finite: true }}
        controller={{ closeOnBackdropClick: true }}
        styles={{ container: { backgroundColor: "#0E1621" } }}
        render={
          images.length > 1 ? undefined : { buttonPrev: () => null, buttonNext: () => null }
        }
      />

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
