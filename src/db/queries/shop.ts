import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, faqs, glossaryTerms, postProducts, posts, products } from "@/db/schema";
import { listRoomCards, type PostFormat, type RoomCardData } from "@/db/queries/cards";
import { listCategories, listProductCards, type CategorySummary, type ProductCardData } from "@/db/queries/catalog";
import { getSettings } from "@/db/queries/settings";
import { AGE_FACETS, AGE_HUBS, AGE_STAGES, overlapsAge, SKILLS, type AgeStageKey } from "@/lib/ages";
import { tag } from "@/lib/cache-tags";
import { parseSiteHref, type LinkScheme } from "@/lib/markdown";
import type { IconName } from "@/components/ui/Icon";

/*
 * Reads for the shop listing (`/shop`) and the category pages (`/shop/{category}`), DESIGN.md
 * §6.1–§6.2 and SEO.md §1.4. Each page gets one cached object holding everything it renders:
 * the products (the same ProductCardData every grid uses), the category's buying guide, its
 * FAQs and glossary terms, and the filter facets that actually match something in the list.
 *
 * The category ↔ guide link (DESIGN.md §6.2 «راهنمای انتخاب») has no column of its own. The
 * editor already names it: every category intro links its guide with `post:` links, so the
 * first pillar the intro links (else its first guide, else its first post) is the category's
 * guide. Without such a link we fall back to the posts that feature the category's products.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ShopGuide = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  /** «خلاصه در یک نگاه» bullets, answer first. */
  tldr: string[];
  format: PostFormat;
  isPillar: boolean;
  readingMinutes: number;
  illustration: string | null;
};

export type ShopFaq = { id: number; question: string; answer: string };

export type ShopTerm = {
  slug: string;
  term: string;
  originalTerm: string | null;
  definition: string;
  /** Wikidata / Wikipedia URLs (the CollectionPage's `about`). */
  sameAs: string[];
};

export type AgeRangeMonths = { min: number | null; max: number | null };

/** One facet value the filter bar can offer: Latin `value` for the URL, Persian `label` for people. */
export type FacetOption = { value: string; label: string };

/**
 * The facets of one list, with only the values that match at least one product in it
 * (a chip that can only empty the grid is noise). Labels are Persian, values Latin (SEO.md §1.9).
 */
export type FilterFacets = {
  ages: (FacetOption & { tint: AgeStageKey; guide: { href: string; label: string } | null })[];
  skills: (FacetOption & { icon: IconName })[];
  prices: FacetOption[];
  /** «فقط آمادهٔ ارسال» is offered only when the list mixes ready and not-yet-ready products. */
  inStock: boolean;
};

export type ShopGroup = {
  category: CategorySummary;
  products: ProductCardData[];
  /** The category's buying guide, for editorial interludes. */
  guide: ShopGuide | null;
};

export type ShopIndex = {
  /** `settings.shopIntro` (≤ 120 words, plain text or light Markdown). */
  intro: string | null;
  /** Categories holding published products, in shelf order (the category rail). */
  categories: CategorySummary[];
  groups: ShopGroup[];
  /** Every published product in shop order (the ItemList). */
  products: ProductCardData[];
  ageRange: AgeRangeMonths;
  facets: FilterFacets;
  /** Buying FAQs for the bottom of the page (SEO.md §8.3: 3–5 questions). */
  faqs: ShopFaq[];
  /** Ready-made rooms, for editorial interludes. */
  rooms: RoomCardData[];
};

export type CategoryDetail = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  /** Markdown intro (120–250 words): first paragraph visible, the rest under «بیشتر بخوانید». */
  description: string | null;
  illustration: string | null;
  accent: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalPath: string | null;
  noindex: boolean;
  updatedAt: string;
};

export type CategoryPage = {
  category: CategoryDetail;
  products: ProductCardData[];
  /** «راهنمای انتخاب»: the pillar guide linked above the grid and excerpted below it. */
  guide: ShopGuide | null;
  faqs: ShopFaq[];
  terms: ShopTerm[];
  /** Every category with products (the rail shows the others). */
  categories: CategorySummary[];
  ageRange: AgeRangeMonths;
  facets: FilterFacets;
};

/* ------------------------------------------------------------------ */
/* Facets (DESIGN.md §6.1)                                              */
/* ------------------------------------------------------------------ */

/** Price presets of the `price` facet, Toman, `[min, max)`. */
export const PRICE_FACETS = [
  { value: "0-3000000", label: "زیر ۳ میلیون", min: 0, max: 3_000_000 },
  { value: "3000000-8000000", label: "۳ تا ۸ میلیون", min: 3_000_000, max: 8_000_000 },
  { value: "8000000-", label: "بالای ۸ میلیون", min: 8_000_000, max: Number.POSITIVE_INFINITY },
] as const;

/** One pencil-line icon per skill, from the shared sprite. */
const SKILL_ICON: Record<string, IconName> = {
  "gross-motor": "sprout",
  "fine-motor": "pencil",
  balance: "ruler",
  independence: "home",
  "practical-life": "saw",
  creativity: "star",
  language: "book",
  imagination: "moon",
  focus: "zoom",
  confidence: "heart",
};

