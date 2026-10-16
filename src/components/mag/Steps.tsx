import type { CSSProperties, ReactNode } from "react";
import { toFaDigits } from "@/lib/format";
import { grainStyle } from "@/lib/grain";
import { cn } from "@/lib/utils";
import styles from "./Steps.module.css";

/*
 * `:::steps` → numbered wooden beads threaded on a vertical string (DESIGN.md §7.3). The
 * pipeline renders the list itself (<ol role="list">) with one <Step> per item; each item keeps
 * its `#step-{n}` anchor, the same url fragment as the HowTo JSON-LD (src/lib/jsonld.tsx).
 * Beads are flat wood (no ply edge): they are not buttons.
 */

export function Steps({ children }: { count?: number; children?: ReactNode }) {
  return (
    <div data-block="" className={styles.steps}>
      {children}
    </div>
  );
}

export function Step({ index, title, children }: { index: number; title?: string; children?: ReactNode }) {
  return (
    <li id={`step-${index}`} className={styles.step}>
      <span
        aria-hidden="true"
        className={cn("grain", styles.bead)}
        style={grainStyle(`step-${index}`) as CSSProperties}
      >
        {toFaDigits(index)}
      </span>
      <div className={styles.body}>
        {title ? <p className={styles.title}>{title}</p> : null}
        {children}
      </div>
    </li>
  );
}
