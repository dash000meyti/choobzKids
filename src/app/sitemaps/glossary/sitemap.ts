import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/db/queries/seo";

/** /sitemaps/glossary/sitemap.xml — `/glossary/{term}` for terms that pass the quality gate (DESIGN.md §7.4). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries("glossary");
}
