// Line-art vessel profile shown where a listing has no photos yet — a
// blueprint sheet rather than an empty grey box.
export function VesselPlaceholder({ label = "Photos on request" }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-snow bg-blueprint-grid bg-[length:24px_24px]">
      <svg viewBox="0 0 240 80" className="w-3/5 max-w-[220px] text-blueprint/60" fill="none" aria-hidden>
        <path d="M8 52 H232 L214 72 H30 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M150 52 V34 H196 V52" stroke="currentColor" strokeWidth="1.5" />
        <path d="M160 34 V22 H186 V34" stroke="currentColor" strokeWidth="1.5" />
        <path d="M172 22 V10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M40 52 V44 H136 V52" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M4 76 H236" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
      </svg>
      <span className="mt-3 font-mono text-xs text-fog">[ {label.toLowerCase()} ]</span>
    </div>
  );
}
