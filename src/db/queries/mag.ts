import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { getProductCardsBySlugs, type CardImage, type ProductCardData } from "@/db/queries/catalog";
import {
  getArticleCardsBySlugs,
  listArticleCards,
  listTermCards,
  type ArticleCardData,
  type PostFormat,
  type TermCardData,
} from "@/db/queries/cards";
import { shortTitle } from "@/db/queries/nav";
import { authors, faqs, glossaryTerms, media, postProducts, posts, products, topics, type Source } from "@/db/schema";
import { overlapsAge } from "@/lib/ages";
import { tag } from "@/lib/cache-tags";
import { extractHeadings, extractSteps, markdownToPlain, parseSiteHref, type Heading, type Step } from "@/lib/markdown";

/*
 * «مجله چوبز» reads (DESIGN.md §7.1–§7.3, SEO.md §1.3, §1.8): the hub, its numbered pages, the
 * nine topic hubs and the article page. Every export is a `'use cache'` read tagged with the
 * collections it touches, so the pages stay fully static and refresh with the CMS. Card-sized
 * data comes from cards.ts / catalog.ts; this module adds the editorial joins (authors, FAQs,
 * products in the article, the reading path) and the choices the pages make (which pillar, which
 * related posts, which terms). Dates are ISO strings, like the card queries.
 */

/** Cards per listing page: /mag shows page 1, /mag/page/{n} the rest (SEO.md §1.8). */
export const MAG_PAGE_SIZE = 12;

const PILLAR_LIMIT = 9;
const TOPIC_ROW_SIZE = 3;
const TEASER_TERMS = 6;
const RELATED_LIMIT = 3;
/** SEO.md §1.3: a topic hub shows 3–6 products and 5–10 glossary terms. */
const TOPIC_PRODUCT_LIMIT = 6;
const TOPIC_TERM_LIMIT = 10;

const iso = (date: Date | null | undefined) => (date ? date.toISOString() : null);

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export type MagPerson = {
  slug: string;
  name: string;
  role: string;
  jobTitle: string | null;
  bio: string;
  credentials: string[];
  knowsAbout: string[];
  sameAs: string[];
  /** Placeholder people are never shown or marked up (DESIGN.md §7.6). */
  isPlaceholder: boolean;
  /** Collective authors («تحریریهٔ چوبز») — an Organization, never a Person. */
  isOrganization: boolean;
  avatar: CardImage | null;
};

function loadPeople(ids: number[]): Map<number, MagPerson> {
  if (!ids.length) return new Map();
  const rows = db
    .select({
      id: authors.id,
      slug: authors.slug,
      name: authors.name,
      role: authors.role,
      jobTitle: authors.jobTitle,
      bio: authors.bio,
      credentials: authors.credentials,
      knowsAbout: authors.knowsAbout,
      sameAs: authors.sameAs,
      isPlaceholder: authors.isPlaceholder,
      isOrganization: authors.isOrganization,
      avatarPath: media.path,
      avatarWidth: media.width,
      avatarHeight: media.height,
      avatarAlt: media.alt,
      avatarColor: media.dominantColor,
      avatarKind: media.kind,
    })
    .from(authors)
    .leftJoin(media, eq(media.id, authors.avatarMediaId))
    .where(inArray(authors.id, ids))
    .all();
  return new Map(
    rows.map((r) => [
      r.id,
      {
        slug: r.slug,
        name: r.name,
        role: r.role,
        jobTitle: r.jobTitle,
        bio: r.bio,
        credentials: r.credentials,
        knowsAbout: r.knowsAbout,
        sameAs: r.sameAs,
        isPlaceholder: r.isPlaceholder,
        isOrganization: r.isOrganization,
        avatar: r.avatarPath
          ? {
              path: r.avatarPath,
              width: r.avatarWidth,
              height: r.avatarHeight,
              alt: r.avatarAlt ?? "",
              dominantColor: r.avatarColor,
              kind: r.avatarKind ?? "photo",
            }
          : null,
      },
    ]),
  );
}

/** People who can be shown and credited by name: real (not placeholder) individuals. */
const isNamedExpert = (p: MagPerson) => !p.isPlaceholder && !p.isOrganization;

/* ------------------------------------------------------------------ */
/* Topics                                                              */
/* ------------------------------------------------------------------ */

export type MagTopic = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  accent: string | null;
  illustration: string | null;
  /** Published articles in the cluster. */
  postCount: number;
};

