import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

const clients = new Map<string, Db>();

// Lazily constructs a client on first real use. Next.js loads every route
// module while bundling at build time, including ones with no DB traffic at
// all (e.g. CI's `next build`, which has no DATABASE_URL) — throwing here
// eagerly at import time would break that build. Only an actual query does.
function connect(url: string): Db {
  let db = clients.get(url);
  if (!db) {
    // The driver sends each query as a fetch() request, and Next.js 14 keeps
    // fetch responses in its data cache even on force-dynamic pages — so
    // without no-store a page kept showing old rows until that exact path was
    // revalidated. Queries must always read the live database.
    db = drizzle(neon(url, { fetchOptions: { cache: "no-store" } }), { schema });
    clients.set(url, db);
  }
  return db;
}

// The owner connection: admin reads and every write except public enquiry
// submissions.
export function getDb(): Db {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — see .env.example");
  }
  return connect(process.env.DATABASE_URL);
}

// Least-privilege connection for public pages and forms: the web_public role
// (migration 0008) can read listings and drawings and insert enquiries,
// enforced by row-level security, and nothing else. Falls back to the owner
// connection when DATABASE_URL_PUBLIC isn't set (local development).
export function getPublicDb(): Db {
  const url = process.env.DATABASE_URL_PUBLIC || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — see .env.example");
  }
  return connect(url);
}
