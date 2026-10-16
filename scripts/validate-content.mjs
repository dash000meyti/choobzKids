#!/usr/bin/env node
/*
 * Content QA for /seed/content (no dependencies).
 *
 *   node scripts/validate-content.mjs            errors + warnings, exit 1 on errors
 *   node scripts/validate-content.mjs --strict   also checks the AEO style rules
 *                                                (H2 = question, 40–60-word answer paragraph)
 *   node scripts/validate-content.mjs --verbose  also lists the manual-review notes in full
 *
 * Checks: JSON parses; fields and types match src/db/seed/types.ts (no unknown keys);
 * slugs unique and kebab-case; the fixed catalog (categories, products, posts, topics,
 * authors, glossary slugs from docs/CONTENT-PLAN.md §۲); every cross-reference
 * (product.category, related, post.products, glossary related*, review.product, post
 * topic/author/reviewer); Markdown link schemes and ::directives; callout markers;
 * Persian orthography (no Arabic ي/ك/ى, no kashida, no Arabic-Indic digits, no Latin
 * digits in Persian prose, ZWNJ hygiene); no H1 in bodies; SEO lengths; tldr 3–5;
 * post faqs and http(s) sources.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.resolve(process.env.SEED_DIR ?? path.join(ROOT, "seed", "content"));
const PLAN = path.join(ROOT, "docs", "CONTENT-PLAN.md");
const STRICT = process.argv.includes("--strict");
const VERBOSE = process.argv.includes("--verbose");
const TODAY = new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ reporting */

const errors = [];
const warnings = [];
const notes = [];
const err = (loc, msg) => errors.push(`${loc}: ${msg}`);
const warn = (loc, msg) => warnings.push(`${loc}: ${msg}`);
const note = (loc, msg) => notes.push(`${loc}: ${msg}`);
const snip = (s, i, len = 0, pad = 24) =>
  JSON.stringify(
    (i > pad ? "…" : "") +
      s.slice(Math.max(0, i - pad), i + len + pad).replace(/\s+/g, " ") +
      (i + len + pad < s.length ? "…" : ""),
  );

/* ------------------------------------------------------------------ vocabulary */

const TOPIC_KEYS = ["montessori", "movement", "learning-tower", "nursery", "play", "art", "reading", "safety", "gifts"];
const AUTHOR_KEYS = ["choobz-editorial", "choobz-workshop"];
const SKILL_KEYS = [
  "gross-motor", "fine-motor", "balance", "independence", "practical-life",
  "creativity", "language", "imagination", "focus", "confidence",
];
const ILLUSTRATION_KEYS = [
  "learning-tower", "pikler-triangle", "pikler-arch", "swedish-ladder", "climbing-hex",
  "balance-board", "front-facing-bookshelf", "wall-art-roll", "kids-table-chair",
  "montessori-shelf", "rainbow-stacker", "duck-pull-toy", "wooden-blocks", "room-set",
];
/** Accent pairs in docs/DESIGN.md (`--color-{key}-tint` / `-ink`). */
const ACCENT_KEYS = ["terracotta", "wood", "sage", "mustard", "sky", "plum", "mint", "cream"];
const POST_FORMATS = ["guide", "article", "howto", "comparison", "checklist", "story"];
const AVAILABILITY = ["in_stock", "out_of_stock", "preorder", "made_to_order"];
const CALLOUTS = ["TIP", "NOTE", "WARNING", "WORKSHOP", "EXPERT", "MYTH"];
const LINK_SCHEMES = ["product", "category", "post", "topic", "term", "page"];

/** The fixed catalog (slug → category, illustration, name). */
const CATALOG_CATEGORIES = ["climbing", "learning-towers", "furniture", "art", "toys", "room-sets"];
const CATALOG_PRODUCTS = {
  "learning-tower": ["learning-towers", "learning-tower", "برج یادگیری مونته‌سوری"],
  "pikler-triangle": ["climbing", "pikler-triangle", "مثلث پیکلر با رمپ دوطرفه"],
  "pikler-arch": ["climbing", "pikler-arch", "آرک پیکلر (راکر)"],
  "swedish-ladder": ["climbing", "swedish-ladder", "نردبان سوئدی کودک"],
  "climbing-hex-panels": ["climbing", "climbing-hex", "پنل‌های شش‌ضلعی صعود (ست ۳ تایی)"],
  "balance-board": ["climbing", "balance-board", "تخته تعادل والدورف"],
  "front-facing-bookshelf": ["furniture", "front-facing-bookshelf", "کتابخانهٔ دیواری روبه‌رو"],
  "kids-table-chair": ["furniture", "kids-table-chair", "میز و صندلی کودک"],
  "montessori-shelf": ["furniture", "montessori-shelf", "قفسهٔ مونته‌سوری اسباب‌بازی"],
  "wall-art-roll": ["art", "wall-art-roll", "رول نقاشی دیواری"],
  "rainbow-stacker": ["toys", "rainbow-stacker", "رنگین‌کمان چوبی"],
  "duck-pull-toy": ["toys", "duck-pull-toy", "اردک چرخ‌دار چوبی"],
  "wooden-blocks": ["toys", "wooden-blocks", "مکعب‌های ساختنی چوبی"],
  "montessori-room-set": ["room-sets", "room-set", "پک اتاق مونته‌سوری"],
};
const CATALOG_POSTS = [
  "learning-tower-guide", "pikler-triangle-guide", "montessori-at-home-guide", "montessori-room-setup",
  "montessori-vs-waldorf-vs-pikler", "gross-motor-milestones-by-age", "wooden-sismooni-checklist",
  "wooden-toy-safety-guide", "child-drawing-stages", "birthday-gift-guide-by-age",
];