function loadTopics(cards: ArticleCardData[]): MagTopic[] {
  return db
    .select({
      id: topics.id,
      slug: topics.slug,
      name: topics.name,
      tagline: topics.tagline,
      accent: topics.accent,
      illustration: topics.illustration,
    })
    .from(topics)
    .orderBy(asc(topics.sortOrder), asc(topics.id))
    .all()
    .map((t) => ({ ...t, postCount: cards.filter((c) => c.topic?.slug === t.slug).length }));
}

/** Every topic slug, empty clusters included (their hub still teaches and links products). */
export async function listTopicSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.topics);
  return db
    .select({ slug: topics.slug })
    .from(topics)
    .orderBy(asc(topics.sortOrder), asc(topics.id))
    .all()
    .map((t) => t.slug);
}

/* ------------------------------------------------------------------ */
/* Listing pages                                                       */
/* ------------------------------------------------------------------ */

export type MagPage = {
  /** 1-based page number. */
  page: number;
  totalPages: number;
  /** Published articles across all pages. */
  total: number;
  posts: ArticleCardData[];
};

function pageOf(cards: ArticleCardData[], page: number): MagPage | null {
  const totalPages = Math.max(1, Math.ceil(cards.length / MAG_PAGE_SIZE));
  if (!Number.isInteger(page) || page < 1 || page > totalPages) return null;
  const start = (page - 1) * MAG_PAGE_SIZE;
  return { page, totalPages, total: cards.length, posts: cards.slice(start, start + MAG_PAGE_SIZE) };
}

/** One numbered page of the newest-first listing, or null past the end. */
export async function getMagPage(page: number): Promise<MagPage | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts, tag.topics, tag.media);
  return pageOf(await listArticleCards(), page);
}

/** `/mag/page/{n}` params: every page after the first (page 1 is `/mag`). */
export async function listMagPageNumbers(): Promise<number[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts);
  const totalPages = Math.ceil((await listArticleCards()).length / MAG_PAGE_SIZE);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 2);
}

/* ------------------------------------------------------------------ */
/* Hub                                                                 */
/* ------------------------------------------------------------------ */

export type PillarGuide = {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
  readingMinutes: number;
  topic: { slug: string; name: string; accent: string | null } | null;
};

export type GlossaryLetter = {
  letter: string;
  /** Section anchor on /glossary, e.g. `letter-alef`. */
  anchor: string;
  termCount: number;
};

export type MagHome = {
  /** Each topic's pillar guide in topic order, then any other pillar. */
  pillars: PillarGuide[];
  topics: MagTopic[];
  /**
   * Per topic, up to three of its articles that page 1 of the listing does not already show —
   * a post's card (and its `post-{id}` morph) appears once per page. Topics with nothing left
   * are omitted; every topic is still linked from `topics`.
   */
  topicRows: { topic: MagTopic; posts: ArticleCardData[] }[];
  latest: MagPage;
  letters: GlossaryLetter[];
  termCount: number;
  terms: TermCardData[];
  /** Named, real authors and reviewers of published articles (none while all are placeholders). */
  experts: MagPerson[];
};

/** The Persian alphabet as the glossary index anchors it (DESIGN.md §7.4). */
export const GLOSSARY_LETTERS: readonly { letter: string; anchor: string }[] = [
  ["ا", "alef"], ["ب", "be"], ["پ", "pe"], ["ت", "te"], ["ث", "se"], ["ج", "jim"], ["چ", "che"], ["ح", "he-jimi"],
  ["خ", "khe"], ["د", "dal"], ["ذ", "zal"], ["ر", "re"], ["ز", "ze"], ["ژ", "zhe"], ["س", "sin"], ["ش", "shin"],
  ["ص", "sad"], ["ض", "zad"], ["ط", "ta"], ["ظ", "za"], ["ع", "eyn"], ["غ", "gheyn"], ["ف", "fe"], ["ق", "ghaf"],
  ["ک", "kaf"], ["گ", "gaf"], ["ل", "lam"], ["م", "mim"], ["ن", "nun"], ["و", "vav"], ["ه", "he"], ["ی", "ye"],
].map(([letter, name]) => ({ letter, anchor: `letter-${name}` }));

/** The index letter of a term: آ files under ا; Latin-initial terms («EN 71») have none. */
function initialOf(term: string): string | null {
  const first = term.trim().charAt(0);
  if (first === "آ") return "ا";
  return GLOSSARY_LETTERS.some((l) => l.letter === first) ? first : null;
}

