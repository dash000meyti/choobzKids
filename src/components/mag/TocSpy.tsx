"use client";

import { useEffect } from "react";

/*
 * TocSpy (DESIGN.md §7.3 #6, §10.2 — ≈0.8 KB, started on idle): marks the section being read in
 * every copy of the TOC (`[data-toc]` lists) with aria-current, which fills its bead. A section
 * is "being read" while it crosses a thin line 28% down the viewport. Also closes the TOC sheet
 * when one of its links is followed, so the jump lands on an uncovered page.
 */

type TocSpyProps = {
  /** Section ids in reading order (the TOC's hrefs without «#»). */
  ids: string[];
  /** The <dialog> holding the phone TOC. */
  sheetId: string;
};

function markCurrent(id: string | null) {
  document.querySelectorAll<HTMLAnchorElement>("[data-toc] a[href^='#']").forEach((link) => {
    if (id && link.hash === `#${id}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

export function TocSpy({ ids, sheetId }: TocSpyProps) {
  // A string key keeps the effect from re-running when the server sends an equal array.
  const idList = ids.join(" ");

  useEffect(() => {
    const closeSheet = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href^='#']");
      const sheet = document.getElementById(sheetId);
      if (link && sheet instanceof HTMLDialogElement && sheet.open && sheet.contains(link)) sheet.close();
    };
    document.addEventListener("click", closeSheet);

    let observer: IntersectionObserver | null = null;
    const start = () => {
      if (typeof IntersectionObserver === "undefined") return;
      // Prose wraps each H2 and its content in a <section>; FAQ and sources are sections too.
      const targets = new Map<Element, string>();
      for (const id of idList.split(" ")) {
        const heading = document.getElementById(id);
        const section = heading?.closest("section") ?? heading;
        if (section) targets.set(section, id);
      }
      observer = new IntersectionObserver(
        (entries) => {
          const crossing = entries.filter((e) => e.isIntersecting).map((e) => targets.get(e.target));
          if (crossing.length) markCurrent(crossing[crossing.length - 1] ?? null);
        },
        { rootMargin: "-28% 0px -71% 0px" },
      );
      targets.forEach((_, section) => observer!.observe(section));
    };

    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle ? window.requestIdleCallback(start, { timeout: 2000 }) : window.setTimeout(start, 200);

    return () => {
      document.removeEventListener("click", closeSheet);
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      observer?.disconnect();
    };
  }, [idList, sheetId]);

  return null;
}
