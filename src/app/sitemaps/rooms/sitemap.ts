import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/db/queries/seo";

/** /sitemaps/rooms/sitemap.xml — `/rooms` and every published `/rooms/{preset}`. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries("rooms");
}