function loadPillars(cards: ArticleCardData[]): PillarGuide[] {
  const bySlug = new Map(cards.map((c) => [c.slug, c]));
  const byId = new Map(cards.map((c) => [c.id, c]));
  const pillarIds = db
    .select({ pillarPostId: topics.pillarPostId })
    .from(topics)
    .orderBy(asc(topics.sortOrder), asc(topics.id))
    .all()
    .map((t) => t.pillarPostId)
    .filter((id): id is number => id != null);
  const ordered = [
    ...pillarIds.map((id) => byId.get(id)),
    ...cards.filter((c) => c.isPillar),
  ].filter((c): c is ArticleCardData => !!c && bySlug.has(c.slug));
  const unique = [...new Map(ordered.map((c) => [c.id, c])).values()];
  return unique.slice(0, PILLAR_LIMIT).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    shortTitle: shortTitle(c.title),
    readingMinutes: c.readingMinutes,
    topic: c.topic,
  }));
}

/** Six terms for the teaser: the ones most articles lean on, then alphabetical. */
function pickTeaserTerms(terms: TermCardData[]): TermCardData[] {
  const usage = new Map(
    db
      .select({ slug: glossaryTerms.slug, relatedPostSlugs: glossaryTerms.relatedPostSlugs })
      .from(glossaryTerms)
      .all()
      .map((t) => [t.slug, t.relatedPostSlugs.length]),
  );
  return terms
    .map((term, order) => ({ term, order, uses: usage.get(term.slug) ?? 0 }))
    .sort((a, b) => b.uses - a.uses || a.order - b.order)
    .slice(0, TEASER_TERMS)
    .map((t) => t.term);
}

function loadExperts(): MagPerson[] {
  const credited = db
    .select({ authorId: posts.authorId, reviewerId: posts.reviewerId })
    .from(posts)
    .where(eq(posts.status, "published"))
    .all()
    .flatMap((p) => [p.authorId, p.reviewerId])
    .filter((id): id is number => id != null);
  const people = loadPeople([...new Set(credited)]);
  return [...people.values()].filter(isNamedExpert);
}

export async function getMagHome(): Promise<MagHome> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts, tag.topics, tag.media, tag.glossary, tag.authors, tag.products);

  const cards = await listArticleCards();
  const latest = pageOf(cards, 1)!;
  const onFirstPage = new Set(latest.posts.map((p) => p.id));
  const topicList = loadTopics(cards);
  const allTerms = await listTermCards();
  const letters = GLOSSARY_LETTERS.map((l) => ({
    ...l,
    termCount: allTerms.filter((t) => initialOf(t.term) === l.letter).length,
  }));

  return {
    pillars: loadPillars(cards),
    topics: topicList,
    topicRows: topicList
      .map((topic) => ({
        topic,
        posts: cards.filter((c) => c.topic?.slug === topic.slug && !onFirstPage.has(c.id)).slice(0, TOPIC_ROW_SIZE),
      }))
      .filter((row) => row.posts.length > 0),
    latest,
    letters,
    termCount: allTerms.length,
    terms: pickTeaserTerms(allTerms),
    experts: loadExperts(),
  };
}

/* ------------------------------------------------------------------ */
/* «سؤال امروز»                                                         */
/* ------------------------------------------------------------------ */

