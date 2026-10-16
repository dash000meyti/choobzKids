import type { Link, PhrasingContent, Root, RootContent, Text } from "mdast";
import type { Plugin } from "unified";
import type { Parent } from "unist";
import { visit } from "unist-util-visit";
import { EL } from "../elements";
import type { GlossaryEntry, PipelineContext } from "../types";
import { termLinkData } from "./links";

/*
 * Automatic glossary links (SEO.md §4.6): the first mention of a term becomes a link to its
 * glossary page, at most `limit` (8) per body, never inside headings, links, code, directive
 * labels or a table's header row. Terms the author already linked with `term:` are skipped.
 * Matching ignores Arabic ي/ك and treats ZWNJ and a space as the same gap; a match must not be
 * glued to letters on either side (a ZWNJ suffix such as «‌ها» after it is fine).
 */

const DEFAULT_LIMIT = 8;
/** Mdast nodes whose text is never auto-linked. */
const SKIP_TYPES = new Set(["heading", "link", "linkReference", "inlineCode", "code", "html", "definition", "leafDirective", "textDirective"]);
const MIN_PATTERN_LENGTH = 3;

type Pattern = { text: string; slug: string; test: RegExp };

/** Same-length normalisation (so match offsets still index the original text). */
const fold = (s: string) => s.replace(/ي/g, "ی").replace(/ك/g, "ک");
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const gapTolerant = (s: string) => escapeRegExp(fold(s)).replace(/[‌ ]+/g, "[\\u200c ]+");

/** «آرک پیکلر (راکر)» → «آرک پیکلر»: parenthesised glosses are not part of the running-text name. */
function names(entry: GlossaryEntry): string[] {
  const base = entry.term.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  return [base, ...(entry.alternateNames ?? [])]
    .map((n) => n.trim())
    .filter((n) => n.length >= MIN_PATTERN_LENGTH);
}

function buildPatterns(terms: readonly GlossaryEntry[]): Pattern[] {
  const patterns = terms.flatMap((entry) =>
    names(entry).map((text) => ({ text, slug: entry.slug, test: new RegExp(`^${gapTolerant(text)}$`, "u") })),
  );
  // Longest first, so «قفسهٔ مونته‌سوری» wins over «مونته‌سوری».
  return patterns.sort((a, b) => b.text.length - a.text.length);
}

function matcher(patterns: Pattern[]): RegExp {
  const alternation = patterns.map((p) => gapTolerant(p.text)).join("|");
  return new RegExp(`(?<![\\p{L}\\p{M}\\p{N}\\u200c])(?:${alternation})(?![\\p{L}\\p{N}])`, "gu");
}

export const remarkGlossaryLinks: Plugin<[PipelineContext], Root> = (ctx) => (tree) => {
  const options = ctx.glossary;
  if (!options?.autoLink || !options.terms.length) return;
  const limit = options.limit ?? DEFAULT_LIMIT;
  const bySlug = new Map(options.terms.map((t) => [t.slug, t]));

  const linked = new Set(options.exclude ?? []);
  visit(tree, "link", (node) => {
    const slug = node.data?.hName === EL.term ? node.data.hProperties?.term : undefined;
    if (typeof slug === "string") linked.add(slug);
  });

  const patterns = buildPatterns(options.terms.filter((t) => !linked.has(t.slug)));
  if (!patterns.length) return;
  const search = matcher(patterns);
  let count = 0;

  const linkText = (node: Text): PhrasingContent[] | null => {
    const folded = fold(node.value);
    const out: PhrasingContent[] = [];
    let cursor = 0;
    for (const match of folded.matchAll(search)) {
      if (count >= limit) break;
      const pattern = patterns.find((p) => p.test.test(match[0]));
      if (!pattern || linked.has(pattern.slug)) continue;
      const start = match.index;
      const end = start + match[0].length;
      if (start > cursor) out.push({ type: "text", value: node.value.slice(cursor, start) });
      const link: Link = {
        type: "link",
        url: `/glossary/${pattern.slug}`,
        children: [{ type: "text", value: node.value.slice(start, end) }],
        data: termLinkData(bySlug.get(pattern.slug), pattern.slug, true),
      };
      out.push(link);
      linked.add(pattern.slug);
      count += 1;
      cursor = end;
    }
    if (!out.length) return null;
    if (cursor < node.value.length) out.push({ type: "text", value: node.value.slice(cursor) });
    return out;
  };

  const walk = (parent: Parent) => {
    const children = parent.children as RootContent[];
    for (let i = 0; i < children.length && count < limit; i++) {
      const child = children[i];
      if (child.type === "text") {
        const replaced = linkText(child);
        if (replaced) {
          children.splice(i, 1, ...replaced);
          i += replaced.length - 1;
        }
        continue;
      }
      if (SKIP_TYPES.has(child.type) || !("children" in child) || child.data?.hName === EL.caption) continue;
      if (child.type === "table") {
        // Row 0 is the header: column names, not running text.
        for (const row of child.children.slice(1)) walk(row);
        continue;
      }
      walk(child);
    }
  };

  walk(tree);
};
