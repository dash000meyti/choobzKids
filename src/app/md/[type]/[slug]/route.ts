import { getMarkdownAlternate, listMarkdownAlternates, MARKDOWN_TYPES, type MarkdownType } from "@/db/queries/seo";
import { absoluteUrl } from "@/lib/seo";

/*
 * Markdown alternates of articles, glossary terms and products (SEO.md §5.6). Public URLs are
 * /{mag|glossary|product}/{slug}.md, rewritten here by next.config.ts. Never indexed, no canonical;
 * the Link header points back at the HTML page.
 */

export async function generateStaticParams() {
  return listMarkdownAlternates();
}

const isMarkdownType = (value: string): value is MarkdownType => (MARKDOWN_TYPES as readonly string[]).includes(value);

const notFound = () =>
  new Response("Not found\n", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });

export async function GET(_request: Request, { params }: { params: Promise<{ type: string; slug: string }> }) {
  const { type, slug } = await params;
  if (!isMarkdownType(type) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return notFound();
  const markdown = await getMarkdownAlternate(type, slug);
  if (!markdown) return notFound();
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      Link: `<${absoluteUrl(`/${type}/${slug}`)}>; rel="alternate"; type="text/html"`,
    },
  });
}
