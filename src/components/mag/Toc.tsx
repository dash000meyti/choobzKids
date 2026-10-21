import { Icon } from "@/components/ui/Icon";
import { Sheet, sheetInvokerProps } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";
import styles from "./Toc.module.css";

/*
 * Table of contents (DESIGN.md §7.3 #6, §4.2): a vertical string with one wooden bead per
 * section; TocSpy fills the current bead with anar (aria-current). Three server-rendered views
 * of the same list, each shown where it belongs:
 *   TocAside   ≥ 1024px, sticky in the inline-start column;
 *   TocInline  < 1024px, a <details> «فهرست مطالب» under the TL;DR. It names the `--toc` view
 *              timeline the floating pill reads;
 *   TocPill    < 1024px, «فهرست مطالب» above the dock once the inline TOC has scrolled away
 *              (static fallback: always shown), opening the same list in a sheet, with a thin
 *              taut-string bar for reading progress.
 * The article root carries `tocScope` so the fixed pill can see the inline TOC's timeline.
 */

export type TocItem = { id: string; text: string };

export const TOC_SHEET_ID = "toc-sheet";
export const tocScope = styles.scope;

function TocList({ items, className }: { items: TocItem[]; className?: string }) {
  return (
    <ol className={cn(styles.list, className)} data-toc="">
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <a href={`#${item.id}`} className={styles.link}>
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function TocAside({ items, className }: { items: TocItem[]; className?: string }) {
  return (
    <nav aria-labelledby="toc-aside-h" className={cn(styles.aside, className)}>
      <h2 id="toc-aside-h" className="mb-3 text-sm font-bold text-muted">
        فهرست مطالب
      </h2>
      <TocList items={items} />
    </nav>
  );
}

export function TocInline({ items, className }: { items: TocItem[]; className?: string }) {
  return (
    <details className={cn(styles.inline, className)}>
      <summary className={styles.summary}>
        <Icon name="menu" className="size-5" />
        <span className="flex-1 font-bold text-ink">فهرست مطالب</span>
        <Icon name="chevron-down" className={cn("size-5", styles.chevron)} />
      </summary>
      <nav aria-label="فهرست مطالب" className="px-4 pt-1 pb-4">
        <TocList items={items} />
      </nav>
    </details>
  );
}

export function TocPill({ items }: { items: TocItem[] }) {
  return (
    <>
      <button type="button" className={styles.pill} {...sheetInvokerProps(TOC_SHEET_ID)}>
        <Icon name="menu" className="size-5" />
        <span>فهرست مطالب</span>
        <span aria-hidden="true" className={styles.progress} />
      </button>
      <Sheet id={TOC_SHEET_ID} title="فهرست مطالب">
        <nav aria-label="فهرست مطالب">
          <TocList items={items} />
        </nav>
      </Sheet>
    </>
  );
}
