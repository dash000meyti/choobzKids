import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { Properties, Root as HastRoot, RootContent as HastNode } from "hast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { db } from "@/db/client";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import {
  authors,
  categories,
  communityPhotos,
  faqs,
  glossaryTerms,
  media,
  pages,
  posts,
  productMedia,
  products,
  productVariants,
  reviews,
  roomPresetItems,
  roomPresets,
  settings,
  topics,
} from "@/db/schema";
import { AGE_HUBS, overlapsAge } from "@/lib/ages";
import { tag } from "@/lib/cache-tags";
import {
  formatAgeRange,
  formatJalali,
  formatNumber,
  formatToman,
  installments,
  toFaDigits,
  tomanToRial,
} from "@/lib/format";
import { absoluteUrl, clampText, dateTehran, rfc822Tehran, SITE } from "@/lib/seo";
import type { TorobApiSource } from "@/lib/torob";
import { mediaUrl } from "@/lib/utils";

/*
 * Cached reads behind the machine endpoints (SEO.md §5, §6.1, §7.1, §7.6): sitemaps, llms.txt,
 * llms-full.txt, the Markdown alternates, the RSS feed and the Torob API. Each export is a
 * 'use cache' function tagged `site` + the collections it reads, so GET handlers stay static and
 * are revalidated with the content. Text outputs are built inside the cache (cheap to serve).
 */

/* ------------------------------------------------------------------ */
/* Small helpers                                                         */
/* ------------------------------------------------------------------ */

type Stamp = Date | null | undefined;

/** Newest of the given dates (null when there are none). */
function latest(...dates: Stamp[]): Date | null {
  let max: Date | null = null;
  for (const d of dates) if (d && (!max || d > max)) max = d;
  return max;
}

const jsonList = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

const unique = <T,>(values: (T | null | undefined)[]): T[] => [...new Set(values.filter((v): v is T => v != null))];

/** Decimal-aware Persian number: 9.5 → «۹٫۵». */
const faNumber = (n: number) => formatNumber(n).replace(".", "٫");

const AVAILABILITY_LABEL = {
  in_stock: "موجود",
  out_of_stock: "ناموجود",
  preorder: "پیش‌فروش",
  made_to_order: "ساخت پس از سفارش",
} as const;

/* ------------------------------------------------------------------ */
/* Markdown → portable Markdown / plain text / feed HTML                 */
/* Minimal local version of @/lib/markdown (not available yet): resolves */
/* the CONTENT-FORMAT link schemes and flattens the custom directives.   */
/* ------------------------------------------------------------------ */

const SCHEME_PATH: Record<string, (slug: string) => string> = {
  product: (s) => `/product/${s}`,
  category: (s) => `/shop/${s}`,
  post: (s) => `/mag/${s}`,
  topic: (s) => `/mag/topic/${s}`,
  term: (s) => `/glossary/${s}`,
  page: (s) => `/${s}`,
};

