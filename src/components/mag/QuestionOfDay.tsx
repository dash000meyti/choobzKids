import Link from "next/link";
import type { DailyQuestion } from "@/db/queries/mag";
import { Bubble } from "@/components/ui/Bubble";
import { Kicker } from "@/components/ui/Kicker";
import { cn } from "@/lib/utils";

/*
 * «سؤال امروز» (DESIGN.md §7.1): one large mint bubble — a mother's question, the short answer
 * from the article's FAQ, and a link to the full guide. The pick rotates by day inside a
 * `cacheLife('days')` query (getQuestionOfDay), so the static page changes without request work.
 */

type QuestionOfDayProps = {
  item: DailyQuestion | null;
  className?: string;
};

export function QuestionOfDay({ item, className }: QuestionOfDayProps) {
  if (!item) return null;
  return (
    <section aria-labelledby="question-of-day" className={cn("max-w-narrow", className)}>
      <Bubble size="lg" className="sm:px-8 sm:py-7">
        <Kicker as="p" tone="success" doodle="sprout">
          سؤال امروز
        </Kicker>
        <h2 id="question-of-day" className="mt-2 text-xl font-bold text-ink text-balance">
          {item.question}
        </h2>
        <p className="mt-3 max-w-prose text-base text-ink">{item.answer}</p>
        <p className="mt-4">
          <Link
            href={`/mag/${item.post.slug}#faq`}
            transitionTypes={["nav-forward"]}
            className="link-mark py-2 text-sm font-semibold text-ink"
          >
            جواب کامل در «{item.post.shortTitle}» ←
          </Link>
        </p>
      </Bubble>
    </section>
  );
}
