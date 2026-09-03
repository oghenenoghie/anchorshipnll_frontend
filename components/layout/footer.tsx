import Link from "next/link";

const COLUMNS = [
  {
    heading: "Catalog",
    links: [
      { href: "/parts", label: "Spare parts" },
      { href: "/engines", label: "Complete engines" },
      { href: "/parts?brand=wartsila", label: "Wärtsilä" },
      { href: "/parts?brand=man", label: "MAN" },
    ],
  },
  {
    heading: "Trade",
    links: [
      { href: "/sell-to-us", label: "Sell to us" },
      { href: "/rfq", label: "Request a quote" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-hull">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-lg font-extrabold tracking-tight text-paper">
              ANCHORSHIP<span className="text-blueprint">NL</span>
            </span>
            <p className="mt-3 max-w-xs font-body text-sm text-fog">
              Marine diesel engines and spare parts, precisely catalogued.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="font-body text-label font-medium uppercase text-fog">
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-paper/80 transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 font-mono text-xs text-fog">
          © {new Date().getFullYear()} AnchorShip NL. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
