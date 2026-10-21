"use client";

import { useEffect } from "react";

/*
 * Lazy loader for the name engraver (DESIGN.md §5.7, §10.2): renders nothing and ships almost
 * nothing. The live preview engine (./engraver, ≈ 4 KB) is imported on the first focus or
 * pointer over the form, then drives the server-rendered stage and form directly. Until then
 * the form is a plain GET to the product page, so a visitor without JS loses only the preview.
 */

export type StoryCardTemplate = {
  /** The static assembled drawing of the learning tower. */
  src: string;
  width: number;
  height: number;
  /** The engraving plate inside that drawing: [x, y, width, height] as fractions of it. */
  plate: [number, number, number, number];
};

type EngraverIslandProps = {
  formId: string;
  stageId: string;
  story: StoryCardTemplate | null;
  /** Instagram handle for the story card («@choobz.kids»). */
  handle: string | null;
  /** The site's host for the card's last line. */
  host: string;
};

export function EngraverIsland({ formId, stageId, story, handle, host }: EngraverIslandProps) {
  useEffect(() => {
    const form = document.getElementById(formId);
    const stage = document.getElementById(stageId);
    if (!(form instanceof HTMLFormElement) || !stage) return;

    let disposed = false;
    let unmount: (() => void) | undefined;
    const start = () => {
      form.removeEventListener("focusin", start);
      form.removeEventListener("pointerenter", start);
      import("./engraver")
        .then(({ mountEngraver }) => {
          if (!disposed) unmount = mountEngraver(form, stage, { story, handle, host });
        })
        .catch(() => {
          // The plain form still works; the preview just stays the example.
        });
    };

    form.addEventListener("focusin", start);
    form.addEventListener("pointerenter", start);
    return () => {
      disposed = true;
      form.removeEventListener("focusin", start);
      form.removeEventListener("pointerenter", start);
      unmount?.();
    };
  }, [formId, stageId, story, handle, host]);

  return null;
}
