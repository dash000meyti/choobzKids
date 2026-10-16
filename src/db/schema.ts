import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/*
 * Choobz data model.
 * Phase 1 (public site) only reads these tables; phase 2 (admin/CMS) writes them.
 * Column names are snake_case in SQLite (see `casing` in src/db/open.ts and drizzle.config.ts).
 * Prices are stored in Toman as integers; schema.org markup converts to IRR (×10).
 * Long-form bodies are Markdown (GFM) so they stay portable between editors.
 */

const timestamps = {
  createdAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
};

const seo = {
  seoTitle: text(),
  seoDescription: text(),
  /** Overrides the computed canonical path; leave empty for the default. */
  canonicalPath: text(),
  noindex: integer({ mode: "boolean" }).notNull().default(false),
};

export type PublishStatus = "draft" | "published" | "archived";
export type MediaKind = "illustration" | "cutout" | "photo" | "video" | "doc";

/* ------------------------------------------------------------------ */
/* Media — every file lives in UPLOAD_DIR on the Docker volume          */
/* ------------------------------------------------------------------ */

export const media = sqliteTable("media", {
  id: integer().primaryKey({ autoIncrement: true }),
  /** Path relative to UPLOAD_DIR, e.g. "products/learning-tower/1.webp". */
  path: text().notNull().unique(),
  mime: text().notNull(),
  width: integer(),
  height: integer(),
  sizeBytes: integer(),
  alt: text().notNull().default(""),
  caption: text(),
  /** Dominant colour (#rrggbb) used as the image placeholder background. */
  dominantColor: text(),
  /** Tiny base64 blur placeholder (data URL) generated at upload time. */
  blurDataUrl: text(),
  /** Stage treatment: drawing, transparent cut-out, framed photo, video or document. */
  kind: text().$type<MediaKind>().notNull().default("photo"),
  credit: text(),
  /** Written consent for any image showing a child (UGC); nothing with a child renders without it. */
  consentAt: integer({ mode: "timestamp" }),
  /** Focal point 0–1 for art-directed crops. */
  focalX: real(),
  focalY: real(),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export const categories = sqliteTable(
  "categories",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    slug: text().notNull().unique(),
    name: text().notNull(),
    /** One-line promise shown under the category title. */
    tagline: text(),
    /** Markdown intro rendered on the category page (SEO copy). */
    description: text(),
    /** Key of a built-in SVG illustration (see src/components/illustrations). */
    illustration: text(),
    /** Token name from the palette used as this category's accent. */
    accent: text(),
    coverMediaId: integer().references(() => media.id, { onDelete: "set null" }),
    parentId: integer(),
    sortOrder: integer().notNull().default(0),
    ...seo,
    ...timestamps,
  },
  (t) => [index("categories_sort_idx").on(t.sortOrder)],
);

export type Dimensions = {
  widthCm: number;
  heightCm: number;
  depthCm: number;
  /** Optional extra measurements, e.g. { "ارتفاع سکو": 45 }. */
  extra?: Record<string, number>;
};

export type ProductSpec = { label: string; value: string };

export const products = sqliteTable(
  "products",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    slug: text().notNull().unique(),
    name: text().notNull(),
    /** Short descriptive subtitle, e.g. "برج آموزشی مونته‌سوری قابل تنظیم". */
    subtitle: text(),
    /** 1–2 sentence answer-first summary (used for AEO and cards). */
    summary: text().notNull().default(""),
    /** Markdown long description. */
    description: text().notNull().default(""),
    categoryId: integer()
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    status: text().$type<PublishStatus>().notNull().default("draft"),
    sku: text().unique(),
    /** Price in Toman. */
    price: integer().notNull(),
    /** Pre-discount price in Toman (shown struck through). */
    compareAtPrice: integer(),
    stock: integer().notNull().default(0),
    availability: text()
      .$type<"in_stock" | "out_of_stock" | "preorder" | "made_to_order">()
      .notNull()
      .default("in_stock"),
    /** Production lead time for made-to-order items. */
    leadTimeDays: integer(),
    /** Age range in months. */
    ageMinMonths: integer(),
    ageMaxMonths: integer(),
    /** Developmental goals keys, e.g. ["gross-motor", "independence"]. */
    skills: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    material: text(),
    finish: text(),
    dimensions: text({ mode: "json" }).$type<Dimensions>(),
    weightKg: real(),
    maxLoadKg: real(),
    highlights: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    specs: text({ mode: "json" }).$type<ProductSpec[]>().notNull().default(sql`'[]'`),
    inTheBox: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    safetyNotes: text(),
    careNotes: text(),
    warrantyMonths: integer(),
    /** Approximate assembly time («زمان نصب»). ⚑ confirm with the workshop. */
    assemblyMinutes: integer(),
    /** The one search query this URL owns (SEO.md §1.10). */
    primaryQuery: text(),
    /** Spelling variants and synonyms, e.g. ["کیچن هلپر", "برج آموزشی"]. */
    alternateNames: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    /** Torob `guarantee` text, e.g. «۱۲ ماه ضمانت کارگاه چوبز». */
    guaranteeText: text(),
    torobEnabled: integer({ mode: "boolean" }).notNull().default(true),
    /** Key of the built-in SVG illustration used until real photos are uploaded. */
    illustration: text(),
    featured: integer({ mode: "boolean" }).notNull().default(false),
    isNew: integer({ mode: "boolean" }).notNull().default(false),
    sortOrder: integer().notNull().default(0),
    publishedAt: integer({ mode: "timestamp" }),
    ...seo,
    ...timestamps,
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    index("products_status_idx").on(t.status, t.sortOrder),
  ],
);

