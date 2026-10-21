import type { Availability, ProductPageData } from "@/db/queries/product";
import type { SiteSettings } from "@/db/queries/settings";
import type { Dimensions } from "@/db/schema";
import { formatNumber, toFaDigits } from "@/lib/format";

/*
 * Product facts as Persian text, shared by the شناسنامه, the specs table and the scale tool so a
 * number reads the same everywhere on the page (and as in the /product/{slug}.md alternate).
 */

/** 9.5 → «۹٫۵», 1200 → «۱٬۲۰۰». */
export function faNumber(value: number): string {
  return formatNumber(value).replace(".", "٫");
}

/** «۴۵ × ۴۵ × ۹۰ سانتی‌متر» (width × depth × height). */
export function dimensionsText(d: Dimensions): string {
  return `${faNumber(d.widthCm)} × ${faNumber(d.depthCm)} × ${faNumber(d.heightCm)} سانتی‌متر`;
}

/** The first clause of a long DB sentence: «تختهٔ چندلایی توس (Birch plywood)، ضخامت ۱۸» → «تختهٔ چندلایی توس (Birch plywood)». */
export function firstClause(text: string | null): string | null {
  const clause = text?.split(/[،؛]/)[0]?.trim();
  return clause || null;
}

export function warrantyText(p: Pick<ProductPageData["product"], "guaranteeText" | "warrantyMonths">): string | null {
  const text = p.guaranteeText?.trim() || (p.warrantyMonths ? `${p.warrantyMonths} ماه ضمانت کارگاه چوبز` : null);
  return text ? toFaDigits(text) : null;
}

const range = (days: [number, number]) =>
  days[0] === days[1] ? toFaDigits(days[0]) : `${toFaDigits(days[0])} تا ${toFaDigits(days[1])}`;

/** «زمان آماده‌سازی و ارسال» for one availability state ⚑ (shipping days come from settings). */
export function leadTimeText(
  availability: Availability,
  leadTimeDays: number | null,
  policy: SiteSettings["shippingPolicy"],
): string {
  switch (availability) {
    case "made_to_order":
      return leadTimeDays ? `ساخت پس از سفارش؛ حدود ${toFaDigits(leadTimeDays)} روز کاری` : "ساخت پس از سفارش";
    case "preorder":
      return "پیش‌سفارش؛ زمان ارسال پس از سفارش اعلام می‌شود";
    case "out_of_stock":
      return "فعلاً تموم شده";
    case "in_stock": {
      const parts = [
        policy?.handlingDays ? `آماده‌سازی ${range(policy.handlingDays)} روز` : null,
        policy?.transitDays ? `ارسال ${range(policy.transitDays)} روز کاری` : null,
      ].filter(Boolean);
      return parts.length ? `موجود؛ ${parts.join("، ")}` : "موجود";
    }
  }
}

/** Platform levels and the like: «۳۰، ۳۸ یا ۴۶». */
export function listOr(values: number[]): string {
  const items = values.map(faNumber);
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join("، ")} یا ${items[items.length - 1]}`;
}
