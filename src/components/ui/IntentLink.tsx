"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

/*
 * next/link that upgrades to a full prefetch once the visitor shows intent (pointer enters,
 * focus, touch start). Until then it keeps the caller's `prefetch` (default "auto", which with
 * Partial Prefetching warms only the App Shell), so long grids stay cheap but the card the
 * mother reaches for is ready and its view-transition morph pairs (DESIGN.md §4.11).
 */
export function IntentLink({ prefetch, onPointerEnter, onFocus, onTouchStart, ...props }: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false);
  const markIntent = () => {
    if (!intent) setIntent(true);
  };

  return (
    <Link
      {...props}
      prefetch={intent ? true : (prefetch ?? "auto")}
      onPointerEnter={(event) => {
        markIntent();
        onPointerEnter?.(event);
      }}
      onFocus={(event) => {
        markIntent();
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        markIntent();
        onTouchStart?.(event);
      }}
    />
  );
}
