import type { StockListing } from "@/lib/db/queries";

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
export const STATUSES = ["available", "reserved", "expected", "sold"] as const;

export function brandSlug(name: string): string {
  return BRANDS.find((b) => b.name === name)?.slug ?? name.toLowerCase();
}

export function listingHref(item: Pick<StockListing, "sku" | "category">): string {
  const base = item.category === "engine" ? "engines" : "parts";
  return `/${base}/${item.sku.toLowerCase()}`;
}

// Seed data for `npm run db:seed` — the source of truth is the Neon database
// (see lib/db/queries.ts); this only backfills a fresh database with sample
// listings. Not read by the app at runtime.
export const SEED_LISTINGS: StockListing[] = [
  {
    sku: "DR-2231",
    title: "Wärtsilä W32",
    subtitle: "Cylinder head, complete",
    brand: "Wärtsilä",
    category: "part",
    status: "available",
    quantity: 4,
    oemNumbers: ["W32-CH-2231", "851 111"],
    description:
      "Removed from a decommissioned 9L32 generator set, pressure-tested and free of cracks. Valves and guides included.",
    specs: [
      { label: "Weight", value: "86 kg" },
      { label: "Material", value: "Cast iron" },
      { label: "Fits", value: "Wärtsilä 32 / W32 series" },
      { label: "Condition", value: "Pressure-tested" },
    ],
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
    description:
      "Overhauled fuel injection pump, tested to OEM spec on our test bench prior to listing.",
    specs: [
      { label: "Weight", value: "34 kg" },
      { label: "Material", value: "Forged steel" },
      { label: "Fits", value: "MAN B&W S50MC series" },
      { label: "Condition", value: "Overhauled" },
    ],
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
    description:
      "Complete turbocharger assembly, currently in transit from a European teardown; expected within 4–6 weeks.",
    specs: [
      { label: "Weight", value: "112 kg" },
      { label: "Material", value: "Steel / aluminium" },
      { label: "Fits", value: "Caterpillar 3512C / 3512B" },
      { label: "Condition", value: "Expected — inbound" },
    ],
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
    description: "New-surplus piston and connecting rod set, still in original crating.",
    specs: [
      { label: "Weight", value: "48 kg" },
      { label: "Material", value: "Steel" },
      { label: "Fits", value: "MaK M32C series" },
      { label: "Condition", value: "New surplus" },
    ],
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
    description: "Honed to standard bore, reserved pending buyer confirmation.",
    specs: [
      { label: "Weight", value: "62 kg" },
      { label: "Material", value: "Cast iron, honed" },
      { label: "Fits", value: "Deutz TBD620 series" },
      { label: "Condition", value: "Reserved" },
    ],
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
    description: "Reconditioned camshaft, sold to a buyer in Rotterdam — kept here for reference.",
    specs: [
      { label: "Weight", value: "58 kg" },
      { label: "Material", value: "Forged steel" },
      { label: "Fits", value: "Wärtsilä 20 / 6L20" },
      { label: "Condition", value: "Sold" },
    ],
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
    description: "Full gasket set for a complete overhaul, sourced directly from OEM stock.",
    specs: [
      { label: "Weight", value: "6 kg" },
      { label: "Material", value: "Composite / metal" },
      { label: "Fits", value: "MAN L23/30H series" },
      { label: "Condition", value: "New, OEM stock" },
    ],
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
    description: "Remanufactured to Caterpillar tolerances and flow-tested before dispatch.",
    specs: [
      { label: "Weight", value: "3 kg" },
      { label: "Material", value: "Steel" },
      { label: "Fits", value: "Caterpillar C32 / C32 ACERT" },
      { label: "Condition", value: "Remanufactured" },
    ],
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
    description: "Complete exhaust valve assembly, expected into our Rotterdam warehouse shortly.",
    specs: [
      { label: "Weight", value: "9 kg" },
      { label: "Material", value: "Nimonic alloy" },
      { label: "Fits", value: "MaK M25 series" },
      { label: "Condition", value: "Expected — inbound" },
    ],
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
    description: "Water pump assembly removed from a low-hour standby genset.",
    specs: [
      { label: "Weight", value: "14 kg" },
      { label: "Material", value: "Cast iron / bronze" },
      { label: "Fits", value: "Deutz BF6M1015 series" },
      { label: "Condition", value: "Available" },
    ],
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
    description:
      "Complete 9-cylinder generator set, removed from service after a vessel repower. Running hours and survey report available on request.",
    specs: [
      { label: "Cylinders", value: "9L" },
      { label: "Bore", value: "320 mm" },
      { label: "Stroke", value: "350 mm" },
      { label: "RPM", value: "750" },
      { label: "Output", value: "1,920 kW" },
      { label: "Year", value: "2011" },
    ],
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
    description: "Complete 8-cylinder engine expected into our Rotterdam yard; reserve now ahead of arrival.",
    specs: [
      { label: "Cylinders", value: "8L" },
      { label: "Bore", value: "320 mm" },
      { label: "Stroke", value: "480 mm" },
      { label: "RPM", value: "600" },
      { label: "Output", value: "4,000 kW" },
      { label: "Year", value: "2014" },
    ],
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
    description: "Complete V16 engine, currently reserved pending contract signature.",
    specs: [
      { label: "Cylinders", value: "16V" },
      { label: "Bore", value: "230 mm" },
      { label: "Stroke", value: "270 mm" },
      { label: "RPM", value: "1,500" },
      { label: "Output", value: "5,200 kW" },
      { label: "Year", value: "2016" },
    ],
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
    description: "Two complete heavy-duty V16 units, low hours, ex-standby power application.",
    specs: [
      { label: "Cylinders", value: "16V" },
      { label: "Bore", value: "170 mm" },
      { label: "Stroke", value: "190 mm" },
      { label: "RPM", value: "1,600" },
      { label: "Output", value: "2,500 kW" },
      { label: "Year", value: "2018" },
    ],
  },
];
