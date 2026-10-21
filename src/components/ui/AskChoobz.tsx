import type { SiteSettings } from "@/db/queries/settings";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

/*
 * «پرسش قبل از خرید» (DESIGN.md §4.12, §11.2 #18): a quiet grey card that sends the mother straight to
 * the workshop on Bale (consult button) or Instagram DM (quiet). Each channel renders only when
 * its setting exists; with neither, nothing renders. Response hours are not in settings yet ⚑,
 * so they appear only when the caller passes them.
 */

type AskChoobzProps = {
  socials: SiteSettings["socials"];
  /** One-line version for buy bars and drawers. */
  compact?: boolean;
  /** Overrides the default question. */
  title?: string;
  /** e.g. «پاسخ‌گویی شنبه تا پنج‌شنبه، ۹ تا ۱۸» ⚑ */
  hours?: string;
  className?: string;
};

function instagramDm(socials: SiteSettings["socials"]): string | null {
  if (socials.instagramHandle) return `https://ig.me/m/${encodeURIComponent(socials.instagramHandle)}`;
  return socials.instagram;
}

export function AskChoobz({ socials, compact, title, hours, className }: AskChoobzProps) {
  const bale = socials.bale;
  const instagram = instagramDm(socials);
  if (!bale && !instagram) return null;

  const heading = title ?? "سؤالی داری؟ قبل از خرید از خودِ کارگاه بپرس";

  return (
    <aside className={cn("rounded-[1.5rem] bg-surface", compact ? "p-4" : "p-6", className)}>
      <div className={cn("flex gap-3", compact ? "flex-wrap items-center justify-between" : "flex-col")}>
        <p className={cn("font-semibold text-ink", compact ? "text-sm" : "text-base")}>{heading}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {bale ? (
            <Button variant="consult" size={compact ? "sm" : "md"} href={bale} target="_blank" rel="noopener" iconStart="bale">
              پرسیدن در بله
            </Button>
          ) : null}
          {instagram ? (
            <Button variant="quiet" size="sm" href={instagram} target="_blank" rel="noopener" iconStart="instagram">
              دایرکت اینستاگرام
            </Button>
          ) : null}
        </div>
        {hours && !compact ? <p className="text-xs text-muted">{hours}</p> : null}
      </div>
    </aside>
  );
}