/** `product:learning-tower` → absolute product URL; site paths become absolute; others pass through. */
function resolveHref(href: string): string {
  const scheme = href.match(/^(product|category|post|topic|term|page):([a-z0-9-]+)(#[\w-]+)?$/);
  if (scheme) return absoluteUrl(SCHEME_PATH[scheme[1]](scheme[2]) + (scheme[3] ?? ""));
  return href.startsWith("/") ? absoluteUrl(href) : href;
}

const CALLOUT_LABEL: Record<string, string> = {
  TIP: "نکته",
  NOTE: "توضیح",
  WARNING: "هشدار",
  WORKSHOP: "از کارگاه چوبز",
  EXPERT: "نگاه متخصص",
  MYTH: "باور رایج",
};

type ProductNames = ReadonlyMap<string, string>;

const directiveAttrs = (raw: string) =>
  Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

/**
 * Body Markdown for agents and feeds: absolute links, product embeds as links, step/illustration
 * directives flattened, GitHub callout markers turned into a bold title.
 */
function portableMarkdown(md: string, names: ProductNames, opts: { keepAnchors?: boolean } = {}): string {
  const productLink = (slug: string) => `[${names.get(slug) ?? slug}](${absoluteUrl(`/product/${slug}`)})`;
  const out: string[] = [];
  let inCode = false;
  for (const line of md.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inCode = !inCode;
    if (inCode) {
      out.push(line);
      continue;
    }
    const leaf = line.match(/^\s*::([a-z]+)\{(.*)\}\s*$/);
    if (leaf) {
      const attrs = directiveAttrs(leaf[2]);
      if (leaf[1] === "product" && attrs.slug) out.push(`${productLink(attrs.slug)}${attrs.why ? ` — ${attrs.why}` : ""}`);
      if (leaf[1] === "products" && attrs.slugs) {
        out.push(...attrs.slugs.split(",").map((s) => `- ${productLink(s.trim())}`));
      }
      continue; // illustrations and unknown leaf directives are decorative
    }
    if (/^\s*:::[a-z]*\s*$/.test(line)) continue; // container fences (steps); their content stays
    const callout = line.match(/^(\s*>\s*)\[!([A-Z]+)\]\s*(.*)$/);
    if (callout) {
      out.push(`${callout[1]}**${callout[3] || CALLOUT_LABEL[callout[2]] || ""}**`);
      continue;
    }
    let text = line.replace(/\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (_, href: string, title: string) => `](${resolveHref(href)}${title})`);
    if (!opts.keepAnchors) text = text.replace(/^(#{1,6}\s.*?)\s*\{#[a-z0-9-]+\}\s*$/, "$1");
    out.push(text);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Nests a body under a section heading: `## x` → `### x` (code fences are left alone). */
function demoteHeadings(md: string): string {
  let inCode = false;
  return md
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inCode = !inCode;
      return !inCode && /^#{1,5}\s/.test(line) ? `#${line}` : line;
    })
    .join("\n");
}

/** Rendered text of a Markdown body, for word counts. */
function plainWords(md: string): string[] {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s*:{2,3}.*$/gm, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\{#[a-z0-9-]+\}/g, " ")
    .replace(/[#>*_`|~-]+/g, " ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));
}

const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s: string) => escapeXml(s).replace(/"/g, "&quot;");

function htmlAttributes(props: Properties | undefined): string {
  let out = "";
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === false || value === null || value === undefined) continue;
    const name =
      key === "className"
        ? "class"
        : key === "htmlFor"
          ? "for"
          : /^aria[A-Z]/.test(key)
            ? `aria-${key.slice(4).toLowerCase()}`
            : /^data[A-Z]/.test(key)
              ? key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
              : key.toLowerCase();
    out += value === true ? ` ${name}` : ` ${name}="${escapeAttr(Array.isArray(value) ? value.join(" ") : String(value))}"`;
  }
  return out;
}

/** Serialises a hast tree. Raw HTML never reaches it (remark-rehype drops it). */
function hastToHtml(node: HastRoot | HastNode): string {
  if (node.type === "root") return node.children.map(hastToHtml).join("");
  if (node.type === "text") return escapeXml(node.value);
  if (node.type !== "element") return "";
  const open = `<${node.tagName}${htmlAttributes(node.properties)}>`;
  return VOID_ELEMENTS.has(node.tagName) ? open : `${open}${node.children.map(hastToHtml).join("")}</${node.tagName}>`;
}

const markdownProcessor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype);

/** GFM → HTML string (synchronous: no async plugins). */
function markdownToHtml(md: string): string {
  return hastToHtml(markdownProcessor.runSync(markdownProcessor.parse(md)) as HastRoot);
}

/* ------------------------------------------------------------------ */
/* Raw loaders (synchronous; always called inside a cached function)    */
/* ------------------------------------------------------------------ */

function loadProducts() {
  return db
    .select({ product: products, category: { id: categories.id, slug: categories.slug, name: categories.name } })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.status, "published"))
    .orderBy(asc(categories.sortOrder), asc(products.sortOrder), asc(products.id))
    .all()
    .map((r) => ({ ...r.product, category: r.category }));
}
type LoadedProduct = ReturnType<typeof loadProducts>[number];

/** Original image uploads per product, gallery order (no videos/documents). */
function loadProductImages(productIds: number[]) {
  const map = new Map<number, { path: string; width: number | null; height: number | null; alt: string }[]>();
  if (!productIds.length) return map;
  const rows = db
    .select({
      productId: productMedia.productId,
      path: media.path,
      mime: media.mime,
      width: media.width,
      height: media.height,
      alt: media.alt,
    })
    .from(productMedia)
    .innerJoin(media, eq(media.id, productMedia.mediaId))
    .where(inArray(productMedia.productId, productIds))
    .orderBy(asc(productMedia.sortOrder))
    .all();
  for (const r of rows) {
    if (!r.mime.startsWith("image/")) continue;
    const list = map.get(r.productId) ?? [];
    list.push({ path: r.path, width: r.width, height: r.height, alt: r.alt });
    map.set(r.productId, list);
  }
  return map;
}

function loadVariants(productIds: number[]) {
  const map = new Map<number, (typeof productVariants.$inferSelect)[]>();
  if (!productIds.length) return map;
  const rows = db
    .select()
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds))
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.id))
    .all();
  for (const v of rows) map.set(v.productId, [...(map.get(v.productId) ?? []), v]);
  return map;
}

function loadPosts() {
  const people = new Map(db.select().from(authors).all().map((a) => [a.id, a]));
  const topicRows = new Map(db.select().from(topics).all().map((t) => [t.id, t]));
  const coverIds = new Set<number>();
  const rows = db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), asc(posts.id))
    .all();
  rows.forEach((p) => p.coverMediaId && coverIds.add(p.coverMediaId));
  const covers = new Map(
    coverIds.size ? db.select().from(media).where(inArray(media.id, [...coverIds])).all().map((m) => [m.id, m]) : [],
  );
  return rows.map((p) => ({
    ...p,
    /** Editorial «updated» date (never the row timestamp unless nothing else exists). */
    modifiedAt: p.contentUpdatedAt ?? p.publishedAt ?? p.updatedAt,
    topic: p.topicId ? (topicRows.get(p.topicId) ?? null) : null,
    author: p.authorId ? (people.get(p.authorId) ?? null) : null,
    reviewer: p.reviewerId ? (people.get(p.reviewerId) ?? null) : null,
    cover: p.coverMediaId ? (covers.get(p.coverMediaId) ?? null) : null,
  }));
}
type LoadedPost = ReturnType<typeof loadPosts>[number];

const loadPages = () => db.select().from(pages).where(eq(pages.status, "published")).all();
const loadTerms = () => db.select().from(glossaryTerms).orderBy(asc(glossaryTerms.id)).all();

/** Byline name for feeds and front matter; placeholder people fall back to the store. */
const bylineName = (a: LoadedPost["author"]) => (a && !a.isPlaceholder ? a.name : SITE.name);

/* ------------------------------------------------------------------ */
/* Glossary quality gate (DESIGN.md §7.4)                               */
/* ------------------------------------------------------------------ */

export const TERM_MIN_BODY_WORDS = 150;

/**
 * A term page is indexable only with its definition AND (a body of ≥ 150 words OR ≥ 2 published
 * related posts/products). Otherwise it is `noindex, follow` and left out of the sitemap.
 */
export function isTermIndexable(t: { definition: string; body: string | null; relatedCount: number }): boolean {
  if (!t.definition.trim()) return false;
  return plainWords(t.body ?? "").length >= TERM_MIN_BODY_WORDS || t.relatedCount >= 2;
}

