import "server-only";
import { openDatabase, type DB } from "./open";

// One connection per process. globalThis survives dev HMR and is shared by every
// server bundle (RSC, route handlers) that imports this module.
const g = globalThis as unknown as { __choobzDb?: DB };
export const db: DB = g.__choobzDb ?? (g.__choobzDb = openDatabase());

export type { DB };