/**
 * The age hub section that covers an age facet («راهنمای کامل ۱ تا ۳ سال ←»): the hub's anchor
 * for a stage that is only part of a hub, the hub itself when the stage is the whole hub.
 */
function ageGuide(min: number, max: number): { href: string; label: string } | null {
  const stage = AGE_STAGES.find((s) => s.minMonths === min && s.maxMonths === max);
  const hub = stage && AGE_HUBS.find((h) => h.slug === stage.hub);
  if (!stage || !hub) return null;
  const whole = hub.minMonths === min && hub.maxMonths === max;
  return { href: `/age/${hub.slug}${whole ? "" : `#${stage.hubAnchor}`}`, label: `راهنمای کامل ${hub.label}` };
}

function stageKey(min: number, max: number): AgeStageKey {
  return AGE_STAGES.find((s) => s.minMonths === min && s.maxMonths === max)?.key ?? "3-6y";
}

/** The facet values that match at least one of `list`. */
export function facetsFor(list: readonly ProductCardData[]): FilterFacets {
  const skills = new Set(list.flatMap((p) => p.skills));
  const ready = list.filter((p) => p.availability === "in_stock").length;
  return {
    ages: AGE_FACETS.filter((f) => list.some((p) => overlapsAge(p, f.min, f.max))).map((f) => ({
      value: f.value,
      label: f.label,
      tint: stageKey(f.min, f.max),
      guide: ageGuide(f.min, f.max),
    })),
    skills: Object.entries(SKILLS)
      .filter(([key]) => skills.has(key))
      .map(([value, label]) => ({ value, label, icon: SKILL_ICON[value] ?? "sprout" })),
    prices: PRICE_FACETS.filter((f) => list.some((p) => p.price >= f.min && p.price < f.max)).map(({ value, label }) => ({
      value,
      label,
    })),
    inStock: ready > 0 && ready < list.length,
  };
}

/** Youngest minimum and oldest stated maximum; open-ended only when no product states a maximum. */
function ageRangeOf(list: readonly ProductCardData[]): AgeRangeMonths {
  const mins = list.map((p) => p.ageMinMonths).filter((n): n is number => n != null);
  const maxes = list.map((p) => p.ageMaxMonths).filter((n): n is number => n != null);
  return { min: mins.length ? Math.min(...mins) : null, max: maxes.length ? Math.max(...maxes) : null };
}

/* ------------------------------------------------------------------ */
/* Loaders                                                             */
/* ------------------------------------------------------------------ */

function loadGuides(): ShopGuide[] {
  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      tldr: posts.tldr,
      format: posts.format,
      isPillar: posts.isPillar,
      readingMinutes: posts.readingMinutes,
      illustration: posts.illustration,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(asc(posts.id))
    .all();
}

/** Site links of one scheme in a Markdown body, in reading order, without duplicates. */
function linkedSlugs(markdown: string | null, scheme: LinkScheme): string[] {
  if (!markdown) return [];
  const slugs: string[] = [];
  for (const match of markdown.matchAll(/\]\(\s*([^)\s]+)[^)]*\)/g)) {
    const href = parseSiteHref(match[1]);
    if (href?.scheme === scheme && !slugs.includes(href.slug)) slugs.push(href.slug);
  }
  return slugs;
}

/** Posts that feature these products (post_products), with how many of them each features. */
function postsFeaturing(productIds: readonly number[]): Map<number, { overlap: number; total: number }> {
  const rows = db.select({ postId: postProducts.postId, productId: postProducts.productId }).from(postProducts).all();
  const ids = new Set(productIds);
  const stats = new Map<number, { overlap: number; total: number }>();
  for (const row of rows) {
    const s = stats.get(row.postId) ?? { overlap: 0, total: 0 };
    s.total += 1;
    if (ids.has(row.productId)) s.overlap += 1;
    stats.set(row.postId, s);
  }
  for (const [postId, s] of stats) if (!s.overlap) stats.delete(postId);
  return stats;
}

function pickGuide(description: string | null, productIds: readonly number[], guides: readonly ShopGuide[]): ShopGuide | null {
  const bySlug = new Map(guides.map((g) => [g.slug, g]));
  const linked = linkedSlugs(description, "post")
    .map((slug) => bySlug.get(slug))
    .filter((g): g is ShopGuide => g !== undefined);
  const editorial = linked.find((g) => g.isPillar) ?? linked.find((g) => g.format === "guide") ?? linked[0];
  if (editorial) return editorial;

  // No guide named in the intro: the post that is most about these products, pillars first.
  const featuring = postsFeaturing(productIds);
  const score = (g: ShopGuide) => {
    const s = featuring.get(g.id);
    return s ? s.overlap / s.total + s.overlap / 100 : 0;
  };
  const ranked = guides.filter((g) => featuring.has(g.id)).sort((a, b) => Number(b.isPillar) - Number(a.isPillar) || score(b) - score(a));
  return ranked[0] ?? null;
}

const TERM_LIMIT = 8;

