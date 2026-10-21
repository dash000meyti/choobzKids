import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { getArticleCardsBySlugs, listTermCards, type ArticleCardData, type TermCardData } from "@/db/queries/cards";
import { getProductCardsBySlugs, type ProductCardData } from "@/db/queries/catalog";
import { isTermIndexable } from "@/db/queries/seo";
import { glossaryTerms } from "@/db/schema";
import { tag } from "@/lib/cache-tags";

/*
 * Glossary reads (DESIGN.md §7.4, SEO.md §1.6, §3.5.7). The index groups every term under its
 * Persian initial with ASCII anchors (#letter-alef, #letter-be …); a term page gets its related
 * posts, products and neighbouring terms, plus the quality-gate verdict that decides its robots
 * meta (the same `isTermIndexable` rule the sitemap uses, so the two never disagree).
 */

/* ------------------------------------------------------------------ */
/* Alphabet                                                            */
/* ------------------------------------------------------------------ */

/** The 32 letters of the Persian alphabet with their anchor names, in dictionary order. */
const PERSIAN_LETTERS = [
  ["ا", "alef"], ["ب", "be"], ["پ", "pe"], ["ت", "te"], ["ث", "se"], ["ج", "jim"], ["چ", "che"],
  ["ح", "he-jimi"], ["خ", "khe"], ["د", "dal"], ["ذ", "zal"], ["ر", "re"], ["ز", "ze"], ["ژ", "zhe"],
  ["س", "sin"], ["ش", "shin"], ["ص", "sad"], ["ض", "zad"], ["ط", "ta"], ["ظ", "za"], ["ع", "eyn"],
  ["غ", "gheyn"], ["ف", "fe"], ["ق", "ghaf"], ["ک", "kaf"], ["گ", "gaf"], ["ل", "lam"], ["م", "mim"],
  ["ن", "nun"], ["و", "vav"], ["ه", "he"], ["ی", "ye"],
] as const;

const LETTER_KEY: ReadonlyMap<string, string> = new Map(PERSIAN_LETTERS);

/** Terms with no Persian letter at all (e.g. «EN 71») close the index under one Latin group. */
const LATIN = { letter: "A–Z", key: "latin" } as const;

/** Letter variants that file under a dictionary letter: آ under ا, Arabic ي/ك under ی/ک … */
const FOLD: Record<string, string> = { "آ": "ا", "أ": "ا", "إ": "ا", "ٱ": "ا", "ي": "ی", "ى": "ی", "ئ": "ی", "ك": "ک", "ة": "ه", "ؤ": "و" };

/**
 * Where a term files: its first Persian letter. A Latin acronym with a Persian reading,
 * «RIE (رای)», files under that reading (ر); the sort key starts there too.
 */
function fileUnder(term: string): { letter: string; key: string; sortKey: string } {
  const chars = [...term];
  for (let i = 0; i < chars.length; i++) {
    const letter = FOLD[chars[i]] ?? chars[i];
    const key = LETTER_KEY.get(letter);
    if (key) return { letter, key, sortKey: chars.slice(i).join("") };
  }
  return { letter: LATIN.letter, key: LATIN.key, sortKey: term };
}

/** `#letter-…` anchor of the group a term files under, e.g. «مثلث پیکلر» → "letter-mim". */
export function letterAnchor(term: string): string {
  return `letter-${fileUnder(term).key}`;
}

export type GlossaryLetter = {
  letter: string;
  /** ASCII anchor without the hash, e.g. "letter-alef". */
  anchor: string;
  count: number;
};

export type GlossaryGroup = GlossaryLetter & { terms: TermCardData[] };

export type GlossaryIndexData = {
  /** Every letter for the rail, in alphabet order (count 0 = no terms yet); Latin last when used. */
  letters: GlossaryLetter[];
  /** Non-empty groups only, in the same order. */
  groups: GlossaryGroup[];
  total: number;
};

const faCollator = new Intl.Collator("fa");

/** The whole glossary, filed by Persian initial. */
export async function getGlossaryIndex(): Promise<GlossaryIndexData> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.glossary, tag.products);

  const terms = await listTermCards();
  const filed = new Map<string, { term: TermCardData; sortKey: string }[]>();
  for (const term of terms) {
    const { key, sortKey } = fileUnder(term.term);
    filed.set(key, [...(filed.get(key) ?? []), { term, sortKey }]);
  }

  const alphabet: { letter: string; key: string }[] = PERSIAN_LETTERS.map(([letter, key]) => ({ letter, key }));
  if (filed.has(LATIN.key)) alphabet.push(LATIN);

  const groups: GlossaryGroup[] = [];
  const letters = alphabet.map(({ letter, key }) => {
    const entries = (filed.get(key) ?? []).sort((a, b) => faCollator.compare(a.sortKey, b.sortKey));
    const item = { letter, anchor: `letter-${key}`, count: entries.length };
    if (entries.length) groups.push({ ...item, terms: entries.map((e) => e.term) });
    return item;
  });

  return { letters, groups, total: terms.length };
}

/* ------------------------------------------------------------------ */
/* Term pages                                                          */
/* ------------------------------------------------------------------ */

export type WikipediaLink = { lang: "fa" | "en"; url: string };

