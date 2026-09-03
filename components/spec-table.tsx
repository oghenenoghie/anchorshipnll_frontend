export interface SpecRow {
  label: string;
  value: string;
}

export function SpecTable({
  rows,
  variant = "light",
}: {
  rows: SpecRow[];
  variant?: "light" | "dark";
}) {
  const valueColor = variant === "dark" ? "text-paper" : "text-hull";
  const divider = variant === "dark" ? "divide-white/10" : "divide-border";

  return (
    <dl className={`divide-y ${divider}`}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between py-2.5 font-mono text-data">
          <dt className="uppercase tracking-[.06em] text-fog">{row.label}</dt>
          <dd className={`data-num ${valueColor}`}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
