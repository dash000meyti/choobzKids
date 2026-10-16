/*
 * Persian formatting helpers. Everything user-facing uses Persian digits;
 * machine-readable output (schema.org, sitemaps, URLs) keeps Latin digits.
 */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Converts Latin (and Arabic-Indic) digits in a string to Persian digits. */
export function toFaDigits(input: string | number): string {
  return String(input)
    .replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)])
    .replace(/[٠-٩]/g, (d) => FA_DIGITS[d.charCodeAt(0) - 0x0660]);
}

/** Converts Persian/Arabic-Indic digits back to Latin digits. */
export function toEnDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

const groupFormatter = new Intl.NumberFormat("en-US");

/** 1250000 → "۱٬۲۵۰٬۰۰۰" (Persian thousands separator). */
export function formatNumber(value: number): string {
  return toFaDigits(groupFormatter.format(value)).replace(/,/g, "٬");
}

/** 1250000 → "۱٬۲۵۰٬۰۰۰ تومان" */
export function formatToman(value: number, withUnit = true): string {
  return withUnit ? `${formatNumber(value)} تومان` : formatNumber(value);
}

/** Toman → Rial (ISO 4217 IRR) for structured data. */
export function tomanToRial(value: number): number {
  return value * 10;
}

/** Splits a total into SnappPay-style equal installments (rounded up to 1,000 Toman). */
export function installments(total: number, count = 4): number {
  return Math.ceil(total / count / 1000) * 1000;
}

/** Discount percentage, rounded. */
export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** Months → human Persian age, e.g. 18 → "۱٫۵ سال", 8 → "۸ ماه". */
export function formatAgeMonths(months: number): string {
  if (months < 12) return `${toFaDigits(months)} ماه`;
  const years = months / 12;
  const rounded = Number.isInteger(years) ? String(years) : years.toFixed(1).replace(".", "٫");
  return `${toFaDigits(rounded)} سال`;
}

/** Age range label: (12, 72) → "۱ تا ۶ سال". */
export function formatAgeRange(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max == null) return `از ${formatAgeMonths(min)} به بالا`;
  if (min == null && max != null) return `تا ${formatAgeMonths(max)}`;
  const bothYears = min! >= 12 && max! >= 12;
  if (bothYears) {
    const a = formatAgeMonths(min!).replace(" سال", "");
    return `${a} تا ${formatAgeMonths(max!)}`;
  }
  return `${formatAgeMonths(min!)} تا ${formatAgeMonths(max!)}`;
}

const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Tehran",
});

/** Jalali date, e.g. "۲۴ مهر ۱۴۰۵". */
export function formatJalali(date: Date): string {
  return dateFormatter.format(date);
}

/** Normalises Arabic ي/ك to Persian ی/ک and trims ZWNJ noise — for search & slugs. */
export function normalizeFa(input: string): string {
  return input
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/‌+/g, "‌")
    .replace(/\s+/g, " ")
    .trim();
}

/** Reading time estimate for Persian text (~200 words/minute). */
export function readingMinutes(markdown: string): number {
  const words = markdown.replace(/[#>*_`\-[\]()!|]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
