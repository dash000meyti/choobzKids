/* node /app/scripts/backup.mjs — online SQLite backup into /data/backups (run from host cron). */
import fs from "node:fs";
import path from "node:path";
import { openDatabase, resolveDatabasePath } from "../src/db/open";

const file = resolveDatabasePath();
const dir = path.resolve(process.env.BACKUP_DIR ?? path.join(path.dirname(file), "backups"));
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const target = path.join(dir, `choobz-${stamp}.db`);
const db = openDatabase(file);
await db.$client.backup(target);
db.$client.pragma("optimize");
db.$client.close();
console.log("[backup] wrote", target);