/* ------------------------------------------------------------------ shape checking */

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_RE = /^https?:\/\/[^\s]+$/;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const typeName = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

/** A spec is a function (value, loc) → void that reports problems. */
const S = (v, loc) => {
  if (typeof v !== "string") return err(loc, `expected string, got ${typeName(v)}`);
  if (!v.trim()) err(loc, "empty string");
};
const N = (min = -Infinity) => (v, loc) => {
  if (typeof v !== "number" || !Number.isFinite(v)) return err(loc, `expected number, got ${typeName(v)}`);
  if (v < min) err(loc, `expected ≥ ${min}, got ${v}`);
};
const I = (min = -Infinity, max = Infinity) => (v, loc) => {
  if (typeof v !== "number" || !Number.isInteger(v)) return err(loc, `expected integer, got ${typeName(v)} ${JSON.stringify(v)}`);
  if (v < min || v > max) err(loc, `expected ${min}…${max}, got ${v}`);
};
const B = (v, loc) => {
  if (typeof v !== "boolean") err(loc, `expected boolean, got ${typeName(v)}`);
};
const oneOf = (values) => (v, loc) => {
  if (!values.includes(v)) err(loc, `expected one of ${values.join(" | ")}, got ${JSON.stringify(v)}`);
};
const re = (rx, what) => (v, loc) => {
  if (typeof v !== "string") return err(loc, `expected string, got ${typeName(v)}`);
  if (!rx.test(v)) err(loc, `expected ${what}, got ${JSON.stringify(v)}`);
};
const slug = re(KEBAB, "kebab-case slug");
const url = re(URL_RE, "http(s) URL");
const arr = (spec) => (v, loc) => {
  if (!Array.isArray(v)) return err(loc, `expected array, got ${typeName(v)}`);
  v.forEach((x, i) => spec(x, `${loc}[${i}]`));
};
const record = (spec) => (v, loc) => {
  if (typeName(v) !== "object") return err(loc, `expected object, got ${typeName(v)}`);
  for (const [k, x] of Object.entries(v)) spec(x, `${loc}.${k}`);
};
const opt = (spec) => Object.assign((v, loc) => spec(v, loc), { optional: true });
const obj = (shape) => (v, loc) => {
  if (typeName(v) !== "object") return err(loc, `expected object, got ${typeName(v)}`);
  for (const [k, spec] of Object.entries(shape)) {
    if (!(k in v)) {
      if (!spec.optional) err(loc, `missing required field "${k}"`);
      continue;
    }
    if (v[k] === null && spec.optional) {
      err(`${loc}.${k}`, "optional field is null; omit it instead");
      continue;
    }
    spec(v[k], `${loc}.${k}`);
  }
  for (const k of Object.keys(v)) if (!(k in shape)) err(loc, `unknown field "${k}" (not in src/db/seed/types.ts)`);
};

const Faq = obj({ question: S, answer: S });
const Variant = obj({
  name: S, sku: S, price: opt(I(1)), stock: I(0), options: record(S), swatch: opt(re(HEX_RE, "#RRGGBB")),
});
const Category = obj({
  slug, name: S, tagline: S, description: S, illustration: oneOf(ILLUSTRATION_KEYS), accent: oneOf(ACCENT_KEYS),
  sortOrder: I(), seoTitle: S, seoDescription: S, faqs: arr(Faq),
});
const Product = obj({
  slug, name: S, subtitle: S, summary: S, description: S, category: S, sku: S, price: I(1),
  compareAtPrice: opt(I(1)), stock: I(0), availability: oneOf(AVAILABILITY), leadTimeDays: opt(I(0)),
  ageMinMonths: I(0, 216), ageMaxMonths: opt(I(0, 216)), skills: arr(oneOf(SKILL_KEYS)), material: S, finish: S,
  dimensions: obj({ widthCm: N(0), heightCm: N(0), depthCm: N(0), extra: opt(record(N(0))) }),
  weightKg: N(0), maxLoadKg: opt(N(0)), highlights: arr(S), specs: arr(obj({ label: S, value: S })),
  inTheBox: arr(S), safetyNotes: S, careNotes: S, warrantyMonths: I(0), illustration: oneOf(ILLUSTRATION_KEYS),
  featured: B, isNew: B, sortOrder: I(), seoTitle: S, seoDescription: S, variants: arr(Variant), faqs: arr(Faq),
  related: arr(slug), claimsToVerify: arr(S),
});
const Post = obj({
  slug, title: S, excerpt: S, seoTitle: S, seoDescription: S, tldr: arr(S), body: S, format: oneOf(POST_FORMATS),
  topic: oneOf(TOPIC_KEYS), isPillar: B, author: oneOf(AUTHOR_KEYS), reviewer: opt(oneOf(AUTHOR_KEYS)),
  illustration: oneOf(ILLUSTRATION_KEYS), ageMinMonths: opt(I(0, 216)), ageMaxMonths: opt(I(0, 216)), ymyl: B,
  sources: arr(obj({ title: S, url, publisher: opt(S) })), faqs: arr(Faq), products: arr(slug), featured: B,
  publishedAt: re(DATE_RE, "YYYY-MM-DD"), claimsToVerify: arr(S),
});
const Topic = obj({
  slug: oneOf(TOPIC_KEYS), name: S, tagline: S, description: S, illustration: oneOf(ILLUSTRATION_KEYS),
  accent: oneOf(ACCENT_KEYS), sameAs: arr(url), sortOrder: I(), seoTitle: S, seoDescription: S,
});
const Term = obj({
  slug, term: S, originalTerm: opt(S), definition: S, body: opt(S), relatedPostSlugs: arr(slug),
  relatedProductSlugs: arr(slug), sameAs: arr(url),
});
const Author = obj({ slug: oneOf(AUTHOR_KEYS), name: S, role: S, bio: S, credentials: arr(S), sameAs: arr(url) });
const Page = obj({ slug, title: S, excerpt: S, body: S, seoTitle: S, seoDescription: S, faqs: opt(arr(Faq)) });
const Review = obj({
  product: opt(slug), authorName: S, city: S, childAge: S, rating: I(1, 5), title: S, body: S, featured: B,
});
const Faqs = obj({ general: arr(Faq), shipping: arr(Faq) });

