import type { GlossaryLetter } from "@/db/queries/glossary";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import styles from "./AlphabetRail.module.css";

/*
 * The glossary's alphabet rail (DESIGN.md §7.4): «ا ب پ … ی» as small wooden letter blocks that
 * stick under the header. A letter with terms is painted and raised (a link to its group,
 * #letter-be …); a letter without terms is bare, unpainted wood: flat, faint and not a link.
 * Phones scroll the rail sideways inside itself; wide screens show it whole.
 */

type AlphabetRailProps = {
  letters: GlossaryLetter[];
  className?: string;
};

const LATIN = /[A-Za-z]/;

function Letter({ letter }: { letter: string }) {
  return LATIN.test(letter) ? (
    <bdi lang="en" dir="ltr">
      {letter}
    </bdi>
  ) : (
    letter
  );
}

export function AlphabetRail({ letters, className }: AlphabetRailProps) {
  return (
    <nav aria-label="فهرست الفبایی واژه‌ها" className={cn(styles.rail, className)}>
      <ol className={styles.list}>
        {letters.map(({ letter, anchor, count }) =>
          count ? (
            <li key={anchor}>
              <a
                href={`#${anchor}`}
                className={cn(styles.block, styles.painted)}
                aria-label={`${letter}، ${formatNumber(count)} واژه`}
              >
                <Letter letter={letter} />
              </a>
            </li>
          ) : (
            // Nothing to jump to: the bare block is decoration, not a control.
            <li key={anchor} aria-hidden="true">
              <span className={cn(styles.block, styles.bare)}>
                <Letter letter={letter} />
              </span>
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}
