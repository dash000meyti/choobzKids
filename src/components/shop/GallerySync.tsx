"use client";

import { useEffect } from "react";

/*
 * Keeps the gallery tabs in step with the swiped slide (DESIGN.md §6.3 block 2). The tabs are
 * plain `#slide-n` anchors that work without JS; once the browser is idle this island marks the
 * visible slide's tab `aria-current` and turns tab clicks into a slide of the track itself, so
 * the page never jumps. Reads the DOM only after hydration, inside the effect.
 */

type GallerySyncProps = {
  /** id of the gallery root holding `[data-track]` and the `[data-tab]` links. */
  galleryId: string;
};

function whenIdle(run: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(run, { timeout: 2000 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(run, 200);
  return () => window.clearTimeout(handle);
}

function prefersCalm(): boolean {
  const root = document.documentElement;
  return root.dataset.motion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function GallerySync({ galleryId }: GallerySyncProps) {
  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let detach: (() => void) | null = null;

    const cancel = whenIdle(() => {
      const root = document.getElementById(galleryId);
      const track = root?.querySelector<HTMLElement>("[data-track]");
      if (!root || !track) return;
      const slides = Array.from(track.children) as HTMLElement[];
      const tabs = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-tab]"));
      if (slides.length < 2 || !tabs.length) return;

      const mark = (index: number) => {
        tabs.forEach((tab, i) => {
          if (i === index) tab.setAttribute("aria-current", "true");
          else tab.removeAttribute("aria-current");
        });
      };

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) mark(slides.indexOf(entry.target as HTMLElement));
          }
        },
        { root: track, threshold: 0.6 },
      );
      slides.forEach((slide) => observer!.observe(slide));

      const onClick = (event: MouseEvent) => {
        const tab = (event.target as Element | null)?.closest<HTMLAnchorElement>("[data-tab]");
        if (!tab || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
        const slide = document.getElementById(tab.hash.slice(1));
        if (!slide || !track.contains(slide)) return;
        event.preventDefault();
        // Only the track scrolls; `nearest` keeps the page where it is.
        slide.scrollIntoView({ behavior: prefersCalm() ? "auto" : "smooth", block: "nearest", inline: "start" });
        mark(slides.indexOf(slide));
      };
      root.addEventListener("click", onClick);
      detach = () => root.removeEventListener("click", onClick);
    });

    return () => {
      cancel();
      observer?.disconnect();
      detach?.();
    };
  }, [galleryId]);

  return null;
}
