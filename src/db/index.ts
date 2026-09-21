import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | undefined;

// Lazily create the client on first real use, not at import time. Next.js
// imports every route module during the build's "collecting page data" step
// just to inspect its config, even for routes that never run at build time
// (e.g. /api/files/[id]) — throwing here eagerly would fail the build
// before DATABASE_URL is ever actually needed.
function getDb(): Db {
  if (!cached) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    const sql = neon(process.env.DATABASE_URL);
    cached = drizzle(sql, { schema });
  }
  return cached;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
