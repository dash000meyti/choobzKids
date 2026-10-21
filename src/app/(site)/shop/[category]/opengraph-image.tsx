import { notFound } from "next/navigation";
import { getCategoryPage } from "@/db/queries/shop";
import { CATEGORY_RENDER } from "@/components/studio/CategoryStrip";
import { tag } from "@/lib/cache-tags";
import { OG_SIZE, ogResponse } from "@/lib/og";

/*
 * Share card of a category page: the category's plain name under «فروشگاه چوبز کیدز».
 * Rendered once per category and cached with the categories (renderOgPng is 'use cache').
 */

export const alt = "دسته‌ای از فروشگاه چوبز کیدز: وسایل و اسباب‌بازی چوبی کودک، ساخت کارگاه چوبز";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const page = await getCategoryPage(slug);
  if (!page) notFound();
  return ogResponse(page.category.name, "فروشگاه چوبز کیدز", [tag.categories], CATEGORY_RENDER[slug]);
}
