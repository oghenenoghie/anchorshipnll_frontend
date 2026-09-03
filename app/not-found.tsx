import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
      <p className="font-mono text-data data-num text-fog">404</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">
        We couldn&apos;t find that listing.
      </h1>
      <p className="mt-3 max-w-md font-body text-steel">
        The part number or page you&apos;re looking for may have sold, moved, or never existed.
        Try searching by OEM part number, or browse the catalog.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/parts" className={buttonVariants({ variant: "primary" })}>
          Browse parts
        </Link>
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
