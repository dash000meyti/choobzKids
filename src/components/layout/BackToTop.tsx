"use client";

import type { MouseEvent } from "react";

/*
 * «برگرد به صفحهٔ اول» (DESIGN.md §4.6): back to the top of the page — smoothly where motion is
 * allowed (Tati rolls back along the thread for free), instantly otherwise. `#top` scrolls to the
 * top in every browser even without JS. Focus moves to the main content so keyboard users land
 * where they can read on.
 */

function motionAllowed() {
  const root = document.documentElement;
  if (root.dataset.motion === "reduce" || "lite" in root.dataset) return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BackToTop({ className }: { className?: string }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: motionAllowed() ? "smooth" : "auto" });
    document.getElementById("main")?.focus({ preventScroll: true });
  };
  return (
    <a href="#top" onClick={onClick} className={className}>
      برگرد به صفحهٔ اول
    </a>
  );
}
