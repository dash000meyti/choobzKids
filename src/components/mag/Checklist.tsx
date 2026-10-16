import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChecklistTicks } from "./ChecklistTicks";
import styles from "./Checklist.module.css";

/*
 * GFM task lists as a peg board (DESIGN.md §7.3): a recessed tray (it holds inputs) of real
 * checkboxes, server-rendered and usable without JS. ChecklistTicks (client, ~1 KB) remembers
 * ticks in localStorage under `cz.check.{slug}.{index}`, threads the progress beads and offers
 * «چاپ چک‌لیست» (prints only the checklists of the page) and sharing.
 *
 * Items draw the same peg-in-a-hole as ui/Checkbox, but from this module's CSS instead of its
 * utility classes: a checklist can hold 20+ items and every byte is sent twice (HTML + RSC
 * payload) on pages that must stay under SEO.md §4.2's 150 KB.
 */

type ChecklistProps = {
  slug: string;
  first: number;
  count: number;
  preticked?: string;
  children?: ReactNode;
};

export function Checklist({ slug, first, count, preticked = "", children }: ChecklistProps) {
  return (
    <div data-block="" data-checklist="" className={cn("tray", styles.board)}>
      <ul role="list" className={styles.items}>
        {children}
      </ul>
      <ChecklistTicks slug={slug} first={first} count={count} preticked={preticked} />
    </div>
  );
}

export function ChecklistItem({ index, ticked, children }: { index: number; ticked?: boolean; children?: ReactNode }) {
  return (
    <li className={styles.item}>
      <label className={styles.check}>
        <input type="checkbox" defaultChecked={ticked} data-check-index={index} className={styles.input} />
        <span aria-hidden="true" className={styles.peg} />
        <span>{children}</span>
      </label>
    </li>
  );
}
