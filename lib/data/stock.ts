import type { StockStatus } from "@/components/ui/status-badge";

export type StockCategory = "engine" | "part";

export interface Brand {
  name: string;
  slug: string;
}

export const BRANDS: Brand[] = [
  { name: "Wärtsilä", slug: "wartsila" },
  { name: "MAN", slug: "man" },
  { name: "MaK", slug: "mak" },
  { name: "Deutz", slug: "deutz" },
  { name: "Caterpillar", slug: "caterpillar" },
];

// DB-backed statuses only (see lib/db/schema.ts stockStatusEnum). "in-stock" is a
// CTA-adjacent display treatment used ad hoc on the homepage, not a stored status.
export const STATUSES: StockStatus[] = ["available", "reserved", "expected", "sold"];

export interface StockListing {
  sku: string;
  title: string;
  subtitle: string;
  brand: string;
  category: StockCategory;
  status: StockStatus;
  quantity: number;
  oemNumbers: string[];
}

export const STOCK_LISTINGS: StockListing[] = [
  {
    sku: "DR-2231",
    title: "Wärtsilä W32",
    subtitle: "Cylinder head, complete",
    brand: "Wärtsilä",
    category: "part",
    status: "available",
    quantity: 4,
    oemNumbers: ["W32-CH-2231", "851 111"],
  },
  {
    sku: "DR-1187",
    title: "MAN B&W 6S50MC",
    subtitle: "Fuel injection pump",
    brand: "MAN",
    category: "part",
    status: "available",
    quantity: 1,
    oemNumbers: ["6S50MC-FIP-1187"],
  },
  {
    sku: "DR-0942",
    title: "Caterpillar 3512C",
    subtitle: "Turbocharger assembly",
    brand: "Caterpillar",
    category: "part",
    status: "expected",
    quantity: 2,
    oemNumbers: ["3512C-TC-0942", "222-9397"],
  },
  {
    sku: "DR-1355",
    title: "MaK M32C",
    subtitle: "Piston with connecting rod",
    brand: "MaK",
    category: "part",
    status: "available",
    quantity: 6,
    oemNumbers: ["M32C-PIS-1355"],
  },
  {
    sku: "DR-0771",
    title: "Deutz TBD620",
    subtitle: "Cylinder liner, honed",
    brand: "Deutz",
    category: "part",
    status: "reserved",
    quantity: 1,
    oemNumbers: ["TBD620-CL-0771"],
  },
  {
    sku: "DR-1902",
    title: "Wärtsilä 6L20",
    subtitle: "Camshaft, reconditioned",
    brand: "Wärtsilä",
    category: "part",
    status: "sold",
    quantity: 0,
    oemNumbers: ["6L20-CAM-1902"],
  },
  {
    sku: "DR-1440",
    title: "MAN L23/30H",
    subtitle: "Cylinder head gasket set",
    brand: "MAN",
    category: "part",
    status: "available",
    quantity: 8,
    oemNumbers: ["L23-30H-GSK-1440"],
  },
  {
    sku: "DR-0685",
    title: "Caterpillar C32",
    subtitle: "Fuel injector, remanufactured",
    brand: "Caterpillar",
    category: "part",
    status: "available",
    quantity: 5,
    oemNumbers: ["C32-INJ-0685", "10R-7222"],
  },
  {
    sku: "DR-1078",
    title: "MaK 6M25",
    subtitle: "Exhaust valve, complete",
    brand: "MaK",
    category: "part",
    status: "expected",
    quantity: 3,
    oemNumbers: ["6M25-EV-1078"],
  },
  {
    sku: "DR-0533",
    title: "Deutz BF6M1015",
    subtitle: "Water pump assembly",
    brand: "Deutz",
    category: "part",
    status: "available",
    quantity: 2,
    oemNumbers: ["BF6M1015-WP-0533"],
  },
  {
    sku: "DR-1000",
    title: "Wärtsilä W32 Generator Set",
    subtitle: "9-cylinder, 1,920 kW, 750 RPM",
    brand: "Wärtsilä",
    category: "engine",
    status: "available",
    quantity: 1,
    oemNumbers: ["W32-9L-GENSET"],
  },
  {
    sku: "DR-1041",
    title: "MaK 8M32C",
    subtitle: "8-cylinder in-line, 4,000 kW",
    brand: "MaK",
    category: "engine",
    status: "expected",
    quantity: 1,
    oemNumbers: ["8M32C-COMPLETE"],
  },
  {
    sku: "DR-1063",
    title: "Deutz TBD620 V16",
    subtitle: "16-cylinder V, 5,200 kW",
    brand: "Deutz",
    category: "engine",
    status: "reserved",
    quantity: 1,
    oemNumbers: ["TBD620V16-COMPLETE"],
  },
  {
    sku: "DR-1092",
    title: "Caterpillar 3516C HD",
    subtitle: "16-cylinder V, 2,500 kW",
    brand: "Caterpillar",
    category: "engine",
    status: "available",
    quantity: 2,
    oemNumbers: ["3516C-HD-COMPLETE"],
  },
];

export function brandSlug(name: string): string {
  return BRANDS.find((b) => b.name === name)?.slug ?? name.toLowerCase();
}

export interface StockFilters {
  q?: string;
  brands: string[];
  statuses: string[];
}

export function filterStock(
  listings: StockListing[],
  category: StockCategory,
  filters: StockFilters,
): StockListing[] {
  const q = filters.q?.trim().toLowerCase();

  return listings.filter((item) => {
    if (item.category !== category) return false;

    if (filters.brands.length > 0 && !filters.brands.includes(brandSlug(item.brand))) {
      return false;
    }

    if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) {
      return false;
    }

    if (q) {
      const haystack = [item.sku, item.title, item.subtitle, ...item.oemNumbers]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}
