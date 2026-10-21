import type { CSSProperties } from "react";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { InlineScript } from "./InlineScript";
import { installmentPlan, type SnappPaySettings } from "./installments";
import { TabularNumber } from "./TabularNumber";
import styles from "./InstallmentWheels.module.css";

/*
 * Four cart wheels, one per SnappPay installment, each with its amount (tabular digits) and when
 * it is due (DESIGN.md §4.13). The server renders timeless labels («امروز · ماه دوم · …») because
 * it must not read the clock; the inline script right after the list swaps them to Jalali month
 * names before first paint. On client-side navigations the script stays inert and the timeless
 * labels remain, which are still true.
 *
 * Hooks for islands (RoomTotals): each amount is `[data-installment-amount]` (update its `value`
 * and text, e.g. by rendering <TabularNumber> markup), each wheel wrapper `[data-wheel]` accepts
 * `data-spin` for the quarter-turn settle.
 */

type InstallmentWheelsProps = {
  /** Toman. */
  total: number;
  snapppay: SnappPaySettings;
  /** Wheel diameter in px (24–40). */
  wheelSize?: number;
  /** «حدود» when our rounding may differ from SnappPay's schedule ⚑. */
  approximate?: boolean;
  /** Visible caption above the wheels. */
  caption?: string | null;
  finePrint?: boolean;
  className?: string;
};

const ORDINALS = ["دوم", "سوم", "چهارم", "پنجم", "ششم"];

function timelessLabel(index: number) {
  if (index === 0) return "امروز";
  const ordinal = ORDINALS[index - 1];
  return ordinal ? `ماه ${ordinal}` : `ماه ${toFaDigits(index + 1)}م`;
}

/* Each [data-month="i"] becomes the Jalali month name i×30 days from now. */
const MONTH_SCRIPT =
  '!function(){try{var f=new Intl.DateTimeFormat("fa-IR-u-ca-persian",{month:"long"}),n=Date.now();' +
  'document.currentScript.previousElementSibling.querySelectorAll("[data-month]").forEach(function(e){' +
  "e.textContent=f.format(n+e.dataset.month*2592e6)})}catch(e){}}()";

function WheelGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="var(--bg)" stroke="var(--ink)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path
        d="M12 3.6v2.8M12 17.6v2.8M3.6 12h2.8M17.6 12h2.8"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="12" cy="12" r="3.2" fill="var(--thread)" />
    </svg>
  );
}

export function InstallmentWheels({
  total,
  snapppay,
  wheelSize = 32,
  approximate,
  caption,
  finePrint = true,
  className,
}: InstallmentWheelsProps) {
  const plan = installmentPlan(total, snapppay);
  if (!plan) return null;
  const size = Math.min(40, Math.max(24, wheelSize));
  const heading =
    caption === undefined
      ? `پرداخت در ${toFaDigits(plan.count)} قسط با اسنپ‌پی${approximate ? " (مبالغ حدودی)" : ""}`
      : caption;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {heading ? <p className="text-sm font-semibold text-ink">{heading}</p> : null}
      <ol
        // A query container: the amounts scale with the row's width (cqi) so four columns never collide.
        className="@container grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${plan.count}, minmax(0, 1fr))`, "--wheel-size": `${size}px` } as CSSProperties}
      >
        {Array.from({ length: plan.count }, (_, index) => (
          <li key={index} className="flex flex-col items-center gap-1 text-center">
            <span className={styles.wheel} data-wheel="">
              <WheelGlyph />
            </span>
            {/* 3.7cqi keeps a seven-digit amount inside a quarter of the row; 12px floor, text-sm cap. */}
            <span className="text-[length:clamp(0.75rem,3.7cqi,0.9688rem)] leading-snug font-bold whitespace-nowrap text-ink">
              <data value={plan.amount} data-installment-amount="">
                <TabularNumber value={plan.amount} />
              </data>
              <span className="block text-2xs font-semibold text-muted">تومان</span>
            </span>
            <span
              className="text-xs text-muted"
              data-month={index > 0 ? index : undefined}
              suppressHydrationWarning
            >
              {timelessLabel(index)}
            </span>
          </li>
        ))}
      </ol>
      <InlineScript html={MONTH_SCRIPT} />
      {finePrint ? (
        <p className="text-2xs text-muted">مبلغ دقیق اقساط در اسنپ‌پی نمایش داده می‌شود · طبق شرایط اسنپ‌پی</p>
      ) : null}
    </div>
  );
}
