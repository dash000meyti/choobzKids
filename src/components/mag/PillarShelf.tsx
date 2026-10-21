import Link from "next/link";
import type { PillarGuide } from "@/db/queries/mag";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StampBadge } from "@/components/ui/StampBadge";
import { ACCENT_TINT, isAccentKey } from "@/components/ui/tints";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import styles from "./PillarShelf.module.css";

/*
 * Pillar shelf (DESIGN.md §7.1): each topic's complete guide as a notebook standing on a ply
 * shelf, covered in its topic's accent tint, with a paper label and the «راهنمای کامل» stamp.
 * The notebooks are links on a laminated edge (raised = tappable). Phones scroll the shelf
 * sideways inside itself; wide screens fit the whole shelf.
 */

type PillarShelfProps = {
  pillars: PillarGuide[];
  className?: string;
};

export function PillarShelf({ pillars, className }: PillarShelfProps) {
  if (!pillars.length) return null;
  return (
    <section aria-labelledby="pillar-shelf" className={cn("flex flex-col gap-6", className)}>
      <SectionHeader
        id="pillar-shelf"
        kicker="از کجا شروع کنیم؟"
        title="راهنماهای کامل"
        sub="هر موضوع یک راهنمای جامع دارد؛ از همین‌جا شروع کنید و قدم‌به‌قدم جلو بروید."
      />
      <div className={styles.shelf}>
        <ul className={cn("no-scrollbar", styles.row)}>
          {pillars.map((pillar) => (
            <li key={pillar.id} className={styles.slot}>
              <Notebook pillar={pillar} />
            </li>
          ))}
        </ul>
        <span aria-hidden="true" className={cn("ply-band", styles.lip)} />
      </div>
    </section>
  );
}

function Notebook({ pillar }: { pillar: PillarGuide }) {
  const accent = pillar.topic?.accent;
  // «مونته‌سوری در خانه» over «مونته‌سوری در خانه» says nothing: name the topic only when it adds something.
  const topicName =
    pillar.topic && !pillar.shortTitle.includes(pillar.topic.name) && !pillar.topic.name.includes(pillar.shortTitle)
      ? pillar.topic.name
      : null;
  return (
    <Link
      href={`/mag/${pillar.slug}`}
      transitionTypes={["nav-forward"]}
      className={cn(styles.notebook, isAccentKey(accent) ? ACCENT_TINT[accent] : ACCENT_TINT.wood)}
    >
      <span aria-hidden="true" className={styles.elastic} />
      <StampBadge tone="ink" className={styles.stamp}>
        راهنمای کامل
      </StampBadge>
      <span className={styles.label}>
        {topicName ? <span className="text-2xs font-semibold text-muted">{topicName}</span> : null}
        <span className="text-sm leading-snug font-bold text-balance">{pillar.shortTitle}</span>
      </span>
      <span className="mt-auto text-2xs font-semibold opacity-80">
        <span className="sr-only">زمان مطالعه: </span>
        {toFaDigits(pillar.readingMinutes)} دقیقه
      </span>
    </Link>
  );
}
