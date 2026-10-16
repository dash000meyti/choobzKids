import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Doodle, type DoodleName } from "./Doodle";

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

const TONE = { accent: "text-accent", success: "text-success", muted: "text-muted" } as const;

export function Kicker({ children, tone = "accent", doodle, decorative, as: Tag = "p", className }: KickerProps) {
  return (
    <Tag
      className={cn("flex items-center gap-2 font-accent text-lead", TONE[tone], className)}
      aria-hidden={decorative || undefined}
    >
      {doodle ? <Doodle name={doodle} tone="inherit" className="h-[1.2em] w-auto opacity-80" /> : null}
      <span>{children}</span>
    </Tag>
  );
}
