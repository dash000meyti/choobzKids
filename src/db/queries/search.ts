import "server-only";
import { and, desc, eq } from "drizzle-orm";
import type { Statement } from "better-sqlite3";
import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { searchKey, type SearchKind } from "@/db/seed/search-index";
import { normalizeFa } from "@/lib/format";

/*
 * Site search over the FTS5 index (SEO.md §6.5, §7.5; index built by rebuildSearchIndex).
 * Deliberately NOT 'use cache': /search and /api/suggest are request-time routes, and one cache
 * entry per typed query would only crowd out the content cache.
 */

export type { SearchKind };

export type SearchHit = {
  kind: SearchKind;
  refId: number;
  slug: string;
  /** Display title as written in the CMS. */
  title: string;
  /** One short line for suggestions (category, topic, tagline or the Latin term). */
  hint: string | null;
  href: string;
};

/** Results in the three groups the UI shows: «محصولات · راهنماها · واژه‌ها». */
export type SearchGroups = {
  /** Products, then shop categories and room presets, by relevance. */
  products: SearchHit[];
  /** Articles and topic hubs. */
  guides: SearchHit[];
  terms: SearchHit[];
};

export type SearchResults = SearchGroups & {
  /** The cleaned query as the visitor wrote it (for display). */
  query: string;
  total: number;
};

/** Shape of GET /api/suggest (import as a type from client code). */
export type SuggestResponse = SearchResults;

const GROUP_OF: Record<SearchKind, keyof SearchGroups> = {
  product: "products",
  category: "products",
  room: "products",
  post: "guides",
  topic: "guides",
  term: "terms",
};

const HREF: Record<SearchKind, (slug: string) => string> = {
  product: (slug) => `/product/${slug}`,
  category: (slug) => `/shop/${slug}`,
  room: (slug) => `/rooms/${slug}`,
  post: (slug) => `/mag/${slug}`,
  topic: (slug) => `/mag/topic/${slug}`,
  term: (slug) => `/glossary/${slug}`,
};

export const MAX_QUERY_LENGTH = 100;
const MAX_TOKENS = 8;
/** Rows read from the index before grouping; generous for a catalogue this size. */
const MAX_HITS = 200;

/** First `q` value from a search param, trimmed, ی/ک-normalised and length-capped. */
export function cleanQuery(value: string | string[] | null | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? normalizeFa(raw).slice(0, MAX_QUERY_LENGTH).trim() : "";
}

/*
 * Spelling variants people actually type (SEO.md §6.5). Each group is a set of equivalent
 * phrases; a query containing one also searches with each of the others. Spaced/joined ZWNJ
 * spellings need no entry: the index stores both.
 */
const SYNONYM_GROUPS: string[][] = [
  ["مونته‌سوری", "مونتسوری", "montessori"],
  ["پیکلر", "بیکلر", "pikler"],
  ["برج یادگیری", "کیچن هلپر", "برج آموزشی", "learning tower", "kitchen helper"],
  ["نردبان سوئدی", "دیوار صعود", "swedish ladder"],
  ["والدورف", "والدروف", "waldorf"],
  ["تخته تعادل", "بالانس برد", "balance board"],
  ["کتابخانه", "کتاب خانه"],
  ["قفسه", "شلف"],
].map((group) => group.map((phrase) => searchKey(phrase)));

function spellings(key: string): string[] {
  const variants = new Set([key]);
  const padded = ` ${key} `;
  for (const group of SYNONYM_GROUPS) {
    const found = group.find((phrase) => padded.includes(` ${phrase} `));
    if (!found) continue;
    for (const other of group) if (other !== found) variants.add(padded.replace(` ${found} `, ` ${other} `).trim());
  }
  return [...variants];
}

/**
 * FTS5 MATCH expression for a visitor's query, or null when nothing searchable is left.
 * Every token is quoted (so FTS syntax in the input is inert) and prefix-matched; a one-letter
 * word mid-query («و») must match exactly, but the last token is always a prefix because the
 * visitor may still be typing it.
 */
export function buildMatch(query: string): string | null {
  const key = searchKey(query);
  if (!key) return null;
  return spellings(key)
    .map((variant) => {
      const tokens = variant.split(" ").slice(0, MAX_TOKENS);
      const terms = tokens.map((t, i) => (t.length > 1 || i === tokens.length - 1 ? `"${t}"*` : `"${t}"`));
      return `(${terms.join(" ")})`;
    })
    .join(" OR ");
}

type Row = { kind: SearchKind; refId: number; slug: string; label: string; hint: string | null };

let statement: Statement<[string, number], Row> | undefined;

function hitsFor(match: string): Row[] {
  try {
    // Column weights follow the table's column order: five UNINDEXED display columns, then
    // title ×10, keywords ×5, body ×1.
    statement ??= db.$client.prepare<[string, number], Row>(
      `SELECT kind, ref_id AS refId, slug, label, hint
         FROM search_index
        WHERE search_index MATCH ?
        ORDER BY bm25(search_index, 0, 0, 0, 0, 0, 10, 5, 1)
        LIMIT ?`,
    );
    return statement.all(match, MAX_HITS);
  } catch (error) {
    // A missing index or a malformed expression must never 500 the page; it finds nothing.
    console.error("[search] query failed", error);
    return [];
  }
}

/** Ranked results for `q`, at most `limit` per group. Reads at request time. */
export function search(q: string, limit = 12): SearchResults {
  const query = cleanQuery(q);
  const results: SearchResults = { query, total: 0, products: [], guides: [], terms: [] };
  const match = buildMatch(query);
  if (!match) return results;

  for (const row of hitsFor(match)) {
    const group = results[GROUP_OF[row.kind]];
    if (group.length >= limit) continue;
    group.push({ kind: row.kind, refId: row.refId, slug: row.slug, title: row.label, hint: row.hint, href: HREF[row.kind](row.slug) });
    results.total++;
  }
  return results;
}

/** Pillar guides for the empty and zero-result states, newest first. */
export function listPillarGuideSlugs(limit = 3): string[] {
  return db
    .select({ slug: posts.slug })
    .from(posts)
    .where(and(eq(posts.status, "published"), eq(posts.isPillar, true)))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .all()
    .map((p) => p.slug);
}
