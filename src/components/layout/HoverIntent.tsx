"use client";

import { useEffect } from "react";

/*
 * Hover-to-open for the desktop mega menus (DESIGN.md §4.1), mouse pointers only and set up when
 * the browser is idle. The menus are plain `popover="auto"` panels opened by their trigger
 * buttons, so click, Enter, Esc and focus return work without this; it only adds the 120 ms hover
 * intent and closes a hover-opened panel when the pointer leaves both trigger and panel.
 * Triggers opt in with `data-hover-popover`. Renders nothing.
 */

const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 220;

function wire(trigger: HTMLButtonElement, panel: HTMLElement) {
  let openTimer: number | undefined;
  let closeTimer: number | undefined;
  /** Opened by hovering (not by a click): leaving may close it. */
  let byHover = false;

  const isOpen = () => panel.matches(":popover-open");
  const cancel = () => {
    window.clearTimeout(openTimer);
    window.clearTimeout(closeTimer);
  };

  const onTriggerEnter = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancel();
    if (isOpen()) return;
    openTimer = window.setTimeout(() => {
      try {
        panel.showPopover({ source: trigger });
      } catch {
        panel.showPopover();
      }
      byHover = true;
    }, OPEN_DELAY_MS);
  };
  const onPanelEnter = (event: PointerEvent) => {
    if (event.pointerType === "mouse") window.clearTimeout(closeTimer);
  };
  const onLeave = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    window.clearTimeout(openTimer);
    if (!byHover) return;
    closeTimer = window.setTimeout(() => {
      // Keyboard focus inside the panel keeps it open.
      if (byHover && isOpen() && !panel.contains(document.activeElement)) panel.hidePopover();
    }, CLOSE_DELAY_MS);
  };
  const onTriggerClick = (event: MouseEvent) => {
    // A click on a hover-opened menu pins it open instead of toggling it shut.
    if (byHover && isOpen()) {
      event.preventDefault();
      byHover = false;
    }
  };
  const onToggle = (event: Event) => {
    if ((event as ToggleEvent).newState === "closed") {
      byHover = false;
      cancel();
    }
  };

  trigger.addEventListener("pointerenter", onTriggerEnter);
  trigger.addEventListener("pointerleave", onLeave);
  trigger.addEventListener("click", onTriggerClick);
  panel.addEventListener("pointerenter", onPanelEnter);
  panel.addEventListener("pointerleave", onLeave);
  panel.addEventListener("toggle", onToggle);
  return () => {
    cancel();
    trigger.removeEventListener("pointerenter", onTriggerEnter);
    trigger.removeEventListener("pointerleave", onLeave);
    trigger.removeEventListener("click", onTriggerClick);
    panel.removeEventListener("pointerenter", onPanelEnter);
    panel.removeEventListener("pointerleave", onLeave);
    panel.removeEventListener("toggle", onToggle);
  };
}

export function HoverIntent() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const cleanups: (() => void)[] = [];
    const setup = () => {
      document.querySelectorAll<HTMLButtonElement>("button[data-hover-popover][popovertarget]").forEach((trigger) => {
        const panel = document.getElementById(trigger.getAttribute("popovertarget") ?? "");
        if (panel) cleanups.push(wire(trigger, panel));
      });
    };
    const viaIdle = typeof window.requestIdleCallback === "function";
    const handle = viaIdle ? window.requestIdleCallback(setup, { timeout: 2000 }) : window.setTimeout(setup, 300);
    return () => {
      if (viaIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);
  return null;
}
