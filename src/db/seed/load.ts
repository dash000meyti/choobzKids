import fs from "node:fs";
import path from "node:path";
import { count, eq } from "drizzle-orm";
import type { DB } from "../open";
import * as s from "../schema";
import type {
  SeedAuthor,
  SeedCategory,
  SeedFaq,
  SeedGlossaryTerm,
  SeedPage,
  SeedPost,
  SeedProduct,
  SeedReview,
  SeedRoom,
  SeedTopic,
} from "./types";

/*
 * Loads /seed/content/*.json into an empty database.
 * Runs in the Docker builder (so prerendered pages have content) and on first container boot
 * when the volume's database is empty. Never imports server-only modules.
 */

function seedDir() {
  return path.resolve(process.env.SEED_DIR ?? path.join("seed", "content"));
}

/** Arabic ي/ك → Persian ی/ک, recursively through seed values. */
function normalize<T>(value: T): T {
  if (typeof value === "string") return value.replace(/ي/g, "ی").replace(/ك/g, "ک") as T;
  if (Array.isArray(value)) return value.map(normalize) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v)])) as T;
  }
  return value;
}

function read<T>(file: string, fallback?: T): T {
  const full = path.join(seedDir(), file);
  if (!fs.existsSync(full)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing seed file: ${full}`);
  }
  return normalize(JSON.parse(fs.readFileSync(full, "utf8")) as T);
}

function readPosts(): SeedPost[] {
  const dir = path.join(seedDir(), "posts");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => read<SeedPost>(path.join("posts", f)));
}

function wordCount(markdown: string): number {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\{#[a-z0-9-]+\}/g, " ")
    .replace(/[#>*_`|[\]()!:-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Seed page slugs that changed after the content was written (DESIGN.md §0.3 #9). */
const PAGE_SLUG_RENAMES: Record<string, string> = { "safety-materials": "safety" };

/** Tehran noon on a YYYY-MM-DD date. */
const day = (iso: string) => new Date(`${iso}T12:00:00+03:30`);

export function isDatabaseEmpty(db: DB): boolean {
  const [row] = db.select({ n: count() }).from(s.products).all();
  return (row?.n ?? 0) === 0;
}

/** Deletes every content row (FK-safe order). Used by `db:seed --force`. */
export function wipeContent(db: DB) {
  db.transaction((tx) => {
    for (const table of [
      s.roomPresetItems,
      s.roomPresets,
      s.productAddons,
      s.workshopLog,
      s.postProducts,
      s.productRelations,
      s.productMedia,
      s.productVariants,
      s.reviews,
      s.communityPhotos,
      s.faqs,
      s.posts,
      s.topics,
      s.authors,
      s.glossaryTerms,
      s.pages,
      s.products,
      s.categories,
      s.settings,
    ]) {
      tx.delete(table).run();
    }
  });
}

export function seedDatabase(db: DB, { log = console.log } = {}) {
  const categories = read<SeedCategory[]>("categories.json");
  const products = read<SeedProduct[]>("products.json");
  const authors = read<SeedAuthor[]>("authors.json", []);
  const topics = read<SeedTopic[]>("topics.json", []);
  const glossary = read<SeedGlossaryTerm[]>("glossary.json", []);
  const pages = read<SeedPage[]>("pages.json", []);
  const rooms = read<SeedRoom[]>("rooms.json", []);
  const faqs = read<Record<string, SeedFaq[]>>("faqs.json", {});
  const reviews = read<SeedReview[]>("reviews.json", []);
  const settings: Record<string, unknown> = {
    ...read<Record<string, unknown>>("settings.json", {}),
    ...read<Record<string, unknown>>("site-settings.json", {}),
  };
  // Age hub editorial (intro, milestone paragraphs, sources) lives in settings.age_hubs.
  const ageHubs = read<unknown[]>("age-hubs.json", []);
  if (ageHubs.length) settings.age_hubs = ageHubs;
  const posts = readPosts();

  db.transaction((tx) => {
    const faqRows = (
      scope: s.FaqScope,
      scopeId: number | null,
      list: SeedFaq[] = [],
      scopeKey: string | null = null,
    ) =>
      list.map((f, i) => ({
        scope,
        scopeId,
        scopeKey: f.section ?? scopeKey,
        question: f.question,
        answer: f.answer,
        featured: f.featured ?? false,
        sortOrder: i,
      }));

    /* Categories */
    const categoryIds = new Map<string, number>();
    for (const c of categories) {
      const [row] = tx
        .insert(s.categories)
        .values({
          slug: c.slug,
          name: c.name,
          tagline: c.tagline,
          description: c.description,
          illustration: c.illustration,
          accent: c.accent,
          sortOrder: c.sortOrder,
          seoTitle: c.seoTitle,
          seoDescription: c.seoDescription,
        })
        .returning({ id: s.categories.id })
        .all();
      categoryIds.set(c.slug, row.id);
      const rows = faqRows("category", row.id, c.faqs);
      if (rows.length) tx.insert(s.faqs).values(rows).run();
    }

    /* Products */
    const productIds = new Map<string, number>();
    const launched = day("2026-09-01");
    for (const p of products) {
      const categoryId = categoryIds.get(p.category);
      if (!categoryId) throw new Error(`Product ${p.slug}: unknown category ${p.category}`);
      const [row] = tx
        .insert(s.products)
        .values({
          slug: p.slug,
          name: p.name,
          subtitle: p.subtitle,
          summary: p.summary,
          description: p.description,
          categoryId,
          status: "published",
          sku: p.sku,
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? null,
          stock: p.stock,
          availability: p.availability,
          leadTimeDays: p.leadTimeDays ?? null,
          ageMinMonths: p.ageMinMonths,
          ageMaxMonths: p.ageMaxMonths ?? null,
          skills: p.skills,
          material: p.material,
          finish: p.finish,
          dimensions: p.dimensions,
          weightKg: p.weightKg,
          maxLoadKg: p.maxLoadKg ?? null,
          highlights: p.highlights,
          specs: p.specs,
          inTheBox: p.inTheBox,
          safetyNotes: p.safetyNotes,
          careNotes: p.careNotes,
          warrantyMonths: p.warrantyMonths,
          assemblyMinutes: p.assemblyMinutes ?? null,
          primaryQuery: p.primaryQuery ?? null,
          alternateNames: p.alternateNames ?? [],
          guaranteeText: p.guaranteeText ?? (p.warrantyMonths ? `${p.warrantyMonths} ماه ضمانت کارگاه چوبز` : null),
          illustration: p.illustration,
          featured: p.featured,
          isNew: p.isNew,
          sortOrder: p.sortOrder,
          publishedAt: launched,
          createdAt: launched,
          updatedAt: launched,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
        })
        .returning({ id: s.products.id })
        .all();
      productIds.set(p.slug, row.id);

      if (p.variants?.length) {
        tx.insert(s.productVariants)
          .values(
            p.variants.map((v, i) => ({
              productId: row.id,
              name: v.name,
              sku: v.sku,
              price: v.price ?? null,
              stock: v.stock,
              options: v.options,
              swatch: v.swatch ?? null,
              sortOrder: i,
            })),
          )
          .run();
      }
      const rows = faqRows("product", row.id, p.faqs);
      if (rows.length) tx.insert(s.faqs).values(rows).run();
    }

    for (const p of products) {
      const related = (p.related ?? [])
        .map((slug, i) => ({ relatedId: productIds.get(slug), i }))
        .filter((r): r is { relatedId: number; i: number } => r.relatedId != null && r.relatedId !== productIds.get(p.slug));
      if (related.length) {
        tx.insert(s.productRelations)
          .values(
            related.map((r) => ({
              productId: productIds.get(p.slug)!,
              relatedId: r.relatedId,
              kind: "related" as const,
              sortOrder: r.i,
            })),
          )
          .run();
      }
    }

    /* Engraving add-on (⚑ shown only when settings.engraving.enabled) */
    const engraving = settings.engraving as
      | { priceToman: number; maxChars: number; productSlugs: string[] }
      | undefined;
    for (const slug of engraving?.productSlugs ?? []) {
      const productId = productIds.get(slug);
      if (!productId) continue;
      tx.insert(s.productAddons)
        .values({
          productId,
          key: "engraving",
          name: "حک اسم کوچولو",
          priceToman: engraving!.priceToman,
          maxChars: engraving!.maxChars,
        })
        .run();
    }

    /* Authors (organisational in phase 1 — no invented people) */
    const authorIds = new Map<string, number>();
    for (const a of authors) {
      const [row] = tx
        .insert(s.authors)
        .values({
          slug: a.slug,
          name: a.name,
          role: a.role,
          jobTitle: a.role,
          bio: a.bio,
          credentials: a.credentials,
          sameAs: a.sameAs,
          isOrganization: true,
          isPlaceholder: false,
        })
        .returning({ id: s.authors.id })
        .all();
      authorIds.set(a.slug, row.id);
    }

    /* Topics */
    const topicIds = new Map<string, number>();
    for (const t of topics) {
      const [row] = tx
        .insert(s.topics)
        .values({
          slug: t.slug,
          name: t.name,
          tagline: t.tagline,
          description: t.description,
          illustration: t.illustration,
          accent: t.accent,
          sameAs: t.sameAs,
          sortOrder: t.sortOrder,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
        })
        .returning({ id: s.topics.id })
        .all();
      topicIds.set(t.slug, row.id);
    }

    /* Posts */
    for (const p of posts) {
      const publishedAt = day(p.publishedAt);
      const updatedAt = p.updatedAt ? day(p.updatedAt) : publishedAt;
      const [row] = tx
        .insert(s.posts)
        .values({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          tldr: p.tldr,
          body: p.body,
          format: p.format,
          topicId: topicIds.get(p.topic) ?? null,
          isPillar: p.isPillar,
          authorId: authorIds.get(p.author) ?? null,
          reviewerId: p.reviewer ? (authorIds.get(p.reviewer) ?? null) : null,
          illustration: p.illustration,
          ageMinMonths: p.ageMinMonths ?? null,
          ageMaxMonths: p.ageMaxMonths ?? null,
          readingMinutes: Math.max(1, Math.round(wordCount(p.body) / 200)),
          ymyl: p.ymyl,
          sources: p.sources,
          status: "published",
          featured: p.featured,
          publishedAt,
          contentUpdatedAt: updatedAt,
          primaryQuery: p.primaryQuery ?? null,
          secondaryQueries: p.secondaryQueries ?? [],
          aboutEntities: p.aboutEntities ?? [],
          createdAt: publishedAt,
          updatedAt,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
        })
        .returning({ id: s.posts.id })
        .all();
      const rows = faqRows("post", row.id, p.faqs);
      if (rows.length) tx.insert(s.faqs).values(rows).run();
      const linked = [...new Set(p.products ?? [])]
        .map((slug) => productIds.get(slug))
        .filter((id): id is number => id != null);
      if (linked.length) {
        tx.insert(s.postProducts)
          .values(linked.map((productId, i) => ({ postId: row.id, productId, sortOrder: i })))
          .run();
      }
      if (p.isPillar && topicIds.has(p.topic)) {
        tx.update(s.topics)
          .set({ pillarPostId: row.id })
          .where(eq(s.topics.id, topicIds.get(p.topic)!))
          .run();
      }
    }

    /* Glossary */
    if (glossary.length) {
      tx.insert(s.glossaryTerms)
        .values(
          glossary.map((g) => ({
            slug: g.slug,
            term: g.term,
            originalTerm: g.originalTerm ?? null,
            definition: g.definition,
            body: g.body ?? null,
            relatedPostSlugs: g.relatedPostSlugs ?? [],
            relatedProductSlugs: g.relatedProductSlugs ?? [],
            sameAs: g.sameAs ?? [],
            alternateNames: g.alternateNames ?? [],
            pillarPostSlug: g.pillarPostSlug ?? null,
          })),
        )
        .run();
    }

    /* Static pages */
    for (const pg of pages) {
      const slug = PAGE_SLUG_RENAMES[pg.slug] ?? pg.slug;
      const [row] = tx
        .insert(s.pages)
        .values({
          slug,
          title: pg.title,
          excerpt: pg.excerpt,
          body: pg.body,
          seoTitle: pg.seoTitle,
          seoDescription: pg.seoDescription,
          createdAt: launched,
          updatedAt: launched,
        })
        .returning({ id: s.pages.id })
        .all();
      const rows = faqRows("page", row.id, pg.faqs);
      if (rows.length) tx.insert(s.faqs).values(rows).run();
    }

    /* Room presets */
    for (const r of rooms) {
      const [row] = tx
        .insert(s.roomPresets)
        .values({
          slug: r.slug,
          name: r.name,
          ageStage: r.ageStage,
          tagline: r.tagline,
          description: r.description ?? "",
          floorAreaM2: r.floorAreaM2,
          illustration: r.illustration,
          sortOrder: r.sortOrder,
          primaryQuery: r.primaryQuery,
          seoTitle: r.seoTitle ?? null,
          seoDescription: r.seoDescription ?? null,
          createdAt: launched,
          updatedAt: launched,
        })
        .returning({ id: s.roomPresets.id })
        .all();
      const items = r.items
        .map((it, i) => ({ it, i, productId: productIds.get(it.product) }))
        .filter((x): x is { it: SeedRoom["items"][number]; i: number; productId: number } => x.productId != null);
      if (items.length) {
        tx.insert(s.roomPresetItems)
          .values(
            items.map(({ it, i, productId }) => ({
              presetId: row.id,
              productId,
              slot: it.slot,
              defaultOn: it.defaultOn ?? true,
              sortOrder: i,
            })),
          )
          .run();
      }
      const rows = faqRows("room", row.id, r.faqs);
      if (rows.length) tx.insert(s.faqs).values(rows).run();
    }

    /*
     * faqs.json: { "<section>": SeedFaq[] }. Sections buying · shipping · installments · returns ·
     * safety feed /faq (#anchors); legacy "general" maps to buying. "age:<hub-slug>" keys feed age hubs.
     */
    const sectionRows = Object.entries(faqs).flatMap(([key, list]) => {
      if (key.startsWith("age:")) return faqRows("age", null, list, key.slice(4));
      const section = key === "general" ? "buying" : key;
      return faqRows(section === "buying" ? "general" : "shipping", null, list, section);
    });
    // Feature six questions on the home page if none are flagged.
    if (!sectionRows.some((r) => r.featured)) {
      const pool = sectionRows.filter((r) => r.scope !== "age");
      for (const section of ["buying", "shipping", "installments", "returns", "safety"]) {
        pool.filter((r) => r.scopeKey === section).slice(0, 2).forEach((r) => (r.featured = true));
      }
    }
    if (sectionRows.length) tx.insert(s.faqs).values(sectionRows).run();

    /* Sample testimonials — labelled «نمونه», hidden in production, never Review markup */
    if (reviews.length) {
      tx.insert(s.reviews)
        .values(
          reviews.map((r) => ({
            productId: r.product ? (productIds.get(r.product) ?? null) : null,
            authorName: r.authorName,
            city: r.city,
            childAge: r.childAge,
            rating: r.rating,
            title: r.title,
            body: r.body,
            featured: r.featured,
            isSample: true,
            status: "approved" as const,
            createdAt: launched,
            updatedAt: launched,
          })),
        )
        .run();
    }

    const settingRows = Object.entries(settings).map(([key, value]) => ({ key, value: value ?? null }));
    if (settingRows.length) tx.insert(s.settings).values(settingRows).run();
  });

  log(
    `inserted ${categories.length} categories, ${products.length} products, ${posts.length} posts, ` +
      `${glossary.length} terms, ${topics.length} topics, ${pages.length} pages, ${rooms.length} rooms, ` +
      `${reviews.length} sample reviews`,
  );
}

