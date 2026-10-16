import type { CSSProperties } from "react";
import { TabularNumber } from "@/components/ui/TabularNumber";
import { cn } from "@/lib/utils";
import styles from "./FreeShippingMeter.module.css";

/*
 * «فقط ۴۲۰٬۰۰۰ تومان تا ارسال رایگان» (DESIGN.md §4.7, §11.2 #6): Tati's string runs from the
 * order to a little house at inline-end, taut as far as the order has come, with a wooden bead
 * at that point. Hidden while the free-shipping threshold is not set ⚑.
 */

type FreeShippingMeterProps = {
  /** Toman. */
  subtotal: number;
  /** Toman; null or 0 hides the meter. */
  freeOverToman: number | null;
  className?: string;
};

function House() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={styles.house}>
      <path d="M4.5 20.5V10.6L12 4l7.5 6.6v9.9z" fill="var(--wood)" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 20.5v-5h4v5" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function FreeShippingMeter({ subtotal, freeOverToman, className }: FreeShippingMeterProps) {
  if (!freeOverToman || freeOverToman <= 0) return null;
  const remaining = Math.max(0, freeOverToman - subtotal);
  const progress = Math.min(1, Math.max(0, subtotal / freeOverToman));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className={cn("text-sm font-semibold", remaining > 0 ? "text-ink" : "text-success")}>
        {remaining > 0 ? (
          <>
            فقط <TabularNumber value={remaining} /> تومان تا ارسال رایگان
          </>
        ) : (
          "ارسال این سفارش رایگانه!"
        )}
      </p>
      <div className={styles.track} style={{ "--p": progress } as CSSProperties} aria-hidden="true">
        <span className={styles.slack} />
        <span className={styles.taut} />
        <span className={styles.bead} />
        <House />
      </div>
    </div>
  );
}