function indexableTerms(terms: ReturnType<typeof loadTerms>, postSlugs: Set<string>, productSlugs: Set<string>) {
  return terms.filter((t) =>
    isTermIndexable({
      definition: t.definition,
      body: t.body,
      relatedCount:
        jsonList(t.relatedPostSlugs).filter((s) => postSlugs.has(s)).length +
        jsonList(t.relatedProductSlugs).filter((s) => productSlugs.has(s)).length,
    }),
  );
}

/** Slugs of glossary terms that pass the quality gate (for the term page's robots meta). */
export async function listIndexableTermSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.glossary, tag.posts, tag.products);
  const postSlugs = new Set(loadPosts().map((p) => p.slug));
  const productSlugs = new Set(loadProducts().map((p) => p.slug));
  return indexableTerms(loadTerms(), postSlugs, productSlugs).map((t) => t.slug);
}

/* ------------------------------------------------------------------ */
/* Offers                                                                */
/* ------------------------------------------------------------------ */

/**
 * `priceValidUntil` for product offers: 30 days after this cache entry was rendered. The
 * timestamp is read inside the cache scope, so it is captured once per revalidation (and the
 * product page that uses it regenerates at least daily under the `content` profile).
 */
export async function getPriceValidUntil(): Promise<string> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.products);
  return dateTehran(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

/* ------------------------------------------------------------------ */
/* Sitemaps (SEO.md §7.1)                                                */
/* ------------------------------------------------------------------ */

export const SITEMAP_TYPES = ["pages", "categories", "products", "mag", "glossary", "rooms"] as const;
export type SitemapType = (typeof SITEMAP_TYPES)[number];

export type SitemapEntry = {
  /** Absolute canonical URL. */
  url: string;
  /** ISO 8601; omitted when no real date exists. */
  lastModified?: string;
  /** Absolute original `/media/...` URLs of images visible on the page. */
  images?: string[];
};

const SITEMAP_TAGS = [
  tag.site,
  tag.settings,
  tag.products,
  tag.categories,
  tag.posts,
  tag.topics,
  tag.glossary,
  tag.pages,
  tag.rooms,
  tag.authors,
  tag.faqs,
  tag.reviews,
  tag.community,
  tag.media,
];

/** A canonical entry only: noindex rows and rows canonicalised elsewhere are skipped. */
const isCanonical = (row: { noindex: boolean; canonicalPath: string | null }, path: string) =>
  !row.noindex && (!row.canonicalPath || row.canonicalPath === path);

function entry(path: string, lastModified: Date | null, images?: string[]): SitemapEntry {
  return {
    url: absoluteUrl(path),
    ...(lastModified ? { lastModified: lastModified.toISOString() } : {}),
    ...(images?.length ? { images } : {}),
  };
}

function buildSitemaps(): Record<SitemapType, SitemapEntry[]> {
  const productRows = loadProducts();
  const postRows = loadPosts();
  const termRows = loadTerms();
  const pageRows = loadPages();
  const categoryRows = db.select().from(categories).orderBy(asc(categories.sortOrder)).all();
  const topicRows = db.select().from(topics).orderBy(asc(topics.sortOrder)).all();
  const people = db.select().from(authors).all().filter((a) => !a.isPlaceholder);
  const settingsStamp = latest(...db.select({ updatedAt: settings.updatedAt }).from(settings).all().map((s) => s.updatedAt));
  const images = loadProductImages(productRows.map((p) => p.id));

  const productStamps = productRows.map((p) => p.updatedAt);
  const postStamps = postRows.map((p) => p.modifiedAt);

  /* pages: home, hubs, static pages from the `pages` table, team */
  const pageEntries: SitemapEntry[] = [
    entry(
      "/",
      latest(settingsStamp, ...productStamps, ...postStamps, ...categoryRows.map((c) => c.updatedAt), ...pageRows.map((p) => p.updatedAt)),
    ),
    entry("/shop", latest(...productStamps, ...categoryRows.map((c) => c.updatedAt))),
    entry("/mag", latest(...postStamps, ...topicRows.map((t) => t.updatedAt))),
    entry("/age", latest(...productStamps, ...postStamps)),
    ...AGE_HUBS.map((hub) =>
      entry(
        `/age/${hub.slug}`,
        latest(
          ...productRows.filter((p) => overlapsAge(p, hub.minMonths, hub.maxMonths)).map((p) => p.updatedAt),
          ...postRows.filter((p) => overlapsAge(p, hub.minMonths, hub.maxMonths)).map((p) => p.modifiedAt),
        ),
      ),
    ),
    entry("/glossary", latest(...termRows.map((t) => t.updatedAt))),
  ];
  const faqStamps = db
    .select({ updatedAt: faqs.updatedAt })
    .from(faqs)
    .where(inArray(faqs.scope, ["general", "shipping"]))
    .all()
    .map((f) => f.updatedAt);
  if (faqStamps.length) pageEntries.push(entry("/faq", latest(...faqStamps)));
  for (const page of pageRows) {
    if (isCanonical(page, `/${page.slug}`)) pageEntries.push(entry(`/${page.slug}`, page.updatedAt));
  }
  // Testimonials and customer photos only count once real (non-sample, consented) content exists.
  const realReviews = db
    .select({ updatedAt: reviews.updatedAt })
    .from(reviews)
    .where(and(eq(reviews.status, "approved"), eq(reviews.isSample, false)))
    .all();
  if (realReviews.length) pageEntries.push(entry("/reviews", latest(...realReviews.map((r) => r.updatedAt))));
  const realPhotos = db
    .select({ updatedAt: communityPhotos.updatedAt, consentAt: communityPhotos.consentAt })
    .from(communityPhotos)
    .where(eq(communityPhotos.isSample, false))
    .all()
    .filter((p) => p.consentAt);
  if (realPhotos.length) pageEntries.push(entry("/gallery", latest(...realPhotos.map((p) => p.updatedAt))));
  if (people.length) {
    pageEntries.push(entry("/team", latest(...people.map((a) => a.updatedAt))));
    pageEntries.push(...people.map((a) => entry(`/team/${a.slug}`, a.updatedAt)));
  }

  /* categories: only those that hold published products */
  const categoryEntries = categoryRows.flatMap((c) => {
    const items = productRows.filter((p) => p.categoryId === c.id);
    const path = `/shop/${c.slug}`;
    return items.length && isCanonical(c, path) ? [entry(path, latest(c.updatedAt, ...items.map((p) => p.updatedAt)))] : [];
  });

  /* products (+ gallery originals) */
  const productEntries = productRows.flatMap((p) => {
    const path = `/product/${p.slug}`;
    if (!isCanonical(p, path)) return [];
    const gallery = (images.get(p.id) ?? []).map((img) => absoluteUrl(mediaUrl(img.path)));
    return [entry(path, p.updatedAt, gallery)];
  });

  /* mag: topic hubs with at least one article, then articles (+ cover originals) */
  const magEntries: SitemapEntry[] = [];
  for (const t of topicRows) {
    const items = postRows.filter((p) => p.topicId === t.id);
    const path = `/mag/topic/${t.slug}`;
    if (items.length && isCanonical(t, path)) magEntries.push(entry(path, latest(t.updatedAt, ...items.map((p) => p.modifiedAt))));
  }
  for (const p of postRows) {
    const path = `/mag/${p.slug}`;
    if (!isCanonical(p, path)) continue;
    const cover = p.cover?.mime.startsWith("image/") ? [absoluteUrl(mediaUrl(p.cover.path))] : [];
    magEntries.push(entry(path, p.modifiedAt, cover));
  }

  /* glossary: terms that pass the quality gate */
  const glossaryEntries = indexableTerms(
    termRows,
    new Set(postRows.map((p) => p.slug)),
    new Set(productRows.map((p) => p.slug)),
  ).map((t) => entry(`/glossary/${t.slug}`, t.updatedAt));

  /* rooms: the index and every published preset */
  const presets = db
    .select()
    .from(roomPresets)
    .where(eq(roomPresets.status, "published"))
    .orderBy(asc(roomPresets.sortOrder))
    .all();
  const presetItems = db.select().from(roomPresetItems).all();
  const productStamp = new Map(productRows.map((p) => [p.id, p.updatedAt]));
  const presetStamp = (id: number, own: Date) =>
    latest(own, ...presetItems.filter((i) => i.presetId === id).map((i) => productStamp.get(i.productId)));
  const roomEntries: SitemapEntry[] = presets.length
    ? [
        entry("/rooms", latest(...presets.map((r) => presetStamp(r.id, r.updatedAt)))),
        ...presets
          .filter((r) => isCanonical(r, `/rooms/${r.slug}`))
          .map((r) => entry(`/rooms/${r.slug}`, presetStamp(r.id, r.updatedAt))),
      ]
    : [];

  return {
    pages: pageEntries,
    categories: categoryEntries,
    products: productEntries,
    mag: magEntries,
    glossary: glossaryEntries,
    rooms: roomEntries,
  };
}

/** Entries of one child sitemap (`/sitemaps/{type}/sitemap.xml`). */
export async function getSitemapEntries(type: SitemapType): Promise<SitemapEntry[]> {
  "use cache";
  cacheLife("content");
  cacheTag(...SITEMAP_TAGS);
  return buildSitemaps()[type];
}

/** Non-empty child sitemaps with their `<lastmod>` (the newest `lastmod` inside each). */
export async function getSitemapIndex(): Promise<{ type: SitemapType; lastModified: string | null }[]> {
  "use cache";
  cacheLife("content");
  cacheTag(...SITEMAP_TAGS);
  const all = buildSitemaps();
  return SITEMAP_TYPES.filter((type) => all[type].length).map((type) => ({
    type,
    lastModified: all[type].reduce<string | null>(
      (max, e) => (e.lastModified && (!max || e.lastModified > max) ? e.lastModified : max),
      null,
    ),
  }));
}

/* ------------------------------------------------------------------ */
/* Markdown documents (alternates + llms-full)                           */
/* ------------------------------------------------------------------ */

type MdDoc = {
  title: string;
  path: string;
  updated: Date | null;
  /** Extra YAML front-matter fields for the alternate (published, author…). */
  meta?: Record<string, string | null | undefined>;
  /** Markdown below the H1. */
  body: string;
};

const yaml = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/** `/x.md` alternate: YAML front matter, the H1, then the body. */
function asAlternate(doc: MdDoc): string {
  const fields: [string, string | null | undefined][] = [
    ["title", doc.title],
    ["url", absoluteUrl(doc.path)],
    ...Object.entries(doc.meta ?? {}),
    ["updated", doc.updated ? dateTehran(doc.updated) : null],
    ["language", SITE.inLanguage],
  ];
  const front = fields.filter(([, v]) => v).map(([k, v]) => `${k}: ${yaml(v!)}`).join("\n");
  return `---\n${front}\n---\n\n# ${doc.title}\n\n${doc.body}\n`;
}

/** One document inside llms-full.txt (SEO.md §5.5 header). */
function asLlmsSection(doc: MdDoc): string {
  const updated = doc.updated ? `\nUpdated: ${dateTehran(doc.updated)}` : "";
  return `---\n# ${doc.title}\nURL: ${absoluteUrl(doc.path)}${updated}\n\n${doc.body}\n`;
}

const faqMarkdown = (items: { question: string; answer: string }[], names: ProductNames) =>
  items.length
    ? `## سؤالات متداول\n\n${items.map((f) => `### ${f.question}\n\n${portableMarkdown(f.answer, names)}`).join("\n\n")}`
    : "";

/** Joins Markdown blocks, skipping empty ones (`cond && block` may yield 0/false/""). */
const sections = (...parts: (string | number | null | undefined | false)[]) =>
  parts.filter((p): p is string => typeof p === "string" && p.length > 0).join("\n\n");

function scopedFaqs(scope: "product" | "post" | "page", scopeId: number) {
  return db
    .select({ question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(and(eq(faqs.scope, scope), eq(faqs.scopeId, scopeId)))
    .orderBy(asc(faqs.sortOrder), asc(faqs.id))
    .all();
}

function productDoc(
  p: LoadedProduct,
  ctx: { settings: SiteSettings; names: ProductNames; variants: (typeof productVariants.$inferSelect)[] },
): MdDoc {
  const { settings: s, names, variants } = ctx;
  const path = `/product/${p.slug}`;
  const age = formatAgeRange(p.ageMinMonths, p.ageMaxMonths);
  const dims = p.dimensions;
  const lead =
    p.availability === "made_to_order"
      ? `ساخت پس از سفارش${p.leadTimeDays ? `؛ حدود ${toFaDigits(p.leadTimeDays)} روز کاری` : ""}`
      : s.shippingPolicy?.handlingDays
        ? `${AVAILABILITY_LABEL[p.availability]}؛ آماده‌سازی ${toFaDigits(s.shippingPolicy.handlingDays[0])} تا ${toFaDigits(s.shippingPolicy.handlingDays[1])} روز کاری`
        : AVAILABILITY_LABEL[p.availability];
  const snapp = s.snapppay;
  const eligible =
    !!snapp?.enabled && (snapp.minToman == null || p.price >= snapp.minToman) && (snapp.maxToman == null || p.price <= snapp.maxToman);
  const payment = `${formatToman(p.price)}${
    eligible ? ` یا ${toFaDigits(snapp!.count)} قسط ${formatToman(installments(p.price, snapp!.count), false)} تومانی با اسنپ‌پی` : ""
  }`;
  const warranty = toFaDigits(p.guaranteeText || (p.warrantyMonths ? `${p.warrantyMonths} ماه ضمانت کارگاه چوبز` : "")) || null;
  const facts: [string, string | null][] = [
    ["مناسب برای سن", age],
    [
      "ابعاد",
      dims
        ? `${faNumber(dims.widthCm)} × ${faNumber(dims.depthCm)} × ${faNumber(dims.heightCm)} سانتی‌متر (عرض × عمق × ارتفاع)`
        : null,
    ],
    ["حداکثر وزن قابل تحمل", p.maxLoadKg ? `${faNumber(p.maxLoadKg)} کیلوگرم` : null],
    ["جنس و روکش", [p.material, p.finish].filter(Boolean).join("؛ ") || null],
    ["زمان آماده‌سازی و ارسال", lead],
    ["ضمانت", warranty],
    ["پرداخت", payment],
    ["ساخت", `کارگاه چوبز${s.org.city ? `، ${s.org.city}` : ""}`],
  ];
  const table = (rows: [string, string | null][], head: [string, string]) =>
    rows.some(([, v]) => v)
      ? `| ${head[0]} | ${head[1]} |\n|---|---|\n${rows
          .filter(([, v]) => v)
          .map(([k, v]) => `| ${k} | ${v!.replace(/\|/g, "\\|")} |`)
          .join("\n")}`
      : "";
  const priceDate = formatJalali(p.updatedAt);
  const priceLines = [
    `- قیمت: ${formatToman(p.price)} (${formatNumber(tomanToRial(p.price))} ریال)، قیمت در تاریخ ${priceDate}`,
    p.compareAtPrice && p.compareAtPrice > p.price
      ? `- قیمت پیش از تخفیف: ${formatToman(p.compareAtPrice)} (${formatNumber(tomanToRial(p.compareAtPrice))} ریال)`
      : null,
    ...variants.map((v) => {
      const price = v.price ?? p.price;
      return `- ${v.name}: ${formatToman(price)} (${formatNumber(tomanToRial(price))} ریال)`;
    }),
    `- وضعیت: ${AVAILABILITY_LABEL[p.availability]}`,
    `- نشانی: ${absoluteUrl(path)}`,
  ].filter(Boolean);
  const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

  return {
    title: p.name,
    path,
    updated: p.updatedAt,
    body: sections(
      p.summary,
      `## در یک نگاه\n\n${table(facts, ["ویژگی", "مقدار"])}`,
      `## قیمت و موجودی\n\n${priceLines.join("\n")}`,
      jsonList(p.highlights).length && `## چرا این محصول؟\n\n${list(jsonList(p.highlights))}`,
      p.description && `## توضیحات\n\n${demoteHeadings(portableMarkdown(p.description, names))}`,
      jsonList(p.specs).length &&
        `## مشخصات\n\n${table(
          jsonList(p.specs).map((r) => [r.label, r.value]),
          ["مشخصه", "مقدار"],
        )}`,
      jsonList(p.inTheBox).length && `## در جعبه چه هست؟\n\n${list(jsonList(p.inTheBox))}`,
      p.safetyNotes && `## نکات ایمنی\n\n${portableMarkdown(p.safetyNotes, names)}`,
      p.careNotes && `## نگهداری\n\n${portableMarkdown(p.careNotes, names)}`,
      faqMarkdown(scopedFaqs("product", p.id), names),
    ),
  };
}

function postDoc(p: LoadedPost, names: ProductNames): MdDoc {
  const tldr = jsonList(p.tldr);
  const sources = jsonList(p.sources);
  return {
    title: p.title,
    path: `/mag/${p.slug}`,
    updated: p.modifiedAt,
    meta: {
      author: bylineName(p.author),
      reviewed_by: p.reviewer && !p.reviewer.isPlaceholder ? p.reviewer.name : null,
      published: p.publishedAt ? dateTehran(p.publishedAt) : null,
    },
    body: sections(
      tldr.length && `## خلاصه در یک نگاه\n\n${tldr.map((t) => `- ${portableMarkdown(t, names)}`).join("\n")}`,
      portableMarkdown(p.body, names, { keepAnchors: true }),
      faqMarkdown(scopedFaqs("post", p.id), names),
      sources.length &&
        `## منابع\n\n${sources
          .map((src, i) => `${i + 1}. [${src.title}](${src.url})${src.publisher ? ` — ${src.publisher}` : ""}`)
          .join("\n")}`,
    ),
  };
}

function termDoc(
  t: ReturnType<typeof loadTerms>[number],
  ctx: { names: ProductNames; postTitles: ReadonlyMap<string, string> },
): MdDoc {
  const aliases = [t.originalTerm, ...jsonList(t.alternateNames)].filter((a): a is string => !!a);
  const relatedPosts = unique([t.pillarPostSlug, ...jsonList(t.relatedPostSlugs)]).filter((s) => ctx.postTitles.has(s));
  const relatedProducts = jsonList(t.relatedProductSlugs).filter((s) => ctx.names.has(s));
  const links = [
    ...relatedPosts.map((s) => `- [${ctx.postTitles.get(s)}](${absoluteUrl(`/mag/${s}`)})`),
    ...relatedProducts.map((s) => `- [${ctx.names.get(s)}](${absoluteUrl(`/product/${s}`)})`),
    ...jsonList(t.sameAs).map((u) => `- <${u}>`),
  ];
  return {
    title: `${t.term} چیست؟`,
    path: `/glossary/${t.slug}`,
    updated: t.updatedAt,
    body: sections(
      t.definition,
      aliases.length && `به آن ${aliases.join("، ")} هم می‌گویند.`,
      t.body && portableMarkdown(t.body, ctx.names),
      links.length && `## پیوندها\n\n${links.join("\n")}`,
    ),
  };
}

function pageDoc(pg: ReturnType<typeof loadPages>[number], names: ProductNames): MdDoc {
  return {
    title: pg.title,
    path: `/${pg.slug}`,
    updated: pg.updatedAt,
    body: sections(pg.excerpt, portableMarkdown(pg.body, names), faqMarkdown(scopedFaqs("page", pg.id), names)),
  };
}

export const MARKDOWN_TYPES = ["mag", "glossary", "product"] as const;
export type MarkdownType = (typeof MARKDOWN_TYPES)[number];

/** Every `/{type}/{slug}.md` that exists, for generateStaticParams. */
export async function listMarkdownAlternates(): Promise<{ type: MarkdownType; slug: string }[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts, tag.glossary, tag.products);
  return [
    ...loadPosts().map((p) => ({ type: "mag" as const, slug: p.slug })),
    ...loadTerms().map((t) => ({ type: "glossary" as const, slug: t.slug })),
    ...loadProducts().map((p) => ({ type: "product" as const, slug: p.slug })),
  ];
}

/** The Markdown alternate of a published article, glossary term or product; null when unknown. */
export async function getMarkdownAlternate(type: MarkdownType, slug: string): Promise<string | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.products, tag.faqs, tag.settings);
  const productRows = loadProducts();
  const names: ProductNames = new Map(productRows.map((p) => [p.slug, p.name]));

  if (type === "product") {
    cacheTag(tag.categories);
    const p = productRows.find((r) => r.slug === slug);
    if (!p) return null;
    cacheTag(tag.product(p.id));
    const settingsValue = await getSettings();
    return asAlternate(productDoc(p, { settings: settingsValue, names, variants: loadVariants([p.id]).get(p.id) ?? [] }));
  }
  if (type === "mag") {
    cacheTag(tag.posts, tag.topics, tag.authors);
    const p = loadPosts().find((r) => r.slug === slug);
    if (!p) return null;
    cacheTag(tag.post(p.id));
    return asAlternate(postDoc(p, names));
  }
  cacheTag(tag.glossary, tag.posts);
  const t = loadTerms().find((r) => r.slug === slug);
  if (!t) return null;
  const postTitles = new Map(loadPosts().map((p) => [p.slug, p.title]));
  return asAlternate(termDoc(t, { names, postTitles }));
}

