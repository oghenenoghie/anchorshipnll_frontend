import Link from "next/link";

const NAV_LINKS = [
  { href: "/parts", label: "Parts" },
  { href: "/engines", label: "Engines" },
  { href: "/sell-to-us", label: "Sell to us" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-hull">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-lg font-extrabold tracking-tight text-paper">
          ANCHORSHIP<span className="text-blueprint">NL</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm font-medium text-fog transition-colors hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form action="/parts" className="hidden items-center md:flex">
          <label htmlFor="part-search" className="sr-only">
            Search part number
          </label>
          <input
            id="part-search"
            name="q"
            type="search"
            placeholder="Search part number…"
            className="w-56 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-sm text-paper placeholder:text-fog focus:outline-none focus-visible:ring-2 focus-visible:ring-blueprint"
          />
        </form>
      </div>
    </header>
  );
}
