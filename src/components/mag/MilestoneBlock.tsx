import Link from "@/components/ui/Link";
import { Prose } from "@/components/mag/Prose";
import { Icon } from "@/components/ui/Icon";
import type { AgeReviewer } from "@/db/queries/age";
import type { Source } from "@/db/schema";
import { formatNumber, toFaDigits } from "@/lib/format";
import { splitLead } from "@/components/studio/Highlight";
import { cn } from "@/lib/utils";

/*
 * The age hub's milestone summary (DESIGN.md §7.5, SEO.md §1.5): YMYL text, so it carries its
 * reviewer — only a real, published one (placeholder people never render) — a pointer to the
 * sources at the foot of the page, and the medical note. `HubSources` is that numbered list.
 */

type MilestoneBlockProps = {
  /** Question-form H2, e.g. «کودک ۱ تا ۳ ساله چطور رشد می‌کند؟». */
  title: string;
  /** Markdown intro from settings.age_hubs. */
  intro: string;
  reviewer: AgeReviewer | null;
  sourceCount: number;
  className?: string;
};

/** Bold the opening phrase of the first paragraph («سال اول، سال حرکت روی زمین است:») — the rest reads quieter. */
function emphasizeOpening(markdown: string): string {
  const [first, ...rest] = markdown.split(/\n{2,}/);
  if (!first || first.includes("**")) return markdown;
  const { lead, rest: tail } = splitLead(first);
  if (!lead || lead.includes("](")) return markdown;
  return [`**${lead}** ${tail}`, ...rest].join("\n\n");
}

export function MilestoneBlock({ title, intro, reviewer, sourceCount, className }: MilestoneBlockProps) {
  return (
    <section
      aria-labelledby="milestones-title"
      className={cn("grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20", className)}
    >
      <div className="reveal lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow">رشد کودک</p>
        <h2 id="milestones-title" className="headline mt-2 text-[2rem] lg:text-[2.75rem]">
          {title}
        </h2>
        {reviewer || sourceCount ? (
          <p className="mt-5 flex flex-col gap-1 text-sm text-muted">
            {reviewer ? (
              <span>
                بازبینی علمی:{" "}
                <Link href={`/team/${reviewer.slug}`} className="link-mark font-semibold text-ink">
                  {reviewer.name}
                </Link>
                {reviewer.role ? `، ${reviewer.role}` : null}
              </span>
            ) : null}
            {sourceCount ? (
              <a href="#sources" className="link-arrow">
                {formatNumber(sourceCount)} منبع در پایان صفحه
              </a>
            ) : null}
          </p>
        ) : null}
        <MedicalNote className="mt-6" />
      </div>
      <div className="frame-box p-7 text-muted lg:p-10 [&_strong]:text-ink">
        <Prose markdown={emphasizeOpening(intro)} variant="page" glossaryLinks className="max-w-prose" />
      </div>
    </section>
  );
}

/* «این مطلب جایگزین مشاورهٔ پزشک نیست.» (DESIGN.md §7.3 #8): plain paper, an info mark, no alarm. */
function MedicalNote({ className }: { className?: string }) {
  return (
    <aside
      aria-label="یادداشت پزشکی"
      className={cn("flex gap-3 rounded-[1.25rem] bg-surface px-4 py-3.5", className)}
    >
      <Icon name="info" className="mt-1 size-5 shrink-0 text-muted" />
      <p className="text-sm leading-7 text-muted">
        این مطلب جایگزین مشاورهٔ پزشک نیست. سن‌ها پنجره‌اند، نه مهلت؛ هر کودک با سرعت خودش رشد می‌کند.
      </p>
    </aside>
  );
}

/* «منابع»: numbered, each anchored #cite-n, the original titles kept in their own language. */
export function HubSources({ sources, className }: { sources: Source[]; className?: string }) {
  if (!sources.length) return null;
  return (
    <section id="sources" aria-labelledby="sources-title" className={cn("max-w-prose scroll-mt-24", className)}>
      <h2 id="sources-title" className="text-lg font-bold text-ink">
        منابع
      </h2>
      <ol className="mt-3 flex flex-col gap-2 text-sm text-muted">
        {sources.map((source, i) => (
          <li key={source.url} id={`cite-${i + 1}`} className="flex gap-2">
            <span className="shrink-0 font-semibold text-ink">{toFaDigits(i + 1)}.</span>
            <span className="flex min-w-0 flex-col [overflow-wrap:anywhere]">
              <a href={source.url} target="_blank" rel="noopener" className="link-mark self-start text-ink">
                <bdi lang="en" dir="ltr">
                  {source.title}
                </bdi>
              </a>
              {source.publisher ? (
                <bdi lang="en" dir="ltr" className="self-start text-xs">
                  {source.publisher}
                </bdi>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
