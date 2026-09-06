import { Field, inputClass } from "@/components/ui/form-field";
import { buttonVariants } from "@/components/ui/button";
import { HotspotEditor } from "@/components/admin/hotspot-editor";
import { BRANDS } from "@/lib/data/stock";
import type { DrawingDetail } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

const FIELD_ERROR: Record<string, string> = {
  slug: "Enter a URL slug.",
  title: "Enter a title.",
  brand: "Choose a brand.",
  imageUrl: "Enter an image path or URL.",
  slug_taken: "That slug is already in use — choose another.",
  save_failed: "Something went wrong saving this diagram. Please try again.",
};

export function DrawingForm({
  action,
  submitLabel,
  missing,
  defaults,
  stockItems,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  missing: Set<string>;
  defaults?: Partial<DrawingDetail>;
  stockItems: { sku: string; title: string }[];
}) {
  const generalError = missing.has("slug_taken")
    ? FIELD_ERROR.slug_taken
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

        <Field label="Slug" htmlFor="slug" required error={missing.has("slug") ? FIELD_ERROR.slug : undefined}>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            placeholder="wartsila-w32-cylinder-head"
            defaultValue={defaults?.slug}
            className={cn(inputClass(missing.has("slug")), "font-mono")}
          />
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
          label="Image path / URL"
          htmlFor="imageUrl"
          required
          error={missing.has("imageUrl") ? FIELD_ERROR.imageUrl : undefined}
        >
          <input
            id="imageUrl"
            name="imageUrl"
            type="text"
            required
            placeholder="/drawings/example.svg"
            defaultValue={defaults?.imageUrl}
            className={cn(inputClass(missing.has("imageUrl")), "font-mono")}
          />
        </Field>
      </div>

      {defaults?.imageUrl && (
        <HotspotEditor
          imageUrl={defaults.imageUrl}
          initialHotspots={defaults.hotspots ?? []}
          stockItems={stockItems}
        />
      )}

      <button type="submit" className={buttonVariants({ variant: "primary" })}>
        {submitLabel}
      </button>
    </form>
  );
}
