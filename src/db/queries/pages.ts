import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, isNotNull, max, min, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { communityPhotos, faqs, media, pages, products, reviews, workshopLog } from "@/db/schema";
import { tag } from "@/lib/cache-tags";
import { IS_PRODUCTION_CONTENT } from "@/lib/env";

/*
 * Brand, trust and policy pages (DESIGN.md §8, SEO.md §1.2): CMS pages from the `pages` table
 * with their page-scoped FAQs, plus the community walls (/reviews, /gallery) and the workshop log.
 * Everything returned is plain serialisable data with dates as ISO strings.
 *
 * Honesty rules (BUILD-GUIDE "Content honesty"): seed samples (`isSample`) never leave this file in
 * production; outside production they are returned flagged so the page can label them «نمونه».
 * Anything showing a real child (a photo, a parent's testimonial) needs `consentAt`.
 */

/* ------------------------------------------------------------------ */
/* Slugs                                                               */
/* ------------------------------------------------------------------ */

/**
 * Top-level path segments a `pages.slug` may never take (SEO.md §1.2, plus `rooms` from
 * DESIGN.md §0.3.5). Requests for them under the generic `[page]` route are 404s.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "shop", "product", "mag", "age", "glossary", "faq", "team", "workshop", "reviews", "gallery", "search",
  "cart", "checkout", "account", "api", "md", "media", "sitemaps", "torob_api", "page", "topic", "rss",
  "feed", "llms", "en", "rooms",
]);

/** Pages rows rendered by their own route (they still read their body through getPage). */
export const OWN_ROUTE_SLUGS: ReadonlySet<string> = new Set(["about", "workshop", "contact", "installments", "trust"]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** True for a slug the generic `/[page]` route may serve (shipping, returns, privacy…). */
export function isGenericPageSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug) && !OWN_ROUTE_SLUGS.has(slug);
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

export type PageFaq = { question: string; answer: string };

export type PageData = {
  id: number;
  slug: string;
  /** The H1. */
  title: string;
  /** The one-paragraph answer shown in «خلاصه در یک نگاه» and used as the fallback description. */
  excerpt: string | null;
  /** Markdown (docs/CONTENT-FORMAT.md). */
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalPath: string | null;
  noindex: boolean;
  createdAt: string;
  updatedAt: string;
  /** Page-scoped FAQs (`faqs.scope = 'page'`), in display order. */
  faqs: PageFaq[];
};

/** A published page by slug, or null (unknown, draft, or a malformed slug). */
export async function getPage(slug: string): Promise<PageData | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.pages, tag.faqs);
  if (!SLUG_PATTERN.test(slug)) return null;

  const page = db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.status, "published")))
    .get();
  if (!page) return null;

  const pageFaqs = db
    .select({ question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(and(eq(faqs.scope, "page"), eq(faqs.scopeId, page.id)))
    .orderBy(asc(faqs.sortOrder), asc(faqs.id))
    .all();

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    excerpt: page.excerpt,
    body: page.body,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    canonicalPath: page.canonicalPath,
    noindex: page.noindex,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    faqs: pageFaqs,
  };
}

/** Slugs for the generic `/[page]` route: published, not reserved, not served by their own route. */
export async function listPageSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.pages);
  return db
    .select({ slug: pages.slug })
    .from(pages)
    .where(eq(pages.status, "published"))
    .orderBy(asc(pages.id))
    .all()
    .map((p) => p.slug)
    .filter(isGenericPageSlug);
}

/* ------------------------------------------------------------------ */
/* /reviews — the sticky-note wall                                      */
/* ------------------------------------------------------------------ */

export type ReviewNote = {
  id: number;
  authorName: string;
  city: string | null;
  /** Free text from the parent, e.g. «۲۰ ماهه». */
  childAge: string | null;
  title: string | null;
  body: string;
  /** Seed sample: label it «نمونه». Never true in production. */
  isSample: boolean;
  featured: boolean;
  product: { slug: string; name: string } | null;
  createdAt: string;
};

/**
 * Approved testimonials for /reviews, featured first, then newest. Real ones need consent;
 * samples appear only outside production. Never emitted as schema.org Review (SEO.md §3.5.10).
 */
