"use client";

import { useEffect } from "react";

/*
 * AgeRoomVT (DESIGN.md §5.3, §9.6): the height door switches rooms with zero JS (radios + :has()).
 * This island only adds the morph and the shareable `?age=`:
 *
 *   · on a change it puts the previous radio back for one more frame, names the old room's pieces
 *     and the child (`view-transition-name`), and inside `document.startViewTransition` checks the
 *     new radio and names the new room's pieces — so pieces in both rooms morph into place, new
 *     ones rise from the floor and removed ones sink (keyframes in HeightDoor.module.css);
 *   · names exist only between the transition's start and `finished`, so page navigations never
 *     snapshot room pieces;
 *   · the URL follows with `history.replaceState` (the server never reads `?age=`).
 *
 * Reduced motion, «حرکت آرام», the lite tier and browsers without view transitions swap instantly.
 */

type AgeRoomVTProps = {
  /** id of the door section that holds the radios, scene and panels. */
  doorId: string;
  /** The radios' `name`. */
  name: string;
};

function motionAllowed() {
  const root = document.documentElement;
  if (root.dataset.motion === "reduce" || "lite" in root.dataset) return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AgeRoomVT({ doorId, name }: AgeRoomVTProps) {
  useEffect(() => {
    const door = document.getElementById(doorId);
    if (!door) return;
    const selector = `input[type="radio"][name="${CSS.escape(name)}"]`;
    let current = door.querySelector<HTMLInputElement>(`${selector}:checked`);
    let running: ViewTransition | null = null;

    const namePieces = (stage: string, on: boolean) => {
      for (const piece of door.querySelectorAll<HTMLElement>(`[data-scene-piece][data-room="${CSS.escape(stage)}"]`)) {
        piece.style.viewTransitionName = on ? `room-piece-${piece.dataset.scenePiece}` : "";
      }
    };
    const nameChild = (on: boolean) => {
      // The doll itself (not its full-stage layer), so the morph shows it growing to the new mark.
      const doll = door.querySelector<HTMLElement>("[data-door-child] > *");
      if (doll) doll.style.viewTransitionName = on ? "door-child" : "";
    };

    const onChange = (event: Event) => {
      const next = event.target;
      if (!(next instanceof HTMLInputElement) || !next.matches(selector) || !next.checked) return;
      const previous = current;
      current = next;

      try {
        const url = new URL(window.location.href);
        url.searchParams.set("age", next.value);
        window.history.replaceState(window.history.state, "", url);
      } catch {
        // A sandboxed frame may refuse; the room still switches.
      }

      if (!previous || previous === next || typeof document.startViewTransition !== "function" || !motionAllowed()) return;

      // Paint the old room once more so the transition can snapshot it.
      previous.checked = true;
      namePieces(previous.value, true);
      nameChild(true);
      const update = () => {
        namePieces(previous.value, false);
        next.checked = true;
        namePieces(next.value, true);
      };

      let transition: ViewTransition;
      try {
        transition = document.startViewTransition({ update, types: ["room"] });
      } catch {
        // Browsers with view transitions but without types take only the callback.
        transition = document.startViewTransition(update);
      }
      running = transition;
      transition.finished.finally(() => {
        if (running !== transition) return; // a newer change took over and cleans up after itself
        running = null;
        namePieces(next.value, false);
        nameChild(false);
      });
    };

    door.addEventListener("change", onChange);
    return () => door.removeEventListener("change", onChange);
  }, [doorId, name]);

  return null;
}
