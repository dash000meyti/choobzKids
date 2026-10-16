import { getSitemapIndex } from "@/db/queries/seo";
import { absoluteUrl } from "@/lib/seo";

/*
 * Sitemap index. Next has no index convention, and a folder named `sitemap.xml` would collide
 * with its metadata-route detection, so /sitemap.xml is rewritten here (next.config.ts) — SEO.md §7.1.
 * Static: the only data read is a cached query.
 */
export async function GET() {
  const children = (await getSitemapIndex())
    .map(({ type, lastModified }) => {
      const lastmod = lastModified ? `<lastmod>${lastModified}</lastmod>` : "";
      return `<sitemap><loc>${absoluteUrl(`/sitemaps/${type}/sitemap.xml`)}</loc>${lastmod}</sitemap>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${children}\n</sitemapindex>\n`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
