import Link from "@/components/ui/Link";
import { illustrationSize } from "@/components/illustrations/sizes";
import type { TermCardData } from "@/db/queries/cards";
import { cn, illustrationUrl } from "@/lib/utils";
import styles from "./TermCard.module.css";

/*
 * TermCard (DESIGN.md §4.11, §7.4): a small raised card for one glossary term — a tiny ply-cut
 * drawing when the term names one of our products, the term in Ario, its original form in a
 * Latin island, and the definition held to two lines. The whole card links to the term page.
 */

type TermCardProps = {
  term: TermCardData;
  className?: string;
};

export function TermCard({ term, className }: TermCardProps) {
  return (
    <article className={cn("relative flex h-full items-start gap-4 p-6", styles.card, className)}>
      {term.illustration ? <TermDrawing illustration={term.illustration} /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="text-lg font-bold text-ink">
          <Link href={`/glossary/${term.slug}`} className={styles.link}>
            {term.term}
          </Link>
        </h3>
        {term.originalTerm ? (
          <p className="text-xs text-muted">
            <bdi lang="en" dir="ltr">
              {term.originalTerm}
            </bdi>
          </p>
        ) : null}
        <p className="mt-1 line-clamp-2 text-sm text-muted">{term.definition}</p>
      </div>
    </article>
  );
}

function TermDrawing({ illustration }: { illustration: string }) {
  const { width, height } = illustrationSize(illustration, "assembled");
  return (
    <span aria-hidden="true" className="relative grid size-16 shrink-0 place-items-end rounded-xl bg-surface p-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
      <img
        src={illustrationUrl(illustration, "assembled")}
        width={width}
        height={height}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-full object-contain object-bottom"
      />
    </span>
  );
}
