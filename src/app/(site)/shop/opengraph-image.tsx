import { ogResponse, OG_SIZE } from "@/lib/og";

/*
 * Share card of /shop. Category pages bring their own (./[category]/opengraph-image.tsx).
 * Static arguments, so it is prerendered at build.
 */

export const alt = "فروشگاه چوبز کیدز: وسایل چوبی مونته‌سوری و پیکلر برای کودک، ساخت کارگاه چوبز";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogResponse("فروشگاه وسایل چوبی کودک", "ویترین کارگاه چوبز", [], "pikler-triangle");
}
