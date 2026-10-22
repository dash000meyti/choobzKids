import type { GlossaryGroup } from "@/db/queries/glossary";
import { TermCard } from "@/components/mag/TermCard";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import styles from "./GlossaryIndex.module.css";

/*
 * The glossary body (DESIGN.md §7.4, SEO.md §1.6): one section per Persian initial, anchored
 * #letter-alef, #letter-be …, each with its TermCards. On wide screens the letter stands in its
 * own column like a dictionary's thumb index and stays in view while its group scrolls past.
 */

type GlossaryIndexProps = {
  groups: GlossaryGroup[];
  className?: string;
};

export function GlossaryIndex({ groups, className }: GlossaryIndexProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {groups.map((group) => {
        const titleId = `${group.anchor}-title`;
        const latin = /[A-Za-z]/.test(group.letter);
        return (
          <section key={group.anchor} id={group.anchor} aria-labelledby={titleId} className={cn(styles.group, "frame-rule-in")}>
            <header className={styles.head}>
              <h2 id={titleId} className={styles.title}>
                <span aria-hidden="true" className={styles.letter}>
                  {latin ? (
                    <bdi lang="en" dir="ltr">
                      {group.letter}
                    </bdi>
                  ) : (
                    group.letter
                  )}
                </span>
                <span className="sr-only">{latin ? "واژه‌های لاتین" : `حرف ${group.letter}`}</span>
              </h2>
              <p className="text-xs text-muted">{formatNumber(group.count)} واژه</p>
            </header>
            <ul className="cells sm:grid-cols-2 xl:grid-cols-3">
              {group.terms.map((term) => (
                <li key={term.id}>
                  <TermCard term={term} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
