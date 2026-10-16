import type { ReactNode } from "react";
import { AGE_TINT } from "@/components/ui/tints";
import type { AgeStageKey } from "@/lib/ages";
import { cn } from "@/lib/utils";
import { NavLink } from "./NavLink";
import styles from "./HexLink.module.css";

/*
 * An age link shaped like the hexagonal age chips (DESIGN.md §4.10): a clipped face in the age
 * band's tint on a honey ply edge, pressed 3px into it on activation. Used where the chips are
 * navigation rather than a choice: the mega menu's age column and the «فهرست» dialog.
 */

type HexLinkProps = {
  href: string;
  tint: AgeStageKey;
  children: ReactNode;
  className?: string;
};

export function HexLink({ href, tint, children, className }: HexLinkProps) {
  return (
    <NavLink href={href} className={cn(styles.hex, className)}>
      <span className={cn(styles.face, AGE_TINT[tint])}>{children}</span>
    </NavLink>
  );
}
