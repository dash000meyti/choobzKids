import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { listArticleCards, listRoomCards, type ArticleCardData, type RoomCardData } from "@/db/queries/cards";
import { listProductCards, type ProductCardData } from "@/db/queries/catalog";
import { listFaqs, type FaqEntry } from "@/db/queries/faq";
import { authors, settings, type Source } from "@/db/schema";
import { AGE_HUBS, AGE_STAGES, overlapsAge, type AgeHub, type AgeHubSlug, type AgeStage } from "@/lib/ages";
import { tag } from "@/lib/cache-tags";
import type { AuthorLdInput } from "@/lib/jsonld";
import { markdownToPlain } from "@/lib/markdown";

/*
 * Age hubs (DESIGN.md §7.5, SEO.md §1.5, §8.8). The hub list and ranges are fixed in
 * src/lib/ages.ts; the editorial (intro, one milestone paragraph and home tips per sub-range,
 * sources, optional reviewer) lives in `settings.age_hubs`. Each hub page lists:
 *   · products whose [ageMin, ageMax) overlaps a sub-range (overlapsAge)
 *   · guides for that age, the matching ready-made room, and the hub's own FAQs (scope 'age').
 *
 * A product or post may appear as a card only once per page (its `product-{id}` / `post-{id}`
 * morph name must be unique), so every overlapping item is carded in the one sub-range it suits
 * best and listed by name («برای این سن هم مناسب است») in the others. Nothing is dropped.
 */

/* ------------------------------------------------------------------ */
/* settings.age_hubs                                                   */
/* ------------------------------------------------------------------ */

type HubEditorial = {
  slug: string;
  intro: string;
  sections: { anchor: string; milestone: string; tips: string[] }[];
  sources: Source[];
  /** Author slug of the expert who reviewed the milestones ⚑ — shown only for a published person. */
  reviewer?: string;
};

const isString = (v: unknown): v is string => typeof v === "string";
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Defensive read of the JSON setting: malformed entries are skipped, never thrown on a public page. */
function parseEditorial(value: unknown): HubEditorial[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): HubEditorial[] => {
    if (!isRecord(raw) || !isString(raw.slug)) return [];
    const sections = Array.isArray(raw.sections)
      ? raw.sections.flatMap((s) =>
          isRecord(s) && isString(s.anchor)
            ? [
                {
                  anchor: s.anchor,
                  milestone: isString(s.milestone) ? s.milestone : "",
                  tips: Array.isArray(s.tips) ? s.tips.filter(isString) : [],
                },
              ]
            : [],
        )
      : [];
    const sources = Array.isArray(raw.sources)
      ? raw.sources.flatMap((s) =>
          isRecord(s) && isString(s.title) && isString(s.url)
            ? [{ title: s.title, url: s.url, ...(isString(s.publisher) ? { publisher: s.publisher } : {}) }]
            : [],
        )
      : [];
    return [
      {
        slug: raw.slug,
        intro: isString(raw.intro) ? raw.intro : "",
        sections,
        sources,
        ...(isString(raw.reviewer) ? { reviewer: raw.reviewer } : {}),
      },
    ];
  });
}

function loadEditorial(): HubEditorial[] {
  const row = db.select().from(settings).where(eq(settings.key, "age_hubs")).get();
  return parseEditorial(row?.value);
}

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

/** The door stage a hub or sub-range opens: its pencil mark and room (DESIGN.md §5.3). */
export type AgeStageSummary = Pick<AgeStage, "key" | "label" | "markLabel" | "medianCm" | "minMonths" | "maxMonths">;

export type AgeScene = {
  stage: AgeStageSummary;
  /** The stage's ready-made room, whose default-on pieces furnish the scene. */
  room: RoomCardData | null;
};

export type AgeSectionData = {
  /** ASCII anchor, e.g. "1-2-years". */
  anchor: string;
  label: string;
  minMonths: number;
  maxMonths: number;
  /** The home door stage that lands here (its chip morphs into this section's hex). */
  stage: AgeStageSummary | null;
  milestone: string | null;
  tips: string[];
  /** Products carded in this section. */
  products: ProductCardData[];
  /** Products that also suit this sub-range but are carded in another section of the page. */
  alsoSuitable: { slug: string; name: string; anchor: string }[];
  posts: ArticleCardData[];
  room: RoomCardData | null;
};

export type AgeReviewer = AuthorLdInput & { role: string };

