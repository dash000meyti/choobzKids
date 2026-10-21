import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, inArray, isNotNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { listArticleCards, type ArticleCardData } from "@/db/queries/cards";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import {
  communityPhotos,
  faqs,
  media,
  postProducts,
  posts,
  productAddons,
  products,
  reviews,
  settings as settingsTable,
  topics,
  workshopLog,
} from "@/db/schema";
import { tag } from "@/lib/cache-tags";
import { IS_PRODUCTION_CONTENT } from "@/lib/env";
import { toFaDigits } from "@/lib/format";

/*
 * Data for the second half of the home story (DESIGN.md §5.4–§5.11): the notebook of mothers'
 * questions, the workshop, the engraver, the fridge door, the trust desk and the FAQ drawers.
 * Every read is a tagged 'use cache' function, so the whole page stays one static shell; the
 * workshop's live line is the only part with a shorter life (72-hour rule, §5.6).
 * Everything returned is plain serialisable data with dates as ISO strings.
 */

const iso = (date: Date) => date.toISOString();

/* ------------------------------------------------------------------ */
/* Notebook — «سؤال‌هایی که مامان‌ها هر روز از ما می‌پرسن» (§5.5)          */
/* ------------------------------------------------------------------ */

export type NotebookQuestion = {
  id: number;
  slug: string;
  /** The mother's question, in the post's own words. */
  question: string;
  /** The post's answer-first «خلاصه در یک نگاه» line. */
  answer: string;
};

export type NotebookData = {
  questions: NotebookQuestion[];
  pillar: ArticleCardData | null;
  latest: ArticleCardData[];
};

const QUESTION_MARK = "؟";

/**
 * The question a post answers: its title up to the first «؟» («برج یادگیری چیست؟»), else an
 * excerpt that opens with a question, else nothing (the post is not question-shaped).
 */
function questionOf(post: Pick<ArticleCardData, "title" | "excerpt">): { text: string; fromTitle: boolean } | null {
  const inTitle = post.title.indexOf(QUESTION_MARK);
  if (inTitle !== -1) return { text: post.title.slice(0, inTitle + 1).trim(), fromTitle: true };
  const first = post.excerpt.split(/(?<=[؟.!])\s+/)[0]?.trim() ?? "";
  if (first.endsWith(QUESTION_MARK)) return { text: first, fromTitle: false };
  return null;
}

/**
 * Three question bubbles, the pillar for the notebook cover and the three newest posts besides.
 * Bubbles prefer the editors' featured posts, then question-form titles, then newer posts, so
 * the shelf stays a list of real questions even when a featured post is a gift guide.
 * No post appears twice on the page (ArticleCard morph names must be unique).
 */
export async function getNotebook(): Promise<NotebookData> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts, tag.topics, tag.media);

  const cards = await listArticleCards();
  const topicOrder = new Map(
    db
      .select({ slug: topics.slug, sortOrder: topics.sortOrder })
      .from(topics)
      .all()
      .map((t) => [t.slug, t.sortOrder]),
  );

  const questions = cards
    .flatMap((post, recency) => {
      const q = questionOf(post);
      if (!q || !post.tldr) return [];
      const score = (post.featured ? 2 : 0) + (q.fromTitle ? 1 : 0.5);
      return [{ post, question: q.text, score, recency }];
    })
    .sort((a, b) => b.score - a.score || a.recency - b.recency)
    .slice(0, 3)
    .map(({ post, question }) => ({ id: post.id, slug: post.slug, question, answer: post.tldr! }));

  const asked = new Set(questions.map((q) => q.id));
  const rank = (post: ArticleCardData) => topicOrder.get(post.topic?.slug ?? "") ?? Number.MAX_SAFE_INTEGER;
  const pillar =
    cards
      .filter((post) => post.isPillar && !asked.has(post.id))
      .sort((a, b) => Number(b.featured) - Number(a.featured) || rank(a) - rank(b))[0] ?? null;

  const latest = cards.filter((post) => post.id !== pillar?.id && !asked.has(post.id)).slice(0, 3);

  return { questions, pillar, latest };
}

/* ------------------------------------------------------------------ */
/* Workshop picks — seasonal stamps (§5.4, §1.4)                         */
/* ------------------------------------------------------------------ */

/**
 * Products the season's gift guide recommends (`/mag/{season}-gift-guide`): they carry
 * «پیشنهاد یلدا» on the home shelf while the season is on. Empty when there is no guide.
 */
export async function listSeasonalPickIds(season: NonNullable<SiteSettings["season"]>): Promise<number[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts, tag.products);
  return db
    .select({ id: postProducts.productId })
    .from(postProducts)
    .innerJoin(posts, eq(posts.id, postProducts.postId))
    .where(and(eq(posts.slug, `${season}-gift-guide`), eq(posts.status, "published")))
    .all()
    .map((r) => r.id);
}

/* ------------------------------------------------------------------ */
/* Workshop — «از ورق تا اتاقِ بچه‌ت» (§5.6)                               */
/* ------------------------------------------------------------------ */

/** A log entry is "today in the workshop" for 72 hours, never longer. */
export const LIVE_WINDOW_MS = 72 * 60 * 60 * 1000;

