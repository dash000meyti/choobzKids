import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import type { CardImage } from "@/db/queries/catalog";
import {
  glossaryTerms,
  media,
  posts,
  productMedia,
  products,
  productVariants,
  roomPresetItems,
  roomPresets,
  topics,
} from "@/db/schema";
import { overlapsAge, type AgeStageKey } from "@/lib/ages";
import { tag } from "@/lib/cache-tags";
import { installments } from "@/lib/format";

/*
 * Card-sized reads for the magazine, glossary, room and product-card surfaces (DESIGN.md §4.11).
 * Like catalog.ts, everything returned is plain serialisable data with dates as ISO strings.
 * Each collection is loaded whole and filtered in memory: the site holds tens of rows, and one
 * small cache entry per call shape is cheaper than a query per card.
 */

/* ------------------------------------------------------------------ */
/* Articles                                                            */
/* ------------------------------------------------------------------ */

export type PostFormat = (typeof posts.$inferSelect)["format"];

export type ArticleCardData = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  /** The first «خلاصه در یک نگاه» bullet — the answer-first line — or null. */
  tldr: string | null;
  format: PostFormat;
  isPillar: boolean;
  featured: boolean;
  topic: { slug: string; name: string; accent: string | null } | null;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  readingMinutes: number;
  /** Manifest key of the drawing used as the cover while no cover photo exists. */
  illustration: string | null;
  cover: CardImage | null;
  publishedAt: string | null;
  /** Editorial «به‌روزرسانی» date, falling back to the publish date. */
  updatedAt: string | null;
};

export type ArticleCardQuery = {
  topicSlug?: string;
  featured?: boolean;
  pillar?: boolean;
  /** Keep posts whose age range overlaps [ageMin, ageMax) months (open ends allowed). */
  ageMin?: number;
  ageMax?: number;
  offset?: number;
  limit?: number;
};

const iso = (date: Date | null) => (date ? date.toISOString() : null);

/** Every published post, newest first. */
function loadArticleCards(): ArticleCardData[] {
  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      tldr: posts.tldr,
      format: posts.format,
      isPillar: posts.isPillar,
      featured: posts.featured,
      ageMinMonths: posts.ageMinMonths,
      ageMaxMonths: posts.ageMaxMonths,
      readingMinutes: posts.readingMinutes,
      illustration: posts.illustration,
      publishedAt: posts.publishedAt,
      contentUpdatedAt: posts.contentUpdatedAt,
      topicSlug: topics.slug,
      topicName: topics.name,
      topicAccent: topics.accent,
      coverPath: media.path,
      coverWidth: media.width,
      coverHeight: media.height,
      coverAlt: media.alt,
      coverColor: media.dominantColor,
      coverKind: media.kind,
    })
    .from(posts)
    .leftJoin(topics, eq(topics.id, posts.topicId))
    .leftJoin(media, eq(media.id, posts.coverMediaId))
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), desc(posts.id))
    .all()
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      tldr: r.tldr[0] ?? null,
      format: r.format,
      isPillar: r.isPillar,
      featured: r.featured,
      topic: r.topicSlug && r.topicName ? { slug: r.topicSlug, name: r.topicName, accent: r.topicAccent } : null,
      ageMinMonths: r.ageMinMonths,
      ageMaxMonths: r.ageMaxMonths,
      readingMinutes: r.readingMinutes,
      illustration: r.illustration,
      cover: r.coverPath
        ? {
            path: r.coverPath,
            width: r.coverWidth,
            height: r.coverHeight,
            alt: r.coverAlt ?? "",
            dominantColor: r.coverColor,
            kind: r.coverKind ?? "photo",
          }
        : null,
      publishedAt: iso(r.publishedAt),
      updatedAt: iso(r.contentUpdatedAt ?? r.publishedAt),
    }));
}

function matchArticles(cards: ArticleCardData[], query: ArticleCardQuery): ArticleCardData[] {
  const { topicSlug, featured, pillar, ageMin, ageMax } = query;
  const byAge = ageMin !== undefined || ageMax !== undefined;
  return cards.filter(
    (post) =>
      (topicSlug === undefined || post.topic?.slug === topicSlug) &&
      (featured === undefined || post.featured === featured) &&
      (pillar === undefined || post.isPillar === pillar) &&
      (!byAge || overlapsAge(post, ageMin ?? 0, ageMax ?? Number.POSITIVE_INFINITY)),
  );
}

/** Published posts, newest first, optionally narrowed by topic, flags or age, then paged. */
export async function listArticleCards(query: ArticleCardQuery = {}): Promise<ArticleCardData[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts, tag.topics, tag.media);
  const { offset = 0, limit } = query;
  const matches = matchArticles(loadArticleCards(), query);
  return matches.slice(offset, limit === undefined ? undefined : offset + limit);
}