/* ------------------------------------------------------------------ load */

function load(rel) {
  const full = path.join(DIR, rel);
  if (!fs.existsSync(full)) {
    err(rel, "file is missing");
    return undefined;
  }
  const text = fs.readFileSync(full, "utf8");
  if (text.charCodeAt(0) === 0xfeff) warn(rel, "file starts with a UTF-8 BOM");
  try {
    return JSON.parse(text);
  } catch (e) {
    err(rel, `invalid JSON: ${e.message}`);
    return undefined;
  }
}

const files = {
  categories: "categories.json", products: "products.json", glossary: "glossary.json", topics: "topics.json",
  authors: "authors.json", pages: "pages.json", faqs: "faqs.json", reviews: "reviews.json", settings: "settings.json",
};
const data = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, load(f)]));
const postFiles = fs.existsSync(path.join(DIR, "posts"))
  ? fs.readdirSync(path.join(DIR, "posts")).filter((f) => f.endsWith(".json")).sort()
  : (err("posts/", "directory is missing"), []);
const posts = postFiles.map((f) => ({ file: `posts/${f}`, post: load(`posts/${f}`) })).filter((p) => p.post);

const asList = (key, spec) => {
  const v = data[key];
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    err(files[key], `expected a top-level array, got ${typeName(v)}`);
    return [];
  }
  v.forEach((x, i) => spec(x, `${files[key]}[${i}${x && x.slug ? `:${x.slug}` : ""}]`));
  return v.filter((x) => typeName(x) === "object");
};

const categories = asList("categories", Category);
const products = asList("products", Product);
const glossary = asList("glossary", Term);
const topics = asList("topics", Topic);
const authors = asList("authors", Author);
const pages = asList("pages", Page);
const reviews = asList("reviews", Review);
if (data.faqs !== undefined) Faqs(data.faqs, files.faqs);
if (data.settings !== undefined) {
  if (typeName(data.settings) !== "object") err(files.settings, "expected a top-level object");
  else {
    const st = data.settings;
    for (const k of ["siteName", "tagline", "description"]) if (!(k in st)) warn(files.settings, `missing "${k}"`);
    for (const k of ["instagram", "bale"]) if (st[k] != null) url(st[k], `${files.settings}.${k}`);
    if (st.email != null) re(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email")(st.email, `${files.settings}.email`);
    if (st.freeShippingThreshold != null) I(0)(st.freeShippingThreshold, `${files.settings}.freeShippingThreshold`);
  }
}
for (const { file, post } of posts) Post(post, file);

/* ------------------------------------------------------------------ catalog & uniqueness */

function unique(list, key, where) {
  const seen = new Map();
  list.forEach((x, i) => {
    const v = x[key];
    if (typeof v !== "string") return;
    if (seen.has(v)) err(`${where}[${i}]`, `duplicate ${key} "${v}" (also at [${seen.get(v)}])`);
    else seen.set(v, i);
  });
  return new Set(seen.keys());
}

const catSlugs = unique(categories, "slug", files.categories);
const productSlugs = unique(products, "slug", files.products);
const termSlugs = unique(glossary, "slug", files.glossary);
const topicSlugs = unique(topics, "slug", files.topics);
const authorSlugs = unique(authors, "slug", files.authors);
const pageSlugs = unique(pages, "slug", files.pages);
const postList = posts.map((p) => p.post);
const postSlugs = unique(postList, "slug", "posts/*");

const sameSet = (actual, expected, where, what) => {
  for (const s of expected) if (!actual.has(s)) err(where, `catalog ${what} "${s}" is missing`);
  for (const s of actual) if (!expected.includes(s)) err(where, `"${s}" is not in the fixed ${what} catalog`);
};
sameSet(catSlugs, CATALOG_CATEGORIES, files.categories, "category");
sameSet(productSlugs, Object.keys(CATALOG_PRODUCTS), files.products, "product");
sameSet(postSlugs, CATALOG_POSTS, "posts/", "post");
sameSet(topicSlugs, TOPIC_KEYS, files.topics, "topic");
sameSet(authorSlugs, AUTHOR_KEYS, files.authors, "author");

if (fs.existsSync(PLAN)) {
  const plan = fs.readFileSync(PLAN, "utf8");
  const start = plan.indexOf("\n## ۲.");
  const end = plan.indexOf("\n## ۳.", start);
  const section = start >= 0 ? plan.slice(start, end > 0 ? end : undefined) : "";
  const planned = [...section.matchAll(/^\|[^|\n]*\|\s*`([a-z0-9-]+)`\s*\|/gm)].map((m) => m[1]);
  if (planned.length) {
    for (const s of termSlugs) if (!planned.includes(s)) err(files.glossary, `term "${s}" is not in CONTENT-PLAN §۲`);
    for (const s of planned) if (!termSlugs.has(s)) warn(files.glossary, `CONTENT-PLAN §۲ term "${s}" has no entry`);
  } else warn("docs/CONTENT-PLAN.md", "could not read the §۲ glossary slugs");
}

for (const p of products) {
  const loc = `${files.products}:${p.slug}`;
  const expected = CATALOG_PRODUCTS[p.slug];
  if (expected) {
    if (p.category !== expected[0]) err(loc, `category should be "${expected[0]}", got "${p.category}"`);
    if (p.illustration !== expected[1]) err(loc, `illustration should be "${expected[1]}", got "${p.illustration}"`);
    if (p.name !== expected[2]) warn(loc, `name differs from the catalog: «${p.name}» vs «${expected[2]}»`);
  }
}

/* SKUs unique across products and variants. */
{
  const skus = new Map();
  for (const p of products) {
    for (const [s, where] of [[p.sku, p.slug], ...(p.variants ?? []).map((v) => [v.sku, `${p.slug} variant`])]) {
      if (typeof s !== "string") continue;
      if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(s)) warn(`${files.products}:${where}`, `SKU "${s}" is not UPPER-KEBAB`);
      if (skus.has(s)) err(`${files.products}:${where}`, `duplicate SKU "${s}" (also ${skus.get(s)})`);
      else skus.set(s, where);
    }
  }
}

