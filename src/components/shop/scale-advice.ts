import type { Dimensions } from "@/db/schema";
import { MEDIAN_HEIGHT_CM } from "@/lib/ages";
import { toFaDigits } from "@/lib/format";

/*
 * The scale tool's numbers (DESIGN.md §6.3 block 11), shared by the server-rendered tool
 * (ScaleCompare) and the HeightInputs island, so both say exactly the same thing.
 * Plain module: no server-only imports, safe in the client bundle.
 */

export type AgePreset = {
  months: number;
  heightCm: number;
  /** Radio label, «۱٫۵ سال». */
  label: string;
  /** «۱٫۵ سالگی», for sentences. */
  atAge: string;
};

/** «۱ سال · ۷۵» … «۴ سال · ۱۰۳»: WHO medians ⚑, always labelled «میانگین» with the source line. */
export const AGE_PRESETS: AgePreset[] = [
  { months: 12, label: "۱ سال", atAge: "۱ سالگی" },
  { months: 18, label: "۱٫۵ سال", atAge: "۱٫۵ سالگی" },
  { months: 24, label: "۲ سال", atAge: "۲ سالگی" },
  { months: 36, label: "۳ سال", atAge: "۳ سالگی" },
  { months: 48, label: "۴ سال", atAge: "۴ سالگی" },
].map((p) => ({ ...p, heightCm: MEDIAN_HEIGHT_CM[p.months] }));

/** The preset shown first: the first one at or past the product's minimum age (else the oldest). */
export function defaultPreset(ageMinMonths: number | null): AgePreset {
  const min = ageMinMonths ?? 0;
  return AGE_PRESETS.find((p) => p.months >= min) ?? AGE_PRESETS[AGE_PRESETS.length - 1];
}

/** Own-height input bounds, cm (a sitting infant to a tall six-year-old). */
export const CHILD_CM = { min: 45, max: 130 } as const;
export const CABINET_CM = { min: 60, max: 120, default: 90 } as const;

export type PlatformLevel = { name: string; heightCm: number };

const LEVEL_KEY = /^ارتفاع سکو \((.+)\)$/;

/** Adjustable platform heights from `dimensions.extra` («ارتفاع سکو (وسط)»: 38 …), low to high. */
export function platformLevels(dimensions: Dimensions | null): PlatformLevel[] {
  const levels = Object.entries(dimensions?.extra ?? {}).flatMap(([key, heightCm]) => {
    const match = LEVEL_KEY.exec(key.trim());
    return match ? [{ name: match[1], heightCm }] : [];
  });
  return levels.length > 1 ? levels.sort((a, b) => a.heightCm - b.heightCm) : [];
}

/*
 * ⚑ FORMULA TO VERIFY with the workshop and an occupational therapist before launch:
 * a toddler works comfortably when the counter is a little below elbow height, and elbow height
 * is about 0.6 × stature at 1.5–5 years. So the ideal platform is (cabinet − 0.6 × height), and
 * we recommend the closest real level. Check: 87 cm, cabinet 90 → 37.8 → the middle step (38).
 */
const ELBOW_RATIO = 0.6;

export function recommendLevel(childCm: number, cabinetCm: number, levels: PlatformLevel[]): PlatformLevel | null {
  if (!levels.length) return null;
  const ideal = cabinetCm - ELBOW_RATIO * childCm;
  return levels.reduce((best, level) =>
    Math.abs(level.heightCm - ideal) < Math.abs(best.heightCm - ideal) ? level : best,
  );
}

const cm = (value: number) => toFaDigits(String(Math.round(value * 10) / 10)).replace(".", "٫");

/** «برای قد ۸۷ سانت و کابینت ۹۰ سانتی، سکو رو روی پلهٔ وسط (۳۸ سانت) بذارید.» */
export function adviceSentence(childCm: number, cabinetCm: number, level: PlatformLevel): string {
  return `برای قد ${cm(childCm)} سانت و کابینت ${cm(cabinetCm)} سانتی، سکو رو روی پلهٔ ${level.name} (${cm(level.heightCm)} سانت) بذارید.`;
}
