import { Field, inputClass } from "@/components/ui/form-field";
import { buttonVariants } from "@/components/ui/button";
import { BRANDS, STATUSES } from "@/lib/data/stock";
import type { AdminListing } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

const FIELD_ERROR: Record<string, string> = {
  sku: "Enter a SKU.",
  title: "Enter a title.",
  brand: "Choose a brand.",
  category: "Choose a category.",
  status: "Choose a status.",
  quantity: "Enter a non-negative whole number.",
  sku_taken: "That SKU is already in use — choose another.",
  save_failed: "Something went wrong saving this listing. Please try again.",
};

function formatOemNumbers(values: string[]): string {
  return values.join("\n");
}

function formatSpecs(specs: AdminListing["specs"]): string {
  return specs.map((s) => `${s.label}: ${s.value}`).join("\n");
}

export function StockForm({
  action,
  submitLabel,
  missing,
  defaults,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  missing: Set<string>;
  defaults?: Partial<AdminListing>;
}) {
  const generalError = missing.has("sku_taken")
    ? FIELD_ERROR.sku_taken
    : missing.has("save_failed")
      ? FIELD_ERROR.save_failed
      : undefined;

  return (
    <form action={action} className="space-y-6">
      {generalError && (
        <p className="rounded-md border border-rust/30 bg-[rgb(155_44_44_/_0.08)] px-4 py-3 font-body text-sm text-hull">
          {generalError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="SKU" htmlFor="sku" required error={missing.has("sku") ? FIELD_ERROR.sku : undefined}>
          <input
            id="sku"
            name="sku"
            type="text"
            required
            defaultValue={defaults?.sku}
            className={cn(inputClass(missing.has("sku")), "font-mono")}
          />
        </Field>

        <Field label="Title" htmlFor="title" required error={missing.has("title") ? FIELD_ERROR.title : undefined}>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={defaults?.title}
            className={inputClass(missing.has("title"))}
          />
        </Field>

        <Field label="Subtitle" htmlFor="subtitle">
          <input id="subtitle" name="subtitle" type="text" defaultValue={defaults?.subtitle} className={inputClass()} />
        </Field>

        <Field label="Brand" htmlFor="brand" required error={missing.has("brand") ? FIELD_ERROR.brand : undefined}>
          <select
            id="brand"
            name="brand"
            required
            defaultValue={defaults?.brand ?? ""}
            className={inputClass(missing.has("brand"))}
          >
            <option value="" disabled>
              Select a brand…
            </option>
            {BRANDS.map((b) => (
              <option key={b.slug} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Category"
          htmlFor="category"
          required
          error={missing.has("category") ? FIELD_ERROR.category : undefined}
        >
          <select
            id="category"
            name="category"
            required
            defaultValue={defaults?.category ?? ""}
            className={inputClass(missing.has("category"))}
          >
            <option value="" disabled>
              Select a category…
            </option>
            <option value="part">Part</option>
            <option value="engine">Engine</option>
          </select>
        </Field>

        <Field label="Status" htmlFor="status" required error={missing.has("status") ? FIELD_ERROR.status : undefined}>
          <select
            id="status"
            name="status"
            required
            defaultValue={defaults?.status ?? "available"}
            className={inputClass(missing.has("status"))}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Quantity"
          htmlFor="quantity"
          required
          error={missing.has("quantity") ? FIELD_ERROR.quantity : undefined}
        >
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={defaults?.quantity ?? 0}
            className={inputClass(missing.has("quantity"))}
          />
        </Field>

        <Field label="Price on application" htmlFor="priceOnApplication">
          <input
            id="priceOnApplication"
            name="priceOnApplication"
            type="text"
            placeholder="e.g. 4200.00 (leave blank if POA)"
            defaultValue={defaults?.priceOnApplication ?? ""}
            className={cn(inputClass(), "font-mono")}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaults?.description}
          className={inputClass()}
        />
      </Field>

      <Field label="OEM numbers (one per line)" htmlFor="oemNumbers">
        <textarea
          id="oemNumbers"
          name="oemNumbers"
          rows={3}
          defaultValue={defaults ? formatOemNumbers(defaults.oemNumbers ?? []) : undefined}
          className={cn(inputClass(), "font-mono")}
        />
      </Field>

      <Field label="Specs — one per line, as “Label: Value”" htmlFor="specs">
        <textarea
          id="specs"
          name="specs"
          rows={5}
          placeholder={"Weight: 86 kg\nMaterial: Cast iron"}
          defaultValue={defaults ? formatSpecs(defaults.specs ?? []) : undefined}
          className={cn(inputClass(), "font-mono")}
        />
      </Field>

      <button type="submit" className={buttonVariants({ variant: "primary" })}>
        {submitLabel}
      </button>
    </form>
  );
}
