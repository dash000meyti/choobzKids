import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/db/queries/seo";

/** /sitemaps/pages/sitemap.xml — Home, shop/mag/age/glossary hubs, FAQ, the `pages` table (trust, legal, brand) and the team. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries("pages");
}
