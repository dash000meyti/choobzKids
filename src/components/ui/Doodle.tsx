import { cn } from "@/lib/utils";

/*
 * The mother's hand (DESIGN.md §3.5): pencil marks from /marks.svg.
 * Rules: ≤ 2 per viewport; never on prices, legal text, forms or product facts; never animated
 * (except the sprout "grow" on <details> open, which the caller owns). Always decorative.
 */

/** Symbol name → viewBox size, so the outer <svg> keeps each mark's proportions. */
export const DOODLE_VIEWBOX = {
  sprout: [32, 32],
  "sprout-pair": [44, 32],
  heart: [32, 32],
  star: [32, 32],
  sparkle: [32, 32],
  "scribble-circle": [64, 40],
  "underline-scribble": [96, 16],
  "arrow-curve-rtl": [48, 32],
  "arrow-curve-ltr": [48, 32],
  "motion-ticks": [32, 32],
  bang: [32, 32],
  "pencil-check": [32, 32],
  "little-house": [32, 32],
  bow: [40, 32],
  raindrop: [32, 32],
  sun: [32, 32],
} as const satisfies Record<string, readonly [number, number]>;

export type DoodleName = keyof typeof DOODLE_VIEWBOX;

export const DOODLE_NAMES = Object.keys(DOODLE_VIEWBOX) as DoodleName[];

type DoodleProps = {
  name: DoodleName;
  className?: string;
  /**
   * `ink` = pencil at 70% (muted in dark mode), the default. `accent`/`success` for kickers.
   * `inherit` leaves colour to the caller's `className`.
   */
  tone?: "ink" | "accent" | "success" | "inherit";
};

const TONE: Record<NonNullable<DoodleProps["tone"]>, string | undefined> = {
  ink: "text-ink/70 dark:text-muted",
  accent: "text-accent",
  success: "text-success",
  inherit: undefined,
};

export function Doodle({ name, className, tone = "ink" }: DoodleProps) {
  const [w, h] = DOODLE_VIEWBOX[name];
  // Default height 1.5em (24px at body size); width follows the mark's aspect ratio.
  const height = 1.5;
  return (
    <svg
      width={`${+((height * w) / h).toFixed(3)}em`}
      height={`${height}em`}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("pointer-events-none shrink-0", TONE[tone], className)}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`/marks.svg#${name}`} />
    </svg>
  );
}
