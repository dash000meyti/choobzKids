import "server-only";
import path from "node:path";

/** Public origin. Read at build for prerendered pages — build arg and runtime env must match. */
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
// turbopackIgnore keeps the file tracer from treating runtime data paths as build inputs.
export const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "data/uploads");
export const IS_PRODUCTION_CONTENT = process.env.CHOOBZ_ENV === "production";
