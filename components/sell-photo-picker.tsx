"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Mirrors MAX_ENQUIRY_PHOTOS / MAX_ENQUIRY_PHOTO_BYTES / PHOTO_TYPES in
// lib/storage.ts, which can't be imported here (it uses node:crypto). The
// server checks again on submit.
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const TYPES = new Set(ACCEPT.split(","));
const MAX_PHOTOS = 6;
const MAX_BYTES = 10 * 1024 * 1024;

interface Picked {
  file: File;
  url: string;
}

// The chosen photos live in state and are mirrored into the file input's
// FileList, so they submit with the form like any other field and can be
// added to or removed one at a time.
export function SellPhotoPicker({ hasError }: { hasError?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!input.current) return;
    const transfer = new DataTransfer();
    picked.forEach((p) => transfer.items.add(p.file));
    input.current.files = transfer.files;
  }, [picked]);

  // Revoke whatever previews are still showing when the form goes away.
  const latest = useRef(picked);
  latest.current = picked;
  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  function add(list: FileList | null) {
    const files = Array.from(list ?? []);
    const rejected: string[] = [];
    const accepted = files.filter((file) => {
      if (!TYPES.has(file.type)) rejected.push(`${file.name} isn't a JPEG, PNG, WebP or AVIF image.`);
      else if (file.size > MAX_BYTES) rejected.push(`${file.name} is over 10 MB.`);
      else return true;
      return false;
    });

    const room = MAX_PHOTOS - picked.length;
    if (accepted.length > room) rejected.push(`You can send up to ${MAX_PHOTOS} photos.`);
    const added = accepted.slice(0, Math.max(room, 0)).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPicked([...picked, ...added]);
    setNotice(rejected.length > 0 ? rejected.join(" ") : null);
  }

  function remove(index: number) {
    URL.revokeObjectURL(picked[index].url);
    setPicked((current) => current.filter((_, i) => i !== index));
    setNotice(null);
  }

  const full = picked.length >= MAX_PHOTOS;

  return (
    <div>
      {/* The input keeps the chosen files for submission; the label is the
          visible control. Selecting files replaces the input's own list, so
          the effect above rewrites it from state. */}
      <input
        ref={input}
        id="photos"
        name="photos"
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => add(e.target.files)}
      />

      {picked.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {picked.map((p, i) => (
            <li key={`${p.file.name}-${i}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img
                src={p.url}
                alt={p.file.name}
                className="aspect-square w-full rounded-md border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${p.file.name}`}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-hull/80 font-body text-xs text-paper hover:bg-hull"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <label
        htmlFor="photos"
        aria-disabled={full}
        className={cn(
          "flex cursor-pointer flex-col items-center rounded-md border border-dashed px-4 py-6 text-center transition-colors",
          hasError ? "border-rust" : "border-border-strong hover:border-blueprint",
          full && "pointer-events-none opacity-50",
        )}
      >
        <span className="font-body text-sm font-medium text-blueprint underline">
          {picked.length > 0 ? "+ Add more photos" : "+ Add photos"}
        </span>
        <span className="mt-1 font-body text-xs text-fog">
          Optional · JPEG, PNG, WebP or AVIF · up to {MAX_PHOTOS} photos, 10 MB each
        </span>
      </label>

      {notice && (
        <p className="mt-1.5 font-body text-xs text-rust" role="alert">
          {notice}
        </p>
      )}
    </div>
  );
}
