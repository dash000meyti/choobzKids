/* npm run db:migrate — dev via tsx; in Docker as the esbuild bundle .scripts/migrate.mjs */
import { openDatabase, resolveDatabasePath } from "../src/db/open";
import { runMigrations } from "../src/db/migrate";

const file = resolveDatabasePath();
const db = openDatabase(file, { create: true });
runMigrations(db);
db.$client.close();
console.log("[migrate] ok", file);
