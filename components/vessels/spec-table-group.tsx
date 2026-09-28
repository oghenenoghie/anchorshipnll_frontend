import Link from "next/link";
import type { PartsLink } from "@/lib/vessel-parts-links";

export interface SpecTableRow {
  label: string;
  value: string;
  partsLink?: PartsLink | null;
}

// One group of technical data as a real table (row headers for screen
// readers), with values in Plex Mono.
export function SpecificationGroup({ name, rows }: { name: string; rows: SpecTableRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="break-inside-avoid rounded-md border border-border bg-surface-1">
      <h3 className="border-b border-border px-4 py-3 font-body text-label font-medium uppercase text-blueprint">{name}</h3>
      <table className="w-full">
        <caption className="sr-only">{name}</caption>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={`${row.label}-${row.value}`} className="align-baseline">
              <th scope="row" className="w-2/5 px-4 py-2.5 text-left font-mono text-xs font-normal uppercase tracking-[.06em] text-fog">
                {row.label}
              </th>
              <td className="px-4 py-2.5 font-mono text-data data-num text-hull">
                {row.value}
                {row.partsLink && (
                  <Link href={row.partsLink.href} className="mt-1 block font-body text-xs font-medium text-blueprint hover:underline">
                    {row.partsLink.label} →
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