export type DailyQuestion = {
  question: string;
  /** The answer's opening sentences (the full one lives in the article's FAQ). */
  answer: string;
  post: { slug: string; title: string; shortTitle: string };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
const ANSWER_MAX_CHARS = 240;

/** Whole sentences from the start of `text`, as many as fit in `max` characters (at least one). */
function leadSentences(text: string, max: number): string {
  const sentences = text.trim().split(/(?<=[.!؟?])\s+/);
  let out = sentences[0] ?? "";
  for (const sentence of sentences.slice(1)) {
    if ([...out].length + 1 + [...sentence].length > max) break;
    out = `${out} ${sentence}`;
  }
  return out;
}

/**
 * Article FAQs dealt round-robin across posts (every post's first question, then every
 * post's second…), so consecutive days visit different articles.
 */
function loadDailyQuestions(): DailyQuestion[] {
  const published = db
    .select({ id: posts.id, slug: posts.slug, title: posts.title })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), asc(posts.id))
    .all();
  if (!published.length) return [];
  const rows = db
    .select({ postId: faqs.scopeId, question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(and(eq(faqs.scope, "post"), inArray(faqs.scopeId, published.map((p) => p.id))))
    .orderBy(asc(faqs.sortOrder), asc(faqs.id))
    .all();
  const perPost = published.map((post) => ({
    post: { slug: post.slug, title: post.title, shortTitle: shortTitle(post.title) },
    items: rows.filter((r) => r.postId === post.id),
  }));
  const deepest = Math.max(0, ...perPost.map((p) => p.items.length));
  const dealt: DailyQuestion[] = [];
  for (let round = 0; round < deepest; round++) {
    for (const { post, items } of perPost) {
      const item = items[round];
      if (item) dealt.push({ question: item.question, answer: leadSentences(item.answer, ANSWER_MAX_CHARS), post });
    }
  }
  return dealt;
}

/**
 * Today's question for the hub. The day is read inside this cache scope, whose `days` life
 * regenerates it about once a day, so the static page rotates without any request-time work.
 */
export async function getQuestionOfDay(): Promise<DailyQuestion | null> {
  "use cache";
  cacheLife("days");
  cacheTag(tag.site, tag.posts, tag.faqs);
  const questions = loadDailyQuestions();
  if (!questions.length) return null;
  const day = Math.floor((Date.now() + TEHRAN_OFFSET_MS) / DAY_MS);
  return questions[day % questions.length];
}

/* ------------------------------------------------------------------ */
/* Topic hub                                                           */
/* ------------------------------------------------------------------ */

export type TopicPage = {
  topic: MagTopic & {
    /** Markdown intro (300–500 words). */
    description: string | null;
    sameAs: string[];
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalPath: string | null;
    noindex: boolean;
  };
  pillar: ArticleCardData | null;
  /** Every article in the cluster: the pillar first, then newest first. */
  posts: ArticleCardData[];
  products: ProductCardData[];
  terms: TermCardData[];
  /** Newest of the topic row and its articles' editorial dates. */
  lastModified: string | null;
};

/** `term:` / `product:` slugs a Markdown body links to, in reading order. */
function linkedSlugs(markdown: string | null, scheme: "term" | "product"): string[] {
  const slugs: string[] = [];
  for (const match of (markdown ?? "").matchAll(/\]\(\s*([a-z]+:[a-z0-9-]+(?:#[a-z0-9-]+)?)\s*\)/g)) {
    const href = parseSiteHref(match[1]);
    if (href?.scheme === scheme) slugs.push(href.slug);
  }
  return slugs;
}

/** Slugs ranked by how often they occur, first appearance breaking ties. */
function rankByFrequency(slugs: string[]): string[] {
  const counts = new Map<string, number>();
  slugs.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));
  return [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)!);
}

export async function getTopicPage(slug: string): Promise<TopicPage | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.topics, tag.posts, tag.products, tag.glossary, tag.media);

  const row = db.select().from(topics).where(eq(topics.slug, slug)).get();
  if (!row) return null;

  const cards = await listArticleCards({ topicSlug: slug });
  const pillar = cards.find((c) => c.id === row.pillarPostId) ?? cards.find((c) => c.isPillar) ?? null;
  const clusterPosts = pillar ? [pillar, ...cards.filter((c) => c.id !== pillar.id)] : cards;
  const postIds = clusterPosts.map((c) => c.id);

  // Products: the ones the intro names, then the ones its articles use most, then the topic's own drawing.
  const usedInPosts = postIds.length
    ? db
        .select({ slug: products.slug })
        .from(postProducts)
        .innerJoin(products, eq(products.id, postProducts.productId))
        .where(inArray(postProducts.postId, postIds))
        .orderBy(asc(postProducts.sortOrder))
        .all()
        .map((p) => p.slug)
    : [];
  const drawn = row.illustration
    ? db
        .select({ slug: products.slug })
        .from(products)
        .where(eq(products.illustration, row.illustration))
        .all()
        .map((p) => p.slug)
    : [];
  const productSlugs = [...new Set([...linkedSlugs(row.description, "product"), ...rankByFrequency(usedInPosts), ...drawn])];
  const productCards = (await getProductCardsBySlugs(productSlugs)).slice(0, TOPIC_PRODUCT_LIMIT);

  // Terms: the ones the intro defines, then the ones the cluster's articles relate to most.
  const postSlugs = new Set(clusterPosts.map((c) => c.slug));
  const relatedTerms = db
    .select({ slug: glossaryTerms.slug, relatedPostSlugs: glossaryTerms.relatedPostSlugs })
    .from(glossaryTerms)
    .all()
    .flatMap((t) => t.relatedPostSlugs.filter((s) => postSlugs.has(s)).map(() => t.slug));
  const termSlugs = [...new Set([...linkedSlugs(row.description, "term"), ...rankByFrequency(relatedTerms)])];
  const termsBySlug = new Map((await listTermCards()).map((t) => [t.slug, t]));
  const termCards = termSlugs
    .map((s) => termsBySlug.get(s))
    .filter((t): t is TermCardData => !!t)
    .slice(0, TOPIC_TERM_LIMIT);

  const stamps = [iso(row.updatedAt), ...clusterPosts.map((c) => c.updatedAt)].filter((d): d is string => !!d);

  return {
    topic: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      accent: row.accent,
      illustration: row.illustration,
      postCount: clusterPosts.length,
      description: row.description,
      sameAs: row.sameAs,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      canonicalPath: row.canonicalPath,
      noindex: row.noindex,
    },
    pillar,
    posts: clusterPosts,
    products: productCards,
    terms: termCards,
    lastModified: stamps.sort().at(-1) ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Article                                                             */
