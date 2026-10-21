import { notFound } from "next/navigation";
import { getArticle } from "@/db/queries/mag";
import { tag } from "@/lib/cache-tags";
import { ogResponse, OG_SIZE } from "@/lib/og";

/*
 * Share card of an article (TECH.md §4.9): the article title under its topic, set by the
 * sharp/Pango renderer (correct Persian shaping). Cached with the post's tags, so a CMS edit
 * refreshes the card with the page.
 */

export const alt = "کارت اشتراک مقالهٔ مجله چوبز: عنوان مقاله و موضوعش، کنار اردک چوبی تاتی";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getArticle(slug);
  if (!data) notFound();
  return ogResponse(data.post.title, data.topic ? `مجله چوبز · ${data.topic.name}` : "مجله چوبز", [
    tag.posts,
    tag.post(data.post.id),
  ]);
}
