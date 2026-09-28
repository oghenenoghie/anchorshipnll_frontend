import { headers } from "next/headers";

// A small in-memory fixed-window limiter for public form submissions. The app
// runs as a single Railway instance, so per-process state is enough to slow a
// script down; it resets on deploy, which is acceptable for spam control.
const windows = new Map<string, { start: number; count: number }>();

export function clientIp(): string {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export function rateLimited(bucket: string, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const id = `${bucket}:${key}`;
  const entry = windows.get(id);
  if (!entry || now - entry.start > windowMs) {
    windows.set(id, { start: now, count: 1 });
    if (windows.size > 10_000) {
      windows.forEach((v, k) => {
        if (now - v.start > windowMs) windows.delete(k);
      });
    }
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