export type WorkshopLive = {
  /** «۱۲ برج یادگیری زیر سنباده‌اند» */
  text: string;
  /** «۱ تا ۳ روز کاری» from the shipping policy's handling days ⚑, or null. */
  leadTime: string | null;
  createdAt: string;
  /** createdAt + 72 h; the inline script hides the strip after this instant. */
  expiresAt: string;
};

export type WorkshopStory = {
  /** The brand's defining sentence (= Organization.description, SEO.md §8.2). */
  intro: string;
  steps: SiteSettings["workshopSteps"];
  live: WorkshopLive | null;
};

function dayRange(days: [number, number] | null | undefined): string | null {
  if (!days) return null;
  const [from, to] = days;
  return from === to ? `${toFaDigits(from)} روز کاری` : `${toFaDigits(from)} تا ${toFaDigits(to)} روز کاری`;
}

/**
 * The five steps from settings, and the newest workshop_log entry while it is < 72 h old at
 * render time. A fresh entry shortens this entry's life to `hours`, so the server stops
 * rendering it within an hour of expiry; the client hides it at the exact instant.
 */
export async function getWorkshopStory(): Promise<WorkshopStory> {
  "use cache";
  cacheTag(tag.site, tag.settings, tag.workshop);

  const settings = await getSettings();
  const entry = db.select().from(workshopLog).orderBy(desc(workshopLog.createdAt), desc(workshopLog.id)).get();
  // Inside 'use cache' the clock is read once per cache entry, never per request.
  const now = Date.now();
  const fresh = entry && now - entry.createdAt.getTime() < LIVE_WINDOW_MS ? entry : null;
  cacheLife(fresh ? "hours" : "content");

  return {
    intro: settings.org.description,
    steps: settings.workshopSteps.slice(0, 5),
    live: fresh
      ? {
          text: fresh.count != null ? `${toFaDigits(fresh.count)} ${fresh.body}` : fresh.body,
          leadTime: dayRange(settings.shippingPolicy?.handlingDays),
          createdAt: iso(fresh.createdAt),
          expiresAt: iso(new Date(fresh.createdAt.getTime() + LIVE_WINDOW_MS)),
        }
      : null,
  };
}

/* ------------------------------------------------------------------ */
/* Name engraving (§5.7)                                                 */
/* ------------------------------------------------------------------ */

export type EngraverData = {
  /** The add-on can be ordered (settings.engraving.enabled and a published add-on row) ⚑. */
  orderable: boolean;
  priceToman: number | null;
  maxChars: number;
  product: { slug: string; name: string };
};

const DEFAULT_ENGRAVE_PRODUCT = "learning-tower";
const DEFAULT_MAX_CHARS = 14;

export async function getEngraver(): Promise<EngraverData | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.settings, tag.products);

  const settings = await getSettings();
  const slug = settings.engraving?.productSlugs[0] ?? DEFAULT_ENGRAVE_PRODUCT;
  const product = db
    .select({ id: products.id, slug: products.slug, name: products.name })
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.status, "published")))
    .get();
  if (!product) return null;
  cacheTag(tag.product(product.id));

  const addon = db
    .select({ priceToman: productAddons.priceToman, maxChars: productAddons.maxChars })
    .from(productAddons)
    .where(
      and(
        eq(productAddons.productId, product.id),
        eq(productAddons.key, "engraving"),
        eq(productAddons.status, "published"),
      ),
    )
    .get();

  return {
    orderable: Boolean(settings.engraving?.enabled && addon),
    priceToman: addon?.priceToman ?? settings.engraving?.priceToman ?? null,
    maxChars: addon?.maxChars ?? settings.engraving?.maxChars ?? DEFAULT_MAX_CHARS,
    product: { slug: product.slug, name: product.name },
  };
}

/* ------------------------------------------------------------------ */
/* Fridge door — «عکساتون، دلگرمیِ ما» (§5.8)                             */
/* ------------------------------------------------------------------ */

export type FridgeProduct = { slug: string; name: string };

export type FridgePhoto = {
  id: number;
  image: { path: string; width: number; height: number; alt: string; dominantColor: string | null } | null;
  /** Manifest key of a drawing, for illustrated entries without a photo. */
  illustration: string | null;
  caption: string | null;
  /** The child's first name, as the family gave it with their consent. */
  name: string | null;
  city: string | null;
  product: FridgeProduct | null;
  isSample: boolean;
};

export type FridgeNote = {
  id: number;
  body: string;
  authorName: string;
  city: string | null;
  childAge: string | null;
  product: FridgeProduct | null;
  isSample: boolean;
};

export type FridgeDoorData = { photos: FridgePhoto[]; notes: FridgeNote[] };

/**
 * Consented content only. Production shows real rows (consentAt set, not samples); every other
 * environment also shows the seed samples, which the UI labels «نمونه». Never Review markup.
 */
function consented(table: typeof communityPhotos | typeof reviews): SQL {
  const real = and(isNotNull(table.consentAt), eq(table.isSample, false))!;
  return IS_PRODUCTION_CONTENT ? real : or(real, eq(table.isSample, true))!;
}