export type GlossaryTerm = {
  id: number;
  slug: string;
  term: string;
  /** Latin/original form (render inside <bdi lang="en">). */
  originalTerm: string | null;
  /** The quotable 1–2 sentences: the page's first paragraph and `DefinedTerm.description`. */
  definition: string;
  /** Markdown deep-dive (≤ 300 words), or null. */
  body: string | null;
  alternateNames: string[];
  /** Wikidata / Wikipedia URLs (JSON-LD keeps the crawlable ones, see `sameAsUrls`). */
  sameAs: string[];
  /** fa/en Wikipedia articles, linked visibly (percent-encoded fa URLs stay out of JSON-LD). */
  wikipedia: WikipediaLink[];
  /** Drawing of the product this term names outright, if any. */
  illustration: string | null;
  /** The index group this term files under, e.g. "letter-mim". */
  letterAnchor: string;
  /** The pillar guide for this term (explicit, else the first related pillar post). */
  pillar: { slug: string; title: string } | null;
  /** Published related posts in editorial order, the pillar included. */
  posts: ArticleCardData[];
  products: ProductCardData[];
  /** Other terms that share a related post or product, closest first (≤ 4). */
  relatedTerms: TermCardData[];
  /** Quality gate (DESIGN.md §7.4): false → `noindex, follow` and out of the sitemap. */
  indexable: boolean;
  updatedAt: string;
};

const RELATED_TERMS = 4;

function wikipediaLinks(urls: readonly string[]): WikipediaLink[] {
  const links: WikipediaLink[] = [];
  for (const lang of ["fa", "en"] as const) {
    const url = urls.find((u) => u.startsWith(`https://${lang}.wikipedia.org/wiki/`));
    if (url) links.push({ lang, url });
  }
  return links;
}

/** Every term slug, for generateStaticParams. */
export async function listGlossaryTermSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.glossary);
  return db
    .select({ slug: glossaryTerms.slug })
    .from(glossaryTerms)
    .orderBy(asc(glossaryTerms.id))
    .all()
    .map((t) => t.slug);
}

/** One term with everything its page shows; null for an unknown slug. */
export async function getGlossaryTerm(slug: string): Promise<GlossaryTerm | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.glossary, tag.posts, tag.products, tag.topics, tag.media);

  const row = db.select().from(glossaryTerms).where(eq(glossaryTerms.slug, slug)).get();
  if (!row) return null;

  const postSlugs = row.pillarPostSlug ? [...new Set([row.pillarPostSlug, ...row.relatedPostSlugs])] : row.relatedPostSlugs;
  const [cards, posts, products] = await Promise.all([
    listTermCards(),
    getArticleCardsBySlugs(postSlugs),
    getProductCardsBySlugs(row.relatedProductSlugs),
  ]);

  const pillarPost =
    (row.pillarPostSlug ? posts.find((p) => p.slug === row.pillarPostSlug) : undefined) ?? posts.find((p) => p.isPillar);
  // Keep the editorial order, but only the posts the author listed as related (plus the pillar).
  const related = posts.filter((p) => p === pillarPost || row.relatedPostSlugs.includes(p.slug));
  // Counted exactly as the sitemap counts them: published related posts and products only.
  const relatedCount = posts.filter((p) => row.relatedPostSlugs.includes(p.slug)).length + products.length;

  return {
    id: row.id,
    slug: row.slug,
    term: row.term,
    originalTerm: row.originalTerm,
    definition: row.definition,
    body: row.body?.trim() ? row.body : null,
    alternateNames: row.alternateNames,
    sameAs: row.sameAs,
    wikipedia: wikipediaLinks(row.sameAs),
    illustration: cards.find((c) => c.slug === row.slug)?.illustration ?? null,
    letterAnchor: letterAnchor(row.term),
    pillar: pillarPost ? { slug: pillarPost.slug, title: pillarPost.title } : null,
    posts: related,
    products,
    relatedTerms: relatedTerms(row, cards),
    indexable: isTermIndexable({ definition: row.definition, body: row.body, relatedCount }),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Neighbours by shared reading: terms that point at the same posts or products. */
function relatedTerms(row: typeof glossaryTerms.$inferSelect, cards: TermCardData[]): TermCardData[] {
  const mine = new Set([...row.relatedPostSlugs.map((s) => `post:${s}`), ...row.relatedProductSlugs.map((s) => `product:${s}`)]);
  if (!mine.size) return [];
  const others = db
    .select({
      slug: glossaryTerms.slug,
      relatedPostSlugs: glossaryTerms.relatedPostSlugs,
      relatedProductSlugs: glossaryTerms.relatedProductSlugs,
    })
    .from(glossaryTerms)
    .all()
    .filter((t) => t.slug !== row.slug);

  const shared = new Map<string, number>();
  for (const t of others) {
    const keys = [...t.relatedPostSlugs.map((s) => `post:${s}`), ...t.relatedProductSlugs.map((s) => `product:${s}`)];
    const n = keys.filter((k) => mine.has(k)).length;
    if (n) shared.set(t.slug, n);
  }
  // `cards` is already in Persian alphabetical order, which settles ties.
  return cards
    .filter((c) => shared.has(c.slug))
    .sort((a, b) => shared.get(b.slug)! - shared.get(a.slug)!)
    .slice(0, RELATED_TERMS);
}