/* ------------------------------------------------------------------ */
/* llms.txt / llms-full.txt (SEO.md §5.4–5.5)                            */
/* ------------------------------------------------------------------ */

const LLMS_TAGS = [tag.site, tag.settings, tag.products, tag.categories, tag.posts, tag.topics, tag.glossary, tag.pages, tag.rooms, tag.faqs];

const TRUST_PAGES: [slug: string, label: string][] = [
  ["shipping", "ارسال و هزینهٔ ارسال"],
  ["returns", "بازگشت کالا"],
  ["warranty", "ضمانت و خدمات پس از فروش"],
  ["safety", "ایمنی و متریال"],
  ["installments", "خرید قسطی با اسنپ‌پی"],
  ["trust", "اعتماد شما"],
];
const ABOUT_PAGES: [slug: string, label: string][] = [
  ["about", "داستان چوبز"],
  ["workshop", "کارگاه چوبز"],
  ["editorial-policy", "سیاست تحریریه و بازبینی"],
  ["contact", "تماس"],
];

/** A short factual note (≤ 120 chars): the first sentence when it fits, else a clipped one. */
function shortNote(text: string): string {
  const first = text.match(/^.+?[.؟!](?=\s|$)/)?.[0];
  return first && [...first].length <= 120 ? first : clampText(text, 120);
}

