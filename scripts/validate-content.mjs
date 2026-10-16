#!/usr/bin/env node
/*
 * Content QA for /seed/content (no dependencies).
 *
 *   node scripts/validate-content.mjs            errors + warnings, exit 1 on errors
 *   node scripts/validate-content.mjs --strict   also checks the AEO style rules
 *                                                (H2 = question, 40–60-word answer paragraph)
 *   node scripts/validate-content.mjs --verbose  also lists the manual-review notes in full
 *   node scripts/validate-content.mjs --check-urls  also fetches every external URL (network)
 *
 * Checks: JSON parses; fields and types match src/db/seed/types.ts (no unknown keys);
 * slugs unique and kebab-case; the fixed catalog (categories, products, posts, topics,
 * authors, glossary slugs from docs/CONTENT-PLAN.md §۲); every cross-reference
 * (product.category, related, post.products, glossary related*, review.product, post
 * topic/author/reviewer); Markdown link schemes and ::directives; callout markers;
 * Persian orthography (no Arabic yeh/kaf/alef maksura, no kashida, no Arabic-Indic digits, no
 * Latin digits in Persian prose, ZWNJ hygiene); no H1 in bodies; SEO lengths; tldr 3–5;
 * post faqs and http(s) sources. rooms.json (SeedRoom) is checked when present; other JSON
 * files in the folder get the text and product-reference checks only.
 *
 * Also: stable heading anchors (`## سؤال؟ {#ascii-id}` on every H2/H3, unique per body, and
 * every `post:slug#id` deep link must hit one, SEO.md §4.4); one primaryQuery per URL across
 * rooms, posts and products (SEO.md §1.10); aboutEntities are glossary slugs; faqs.json sections
 * (/faq anchors + `age:<hub>` keys, src/db/seed/load.ts); age-hubs.json against AGE_HUBS in
 * src/lib/ages.ts; the trust/brand pages SEO.md §1.6 requires; one Q&A per URL.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.resolve(process.env.SEED_DIR ?? path.join(ROOT, "seed", "content"));
const PLAN = path.join(ROOT, "docs", "CONTENT-PLAN.md");
const STRICT = process.argv.includes("--strict");
const VERBOSE = process.argv.includes("--verbose");
const CHECK_URLS = process.argv.includes("--check-urls");
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

/* ------------------------------------------------------------------ types.ts → runtime specs */

/*
 * The field lists, optionality and base types come from src/db/seed/types.ts itself, so a
 * field added there is accepted here without editing this script. A small parser covers the
 * TypeScript used in that file: object literals, `T[]`, `Record<string, T>`, string-literal
 * unions, `| null`, and references to other exported types.
 */

const typeName = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

