import Link from "next/link";
import { inputClass } from "@/components/ui/form-field";
import { CleanGetForm } from "@/components/vessels/clean-get-form";
import { PUBLIC_STATUS_FILTERS, VESSEL_STATUS_LABEL, type VesselFilters } from "@/lib/vessels";
import { cn } from "@/lib/utils";

function RangeField({
  legend,
  unit,
  minName,
  maxName,
  min,
  max,
  step = "1",
}: {
  legend: string;
  unit?: string;
  minName: string;
  maxName: string;
  min: number | null;
  max: number | null;
  step?: string;
}) {
  return (
    <fieldset>
      <legend className="font-body text-label font-medium uppercase text-fog">
        {legend}
        {unit && <span className="normal-case tracking-normal"> ({unit})</span>}
      </legend>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <label className="sr-only" htmlFor={minName}>{`${legend} from`}</label>
        <input id={minName} name={minName} type="number" inputMode="decimal" step={step} min="0" placeholder="Min" defaultValue={min ?? ""} className={cn(inputClass(), "font-mono")} />
        <label className="sr-only" htmlFor={maxName}>{`${legend} to`}</label>
        <input id={maxName} name={maxName} type="number" inputMode="decimal" step={step} min="0" placeholder="Max" defaultValue={max ?? ""} className={cn(inputClass(), "font-mono")} />
      </div>
    </fieldset>
  );
}

// A plain GET form: the filters live in the URL, so results are shareable,
// bookmarkable and work without JavaScript. Sort is kept in a hidden field.
export function VesselFiltersForm({
  action,
  filters,
  countries,
}: {
  action: string;
  filters: VesselFilters;
  countries: string[];
}) {
  return (
    <CleanGetForm action={action} role="search" aria-label="Filter vessels" className="space-y-5 rounded-md border border-border bg-surface-1 p-4">
      <div>
        <label htmlFor="vessel-q" className="font-body text-label font-medium uppercase text-fog">
          Keyword
        </label>
        <input
          id="vessel-q"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Name, type, builder, port…"
          className={cn(inputClass(), "mt-1.5")}
        />
      </div>

      <fieldset>
        <legend className="font-body text-label font-medium uppercase text-fog">Deal type</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-md border border-border p-1">
          {([["", "Any"], ["sale", "Sale"], ["charter", "Charter"]] as const).map(([value, label]) => (
            <label key={value} className="relative">
              <input type="radio" name="type" value={value} defaultChecked={(filters.type ?? "") === value} className="peer sr-only" />
              <span className="block cursor-pointer rounded px-2 py-1.5 text-center font-body text-sm text-steel peer-checked:bg-hull peer-checked:text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-blueprint">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {countries.length > 0 && (
        <div>
          <label htmlFor="vessel-country" className="font-body text-label font-medium uppercase text-fog">
            Location
          </label>
          <select id="vessel-country" name="country" defaultValue={filters.country} className={cn(inputClass(), "mt-1.5")}>
            <option value="">Anywhere</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      )}

      <RangeField legend="Year built" minName="minYear" maxName="maxYear" min={filters.minYear} max={filters.maxYear} />
      <RangeField legend="Deadweight" unit="t" minName="minDwt" maxName="maxDwt" min={filters.minDwt} max={filters.maxDwt} />
      <RangeField legend="Length overall" unit="m" minName="minLoa" maxName="maxLoa" min={filters.minLoa} max={filters.maxLoa} step="0.1" />

      <div>
        <label htmlFor="vessel-draft" className="font-body text-label font-medium uppercase text-fog">
          Max draft <span className="normal-case tracking-normal">(m)</span>
        </label>
        <input id="vessel-draft" name="maxDraft" type="number" inputMode="decimal" step="0.1" min="0" defaultValue={filters.maxDraft ?? ""} className={cn(inputClass(), "mt-1.5 font-mono")} />
      </div>

      <fieldset>
        <legend className="font-body text-label font-medium uppercase text-fog">Status</legend>
        <div className="mt-1.5 space-y-1">
          {PUBLIC_STATUS_FILTERS.map((status) => (
            <label key={status} className="flex items-center gap-2 font-body text-sm text-steel">
              <input type="checkbox" name="status" value={status} defaultChecked={filters.statuses.includes(status)} className="h-4 w-4 rounded border-border-strong accent-blueprint" />
              {VESSEL_STATUS_LABEL[status]}
            </label>
          ))}
        </div>
      </fieldset>

      {filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" className="flex-1 rounded-md bg-hull px-4 py-2 font-body text-sm font-semibold text-paper hover:bg-steel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blueprint focus-visible:ring-offset-2">
          Apply filters
        </button>
        <Link href={action} className="font-body text-sm font-medium text-blueprint hover:underline">
          Reset
        </Link>
      </div>
    </CleanGetForm>
  );
}
