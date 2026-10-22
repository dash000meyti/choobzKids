"use client";

import NextLink from "next/link";
import { useState, type ComponentProps } from "react";

/*
 * The site's link: next/link that prefetches only once the visitor shows intent (pointer enters,
 * focus, touch start), never just because it scrolled into view. Viewport prefetching fetched the
 * data of ~70 pages (≈280 KB) while scrolling the home page once — a real cost on Iranian mobile
 * data. On intent the full route is prefetched, so the page the visitor reaches for is ready.
 * `prefetch={false}` still means never.
 */
export default function Link({ prefetch, onPointerEnter, onFocus, onTouchStart, ...props }: ComponentProps<typeof NextLink>) {
  const [intent, setIntent] = useState(false);
  const markIntent = () => {
    if (!intent) setIntent(true);
  };
  if (prefetch === false) return <NextLink {...props} prefetch={false} onPointerEnter={onPointerEnter} onFocus={onFocus} onTouchStart={onTouchStart} />;

  return (
    <NextLink
      {...props}
      prefetch={intent}
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
