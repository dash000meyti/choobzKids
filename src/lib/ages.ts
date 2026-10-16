/*
 * Age model shared by the home height door, age hubs, filters and the scale tool.
 * Heights are WHO Child Growth Standards medians (boys/girls averaged, rounded) ⚑ —
 * always labelled «میانگین» with the source line, and reviewed before launch.
 */

export const WHO_SOURCE = "منبع: استانداردهای رشد کودک سازمان جهانی بهداشت (WHO)";

/** Median length/height in cm by age in months (WHO). */
export const MEDIAN_HEIGHT_CM: Record<number, number> = {
  6: 67,
  12: 75,
  18: 82,
  24: 87,
  36: 96,
  48: 103,
  72: 116,
};

export type AgeStageKey = "0-6m" | "6-12m" | "1-2y" | "2-3y" | "3-6y";
export type AgeHubSlug = "0-12-months" | "1-3-years" | "3-6-years";

export type AgeStage = {
  key: AgeStageKey;
  label: string;
  minMonths: number;
  maxMonths: number;
  /** Pencil mark on the door frame. */
  markLabel: string;
  medianCm: number;
  milestone: string;
  hub: AgeHubSlug;
  /** Anchor inside the hub page. */
  hubAnchor: string;
  roomPreset: string;
};

export const AGE_STAGES: AgeStage[] = [
  {
    key: "0-6m",
    label: "۰ تا ۶ ماه",
    minMonths: 0,
    maxMonths: 6,
    markLabel: "۶ ماهگی · ۶۷ سانت",
    medianCm: 67,
    milestone: "دنیا رو از پایین نگاه می‌کنه؛ قفسهٔ کوتاه، کتاب‌های روبه‌رو و چند اسباب‌بازیِ ساده کافیه.",
    hub: "0-12-months",
    hubAnchor: "0-6-months",
    roomPreset: "first-months",
  },
  {
    key: "6-12m",
    label: "۶ تا ۱۲ ماه",
    minMonths: 6,
    maxMonths: 12,
    markLabel: "۱ سالگی · ۷۵ سانت",
    medianCm: 75,
    milestone: "وقتِ بالا کشیدن و ایستادنه؛ مثلث پیکلر بهترین رفیقشه.",
    hub: "0-12-months",
    hubAnchor: "6-12-months",
    roomPreset: "crawl-and-climb",
  },
  {
    key: "1-2y",
    label: "۱ تا ۲ سال",
    minMonths: 12,
    maxMonths: 24,
    markLabel: "۲ سالگی · ۸۷ سانت",
    medianCm: 87,
    milestone: "می‌خواد کمکت کنه! برج یادگیری می‌برتش کنار کابینت آشپزخونه.",
    hub: "1-3-years",
    hubAnchor: "1-2-years",
    roomPreset: "toddler-1-2",
  },
  {
    key: "2-3y",
    label: "۲ تا ۳ سال",
    minMonths: 24,
    maxMonths: 36,
    markLabel: "۳ سالگی · ۹۶ سانت",
    medianCm: 96,
    milestone: "کتابش رو خودش انتخاب می‌کنه؛ کتابخانهٔ روبه‌رو جلدها رو نشونش می‌ده.",
    hub: "1-3-years",
    hubAnchor: "2-3-years",
    roomPreset: "toddler-2-3",
  },
  {
    key: "3-6y",
    label: "۳ تا ۶ سال",
    minMonths: 36,
    maxMonths: 72,
    markLabel: "۶ سالگی · ۱۱۶ سانت",
    medianCm: 116,
    milestone: "انرژی‌ش تمومی نداره؛ دیوار صعود، میزِ خودش و رول نقاشیِ خودش.",
    hub: "3-6-years",
    hubAnchor: "3-4-years",
    roomPreset: "preschool-3-6",
  },
];

export type AgeHub = {
  slug: AgeHubSlug;
  label: string;
  h1: string;
  minMonths: number;
  maxMonths: number;
  sections: { anchor: string; label: string; minMonths: number; maxMonths: number }[];
};

export const AGE_HUBS: AgeHub[] = [
  {
    slug: "0-12-months",
    label: "۰ تا ۱۲ ماه",
    h1: "بازی و وسایل مناسب نوزاد ۰ تا ۱۲ ماه",
    minMonths: 0,
    maxMonths: 12,
    sections: [
      { anchor: "0-6-months", label: "۰ تا ۶ ماه", minMonths: 0, maxMonths: 6 },
      { anchor: "6-12-months", label: "۶ تا ۱۲ ماه", minMonths: 6, maxMonths: 12 },
    ],
  },
  {
    slug: "1-3-years",
    label: "۱ تا ۳ سال",
    h1: "بازی و وسایل مناسب کودک ۱ تا ۳ سال (نوپا)",
    minMonths: 12,
    maxMonths: 36,
    sections: [
      { anchor: "1-2-years", label: "۱ تا ۲ سال", minMonths: 12, maxMonths: 24 },
      { anchor: "2-3-years", label: "۲ تا ۳ سال", minMonths: 24, maxMonths: 36 },
    ],
  },
  {
    slug: "3-6-years",
    label: "۳ تا ۶ سال",
    h1: "بازی و وسایل مناسب کودک ۳ تا ۶ سال",
    minMonths: 36,
    maxMonths: 72,
    sections: [
      { anchor: "3-4-years", label: "۳ تا ۴ سال", minMonths: 36, maxMonths: 48 },
      { anchor: "4-6-years", label: "۴ تا ۶ سال", minMonths: 48, maxMonths: 72 },
    ],
  },
];

/** Shop filter buckets (`age` facet, values in months). */
export const AGE_FACETS = [
  { value: "0-6", label: "۰ تا ۶ ماه", min: 0, max: 6 },
  { value: "6-12", label: "۶ تا ۱۲ ماه", min: 6, max: 12 },
  { value: "12-24", label: "۱ تا ۲ سال", min: 12, max: 24 },
  { value: "24-36", label: "۲ تا ۳ سال", min: 24, max: 36 },
  { value: "36-72", label: "۳ تا ۶ سال", min: 36, max: 72 },
] as const;

/** True when a product's [min, max] months overlaps the range. */
export function overlapsAge(
  product: { ageMinMonths: number | null; ageMaxMonths: number | null },
  min: number,
  max: number,
): boolean {
  const pMin = product.ageMinMonths ?? 0;
  const pMax = product.ageMaxMonths ?? 999;
  return pMin < max && pMax > min;
}

/** Skill keys → Persian labels (SkillKey in src/db/seed/types.ts). */
export const SKILLS: Record<string, string> = {
  "gross-motor": "حرکتی درشت",
  "fine-motor": "حرکتی ظریف",
  balance: "تعادل",
  independence: "استقلال",
  "practical-life": "زندگی روزمره",
  creativity: "خلاقیت",
  language: "زبان",
  imagination: "تخیل",
  focus: "تمرکز",
  confidence: "اعتمادبه‌نفس",
};
