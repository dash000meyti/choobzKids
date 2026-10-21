import { notFound } from "next/navigation";
import { getProductPage } from "@/db/queries/product";
import { tag } from "@/lib/cache-tags";
import { ogResponse, OG_SIZE } from "@/lib/og";

/*
 * Share card of a product page: the product name under its category, beside the product's own
 * studio render. Cached with the product tags, so a renamed product gets a fresh card.
 */

export const alt = "کارت اشتراک محصول چوبز کیدز: نام محصول کنار تصویر استودیویی آن";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProductPage(slug);
  if (!data) notFound();
  return ogResponse(data.product.name, data.category.name, [tag.products, tag.product(data.product.id)], data.product.illustration ?? data.product.slug);
}
