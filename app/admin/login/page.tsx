import type { Metadata } from "next";
import { login } from "./actions";
import { Field, inputClass } from "@/components/ui/form-field";
import { FormStatusBanner } from "@/components/ui/form-status";
import { buttonVariants } from "@/components/ui/button";
import { firstParam, type SearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin sign in",
};

export const dynamic = "force-dynamic";

export default function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const hasError = firstParam(searchParams, "error") === "1";
  const next = firstParam(searchParams, "next");

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16 sm:px-6">
      <p className="font-body text-label font-medium uppercase text-blueprint">AnchorShip NL</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">Admin sign in</h1>

      <div className="mt-8">
        {hasError && <FormStatusBanner status="error" message="Incorrect email or password." />}

        <form action={login} className="space-y-6">
          <input type="hidden" name="next" value={next} />

          <Field label="Email" htmlFor="email" required>
            <input id="email" name="email" type="email" required autoComplete="username" className={inputClass()} />
          </Field>

          <Field label="Password" htmlFor="password" required>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass()}
            />
          </Field>

          <button type="submit" className={cn(buttonVariants({ variant: "primary" }), "w-full")}>
            Sign in
          </button>
        </form>
      </div>
    </section>
  );
}
