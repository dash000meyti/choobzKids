import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { DB } from "./open";

/** Applies pending Drizzle migrations (idempotent; keeps __drizzle_migrations). */
export function runMigrations(db: DB) {
  const folder = path.resolve(/* turbopackIgnore: true */ process.env.MIGRATIONS_DIR ?? "drizzle");
  migrate(db, { migrationsFolder: folder });
}
