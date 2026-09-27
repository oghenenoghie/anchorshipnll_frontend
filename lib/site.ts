// The public origin used for absolute URLs in metadata, the sitemap and
// robots.txt. SITE_URL wins (set it once a custom domain is live); on
// Railway the generated domain is used automatically.
export function siteUrl(): string {
  const configured = process.env.SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return "http://localhost:3000";
}

// Relative paths (e.g. bundled /drawings/*.svg) become absolute; full URLs
// (object-storage photos) pass through.
export function absoluteUrl(pathOrUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${siteUrl()}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}
