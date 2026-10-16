import Link from "next/link";
import { formatAgeMonths, formatAgeRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AGE_TINT, ageHubFor, ageStageFor } from "./tints";

/*
 * Small hexagon with the product's age range in its age-band tint (DESIGN.md §4.10):
 * «۱٫۵ سال+» when only a minimum is known, «۱٫۵ تا ۵ سال» for a range.
 * With `link`, it goes to the age hub that covers the minimum age — use that only where the
 * badge stands alone (inside a stretched-link card it must stay plain text).
 */

type AgeBadgeProps = {
  min: number | null | undefined;
  max?: number | null;
  link?: boolean;
  className?: string;
};

const HEX = "[clip-path:polygon(0.5rem_0,calc(100%-0.5rem)_0,100%_50%,calc(100%-0.5rem)_100%,0.5rem_100%,0_50%)]";

export function ageBadgeLabel(min: number | null | undefined, max?: number | null): string | null {
  if (min != null && min > 0 && max == null) return `${formatAgeMonths(min)}+`;
  // «تا ۶ ماه» reads better than «۰ ماه تا ۶ ماه» for products usable from birth.
  return formatAgeRange(min === 0 ? null : min, max);
}

export function AgeBadge({ min, max, link, className }: AgeBadgeProps) {
  const label = ageBadgeLabel(min, max);
  if (!label) return null;
  const anchorMonths = min ?? Math.max(0, (max ?? 1) - 1);
  const classes = cn(
    "inline-flex h-6 items-center px-3 text-xs font-semibold leading-none whitespace-nowrap",
    HEX,
    AGE_TINT[ageStageFor(anchorMonths)],
    className,
  );

  if (!link) return <span className={classes}>{label}</span>;
  // The hexagon is clipped, so the link (focus ring, 44px hit area) wraps it unclipped.
  return (
    <Link
      href={`/age/${ageHubFor(anchorMonths)}`}
      className="-my-2.5 inline-flex rounded-bit-xs py-2.5"
      aria-label={`مناسب ${label} · راهنمای این سن`}
    >
      <span className={classes}>{label}</span>
    </Link>
  );
}
