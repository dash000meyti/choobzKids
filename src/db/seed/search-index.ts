import { asc, eq } from "drizzle-orm";
import type { DB } from "../open";
import * as s from "../schema";

/*
 * Site search index (SEO.md §6.5, §7.5): fills the FTS5 table `search_index`
 * (drizzle/0001_search.sql) from the published content. The seed runs it after loading; the
 * phase-2 CMS calls it after a save. No server-only imports: tsx scripts load this file.
 */

export type SearchKind = "product" | "category" | "room" | "post" | "topic" | "term";

/* ------------------------------------------------------------------ */
/* Persian search key — used for the index AND for every query          */
/* ------------------------------------------------------------------ */

const FOLD: Record<string, string> = {
  "ي": "ی", // Arabic yeh
  "ى": "ی", // alef maksura
  "ئ": "ی",
  "ك": "ک", // Arabic kaf
  "ة": "ه",
  "ۀ": "ه",
  "ؤ": "و",
  "أ": "ا",
  "إ": "ا",
  "ٱ": "ا",
  "آ": "ا",
};
const FOLD_RE = new RegExp(`[${Object.keys(FOLD).join("")}]`, "g");
// Harakat, tanwin, superscript alef, hamza above/below, Quranic annotation marks.
const MARKS_RE = /[ً-ٰٟۖ-ۭ]/g;
const TATWEEL_RE = /ـ/g;
// LRM/RLM, Arabic letter mark, embeddings/overrides, isolates, BOM.
const BIDI_RE = /[‎‏؜‪-‮⁦-⁩﻿]/g;
const JOINERS_RE = /[‌‍]/g;

/**
 * The canonical form of Persian text for matching; never shown to anyone.
 * Folds Arabic letter variants, drops harakat, tatweel and bidi controls, turns ZWNJ into a
 * space (or removes it with `joinZwnj`), writes every digit as Latin 0–9 (one canonical form
 * for index and query, so «۱ سالگی», «١ سالگی» and «1 سالگی» are the same search), lower-cases
 * Latin, and reduces everything else to single spaces.
 */