/** Terms the intro links (in its order), then the terms whose related products are in this category. */
function loadTerms(description: string | null, productSlugs: readonly string[]): ShopTerm[] {
  const rows = db
    .select({
      slug: glossaryTerms.slug,
      term: glossaryTerms.term,
      originalTerm: glossaryTerms.originalTerm,
      definition: glossaryTerms.definition,
      sameAs: glossaryTerms.sameAs,
      relatedProductSlugs: glossaryTerms.relatedProductSlugs,
    })
    .from(glossaryTerms)
    .orderBy(asc(glossaryTerms.id))
    .all();
  const inCategory = new Set(productSlugs);
  const bySlug = new Map(rows.map((t) => [t.slug, t]));
  const linked = linkedSlugs(description, "term")
    .map((slug) => bySlug.get(slug))
    .filter((t) => t !== undefined);
  const related = rows
    .map((t) => ({ t, overlap: t.relatedProductSlugs.filter((s) => inCategory.has(s)).length }))
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .map(({ t }) => t);
  const seen = new Set<string>();
  const terms: ShopTerm[] = [];
  for (const t of [...linked, ...related]) {
    if (seen.has(t.slug)) continue;
    seen.add(t.slug);
    terms.push({ slug: t.slug, term: t.term, originalTerm: t.originalTerm, definition: t.definition, sameAs: t.sameAs });
    if (terms.length === TERM_LIMIT) break;
  }
  return terms;
}

function loadCategoryFaqs(categoryId: number): ShopFaq[] {
  return db
    .select({ id: faqs.id, question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(and(eq(faqs.scope, "category"), eq(faqs.scopeId, categoryId)))
    .orderBy(asc(faqs.sortOrder), asc(faqs.id))
    .all();
}

const SHOP_FAQ_LIMIT = 5;

function loadBuyingFaqs(): ShopFaq[] {
  return db
    .select({ id: faqs.id, question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(and(eq(faqs.scope, "general"), eq(faqs.scopeKey, "buying")))
    .orderBy(asc(faqs.sortOrder), asc(faqs.id))
    .limit(SHOP_FAQ_LIMIT)
    .all();
}

function loadCategoryRows() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      tagline: categories.tagline,
      description: categories.description,
      illustration: categories.illustration,
      accent: categories.accent,
      seoTitle: categories.seoTitle,
      seoDescription: categories.seoDescription,
      canonicalPath: categories.canonicalPath,
      noindex: categories.noindex,
      updatedAt: categories.updatedAt,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id))
    .all();
}

/* ------------------------------------------------------------------ */
/* Public reads                                                        */
/* ------------------------------------------------------------------ */

/** Everything `/shop` renders. */
export async function getShopIndex(): Promise<ShopIndex> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.products, tag.categories, tag.posts, tag.faqs, tag.rooms, tag.settings, tag.media);
  const [cards, summaries, rooms, intro] = await Promise.all([
    listProductCards(),
    listCategories(),
    listRoomCards(),
    loadShopIntro(),
  ]);
  const guides = loadGuides();
  const rows = loadCategoryRows();

  const groups: ShopGroup[] = summaries.flatMap((category) => {
    const list = cards.filter((p) => p.category.slug === category.slug);
    if (!list.length) return [];
    const description = rows.find((r) => r.id === category.id)?.description ?? null;
    return [{ category, products: list, guide: pickGuide(description, list.map((p) => p.id), guides) }];
  });

  return {
    intro,
    categories: groups.map((g) => g.category),
    groups,
    products: cards,
    ageRange: ageRangeOf(cards),
    facets: facetsFor(cards),
    faqs: loadBuyingFaqs(),
    rooms,
  };
}

/** Everything `/shop/{slug}` renders, or null when the category is unknown or holds no published product. */
export async function getCategoryPage(slug: string): Promise<CategoryPage | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.categories, tag.products, tag.posts, tag.faqs, tag.glossary, tag.media);
  const row = loadCategoryRows().find((c) => c.slug === slug);
  if (!row) return null;
  const [cards, summaries] = await Promise.all([listProductCards(), listCategories()]);
  const list = cards.filter((p) => p.category.slug === slug);
  if (!list.length) return null;

  const guide = pickGuide(row.description, list.map((p) => p.id), loadGuides());
  return {
    category: { ...row, updatedAt: row.updatedAt.toISOString() },
    products: list,
    guide,
    faqs: loadCategoryFaqs(row.id),
    terms: loadTerms(row.description, list.map((p) => p.slug)),
    categories: summaries.filter((c) => c.productCount > 0),
    ageRange: ageRangeOf(list),
    facets: facetsFor(list),
  };
}

/** Slugs of every category with at least one published product (`generateStaticParams`). */
export async function listCategorySlugs(): Promise<string[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.categories, tag.products);
  const withProducts = new Set(
    db
      .selectDistinct({ categoryId: products.categoryId })
      .from(products)
      .where(eq(products.status, "published"))
      .all()
      .map((r) => r.categoryId),
  );
  return loadCategoryRows()
    .filter((c) => withProducts.has(c.id))
    .map((c) => c.slug);
}

async function loadShopIntro(): Promise<string | null> {
  const intro = (await getSettings()).shopIntro?.trim();
  return intro || null;
}
