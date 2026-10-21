import Link from "next/link";
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
        <h2 id="pillar-shelf" className="headline mt-1 text-2xl lg:text-[2.75rem]">
          راهنماهای کامل.
        </h2>
        <p className="mt-2 text-muted">هر موضوع یک راهنمای جامع دارد؛ از همین‌جا شروع کنید و قدم‌به‌قدم جلو بروید.</p>
      </div>
      <ul className="no-scrollbar -mx-gutter flex snap-x gap-3 overflow-x-auto px-gutter pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
        {pillars.map((pillar, i) => (
          <li key={pillar.id} className="w-[72vw] max-w-[20rem] shrink-0 snap-start lg:w-auto lg:max-w-none">
            <Link
              href={`/mag/${pillar.slug}`}
              transitionTypes={["nav-forward"]}
              className="flex h-full flex-col rounded-[1.5rem] bg-surface p-6 transition-transform duration-300 hover:scale-[1.01]"
            >
              <span className="text-sm font-bold tabular-nums text-muted">{toFaDigits(String(i + 1).padStart(2, "0"))}</span>
              {pillar.topic ? <span className="mt-4 text-xs font-semibold text-muted">{pillar.topic.name}</span> : null}
              <span className="mt-1 text-lg font-extrabold leading-snug text-ink">{pillar.shortTitle}</span>
              <span className="mt-auto pt-5 text-xs text-muted">{toFaDigits(pillar.readingMinutes)} دقیقه مطالعه</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
