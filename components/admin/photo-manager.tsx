"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { inputClass } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

export interface ManagedPhoto {
  key: string;
  alt: string;
  url: string | null;
}

interface PendingUpload {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_BYTES = 15 * 1024 * 1024;

const UPLOAD_ERROR: Record<string, string> = {
  unauthorized: "Your session expired — sign in again.",
  not_configured: "Photo storage isn't configured on this server.",
  unsupported_type: "Use JPEG, PNG, WebP or AVIF.",
  too_large: "Photos must be 15 MB or smaller.",
  upload_failed: "Upload failed — try again.",
};

function uploadPhoto(
  file: File,
  onProgress: (fraction: number) => void,
): Promise<{ key: string; url: string | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/photos");
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      const body = xhr.response as { key?: string; url?: string | null; error?: string } | null;
      if (xhr.status === 200 && body?.key) resolve({ key: body.key, url: body.url ?? null });
      else reject(new Error(UPLOAD_ERROR[body?.error ?? ""] ?? "Upload failed — try again."));
    };
    xhr.onerror = () => reject(new Error("Network error — try again."));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export function PhotoManager({ defaults, altHint }: { defaults: ManagedPhoto[]; altHint?: string }) {
  const [photos, setPhotos] = useState<ManagedPhoto[]>(defaults);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const guard = useRef<HTMLInputElement>(null);
  const uploading = pending.some((p) => !p.error);

  // Blocks the stock form from submitting while uploads are still running,
  // which would otherwise save the listing without them.
  useEffect(() => {
    guard.current?.setCustomValidity(uploading ? "Wait for the photo uploads to finish." : "");
  }, [uploading]);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      const tooBig = file.size > MAX_BYTES;
      const badType = !ACCEPT.split(",").includes(file.type);
      setPending((prev) => [
        ...prev,
        {
          id,
          name: file.name,
          progress: 0,
          error: badType ? UPLOAD_ERROR.unsupported_type : tooBig ? UPLOAD_ERROR.too_large : undefined,
        },
      ]);
      if (badType || tooBig) continue;

      try {
        const { key, url } = await uploadPhoto(file, (fraction) =>
          setPending((prev) => prev.map((p) => (p.id === id ? { ...p, progress: fraction } : p))),
        );
        setPhotos((prev) => [...prev, { key, url, alt: "" }]);
        setPending((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed — try again.";
        setPending((prev) => prev.map((p) => (p.id === id ? { ...p, error: message } : p)));
      }
    }
  }

  function move(index: number, to: number) {
    setPhotos((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [photo] = next.splice(index, 1);
      next.splice(to, 0, photo);
      return next;
    });
  }

  return (
    <div>
      <input
        type="hidden"
        name="images"
        value={JSON.stringify(photos.map(({ key, alt }) => ({ key, alt })))}
      />
      <input ref={guard} tabIndex={-1} aria-hidden className="sr-only" defaultValue="" />

      {photos.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {photos.map((photo, index) => (
            <li key={photo.key} className="overflow-hidden rounded-md border border-border bg-surface-1">
              <div className="relative aspect-[4/3] bg-snow">
                {photo.url ? (
                  <Image
                    src={photo.url}
                    alt={photo.alt || altHint || "Listing photo"}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-fog">
                    [ stored — preview unavailable ]
                  </span>
                )}
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-md bg-hull px-2 py-1 font-body text-xs font-medium text-paper">
                    Primary
                  </span>
                )}
              </div>
              <div className="space-y-2 p-3">
                <input
                  type="text"
                  aria-label={`Description for photo ${index + 1}`}
                  placeholder="Describe the photo (e.g. valve seat wear, left side)"
                  value={photo.alt}
                  maxLength={200}
                  onChange={(e) =>
                    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, alt: e.target.value } : p)))
                  }
                  className={inputClass()}
                />
                <div className="flex flex-wrap items-center gap-3 font-body text-xs font-medium">
                  {index > 0 && (
                    <button type="button" onClick={() => move(index, 0)} className="text-blueprint hover:underline">
                      Make primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Move photo ${index + 1} earlier`}
                    className="text-steel hover:text-hull disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === photos.length - 1}
                    aria-label={`Move photo ${index + 1} later`}
                    className="text-steel hover:text-hull disabled:opacity-40"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                    className="ml-auto text-rust hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pending.length > 0 && (
        <ul className="mt-4 space-y-2">
          {pending.map((upload) => (
            <li key={upload.id} className="rounded-md border border-border bg-surface-1 px-3 py-2 font-body text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-hull">{upload.name}</span>
                {upload.error ? (
                  <button
                    type="button"
                    onClick={() => setPending((prev) => prev.filter((p) => p.id !== upload.id))}
                    className="shrink-0 text-xs font-medium text-steel hover:text-hull"
                  >
                    Dismiss
                  </button>
                ) : (
                  <span className="shrink-0 font-mono text-xs data-num text-fog">
                    {Math.round(upload.progress * 100)}%
                  </span>
                )}
              </div>
              {upload.error ? (
                <p className="mt-1 text-xs text-rust" role="alert">
                  {upload.error}
                </p>
              ) : (
                <div className="mt-2 h-1 overflow-hidden rounded bg-border">
                  <div
                    className="h-full bg-blueprint transition-[width]"
                    style={{ width: `${Math.round(upload.progress * 100)}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "mt-4 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-strong px-4 py-8 text-center",
        )}
      >
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="font-body text-sm font-semibold text-blueprint hover:underline"
        >
          + Add photos
        </button>
        <p className="font-body text-xs text-fog">
          or drag them here · JPEG, PNG, WebP or AVIF, up to 15 MB each · the first photo is the primary one
        </p>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
