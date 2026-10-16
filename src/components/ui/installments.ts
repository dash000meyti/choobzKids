import type { SiteSettings } from "@/db/queries/settings";
import { installments } from "@/lib/format";

/*
 * SnappPay eligibility (SEO.md §6.4): installment UI renders only when settings.snapppay is set,
 * enabled, and the price is inside the merchant's eligible range ⚑. Every installment surface
 * (badge, line, wheels) goes through this so they can never disagree.
 */

export type SnappPaySettings = SiteSettings["snapppay"];

export type InstallmentPlan = {
  /** Number of payments (4 in Phase 1). */
  count: number;
  /** Each payment in Toman, rounded up to 1,000 (src/lib/format.ts). */
  amount: number;
};

export function installmentPlan(price: number, snapppay: SnappPaySettings): InstallmentPlan | null {
  if (!snapppay?.enabled || price <= 0) return null;
  if (snapppay.minToman != null && price < snapppay.minToman) return null;
  if (snapppay.maxToman != null && price > snapppay.maxToman) return null;
  const count = snapppay.count > 0 ? snapppay.count : 4;
  return { count, amount: installments(price, count) };
}

export const INSTALLMENTS_HREF = "/installments";