/* ------------------------------------------------------------------ */

export type ArticleCover =
  | {
      kind: "photo";
      image: CardImage & { width: number; height: number };
      caption: string | null;
      credit: string | null;
    }
  | {
      kind: "drawing";
      /** Manifest key (`/illustrations/{key}-assembled.svg`). */
      illustration: string;
      /** The product the drawing shows, when it is one of ours. */
      product: { slug: string; name: string } | null;
    };

export type ArticleData = {
  post: {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    tldr: string[];
    body: string;
    format: PostFormat;
    isPillar: boolean;
    ageMinMonths: number | null;
    ageMaxMonths: number | null;
    readingMinutes: number;
    ymyl: boolean;
    sources: Source[];
    publishedAt: string | null;
    /** Editorial «به‌روزرسانی» date (falls back to the publish date). */
    contentUpdatedAt: string | null;
    reviewedAt: string | null;
    primaryQuery: string | null;
    secondaryQueries: string[];
    aboutEntities: string[];
    illustration: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalPath: string | null;
    noindex: boolean;
  };
  cover: ArticleCover | null;
  topic: { slug: string; name: string; accent: string | null } | null;
  author: MagPerson | null;
  reviewer: MagPerson | null;
  faqs: { question: string; answer: string }[];
  /** `post_products` in their order (published only). */
  products: ProductCardData[];
  /** The body's H2/H3 with the ids the page renders (TOC). */
  headings: Heading[];
  /** `:::steps` items, for HowTo (format `howto` only). */
  steps: Step[];
  wordCount: number;
  /** «قدم بعدی در این مسیر»: the next article of the cluster (pillar first, then oldest first). */
  next: ArticleCardData | null;
  related: ArticleCardData[];
};

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Cluster order is a reading path: the pillar, then the supporting articles oldest first. */
function nextInPath(current: ArticleCardData, cluster: ArticleCardData[], pillarId: number | null): ArticleCardData | null {
  const isHead = (c: ArticleCardData) => (pillarId != null ? c.id === pillarId : c.isPillar);
  const path = [...cluster].sort(
    (a, b) =>
      Number(isHead(b)) - Number(isHead(a)) ||
      (a.publishedAt ?? "").localeCompare(b.publishedAt ?? "") ||
      a.id - b.id,
  );
  if (path.length < 2) return null;
  const at = path.findIndex((p) => p.id === current.id);
  // The last article leads back to the start of the path.
  return at === -1 ? null : path[(at + 1) % path.length];
}

/** Same cluster first, then shared entities, then an overlapping age range; newest breaks ties. */
function pickRelated(current: ArticleCardData, entities: string[], all: ArticleCardData[], skip: Set<number>) {
  const aboutBySlug = new Map(
    db
      .select({ slug: posts.slug, aboutEntities: posts.aboutEntities })
      .from(posts)
      .where(eq(posts.status, "published"))
      .all()
      .map((p) => [p.slug, p.aboutEntities]),
  );
  const mine = new Set(entities);
  const hasAge = current.ageMinMonths != null || current.ageMaxMonths != null;
  return all
    .filter((c) => !skip.has(c.id))
    .map((c, newest) => {
      const shared = (aboutBySlug.get(c.slug) ?? []).filter((e) => mine.has(e)).length;
      const sameTopic = current.topic && c.topic?.slug === current.topic.slug ? 3 : 0;
      const age = hasAge && overlapsAge(c, current.ageMinMonths ?? 0, current.ageMaxMonths ?? Number.POSITIVE_INFINITY) ? 1 : 0;
      return { c, score: sameTopic + shared * 2 + age, newest };
    })
    .sort((a, b) => b.score - a.score || a.newest - b.newest)
    .slice(0, RELATED_LIMIT)
    .map((r) => r.c);
}