export type AgeHubData = Pick<AgeHub, "slug" | "label" | "h1" | "minMonths" | "maxMonths"> & {
  /** The age tint of the hub's first stage (chips, the hub hex). */
  tint: AgeStage["key"];
  /** Door stages inside this hub, youngest first. */
  stages: AgeStageSummary[];
  intro: string | null;
  sections: AgeSectionData[];
  sources: Source[];
  /** A published reviewer for the milestone text, or null (never invented). */
  reviewer: AgeReviewer | null;
  faqs: FaqEntry[];
  scene: AgeScene;
  /** Distinct products / posts on the page. */
  productCount: number;
  postCount: number;
};

export type AgeIndexHub = Pick<AgeHub, "slug" | "label" | "h1" | "minMonths" | "maxMonths"> & {
  tint: AgeStage["key"];
  /** The intro's first paragraph as plain text. */
  summary: string | null;
  sections: { anchor: string; label: string }[];
  productCount: number;
  postCount: number;
};

export type AgeIndexData = {
  hubs: AgeIndexHub[];
  /** The door in its default stage (DESIGN.md §7.5). */
  scene: AgeScene;
};

/** The door's default stage when no age is chosen: the first steps. */
const DEFAULT_STAGE = "1-2y";

const POSTS_PER_SECTION = 3;

const summarise = (stage: AgeStage): AgeStageSummary => ({
  key: stage.key,
  label: stage.label,
  markLabel: stage.markLabel,
  medianCm: stage.medianCm,
  minMonths: stage.minMonths,
  maxMonths: stage.maxMonths,
});

const stagesOf = (slug: AgeHubSlug) => AGE_STAGES.filter((s) => s.hub === slug);

function sceneFor(stage: AgeStage, rooms: RoomCardData[]): AgeScene {
  return { stage: summarise(stage), room: rooms.find((r) => r.slug === stage.roomPreset) ?? null };
}

type Range = { minMonths: number; maxMonths: number };

/** Months of `range` covered by an item's age range (open ends allowed). */
function overlapMonths(item: { ageMinMonths: number | null; ageMaxMonths: number | null }, range: Range): number {
  const from = Math.max(item.ageMinMonths ?? 0, range.minMonths);
  const to = Math.min(item.ageMaxMonths ?? Number.POSITIVE_INFINITY, range.maxMonths);
  return Math.max(0, to - from);
}

/**
 * Cards each overlapping product in one sub-range: the one whose span it covers most fully;
 * ties go to the sub-range whose ready-made room includes it, then to the shorter list so far,
 * then to the younger range. Input order (shop order) is kept inside each section.
 */
function assignProducts(products: ProductCardData[], sections: (Range & { roomSlugs: Set<string> })[]): number[] {
  const counts = sections.map(() => 0);
  return products.map((product) => {
    let best = -1;
    let bestKey: [number, number, number] = [-1, -1, 0];
    sections.forEach((section, i) => {
      const share = overlapMonths(product, section) / (section.maxMonths - section.minMonths);
      if (share <= 0) return;
      const key: [number, number, number] = [share, section.roomSlugs.has(product.slug) ? 1 : 0, -counts[i]];
      const better = key[0] !== bestKey[0] ? key[0] > bestKey[0] : key[1] !== bestKey[1] ? key[1] > bestKey[1] : key[2] > bestKey[2];
      if (best === -1 || better) {
        best = i;
        bestKey = key;
      }
    });
    if (best >= 0) counts[best]++;
    return best;
  });
}

/**
 * Up to `POSTS_PER_SECTION` guides per sub-range, dealt round-robin so each section gets its own:
 * the narrowest age range first (the most specific advice), then pillar guides, then newest.
 */
function assignPosts(posts: ArticleCardData[], sections: Range[]): ArticleCardData[][] {
  const span = (p: ArticleCardData) => (p.ageMaxMonths ?? 999) - (p.ageMinMonths ?? 0);
  const ranked = [...posts].sort((a, b) => span(a) - span(b) || Number(b.isPillar) - Number(a.isPillar));
  const used = new Set<number>();
  const dealt: ArticleCardData[][] = sections.map(() => []);
  for (let round = 0; round < POSTS_PER_SECTION; round++) {
    sections.forEach((section, i) => {
      const next = ranked.find((p) => !used.has(p.id) && overlapsAge(p, section.minMonths, section.maxMonths));
      if (!next) return;
      used.add(next.id);
      dealt[i].push(next);
    });
  }
  return dealt;
}

function loadReviewer(slug: string | undefined): AgeReviewer | null {
  if (!slug) return null;
  const row = db
    .select()
    .from(authors)
    .where(and(eq(authors.slug, slug), eq(authors.isPlaceholder, false)))
    .get();
  if (!row) return null;
  return {
    slug: row.slug,
    name: row.name,
    role: row.role,
    jobTitle: row.jobTitle,
    isPlaceholder: false,
    isOrganization: row.isOrganization,
  };
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Hub slugs, for generateStaticParams. */
export async function listAgeHubSlugs(): Promise<AgeHubSlug[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site);
  return AGE_HUBS.map((h) => h.slug);
}

