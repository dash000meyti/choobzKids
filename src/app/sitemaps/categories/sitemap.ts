import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/db/queries/seo";

/** /sitemaps/categories/sitemap.xml — `/shop/{category}` for every category that holds published products. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries("categories");
}
