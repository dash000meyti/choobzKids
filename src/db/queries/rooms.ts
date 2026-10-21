import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { listRoomCards, type RoomCardData } from "@/db/queries/cards";
import { faqs, products, roomPresets } from "@/db/schema";
import { AGE_STAGES, type AgeStage } from "@/lib/ages";
import { tag } from "@/lib/cache-tags";

/*
 * Ready-made rooms («اتاقش رو بچین», DESIGN.md §5.3, §6.4): the five age rooms behind the home
 * height door, the /rooms shelf and one /rooms/{preset} page. Pieces, prices and totals come from
 * `listRoomCards()` (cards.ts), so the door, the RoomCards and the preset pages never disagree.
 *
 * The five door stages (labels, WHO median heights ⚑, milestones, hub anchors) are the code
 * constants in src/lib/ages.ts — there is no `settings.age_stages` row in the seed yet.
 */

/** The 9 m² preset the door links to («اتاق کوچکه؟ چیدمان ۹ متری ←»). */
const SMALL_ROOM_SLUG = "small-room-9m";

export type AgeRoom = Pick<AgeStage, "key" | "label" | "markLabel" | "medianCm" | "milestone"> & {
  /** Age hub section for this stage, e.g. /age/1-3-years#1-2-years. */
  hubHref: string;
  /** «۱ تا ۲ سالگی» for «همهٔ وسایل و راهنماهای ۱ تا ۲ سالگی ←». */
  hubLabel: string;
  /** The stage's preset; null when it is unpublished or has no pieces. */
  room: RoomCardData | null;
};

export type AgeRooms = {
  rooms: AgeRoom[];
  smallRoom: { slug: string; name: string } | null;
};

/** «۱ تا ۲ سال» → «۱ تا ۲ سالگی», «۰ تا ۶ ماه» → «۰ تا ۶ ماهگی». */
function stageAgeLabel(label: string): string {
  return /(?:سال|ماه)$/.test(label) ? `${label}گی` : label;
}

/** The five rooms of the height door, in age order, with their pieces and live totals. */
export async function getAgeRooms(): Promise<AgeRooms> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.rooms, tag.products, tag.media);
  const cards = await listRoomCards();
  const bySlug = new Map(cards.map((card) => [card.slug, card]));
  const small = bySlug.get(SMALL_ROOM_SLUG);
  return {
    rooms: AGE_STAGES.map((stage) => {
      const room = bySlug.get(stage.roomPreset) ?? cards.find((card) => card.ageStage === stage.key) ?? null;
      return {
        key: stage.key,
        label: stage.label,
        markLabel: stage.markLabel,
        medianCm: stage.medianCm,
        milestone: stage.milestone,
        hubHref: `/age/${stage.hub}#${stage.hubAnchor}`,
        hubLabel: stageAgeLabel(stage.label),
        room: room && room.pieces.length ? room : null,
      };
    }),
    smallRoom: small ? { slug: small.slug, name: small.name } : null,
  };
}

/** Published preset slugs, for generateStaticParams and the sitemap. */
export async function listRoomPresets(): Promise<{ slug: string; name: string; updatedAt: string }[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.rooms);
  return db
    .select({ slug: roomPresets.slug, name: roomPresets.name, updatedAt: roomPresets.updatedAt })
    .from(roomPresets)
    .where(eq(roomPresets.status, "published"))
    .orderBy(asc(roomPresets.sortOrder), asc(roomPresets.id))
    .all()
    .map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() }));
}

/** One piece's real floor footprint, for the 9 m² plan. */
export type RoomFootprint = {
  productId: number;
  name: string;
  slot: string;
  widthCm: number;
  depthCm: number;
  /** Depth when folded against the wall (the Pikler triangle folds to 12 cm), else null. */
  foldedDepthCm: number | null;
};

export type RoomPresetPage = RoomCardData & {
  /** Markdown editorial, 300–500 words. */
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  /** Overrides /rooms/{slug} as the canonical path (consolidation only). */
  canonicalPath: string | null;
  primaryQuery: string | null;
  noindex: boolean;
  updatedAt: string;
  footprints: RoomFootprint[];
};

/** A key in `dimensions.extra` that names a folded depth («عمق … جمع‌شده»). */
const FOLDED_DEPTH = /عمق.*جمع/;

/** One published preset with its editorial and SEO fields, or null. */
export async function getRoomPreset(slug: string): Promise<RoomPresetPage | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.rooms, tag.products, tag.media);
  const card = (await listRoomCards()).find((room) => room.slug === slug);
  if (!card) return null;
  const row = db
    .select({
      description: roomPresets.description,
      seoTitle: roomPresets.seoTitle,
      seoDescription: roomPresets.seoDescription,
      canonicalPath: roomPresets.canonicalPath,
      primaryQuery: roomPresets.primaryQuery,
      noindex: roomPresets.noindex,
      updatedAt: roomPresets.updatedAt,
    })
    .from(roomPresets)
    .where(and(eq(roomPresets.id, card.id), eq(roomPresets.status, "published")))
    .get();
  if (!row) return null;

  const ids = card.pieces.map((piece) => piece.productId);
  for (const id of ids) cacheTag(tag.product(id));
  const dims = new Map(
    (ids.length
      ? db.select({ id: products.id, dimensions: products.dimensions }).from(products).where(inArray(products.id, ids)).all()
      : []
    ).map((p) => [p.id, p.dimensions]),
  );

  const footprints: RoomFootprint[] = [];
  for (const piece of card.pieces) {
    const d = dims.get(piece.productId);
    if (!d) continue;
    const folded = Object.entries(d.extra ?? {}).find(([key]) => FOLDED_DEPTH.test(key));
    footprints.push({
      productId: piece.productId,
      name: piece.name,
      slot: piece.slot,
      widthCm: d.widthCm,
      depthCm: d.depthCm,
      foldedDepthCm: folded ? folded[1] : null,
    });
  }

  return {
    ...card,
    description: row.description,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalPath: row.canonicalPath || null,
    primaryQuery: row.primaryQuery,
    noindex: row.noindex,
    updatedAt: row.updatedAt.toISOString(),
    footprints,
  };
}

export type RoomFaq = { id: number; question: string; answer: string };

/** The room's own FAQ (scope `room`, scopeId = preset id), shown on /rooms/{preset} with FAQPage. */
export async function listRoomFaqs(presetId: number): Promise<RoomFaq[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.faqs, tag.rooms);
  return db
    .select({ id: faqs.id, question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(and(eq(faqs.scope, "room"), eq(faqs.scopeId, presetId)))
    .orderBy(asc(faqs.sortOrder), asc(faqs.id))
    .all();
}
