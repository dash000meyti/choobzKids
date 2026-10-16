import Link from "next/link";
import { EnamadBadge } from "@/components/ui/EnamadBadge";
import { Icon } from "@/components/ui/Icon";
import { InstallmentLine } from "@/components/ui/InstallmentLine";
import { InstallmentWheels } from "@/components/ui/InstallmentWheels";
import { installmentPlan } from "@/components/ui/installments";
import { TabularNumber } from "@/components/ui/TabularNumber";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CartConfig } from "./CartProvider";

/*
 * Cart totals in the money voice (DESIGN.md §4.7, §11.1): subtotal in tabular digits, the
 * SnappPay line with its wheels, a shipping note, and a small trust strip (eNamad, return window
 * ⚑, Bale support). Every part whose setting is missing stays hidden. `schedule` adds the
 * four-payment schedule SnappPay asks to show before checkout (SEO.md §6.4).
 */

type CartSummaryProps = {
  /** Toman, available lines only. */
  subtotal: number;
  count: number;
  config: CartConfig;
  schedule?: boolean;
  className?: string;
};

function ShippingNote({ subtotal, freeOverToman }: { subtotal: number; freeOverToman: number | null }) {
  const free = freeOverToman != null && freeOverToman > 0 && subtotal >= freeOverToman;
  return (
    <p className="flex items-center gap-2 text-xs text-muted">
      <Icon name="truck" className="size-4" />
      {free ? "ارسال این سفارش رایگان است." : "هزینهٔ ارسال هنگام ثبت سفارش اعلام می‌شود."}
    </p>
  );
}

function TrustStrip({ config }: { config: CartConfig }) {
  const { enamad, returnDays, bale } = config;
  if (!enamad && !returnDays && !bale) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-xs text-ink">
      {enamad ? (
        <li className="h-[60px] w-[55px] overflow-hidden">
          {/* The seal keeps its own fixed box; a smaller copy is a scaled view of it. */}
          <div className="h-[92px] w-[85px] origin-top-right scale-[0.65]">
            <EnamadBadge enamad={enamad} />
          </div>
        </li>
      ) : null}
      {returnDays ? (
        <li>
          <Link href="/returns" className="link-mark inline-flex min-h-11 items-center gap-1.5">
            <Icon name="shield-leaf" className="size-4 text-success" />
            {toFaDigits(returnDays)} روز ضمانت بازگشت
          </Link>
        </li>
      ) : null}
      {bale ? (
        <li>
          <a href={bale} target="_blank" rel="noopener" className="link-mark inline-flex min-h-11 items-center gap-1.5">
            <Icon name="bale" className="size-4" />
            پشتیبانی در بله
          </a>
        </li>
      ) : null}
    </ul>
  );
}

export function CartSummary({ subtotal, count, config, schedule, className }: CartSummaryProps) {
  const eligible = installmentPlan(subtotal, config.snapppay) != null;
  return (
    <section aria-label="جمع سبد خرید" className={cn("flex flex-col gap-3", className)}>
      <p className="flex items-baseline justify-between gap-3 text-ink">
        <span className="text-sm font-semibold">
          جمع سبد <span className="font-normal text-muted">({toFaDigits(count)} کالا)</span>
        </span>
        <span className="text-lg font-bold">
          <data value={subtotal}>
            <TabularNumber value={subtotal} />
          </data>{" "}
          <span className="text-sm font-semibold">تومان</span>
        </span>
      </p>
      {eligible && schedule ? <InstallmentWheels total={subtotal} snapppay={config.snapppay} wheelSize={28} /> : null}
      {eligible && !schedule ? (
        <div className="flex items-center gap-2">
          <Icon name="wheels" className="size-5 shrink-0 text-success" />
          <InstallmentLine price={subtotal} snapppay={config.snapppay} />
        </div>
      ) : null}
      <ShippingNote subtotal={subtotal} freeOverToman={config.freeShippingOverToman} />
      <TrustStrip config={config} />
    </section>
  );
}
