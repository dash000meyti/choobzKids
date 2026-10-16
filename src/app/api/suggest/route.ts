import { connection, type NextRequest } from "next/server";
import { cleanQuery, search, type SuggestResponse } from "@/db/queries/search";

/*
 * GET /api/suggest?q=…[&limit=1–8] — live suggestions for the header search (DESIGN.md §4.4).
 * Grouped like /search, at most 8 per group. Request-time (FTS5 on the local SQLite file).
 */

const MAX_PER_GROUP = 8;
const DEFAULT_PER_GROUP = 5;
/** Shorter queries match nearly everything and are not worth a round trip. */
const MIN_QUERY_LENGTH = 2;

export async function GET(request: NextRequest) {
  await connection();
  const params = request.nextUrl.searchParams;
  const query = cleanQuery(params.get("q"));
  const requested = Number.parseInt(params.get("limit") ?? "", 10);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), MAX_PER_GROUP) : DEFAULT_PER_GROUP;

  const body: SuggestResponse =
    query.length >= MIN_QUERY_LENGTH ? search(query, limit) : { query, total: 0, products: [], guides: [], terms: [] };

  return Response.json(body, {
    headers: {
      // Same answer for everyone; a short shared cache absorbs keystroke bursts.
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
