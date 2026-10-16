import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { installmentPlan, type SnappPaySettings } from "./installments";

/* «۴ قسط با اسنپ‌پی» chip for cards and the PDP (DESIGN.md §4.10). Hidden when not eligible. */
export function InstallmentBadge({
  price,
  snapppay,
  className,
}: {
  price: number;
  snapppay: SnappPaySettings;
  className?: string;
}) {
  const plan = installmentPlan(price, snapppay);
  if (!plan) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-bead bg-bubble px-2.5 py-0.5 text-xs font-semibold text-success",
        className,
      )}
    >
      <Icon name="wheels" className="size-4" />
      {toFaDigits(plan.count)} قسط با اسنپ‌پی
    </span>
  );
}
