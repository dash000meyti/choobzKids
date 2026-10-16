import { createReadStream, type Stats } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { UPLOAD_DIR } from "@/lib/env";

/*
 * Streams uploads from the Docker volume (UPLOAD_DIR). Upload names are content-addressed
 * and never overwritten, so responses are immutable. next/image optimises these URLs through
 * images.localPatterns. Supports Range (Safari needs 206 for MP4) and If-None-Match.
 */

const TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

const notFound = () => new Response("Not found", { status: 404 });
const body = (file: string, opts?: { start: number; end: number }) =>
  Readable.toWeb(createReadStream(file, opts)) as ReadableStream;

export async function GET(req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params; // already decoded by Next — never decode twice
  if (parts.some((p) => p === ".." || p.includes("\0"))) return notFound();
  const file = path.resolve(UPLOAD_DIR, ...parts);
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return notFound();
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return notFound();

  let s: Stats;
  try {
    s = await stat(file);
  } catch {
    return notFound();
  }
  if (!s.isFile()) return notFound();

  const etag = `"${s.size.toString(36)}-${Math.floor(s.mtimeMs).toString(36)}"`;
  const headers = new Headers({
    "Content-Type": type,
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
    "Last-Modified": s.mtime.toUTCString(),
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  });
  if (type === "image/svg+xml") {
    headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });

  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (m && (m[1] || m[2])) {
    const start = m[1] ? Number(m[1]) : Math.max(0, s.size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), s.size - 1) : s.size - 1;
    if (start > end || start >= s.size) {
      headers.set("Content-Range", `bytes */${s.size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${s.size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(body(file, { start, end }), { status: 206, headers });
  }
  headers.set("Content-Length", String(s.size));
  return new Response(body(file), { headers });
}