/* ------------------------------------------------------------------ cross-references */

const exists = { product: productSlugs, category: catSlugs, post: postSlugs, topic: topicSlugs, term: termSlugs, page: pageSlugs };

function refs(list, set, loc, what) {
  if (!Array.isArray(list)) return;
  const seen = new Set();
  list.forEach((s, i) => {
    if (typeof s !== "string") return;
    if (!set.has(s)) err(`${loc}[${i}]`, `unknown ${what} "${s}"`);
    if (seen.has(s)) warn(`${loc}[${i}]`, `duplicate ${what} "${s}"`);
    seen.add(s);
  });
}

for (const p of products) {
  const loc = `${files.products}:${p.slug}`;
  if (!catSlugs.has(p.category)) err(`${loc}.category`, `unknown category "${p.category}"`);
  refs(p.related, productSlugs, `${loc}.related`, "product");
  if (p.related?.includes(p.slug)) err(`${loc}.related`, "product lists itself as related");
  if (Array.isArray(p.related) && p.related.length === 0) warn(`${loc}.related`, "no related products");
  if (p.compareAtPrice != null && p.compareAtPrice <= p.price) err(`${loc}.compareAtPrice`, "must be greater than price");
  if (p.ageMaxMonths != null && p.ageMaxMonths < p.ageMinMonths) err(loc, "ageMaxMonths < ageMinMonths");
  if (p.availability === "made_to_order" && p.leadTimeDays == null) warn(loc, "made_to_order without leadTimeDays");
  if (typeof p.price === "number" && p.price % 1000 !== 0) warn(`${loc}.price`, "price is not a round Toman amount");
  if (Array.isArray(p.variants) && p.variants.length) {
    const keys = JSON.stringify(Object.keys(p.variants[0].options ?? {}).sort());
    p.variants.forEach((v, i) => {
      if (JSON.stringify(Object.keys(v.options ?? {}).sort()) !== keys)
        warn(`${loc}.variants[${i}].options`, "option keys differ from the first variant");
    });
  }
  if (Array.isArray(p.faqs) && p.faqs.length === 0) warn(`${loc}.faqs`, "no FAQs");
  if (Array.isArray(p.claimsToVerify) && p.claimsToVerify.length === 0) warn(`${loc}.claimsToVerify`, "empty; list the specs the workshop must confirm");
}
for (const c of categories) if (Array.isArray(c.faqs) && c.faqs.length === 0) warn(`${files.categories}:${c.slug}.faqs`, "no FAQs");
for (const g of glossary) {
  const loc = `${files.glossary}:${g.slug}`;
  refs(g.relatedPostSlugs, postSlugs, `${loc}.relatedPostSlugs`, "post");
  refs(g.relatedProductSlugs, productSlugs, `${loc}.relatedProductSlugs`, "product");
}
reviews.forEach((r, i) => {
  if (r.product != null && !productSlugs.has(r.product)) err(`${files.reviews}[${i}].product`, `unknown product "${r.product}"`);
});
for (const { file, post: p } of posts) {
  if (path.basename(file, ".json") !== p.slug) err(file, `file name does not match slug "${p.slug}"`);
  refs(p.products, productSlugs, `${file}.products`, "product");
  if (!topicSlugs.has(p.topic)) err(`${file}.topic`, `topic "${p.topic}" is not in topics.json`);
  if (!authorSlugs.has(p.author)) err(`${file}.author`, `author "${p.author}" is not in authors.json`);
  if (p.reviewer != null && !authorSlugs.has(p.reviewer)) err(`${file}.reviewer`, `reviewer "${p.reviewer}" is not in authors.json`);
  if (p.ageMaxMonths != null && p.ageMinMonths != null && p.ageMaxMonths < p.ageMinMonths) err(file, "ageMaxMonths < ageMinMonths");
  if (typeof p.publishedAt === "string" && DATE_RE.test(p.publishedAt)) {
    const d = new Date(`${p.publishedAt}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== p.publishedAt) err(`${file}.publishedAt`, "not a real date");
    else if (p.publishedAt > TODAY) warn(`${file}.publishedAt`, `${p.publishedAt} is in the future`);
  }
  if (!Array.isArray(p.tldr) || p.tldr.length < 3 || p.tldr.length > 5)
    err(`${file}.tldr`, `needs 3–5 items, has ${Array.isArray(p.tldr) ? p.tldr.length : 0}`);
  if (!Array.isArray(p.faqs) || p.faqs.length === 0) err(`${file}.faqs`, "posts need FAQs");
  else if (p.faqs.length < 3) warn(`${file}.faqs`, `only ${p.faqs.length} FAQs`);
  if (!Array.isArray(p.sources) || p.sources.length === 0) err(`${file}.sources`, "posts need sources");
  else {
    const urls = new Map();
    p.sources.forEach((s, i) => {
      if (typeof s?.url !== "string") return;
      if (s.url.startsWith("http://")) warn(`${file}.sources[${i}]`, "use https");
      const k = s.url.replace(/\/+$/, "");
      if (urls.has(k)) warn(`${file}.sources[${i}]`, `duplicate source URL (also [${urls.get(k)}])`);
      else urls.set(k, i);
    });
  }
}

/* ------------------------------------------------------------------ text checks */

const PERSIAN_LETTER = /[ء-يپچژکگیآ]/;
/** Markdown fields: link schemes, directives, callouts, H1 and digits are checked strictly. */
const BODY_FIELDS = new Set([
  "categories.description", "products.description", "topics.description", "glossary.definition",
  "glossary.body", "pages.body", "posts.body",
]);
/** Fields holding identifiers or English text: no Persian-prose checks. */
const ID_FIELDS = new Set([
  "slug", "sku", "url", "sameAs", "accent", "illustration", "publishedAt", "swatch", "category", "related", "products",
  "relatedPostSlugs", "relatedProductSlugs", "topic", "author", "reviewer", "product", "availability", "format",
  "skills", "originalTerm", "siteNameEn", "instagram", "bale", "email", "phone", "enamadId", "publisher",
]);
/** Fields that are rendered as plain text (Markdown syntax would show raw). */
const PLAIN_FIELDS = new Set([
  "title", "name", "tagline", "excerpt", "seoTitle", "seoDescription", "summary", "subtitle", "question",
  "tldr", "highlights", "label", "value", "inTheBox", "term", "role", "authorName", "city", "childAge",
]);

/** Remove Markdown syntax whose Latin characters are legitimate (URLs, code, directives, list markers). */
function stripMarkdown(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/^[ \t]*:{2,3}[a-zA-Z-]*(\{[^}\n]*\})?[ \t]*$/gm, " ")
    .replace(/\]\(\s*[^)\s]+(?:\s+"[^"]*")?\s*\)/g, "]")
    .replace(/https?:\/\/[^\s)»\]]+/g, " ")
    .replace(/<[^>\n]+>/g, " ")
    .replace(/^([ \t]*(?:>[ \t]*)*)\d+[.)][ \t]+/gm, "$1")
    .replace(/^[ \t]*\|?[ \t:|-]+\|[ \t:|-]*$/gm, " ");
}

/** Latin digits are fine inside a Latin run (EN 71-3, Q190218, CHZ-LT-01); not between Persian words. */
function latinDigits(text) {
  const out = [];
  const LATIN_RUN = /[A-Za-z0-9 .,:;'"&/+\-–—_()%°×x[\]]/;
  for (const m of text.matchAll(/[0-9]+/g)) {
    let a = m.index;
    let b = m.index + m[0].length;
    while (a > 0 && LATIN_RUN.test(text[a - 1]) && text[a - 1] !== "\n") a--;
    while (b < text.length && LATIN_RUN.test(text[b]) && text[b] !== "\n") b++;
    const run = text.slice(a, b);
    if (/[A-Za-z]{1,}/.test(run.replace(/(^|[^A-Za-z])x(?=[^A-Za-z]|$)/g, "$1"))) {
      out.push({ index: m.index, digits: m[0], ok: true, run: run.trim() });
    } else out.push({ index: m.index, digits: m[0], ok: false });
  }
  return out;
}

const latinContexts = new Map();

function checkText(s, loc, field, group) {
  const isBody = BODY_FIELDS.has(`${group}.${field}`);
  // Orthography (all string values).
  for (const [rx, msg] of [
    [/ي/g, "Arabic yeh ي (use Persian ی U+06CC)"],
    [/ك/g, "Arabic kaf ك (use Persian ک U+06A9)"],
    [/ى/g, "Arabic alef maksura ى (use Persian ی)"],
    [/ـ/g, "kashida ـ"],
    [/[٠-٩]/g, "Arabic-Indic digit (use Persian ۰–۹)"],
  ]) {
    for (const m of s.matchAll(rx)) err(loc, `${msg} at ${snip(s, m.index, 1)}`);
  }
  if (/ۀ/.test(s)) warn(loc, "uses ۀ (U+06C0); the content uses ه + ٔ (هٔ) — keep one form");
  for (const m of s.matchAll(/‌{2,}|‌(?=\s)|(?<=\s)‌|^‌|‌$/g))
    warn(loc, `stray ZWNJ at ${snip(s, m.index, 1)}`);
  for (const m of s.matchAll(/[‌](?=[A-Za-z0-9۰-۹.,،؛:!؟?)(«»\-])|(?<=[A-Za-z0-9۰-۹.,،؛:!؟?)(«»\-])‌/g))
    warn(loc, `ZWNJ next to a non-letter at ${snip(s, m.index, 1)}`);
  if (/[‏‎‪-‮⁦-⁩]/.test(s)) warn(loc, "contains bidi control characters");
  if (/ /.test(s)) warn(loc, "contains a no-break space");

  if (ID_FIELDS.has(field) || !PERSIAN_LETTER.test(s)) return;

  // Persian prose.
  const prose = isBody ? stripMarkdown(s) : s.replace(/https?:\/\/\S+/g, " ");
  for (const d of latinDigits(prose)) {
    if (d.ok) {
      const k = d.run;
      latinContexts.set(k, (latinContexts.get(k) ?? 0) + 1);
    } else (isBody ? err : warn)(loc, `Latin digits "${d.digits}" in Persian prose at ${snip(prose, d.index, d.digits.length)}`);
  }
  for (const m of prose.matchAll(/(^|[\s«(])(ن?می) (?=[آ-ی])/g))
    warn(loc, `«${m[2]}» needs a ZWNJ, not a space, at ${snip(prose, m.index + m[1].length, m[2].length + 1)}`);
  for (const m of prose.matchAll(/[آ-ی] (ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان|ترین|ترها)(?=[\s،.؛:!؟»)]|$)/g))
    warn(loc, `«${m[1]}» should attach with a ZWNJ at ${snip(prose, m.index, m[0].length)}`);
  for (const m of prose.matchAll(/ه (ای|ی)(?=[\s،.؛:!؟»)]|$)/g))
    warn(loc, `«ه ${m[1]}» should be «ه‌${m[1]}»/«هٔ» at ${snip(prose, m.index, m[0].length)}`);
  for (const m of prose.matchAll(/(?<=[آ-ی][»)]?)\s*([?;]|,(?!\d))/g))
    warn(loc, `Latin punctuation "${m[1]}" after Persian text (use ؟ ، ؛) at ${snip(prose, m.index, m[0].length)}`);
  for (const m of prose.matchAll(/[^\s\n] {2,}(?=\S)/g)) warn(loc, `double space at ${snip(prose, m.index, 3)}`);

  if (!isBody && PLAIN_FIELDS.has(field)) {
    if (/\]\([^)]+\)/.test(s)) warn(loc, "Markdown link in a plain-text field");
    if (/\*\*[^*]+\*\*/.test(s)) warn(loc, "Markdown bold in a plain-text field");
  }
  if (!isBody && /\]\(([a-z]+):/.test(s) && !PLAIN_FIELDS.has(field)) checkLinks(s, loc);

  // Claims that must never be invented (manual review).
  for (const m of s.matchAll(
    /(استاندارد ملی|نشان استاندارد|گواهی‌?نامه|گواهی [A-Z]|دارای (?:گواهی|استاندارد|تأییدیه)|تأییدیهٔ|مورد تأیید|آزمایشگاه|جایزه|سال تأسیس|تأسیس(?:‌شده)? در|هزاران (?:مشتری|خانواده)|[۰-۹0-9]+ ?(?:هزار )?(?:مشتری|خانواده)|رضایت [۰-۹0-9]+)/g,
  ))
    note(loc, `claim to confirm: ${snip(s, m.index, m[0].length, 40)}`);
}

function checkLinks(md, loc) {
  const LINK = /(!?)\[((?:[^[\]\n]|\[[^\]\n]*\])*)\]\(\s*<?([^)\s>]*)>?(?:\s+["'][^"'\n]*["'])?\s*\)/g;
  for (const m of md.matchAll(LINK)) {
    const [, bang, text, target] = m;
    const at = snip(md, m.index, m[0].length, 0);
    if (bang) warn(loc, `image syntax in body: ${at}`);
    if (!text.trim()) err(loc, `link with empty text: ${at}`);
    if (!target) {
      err(loc, `link without target: ${at}`);
      continue;
    }
    const scheme = /^([a-z]+):/.exec(target)?.[1];
    if (scheme === "http" || scheme === "https") {
      if (!URL_RE.test(target)) err(loc, `malformed URL: ${at}`);
      if (scheme === "http") warn(loc, `http link (use https): ${at}`);
      continue;
    }
    if (scheme === "mailto" || scheme === "tel" || target.startsWith("#")) continue;
    if (!scheme || !LINK_SCHEMES.includes(scheme)) {
      err(loc, `unsupported link target "${target}" (use product:/category:/post:/topic:/term:/page:/https:)`);
      continue;
    }
    const [ref] = target.slice(scheme.length + 1).split("#");
    if (!exists[scheme].has(ref)) err(loc, `link to unknown ${scheme} "${ref}"`);
  }
  for (const m of md.matchAll(/\]\[[^\]]*\]/g)) warn(loc, `reference-style link ${snip(md, m.index, m[0].length)}`);
  for (const m of md.matchAll(/(?<!\]\()(?<![a-z])(product|category|post|topic|term|page):[a-z0-9-]+(?![^(]*\))/g)) {
    // a bare scheme reference outside link syntax
    const before = md.slice(Math.max(0, m.index - 2), m.index);
    if (before !== "](") warn(loc, `bare "${m[0]}" outside a link`);
  }
}

function checkMarkdown(md, loc, kind) {
  checkLinks(md, loc);
  const lines = md.split("\n");
  let inSteps = -1;
  let prevLevel = 1;
  let productCards = 0;
  const headings = new Map();
  const embedded = new Set();
  lines.forEach((line, i) => {
    const at = `${loc} (line ${i + 1})`;
    if (/^ {0,3}#(\s|$)/.test(line)) err(at, `H1 in body: ${JSON.stringify(line.slice(0, 60))}`);
    const h = /^ {0,3}(#{2,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) {
      const level = h[1].length;
      if (level > prevLevel + 1) warn(at, `heading jumps from H${prevLevel} to H${level}`);
      prevLevel = level;
      const key = h[2].replace(/[*_`]/g, "").trim();
      if (headings.has(key)) warn(at, `duplicate heading «${key}» (anchor collision)`);
      headings.set(key, i);
      if (!key) err(at, "empty heading");
    }
    const callout = /^\s*>\s*\[!([A-Za-z]+)\]/.exec(line);
    if (callout && !CALLOUTS.includes(callout[1])) err(at, `unknown callout [!${callout[1]}] (use ${CALLOUTS.join(", ")})`);
    const d = /^\s*(:{2,3})([a-zA-Z-]*)(\{([^}]*)\})?\s*$/.exec(line);
    if (d) {
      const [, colons, name, , rawAttrs = ""] = d;
      const attrs = Object.fromEntries([...rawAttrs.matchAll(/([a-zA-Z]+)="([^"]*)"/g)].map((a) => [a[1], a[2]]));
      const leftover = rawAttrs.replace(/([a-zA-Z]+)="([^"]*)"/g, "").trim();
      if (leftover) err(at, `malformed directive attributes: ${JSON.stringify(rawAttrs)}`);
      if (colons === ":::" && name === "") {
        if (inSteps < 0) err(at, "stray ::: closing fence");
        inSteps = -1;
      } else if (colons === ":::" && name === "steps") {
        if (inSteps >= 0) err(at, ":::steps opened inside another :::steps");
        inSteps = i;
      } else if (colons === "::" && name === "product") {
        productCards++;
        if (!attrs.slug) err(at, '::product needs slug="…"');
        else if (!productSlugs.has(attrs.slug)) err(at, `::product unknown slug "${attrs.slug}"`);
        else embedded.add(attrs.slug);
      } else if (colons === "::" && name === "products") {
        const list = (attrs.slugs ?? "").split(",").map((x) => x.trim()).filter(Boolean);
        if (!list.length) err(at, '::products needs slugs="a,b"');
        if (list.length && (list.length < 2 || list.length > 4)) warn(at, `::products has ${list.length} items (2–4)`);
        for (const sl of list) {
          if (!productSlugs.has(sl)) err(at, `::products unknown slug "${sl}"`);
          else embedded.add(sl);
        }
      } else if (colons === "::" && name === "illustration") {
        if (!attrs.name) err(at, '::illustration needs name="…"');
        else if (!ILLUSTRATION_KEYS.includes(attrs.name)) err(at, `::illustration unknown name "${attrs.name}"`);
        if (attrs.caption) checkText(attrs.caption, `${at} caption`, "caption", "directive");
      } else err(at, `unknown directive "${colons}${name}"`);
    } else if (/::(product|products|illustration)\{/.test(line) || /^\s*:::\s*\S/.test(line)) {
      err(at, `directive must stand alone on its line: ${JSON.stringify(line.slice(0, 60))}`);
    }
    if (inSteps >= 0 && i > inSteps && line.trim() && !d && !/^\s*(\d+\.|[-*]|>)?\s/.test(line) && !/^\s*\d+\./.test(line))
      warn(at, "non-list line inside :::steps");
  });
  if (inSteps >= 0) err(`${loc} (line ${inSteps + 1})`, ":::steps is never closed");
  if (kind === "post") {
    if (!headings.size) warn(loc, "body has no H2 headings");
    if (productCards > 3) warn(loc, `${productCards} ::product cards (1–3 per article)`);
  }

  if (STRICT && kind === "post") {
    for (let i = 0; i < lines.length; i++) {
      const h2 = /^##\s+(.*)$/.exec(lines[i]);
      if (!h2) continue;
      if (!/؟\s*$/.test(h2[1])) warn(`${loc} (line ${i + 1})`, `[strict] H2 is not a question: «${h2[1]}»`);
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      const para = [];
      while (j < lines.length && lines[j].trim() && !/^(#|>|::|\||\s*[-*]\s|\s*\d+\.)/.test(lines[j])) para.push(lines[j++]);
      const words = wordCount(para.join(" "));
      if (words < 40 || words > 60) warn(`${loc} (line ${i + 1})`, `[strict] answer paragraph after H2 has ${words} words (40–60)`);
    }
  }
  return embedded;
}

function wordCount(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/^\s*::.*$/gm, " ")
    .replace(/[#>*_`|[\]()!:-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Walk every string value of an entity. */
function walk(value, loc, group, field = "") {
  if (typeof value === "string") return checkText(value, loc, field, group);
  if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${loc}[${i}]`, group, field));
  if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) walk(v, `${loc}.${k}`, group, /^\d+$/.test(k) ? field : k);
}

function seo(x, loc) {
  const len = (s) => (typeof s === "string" ? [...s].length : 0);
  if (len(x.seoTitle) > 70) err(`${loc}.seoTitle`, `${len(x.seoTitle)} chars (max 70)`);
  if (len(x.seoDescription) > 170) err(`${loc}.seoDescription`, `${len(x.seoDescription)} chars (max 170)`);
  if (typeof x.seoTitle === "string" && len(x.seoTitle) < 15) warn(`${loc}.seoTitle`, `only ${len(x.seoTitle)} chars`);
  if (typeof x.seoDescription === "string" && len(x.seoDescription) < 70)
    warn(`${loc}.seoDescription`, `only ${len(x.seoDescription)} chars`);
}

function faqHygiene(list, loc) {
  if (!Array.isArray(list)) return;
  const seen = new Set();
  list.forEach((f, i) => {
    if (typeof f?.question !== "string") return;
    if (!/[؟?]\s*$/.test(f.question)) warn(`${loc}[${i}].question`, "does not end with ؟");
    if (seen.has(f.question.trim())) warn(`${loc}[${i}].question`, "duplicate question");
    seen.add(f.question.trim());
  });
}

const groups = [
  ["categories", categories, (x) => `${files.categories}:${x.slug}`, "description"],
  ["products", products, (x) => `${files.products}:${x.slug}`, "description"],
  ["topics", topics, (x) => `${files.topics}:${x.slug}`, "description"],
  ["glossary", glossary, (x) => `${files.glossary}:${x.slug}`, "definition", "body"],
  ["pages", pages, (x) => `${files.pages}:${x.slug}`, "body"],
  ["authors", authors, (x) => `${files.authors}:${x.slug}`],
  ["reviews", reviews, (x) => `${files.reviews}:${x.product ?? x.authorName}`],
];
for (const [group, list, locOf, ...mdFields] of groups) {
  for (const x of list) {
    const loc = locOf(x);
    walk(x, loc, group);
    for (const f of mdFields) if (typeof x[f] === "string") checkMarkdown(x[f], `${loc}.${f}`, group);
    if ("seoTitle" in x || "seoDescription" in x) seo(x, loc);
    faqHygiene(x.faqs, `${loc}.faqs`);
  }
}
if (data.faqs && typeName(data.faqs) === "object") {
  walk(data.faqs, files.faqs, "faqs");
  for (const k of Object.keys(data.faqs)) faqHygiene(data.faqs[k], `${files.faqs}.${k}`);
}
if (data.settings && typeName(data.settings) === "object") walk(data.settings, files.settings, "settings");
for (const { file, post } of posts) {
  walk(post, file, "posts");
  seo(post, file);
  faqHygiene(post.faqs, `${file}.faqs`);
  if (typeof post.body === "string") {
    const embedded = checkMarkdown(post.body, `${file}.body`, "post");
    for (const s of embedded)
      if (Array.isArray(post.products) && !post.products.includes(s))
        warn(`${file}.products`, `body embeds "${s}" but products[] does not list it`);
    for (const m of post.body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
      const u = m[1].replace(/\/+$/, "");
      if (Array.isArray(post.sources) && !post.sources.some((s) => s?.url?.replace(/\/+$/, "") === u))
        warn(`${file}.body`, `external link not listed in sources: ${m[1]}`);
    }
  }
}

/* Word-count targets from src/db/seed/types.ts. */
for (const c of categories) {
  const n = wordCount(c.description ?? "");
  if (n < 120 || n > 250) warn(`${files.categories}:${c.slug}.description`, `${n} words (target 120–250)`);
}
for (const p of products) {
  const n = wordCount(p.description ?? "");
  if (n < 250 || n > 450) warn(`${files.products}:${p.slug}.description`, `${n} words (target 250–450)`);
  const s = wordCount(p.summary ?? "");
  if (s > 40) warn(`${files.products}:${p.slug}.summary`, `${s} words (max 40)`);
}

/* ------------------------------------------------------------------ report */

const counted = `${categories.length} categories, ${products.length} products, ${postList.length} posts, ` +
  `${glossary.length} terms, ${topics.length} topics, ${authors.length} authors, ${pages.length} pages, ${reviews.length} reviews`;
console.log(`Content QA · ${path.relative(ROOT, DIR) || DIR} · ${counted}${STRICT ? " · strict" : ""}`);
if (VERBOSE && latinContexts.size) {
  console.log(`\nLatin digit runs allowed in prose (${latinContexts.size}):`);
  for (const [k, n] of [...latinContexts].sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ${JSON.stringify(k)}`);
}
if (notes.length) {
  console.log(`\nManual review (${notes.length}) — brand claims the workshop must be able to back up:`);
  for (const n of VERBOSE ? notes : notes.slice(0, 10)) console.log(`  · ${n}`);
  if (!VERBOSE && notes.length > 10) console.log(`  … ${notes.length - 10} more (--verbose)`);
}
console.log(`\nWarnings (${warnings.length})`);
for (const w of warnings) console.log(`  ⚠ ${w}`);
console.log(`\nErrors (${errors.length})`);
for (const e of errors) console.log(`  ✖ ${e}`);
console.log(errors.length ? `\n✖ ${errors.length} error(s), ${warnings.length} warning(s)` : `\n✔ no errors, ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
