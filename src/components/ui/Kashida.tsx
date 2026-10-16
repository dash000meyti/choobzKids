import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Kashida.module.css";

/*
 * One word set in Mikhak that does the kashida pull (DESIGN.md §1.3): used in exactly four
 * places (Tati's name tag, the chosen height mark, the engraver, «رسید» in TheEnd).
 * The DOM text stays clean — never type «ـ»; the stretch comes from the font's KSHD axis.
 */

export type KashidaTrigger = "view" | "hover" | "checked" | "manual" | "none";

type KashidaProps = {
  children: ReactNode;
  /**
   * `view` once as it scrolls in · `hover` with the nearest `.group` · `checked` when its label's
   * input is checked · `manual` when an island sets `data-pulling` · `none` static stretch.
   */
  trigger?: KashidaTrigger;
  /** Resting KSHD value (100–200). */
  stretch?: number;
  className?: string;
};

export function Kashida({ children, trigger = "view", stretch, className }: KashidaProps) {
  return (
    <span
      className={cn("kashida", trigger !== "none" && styles[trigger], className)}
      style={stretch ? ({ "--kshd": stretch } as CSSProperties) : undefined}
    >
      {children}
    </span>
  );
}