/** /age: the three hubs with counts and a one-paragraph summary, and the door scene. */
export async function getAgeIndex(): Promise<AgeIndexData> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.settings, tag.products, tag.posts, tag.rooms);

  const [products, posts, rooms] = await Promise.all([listProductCards(), listArticleCards(), listRoomCards()]);
  const editorial = loadEditorial();
  const defaultStage = AGE_STAGES.find((s) => s.key === DEFAULT_STAGE) ?? AGE_STAGES[0];

  const hubs = AGE_HUBS.map((hub): AgeIndexHub => {
    const intro = editorial.find((e) => e.slug === hub.slug)?.intro.trim();
    const firstParagraph = intro ? markdownToPlain(intro.split(/\n\s*\n/)[0]).trim() : "";
    return {
      slug: hub.slug,
      label: hub.label,
      h1: hub.h1,
      minMonths: hub.minMonths,
      maxMonths: hub.maxMonths,
      tint: stagesOf(hub.slug)[0]?.key ?? "0-6m",
      summary: firstParagraph || null,
      sections: hub.sections.map((s) => ({ anchor: s.anchor, label: s.label })),
      productCount: products.filter((p) => overlapsAge(p, hub.minMonths, hub.maxMonths)).length,
      postCount: posts.filter((p) => overlapsAge(p, hub.minMonths, hub.maxMonths)).length,
    };
  });

  return { hubs, scene: sceneFor(defaultStage, rooms) };
}

/** One hub page; null for an unknown slug. */
export async function getAgeHub(slug: string): Promise<AgeHubData | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.settings, tag.products, tag.categories, tag.posts, tag.topics, tag.rooms, tag.media, tag.faqs, tag.authors);

  const hub = AGE_HUBS.find((h) => h.slug === slug);
  if (!hub) return null;

  const [allProducts, allPosts, rooms, faqs] = await Promise.all([
    listProductCards(),
    listArticleCards(),
    listRoomCards(),
    listFaqs("age", hub.slug),
  ]);
  const editorial = loadEditorial().find((e) => e.slug === hub.slug);
  const stages = stagesOf(hub.slug);

  const sectionMeta = hub.sections.map((section) => {
    const stage = stages.find((s) => s.hubAnchor === section.anchor) ?? null;
    const room = stage ? (rooms.find((r) => r.slug === stage.roomPreset) ?? null) : null;
    return { ...section, stage, room, roomSlugs: new Set(room?.pieces.map((p) => p.slug) ?? []) };
  });

  const products = allProducts.filter((p) => overlapsAge(p, hub.minMonths, hub.maxMonths));
  const home = assignProducts(products, sectionMeta);
  const posts = assignPosts(
    allPosts.filter((p) => overlapsAge(p, hub.minMonths, hub.maxMonths)),
    sectionMeta,
  );

  const sections = sectionMeta.map((section, i): AgeSectionData => {
    const copy = editorial?.sections.find((s) => s.anchor === section.anchor);
    return {
      anchor: section.anchor,
      label: section.label,
      minMonths: section.minMonths,
      maxMonths: section.maxMonths,
      stage: section.stage ? summarise(section.stage) : null,
      milestone: copy?.milestone.trim() || null,
      tips: copy?.tips ?? [],
      products: products.filter((_, p) => home[p] === i),
      alsoSuitable: products.flatMap((p, j) =>
        home[j] !== i && home[j] >= 0 && overlapsAge(p, section.minMonths, section.maxMonths)
          ? [{ slug: p.slug, name: p.name, anchor: sectionMeta[home[j]].anchor }]
          : [],
      ),
      posts: posts[i],
      room: section.room,
    };
  });

  // The door stands at the top of the hub's range: the mark this age grows toward.
  const sceneStage = stages[stages.length - 1] ?? AGE_STAGES[0];

  return {
    slug: hub.slug,
    label: hub.label,
    h1: hub.h1,
    minMonths: hub.minMonths,
    maxMonths: hub.maxMonths,
    tint: stages[0]?.key ?? "0-6m",
    stages: stages.map(summarise),
    intro: editorial?.intro.trim() || null,
    sections,
    sources: editorial?.sources ?? [],
    reviewer: loadReviewer(editorial?.reviewer),
    faqs,
    scene: sceneFor(sceneStage, rooms),
    productCount: home.filter((h) => h >= 0).length,
    postCount: posts.flat().length,
  };
}
