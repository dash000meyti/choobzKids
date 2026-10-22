import Link from "@/components/ui/Link";
import type { CSSProperties } from "react";
import type { TermCardData } from "@/db/queries/cards";
import type { GlossaryLetter } from "@/db/queries/mag";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { toFaDigits } from "@/lib/format";
import { grainStyle } from "@/lib/grain";
import { cn } from "@/lib/utils";
import { TermCard } from "./TermCard";
import styles from "./GlossaryTeaser.module.css";

/*
 * Glossary teaser (DESIGN.md §7.1): «واژه‌نامه: از الف تا ی» — the alphabet as small wooden
 * letter blocks (letters with terms are painted links into /glossary#letter-…; the rest stay
 * unpainted and inert) and six term cards.
 */

type GlossaryTeaserProps = {
  letters: GlossaryLetter[];
  termCount: number;
  terms: TermCardData[];
  className?: string;
};

export function GlossaryTeaser({ letters, termCount, terms, className }: GlossaryTeaserProps) {
  if (!termCount) return null;
  return (
    <section aria-labelledby="glossary-teaser" className={cn("flex flex-col gap-6", className)}>
      <SectionHeader
        id="glossary-teaser"
        kicker="هر اسم یه قصه داره"
        title="واژه‌نامه: از الف تا ی"
        sub={`تعریف کوتاه و دقیق ${toFaDigits(termCount)} اصطلاح مونته‌سوری، پیکلر، بازی و ایمنی وسایل کودک.`}
        link={{ label: "همهٔ واژه‌ها ←", href: "/glossary" }}
      />
      <nav aria-label="الفبای واژه‌نامه" className="-mx-gutter">
        <ol className={cn("no-scrollbar", styles.alphabet)}>
          {letters.map((l) => (
            <li key={l.letter}>
              {l.termCount ? (
                <Link
                  href={`/glossary#${l.anchor}`}
                  className={cn("grain", styles.block)}
                  style={grainStyle(l.anchor) as CSSProperties}
                  aria-label={`واژه‌های حرف ${l.letter}`}
                >
                  {l.letter}
                </Link>
              ) : (
                <span className={cn(styles.block, styles.blank)} aria-disabled="true">
                  {l.letter}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {terms.length ? (
        <ul className="no-scrollbar -mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto px-gutter pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {terms.map((term) => (
            <li key={term.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
              <TermCard term={term} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
