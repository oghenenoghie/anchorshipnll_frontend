"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

// Shown when a public page fails to render (e.g. the database is briefly
// unreachable). The header and footer stay, and the visitor can retry.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex max-w-7xl flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
      <p className="font-mono text-data data-num text-fog">Error{error.digest ? ` · ${error.digest}` : ""}</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">Something went wrong loading this page.</h1>
      <p className="mt-3 max-w-md font-body text-steel">
        It&apos;s usually temporary — try again in a moment. If you&apos;re after a specific part, send us the part
        number and we&apos;ll come back to you directly.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Button type="button" variant="primary" onClick={reset}>
          Try again
        </Button>
        <Link href="/rfq" className={buttonVariants({ variant: "secondary" })}>
          Send an enquiry
        </Link>
      </div>
    </section>
  );
}