export const productVariants = sqliteTable(
  "product_variants",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    productId: integer()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text().notNull(),
    sku: text().unique(),
    /** Variant price in Toman; null = product price. */
    price: integer(),
    stock: integer().notNull().default(0),
    /** e.g. { "رنگ": "طبیعی" } */
    options: text({ mode: "json" }).$type<Record<string, string>>().notNull().default(sql`'{}'`),
    /** Swatch colour for finish/colour options. */
    swatch: text(),
    /** Query used to preselect this variant, e.g. "color=white" (canonical stays clean). */
    urlParam: text(),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const productMedia = sqliteTable(
  "product_media",
  {
    productId: integer()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaId: integer()
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.productId, t.mediaId] })],
);

export const productRelations = sqliteTable(
  "product_relations",
  {
    productId: integer()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    relatedId: integer()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    kind: text().$type<"related" | "bundle" | "upsell">().notNull().default("related"),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.productId, t.relatedId, t.kind] })],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    productId: integer().references(() => products.id, { onDelete: "cascade" }),
    authorName: text().notNull(),
    city: text(),
    /** Child age when the product was used, free text e.g. "۱۸ ماهه". */
    childAge: text(),
    rating: integer().notNull(),
    title: text(),
    body: text().notNull(),
    mediaId: integer().references(() => media.id, { onDelete: "set null" }),
    verifiedPurchase: integer({ mode: "boolean" }).notNull().default(false),
    /** Seeded demo content — labelled «نمونه» in the UI and never emitted as schema.org Review. */
    isSample: integer({ mode: "boolean" }).notNull().default(false),
    consentAt: integer({ mode: "timestamp" }),
    /** Featured reviews appear as testimonials on the home page. */
    featured: integer({ mode: "boolean" }).notNull().default(false),
    status: text().$type<"pending" | "approved" | "rejected">().notNull().default("pending"),
    ...timestamps,
  },
  (t) => [index("reviews_product_idx").on(t.productId, t.status)],
);

/* ------------------------------------------------------------------ */
/* Content hub                                                         */
/* ------------------------------------------------------------------ */

export const authors = sqliteTable("authors", {
  id: integer().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(),
  name: text().notNull(),
  role: text().notNull(),
  jobTitle: text(),
  bio: text().notNull().default(""),
  /** Wikidata QIDs / topics for schema.org knowsAbout. */
  knowsAbout: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  /** Placeholder people are never rendered publicly (DESIGN.md §7.6). */
  isPlaceholder: integer({ mode: "boolean" }).notNull().default(false),
  /** Organisational author (e.g. «تحریریهٔ چوبز کیدز») → schema.org Organization, not Person. */
  isOrganization: integer({ mode: "boolean" }).notNull().default(false),
  credentials: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  /** Profile URLs (Instagram, LinkedIn…) for schema.org sameAs. */
  sameAs: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  avatarMediaId: integer().references(() => media.id, { onDelete: "set null" }),
  ...timestamps,
});

