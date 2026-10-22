import Link from "@/components/ui/Link";
import { formatNumber, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { INSTALLMENTS_HREF, installmentPlan, type SnappPaySettings } from "./installments";

/*
 * «یا ۴ قسط ۲٬۴۵۰٬۰۰۰ تومانی با اسنپ‌پی» (DESIGN.md §4.13, SEO.md §6.4). Text in HTML, never an image.
 * `card`: the sentence alone (cards are stretched links, so set `link={false}` there).
 * `pdp`: «ماهانهٔ» wording plus a «چطور؟» link, directly under the price.
 * Renders nothing unless settings.snapppay makes this price eligible ⚑.
 */

type InstallmentLineProps = {
  price: number;
  snapppay: SnappPaySettings;
  variant?: "card" | "pdp";
  /** Prefix «حدود» when our 1,000-Toman rounding may differ from SnappPay's schedule ⚑. */
  approximate?: boolean;
  /** Link the line to /installments (card) or show the «چطور؟» link (pdp). */
  link?: boolean;
  className?: string;
};

export function InstallmentLine({
  price,
  snapppay,
  variant = "card",
  approximate,
  link = true,
  className,
}: InstallmentLineProps) {
  const plan = installmentPlan(price, snapppay);
  if (!plan) return null;

  const sentence = (
    <>
      یا {toFaDigits(plan.count)} قسط {variant === "pdp" ? "ماهانهٔ " : ""}
      {approximate ? "حدود " : ""}
      <data value={plan.amount}>{formatNumber(plan.amount)}</data> تومانی با اسنپ‌پی
    </>
  );
  const classes = cn("text-sm text-muted", className);

  if (variant === "pdp") {
    return (
      <p className={classes}>
        {sentence}
        {link ? (
          <>
            {" · "}
            <Link href={INSTALLMENTS_HREF} className="link-mark font-semibold text-ink">
              چطور؟
            </Link>
          </>
        ) : null}
      </p>
    );
  }
  if (!link) return <p className={classes}>{sentence}</p>;
  // Coloured text never sits on the mustard link band (§2.3), so this link is marked by a dotted rule.
  return (
    <p className={classes}>
      <Link href={INSTALLMENTS_HREF} className="underline decoration-dotted decoration-1 underline-offset-[0.45em]">
        {sentence}
      </Link>
    </p>
  );
}
