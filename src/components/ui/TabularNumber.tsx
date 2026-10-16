import { Fragment } from "react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * A Persian-digit number with equal-width digits (DESIGN.md §2.4: cart totals, steppers,
 * installment wheels, room total, tables). Estedad's `tnum` also widens the Arabic thousands
 * separator «٬» to a full digit, which opens gaps inside the number, so separators are set
 * back to proportional width. Digits and «٬» never join, so splitting the runs is safe.
 */
export function TabularNumber({ value, className }: { value: number; className?: string }) {
  const groups = formatNumber(value).split("٬");
  return (
    <span className={cn("tabular-nums", className)}>
      {groups.map((group, index) => (
        <Fragment key={index}>
          {index > 0 ? <span className="proportional-nums">٬</span> : null}
          {group}
        </Fragment>
      ))}
    </span>
  );
}
