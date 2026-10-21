import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { DoodleName } from "./Doodle";

/*
 * The decorative half of a two-layer heading (DESIGN.md §1.2 law 5, §4.12): a Mikhak line in the
 * story voice above a plain keyword H1/H2. Poetry lives here, never in the heading itself.
 */

type KickerProps = {
  children: ReactNode;
  tone?: "accent" | "success" | "muted";
  /** A pencil mark at inline-start, e.g. "sprout". Counts toward the ≤ 2 marks per viewport. */
  doodle?: DoodleName;
  /**
   * Purely decorative lines (e.g. «فصل یکم · بازی») are hidden from assistive tech because the
   * heading below already says it plainly.
   */
  decorative?: boolean;
  as?: "p" | "span" | "div";
  className?: string;
};

/**
 * Studio direction: every kicker is the same small eyebrow line; tone and doodle are accepted for
 * compatibility but no longer change the look.
 */
export function Kicker({ children, decorative, as: Tag = "p", className }: KickerProps) {
  return (
    <Tag className={cn("eyebrow", className)} aria-hidden={decorative || undefined}>
      {children}
    </Tag>
  );
}
