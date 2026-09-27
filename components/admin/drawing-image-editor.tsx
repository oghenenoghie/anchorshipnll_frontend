"use client";

import { useRef, useState } from "react";
import { Field, inputClass } from "@/components/ui/form-field";
import { HotspotEditor } from "@/components/admin/hotspot-editor";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/webp,image/svg+xml";
const MAX_BYTES = 15 * 1024 * 1024;

const UPLOAD_ERROR: Record<string, string> = {
  unauthorized: "Your session expired — sign in again.",
  not_configured: "Image storage isn't configured on this server.",
  unsupported_type: "Use PNG, WebP or SVG line art (not JPEG).",
  unsafe_svg: "That SVG contains scripts or embedded content — export a plain SVG and try again.",
  too_large: "Drawings must be 15 MB or smaller.",
  upload_failed: "Upload failed — try again.",
};

// The drawing's image and its hotspots share one state, so a newly uploaded
// image shows in the hotspot editor straight away — callouts can be placed
// before the drawing is first saved.
export function DrawingImageEditor({
  defaultImageUrl,
  initialHotspots,
  stockItems,
  error,
}: {
  defaultImageUrl?: string;
  initialHotspots: { x: number; y: number; label: string; sku: string | null }[];
  stockItems: { sku: string; title: string }[];
  error?: string;
}) {
  const [imageUrl, setImageUrl] = useState(defaultImageUrl ?? "");
  const [status, setStatus] = useState<{ uploading: boolean; message?: string }>({ uploading: false });
  const picker = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setStatus({ uploading: false, message: UPLOAD_ERROR.unsupported_type });
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus({ uploading: false, message: UPLOAD_ERROR.too_large });
      return;
    }

    setStatus({ uploading: true });
    const body = new FormData();
    body.set("kind", "drawing");
    body.set("file", file);
    try {
      const response = await fetch("/api/admin/photos", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as { url?: string | null; error?: string };
      if (!response.ok || !data.url) {
        setStatus({ uploading: false, message: UPLOAD_ERROR[data.error ?? ""] ?? UPLOAD_ERROR.upload_failed });
        return;
      }
      setImageUrl(data.url);
      setStatus({ uploading: false });
    } catch {
      setStatus({ uploading: false, message: UPLOAD_ERROR.upload_failed });
    } finally {
      if (picker.current) picker.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <Field label="Drawing image" htmlFor="imageUrl" required error={error}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="imageUrl"
            name="imageUrl"
            type="text"
            required
            placeholder="Upload a file, or enter a path like /drawings/example.svg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className={cn(inputClass(Boolean(error)), "font-mono")}
          />
          <label
            className={cn(
              "inline-flex flex-none cursor-pointer items-center justify-center rounded-md border border-border-strong px-4 py-2 font-body text-sm font-semibold text-hull hover:bg-steel/5",
              status.uploading && "pointer-events-none opacity-50",
            )}
          >
            {status.uploading ? "Uploading…" : "Upload image"}
            <input
              ref={picker}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
        </div>
        <p className="mt-1.5 font-body text-xs text-fog">PNG, WebP or SVG line art, up to 15 MB. Never JPEG — it smears fine lines.</p>
        {status.message && (
          <p className="mt-1.5 font-body text-xs text-rust" role="alert">
            {status.message}
          </p>
        )}
      </Field>

      {imageUrl && <HotspotEditor imageUrl={imageUrl} initialHotspots={initialHotspots} stockItems={stockItems} />}
    </div>
  );
}
