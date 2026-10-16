"use client";

import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { CartGlyph } from "@/components/layout/NavIcons";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { openCart } from "./CartProvider";
import { useCart } from "./store";

/*
 * The cart button (DESIGN.md §4.1, §4.2): Tati's cart, loaded with one parcel per item (up to
 * four), and a count bead. It is a real link to /cart, so it works before hydration and in a new
 * tab; a plain click opens the drawer instead. The bead is absolutely placed, so the count
 * arriving after hydration never shifts the header. `[data-cart-target]` is where an
 * add-to-cart hop lands and what wobbles.
 */

type CartButtonProps = {
  variant?: "header" | "dock";
  /** Dock tab classes (shape, active bead) from BottomDock. */
  className?: string;
};

export function cartLabel(count: number) {
  return count > 0 ? `سبد خرید، ${toFaDigits(count)} کالا` : "سبد خرید، خالی";
}

function CountBead({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute grid h-5 min-w-5 place-items-center rounded-bead bg-accent px-1 text-2xs leading-none font-bold text-on-accent",
        "shadow-[0_1px_0_var(--accent-press)]",
        className,
      )}
    >
      {count > 9 ? `+${toFaDigits(9)}` : toFaDigits(count)}
    </span>
  );
}

export function CartButton({ variant = "header", className }: CartButtonProps) {
  const { count } = useCart();
  const pathname = usePathname();
  const onCartPage = pathname === "/cart";

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onCartPage || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openCart();
  };

  if (variant === "dock") {
    return (
      <a
        href="/cart"
        onClick={onClick}
        aria-label={cartLabel(count)}
        aria-current={onCartPage ? "page" : undefined}
        aria-haspopup={onCartPage ? undefined : "dialog"}
        className={className}
      >
        <span data-cart-target="" className="relative inline-flex">
          <CartGlyph parcels={count} className="size-6" />
          <CountBead count={count} className="-end-2.5 -top-1.5" />
        </span>
        <span aria-hidden="true">سبد</span>
      </a>
    );
  }

  return (
    <a
      href="/cart"
      onClick={onClick}
      aria-label={cartLabel(count)}
      aria-current={onCartPage ? "page" : undefined}
      aria-haspopup={onCartPage ? undefined : "dialog"}
      className={cn(buttonClasses({ variant: "icon", size: "md" }), "overflow-visible", className)}
    >
      <span data-cart-target="" className="relative inline-flex">
        <CartGlyph parcels={count} className="size-6" />
      </span>
      <CountBead count={count} className="-end-1 -top-1" />
    </a>
  );
}
