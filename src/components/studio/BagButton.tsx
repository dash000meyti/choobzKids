"use client";

import Link from "@/components/ui/Link";
import type { MouseEvent } from "react";
import { openCart } from "@/components/layout/cart/CartProvider";
import { useCart } from "@/components/layout/cart/store";
import { toFaDigits } from "@/lib/format";

/** Shopping bag in the global nav: a real link to /cart; a plain click opens the drawer. */
export function BagButton() {
  const { count } = useCart();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openCart();
  };
  return (
    <Link
      href="/cart"
      onClick={onClick}
      data-cart-target
      aria-label={count > 0 ? `سبد خرید، ${toFaDigits(count)} کالا` : "سبد خرید"}
      className="relative grid size-11 place-items-center rounded-full text-ink/80 transition-colors hover:text-ink"
    >
      <svg viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M5 8.5h14l-1.1 11.2a1.5 1.5 0 0 1-1.5 1.3H7.6a1.5 1.5 0 0 1-1.5-1.3L5 8.5Z" strokeLinejoin="round" />
        <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.625rem] font-bold leading-none text-bg tabular-nums">
          {count > 9 ? "+۹" : toFaDigits(count)}
        </span>
      )}
    </Link>
  );
}
