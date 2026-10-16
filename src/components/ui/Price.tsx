import { discountPercent, formatNumber, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StampBadge } from "./StampBadge";

/*
 * Price (DESIGN.md §4.13), money voice: Estedad 700, proportional digits, always ink.
 * The machine value (Toman) sits in <data value>; JSON-LD carries IRR separately (×10).
 * A compare-at price is struck through in muted ink with a «۷٪ تخفیف» stamp. No marks here, ever.
 */

type PriceProps = {
  /** Toman. */
  price: number;
  /** Pre-discount Toman; ignored unless higher than `price`. */
  compareAt?: number | null;
  /** «از …» when variants start at this price. */
  from?: boolean;
  size?: "sm" | "md" | "lg";
  /** Show the discount stamp next to a compare-at price. */
  showDiscount?: boolean;
  className?: string;
};

const SIZE = {
  sm: { price: "text-sm", compare: "text-xs" },
  md: { price: "text-base", compare: "text-sm" },
  lg: { price: "text-xl", compare: "text-base" },
} as const;

function Toman({ value }: { value: number }) {
  return (
    <>
      {formatNumber(value)} <span className="text-[0.8em] font-semibold">تومان</span>
    </>
  );
}

export function Price({ price, compareAt, from, size = "md", showDiscount = true, className }: PriceProps) {
  const percent = discountPercent(price, compareAt);
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2.5 gap-y-1", className)}>
      <data value={price} className={cn("font-bold text-ink", SIZE[size].price)}>
        {from ? <span className="font-semibold text-muted">از </span> : null}
        <Toman value={price} />
      </data>
      {percent != null && compareAt ? (
        <>
          {/* <s> has no reliable aria-label support, so the meaning is spoken by hidden text. */}
          <s className={cn("text-muted decoration-1", SIZE[size].compare)}>
            <span className="sr-only">قیمت قبلی: </span>
            <Toman value={compareAt} />
          </s>
          {showDiscount ? <StampBadge>{toFaDigits(percent)}٪ تخفیف</StampBadge> : null}
        </>
      ) : null}
    </span>
  );
}
