import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { InstallmentWheels } from "@/components/ui/InstallmentWheels";
import { installmentPlan, type SnappPaySettings } from "@/components/ui/installments";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/utils";
import { InstallmentAmountInput } from "./InstallmentAmountInput";
import styles from "./InstallmentCalculator.module.css";

/*
 * «قسط هر محصول چقدر می‌شود؟» (DESIGN.md §8 /installments, §4.13): a set of product chips plus
 * «مبلغ دلخواه», each a radio. Every product's four wheels are rendered on the server, so the
 * amounts are real HTML; `:has(:checked)` shows the chosen panel with zero JS (without `:has`,
 * all panels simply show one after another). Only the custom amount needs a tiny island, which
 * rewrites the amounts of its own panel's wheels.
 *
 * Money voice: exact amounts, «طبق شرایط اسنپ‌پی», no decoration on a number.
 */

export type InstallmentOption = {
  slug: string;
  name: string;
  /** Toman: the lowest price the customer can pay. */
  price: number;
  /** «از …» when the product's variants start at this price. */
  from?: boolean;
};

type InstallmentCalculatorProps = {
  /** Products to offer as chips, in display order; ineligible prices are dropped (at most 8 shown). */
  options: InstallmentOption[];
  snapppay: SnappPaySettings;
  /** The custom panel's starting amount (Toman). */
  customAmount?: number;
  className?: string;
};

/** The CSS module pairs chip i with panel i for i = 1…8. */
const MAX_OPTIONS = 8;
const GROUP = "installment-total";

export function InstallmentCalculator({ options, snapppay, customAmount = 8_000_000, className }: InstallmentCalculatorProps) {
  const plan = installmentPlan(customAmount, snapppay);
  if (!snapppay || !plan) return null;
  const eligible = options.filter((o) => installmentPlan(o.price, snapppay)).slice(0, MAX_OPTIONS);

  return (
    <section aria-labelledby="calculator-title" className={cn(styles.calc, "sm:rounded-bit-xl sm:bg-surface sm:p-6", className)}>
      <h2 id="calculator-title" className="text-xl leading-[1.4] font-extrabold text-ink">
        قسط هر محصول چقدر می‌شود؟
      </h2>
      <p className="mt-1.5 text-sm text-muted">
        یک محصول را انتخاب کنید یا مبلغ دلخواهتان را بنویسید؛ مبلغ هر قسط زیر چرخ خودش آمده است.
      </p>

      <fieldset className="mt-5">
        <legend className="sr-only">مبلغ خرید</legend>
        <div className="flex flex-wrap gap-2">
          {eligible.map((option, index) => (
            <label key={option.slug} className={styles.chip}>
              <input
                type="radio"
                name={GROUP}
                value={option.slug}
                defaultChecked={index === 0}
                data-option={index + 1}
                className="sr-only"
              />
              <span className={styles.face}>
                <Icon name="check" className={cn(styles.check, "-ms-1 size-[1.15em]")} />
                {option.name}
              </span>
            </label>
          ))}
          <label className={styles.chip}>
            <input
              type="radio"
              name={GROUP}
              value="custom"
              defaultChecked={eligible.length === 0}
              data-option="custom"
              className="sr-only"
            />
            <span className={styles.face}>
              <Icon name="check" className={cn(styles.check, "-ms-1 size-[1.15em]")} />
              <Icon name="pencil" className={cn(styles.uncheck, "-ms-1 size-[1.15em]")} />
              مبلغ دلخواه
            </span>
          </label>
        </div>
      </fieldset>

      <div className="tray mt-5 px-3 py-4 sm:p-5">
        {eligible.map((option, index) => (
          <div key={option.slug} data-option={index + 1} className={styles.panel}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-bold text-ink">{option.name}</p>
              <Price price={option.price} from={option.from} size="md" />
            </div>
            <InstallmentWheels total={option.price} snapppay={snapppay} wheelSize={40} caption={null} finePrint={false} className="mt-4" />
            <Link
              href={`/product/${option.slug}`}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-ink"
            >
              <span className="link-mark">دیدن {option.name} ←</span>
            </Link>
          </div>
        ))}

        <div data-option="custom" data-custom-panel="" className={styles.panel}>
          <InstallmentAmountInput
            defaultAmount={customAmount}
            count={plan.count}
            minToman={snapppay.minToman}
            maxToman={snapppay.maxToman}
          />
          <InstallmentWheels total={customAmount} snapppay={snapppay} wheelSize={40} caption={null} finePrint={false} className="mt-4" />
        </div>

        <p className="mt-4 border-t border-line pt-3 text-2xs text-muted">
          مبالغ با گرد کردن به هزار تومان حساب شده‌اند؛ مبلغ دقیق اقساط در اسنپ‌پی نمایش داده می‌شود · طبق شرایط اسنپ‌پی
        </p>
      </div>
    </section>
  );
}
