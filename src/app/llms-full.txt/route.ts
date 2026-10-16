import { getLlmsFullTxt } from "@/db/queries/seo";

/** /llms-full.txt: policies, products, pillar guides, glossary and brand pages in Markdown (SEO.md §5.5). */
export async function GET() {
  return new Response(await getLlmsFullTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
