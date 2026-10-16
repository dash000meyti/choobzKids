import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * The three lettering phrases (DESIGN.md §2.4). They are meant to be
 * commissioned SVG lettering; until it is delivered they are set in Mikhak
 * stretched to KSHD 160 along its kashida axis. Purely decorative: each one is
 * aria-hidden, so the page must carry the same words as real text nearby
 * (a heading, a caption or an sr-only span with LETTERING[key]).
 */

export const LETTERING = {
  yekiBud: "یکی بود، یکی نبود…",
  ghesseTamoom: "قصهٔ ما به سر رسید…",
  nakhDarRaft: "نخ از دستمون در رفت!",
} as const;

export type LetteringProps = { className?: string };

export function Lettering({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("font-accent", className)} style={{ fontVariationSettings: '"KSHD" 160' }}>
      {children}
    </span>
  );
}
