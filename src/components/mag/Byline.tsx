import Link from "next/link";
import type { MagPerson } from "@/db/queries/mag";
import { Icon } from "@/components/ui/Icon";
import { formatJalali, toFaDigits } from "@/lib/format";
import { dateTehran, isoTehran } from "@/lib/seo";
import { cn } from "@/lib/utils";

/*
 * Byline (DESIGN.md §7.3 #3, SEO.md §4.3): who wrote it, who checked it, when, and how long it
 * takes to read. Collective authors read «تحریریهٔ چوبز»; placeholder people never render (the
 * byline falls back to the editorial team and the reviewer slot stays empty). A named reviewer
 * gets the sage «بازبینی علمی» stamp; a collective one (the workshop) is a technical check and
 * says so. Dates are Jalali in <time dateTime> with the machine value at +03:30.
 */

export const EDITORIAL_NAME = "تحریریهٔ چوبز";

type BylineProps = {
  author: MagPerson | null;
  reviewer: MagPerson | null;
  publishedAt: string | null;
  updatedAt: string | null;
  reviewedAt: string | null;
  readingMinutes: number;
  className?: string;
};

/** The name the page shows for an author: collective and missing authors are the editorial team. */
export function authorLabel(author: MagPerson | null): { name: string; role: string | null; href: string | null } {
  if (!author || author.isPlaceholder) return { name: EDITORIAL_NAME, role: null, href: null };
  if (author.isOrganization) return { name: EDITORIAL_NAME, role: null, href: `/team/${author.slug}` };
  return { name: author.name, role: author.jobTitle ?? author.role, href: `/team/${author.slug}` };
}

/** Reviewer the page may name, or null (placeholders never show). */
export function shownReviewer(reviewer: MagPerson | null): MagPerson | null {
  return reviewer && !reviewer.isPlaceholder ? reviewer : null;
}

function JalaliTime({ value }: { value: string }) {
  return <time dateTime={isoTehran(value)}>{formatJalali(new Date(value))}</time>;
}

export function Byline({ author, reviewer, publishedAt, updatedAt, reviewedAt, readingMinutes, className }: BylineProps) {
  const writer = authorLabel(author);
  const checker = shownReviewer(reviewer);
  // The update line appears only once the content changed on a later (Tehran) day than it went out.
  const updated = updatedAt && publishedAt && dateTehran(updatedAt) > dateTehran(publishedAt) ? updatedAt : null;

  return (
    <div className={cn("flex flex-col gap-2 border-y border-line py-3 text-sm text-muted", className)}>
      <p className="flex flex-wrap items-center gap-x-1.5">
        <Icon name="pencil" className="size-4 text-ink" />
        <span>نوشتهٔ</span>
        {writer.href ? (
          <Link href={writer.href} rel="author" className="link-mark font-semibold text-ink">
            {writer.name}
          </Link>
        ) : (
          <span className="font-semibold text-ink">{writer.name}</span>
        )}
        {writer.role ? <span>، {writer.role}</span> : null}
      </p>

      {checker ? (
        <p className="flex flex-wrap items-center gap-x-1.5">
          <span className="inline-flex items-center gap-1 rounded-bit-xs border border-current px-1.5 text-xs font-bold text-success">
            <Icon name="shield-leaf" className="size-3.5" />
            {checker.isOrganization ? "بازبینی فنی" : "بازبینی علمی"}
          </span>
          <Link href={`/team/${checker.slug}`} className="link-mark font-semibold text-ink">
            {checker.name}
          </Link>
          {!checker.isOrganization && (checker.jobTitle ?? checker.role) ? <span>، {checker.jobTitle ?? checker.role}</span> : null}
          {reviewedAt ? (
            <>
              <span aria-hidden="true">·</span>
              <JalaliTime value={reviewedAt} />
            </>
          ) : null}
        </p>
      ) : null}

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {publishedAt ? (
          <span>
            انتشار: <JalaliTime value={publishedAt} />
          </span>
        ) : null}
        {updated ? (
          <>
            <span aria-hidden="true">·</span>
            <span>
              به‌روزرسانی: <JalaliTime value={updated} />
            </span>
          </>
        ) : null}
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <Icon name="clock" className="size-4" />
          {toFaDigits(readingMinutes)} دقیقه مطالعه
        </span>
      </p>
    </div>
  );
}
