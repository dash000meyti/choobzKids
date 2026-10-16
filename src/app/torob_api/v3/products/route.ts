import type { NextRequest } from "next/server";
import { listTorobSources } from "@/db/queries/seo";
import { torobProduct, verifyTorobToken, type TorobApiProduct, type TorobApiSource } from "@/lib/torob";

/*
 * Torob Product API v3 (SEO.md §6.1, github.com/torob/Torob-Sync product_api_v3.md).
 * POST only, JWT-authenticated, so it is always dynamic; product data comes from the same cached
 * query family as the pages, so prices agree with the HTML, the meta tags and the JSON-LD.
 */

const PAGE_SIZE = 100;
const MAX_LOOKUP = 1000;
const DATE_SORTS = ["date_added_desc", "date_updated_desc"] as const;

type Query =
  | { kind: "urls"; urls: string[] }
  | { kind: "uniques"; uniques: string[] }
  | { kind: "page"; page: number; sort: (typeof DATE_SORTS)[number] }
  | { kind: "cursor"; afterId: number | null };

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
const error = (message: string, status = 400) => json({ error: message }, status);

const isStringList = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length > 0 && v.length <= MAX_LOOKUP && v.every((s) => typeof s === "string" && s.length > 0);

// Cursors are opaque to Torob: base64url of the last product id on the previous page.
const encodeCursor = (id: number) => Buffer.from(String(id)).toString("base64url");
function decodeCursor(cursor: string): number | null {
  const id = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Exactly one of the documented request shapes; anything else is a 400 (no defaults). */
function parseQuery(body: unknown): Query | string {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "request body must be a JSON object";
  const b = body as Record<string, unknown>;
  const keys = Object.keys(b).sort().join(",");
  switch (keys) {
    case "page_urls":
      return isStringList(b.page_urls) ? { kind: "urls", urls: b.page_urls } : "page_urls must be a non-empty list of URLs";
    case "page_uniques":
      return isStringList(b.page_uniques)
        ? { kind: "uniques", uniques: b.page_uniques }
        : "page_uniques must be a non-empty list of strings";
    case "page,sort": {
      const sort = DATE_SORTS.find((s) => s === b.sort);
      if (!sort) return "sort must be date_added_desc or date_updated_desc when page is given";
      return Number.isSafeInteger(b.page) && (b.page as number) >= 1
        ? { kind: "page", page: b.page as number, sort }
        : "page must be a positive integer";
    }
    case "sort":
      return b.sort === "product_id_desc" ? { kind: "cursor", afterId: null } : "sort without page must be product_id_desc";
    case "cursor,sort": {
      if (b.sort !== "product_id_desc") return "cursor requires sort product_id_desc";
      const afterId = typeof b.cursor === "string" ? decodeCursor(b.cursor) : null;
      return afterId ? { kind: "cursor", afterId } : "invalid cursor";
    }
    default:
      return "send exactly one of: page_urls, page_uniques, page+sort, sort, cursor+sort";
  }
}

/** `https://choobz.kids/product/learning-tower/?utm=…` → "learning-tower" (host is not trusted for matching). */
function productSlugFromUrl(raw: string): string | null {
  try {
    const path = new URL(raw).pathname.replace(/\/+$/, "").toLowerCase();
    return path.match(/^\/product\/([a-z0-9-]+)$/)?.[1] ?? null;
  } catch {
    return null;
  }
}

function respond(
  products: TorobApiProduct[],
  page: { current: number; total: number; nextCursor?: string | null },
) {
  return json({
    api_version: "torob_api_v3",
    current_page: page.current,
    total: page.total,
    max_pages: Math.max(1, Math.ceil(page.total / PAGE_SIZE)),
    next_cursor: page.nextCursor ?? null,
    products,
  });
}

function lookup(all: TorobApiSource[], query: Extract<Query, { kind: "urls" | "uniques" }>) {
  const wanted =
    query.kind === "urls"
      ? new Set(query.urls.map(productSlugFromUrl).filter((s): s is string => !!s))
      : new Set(query.uniques);
  const found = all.filter((p) => (query.kind === "urls" ? wanted.has(p.slug) : wanted.has(String(p.id))));
  return respond(found.map(torobProduct), { current: 1, total: found.length });
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-torob-token");
  const version = request.headers.get("x-torob-token-version");
  const host = request.headers.get("host") ?? "";
  if (!token || version !== "1" || !verifyTorobToken(token, host, Math.floor(Date.now() / 1000))) {
    return error("unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("request body must be valid JSON");
  }
  const query = parseQuery(body);
  if (typeof query === "string") return error(query);

  const all = await listTorobSources(); // newest product id first
  if (query.kind === "urls" || query.kind === "uniques") return lookup(all, query);

  if (query.kind === "page") {
    const key =
      query.sort === "date_added_desc"
        ? (p: TorobApiSource) => p.publishedAt ?? p.updatedAt
        : (p: TorobApiSource) => p.updatedAt;
    const sorted = [...all].sort((a, b) => key(b).localeCompare(key(a)) || b.id - a.id);
    const start = (query.page - 1) * PAGE_SIZE;
    return respond(sorted.slice(start, start + PAGE_SIZE).map(torobProduct), { current: query.page, total: all.length });
  }

  const start = query.afterId === null ? 0 : all.findIndex((p) => p.id < query.afterId!);
  const slice = start < 0 ? [] : all.slice(start, start + PAGE_SIZE);
  const hasMore = start >= 0 && start + PAGE_SIZE < all.length;
  return respond(slice.map(torobProduct), {
    current: start < 0 ? Math.max(1, Math.ceil(all.length / PAGE_SIZE)) : Math.floor(start / PAGE_SIZE) + 1,
    total: all.length,
    nextCursor: hasMore ? encodeCursor(slice[slice.length - 1].id) : null,
  });
}
