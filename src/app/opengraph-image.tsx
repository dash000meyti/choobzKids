import { ogResponse } from "@/lib/og";

/*
 * Site-wide default share card (inherited by every route without its own opengraph-image).
 * The home H1's display line (DESIGN.md §5.1) under a one-line form of its kicker; the alt
 * keeps the kicker's full wording.
 * Prerendered at build: renderOgPng is a 'use cache' function with static arguments.
 */

const KICKER = "وسایل چوبی مونته‌سوری، ساخت کارگاه چوبز";
const TITLE = "یه دنیای چوبی، برای بچه‌های سرزمینمون";

export const alt = "چوبز کیدز: اسباب‌بازی و وسایل چوبی مونته‌سوری، ساخت کارگاه چوبز";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogResponse(TITLE, KICKER, []);
}
