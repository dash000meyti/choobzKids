import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * The header and dock icons, inline (DESIGN.md §3.8: "header/dock icons are inline") so the
 * chrome never waits for the sprite. Same pencil geometry as /icons.svg; stroke and colour come
 * from here and follow currentColor. None of these are directional, so none mirror.
 */

export type NavIconName = "search" | "menu" | "moon" | "sun" | "home" | "shelf" | "hex" | "notebook" | "chevron-down";

const PATHS: Record<NavIconName, ReactNode> = {
  search: (
    <>
      <circle cx="10.4" cy="10.4" r="6.2" />
      <path d="M15.2 15.3q2.6 2.3 5 5" />
    </>
  ),
  menu: <path d="M4 7q8-.5 16 0M4 12.2q8 .4 16-.2M4 17.2q7.5-.4 16 .1" />,
  moon: <path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.3 6.3 0 0 0 10.1 10.1z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" />
    </>
  ),
  home: <path d="M3.8 11.6q4.2-3.9 8.2-7.2 4.1 3.4 8.2 7.2M6.2 9.8v9.8q5.8.2 11.6 0V9.8M10 19.6v-4.8q2-.2 4 0v4.8" />,
  shelf: <path d="M5 3.6v17M19 3.6v17M5 9.2h14M5 14.9h14M5 20.4h14M8 9.1V5.6M10.4 9.1V6.6M13.6 14.8l.6-3.6 1.8.3-.5 3.3M8.2 14.8q-.3-2 .4-3.4" />,
  hex: <path d="M8 4.6h8.1l3.9 7.4-4 7.4H8L4 12z" />,
  notebook: (
    <>
      <rect x="6.5" y="3.5" width="13" height="17" rx="2" />
      <path d="M4.2 7.6h3.6M4.2 12h3.6M4.2 16.4h3.6M10.6 8.4q2.6-.2 5.4 0M10.6 11.8q2-.2 4 0" />
    </>
  ),
  "chevron-down": <path d="M6 9.2q3.1 3.3 6 6.1 2.9-2.7 6-6.1" />,
};

function Svg({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      width="1.5em"
      height="1.5em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      {children}
    </svg>
  );
}

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  return <Svg className={className}>{PATHS[name]}</Svg>;
}

/* Parcels stacked on the cart, in the order they are loaded: two on the bed, then one on each. */
const PARCELS = [
  "M7.6 14.3V9.6q2.6-.2 5.2 0v4.7M10.2 9.6v1.8",
  "M13.4 14.3v-3.9q2.9-.2 5.8 0v3.9M16.3 10.4v1.6",
  "M8.4 9.5V5.7q2-.2 4 0v3.8M10.4 5.7v1.4",
  "M14.2 10.3V7.3q2.2-.2 4.4 0v3",
];

/**
 * Tati's cart without Tati (DESIGN.md §3.8): a pull-cart whose parcels show what is in the cart,
 * one to four (a count badge says the rest). Never mirrored: the handle always points left.
 */
export function CartGlyph({ parcels, className }: { parcels: number; className?: string }) {
  const shown = Math.max(0, Math.min(PARCELS.length, Math.floor(parcels)));
  return (
    <Svg className={className}>
      <rect x="5.6" y="14.4" width="15.6" height="2.3" rx="1.15" />
      <circle cx="9.2" cy="19.4" r="1.9" />
      <circle cx="17.6" cy="19.4" r="1.9" />
      <path d="M5.6 15.6q-2.6 0-3-3.3" />
      <circle cx="2.6" cy="11.6" r=".8" fill="currentColor" />
      {PARCELS.slice(0, shown).map((d) => (
        <path key={d} d={d} />
      ))}
    </Svg>
  );
}
