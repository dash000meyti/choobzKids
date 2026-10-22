import Link from "@/components/ui/Link";
import type { ReactNode } from "react";
import type { PostFormat } from "@/db/queries/cards";
import { AgeBadge } from "@/components/ui/AgeBadge";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { FORMAT_LABEL } from "./ArticleCard";
import styles from "./ArticleHeader.module.css";

/*
 * Article header (DESIGN.md §7.3 #2, SEO.md §4.3): the format's stationery as a header band
 * (kraft notebook with its elastic, ruled paper, blueprint, graph paper, ticked list, album
 * corners — the card corners' vocabulary) with the format named on a paper tab, the eyebrow
 * «topic · age», the question-form H1 and the dek.
 * The byline is passed in as children so it sits inside the same <header>.
 */

type ArticleHeaderProps = {
  title: string;
  dek?: string | null;
  format: PostFormat;
  topic: { slug: string; name: string } | null;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  children?: ReactNode;
  className?: string;
};

export function ArticleHeader({ title, dek, format, topic, ageMinMonths, ageMaxMonths, children, className }: ArticleHeaderProps) {
  const label = FORMAT_LABEL[format];
  const hasAge = ageMinMonths != null || ageMaxMonths != null;
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      <div className={cn(styles.band, styles[format])}>
        <span className={styles.tab}>
          <Icon name={label.icon} className="size-4" />
          {label.label}
        </span>
      </div>
      {topic || hasAge ? (
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-muted">
          {topic ? (
            <Link href={`/mag/topic/${topic.slug}`} transitionTypes={["nav-back"]} className="link-mark font-semibold text-ink">
              {topic.name}
            </Link>
          ) : null}
          {topic && hasAge ? (
            <span aria-hidden="true" className="text-line-strong">
              ·
            </span>
          ) : null}
          {hasAge ? <AgeBadge min={ageMinMonths} max={ageMaxMonths} link /> : null}
        </p>
      ) : null}
      <h1 className="font-display text-3xl text-ink text-balance">{title}</h1>
      {dek ? <p className="text-lead text-muted">{dek}</p> : null}
      {children}
    </header>
  );
}