export const topics = sqliteTable("topics", {
  id: integer().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(),
  name: text().notNull(),
  tagline: text(),
  /** Markdown pillar introduction. */
  description: text(),
  illustration: text(),
  accent: text(),
  /** Wikidata / Wikipedia URLs describing the topic entity (schema.org sameAs). */
  sameAs: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  pillarPostId: integer(),
  sortOrder: integer().notNull().default(0),
  ...seo,
  ...timestamps,
});

export type Source = { title: string; url: string; publisher?: string };

export const posts = sqliteTable(
  "posts",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    slug: text().notNull().unique(),
    title: text().notNull(),
    /** Card/listing excerpt and meta description fallback. */
    excerpt: text().notNull().default(""),
    /** «خلاصه در یک نگاه» bullets — answer-first summary for AEO/GEO. */
    tldr: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    /** Markdown (GFM) body. */
    body: text().notNull().default(""),
    format: text()
      .$type<"guide" | "article" | "howto" | "comparison" | "checklist" | "story">()
      .notNull()
      .default("article"),
    topicId: integer().references(() => topics.id, { onDelete: "set null" }),
    /** Pillar posts head a topic cluster. */
    isPillar: integer({ mode: "boolean" }).notNull().default(false),
    authorId: integer().references(() => authors.id, { onDelete: "set null" }),
    reviewerId: integer().references(() => authors.id, { onDelete: "set null" }),
    coverMediaId: integer().references(() => media.id, { onDelete: "set null" }),
    illustration: text(),
    ageMinMonths: integer(),
    ageMaxMonths: integer(),
    readingMinutes: integer().notNull().default(5),
    /** Health/safety topics (YMYL): shows the medical disclaimer and requires expert review. */
    ymyl: integer({ mode: "boolean" }).notNull().default(false),
    sources: text({ mode: "json" }).$type<Source[]>().notNull().default(sql`'[]'`),
    status: text().$type<PublishStatus>().notNull().default("draft"),
    featured: integer({ mode: "boolean" }).notNull().default(false),
    publishedAt: integer({ mode: "timestamp" }),
    /** Editorial «به‌روزرسانی» date (distinct from the row's updatedAt). */
    contentUpdatedAt: integer({ mode: "timestamp" }),
    /** Expert review date → schema.org lastReviewed. */
    reviewedAt: integer({ mode: "timestamp" }),
    primaryQuery: text(),
    secondaryQueries: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    /** Wikidata QIDs or glossary slugs this post is about (schema.org about/mentions). */
    aboutEntities: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    ...seo,
    ...timestamps,
  },
  (t) => [
    index("posts_status_idx").on(t.status, t.publishedAt),
    index("posts_topic_idx").on(t.topicId),
  ],
);

export const postProducts = sqliteTable(
  "post_products",
  {
    postId: integer()
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    productId: integer()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.postId, t.productId] })],
);

