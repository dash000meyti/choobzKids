import { AGE_HUBS, AGE_STAGES, type AgeHubSlug, type AgeStageKey } from "@/lib/ages";

/*
 * Fixed tint classes for chips and badges. Age bands and accent tints are light in both themes,
 * so text on them is always walnut (`text-gerdu`), never the theme ink (DESIGN.md §2.1, §2.3).
 * Class strings are written out in full so Tailwind can see them.
 */

export const AGE_TINT: Record<AgeStageKey, string> = {
  "0-6m": "bg-age-0-6m text-gerdu",
  "6-12m": "bg-age-6-12m text-gerdu",
  "1-2y": "bg-age-1-2y text-gerdu",
  "2-3y": "bg-age-2-3y text-gerdu",
  "3-6y": "bg-age-3-6y text-gerdu",
};

/** `categories.accent` / `topics.accent` keys → tint face with walnut text. */
export const ACCENT_TINT = {
  terracotta: "bg-terracotta-tint text-gerdu",
  wood: "bg-wood-tint text-gerdu",
  sage: "bg-sage-tint text-gerdu",
  mustard: "bg-mustard-tint text-gerdu",
  sky: "bg-sky-tint text-gerdu",
  plum: "bg-plum-tint text-gerdu",
  mint: "bg-mint-tint text-gerdu",
  cream: "bg-cream-tint text-gerdu",
} as const;

export type AccentKey = keyof typeof ACCENT_TINT;

export function isAccentKey(value: string | null | undefined): value is AccentKey {
  return value != null && value in ACCENT_TINT;
}

/** The age band a product's minimum age falls into (≥ 6 years stays in the oldest band). */
export function ageStageFor(months: number): AgeStageKey {
  const stage = AGE_STAGES.find((s) => months >= s.minMonths && months < s.maxMonths);
  return stage?.key ?? (months < 0 ? "0-6m" : "3-6y");
}

/** The age hub page that covers an age in months (`/age/{slug}`). */
export function ageHubFor(months: number): AgeHubSlug {
  const hub = AGE_HUBS.find((h) => months >= h.minMonths && months < h.maxMonths);
  return hub?.slug ?? (months < 0 ? "0-12-months" : "3-6-years");
}