export function searchKey(input: string, joinZwnj = false): string {
  return input
    .normalize("NFC")
    .replace(FOLD_RE, (c) => FOLD[c])
    .replace(MARKS_RE, "")
    .replace(TATWEEL_RE, "")
    .replace(BIDI_RE, "")
    .replace(JOINERS_RE, joinZwnj ? "" : " ")
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Indexed form of a field: the spaced key, plus the ZWNJ-joined spelling of each compound
 * («اسباب‌بازی» → «اسباب بازی» + «اسباببازی»), because people type it both ways.
 */
function indexText(text: string): string {
  const spaced = searchKey(text);
  const joined = searchKey(text, true);
  if (joined === spaced) return spaced;
  const present = new Set(spaced.split(" "));
  const compounds = [...new Set(joined.split(" "))].filter((word) => !present.has(word));
  return compounds.length ? `${spaced} ${compounds.join(" ")}` : spaced;
}

/**
 * Markdown (CONTENT-FORMAT.md) → the words a reader sees. Link targets, scheme links,
 * directive attributes, anchors and code are dropped; searchKey() removes the punctuation.
 */
function readableText(markdown: string | null | undefined): string {
  if (!markdown) return "";
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\{#[^}]*\}/g, " ")
    .replace(/^:{2,3}[\w-]+(\{[^}]*\})?/gm, (_, attrs: string | undefined) =>
      // Keep the visible attribute text of directives (a product's «چرا اینجا؟», captions).
      attrs ? [...attrs.matchAll(/(?:why|caption|title)="([^"]*)"/g)].map((m) => m[1]).join(" ") : " ",
    )
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[!\w+\]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ");
}

const join = (...parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join("\n");

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

type SearchDoc = {
  kind: SearchKind;
  refId: number;
  slug: string;
  /** Display title as written. */
  label: string;
  /** One short display line under the title in suggestions. */
  hint: string | null;
  title: string;
  keywords: string;
  body: string;
};

function productDocs(db: DB): SearchDoc[] {
  const rows = db
    .select({ product: s.products, categoryName: s.categories.name })
    .from(s.products)
    .innerJoin(s.categories, eq(s.categories.id, s.products.categoryId))
    .where(eq(s.products.status, "published"))
    .orderBy(asc(s.products.sortOrder))
    .all();
  const variants = db.select({ productId: s.productVariants.productId, name: s.productVariants.name }).from(s.productVariants).all();
  return rows.map(({ product: p, categoryName }) => ({
    kind: "product",
    refId: p.id,
    slug: p.slug,
    label: p.name,
    hint: categoryName,
    title: p.name,
    keywords: join(
      p.subtitle,
      p.primaryQuery,
      ...p.alternateNames,
      p.sku,
      categoryName,
      p.material,
      p.finish,
      ...variants.filter((v) => v.productId === p.id).map((v) => v.name),
    ),
    body: join(
      p.summary,
      readableText(p.description),
      ...p.highlights,
      ...p.specs.map((spec) => `${spec.label} ${spec.value}`),
      ...p.inTheBox,
    ),
  }));
}

function categoryDocs(db: DB): SearchDoc[] {
  return db
    .select()
    .from(s.categories)
    .orderBy(asc(s.categories.sortOrder))
    .all()
    .map((c) => ({
      kind: "category",
      refId: c.id,
      slug: c.slug,
      label: c.name,
      hint: c.tagline,
      title: c.name,
      keywords: join(c.tagline, c.seoTitle),
      body: readableText(c.description),
    }));
}

function roomDocs(db: DB): SearchDoc[] {
  return db
    .select()
    .from(s.roomPresets)
    .where(eq(s.roomPresets.status, "published"))
    .orderBy(asc(s.roomPresets.sortOrder))
    .all()
    .map((r) => ({
      kind: "room",
      refId: r.id,
      slug: r.slug,
      label: r.name,
      hint: r.tagline,
      title: r.name,
      keywords: join(r.tagline, r.primaryQuery, r.seoTitle),
      body: readableText(r.description),
    }));
}

function postDocs(db: DB): SearchDoc[] {
  return db
    .select({ post: s.posts, topicName: s.topics.name })
    .from(s.posts)
    .leftJoin(s.topics, eq(s.topics.id, s.posts.topicId))
    .where(eq(s.posts.status, "published"))
    .all()
    .map(({ post: p, topicName }) => ({
      kind: "post",
      refId: p.id,
      slug: p.slug,
      label: p.title,
      hint: topicName,
      title: p.title,
      keywords: join(p.primaryQuery, ...p.secondaryQueries, topicName),
      body: join(p.excerpt, ...p.tldr, readableText(p.body)),
    }));
}

function topicDocs(db: DB): SearchDoc[] {
  return db
    .select()
    .from(s.topics)
    .orderBy(asc(s.topics.sortOrder))
    .all()
    .map((t) => ({
      kind: "topic",
      refId: t.id,
      slug: t.slug,
      label: t.name,
      hint: t.tagline,
      title: t.name,
      keywords: join(t.tagline, t.seoTitle),
      body: readableText(t.description),
    }));
}

function termDocs(db: DB): SearchDoc[] {
  return db
    .select()
    .from(s.glossaryTerms)
    .orderBy(asc(s.glossaryTerms.term))
    .all()
    .map((g) => ({
      kind: "term",
      refId: g.id,
      slug: g.slug,
      label: g.term,
      hint: g.originalTerm,
      title: g.term,
      keywords: join(g.originalTerm, ...g.alternateNames),
      body: join(g.definition, readableText(g.body)),
    }));
}

/**
 * Replaces the whole index in one transaction (a few hundred rows; well under a second).
 * Returns the number of documents indexed.
 */
export function rebuildSearchIndex(db: DB): number {
  const docs = [
    ...productDocs(db),
    ...categoryDocs(db),
    ...roomDocs(db),
    ...postDocs(db),
    ...topicDocs(db),
    ...termDocs(db),
  ];
  const sqlite = db.$client;
  const insert = sqlite.prepare(
    "INSERT INTO search_index (kind, ref_id, slug, label, hint, title, keywords, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  sqlite.transaction(() => {
    sqlite.prepare("DELETE FROM search_index").run();
    for (const d of docs) {
      insert.run(d.kind, d.refId, d.slug, d.label, d.hint, indexText(d.title), indexText(d.keywords), indexText(d.body));
    }
  })();
  // Merge the freshly written segments so queries read one b-tree.
  sqlite.prepare("INSERT INTO search_index (search_index) VALUES ('optimize')").run();
  return docs.length;
}
