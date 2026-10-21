import type { SiteSettings } from "@/db/queries/settings";
import { StockBadge } from "@/components/ui/StockBadge";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Offer } from "./product-offers";
import { VariantSwap } from "./VariantPicker";

/*
 * Availability line (DESIGN.md §6.3 block 9, §11.2 #9–10): dot + words, never colour alone.
 *   in stock       «موجود · ارسال ۲ تا ۵ روز کاری» (shipping days from settings ⚑)
 *   made to order  «ساخته می‌شه برای شما — آماده در ۱۴ روز کاری»
 *   pre-order      «پیش‌سفارش»
 *   sold out       «فعلاً تموم شده · توی بله بپرس کی آماده می‌شه»
 * One copy per variant only when the variants' availability differs.
 */

type AvailabilityLineProps = {
  offers: Offer[];
  leadTimeDays: number | null;
  shippingPolicy: SiteSettings["shippingPolicy"];
  className?: string;
};

function transitText(policy: SiteSettings["shippingPolicy"]): string | null {
  const days = policy?.transitDays;
  if (!days) return null;
  return days[0] === days[1]
    ? `ارسال ${toFaDigits(days[0])} روز کاری`
    : `ارسال ${toFaDigits(days[0])} تا ${toFaDigits(days[1])} روز کاری`;
}

export function AvailabilityLine({ offers, leadTimeDays, shippingPolicy, className }: AvailabilityLineProps) {
  const transit = transitText(shippingPolicy);
  return (
    <VariantSwap offers={offers} differsBy={(offer) => offer.availability} className={className}>
      {(offer) => (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <StockBadge availability={offer.availability} leadTimeDays={leadTimeDays} variant="long" />
          {offer.availability === "in_stock" && transit ? (
            <>
              <span aria-hidden="true" className="text-line-strong">
                ·
              </span>
              <span className="font-semibold text-ink">{transit}</span>
            </>
          ) : null}
        </p>
      )}
    </VariantSwap>
  );
}
