import { cn } from "@/lib/utils";

// Loading placeholders shaped like the pages they stand in for, so content
// doesn't jump when it arrives. Pulse is disabled under reduced motion.
function Block({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-steel/10 motion-safe:animate-pulse", className)} />;
}

export function CatalogSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading listings…</span>
      <section className="border-b border-border bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Block className="h-3 w-20" />
          <Block className="mt-3 h-9 w-64" />
          <Block className="mt-4 h-4 w-full max-w-xl" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="hidden space-y-3 lg:block">
            {Array.from({ length: 6 }, (_, i) => (
              <Block key={i} className="h-5 w-3/4" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-3 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rounded-md border border-border p-4">
                <Block className="aspect-[4/3] w-full" />
                <Block className="mt-4 h-4 w-2/3" />
                <Block className="mt-2 h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <section className="border-b border-border bg-surface-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Block className="h-3 w-48" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <Block className="aspect-square w-full" />
          <div>
            <Block className="h-3 w-24" />
            <Block className="mt-3 h-9 w-3/4" />
            <Block className="mt-3 h-5 w-1/2" />
            <Block className="mt-8 h-24 w-full max-w-md" />
            <Block className="mt-8 h-40 w-full" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <span className="sr-only">Loading…</span>
      <Block className="h-8 w-56" />
      <Block className="mt-6 h-64 w-full" />
    </div>
  );
}
