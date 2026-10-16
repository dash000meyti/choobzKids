import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/db/queries/seo";

/** /sitemaps/mag/sitemap.xml — Topic hubs with articles, then every article with its cover original (`<image:image>`). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries("mag");
}
