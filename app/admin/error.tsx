"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-mono text-data data-num text-fog">Error{error.digest ? ` · ${error.digest}` : ""}</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">This admin page failed to load.</h1>
      <p className="mt-3 font-body text-steel">
        Nothing was saved by the failed request. Try again; if it keeps failing, the server logs on Railway will show
        the error{error.digest ? " with the code above" : ""}.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Button type="button" variant="primary" onClick={reset}>
          Try again
        </Button>
        <Link href="/admin" className={buttonVariants({ variant: "secondary" })}>
          Admin home
        </Link>
      </div>
    </section>
  );
}
