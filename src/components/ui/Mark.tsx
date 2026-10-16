import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Mark.module.css";

/*
 * The mother's mustard highlighter behind one word of one headline (DESIGN.md §3.5).
 * ≤ 1 per viewport, never on prices, never under coloured text (only ink/muted on the swash).
 */
export function Mark({ children, paint = true, className }: { children: ReactNode; paint?: boolean; className?: string }) {
  return <span className={cn("mark-swash", paint && styles.paint, className)}>{children}</span>;
}
