import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * The mother's mint speech bubble (DESIGN.md §4.12): questions, TL;DR, tips, Tati's greeting.
 * Story layer: ink text on mint, rounded like cut paper, with its tail at inline-start.
 */

type BubbleProps = {
  children: ReactNode;
  as?: "div" | "aside" | "section" | "blockquote" | "p";
  /** `none` for bubbles inside popovers that draw their own pointer. */
  tail?: "start" | "none";
  /** Padding: `sm` for one-liners, `md` default, `lg` for TL;DR blocks. */
  size?: "sm" | "md" | "lg";
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className">;

const PADDING = { sm: "px-4 py-3", md: "px-5 py-4", lg: "px-6 py-5" } as const;

export function Bubble({ children, as: Tag = "div", tail = "start", size = "md", className, ...rest }: BubbleProps) {
  return (
    <Tag
      {...rest}
      className={cn("relative rounded-bit-lg bg-bubble text-ink", PADDING[size], tail !== "none" && "mb-3.5", className)}
    >
      {children}
      {tail !== "none" ? (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 16"
          // Drawn for LTR (leaning toward the left = start); mirrored under RTL.
          className="pointer-events-none absolute start-6 top-full -mt-px h-4 w-6 fill-bubble rtl:-scale-x-100"
        >
          <path d="M3 0h15C14.6 5.4 9.6 11.4 1.6 15.6 4.8 10.4 5.6 5.4 3 0z" />
        </svg>
      ) : null}
    </Tag>
  );
}