/** How many posts `listArticleCards(query)` would return without `offset`/`limit` (pagination). */
export async function countArticleCards(query: Omit<ArticleCardQuery, "offset" | "limit"> = {}): Promise<number> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts, tag.topics);
  return matchArticles(loadArticleCards(), query).length;
}

/** Cards for specific slugs, in the order given (unknown or unpublished slugs are skipped). */
export async function getArticleCardsBySlugs(slugs: string[]): Promise<ArticleCardData[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts, tag.topics, tag.media);
  if (!slugs.length) return [];
  const bySlug = new Map(loadArticleCards().map((post) => [post.slug, post]));
  return slugs.map((slug) => bySlug.get(slug)).filter((post): post is ArticleCardData => post !== undefined);
}

/* ------------------------------------------------------------------ */
/* Product variants (the card's quick-add mini sheet)                   */
/* ------------------------------------------------------------------ */

export type VariantOption = {
  id: number;
  name: string;
  /** Toman: the variant's own price, or the product price when the variant has none. */
  price: number;
  swatch: string | null;
};

/** Variants of every published product, keyed by product id, in picker order. */
export async function listVariantOptions(): Promise<Record<number, VariantOption[]>> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.products);
  const rows = db
    .select({
      productId: productVariants.productId,
      id: productVariants.id,
      name: productVariants.name,
      price: productVariants.price,
      swatch: productVariants.swatch,
      productPrice: products.price,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(products.status, "published"))
    .orderBy(asc(productVariants.productId), asc(productVariants.sortOrder), asc(productVariants.id))
    .all();

  const options: Record<number, VariantOption[]> = {};
  for (const r of rows) {
    (options[r.productId] ??= []).push({ id: r.id, name: r.name, price: r.price ?? r.productPrice, swatch: r.swatch });
  }
  return options;
}

/* ------------------------------------------------------------------ */
/* Rooms                                                               */
/* ------------------------------------------------------------------ */

export type RoomPiece = {
  productId: number;
  /** The preset's variant, else the product's cheapest one; null for products without variants. */
  variantId: number | null;
  variantName: string | null;
  slug: string;
  name: string;
  illustration: string | null;
  /** First product photo/cut-out path, for cart thumbnails. */
  imagePath: string | null;
  /** Named place in the room scene (validate with `isRoomSlot` from shop/room-slots). */
  slot: string;
  /** In the room when it first renders; the visitor can toggle the others. */
  defaultOn: boolean;
  /** Current Toman price of this piece (its variant's price, or the product price). */
  priceToman: number;
  /** Real depth, which moves the piece's foot line toward the viewer in the scene. */
  depthCm: number | null;
  availability: (typeof products.$inferSelect)["availability"];
};

export type RoomCardData = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  ageStage: AgeStageKey | null;
  floorAreaM2: number | null;
  /** Which RoomBackdrop the scene uses: "small" is the 9 m² corner room. */
  variant: "default" | "small";
  /** Every piece of the preset in scene order (default-on and optional). */
  pieces: RoomPiece[];
  /** Default-on pieces. */
  pieceCount: number;
  /** Sum of the default-on pieces' current prices, Toman. */
  totalToman: number;
  /**
   * One of 4 equal SnappPay payments of the total, rounded up to 1,000 Toman. Display goes
   * through InstallmentLine / installmentPlan, which also checks settings.snapppay eligibility.
   */
  installmentToman: number;
};

const SMALL_ROOM_MAX_M2 = 10;
const AGE_STAGE_KEYS: ReadonlySet<string> = new Set<AgeStageKey>(["0-6m", "6-12m", "1-2y", "2-3y", "3-6y"]);

