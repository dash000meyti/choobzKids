"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import styles from "./Checklist.module.css";

/*
 * The checklist's only island (DESIGN.md §10.2, ≈1 KB). The checkboxes are server HTML; this
 * keeps their ticks in localStorage (`cz.check.{slug}.{index}`, "1"/"0"), mirrors them back
 * after hydration, and draws the progress beads. Storage can be missing (private mode, blocked
 * site data): ticks then live in memory for the visit and the page still works.
 */

type ChecklistTicksProps = {
  slug: string;
  /** Storage index of the first item; this list owns `first … first + count - 1`. */
  first: number;
  count: number;
  /** Comma-separated indexes ticked in the Markdown («- [x]»), used until the reader changes them. */
  preticked: string;
};

const CHANGE_EVENT = "cz:checklist";
const memory = new Map<string, string>();
const storageKey = (slug: string, index: number | string) => `cz.check.${slug}.${index}`;

function readTick(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeTick(key: string, ticked: boolean) {
  const value = ticked ? "1" : "0";
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the in-memory copy carries the visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // another tab ticked the same list
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** "1"/"0" per item, in order: a string, so React compares snapshots by value. */
function defaultTicks(first: number, count: number, preticked: string): string {
  const ticked = new Set(preticked.split(",").filter(Boolean).map(Number));
  return Array.from({ length: count }, (_, i) => (ticked.has(first + i) ? "1" : "0")).join("");
}

function storedTicks(slug: string, first: number, defaults: string): string {
  return Array.from(defaults, (fallback, i) => readTick(storageKey(slug, first + i)) ?? fallback).join("");
}

const noop = () => () => {};
const canShare = () => typeof navigator.share === "function";

export function ChecklistTicks({ slug, first, count, preticked }: ChecklistTicksProps) {
  const ref = useRef<HTMLDivElement>(null);
  const defaults = defaultTicks(first, count, preticked);
  const ticks = useSyncExternalStore(
    subscribe,
    () => storedTicks(slug, first, defaults),
    () => defaults,
  );
  const shareable = useSyncExternalStore(noop, canShare, () => false);
  const done = Array.from(ticks).filter((t) => t === "1").length;

  // Mirror the remembered ticks onto the server-rendered checkboxes.
  useEffect(() => {
    const board = ref.current?.closest("[data-checklist]");
    board?.querySelectorAll<HTMLInputElement>("input[data-check-index]").forEach((input) => {
      input.checked = ticks[Number(input.dataset.checkIndex) - first] === "1";
    });
  }, [ticks, first]);

  // Save each tick (one delegated listener for the whole board).
  useEffect(() => {
    const board = ref.current?.closest("[data-checklist]");
    if (!board) return;
    const onChange = (event: Event) => {
      const input = event.target;
      if (input instanceof HTMLInputElement && input.dataset.checkIndex) {
        writeTick(storageKey(slug, input.dataset.checkIndex), input.checked);
      }
    };
    board.addEventListener("change", onChange);
    return () => board.removeEventListener("change", onChange);
  }, [slug]);

  const print = () => {
    const root = document.documentElement;
    root.classList.add(styles.printing);
    window.addEventListener("afterprint", () => root.classList.remove(styles.printing), { once: true });
    window.print();
  };

  const share = () => {
    navigator.share({ title: document.title, url: window.location.href.split("#")[0] }).catch(() => {
      // Dismissed by the reader, or not allowed here: nothing to do.
    });
  };

  return (
    <div ref={ref} data-checklist-controls="" className={cn("no-print", styles.controls)}>
      <div className={styles.progress}>
        <span aria-hidden="true" className={styles.beads}>
          {Array.from(ticks, (tick, i) => (
            <span key={i} className={cn(styles.bead, tick === "1" && styles.beadDone)} />
          ))}
        </span>
        <p aria-live="polite" className="text-sm text-muted">
          {done === count ? `هر ${toFaDigits(count)} مورد آماده است` : `${toFaDigits(done)} از ${toFaDigits(count)} مورد آماده است`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={print}>
          چاپ چک‌لیست
        </Button>
        {shareable ? (
          <Button variant="quiet" size="sm" iconStart="share" onClick={share}>
            اشتراک‌گذاری
          </Button>
        ) : null}
      </div>
    </div>
  );
}
