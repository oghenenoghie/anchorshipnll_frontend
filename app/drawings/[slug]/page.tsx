import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { ExplodedDrawing } from "@/components/drawings/exploded-drawing";
import { getDrawingBySlug } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const drawing = await getDrawingBySlug(params.slug);
  if (!drawing) return {};
  return {
    title: drawing.title,
    description: `Interactive exploded diagram for ${drawing.title} — tap a callout to view the part.`,
  };
}

export default async function DrawingDetailPage({ params }: { params: { slug: string } }) {
  const drawing = await getDrawingBySlug(params.slug);
  if (!drawing) notFound();

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Exploded diagrams", href: "/drawings" },
          { label: drawing.title },
        ]}
      />

      <p className="mt-6 font-body text-label font-medium uppercase text-blueprint">
        {drawing.brand}
      </p>
      <h1 className="mt-2 font-display text-display-lg font-bold text-hull">{drawing.title}</h1>
      <p className="mt-3 max-w-xl font-body text-steel">
        Tap a numbered callout to see that part&apos;s condition, availability, and pricing.
      </p>

      <div className="mt-8 max-w-3xl">
        <ExplodedDrawing imageUrl={drawing.imageUrl} title={drawing.title} hotspots={drawing.hotspots} />
      </div>
    </section>
  );
}
