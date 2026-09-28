import { BRANDS, brandSlug, modelHref } from "@/lib/data/stock";

export interface PartsLink {
  label: string;
  href: string;
}

function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Links a machinery spec ("2 × Wärtsilä 6L32 (W32)") to the parts catalogue:
// the engine-model hub when the brand and a catalogued model both appear in
// the text, otherwise the brand hub. This cross-sell is AnchorShip's edge —
// the vessel's engines are the parts we stock.
export function partsLinkFor(value: string, brandModels: { brand: string; model: string }[]): PartsLink | null {
  const text = fold(value);
  const brand = BRANDS.find((b) => new RegExp(`\\b${fold(b.name)}\\b`).test(text));
  if (!brand) return null;
  const model = brandModels
    .filter((pair) => pair.brand === brand.name)
    .sort((a, b) => b.model.length - a.model.length)
    .find((pair) => {
      const escaped = fold(pair.model).replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9])(\\d*${escaped})([^a-z0-9]|$)`).test(text);
    });
  return model
    ? { label: `${brand.name} ${model.model} spare parts`, href: modelHref(brand.name, model.model) }
    : { label: `${brand.name} spare parts`, href: `/brands/${brandSlug(brand.name)}` };
}
