import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function inputClass(hasError?: boolean) {
  return cn(
    "w-full rounded-md border bg-surface-1 px-3 py-2 font-body text-sm text-hull placeholder:text-fog transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blueprint",
    hasError ? "border-rust" : "border-border",
  );
}

export function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block font-body text-label font-medium uppercase text-fog">
        {label}
        {required && <span className="text-signal"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1.5 font-body text-xs text-rust" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
