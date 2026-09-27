import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { getDrawingBySlug, type ResolvedHotspot } from "@/lib/db/queries";

const SLUG = "wartsila-w32-cylinder-head";
const STEP_MS = 280;

let prepared: Promise<string> | undefined;

// Marks up the bundled drawing for the hero's one orchestrated moment:
// outline shapes get pathLength=1 so CSS can draw them in with
// stroke-dashoffset, part by part (each "<!-- NN" comment starts a part);
// leader lines and filled details fade in after. All animation lives in
// globals.css under .hero-drawing and is switched off for reduced motion.
function prepareSvg(): Promise<string> {
  prepared ??= readFile(path.join(process.cwd(), "public/drawings", `${SLUG}.svg`), "utf8").then((svg) => {
    let part = 0;
    return svg
      .replace(/<title[^>]*>[\s\S]*?<\/title>/, "")
      .replace(/ role="img" aria-labelledby="title"/, ' aria-hidden="true" focusable="false"')
      .replace(/<!-- (\d\d)|<(path|rect|circle|line|ellipse)\b([^>]*?)(\/?)>/g, (match, partNo, tag, attrs, selfClose) => {
        if (partNo) {
          part = Number(partNo);
          return match;
        }
        if (/width="1200"/.test(attrs)) return match; // the paper sheet itself
        const delay = `style="animation-delay:${part * STEP_MS}ms"`;
        const faded = /stroke-dasharray|fill="#2E6E9E"/.test(attrs) || part === 0;
        const extra = faded ? ` data-fade ${delay.replace(/(\d+)ms/, (_, ms) => `${Number(ms) + 900}ms`)}` : ` pathLength="1" data-draw ${delay}`;
        return `<${tag}${attrs}${extra}${selfClose}>`;
      });
  });
  return prepared;
}

export async function HeroDrawing() {
  const svg = await prepareSvg();
  let hotspots: ResolvedHotspot[] = [];
  try {
    hotspots = (await getDrawingBySlug(SLUG))?.hotspots ?? [];
  } catch {
    // The drawing still shows without its callouts if the database is down.
  }

  return (
    <figure className="hero-drawing">
      <Link
        href={`/drawings/${SLUG}`}
        aria-label="Explore the Wärtsilä W32 cylinder head exploded diagram"
        className="relative block overflow-hidden rounded-md border border-white/10 shadow-[0_24px_60px_-20px_rgb(0_0_0/.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blueprint"
      >
        <div className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        {hotspots.map((h, i) => (
          <span
            key={h.id}
            aria-hidden="true"
            style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%`, animationDelay: `${1400 + i * 120}ms` }}
            className="hero-callout absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-signal bg-paper font-mono text-xs text-signal"
          >
            {h.id}
          </span>
        ))}
      </Link>
      <figcaption className="mt-3 font-body text-sm text-fog">
        Tap into the drawing — every callout leads to the actual part.
      </figcaption>
    </figure>
  );
}
