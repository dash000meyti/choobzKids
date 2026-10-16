import type { ProductCardData } from "@/db/queries/catalog";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * Availability as a dot + words (DESIGN.md §4.10, §11.2) — never colour alone.
 * `short` for cards and lists, `long` for the PDP availability line.
 */

export type Availability = ProductCardData["availability"];

type StockBadgeProps = {
  availability: Availability;
  /** Working days to build a made-to-order piece ⚑. */
  leadTimeDays?: number | null;
  variant?: "short" | "long";
  className?: string;
};

export function stockLabel(availability: Availability, leadTimeDays?: number | null, variant: "short" | "long" = "short") {
  const ready = leadTimeDays ? `آماده در ${toFaDigits(leadTimeDays)} روز کاری` : null;
  switch (availability) {
    case "in_stock":
      return "موجود";
    case "made_to_order":
      if (variant === "long") return ready ? `ساخته می‌شه برای شما — ${ready}` : "ساخته می‌شه برای شما";
      return ready ? `ساخت سفارشی · ${ready}` : "ساخت سفارشی";
    case "preorder":
      return "پیش‌سفارش";
    case "out_of_stock":
      return variant === "long" ? "فعلاً تموم شده · توی بله بپرس کی آماده می‌شه" : "فعلاً تموم شده";
  }
}

const DOT: Record<Availability, string> = {
  in_stock: "bg-success",
  made_to_order: "bg-asal",
  preorder: "bg-info",
  out_of_stock: "border-[1.5px] border-muted",
};

const TEXT: Record<Availability, string> = {
  in_stock: "text-success",
  made_to_order: "text-ink",
  preorder: "text-ink",
  out_of_stock: "text-muted",
};

export function StockBadge({ availability, leadTimeDays, variant = "short", className }: StockBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-semibold", TEXT[availability], className)}>
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", DOT[availability])} />
      {stockLabel(availability, leadTimeDays, variant)}
    </span>
  );
}
