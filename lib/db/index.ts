import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

let cached: Db | undefined;

// Lazily constructs the client on first real use. Next.js loads every route
// module while bundling at build time, including ones with no DB traffic at
// all (e.g. CI's `next build`, which has no DATABASE_URL) — throwing here
// eagerly at import time would break that build. Only an actual query does.
export function getDb(): Db {
  if (cached) return cached;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — see .env.example");
  }

  const sql = neon(process.env.DATABASE_URL);
  cached = drizzle(sql, { schema });
  return cached;
}
