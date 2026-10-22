/*
 * Apple-style "highlights" for plain sentences from the database: the phrase that carries the
 * meaning in bold ink, the rest in a quieter grey. The text itself is never changed (it also
 * feeds SEO), only where the emphasis falls:
 *
 *   splitLead   — a summary: «برج یادگیری چوبز سکوی ایستادنی … است» | «که کودک … شریک شود.»
 *   splitClause — one instruction: «همیشه در فاصلهٔ یک دست از کودک بمانید» | «و او را … نگذارید.»
 */

export type Split = { lead: string; rest: string };

/**
 * A summary: what the thing is (up to «… است» before «که/،/؛»); else the earliest natural break
 * («؛ : که ،») within 90 characters — skipping commas around a contrast («، نه عطفشان را،») —
 * and only then a later «؛/:» (up to 140). A lead longer than that would be a wall of bold.
 */
export function splitLead(text: string): Split {
  const t = text.trim();
  const is = t.match(/^(.{12,140}?\sاست)(?=\s*(?:که|،|؛|:))/);
  if (is) return { lead: is[1], rest: t.slice(is[1].length).trim() };
  const at = (i: number, keep: boolean): Split => {
    const cut = keep ? i + 1 : i;
    return { lead: t.slice(0, cut).trim(), rest: t.slice(cut).trim() };
  };
  const candidates: { i: number; keep: boolean; strong: boolean }[] = [];
  for (const m of t.matchAll(/[؛:]/g)) candidates.push({ i: m.index ?? 0, keep: true, strong: true });
  for (const m of t.matchAll(/\sکه\s/g)) candidates.push({ i: m.index ?? 0, keep: false, strong: false });
  for (const m of t.matchAll(/،/g)) {
    const i = m.index ?? 0;
    const opensContrast = /^\s*نه\s/.test(t.slice(i + 1));
    const closesContrast = /(?:^|\s)نه\s[^،]{0,24}$/.test(t.slice(Math.max(0, i - 30), i));
    if (!opensContrast && !closesContrast) candidates.push({ i, keep: true, strong: false });
  }
  candidates.sort((a, b) => a.i - b.i);
  const early = candidates.find((c) => c.i >= 20 && c.i <= 90);
  if (early) return at(early.i, early.keep);
  const late = candidates.find((c) => c.strong && c.i > 90 && c.i <= 140);
  if (late) return at(late.i, late.keep);
  return { lead: "", rest: t };
}

/** One sentence: the words before its first clause break («؛ ، که و»), when that part is short. */
export function splitClause(text: string, min = 8, max = 52): Split {
  const t = text.trim();
  const breaks = ["؛", "،", " که ", " و "]
    .map((d) => ({ d, i: t.indexOf(d, min) }))
    .filter(({ i }) => i >= min && i <= max)
    .sort((a, b) => a.i - b.i);
  // No early break: a short sentence is all lead; a long one gets no bold rather than a wall of it.
  if (!breaks.length) return t.length <= 44 ? { lead: t, rest: "" } : { lead: "", rest: t };
  const { d, i } = breaks[0];
  // Punctuation stays with the lead («…صاف بگذارید،»); a joining word starts the rest («و …»).
  const cut = d.trim() === "؛" || d.trim() === "،" ? i + 1 : i;
  return { lead: t.slice(0, cut).trim(), rest: t.slice(cut).trim() };
}

/** Sentences of a paragraph (Persian and Latin stops). */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!؟?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function Highlight({ split, className }: { split: Split; className?: string }) {
  return (
    <span className={className}>
      {split.lead ? <strong className="font-bold text-ink">{split.lead}</strong> : null}
      {split.rest ? <span className="text-muted">{split.lead ? " " : ""}{split.rest}</span> : null}
    </span>
  );
}