const link = (label: string, path: string, note?: string | null) =>
  `- [${label}](${absoluteUrl(path)})${note ? `: ${shortNote(note)}` : ""}`;

/** The shared top of both files: H1, blockquote (= Organization.description), details. */
function llmsHeader(s: SiteSettings, updated: Date | null): string {
  const host = new URL(SITE.url).host;
  const details = [
    "- زبان سایت: فارسی. قیمت‌ها به تومان نمایش داده می‌شوند (در دادهٔ ساخت‌یافته به ریال).",
    s.snapppay?.enabled ? `- پرداخت: امکان خرید ${toFaDigits(s.snapppay.count)} قسطی با اسنپ‌پی.` : null,
    s.enamad ? `- نماد اعتماد الکترونیکی (اینماد): ${s.enamad.href}` : null,
    `- نسخهٔ Markdown هر مقاله، اصطلاح و محصول با افزودن \`.md\` به انتهای نشانی در دسترس است (مثلاً ${absoluteUrl("/mag/learning-tower-guide")}.md). هنگام نقل، لطفاً به نشانی اصلی صفحه لینک دهید.`,
    updated ? `- آخرین به‌روزرسانی: ${dateTehran(updated)}` : null,
  ].filter(Boolean);
  return [
    `# ${s.siteName} (${s.siteNameEn})`,
    `> ${s.org.description}`,
    `${s.siteNameEn} (${host}) is an Iranian maker of Montessori-, Pikler- and Waldorf-inspired wooden furniture and toys for children aged 0–6, built in its own workshop. The site is in Persian (fa-IR). Prices are shown in Toman; 1 Toman = 10 Iranian rials (IRR).`,
    details.join("\n"),
  ].join("\n\n");
}