function splitTop(s, sep) {
  const out = [];
  let depth = 0;
  let quote = null;
  let cur = "";
  for (const c of s) {
    if (quote) {
      cur += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if ("{<([".includes(c)) depth++;
    else if ("}>)]".includes(c)) depth--;
    if (depth === 0 && c === sep) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

function parseTypesFile(file) {
  const src = fs
    .readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
  const out = {};
  const head = /export\s+type\s+(\w+)\s*=\s*/g;
  let m;
  while ((m = head.exec(src))) {
    let depth = 0;
    let j = head.lastIndex;
    for (; j < src.length; j++) {
      const c = src[j];
      if ("{<([".includes(c)) depth++;
      else if ("}>)]".includes(c)) depth--;
      else if (c === ";" && depth === 0) break;
      else if (depth === 0 && /^\n\s*export\s/.test(src.slice(j, j + 12))) break;
    }
    out[m[1]] = src.slice(head.lastIndex, j).trim();
    head.lastIndex = j + 1;
  }
  return out;
}

/** A spec is (value, loc, report) → void; `report(loc, msg)` collects type errors. */
const isLiteralUnion = (expr) => splitTop(expr.replace(/^\|/, ""), "|").every((p) => /^"[^"]*"$/.test(p));

function compileType(expr, types, memo = {}) {
  expr = expr.trim().replace(/^\|\s*/, "");
  while (expr.startsWith("(") && expr.endsWith(")")) expr = expr.slice(1, -1).trim();
  const parts = splitTop(expr, "|");
  if (parts.length > 1) {
    if (parts.every((p) => /^"[^"]*"$/.test(p))) return literalSpec(parts.map((p) => JSON.parse(p)));
    const specs = parts.map((p) => compileType(p, types, memo));
    return (v, loc, report) => {
      const tries = specs.map((sp) => {
        const probs = [];
        sp(v, loc, (l, msg) => probs.push([l, msg]));
        return probs;
      });
      if (tries.some((p) => p.length === 0)) return;
      const best = tries.sort((a, b) => a.length - b.length)[0];
      best.forEach(([l, msg]) => report(l, msg));
    };
  }
  if (expr.endsWith("[]")) {
    const item = compileType(expr.slice(0, -2), types, memo);
    return (v, loc, report) => {
      if (!Array.isArray(v)) return report(loc, `expected array, got ${typeName(v)}`);
      v.forEach((x, i) => item(x, `${loc}[${i}]`, report));
    };
  }
  if (expr.startsWith("{")) return objectSpec(expr.slice(1, -1), types, memo);
  if (expr.startsWith("Record<")) {
    const [, valueType] = splitTop(expr.slice(7, -1), ",");
    const value = compileType(valueType, types, memo);
    return (v, loc, report) => {
      if (typeName(v) !== "object") return report(loc, `expected object, got ${typeName(v)}`);
      for (const [k, x] of Object.entries(v)) value(x, `${loc}.${k}`, report);
    };
  }
  if (expr === "string")
    return (v, loc, report) => {
      if (typeof v !== "string") return report(loc, `expected string, got ${typeName(v)}`);
      if (!v.trim()) report(loc, "empty string");
    };
  if (expr === "number")
    return (v, loc, report) => {
      if (typeof v !== "number" || !Number.isFinite(v)) report(loc, `expected number, got ${typeName(v)}`);
    };
  if (expr === "boolean")
    return (v, loc, report) => {
      if (typeof v !== "boolean") report(loc, `expected boolean, got ${typeName(v)}`);
    };
  if (expr === "null")
    return (v, loc, report) => {
      if (v !== null) report(loc, `expected null, got ${typeName(v)}`);
    };
  if (expr === "unknown" || expr === "any") return () => {};
  if (/^"[^"]*"$/.test(expr)) return literalSpec([JSON.parse(expr)]);
  if (types[expr] !== undefined) {
    if (!memo[expr]) {
      memo[expr] = (...a) => memo[`${expr}:compiled`](...a);
      memo[`${expr}:compiled`] = compileType(types[expr], types, memo);
    }
    return memo[expr];
  }
  throw new Error(`validate-content: unsupported type expression in types.ts: ${expr}`);
}

function literalSpec(values) {
  return (v, loc, report) => {
    if (!values.includes(v)) report(loc, `expected one of ${values.join(" | ")}, got ${JSON.stringify(v)}`);
  };
}

function objectSpec(body, types, memo) {
  const fields = splitTop(body, ";").map((f) => {
    const m = /^(\w+)(\?)?\s*:\s*([\s\S]+?)[,;]?$/.exec(f);
    if (!m) throw new Error(`validate-content: cannot parse field "${f}" in types.ts`);
    return { name: m[1], optional: !!m[2], spec: compileType(m[3], types, memo) };
  });
  return (v, loc, report) => {
    if (typeName(v) !== "object") return report(loc, `expected object, got ${typeName(v)}`);
    for (const f of fields) {
      if (!(f.name in v)) {
        if (!f.optional) report(loc, `missing required field "${f.name}"`);
        continue;
      }
      if (v[f.name] === null && f.optional) {
        report(`${loc}.${f.name}`, "optional field is null; omit it instead");
        continue;
      }
      const before = [];
      f.spec(v[f.name], `${loc}.${f.name}`, (l, msg) => before.push([l, msg]));
      before.forEach(([l, msg]) => report(l, msg));
      if (!before.length && REFINE[f.name]) REFINE[f.name](v[f.name], `${loc}.${f.name}`, report);
    }
    const known = new Set(fields.map((f) => f.name));
    for (const k of Object.keys(v)) if (!known.has(k)) report(loc, `unknown field "${k}" (not in src/db/seed/types.ts)`);
  };
}

/* Value rules types.ts cannot express, applied by field name after the base type passes. */
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_RE = /^https?:\/\/[^\s]+$/;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const rx = (re, what) => (v, loc, report) => {
  if (typeof v === "string" && !re.test(v)) report(loc, `expected ${what}, got ${JSON.stringify(v)}`);
};
const int = (min = -Infinity, max = Infinity) => (v, loc, report) => {
  if (typeof v !== "number") return;
  if (!Number.isInteger(v)) report(loc, `expected an integer, got ${v}`);
  else if (v < min || v > max) report(loc, `expected ${min}…${max}, got ${v}`);
};
const positive = (v, loc, report) => {
  if (typeof v === "number" && v <= 0) report(loc, `expected > 0, got ${v}`);
};
const each = (spec) => (v, loc, report) => Array.isArray(v) && v.forEach((x, i) => spec(x, `${loc}[${i}]`, report));
const kebab = rx(KEBAB, "kebab-case slug");
const isUrl = rx(URL_RE, "http(s) URL");
const isDate = rx(DATE_RE, "YYYY-MM-DD");
const REFINE = {
  slug: kebab, product: kebab, related: each(kebab), products: each(kebab), relatedPostSlugs: each(kebab),
  relatedProductSlugs: each(kebab), pillarPostSlug: kebab, aboutEntities: each(kebab), anchor: kebab,
  url: isUrl, sameAs: each(isUrl),
  accent: (v, loc, report) => literalSpec(ACCENT_KEYS)(v, loc, report),
  swatch: rx(HEX_RE, "#RRGGBB"),
  publishedAt: isDate, updatedAt: isDate,
  price: int(1), compareAtPrice: int(1), stock: int(0), leadTimeDays: int(0), warrantyMonths: int(0),
  sortOrder: int(), ageMinMonths: int(0, 216), ageMaxMonths: int(0, 216), rating: int(1, 5), assemblyMinutes: int(1),
  widthCm: positive, heightCm: positive, depthCm: positive, weightKg: positive, maxLoadKg: positive, floorAreaM2: positive,
};

/* ------------------------------------------------------------------ vocabulary */

const TYPES_FILE = path.join(ROOT, "src", "db", "seed", "types.ts");
const TYPES = parseTypesFile(TYPES_FILE);
const literals = (name, fallback) =>
  TYPES[name] && isLiteralUnion(TYPES[name])
    ? splitTop(TYPES[name].replace(/^\|/, ""), "|").map((p) => JSON.parse(p))
    : fallback;
const TOPIC_KEYS = literals("TopicKey", []);
const AUTHOR_KEYS = literals("AuthorKey", []);
const ILLUSTRATION_KEYS = literals("IllustrationKey", []);
/** Accent pairs in docs/DESIGN.md (`--color-{key}-tint` / `-ink`). */
const ACCENT_KEYS = ["terracotta", "wood", "sage", "mustard", "sky", "plum", "mint", "cream"];
const CALLOUTS = ["TIP", "NOTE", "WARNING", "WORKSHOP", "EXPERT", "MYTH"];
const LINK_SCHEMES = ["product", "category", "post", "topic", "term", "page"];

/** The fixed catalog (slug → category, illustration, name). */
const CATALOG_CATEGORIES = ["climbing", "learning-towers", "furniture", "art", "toys", "room-sets"];
const CATALOG_PRODUCTS = {
  "learning-tower": ["learning-towers", "learning-tower", "برج یادگیری مونته\u200Cسوری"],
  "pikler-triangle": ["climbing", "pikler-triangle", "مثلث پیکلر با رمپ دوطرفه"],
  "pikler-arch": ["climbing", "pikler-arch", "آرک پیکلر (راکر)"],
  "swedish-ladder": ["climbing", "swedish-ladder", "نردبان سوئدی کودک"],
  "climbing-hex-panels": ["climbing", "climbing-hex", "پنل\u200Cهای شش\u200Cضلعی صعود (ست ۳ تایی)"],
  "balance-board": ["climbing", "balance-board", "تخته تعادل والدورف"],
  "front-facing-bookshelf": ["furniture", "front-facing-bookshelf", "کتابخانهٔ دیواری روبه\u200Cرو"],
  "kids-table-chair": ["furniture", "kids-table-chair", "میز و صندلی کودک"],
  "montessori-shelf": ["furniture", "montessori-shelf", "قفسهٔ مونته\u200Cسوری اسباب\u200Cبازی"],
  "wall-art-roll": ["art", "wall-art-roll", "رول نقاشی دیواری"],
  "rainbow-stacker": ["toys", "rainbow-stacker", "رنگین\u200Cکمان چوبی"],
  "duck-pull-toy": ["toys", "duck-pull-toy", "اردک چرخ\u200Cدار چوبی"],
  "wooden-blocks": ["toys", "wooden-blocks", "مکعب\u200Cهای ساختنی چوبی"],
  "montessori-room-set": ["room-sets", "room-set", "پک اتاق مونته\u200Cسوری"],
};
const CATALOG_POSTS = [
  "learning-tower-guide", "pikler-triangle-guide", "montessori-at-home-guide", "montessori-room-setup",
  "montessori-vs-waldorf-vs-pikler", "gross-motor-milestones-by-age", "wooden-sismooni-checklist",
  "wooden-toy-safety-guide", "child-drawing-stages", "birthday-gift-guide-by-age", "yalda-gift-guide",
];
/** Brand and trust pages every footer and trust strip links to (SEO.md §1.6). */
const REQUIRED_PAGES = [
  "about", "workshop", "editorial-policy", "shipping", "returns", "warranty", "safety", "trust", "installments",
  "contact", "privacy", "terms",
];
/** /faq sections and their #anchors (SEO.md §1.6); "age:<hub>" keys feed the age hubs. */
const FAQ_SECTIONS = ["buying", "shipping", "installments", "returns", "safety"];

/** Age hubs and their in-page anchors, read from src/lib/ages.ts (AGE_HUBS). */
const AGES_FILE = path.join(ROOT, "src", "lib", "ages.ts");
const AGE_HUBS = (() => {
  if (!fs.existsSync(AGES_FILE)) return null;
  const src = fs.readFileSync(AGES_FILE, "utf8");
  const start = src.indexOf("export const AGE_HUBS");
  if (start < 0) return null;
  const block = src.slice(start, src.indexOf("];", start));
  const hubs = new Map();
  for (const hub of block.split(/\n {2}\{\n/).slice(1)) {
    const slug = /slug:\s*"([^"]+)"/.exec(hub)?.[1];
    if (slug) hubs.set(slug, [...hub.matchAll(/anchor:\s*"([^"]+)"/g)].map((m) => m[1]));
  }
  return hubs.size ? hubs : null;
})();

/* ------------------------------------------------------------------ load */

function load(rel, { optional = false } = {}) {
  const full = path.join(DIR, rel);
  if (!fs.existsSync(full)) {
    if (!optional) err(rel, "file is missing");
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

/**
 * age-hubs.json has no type in types.ts (load.ts stores it in settings.age_hubs as unknown[]);
 * this is the contract the age-hub pages read.
 */
const AGE_HUB_SHAPE =
  "{ slug: string; intro: string; sections: { anchor: string; milestone: string; tips: string[] }[]; " +
  "sources: { title: string; url: string; publisher: string }[] }[]";

/** File → shape. `faqs.json`, `settings.json` and `age-hubs.json` follow src/db/seed/load.ts. */
const FILES = {
  categories: ["categories.json", "SeedCategory[]"],
  products: ["products.json", "SeedProduct[]"],
  glossary: ["glossary.json", "SeedGlossaryTerm[]"],
  topics: ["topics.json", "SeedTopic[]"],
  authors: ["authors.json", "SeedAuthor[]"],
  pages: ["pages.json", "SeedPage[]"],
  faqs: ["faqs.json", "Record<string, SeedFaq[]>"],
  reviews: ["reviews.json", "SeedReview[]"],
  settings: ["settings.json", "Record<string, unknown>"],
  rooms: ["rooms.json", "SeedRoom[]", { optional: true }],
  ageHubs: ["age-hubs.json", AGE_HUB_SHAPE, { optional: true }],
};
const files = Object.fromEntries(Object.entries(FILES).map(([k, [f]]) => [k, f]));
const data = {};
for (const [key, [file, shape, opts]] of Object.entries(FILES)) {
  data[key] = load(file, opts);
  if (data[key] === undefined) continue;
  const isList = shape.endsWith("[]");
  let spec;
  try {
    spec = compileType(isList ? shape.slice(0, -2) : shape, TYPES);
  } catch (e) {
    err(file, `${e.message}; shape not checked`);
    continue;
  }
  if (!isList) spec(data[key], file, err);
  else if (!Array.isArray(data[key])) err(file, `expected a top-level array, got ${typeName(data[key])}`);
  else data[key].forEach((x, i) => spec(x, `${file}[${i}${x?.slug ? `:${x.slug}` : ""}]`, err));
}
const postFiles = fs.existsSync(path.join(DIR, "posts"))
  ? fs.readdirSync(path.join(DIR, "posts")).filter((f) => f.endsWith(".json")).sort()
  : (err("posts/", "directory is missing"), []);
const posts = postFiles.map((f) => ({ file: `posts/${f}`, post: load(`posts/${f}`) })).filter((p) => p.post);
try {
  const postSpec = compileType("SeedPost", TYPES);
  for (const { file, post } of posts) postSpec(post, file, err);
} catch (e) {
  err("posts/", `${e.message}; shape not checked`);
}
/* Seed files with no type in types.ts: only the text and reference checks below. */
const extraFiles = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".json") && !Object.values(files).includes(f))
  .map((f) => ({ file: f, value: load(f) }))
  .filter((x) => x.value !== undefined);

const listOf = (key) => (Array.isArray(data[key]) ? data[key].filter((x) => typeName(x) === "object") : []);
const categories = listOf("categories");
const products = listOf("products");
const glossary = listOf("glossary");
const topics = listOf("topics");
const authors = listOf("authors");
const pages = listOf("pages");
const reviews = listOf("reviews");
const rooms = listOf("rooms");
const ageHubs = listOf("ageHubs");
if (data.settings !== undefined && typeName(data.settings) === "object") {
  const st = data.settings;
  for (const k of ["siteName", "tagline", "description"]) if (!(k in st)) warn(files.settings, `missing "${k}"`);
  for (const k of ["instagram", "bale"]) if (st[k] != null) isUrl(st[k], `${files.settings}.${k}`, err);
  if (st.email != null) rx(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email")(st.email, `${files.settings}.email`, err);
  if (st.freeShippingThreshold != null) int(0)(st.freeShippingThreshold, `${files.settings}.freeShippingThreshold`, err);
}

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
for (const s of REQUIRED_PAGES) if (!pageSlugs.has(s)) err(files.pages, `required page "${s}" is missing (SEO.md §1.6)`);

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

/* Heading anchors: `## سؤال؟ {#ascii-id}` (SEO.md §4.4). Collected up front so deep links resolve. */
const ANCHOR_RE = /\s*\{#([^}\n]*)\}\s*$/;
/** Ids the article template already uses for its own sections (SEO.md §4.3). */
const RESERVED_ANCHORS = new Set(["tldr", "tldr-h", "faq", "sources"]);
const headingAnchors = (md) =>
  new Set(
    (typeof md === "string" ? md : "")
      .split("\n")
      .map((l) => /^ {0,3}#{2,6}\s.*?\{#([a-z0-9-]+)\}\s*$/.exec(l)?.[1])
      .filter(Boolean),
  );
const ANCHORS = {
  post: new Map(postList.map((p) => [p.slug, headingAnchors(p.body)])),
  page: new Map(pages.map((p) => [p.slug, headingAnchors(p.body)])),
  product: new Map(products.map((p) => [p.slug, headingAnchors(p.description)])),
  category: new Map(categories.map((c) => [c.slug, headingAnchors(c.description)])),
  topic: new Map(topics.map((t) => [t.slug, headingAnchors(t.description)])),
  term: new Map(glossary.map((g) => [g.slug, headingAnchors(g.body)])),
};

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
  if (g.pillarPostSlug != null && !postSlugs.has(g.pillarPostSlug)) err(`${loc}.pillarPostSlug`, `unknown post "${g.pillarPostSlug}"`);
}
/** Room-scene slots (docs/DESIGN.md, room-slots.ts). */
const ROOM_SLOTS = ["wall-start", "wall-mid", "wall-end", "floor-start", "floor-mid", "floor-end", "by-door", "kitchen"];
unique(rooms, "slug", files.rooms);
for (const r of rooms) {
  const loc = `${files.rooms}:${r.slug}`;
  (Array.isArray(r.items) ? r.items : []).forEach((it, i) => {
    if (typeof it?.product === "string" && !productSlugs.has(it.product)) err(`${loc}.items[${i}].product`, `unknown product "${it.product}"`);
    if (typeof it?.slot === "string" && !ROOM_SLOTS.includes(it.slot)) warn(`${loc}.items[${i}].slot`, `unknown slot "${it.slot}"`);
  });
  if (typeof r.description === "string") {
    const n = wordCount(r.description);
    if (n < 300 || n > 500) warn(`${loc}.description`, `${n} words (target 300–500)`);
  } else warn(`${loc}.description`, "no editorial (300–500 words for /rooms/{slug})");
  for (const k of ["seoTitle", "seoDescription"]) if (r[k] == null) warn(`${loc}.${k}`, "missing");
  if (!Array.isArray(r.faqs) || r.faqs.length < 3) warn(`${loc}.faqs`, `${r.faqs?.length ?? 0} FAQs (target 3)`);
}

/* age-hubs.json: one entry per AGE_HUBS slug, sections in the same anchor order. */
if (data.ageHubs !== undefined) {
  const loc = files.ageHubs;
  unique(ageHubs, "slug", loc);
  if (!AGE_HUBS) warn("src/lib/ages.ts", "could not read AGE_HUBS; age-hubs.json anchors not checked");
  for (const slug of AGE_HUBS?.keys() ?? []) if (!ageHubs.some((h) => h.slug === slug)) err(loc, `hub "${slug}" is missing`);
  for (const h of ageHubs) {
    const at = `${loc}:${h.slug}`;
    const anchors = AGE_HUBS?.get(h.slug);
    if (AGE_HUBS && !anchors) err(`${at}.slug`, `"${h.slug}" is not in AGE_HUBS (${[...AGE_HUBS.keys()].join(", ")})`);
    const got = (Array.isArray(h.sections) ? h.sections : []).map((s) => s?.anchor);
    if (anchors && JSON.stringify(got) !== JSON.stringify(anchors))
      err(`${at}.sections`, `anchors ${JSON.stringify(got)} must equal AGE_HUBS ${JSON.stringify(anchors)}`);
    if (typeof h.intro === "string") {
      const n = wordCount(h.intro);
      if (n < 150 || n > 250) warn(`${at}.intro`, `${n} words (target 150–250)`);
    }
    (Array.isArray(h.sections) ? h.sections : []).forEach((s, i) => {
      const n = typeof s?.milestone === "string" ? wordCount(s.milestone) : 0;
      if (n < 60 || n > 120) warn(`${at}.sections[${i}].milestone`, `${n} words (target 60–120)`);
      if (!/CDC|WHO|AAP/.test(s?.milestone ?? "")) warn(`${at}.sections[${i}].milestone`, "YMYL milestone text names no source (CDC/WHO/AAP)");
      if (Array.isArray(s?.tips) && (s.tips.length < 2 || s.tips.length > 6)) warn(`${at}.sections[${i}].tips`, `${s.tips.length} tips (2–6)`);
    });
    if (!Array.isArray(h.sources) || h.sources.length === 0) err(`${at}.sources`, "YMYL hub needs sources");
  }
}

/* faqs.json: /faq sections (#buying …) and age-hub keys (age:<hub slug>), see src/db/seed/load.ts. */
if (data.faqs && typeName(data.faqs) === "object") {
  for (const [key, list] of Object.entries(data.faqs)) {
    const at = `${files.faqs}.${key}`;
    const n = Array.isArray(list) ? list.length : 0;
    if (key === "general") warn(at, 'legacy section; load.ts maps it to "buying", rename it');
    else if (key.startsWith("age:")) {
      const hub = key.slice(4);
      if (AGE_HUBS && !AGE_HUBS.has(hub)) err(at, `unknown age hub "${hub}" (${[...AGE_HUBS.keys()].join(", ")})`);
      if (n < 3 || n > 6) warn(at, `${n} questions (target 4)`);
    } else if (!FAQ_SECTIONS.includes(key)) err(at, `unknown section (use ${FAQ_SECTIONS.join(", ")} or age:<hub>)`);
    else if (n < 5 || n > 8) warn(at, `${n} questions (target 5–8)`);
    (Array.isArray(list) ? list : []).forEach((f, i) => {
      if (f?.section != null) warn(`${at}[${i}].section`, "the key already sets the section; drop it");
      const w = typeof f?.answer === "string" ? wordCount(f.answer) : 0;
      if (w > 60) warn(`${at}[${i}].answer`, `${w} words (max 60)`);
    });
  }
  for (const s of FAQ_SECTIONS) if (!(s in data.faqs) && !(s === "buying" && "general" in data.faqs)) warn(files.faqs, `no "${s}" section (/faq#${s})`);
}

/* Keyword ownership (SEO.md §1.10): every room, post and product owns one primaryQuery. */
{
  const normQuery = (q) =>
    q.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[‌‏‎]/g, " ").replace(/[؟?!.،,]/g, "").replace(/\s+/g, " ").trim();
  const owners = new Map();
  const urls = [
    ...rooms.map((x) => [x, `${files.rooms}:${x.slug}`]),
    ...posts.map(({ file, post }) => [post, file]),
    ...products.map((x) => [x, `${files.products}:${x.slug}`]),
  ];
  for (const [x, loc] of urls) {
    if (typeof x.primaryQuery !== "string") {
      warn(`${loc}.primaryQuery`, "missing (SEO.md §1.10)");
      continue;
    }
    const k = normQuery(x.primaryQuery);
    if (owners.has(k)) err(`${loc}.primaryQuery`, `«${x.primaryQuery}» is already owned by ${owners.get(k)}`);
    else owners.set(k, loc);
  }
  for (const [x, loc] of urls)
    (Array.isArray(x.secondaryQueries) ? x.secondaryQueries : []).forEach((q, i) => {
      const owner = typeof q === "string" ? owners.get(normQuery(q)) : undefined;
      if (owner && owner !== loc) warn(`${loc}.secondaryQueries[${i}]`, `«${q}» is the primaryQuery of ${owner}`);
    });
  for (const p of products)
    if (!Array.isArray(p.alternateNames) || !p.alternateNames.length) warn(`${files.products}:${p.slug}.alternateNames`, "no spelling variants (SEO.md §4.5)");
  for (const { file, post } of posts) refs(post.aboutEntities, termSlugs, `${file}.aboutEntities`, "glossary term");
}

/* One Q&A per URL (SEO.md §1.6): the same question must not be answered on two pages. */
{
  const normQ = (q) => q.replace(/[‌\s]+/g, " ").replace(/[؟?]\s*$/, "").trim();
  const seen = new Map();
  const add = (list, loc) =>
    (Array.isArray(list) ? list : []).forEach((f, i) => {
      if (typeof f?.question !== "string") return;
      const k = normQ(f.question);
      if (seen.has(k) && !seen.get(k).startsWith(`${loc}[`)) warn(`${loc}[${i}].question`, `same question as ${seen.get(k)}`);
      else if (!seen.has(k)) seen.set(k, `${loc}[${i}]`);
    });
  for (const [key, list] of Object.entries(typeName(data.faqs) === "object" ? data.faqs : {})) add(list, `${files.faqs}.${key}`);
  for (const [list, file] of [[pages, files.pages], [categories, files.categories], [products, files.products], [rooms, files.rooms]])
    for (const x of list) add(x.faqs, `${file}:${x.slug}.faqs`);
  for (const { file, post } of posts) add(post.faqs, `${file}.faqs`);
}
/* JSON files with no seed type: product references and /mag/ links must resolve. */
for (const { file, value } of extraFiles) {
  const visit = (v, loc, key) => {
    if (typeof v === "string") {
      if ((key === "productSlug" || key === "productSlugs") && !productSlugs.has(v)) err(loc, `unknown product "${v}"`);
      const mag = /^\/mag\/([a-z0-9-]+)\/?$/.exec(key === "href" ? v : "");
      if (mag && !postSlugs.has(mag[1])) err(loc, `link to unknown post "${mag[1]}"`);
    } else if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${loc}[${i}]`, key));
    else if (v && typeof v === "object") {
      if (key === "nested" && typeof v.slug === "string" && !productSlugs.has(v.slug)) err(`${loc}.slug`, `unknown product "${v.slug}"`);
      for (const [k, x] of Object.entries(v)) visit(x, `${loc}.${k}`, k);
    }
  };
  visit(value, file, "");
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
  if (typeof p.updatedAt === "string" && typeof p.publishedAt === "string" && p.updatedAt < p.publishedAt)
    err(`${file}.updatedAt`, "is before publishedAt");
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

const PERSIAN_LETTER = /[\u0621-\u064Aپچژکگیآ]/;
/** Markdown fields: link schemes, directives, callouts, H1 and digits are checked strictly. */
const BODY_FIELDS = new Set([
  "categories.description", "products.description", "topics.description", "glossary.definition",
  "glossary.body", "pages.body", "posts.body", "rooms.description", "ageHubs.intro",
]);
/** Fields holding identifiers or English text: no Persian-prose checks. */
const ID_FIELDS = new Set([
  "slug", "sku", "url", "sameAs", "accent", "illustration", "publishedAt", "swatch", "category", "related", "products",
  "relatedPostSlugs", "relatedProductSlugs", "topic", "author", "reviewer", "product", "availability", "format",
  "skills", "originalTerm", "siteNameEn", "instagram", "bale", "email", "phone", "enamadId", "publisher",
  "updatedAt", "pillarPostSlug", "productSlug", "productSlugs", "href", "icon", "season", "slot", "ageStage",
  "instagramHandle", "followersAsOf", "aparat", "foundingDate", "section", "anchor",
]);
/** Internal or search-query fields: orthography only (queries are typed the way people search). */
const NOT_PROSE = new Set(["claimsToVerify", "primaryQuery", "secondaryQueries", "alternateNames", "aboutEntities"]);
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
    .replace(/\s*\{#[^}\n]*\}/g, " ")
    .replace(/^[ \t]*:{2,3}[a-zA-Z-]*(\{[^}\n]*\})?[ \t]*$/gm, " ")
    .replace(/\]\(\s*[^)\s]+(?:\s+"[^"]*")?\s*\)/g, "]")
    .replace(/https?:\/\/[^\s)»\]]+/g, " ")
    .replace(/<[^>\n]+>/g, " ")
    .replace(/^([ \t]*(?:>[ \t]*)*)\d+[.)][ \t]+/gm, "$1")
    .replace(/^[ \t]*\|?[ \t:|-]+\|[ \t:|-]*$/gm, " ");
}

/**
 * Latin digits are fine when they belong to a Latin identifier: a token that has Latin letters
 * (E1, F963, Q190218, CHZ-LT-01) or a number right after a standard/proper-name prefix
 * (EN 71-3, ISO 8124, (EU) 2023/1464). Digits beside other Latin words («CDC 75 درصد») are
 * "near" (warning); digits between Persian words are "prose" (error in bodies).
 */
const NUMBER_PREFIXES = new Set(["EN", "ISO", "ASTM", "EU", "BS", "DIN", "ANSI", "IEC", "CFR", "REACH", "Waldorf", "Annex"]);
function latinDigits(text) {
  const out = [];
  const TOKEN = /[A-Za-z0-9.,:;\x27"&/+\-–—_()%°×[\]]/;
  const LATIN_RUN = /[A-Za-z0-9 .,:;\x27"&/+\-–—_()%°×[\]]/;
  const strip = (t) => t.replace(/^[(["\x27:.,]+|[)\]"\x27:.,;]+$/g, "");
  for (const m of text.matchAll(/[0-9]+/g)) {
    let a = m.index;
    let b = m.index + m[0].length;
    while (a > 0 && TOKEN.test(text[a - 1])) a--;
    while (b < text.length && TOKEN.test(text[b])) b++;
    const token = text.slice(a, b);
    let p = a;
    while (p > 0 && text[p - 1] === " ") p--;
    let q = p;
    while (q > 0 && TOKEN.test(text[q - 1])) q--;
    const prev = p < a ? strip(text.slice(q, p)) : "";
    if (/[A-Za-z]/.test(token) || NUMBER_PREFIXES.has(prev)) {
      out.push({ index: m.index, digits: m[0], kind: "ok", run: strip(p < a && prev ? `${prev} ${token}` : token) });
      continue;
    }
    let ra = a;
    let rb = b;
    while (ra > 0 && LATIN_RUN.test(text[ra - 1])) ra--;
    while (rb < text.length && LATIN_RUN.test(text[rb])) rb++;
    out.push({ index: m.index, digits: m[0], kind: /[A-Za-z]/.test(text.slice(ra, rb)) ? "near" : "prose" });
  }
  return out;
}

const latinContexts = new Map();

function checkText(s, loc, field, group) {
  const isBody = BODY_FIELDS.has(`${group}.${field}`);
  // Orthography (all string values).
  for (const [rx, msg] of [
    [/\u064A/g, "Arabic yeh \u064A (use Persian ی U+06CC)"],
    [/\u0643/g, "Arabic kaf \u0643 (use Persian ک U+06A9)"],
    [/\u0649/g, "Arabic alef maksura \u0649 (use Persian ی)"],
    [/\u0640/g, "kashida \u0640"],
    [/[\u0660-\u0669]/g, "Arabic-Indic digit (use Persian ۰–۹)"],
  ]) {
    for (const m of s.matchAll(rx)) err(loc, `${msg} at ${snip(s, m.index, 1)}`);
  }
  if (/\u06C0/.test(s)) warn(loc, "uses \u06C0 (U+06C0); the content uses ه + ٔ (هٔ) — keep one form");
  for (const m of s.matchAll(/\u200C{2,}|\u200C(?=\s)|(?<=\s)\u200C|^\u200C|\u200C$/g))
    warn(loc, `stray ZWNJ at ${snip(s, m.index, 1)}`);
  for (const m of s.matchAll(/[\u200C](?=[A-Za-z0-9۰-۹.,،؛:!؟?)(«»\-])|(?<=[A-Za-z0-9۰-۹.,،؛:!؟?)(«»\-])\u200C/g))
    warn(loc, `ZWNJ next to a non-letter at ${snip(s, m.index, 1)}`);
  if (/[\u200F\u200E\u202A-\u202E\u2066-\u2069]/.test(s)) warn(loc, "contains bidi control characters");
  if (/\u00A0/.test(s)) warn(loc, "contains a no-break space");

  if (ID_FIELDS.has(field) || NOT_PROSE.has(field) || !PERSIAN_LETTER.test(s)) return;

  // Persian prose.
  const prose = isBody ? stripMarkdown(s) : s.replace(/https?:\/\/\S+/g, " ");
  for (const d of latinDigits(prose)) {
    if (d.kind === "ok") latinContexts.set(d.run, (latinContexts.get(d.run) ?? 0) + 1);
    else if (d.kind === "near") warn(loc, `Latin digits "${d.digits}" beside Latin text; use Persian digits unless it is part of a name or standard: ${snip(prose, d.index, d.digits.length)}`);
    else (isBody ? err : warn)(loc, `Latin digits "${d.digits}" in Persian prose at ${snip(prose, d.index, d.digits.length)}`);
  }
  for (const m of prose.matchAll(/(^|[\s«(])(ن?می) (?=[آ-ی])/g))
    warn(loc, `«${m[2]}» needs a ZWNJ, not a space, at ${snip(prose, m.index + m[1].length, m[2].length + 1)}`);
  for (const m of prose.matchAll(/[آ-ی] (ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان|ترین|ترها)(?=[\s،.؛:!؟»)]|$)/g))
    warn(loc, `«${m[1]}» should attach with a ZWNJ at ${snip(prose, m.index, m[0].length)}`);
  for (const m of prose.matchAll(/ه (ای|ی)(?=[\s،.؛:!؟»)]|$)/g))
    warn(loc, `«ه ${m[1]}» should be «ه\u200C${m[1]}»/«هٔ» at ${snip(prose, m.index, m[0].length)}`);
  for (const m of prose.matchAll(/(?<=[آ-ی][»)]?)\s*([?;]|,(?!\d))/g))
    warn(loc, `Latin punctuation "${m[1]}" after Persian text (use ؟ ، ؛) at ${snip(prose, m.index, m[0].length)}`);
  for (const m of prose.matchAll(/[^\s\n] {2,}(?=\S)/g)) warn(loc, `double space at ${snip(prose, m.index, 3)}`);

  if (!isBody && PLAIN_FIELDS.has(field)) {
    if (/\]\([^)]+\)/.test(s)) warn(loc, "Markdown link in a plain-text field");
    if (/\*\*[^*]+\*\*/.test(s)) warn(loc, "Markdown bold in a plain-text field");
  }
  if (!isBody && /\]\(([a-z]+):/.test(s) && !PLAIN_FIELDS.has(field)) checkLinks(s, loc);

  for (const [re, msg] of [
    [/[۰-۹]\s?%/g, "use the Persian percent sign ٪ after Persian digits"],
    [/[۰-۹]\.[۰-۹]/g, "use the Persian decimal separator ٫ (U+066B)"],
    [/[۰-۹],[۰-۹]{3}/g, "use the Persian thousands separator ٬ (U+066C)"],
    [/(^|[^\u200C])(مونته سوری|اسباب بازی|روبه رو|نیم فاصله|چند لایی|هم قد|دست ساز|کم کم|می توان|نمی توان)/g, "compound needs a ZWNJ"],
  ])
    for (const m of prose.matchAll(re)) warn(loc, `${msg}: ${snip(prose, m.index, m[0].length)}`);
  for (const m of s.matchAll(/\b(TODO|TBD|FIXME|lorem|ipsum)\b|\{\{|\}\}|\?\?\?|؟؟|\[\[|XXX/gi))
    err(loc, `placeholder text ${snip(s, m.index, m[0].length)}`);

  // Claims that must never be invented (manual review); one note per string, the rest counted.
  const claims = [...s.matchAll(
    /(استاندارد ملی|نشان استاندارد|گواهی\u200C?نامه|گواهی [A-Z]|دارای (?:گواهی|استاندارد|تأییدیه)|تأییدیهٔ|مورد تأیید|آزمایشگاه|جایزه|سال تأسیس|تأسیس(?:\u200Cشده)? در|هزاران (?:مشتری|خانواده)|[۰-۹0-9]+ ?(?:هزار )?(?:مشتری|خانواده)|رضایت [۰-۹0-9]+|نماد اعتماد|اینماد)/g,
  )];
  if (claims.length)
    note(
      loc,
      `claim to confirm: ${snip(s, claims[0].index, claims[0][0].length, 40)}` +
        (claims.length > 1 ? ` (+${claims.length - 1} more in this field)` : ""),
    );
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
    const [ref, fragment] = target.slice(scheme.length + 1).split("#");
    if (!exists[scheme].has(ref)) err(loc, `link to unknown ${scheme} "${ref}"`);
    else if (fragment !== undefined && !ANCHORS[scheme].get(ref)?.has(fragment))
      err(loc, `deep link to unknown anchor "#${fragment}" in ${scheme}:${ref}: ${at}`);
  }
  for (const m of md.matchAll(/\]\[[^\]]*\]/g)) warn(loc, `reference-style link ${snip(md, m.index, m[0].length)}`);
  const rest = md.replace(LINK, " ").replace(/^\s*::.*$/gm, " ");
  for (const m of rest.matchAll(/(?<![A-Za-z])(product|category|post|topic|term|page):[a-z0-9-]+/g))
    warn(loc, `bare "${m[0]}" outside a link`);
}

function checkMarkdown(md, loc, kind) {
  checkLinks(md, loc);
  const lines = md.split("\n");
  let inSteps = -1;
  let prevLevel = 1;
  let productCards = 0;
  const headings = new Map();
  const anchors = new Set();
  const embedded = new Set();
  lines.forEach((line, i) => {
    const at = `${loc} (line ${i + 1})`;
    if (/^ {0,3}#(\s|$)/.test(line)) err(at, `H1 in body: ${JSON.stringify(line.slice(0, 60))}`);
    const h = /^ {0,3}(#{2,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) {
      const level = h[1].length;
      if (level > prevLevel + 1) warn(at, `heading jumps from H${prevLevel} to H${level}`);
      prevLevel = level;
      const a = ANCHOR_RE.exec(h[2]);
      const key = (a ? h[2].slice(0, a.index) : h[2]).replace(/[*_`]/g, "").trim();
      if (headings.has(key)) warn(at, `duplicate heading «${key}»`);
      headings.set(key, i);
      if (!key) err(at, "empty heading");
      if (!a) {
        if (level <= 3) warn(at, `H${level} has no stable anchor; append {#english-id} (SEO.md §4.4): «${key}»`);
      } else if (!KEBAB.test(a[1])) err(at, `anchor {#${a[1]}} must be ASCII kebab-case`);
      else if (anchors.has(a[1])) err(at, `duplicate anchor #${a[1]} in this body`);
      else {
        anchors.add(a[1]);
        if (RESERVED_ANCHORS.has(a[1])) err(at, `anchor #${a[1]} is reserved by the page template`);
        if (a[1].length > 40) warn(at, `anchor #${a[1]} is long (keep ids short)`);
      }
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
      const text = h2[1].replace(ANCHOR_RE, "");
      if (!/؟\s*$/.test(text)) warn(`${loc} (line ${i + 1})`, `[strict] H2 is not a question: «${text}»`);
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
    .replace(/\{#[^}\n]*\}/g, " ")
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
  ["rooms", rooms, (x) => `${files.rooms}:${x.slug}`, "description"],
  ["ageHubs", ageHubs, (x) => `${files.ageHubs}:${x.slug}`, "intro"],
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
for (const { file, value } of extraFiles) walk(value, file, "extra");
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

/* SEO: titles and descriptions must be unique across the site. */
{
  const seen = new Map();
  const add = (v, loc, what) => {
    if (typeof v !== "string") return;
    const k = `${what}:${v.trim()}`;
    if (seen.has(k)) warn(loc, `duplicate ${what} (also ${seen.get(k)})`);
    else seen.set(k, loc);
  };
  const all = [
    ...categories.map((x) => [x, `${files.categories}:${x.slug}`]),
    ...products.map((x) => [x, `${files.products}:${x.slug}`]),
    ...topics.map((x) => [x, `${files.topics}:${x.slug}`]),
    ...pages.map((x) => [x, `${files.pages}:${x.slug}`]),
    ...rooms.map((x) => [x, `${files.rooms}:${x.slug}`]),
    ...posts.map(({ file, post }) => [post, file]),
  ];
  for (const [x, loc] of all) {
    add(x.seoTitle, `${loc}.seoTitle`, "seoTitle");
    add(x.seoDescription, `${loc}.seoDescription`, "seoDescription");
  }
  for (const { file, post } of posts) add(post.title, `${file}.title`, "post title");
  for (const p of products) add(p.name, `${files.products}:${p.slug}.name`, "product name");
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

/* ------------------------------------------------------------------ external URLs (--check-urls) */

if (CHECK_URLS) {
  const urls = new Map();
  const addUrl = (u, loc) => {
    if (typeof u !== "string" || !/^https?:\/\//.test(u)) return;
    if (!urls.has(u)) urls.set(u, []);
    urls.get(u).push(loc);
  };
  for (const { file, post } of posts) {
    (post.sources ?? []).forEach((s, i) => addUrl(s?.url, `${file}.sources[${i}]`));
    for (const m of (post.body ?? "").matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) addUrl(m[1], `${file}.body`);
  }
  const lists = [[topics, files.topics], [glossary, files.glossary], [authors, files.authors]];
  for (const [list, file] of lists) for (const x of list) (x.sameAs ?? []).forEach((u, i) => addUrl(u, `${file}:${x.slug}.sameAs[${i}]`));
  for (const [list, file] of [[categories, files.categories], [products, files.products], [glossary, files.glossary], [topics, files.topics], [pages, files.pages]])
    for (const x of list)
      for (const f of ["description", "body", "definition"])
        for (const m of (typeof x[f] === "string" ? x[f] : "").matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) addUrl(m[1], `${file}:${x.slug}.${f}`);
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
  const check = async (u) => {
    for (const method of ["HEAD", "GET"]) {
      try {
        const res = await fetch(u, { method, redirect: "follow", headers: { "user-agent": UA, accept: "text/html,*/*" }, signal: AbortSignal.timeout(20000) });
        if (method === "HEAD" && (res.status === 405 || res.status === 403 || res.status >= 500)) continue;
        return { status: res.status, final: res.url };
      } catch (e) {
        if (method === "GET") return { status: 0, error: e.cause?.code ?? e.name };
      }
    }
    return { status: 0, error: "no response" };
  };
  const queue = [...urls.keys()];
  const results = new Map();
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const u = queue.shift();
      results.set(u, await check(u));
    }
  }));
  let ok = 0;
  for (const [u, r] of results) {
    const where = urls.get(u)[0] + (urls.get(u).length > 1 ? ` (+${urls.get(u).length - 1})` : "");
    if (r.status >= 200 && r.status < 400) ok++;
    else if (r.status === 404 || r.status === 410) warn(where, `URL returns ${r.status}: ${u}`);
    else note(where, `URL not verified (${r.status || r.error}; bot-blocked or offline?): ${u}`);
  }
  console.log(`URL check: ${ok}/${results.size} reachable`);
}

/* ------------------------------------------------------------------ report */

const counted = `${categories.length} categories, ${products.length} products, ${postList.length} posts, ` +
  `${glossary.length} terms, ${topics.length} topics, ${authors.length} authors, ${pages.length} pages, ${reviews.length} reviews` +
  (rooms.length ? `, ${rooms.length} rooms` : "") + (extraFiles.length ? ` · untyped: ${extraFiles.map((x) => x.file).join(", ")}` : "");
console.log(`Content QA · ${path.relative(ROOT, DIR) || DIR} · ${counted}${STRICT ? " · strict" : ""}`);
if (VERBOSE && latinContexts.size) {
  console.log(`\nLatin digit runs allowed in prose (${latinContexts.size}):`);
  for (const [k, n] of [...latinContexts].sort((a, b) => b[1] - a[1])) console.log(`  ${n}× ${JSON.stringify(k)}`);
}
if (notes.length) {
  console.log(`\nManual review (${notes.length}) — not errors; confirm by hand:`);
  for (const n of VERBOSE ? notes : notes.slice(0, 10)) console.log(`  · ${n}`);
  if (!VERBOSE && notes.length > 10) console.log(`  … ${notes.length - 10} more (--verbose)`);
}
console.log(`\nWarnings (${warnings.length})`);
for (const w of warnings) console.log(`  ⚠ ${w}`);
console.log(`\nErrors (${errors.length})`);
for (const e of errors) console.log(`  ✖ ${e}`);
console.log(errors.length ? `\n✖ ${errors.length} error(s), ${warnings.length} warning(s)` : `\n✔ no errors, ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
