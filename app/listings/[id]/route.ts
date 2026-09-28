import { NextResponse } from "next/server";
import { findVesselHref } from "@/lib/db/vessels";

export const dynamic = "force-dynamic";

// Old-style /listings/<number> and /listings/<slug> links: a real 308 to the
// vessel's canonical /vessels/… address (a route handler rather than a page,
// so the status isn't lost to the streamed loading state).
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const href = await findVesselHref(decodeURIComponent(params.id));
  if (!href) return NextResponse.redirect(new URL("/vessels", request.url), 307);
  return NextResponse.redirect(new URL(href, request.url), 308);
}