function loadLlmsData() {
  const productRows = loadProducts();
  const postRows = loadPosts();
  const termRows = loadTerms();
  const pageRows = loadPages();
  const categoryRows = db.select().from(categories).orderBy(asc(categories.sortOrder)).all();
  const presets = db
    .select()
    .from(roomPresets)
    .where(eq(roomPresets.status, "published"))
    .orderBy(asc(roomPresets.sortOrder))
    .all();
  const updated = latest(
    ...productRows.map((p) => p.updatedAt),
    ...postRows.map((p) => p.modifiedAt),
    ...termRows.map((t) => t.updatedAt),
    ...pageRows.map((p) => p.updatedAt),
  );
  return { productRows, postRows, termRows, pageRows, categoryRows, presets, updated };
}

export async function getLlmsTxt(): Promise<string> {
  "use cache";
  cacheLife("content");
  cacheTag(...LLMS_TAGS);
  const s = await getSettings();
  const { productRows, postRows, termRows, pageRows, categoryRows, presets, updated } = loadLlmsData();
  const pageSlugs = new Set(pageRows.map((p) => p.slug));
  const terms = indexableTerms(termRows, new Set(postRows.map((p) => p.slug)), new Set(productRows.map((p) => p.slug)));

  const shop = categoryRows.flatMap((c) => {
    const items = productRows.filter((p) => p.categoryId === c.id);
    if (!items.length) return [];
    return [
      link(`${c.name} (دسته)`, `/shop/${c.slug}`, c.tagline),
      ...items.map((p) => {
        const age = formatAgeRange(p.ageMinMonths, p.ageMaxMonths);
        return link(p.name, `/product/${p.slug}`, [p.subtitle || p.summary, age && `مناسب ${age}`].filter(Boolean).join("؛ "));
      }),
    ];
  });
  const pillars = postRows.filter((p) => p.isPillar).map((p) => link(p.title, `/mag/${p.slug}`, p.excerpt));
  const shipping = s.shippingPolicy?.transitDays
    ? `ارسال به سراسر ایران؛ ${toFaDigits(s.shippingPolicy.transitDays[0])} تا ${toFaDigits(s.shippingPolicy.transitDays[1])} روز کاری پس از آماده‌سازی`
    : null;
  const returns = s.returnPolicy?.days ? `${toFaDigits(s.returnPolicy.days)} روز مهلت بازگشت کالا` : null;
  const trustNotes: Record<string, string | null> = { shipping, returns };
  const trust = [
    ...TRUST_PAGES.filter(([slug]) => pageSlugs.has(slug)).map(([slug, label]) => link(label, `/${slug}`, trustNotes[slug])),
    link("سؤالات متداول", "/faq"),
  ];
  const about = ABOUT_PAGES.filter(([slug]) => pageSlugs.has(slug)).map(([slug, label]) =>
    link(label, `/${slug}`, slug === "contact" && s.socials.instagramHandle ? `اینستاگرام @${s.socials.instagramHandle}` : null),
  );

  const blocks = [
    llmsHeader(s, updated),
    `## فروشگاه\n${shop.join("\n")}`,
    presets.length &&
      `## چیدمان آمادهٔ اتاق\n${[link("همهٔ چیدمان‌ها", "/rooms"), ...presets.map((r) => link(r.name, `/rooms/${r.slug}`, r.tagline))].join("\n")}`,
    pillars.length && `## راهنماهای اصلی (مجله چوبز)\n${pillars.join("\n")}`,
    `## سن به سن\n${AGE_HUBS.map((h) => link(h.label, `/age/${h.slug}`)).join("\n")}`,
    `## واژه‌نامه\n${[...terms.slice(0, 20).map((t) => link(t.term, `/glossary/${t.slug}`, t.definition)), link("واژه‌نامهٔ کامل", "/glossary")].join("\n")}`,
    `## خرید، ارسال و اعتماد\n${trust.join("\n")}`,
    about.length && `## دربارهٔ چوبز\n${about.join("\n")}`,
    `## Optional\n${[link("همهٔ مقاله‌های مجله", "/mag"), link("متن کامل سایت برای مدل‌های زبانی", "/llms-full.txt")].join("\n")}`,
  ];
  return `${blocks.filter(Boolean).join("\n\n")}\n`;
}

