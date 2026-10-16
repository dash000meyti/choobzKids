import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Rubber stamp (DESIGN.md §4.10): «جدید»، «ساخت سفارشی»، «پیشنهاد یلدا»، «۷٪ تخفیف».
 * 1.5px border + an inner dotted border, tilted −6°. At most one per card.
 */

type StampBadgeProps = {
  children: ReactNode;
  tone?: "accent" | "success" | "ink";
  className?: string;
};

const TONE = { accent: "text-accent", success: "text-success", ink: "text-ink" } as const;

export function StampBadge({ children, tone = "accent", className }: StampBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex -rotate-6 items-center rounded-bit-xs border-[1.5px] border-current bg-raised/85 px-2.5 py-1",
        "text-2xs leading-normal font-bold whitespace-nowrap outline-1 -outline-offset-4 outline-current outline-dotted",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
