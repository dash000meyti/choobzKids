import Link from "@/components/ui/Link";
import type { PillarGuide } from "@/db/queries/mag";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * Complete guides: each topic's pillar article as a quiet numbered card (Studio style).
 * Phones scroll the row sideways; wide screens show a grid.
 */

type PillarShelfProps = {
  pillars: PillarGuide[];
  className?: string;
};

export function PillarShelf({ pillars, className }: PillarShelfProps) {
  if (!pillars.length) return null;
  return (
    <section aria-labelledby="pillar-shelf" className={cn("flex flex-col gap-6", className)}>
      <div>
        <p className="eyebrow">از کجا شروع کنیم؟</p>
        <h2 id="pillar-shelf" className="headline mt-2 text-[2rem] lg:text-[3rem]">
          راهنماهای کامل.
        </h2>
        <p className="mt-2 text-muted">هر موضوع یک راهنمای جامع دارد؛ از همین‌جا شروع کنید و قدم‌به‌قدم جلو بروید.</p>
      </div>
      <ul className="cells sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((pillar, i) => (
          <li key={pillar.id}>
            <Link
              href={`/mag/${pillar.slug}`}
              transitionTypes={["nav-forward"]}
              className="cell-hover flex h-full flex-col p-6 lg:p-7"
            >
              <span className="text-sm font-bold tabular-nums text-muted">{toFaDigits(String(i + 1).padStart(2, "0"))}</span>
              {pillar.topic ? <span className="mt-4 text-xs font-semibold text-muted">{pillar.topic.name}</span> : null}
              <span className="mt-1 text-lg font-bold leading-snug text-ink">{pillar.shortTitle}</span>
              <span className="mt-auto pt-5 text-xs text-muted">{toFaDigits(pillar.readingMinutes)} دقیقه مطالعه</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