export async function getFridgeDoor(): Promise<FridgeDoorData> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.community, tag.reviews, tag.products, tag.media);

  const photoRows = db
    .select({
      id: communityPhotos.id,
      illustration: communityPhotos.illustration,
      caption: communityPhotos.caption,
      name: communityPhotos.customerName,
      city: communityPhotos.city,
      isSample: communityPhotos.isSample,
      path: media.path,
      width: media.width,
      height: media.height,
      alt: media.alt,
      dominantColor: media.dominantColor,
      productSlug: products.slug,
      productName: products.name,
      productStatus: products.status,
    })
    .from(communityPhotos)
    .leftJoin(media, eq(media.id, communityPhotos.mediaId))
    .leftJoin(products, eq(products.id, communityPhotos.productId))
    .where(consented(communityPhotos))
    .orderBy(asc(communityPhotos.sortOrder), desc(communityPhotos.id))
    .limit(5)
    .all();

  const noteRows = db
    .select({
      id: reviews.id,
      body: reviews.body,
      authorName: reviews.authorName,
      city: reviews.city,
      childAge: reviews.childAge,
      isSample: reviews.isSample,
      productSlug: products.slug,
      productName: products.name,
      productStatus: products.status,
    })
    .from(reviews)
    .leftJoin(products, eq(products.id, reviews.productId))
    .where(and(eq(reviews.featured, true), eq(reviews.status, "approved"), consented(reviews)))
    .orderBy(asc(reviews.isSample), desc(reviews.createdAt), asc(reviews.id))
    .limit(3)
    .all();

  const productOf = (r: { productSlug: string | null; productName: string | null; productStatus: string | null }) =>
    r.productSlug && r.productName && r.productStatus === "published" ? { slug: r.productSlug, name: r.productName } : null;

  return {
    photos: photoRows
      .filter((r) => (r.path && r.width && r.height) || r.illustration)
      .map((r) => ({
        id: r.id,
        image:
          r.path && r.width && r.height
            ? { path: r.path, width: r.width, height: r.height, alt: r.alt ?? "", dominantColor: r.dominantColor }
            : null,
        illustration: r.illustration,
        caption: r.caption,
        name: r.name,
        city: r.city,
        product: productOf(r),
        isSample: r.isSample,
      })),
    notes: noteRows.map((r) => ({
      id: r.id,
      body: r.body,
      authorName: r.authorName,
      city: r.city,
      childAge: r.childAge,
      product: productOf(r),
      isSample: r.isSample,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Ply layers + trust desk (§5.9)                                        */
/* ------------------------------------------------------------------ */

export type TrustDesk = {
  layers: SiteSettings["safety_points"];
  /** «۲ تا ۵ روز کاری» transit time ⚑, or null. */
  shippingDays: string | null;
  returnDays: number | null;
  installments: number | null;
  enamad: SiteSettings["enamad"];
  socials: SiteSettings["socials"];
};

export async function getTrustDesk(): Promise<TrustDesk> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.settings);
  const s = await getSettings();
  return {
    layers: s.safety_points.slice(0, 5),
    shippingDays: dayRange(s.shippingPolicy?.transitDays),
    returnDays: s.returnPolicy?.days ?? null,
    installments: s.snapppay?.enabled ? s.snapppay.count : null,
    enamad: s.enamad,
    socials: s.socials,
  };
}

/* ------------------------------------------------------------------ */
/* FAQ drawers (§5.10) — visible only, no FAQPage on home                 */
/* ------------------------------------------------------------------ */

export type HomeFaq = { id: number; question: string; answer: string };

export async function listHomeFaqs(limit = 6): Promise<HomeFaq[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.faqs);
  return db
    .select({ id: faqs.id, question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(and(eq(faqs.featured, true), inArray(faqs.scope, ["general", "shipping"])))
    .orderBy(sql`case ${faqs.scope} when 'general' then 0 else 1 end`, asc(faqs.sortOrder), asc(faqs.id))
    .limit(limit)
    .all();
}

/* ------------------------------------------------------------------ */
/* Page freshness (WebPage.dateModified)                                  */
/* ------------------------------------------------------------------ */

/** The newest edit to anything the home page shows, as an ISO string (null on an empty DB). */
export async function getHomeModified(): Promise<string | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.settings, tag.products, tag.posts, tag.faqs);
  const newest = [
    db.select({ at: sql<number | null>`max(${settingsTable.updatedAt})` }).from(settingsTable).get()?.at,
    db
      .select({ at: sql<number | null>`max(${products.updatedAt})` })
      .from(products)
      .where(eq(products.status, "published"))
      .get()?.at,
    db
      .select({ at: sql<number | null>`max(${posts.updatedAt})` })
      .from(posts)
      .where(eq(posts.status, "published"))
      .get()?.at,
    db.select({ at: sql<number | null>`max(${faqs.updatedAt})` }).from(faqs).get()?.at,
  ].filter((at): at is number => typeof at === "number");
  // Raw max() bypasses Drizzle's timestamp mapping: the columns hold unix seconds.
  return newest.length ? new Date(Math.max(...newest) * 1000).toISOString() : null;
}
