/*
 * Shapes of the JSON seed files in /seed/content. The seed script validates and
 * loads them into SQLite. Phase 2 (CMS) edits the same tables, so these mirror src/db/schema.ts.
 * All human-facing strings are Persian. Slugs are lowercase English kebab-case.
 */

export type SeedCategory = {
  slug: string;
  name: string;
  tagline: string;
  /** Markdown, 120–250 words, answer-first SEO intro for the category page. */
  description: string;
  illustration: IllustrationKey;
  accent: string;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  faqs: SeedFaq[];
};

export type SeedVariant = {
  name: string;
  sku: string;
  /** Toman; omit to use the product price. */
  price?: number;
  stock: number;
  options: Record<string, string>;
  swatch?: string;
};

export type SeedProduct = {
  slug: string;
  name: string;
  subtitle: string;
  /** 1–2 sentence answer-first summary (≤ 40 words). */
  summary: string;
  /** Markdown, 250–450 words. May use the link schemes in docs/CONTENT-FORMAT.md. */
  description: string;
  category: string;
  sku: string;
  /** Toman. */
  price: number;
  compareAtPrice?: number;
  stock: number;
  availability: "in_stock" | "out_of_stock" | "preorder" | "made_to_order";
  leadTimeDays?: number;
  ageMinMonths: number;
  ageMaxMonths?: number;
  skills: SkillKey[];
  material: string;
  finish: string;
  dimensions: { widthCm: number; heightCm: number; depthCm: number; extra?: Record<string, number> };
  weightKg: number;
  maxLoadKg?: number;
  highlights: string[];
  specs: { label: string; value: string }[];
  inTheBox: string[];
  safetyNotes: string;
  careNotes: string;
  warrantyMonths: number;
  illustration: IllustrationKey;
  featured: boolean;
  isNew: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  variants: SeedVariant[];
  faqs: SeedFaq[];
  related: string[];
  /** Product facts the workshop must confirm before launch (not rendered). */
  claimsToVerify: string[];
  assemblyMinutes?: number;
  primaryQuery?: string;
  alternateNames?: string[];
  guaranteeText?: string;
};

export type SeedFaq = { question: string; answer: string; featured?: boolean; section?: string };

export type SeedPost = {
  slug: string;
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  tldr: string[];
  /** Markdown body following docs/CONTENT-FORMAT.md (no H1). */
  body: string;
  format: "guide" | "article" | "howto" | "comparison" | "checklist" | "story";
  topic: TopicKey;
  isPillar: boolean;
  author: AuthorKey;
  reviewer?: AuthorKey;
  illustration: IllustrationKey;
  ageMinMonths?: number;
  ageMaxMonths?: number;
  ymyl: boolean;
  sources: { title: string; url: string; publisher?: string }[];
  faqs: SeedFaq[];
  products: string[];
  featured: boolean;
  /** ISO date (YYYY-MM-DD) */
  publishedAt: string;
  /** ISO date of the last editorial update (defaults to publishedAt). */
  updatedAt?: string;
  claimsToVerify: string[];
  primaryQuery?: string;
  secondaryQueries?: string[];
  aboutEntities?: string[];
};

export type SeedTopic = {
  slug: TopicKey;
  name: string;
  tagline: string;
  description: string;
  illustration: IllustrationKey;
  accent: string;
  sameAs: string[];
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
};

export type SeedGlossaryTerm = {
  slug: string;
  term: string;
  originalTerm?: string;
  definition: string;
  body?: string;
  relatedPostSlugs: string[];
  relatedProductSlugs: string[];
  sameAs: string[];
  alternateNames?: string[];
  pillarPostSlug?: string;
};

export type SeedAuthor = {
  slug: AuthorKey;
  name: string;
  role: string;
  bio: string;
  credentials: string[];
  sameAs: string[];
};

export type SeedPage = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  faqs?: SeedFaq[];
};

export type SeedRoom = {
  slug: string;
  name: string;
  ageStage: string | null;
  tagline: string;
  /** Markdown, 300–500 words of unique editorial for /rooms/{slug}. */
  description?: string;
  floorAreaM2: number;
  illustration: IllustrationKey;
  sortOrder: number;
  primaryQuery: string;
  seoTitle?: string;
  seoDescription?: string;
  items: { product: string; slot: string; defaultOn?: boolean }[];
  faqs?: SeedFaq[];
};

export type SeedReview = {
  product?: string;
  authorName: string;
  city: string;
  childAge: string;
  rating: number;
  title: string;
  body: string;
  featured: boolean;
};

export type TopicKey =
  | "montessori"
  | "movement"
  | "learning-tower"
  | "nursery"
  | "play"
  | "art"
  | "reading"
  | "safety"
  | "gifts";

export type AuthorKey = "choobz-editorial" | "choobz-workshop";

export type SkillKey =
  | "gross-motor"
  | "fine-motor"
  | "balance"
  | "independence"
  | "practical-life"
  | "creativity"
  | "language"
  | "imagination"
  | "focus"
  | "confidence";

/** Built-in SVG illustrations (src/components/illustrations). */
export type IllustrationKey =
  | "learning-tower"
  | "pikler-triangle"
  | "pikler-arch"
  | "swedish-ladder"
  | "climbing-hex"
  | "balance-board"
  | "front-facing-bookshelf"
  | "wall-art-roll"
  | "kids-table-chair"
  | "montessori-shelf"
  | "rainbow-stacker"
  | "duck-pull-toy"
  | "wooden-blocks"
  | "room-set";
