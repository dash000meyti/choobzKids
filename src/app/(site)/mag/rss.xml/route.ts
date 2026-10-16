import { getMagRssXml } from "@/db/queries/seo";

/** /mag/rss.xml — RSS 2.0 with full content and an attribution footer (SEO.md §7.6). */
export async function GET() {
  return new Response(await getMagRssXml(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, max-age=1800",
    },
  });
}
