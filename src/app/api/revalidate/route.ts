import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";

/*
 * POST /api/revalidate  { "tags": ["site"] }  with  Authorization: Bearer $REVALIDATE_SECRET
 * Used by scripts/postdeploy.ts after every container start (TECH.md §2.9) and by webhooks.
 */
function authorized(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function POST(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { tags?: string[] };
  const tags = body.tags?.length ? body.tags : ["site"];
  for (const t of tags) revalidateTag(t, { expire: 0 });
  return Response.json({ revalidated: tags });
}
