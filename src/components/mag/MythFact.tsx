import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { CALLOUT_LABELS, type MythSide } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import styles from "./MythFact.module.css";

/*
 * «باور رایج / واقعیت» (DESIGN.md §7.3, from `> [!MYTH]`): two leaves of one card, side by side
 * when there is room, stacked with a stitched hinge between them on phones. Both are always
 * visible: nothing to flip, nothing hidden from crawlers.
 */

const FACE_LABEL: Record<MythSide, string> = { belief: "باور رایج", fact: "واقعیت" };

export function MythFact({ title, children }: { title?: string; children?: ReactNode }) {
  const heading = title && title !== CALLOUT_LABELS.myth ? title : null;
  return (
    <div role="note" data-block="" className={styles.myth}>
      {heading ? <p className={styles.title}>{heading}</p> : null}
      <div className={styles.leaves}>{children}</div>
    </div>
  );
}

export function MythFace({ side, children }: { side: MythSide; children?: ReactNode }) {
  return (
    <div className={cn(styles.leaf, side === "fact" ? styles.fact : styles.belief)}>
      <p className={styles.label}>
        <Icon name={side === "fact" ? "check" : "close"} className="size-[1.1em]" />
        <span>{FACE_LABEL[side]}</span>
      </p>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
