import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Kraft paper tag with a punched hole and a string (DESIGN.md §4.12): شناسنامه headers,
 * «ساخت سفارشی», and the «نمونه» sample label. Only ink/muted text sits on kraft (§2.3).
 * The tag point and hole face inline-start; the string is drawn outside the clipped tag.
 */

type KraftTagProps = {
  children: ReactNode;
  size?: "sm" | "md";
  /** The looping string through the hole. Off for tiny inline labels. */
  string?: boolean;
  as?: "span" | "p" | "div" | "h2" | "h3";
  className?: string;
};

/* Point at inline-start: right in RTL, left in LTR. */
const SHAPE =
  "rtl:[clip-path:polygon(0_0,calc(100%-0.6rem)_0,100%_50%,calc(100%-0.6rem)_100%,0_100%)] " +
  "ltr:[clip-path:polygon(0.6rem_0,100%_0,100%_100%,0.6rem_100%,0_50%)]";

const SIZE = {
  sm: "h-5 ps-4 pe-2 text-2xs",
  md: "h-8 ps-6 pe-3.5 text-sm",
} as const;

const HOLE = {
  sm: "before:start-1.5 before:size-1.5",
  md: "before:start-2.5 before:size-2",
} as const;

export function KraftTag({ children, size = "md", string = size === "md", as: Tag = "span", className }: KraftTagProps) {
  return (
    <Tag className={cn("relative inline-flex align-middle", className)}>
      <span
        className={cn(
          "relative inline-flex items-center rounded-e-bit-xs bg-tag leading-none font-bold whitespace-nowrap text-ink",
          "before:absolute before:top-1/2 before:-translate-y-1/2 before:rounded-full before:bg-bg before:shadow-[inset_0_1px_1px_rgb(var(--shadow-rgb)/.35)] before:content-['']",
          SHAPE,
          SIZE[size],
          HOLE[size],
        )}
      >
        {children}
      </span>
      {string ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute -start-2 top-1/2 size-6 -translate-y-[90%] text-ink/55 ltr:-scale-x-100"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
        >
          {/* Drawn for RTL: starts at the hole (this box's left edge), loops, and trails out past the point. */}
          <path d="M2 21.4C3 17 6 14.6 9.6 14.6c3.4 0 4.6 3.2 2.6 4.8-2.2 1.8-5-.6-3.4-4.2C10.6 11 15 7.4 22.4 6.4" />
        </svg>
      ) : null}
    </Tag>
  );
}
