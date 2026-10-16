/*
 * npm run db:seed [-- --force]
 * Seed-if-empty (or --force to wipe content tables and re-seed), then copy seed media into
 * UPLOAD_DIR without overwriting. Never imports server-only modules (TECH.md gotcha 13).
 */
import fs from "node:fs";
import path from "node:path";
import { openDatabase } from "../src/db/open";
import { isDatabaseEmpty, seedDatabase, wipeContent } from "../src/db/seed/load";

const force = process.argv.includes("--force");
const db = openDatabase();

const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "data/uploads");
const seedMedia = path.resolve(process.env.SEED_MEDIA_DIR ?? "seed/uploads");
fs.mkdirSync(uploadDir, { recursive: true });
if (fs.existsSync(seedMedia)) {
  fs.cpSync(seedMedia, uploadDir, { recursive: true, force: false, errorOnExist: false });
}

if (!isDatabaseEmpty(db) && !force) {
  console.log("[seed] skip: database already has content");
} else {
  if (force) wipeContent(db);
  seedDatabase(db, { log: (m) => console.log(`[seed] ${m}`) });
}
db.$client.close();