const LLMS_FULL_MAX_BYTES = 1_000_000;

export async function getLlmsFullTxt(): Promise<string> {
  "use cache";
  cacheLife("content");
  cacheTag(...LLMS_TAGS);
  const s = await getSettings();
  const { productRows, postRows, termRows, pageRows, updated } = loadLlmsData();
  const names: ProductNames = new Map(productRows.map((p) => [p.slug, p.name]));
  const variants = loadVariants(productRows.map((p) => p.id));
  const pageBySlug = new Map(pageRows.map((p) => [p.slug, p]));
  const pagesFor = (list: [string, string][]) =>
    list.map(([slug]) => pageBySlug.get(slug)).filter((p) => !!p).map((p) => asLlmsSection(pageDoc(p, names)));

  const glossary: MdDoc = {
    title: "واژه‌نامهٔ چوبز",
    path: "/glossary",
    updated: latest(...termRows.map((t) => t.updatedAt)),
    body: termRows.map((t) => `- **${t.term}** (${absoluteUrl(`/glossary/${t.slug}`)}): ${t.definition}`).join("\n"),
  };

  const head = [
    llmsHeader(s, updated),
    ...pagesFor(TRUST_PAGES),
    ...productRows.map((p) => asLlmsSection(productDoc(p, { settings: s, names, variants: variants.get(p.id) ?? [] }))),
  ];
  const tail = [asLlmsSection(glossary), ...pagesFor(ABOUT_PAGES.filter(([slug]) => slug !== "contact"))];
  const pillars = postRows.filter((p) => p.isPillar).map((p) => asLlmsSection(postDoc(p, names)));

  // Keep the file under 1 MB by dropping pillar articles from the end first.
  const size = (parts: string[]) => Buffer.byteLength(parts.join("\n"), "utf8");
  while (pillars.length && size([...head, ...pillars, ...tail]) > LLMS_FULL_MAX_BYTES) pillars.pop();
  return `${[...head, ...pillars, ...tail].join("\n")}`;
}

