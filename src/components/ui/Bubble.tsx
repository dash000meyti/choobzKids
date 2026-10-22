import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * A quiet highlighted block (questions, TL;DR, pull quotes): Studio grey card, generous radius,
 * no speech-bubble tail — the storybook tail of the first design is gone. `tail` is accepted for
 * compatibility and ignored.
 */

type BubbleProps = {
  children: ReactNode;
  as?: "div" | "aside" | "section" | "blockquote" | "p";
  /** Ignored (kept for older call sites). */
  tail?: "start" | "none";
  /** Padding: `sm` for one-liners, `md` default, `lg` for TL;DR blocks. */
  size?: "sm" | "md" | "lg";
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className">;

const PADDING = { sm: "px-4 py-3", md: "px-6 py-5", lg: "px-7 py-6" } as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- `tail` is deliberately dropped
export function Bubble({ children, as: Tag = "div", tail, size = "md", className, ...rest }: BubbleProps) {
  return (
    <Tag {...rest} className={cn("relative rounded-[1.5rem] bg-surface text-ink", PADDING[size], className)}>
      {children}
    </Tag>
  );
}
