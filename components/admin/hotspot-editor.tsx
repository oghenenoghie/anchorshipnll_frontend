"use client";

import { useRef, useState, type MouseEvent } from "react";

interface EditableHotspot {
  key: string;
  x: number;
  y: number;
  label: string;
  sku: string;
}

export function HotspotEditor({
  imageUrl,
  initialHotspots,
  stockItems,
  fieldName = "hotspots",
}: {
  imageUrl: string;
  initialHotspots: { x: number; y: number; label: string; sku: string | null }[];
  stockItems: { sku: string; title: string }[];
  fieldName?: string;
}) {
  const counter = useRef(0);
  const [hotspots, setHotspots] = useState<EditableHotspot[]>(() =>
    initialHotspots.map((h) => {
      counter.current += 1;
      return { key: `h-${counter.current}`, x: h.x, y: h.y, label: h.label, sku: h.sku ?? "" };
    }),
  );

  function handleImageClick(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 1000;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 1000;
    counter.current += 1;
    setHotspots((prev) => [...prev, { key: `h-${counter.current}`, x, y, label: "New callout", sku: "" }]);
  }

  function updateHotspot(key: string, patch: Partial<EditableHotspot>) {
    setHotspots((prev) => prev.map((h) => (h.key === key ? { ...h, ...patch } : h)));
  }

  function removeHotspot(key: string) {
    setHotspots((prev) => prev.filter((h) => h.key !== key));
  }

  const serialized = JSON.stringify(
    hotspots.map((h, i) => ({
      id: String(i + 1).padStart(2, "0"),
      x: h.x,
      y: h.y,
      label: h.label,
      sku: h.sku || null,
    })),
  );

  return (
    <div>
      <input type="hidden" name={fieldName} value={serialized} readOnly />

      <p className="font-body text-label font-medium uppercase text-fog">
        Diagram — click to place a callout
      </p>
      <div
        onClick={handleImageClick}
        className="relative mt-1.5 w-full cursor-crosshair overflow-hidden rounded-md border border-border bg-snow"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local static SVG, click-to-place needs raw <img> geometry */}
        <img src={imageUrl} alt="" className="pointer-events-none block w-full select-none" draggable={false} />
        {hotspots.map((h, i) => (
          <div
            key={h.key}
            onClick={(e) => e.stopPropagation()}
            className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-default place-items-center rounded-full border-2 border-blueprint bg-paper/95 font-mono text-xs font-medium text-blueprint"
            style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}
          >
            {String(i + 1).padStart(2, "0")}
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {hotspots.length === 0 && (
          <p className="font-body text-sm text-steel">
            No callouts yet — click the diagram above to add one.
          </p>
        )}
        {hotspots.map((h, i) => (
          <div
            key={h.key}
            className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface-1 p-3"
          >
            <span className="font-mono text-xs data-num text-fog">{String(i + 1).padStart(2, "0")}</span>
            <input
              type="text"
              value={h.label}
              onChange={(e) => updateHotspot(h.key, { label: e.target.value })}
              placeholder="Label"
              className="min-w-0 flex-1 rounded-md border border-border bg-surface-0 px-2 py-1 font-body text-sm text-hull"
            />
            <select
              value={h.sku}
              onChange={(e) => updateHotspot(h.key, { sku: e.target.value })}
              className="rounded-md border border-border bg-surface-0 px-2 py-1 font-body text-sm text-hull"
            >
              <option value="">Not linked</option>
              {stockItems.map((item) => (
                <option key={item.sku} value={item.sku}>
                  {item.sku} — {item.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeHotspot(h.key)}
              className="font-body text-xs font-medium text-rust hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