/* ------------------------------------------------------------------ */
/* RSS 2.0 (SEO.md §7.6)                                                 */
/* ------------------------------------------------------------------ */

const FEED_SIZE = 30;
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

export async function getMagRssXml(): Promise<string> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.posts, tag.topics, tag.authors, tag.media, tag.products);
  const productRows = loadProducts();
  const names: ProductNames = new Map(productRows.map((p) => [p.slug, p.name]));
  const feed = loadPosts()
    .filter((p) => p.publishedAt)
    .slice(0, FEED_SIZE);
  const magUrl = absoluteUrl("/mag");
  const built = latest(...feed.map((p) => p.modifiedAt));

  const items = feed.map((p) => {
    const url = absoluteUrl(`/mag/${p.slug}`);
    const tldr = jsonList(p.tldr);
    const cover = p.cover?.mime.startsWith("image/") ? p.cover : null;
    const coverUrl = cover ? absoluteUrl(mediaUrl(cover.path)) : null;
    const markdown = sections(
      tldr.length && `## خلاصه در یک نگاه\n\n${tldr.map((t) => `- ${t}`).join("\n")}`,
      p.body,
    );
    const html = [
      `<div dir="rtl" lang="${SITE.inLanguage}">`,
      coverUrl ? `<figure><img src="${escapeAttr(coverUrl)}" alt="${escapeAttr(cover!.alt)}"></figure>` : "",
      markdownToHtml(portableMarkdown(markdown, names)),
      `<p>این مطلب نخستین بار در <a href="${escapeAttr(url)}">مجله چوبز</a> منتشر شد.</p>`,
      "</div>",
    ].join("");
    return [
      "<item>",
      `<title>${escapeXml(p.title)}</title>`,
      `<link>${url}</link>`,
      `<guid isPermaLink="true">${url}</guid>`,
      `<pubDate>${rfc822Tehran(p.publishedAt!)}</pubDate>`,
      `<dc:creator>${escapeXml(bylineName(p.author))}</dc:creator>`,
      p.topic ? `<category>${escapeXml(p.topic.name)}</category>` : "",
      `<description>${escapeXml(p.excerpt)}</description>`,
      `<content:encoded>${cdata(html)}</content:encoded>`,
      cover && coverUrl && cover.sizeBytes
        ? `<enclosure url="${escapeAttr(coverUrl)}" length="${cover.sizeBytes}" type="${escapeAttr(cover.mime)}"/>`
        : "",
      "</item>",
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${SITE.rss.title}</title>`,
    `<link>${magUrl}</link>`,
    `<description>${escapeXml("راهنماهای مونته‌سوری، پیکلر، بازی آزاد و چیدمان اتاق کودک، با تجربهٔ کارگاه چوبز.")}</description>`,
    `<language>${SITE.inLanguage}</language>`,
    `<atom:link href="${absoluteUrl(SITE.rss.path)}" rel="self" type="application/rss+xml"/>`,
    built ? `<lastBuildDate>${rfc822Tehran(built)}</lastBuildDate>` : "",
    `<image><url>${absoluteUrl(SITE.logo.path)}</url><title>${SITE.rss.title}</title><link>${magUrl}</link></image>`,
    ...items,
    "</channel>",
    "</rss>",
    "",
  ]
    .filter((line, i, all) => line || i === all.length - 1)
    .join("\n");
}

/* ------------------------------------------------------------------ */
/* Torob API source rows (SEO.md §6.1)                                   */
/* ------------------------------------------------------------------ */

/** Every published, Torob-enabled product, newest id first, ready for `torobProduct()`. */
export async function listTorobSources(): Promise<TorobApiSource[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.products, tag.categories, tag.media);
  const rows = loadProducts().filter((p) => p.torobEnabled);
  const ids = rows.map((p) => p.id);
  const images = loadProductImages(ids);
  const variants = loadVariants(ids);
  return rows
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      summary: p.summary,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      availability: p.availability,
      warrantyMonths: p.warrantyMonths,
      guaranteeText: p.guaranteeText,
      torobEnabled: p.torobEnabled,
      variants: (variants.get(p.id) ?? []).map((v) => ({ price: v.price })),
      categoryName: p.category.name,
      imagePaths: (images.get(p.id) ?? []).map((i) => i.path),
      material: p.material,
      finish: p.finish,
      dimensions: p.dimensions,
      ageMinMonths: p.ageMinMonths,
      ageMaxMonths: p.ageMaxMonths,
      maxLoadKg: p.maxLoadKg,
      specs: jsonList(p.specs),
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      updatedAt: p.updatedAt.toISOString(),
    }))
    .sort((a, b) => b.id - a.id);
}
