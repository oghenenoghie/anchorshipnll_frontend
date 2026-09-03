import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function FacetCheckbox({
  href,
  checked,
  label,
  count,
}: {
  href: string;
  checked: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      role="checkbox"
      aria-checked={checked}
      scroll={false}
      className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 font-body text-sm text-hull transition-colors hover:bg-steel/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blueprint"
    >
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-[3px] border",
            checked ? "border-blueprint bg-blueprint" : "border-border-strong bg-snow",
          )}
          aria-hidden
        >
          {checked && <Check className="h-3 w-3 text-snow" strokeWidth={3} />}
        </span>
        {label}
      </span>
      <span className="font-mono text-xs text-fog">{count}</span>
    </Link>
  );
}