function loadRoomCards(): RoomCardData[] {
  const presets = db
    .select({
      id: roomPresets.id,
      slug: roomPresets.slug,
      name: roomPresets.name,
      tagline: roomPresets.tagline,
      ageStage: roomPresets.ageStage,
      floorAreaM2: roomPresets.floorAreaM2,
    })
    .from(roomPresets)
    .where(eq(roomPresets.status, "published"))
    .orderBy(asc(roomPresets.sortOrder), asc(roomPresets.id))
    .all();
  if (!presets.length) return [];

  // Unpublished products drop out of every room.
  const items = db
    .select({
      presetId: roomPresetItems.presetId,
      variantId: roomPresetItems.variantId,
      slot: roomPresetItems.slot,
      defaultOn: roomPresetItems.defaultOn,
      productId: products.id,
      slug: products.slug,
      name: products.name,
      illustration: products.illustration,
      price: products.price,
      dimensions: products.dimensions,
      availability: products.availability,
    })
    .from(roomPresetItems)
    .innerJoin(products, eq(products.id, roomPresetItems.productId))
    .where(and(inArray(roomPresetItems.presetId, presets.map((p) => p.id)), eq(products.status, "published")))
    .orderBy(asc(roomPresetItems.presetId), asc(roomPresetItems.sortOrder))
    .all();

  const productIds = [...new Set(items.map((item) => item.productId))];
  const variants = productIds.length
    ? db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          name: productVariants.name,
          price: productVariants.price,
        })
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds))
        .orderBy(asc(productVariants.sortOrder), asc(productVariants.id))
        .all()
    : [];
  // First product media per product, as catalog.ts picks it for the card.
  const imagePaths = new Map<number, string>();
  if (productIds.length) {
    const rows = db
      .select({ productId: productMedia.productId, path: media.path })
      .from(productMedia)
      .innerJoin(media, eq(media.id, productMedia.mediaId))
      .where(inArray(productMedia.productId, productIds))
      .orderBy(asc(productMedia.sortOrder))
      .all();
    for (const row of rows) if (!imagePaths.has(row.productId)) imagePaths.set(row.productId, row.path);
  }

  return presets.map((preset) => {
    const pieces: RoomPiece[] = items
      .filter((item) => item.presetId === preset.id)
      .map((item) => {
        const own = variants.filter((v) => v.productId === item.productId);
        const priceOf = (v: (typeof own)[number]) => v.price ?? item.price;
        // The preset's pinned variant, else the cheapest (first in picker order on ties) — the
        // same «از» price the product card shows.
        const variant =
          own.find((v) => v.id === item.variantId) ??
          own.reduce<(typeof own)[number] | null>((best, v) => (!best || priceOf(v) < priceOf(best) ? v : best), null);
        return {
          productId: item.productId,
          variantId: variant?.id ?? null,
          variantName: variant?.name ?? null,
          slug: item.slug,
          name: item.name,
          illustration: item.illustration,
          imagePath: imagePaths.get(item.productId) ?? null,
          slot: item.slot,
          defaultOn: item.defaultOn,
          priceToman: variant ? priceOf(variant) : item.price,
          depthCm: item.dimensions?.depthCm ?? null,
          availability: item.availability,
        };
      });
    const inRoom = pieces.filter((piece) => piece.defaultOn);
    const totalToman = inRoom.reduce((sum, piece) => sum + piece.priceToman, 0);
    return {
      id: preset.id,
      slug: preset.slug,
      name: preset.name,
      tagline: preset.tagline,
      ageStage: preset.ageStage && AGE_STAGE_KEYS.has(preset.ageStage) ? (preset.ageStage as AgeStageKey) : null,
      floorAreaM2: preset.floorAreaM2,
      variant: preset.floorAreaM2 != null && preset.floorAreaM2 < SMALL_ROOM_MAX_M2 ? "small" : "default",
      pieces,
      pieceCount: inRoom.length,
      totalToman,
      installmentToman: installments(totalToman, 4),
    };
  });
}

/** Published room presets in their shelf order, with pieces and live totals. */
export async function listRoomCards(): Promise<RoomCardData[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.rooms, tag.products, tag.media);
  return loadRoomCards();
}

/* ------------------------------------------------------------------ */
/* Glossary                                                            */
/* ------------------------------------------------------------------ */

export type TermCardData = {
  id: number;
  slug: string;
  term: string;
  /** Latin/original form, e.g. "Pikler Triangle" (render inside <bdi lang="en">). */
  originalTerm: string | null;
  definition: string;
  alternateNames: string[];
  /** Drawing of the product this term names (e.g. «مثلث پیکلر»), when we make one. */
  illustration: string | null;
};

const faCollator = new Intl.Collator("fa");

/** Every glossary term in Persian alphabetical order. */
export async function listTermCards(): Promise<TermCardData[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.glossary, tag.products);
  // A term gets a drawing only when it names a product of ours outright (same slug), so the
  // picture never claims more than the word means.
  const drawings = new Map(
    db
      .select({ slug: products.slug, illustration: products.illustration })
      .from(products)
      .where(eq(products.status, "published"))
      .all()
      .map((p) => [p.slug, p.illustration]),
  );
  return db
    .select({
      id: glossaryTerms.id,
      slug: glossaryTerms.slug,
      term: glossaryTerms.term,
      originalTerm: glossaryTerms.originalTerm,
      definition: glossaryTerms.definition,
      alternateNames: glossaryTerms.alternateNames,
    })
    .from(glossaryTerms)
    .all()
    .map((t) => ({ ...t, illustration: drawings.get(t.slug) ?? null }))
    .sort((a, b) => faCollator.compare(a.term, b.term));
}
