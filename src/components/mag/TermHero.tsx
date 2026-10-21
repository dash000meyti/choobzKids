import Link from "next/link";
import type { ReactNode } from "react";
import { Render } from "@/components/studio/Render";
import type { GlossaryTerm } from "@/db/queries/glossary";
import { cn } from "@/lib/utils";
import styles from "./TermHero.module.css";

/*
 * Glossary term header (DESIGN.md §7.4, SEO.md §8.9): H1 «{term} چیست؟», the original term in a
 * Latin island, then the quotable definition — verbatim, exactly as in `DefinedTerm.description` —
 * with the defining instance in <dfn>, and the other names it goes by. A small drawing stands
 * beside it only when the term names one of our products outright.
 */

type TermHeroProps = {
  term: Pick<GlossaryTerm, "slug" | "term" | "originalTerm" | "definition" | "alternateNames" | "illustration" | "letterAnchor">;
  className?: string;
};

/** Spellings the definition may open with: the term, without its gloss, the gloss, each half of «X و Y». */
function candidates(term: string, alternates: string[], original: string | null): string[] {
  const bare = term.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  const gloss = [...term.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].trim());
  const halves = bare.split(/\s+و\s+/).map((s) => s.trim());
  return [term, bare, ...gloss, ...halves, ...alternates, ...(original ? [original] : [])].filter((s) => s.length > 1);
}

/** The definition with its first mention of the term wrapped in <dfn>; the text itself is untouched. */
function definitionWithDfn(
  definition: string,
  term: string,
  alternates: string[],
  original: string | null,
): ReactNode {
  let best: { at: number; text: string } | null = null;
  for (const text of candidates(term, alternates, original)) {
    const at = definition.indexOf(text);
    if (at >= 0 && (!best || at < best.at || (at === best.at && text.length > best.text.length))) best = { at, text };
  }
  if (!best) {
    // The definition names the idea in other words; `title` tells the browser which term this is.
    return (
      <dfn title={term} className={styles.whole}>
        {definition}
      </dfn>
    );
  }
  return (
    <>
      {definition.slice(0, best.at)}
      <dfn>{best.text}</dfn>
      {definition.slice(best.at + best.text.length)}
    </>
  );
}

const quoted = (names: string[]) => names.map((n) => `«${n}»`).join("، ");

export function TermHero({ term, className }: TermHeroProps) {
  const alternates = term.alternateNames.filter((n) => n !== term.term);
  return (
    <header className={cn("grid gap-5", term.illustration && "sm:grid-cols-[minmax(0,1fr)_auto]", className)}>
      <div className="flex min-w-0 flex-col gap-3">
        <p className="text-sm text-muted">
          <Link href={`/glossary#${term.letterAnchor}`} transitionTypes={["nav-back"]} className="eyebrow">
            واژه‌نامهٔ چوبز
          </Link>
        </p>
        <h1 className="headline text-3xl lg:text-[3.5rem]">{term.term} چیست؟</h1>
        {term.originalTerm ? (
          <p className="text-sm text-muted">
            نام اصلی:{" "}
            <bdi lang="en" dir="ltr" className="font-semibold text-ink">
              {term.originalTerm}
            </bdi>
          </p>
        ) : null}

        <div className={styles.card}>
          <p className={styles.definition}>
            {definitionWithDfn(term.definition, term.term, alternates, term.originalTerm)}
          </p>
          {alternates.length ? (
            <p className="mt-3 text-sm text-muted">به آن {quoted(alternates)} هم می‌گویند.</p>
          ) : null}
        </div>
      </div>

      {term.illustration ? <TermDrawing illustration={term.illustration} name={term.term} /> : null}
    </header>
  );
}

function TermDrawing({ illustration, name }: { illustration: string; name: string }) {
  return (
    <figure className="w-full max-w-72 rounded-[1.5rem] bg-surface p-5 sm:w-60 sm:self-end">
      <Render productKey={illustration} alt={`${name}، تصویر سه‌بعدی`} sizes="240px" box="4 / 5" />
    </figure>
  );
}