export const glossaryTerms = sqliteTable("glossary_terms", {
  id: integer().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(),
  term: text().notNull(),
  /** Latin/original form, e.g. "Pikler Triangle". */
  originalTerm: text(),
  /** One or two quotable sentences. */
  definition: text().notNull(),
  /** Optional Markdown deep-dive. */
  body: text(),
  relatedPostSlugs: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  relatedProductSlugs: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  sameAs: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  alternateNames: text({ mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  pillarPostSlug: text(),
  ...timestamps,
});

export type FaqScope = "general" | "shipping" | "product" | "category" | "post" | "page" | "age" | "room";

/** FAQs attach to a scope: the general FAQ page, a product, a category, a post or a page. */
export const faqs = sqliteTable(
  "faqs",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    scope: text().$type<FaqScope>().notNull(),
    scopeId: integer(),
    /** Non-numeric scope key, e.g. an age range "1-3-years" or a /faq section "installments". */
    scopeKey: text(),
    /** Shown on the home page FAQ drawers. */
    featured: integer({ mode: "boolean" }).notNull().default(false),
    question: text().notNull(),
    answer: text().notNull(),
    sortOrder: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [index("faqs_scope_idx").on(t.scope, t.scopeId, t.sortOrder)],
);

/* ------------------------------------------------------------------ */
/* Site                                                                */
/* ------------------------------------------------------------------ */

/** Static pages: about, workshop, shipping, returns, warranty, safety… */
export const pages = sqliteTable("pages", {
  id: integer().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(),
  title: text().notNull(),
  excerpt: text(),
  body: text().notNull().default(""),
  status: text().$type<PublishStatus>().notNull().default("published"),
  ...seo,
  ...timestamps,
});

/** Customer photos (عکساتون) shown in the community wall. */
export const communityPhotos = sqliteTable("community_photos", {
  id: integer().primaryKey({ autoIncrement: true }),
  mediaId: integer().references(() => media.id, { onDelete: "cascade" }),
  illustration: text(),
  caption: text(),
  customerName: text(),
  city: text(),
  productId: integer().references(() => products.id, { onDelete: "set null" }),
  isSample: integer({ mode: "boolean" }).notNull().default(false),
  consentAt: integer({ mode: "timestamp" }),
  sortOrder: integer().notNull().default(0),
  ...timestamps,
});

/** Key/value site settings (contact info, socials, announcement bar…). */
export const settings = sqliteTable("settings", {
  key: text().primaryKey(),
  value: text({ mode: "json" }).$type<unknown>(),
  updatedAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const redirects = sqliteTable(
  "redirects",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    fromPath: text().notNull(),
    toPath: text().notNull(),
    /** 301/302/307/308, or 410 for removed content. */
    statusCode: integer().notNull().default(301),
    note: text(),
    ...timestamps,
  },
  (t) => [uniqueIndex("redirects_from_idx").on(t.fromPath)],
);

/* ------------------------------------------------------------------ */
/* Design features (DESIGN.md Appendix A)                              */
/* ------------------------------------------------------------------ */

/** Paid add-ons such as name engraving («حک اسم»). ⚑ price and feasibility to confirm. */
export const productAddons = sqliteTable(
  "product_addons",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    productId: integer()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    key: text().$type<"engraving">().notNull(),
    name: text().notNull(),
    priceToman: integer().notNull(),
    maxChars: integer(),
    status: text().$type<PublishStatus>().notNull().default("published"),
  },
  (t) => [uniqueIndex("addons_product_key_idx").on(t.productId, t.key)],
);

/** Ready-made Montessori rooms per age («اتاقش رو بچین», /rooms/{preset}). */
export const roomPresets = sqliteTable("room_presets", {
  id: integer().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(),
  name: text().notNull(),
  /** Age stage key: 0-6m · 6-12m · 1-2y · 2-3y · 3-6y (null = not tied to one stage). */
  ageStage: text(),
  tagline: text(),
  /** Markdown, 300–500 words of unique editorial for /rooms/{slug}. */
  description: text().notNull().default(""),
  floorAreaM2: real(),
  illustration: text(),
  sortOrder: integer().notNull().default(0),
  status: text().$type<PublishStatus>().notNull().default("published"),
  primaryQuery: text(),
  ...seo,
  ...timestamps,
});

export const roomPresetItems = sqliteTable(
  "room_preset_items",
  {
    presetId: integer()
      .notNull()
      .references(() => roomPresets.id, { onDelete: "cascade" }),
    productId: integer()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: integer().references(() => productVariants.id, { onDelete: "set null" }),
    /** Named slot in the room scene (src/components/shop/room-slots.ts). */
    slot: text().notNull(),
    defaultOn: integer({ mode: "boolean" }).notNull().default(true),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.presetId, t.productId] })],
);

/** «امروز در کارگاه» — shown only while the newest entry is < 72 h old. */
export const workshopLog = sqliteTable("workshop_log", {
  id: integer().primaryKey({ autoIncrement: true }),
  stage: text().notNull(),
  body: text().notNull(),
  count: integer(),
  createdAt: integer({ mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
