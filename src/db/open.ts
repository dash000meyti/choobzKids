import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

/*
 * Connection factory shared by the server singleton (src/db/client.ts) and CLI scripts.
 * Must NOT import `server-only` (scripts run under tsx / plain Node — TECH.md gotcha 13).
 */

export type DB = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

export function resolveDatabasePath(): string {
  return path.resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH ?? "data/choobz.db");
}

export function openDatabase(
  file = resolveDatabasePath(),
  { create = false, readonly = false }: { create?: boolean; readonly?: boolean } = {},
): DB {
  if (create) fs.mkdirSync(path.dirname(file), { recursive: true });
  // Migrations create the file; at runtime a missing DB should fail loudly (TECH.md §7.1).
  const sqlite = new Database(file, { fileMustExist: !create, readonly });
  if (!readonly) {
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("synchronous = NORMAL");
  }
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("cache_size = -16000");
  sqlite.pragma("temp_store = MEMORY");
  return drizzle({ client: sqlite, schema, casing: "snake_case" }) as DB;
}
