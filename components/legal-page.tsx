import type { ReactNode } from "react";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

export function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-body text-label font-medium uppercase text-blueprint">{eyebrow}</p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">{title}</h1>
      <p className="mt-3 font-mono text-xs data-num text-fog">Last updated {lastUpdated}</p>

      {intro && <p className="mt-6 max-w-2xl font-body leading-relaxed text-steel">{intro}</p>}

      <div className="mt-10 divide-y divide-border border-t border-border">
        {sections.map((section, index) => (
          <div key={section.heading} className="py-8 first:pt-8">
            <h2 className="flex items-baseline gap-3 font-display text-xl font-bold text-hull">
              <span className="font-mono text-sm font-normal text-fog">
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.heading}
            </h2>
            <div className="mt-3 max-w-2xl space-y-3 font-body leading-relaxed text-steel">
              {section.body}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
