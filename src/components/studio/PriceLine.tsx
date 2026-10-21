import type { SiteSettings } from "@/db/queries/settings";
import { formatToman, installments, toFaDigits } from "@/lib/format";

/** «از ۹٬۸۰۰٬۰۰۰ تومان یا ۴ قسط ۲٬۴۵۰٬۰۰۰ تومانی» — one quiet line under a product name. */
export function PriceLine({
  price,
  from = false,
  snapppay,
  className,
}: {
  price: number;
  from?: boolean;
  snapppay: SiteSettings["snapppay"];
  className?: string;
}) {
  const count = snapppay?.enabled ? snapppay.count : 0;
  return (
    <p className={className}>
      <data value={price}>
        {from ? "از " : ""}
        {formatToman(price)}
      </data>
      {count > 0 && (
        <span className="text-muted">
          {" "}
          یا {toFaDigits(count)} قسط {formatToman(installments(price, count), false)} تومانی
        </span>
      )}
    </p>
  );
}
