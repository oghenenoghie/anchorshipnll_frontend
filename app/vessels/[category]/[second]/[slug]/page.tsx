import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { VesselDetail } from "@/components/vessels/vessel-detail";
import { getVesselBySlug } from "@/lib/db/vessels";
import type { SearchParams } from "@/lib/search-params";
import { vesselMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: { category: string; second: string; slug: string }; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vessel = await getVesselBySlug(params.slug);
  return vessel ? vesselMetadata(vessel) : { title: "Vessel not found" };
}

export default async function VesselPage({ params, searchParams }: Props) {
  const vessel = await getVesselBySlug(params.slug);
  if (!vessel) notFound();
  // A vessel moved to another category keeps working at its old address.
  const requested = `/vessels/${params.category}/${params.second}/${params.slug}`;
  if (vessel.href !== requested) permanentRedirect(vessel.href);
  return <VesselDetail vessel={vessel} searchParams={searchParams} />;
}
