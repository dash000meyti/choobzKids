import Link from "@/components/ui/Link";
import type { MagPerson } from "@/db/queries/mag";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { authorLabel, shownReviewer } from "./Byline";
import { PersonPortrait } from "./ExpertsRow";

/*
 * Author box (DESIGN.md §7.3 #11): arch portrait, name, role, credential chips, a short bio, the
 * reviewer line and «ما چطور می‌نویسیم ←». Collective and placeholder authors show as the
 * editorial team (with the team's own bio when it has one); nobody is invented.
 */

type AuthorBoxProps = {
  author: MagPerson | null;
  reviewer: MagPerson | null;
  className?: string;
};

const EDITORIAL_FALLBACK_BIO = "این مطلب را تیم محتوای چوبز کیدز نوشته است.";

export function AuthorBox({ author, reviewer, className }: AuthorBoxProps) {
  const writer = authorLabel(author);
  const person = author && !author.isPlaceholder ? author : null;
  const checker = shownReviewer(reviewer);
  const bio = person?.bio.trim() || EDITORIAL_FALLBACK_BIO;

  return (
    <aside aria-labelledby="author-box-h" className={cn("tray flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-5 sm:p-6", className)}>
      <PersonPortrait name={writer.name} avatar={person?.avatar ?? null} size={72} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-xs font-semibold text-muted">نویسنده</p>
        <h2 id="author-box-h" className="text-lg font-bold text-ink">
          {writer.href ? (
            <Link href={writer.href} rel="author" className="link-mark">
              {writer.name}
            </Link>
          ) : (
            writer.name
          )}
        </h2>
        {writer.role ? <p className="text-sm text-muted">{writer.role}</p> : null}
        {person && !person.isOrganization && person.credentials.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {person.credentials.map((credential) => (
              <li key={credential} className="rounded-bead bg-raised px-2.5 py-0.5 text-xs text-ink shadow-[inset_0_0_0_1px_var(--line)]">
                {credential}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-sm text-ink">{bio}</p>
        {checker ? (
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
            <Icon name="shield-leaf" className="size-4 text-success" />
            {checker.isOrganization ? "بازبینی فنی:" : "بازبینی علمی:"}
            <Link href={`/team/${checker.slug}`} className="link-mark font-semibold text-ink">
              {checker.name}
            </Link>
          </p>
        ) : null}
        <Link
          href="/editorial-policy"
          className="mt-1 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-ink"
        >
          <span className="link-mark">ما چطور می‌نویسیم</span>
          <Icon name="arrow-end" className="size-4" />
        </Link>
      </div>
    </aside>
  );
}
