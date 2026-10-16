import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/db/queries/seo";

/** /sitemaps/products/sitemap.xml — `/product/{slug}` with the original gallery images (`<image:image>`). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries("products");
}