export async function getArticle(slug: string): Promise<ArticleData | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts, tag.topics, tag.authors, tag.faqs, tag.products, tag.media);

  const row = db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .get();
  if (!row) return null;
  cacheTag(tag.post(row.id));

  const [card] = await getArticleCardsBySlugs([row.slug]);
  const topic = card?.topic ?? null;
  const people = loadPeople([row.authorId, row.reviewerId].filter((id): id is number => id != null));
  const author = row.authorId != null ? (people.get(row.authorId) ?? null) : null;
  const reviewer = row.reviewerId != null ? (people.get(row.reviewerId) ?? null) : null;

  const faqRows = db
    .select({ question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(and(eq(faqs.scope, "post"), eq(faqs.scopeId, row.id)))
    .orderBy(asc(faqs.sortOrder), asc(faqs.id))
    .all();

  const productSlugs = db
    .select({ slug: products.slug })
    .from(postProducts)
    .innerJoin(products, eq(products.id, postProducts.productId))
    .where(eq(postProducts.postId, row.id))
    .orderBy(asc(postProducts.sortOrder))
    .all()
    .map((p) => p.slug);

  let cover: ArticleCover | null = null;
  const photo = row.coverMediaId ? db.select().from(media).where(eq(media.id, row.coverMediaId)).get() : undefined;
  if (photo?.width && photo.height && photo.mime.startsWith("image/")) {
    cover = {
      kind: "photo",
      image: {
        path: photo.path,
        width: photo.width,
        height: photo.height,
        alt: photo.alt,
        dominantColor: photo.dominantColor,
        kind: photo.kind,
      },
      caption: photo.caption,
      credit: photo.credit,
    };
  } else if (row.illustration) {
    const product = db
      .select({ slug: products.slug, name: products.name })
      .from(products)
      .where(and(eq(products.status, "published"), or(eq(products.illustration, row.illustration), eq(products.slug, row.illustration))))
      .orderBy(asc(products.sortOrder), asc(products.id))
      .get();
    cover = { kind: "drawing", illustration: row.illustration, product: product ?? null };
  }

  const all = await listArticleCards();
  const cluster = topic ? all.filter((c) => c.topic?.slug === topic.slug) : [];
  const pillarId = topic
    ? (db.select({ id: topics.pillarPostId }).from(topics).where(eq(topics.slug, topic.slug)).get()?.id ?? null)
    : null;
  const next = card ? nextInPath(card, cluster, pillarId) : null;
  const related = card ? pickRelated(card, row.aboutEntities, all, new Set([row.id, ...(next ? [next.id] : [])])) : [];

  return {
    post: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      tldr: row.tldr,
      body: row.body,
      format: row.format,
      isPillar: row.isPillar,
      ageMinMonths: row.ageMinMonths,
      ageMaxMonths: row.ageMaxMonths,
      readingMinutes: row.readingMinutes,
      ymyl: row.ymyl,
      sources: row.sources,
      publishedAt: iso(row.publishedAt),
      contentUpdatedAt: iso(row.contentUpdatedAt ?? row.publishedAt),
      reviewedAt: iso(row.reviewedAt),
      primaryQuery: row.primaryQuery,
      secondaryQueries: row.secondaryQueries,
      aboutEntities: row.aboutEntities,
      illustration: row.illustration,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      canonicalPath: row.canonicalPath,
      noindex: row.noindex,
    },
    cover,
    topic,
    author,
    reviewer,
    faqs: faqRows,
    products: await getProductCardsBySlugs(productSlugs),
    headings: extractHeadings(row.body),
    steps: row.format === "howto" ? extractSteps(row.body) : [],
    wordCount: countWords(markdownToPlain(row.body)),
    next,
    related,
  };
}

/** Every published article slug (generateStaticParams). */
export async function listPostSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts);
  return db
    .select({ slug: posts.slug })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), asc(posts.id))
    .all()
    .map((p) => p.slug);
}
