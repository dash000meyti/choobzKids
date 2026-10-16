import type { ComponentPropsWithoutRef } from "react";
import styles from "./CompareTable.module.css";

/*
 * Markdown tables (DESIGN.md §7.3, SEO.md §4.3): a real <table> with <caption> («جدول:» line),
 * <th scope="col"> headers and <th scope="row"> row names, all set by the pipeline. The table
 * scrolls inside its own frame when it is wider than the column (never the page), the first
 * column stays put while it scrolls (≥ 640px), and under 600px every row becomes a stacked card
 * whose cells print their column name (data-label). A column whose header names «چوبز» carries
 * a soft mustard band; the comparison itself stays fair.
 */

type CompareTableProps = ComponentPropsWithoutRef<"table"> & {
  /** Caption text, for the scroll frame's accessible name. */
  label?: string;
  /** Id of the section heading, when the table has no caption. */
  labelledBy?: string;
};

export function CompareTable({ label, labelledBy, children, className, ...rest }: CompareTableProps) {
  return (
    // The frame is focusable so keyboard users can scroll a wide table (WCAG 2.1.1).
    <div
      data-block=""
      role="region"
      tabIndex={0}
      aria-label={label}
      aria-labelledby={label ? undefined : labelledBy}
      className={styles.frame}
    >
      <table {...rest} className={[styles.table, className].filter(Boolean).join(" ")}>
        {children}
      </table>
    </div>
  );
}
