import { getLlmsTxt } from "@/db/queries/seo";

/** /llms.txt (llmstxt.org format, SEO.md §5.4). Static; regenerated when content is revalidated. */
export async function GET() {
  return new Response(await getLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