export async function getReviewsWall(): Promise<ReviewNote[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.reviews, tag.products);
  const shown: SQL | undefined = IS_PRODUCTION_CONTENT
    ? and(eq(reviews.isSample, false), isNotNull(reviews.consentAt))
    : or(isNotNull(reviews.consentAt), eq(reviews.isSample, true));

  return db
    .select({
      id: reviews.id,
      authorName: reviews.authorName,
      city: reviews.city,
      childAge: reviews.childAge,
      title: reviews.title,
      body: reviews.body,
      isSample: reviews.isSample,
      featured: reviews.featured,
      createdAt: reviews.createdAt,
      productSlug: products.slug,
      productName: products.name,
      productStatus: products.status,
    })
    .from(reviews)
    .leftJoin(products, eq(products.id, reviews.productId))
    .where(and(eq(reviews.status, "approved"), shown))
    .orderBy(desc(reviews.featured), desc(reviews.createdAt), desc(reviews.id))
    .all()
    .map((r) => ({
      id: r.id,
      authorName: r.authorName,
      city: r.city,
      childAge: r.childAge,
      title: r.title,
      body: r.body,
      isSample: r.isSample,
      featured: r.featured,
      product:
        r.productSlug && r.productName && r.productStatus === "published" ? { slug: r.productSlug, name: r.productName } : null,
      createdAt: r.createdAt.toISOString(),
    }));
}

/* ------------------------------------------------------------------ */
/* /gallery — the fridge door                                           */
/* ------------------------------------------------------------------ */

export type GalleryPhoto = {
  id: number;
  /** A real uploaded photo; null for an illustrated (drawn) frame. */
  image: {
    path: string;
    width: number | null;
    height: number | null;
    alt: string;
    dominantColor: string | null;
    blurDataUrl: string | null;
  } | null;
  /** Manifest drawing key for a drawn frame (or alongside a photo). */
  illustration: string | null;
  caption: string | null;
  /** The name on the placard, as the family agreed to show it. */
  customerName: string | null;
  city: string | null;
  isSample: boolean;
  product: { slug: string; name: string } | null;
  createdAt: string;
};

/**
 * Community photos in wall order. A photo (media row) always needs `consentAt`; in production
 * samples are dropped entirely, outside production drawn sample frames may show without consent.
 */
export async function getGallery(): Promise<GalleryPhoto[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.community, tag.media, tag.products);

  const rows = db
    .select({
      id: communityPhotos.id,
      caption: communityPhotos.caption,
      customerName: communityPhotos.customerName,
      city: communityPhotos.city,
      illustration: communityPhotos.illustration,
      isSample: communityPhotos.isSample,
      consentAt: communityPhotos.consentAt,
      createdAt: communityPhotos.createdAt,
      mediaPath: media.path,
      mediaWidth: media.width,
      mediaHeight: media.height,
      mediaAlt: media.alt,
      mediaColor: media.dominantColor,
      mediaBlur: media.blurDataUrl,
      productSlug: products.slug,
      productName: products.name,
      productStatus: products.status,
    })
    .from(communityPhotos)
    .leftJoin(media, eq(media.id, communityPhotos.mediaId))
    .leftJoin(products, eq(products.id, communityPhotos.productId))
    .orderBy(asc(communityPhotos.sortOrder), desc(communityPhotos.createdAt), desc(communityPhotos.id))
    .all();

  return rows
    .filter((r) => {
      if (IS_PRODUCTION_CONTENT && r.isSample) return false;
      if (r.mediaPath) return r.consentAt !== null;
      if (!r.illustration) return false;
      return r.consentAt !== null || r.isSample;
    })
    .map((r) => ({
      id: r.id,
      image: r.mediaPath
        ? {
            path: r.mediaPath,
            width: r.mediaWidth,
            height: r.mediaHeight,
            alt: r.mediaAlt ?? "",
            dominantColor: r.mediaColor,
            blurDataUrl: r.mediaBlur,
          }
        : null,
      illustration: r.illustration,
      caption: r.caption,
      customerName: r.customerName,
      city: r.city,
      isSample: r.isSample,
      product:
        r.productSlug && r.productName && r.productStatus === "published" ? { slug: r.productSlug, name: r.productName } : null,
      createdAt: r.createdAt.toISOString(),
    }));
}

/* ------------------------------------------------------------------ */
/* /workshop — the log, and facts the policy pages quote                */
/* ------------------------------------------------------------------ */

export type WorkshopLogEntry = {
  id: number;
  stage: string;
  body: string;
  count: number | null;
  createdAt: string;
};

/** The newest workshop_log entries (each shown with its own date, so nothing claims to be live). */
export async function listWorkshopLog(limit = 10): Promise<WorkshopLogEntry[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.workshop);
  return db
    .select()
    .from(workshopLog)
    .orderBy(desc(workshopLog.createdAt), desc(workshopLog.id))
    .limit(limit)
    .all()
    .map((e) => ({ id: e.id, stage: e.stage, body: e.body, count: e.count, createdAt: e.createdAt.toISOString() }));
}

/** Shortest and longest product warranty in months across published products, or null if none is set. */
export async function getWarrantyMonths(): Promise<{ min: number; max: number } | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.products);
  const row = db
    .select({ min: min(products.warrantyMonths), max: max(products.warrantyMonths) })
    .from(products)
    .where(and(eq(products.status, "published"), isNotNull(products.warrantyMonths)))
    .get();
  return row?.min != null && row.max != null ? { min: row.min, max: row.max } : null;
}
