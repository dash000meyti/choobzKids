/*
 * Shared types of the Markdown pipeline (docs/CONTENT-FORMAT.md). Pure: no Next.js, no DB, so the
 * same code runs in the renderer, in route handlers (llms-full, .md alternates) and in scripts.
 */

export type IssueLevel = "error" | "warning";

/** One content problem found while parsing a body. Errors are things the renderer had to drop or guess. */
export type MarkdownIssue = {
  level: IssueLevel;
  /** Stable machine code, e.g. `link-scheme-unknown`. */
  code: string;
  message: string;
  /** 1-based line in the Markdown source, when known. */
  line?: number;
};

/** A glossary term the renderer may link to (`/glossary/{slug}`). */
export type GlossaryEntry = {
  slug: string;
  term: string;
  /** One quotable sentence; shown in the hover card. */
  definition?: string | null;
  /** Other Persian spellings that count as a mention (SEO.md §4.5 variants). */
  alternateNames?: readonly string[] | null;
};

export type GlossaryOptions = {
  terms: readonly GlossaryEntry[];
  /** Link first mentions automatically (≤ `limit`, never in headings). Explicit `term:` links work either way. */
  autoLink?: boolean;
  /** Auto-links per body. SEO.md §4.6: 8. */
  limit?: number;
  /** Term slugs never auto-linked, e.g. the term whose own page is rendering. */
  exclude?: readonly string[];
};

export type CompileOptions = {
  /** Seeds per-body state such as checklist storage keys (`cz.check.{slug}.{i}`). */
  slug?: string;
  glossary?: GlossaryOptions;
};

export type Heading = {
  /** The ASCII anchor (`{#id}` in the source, `s-{n}` fallback). */
  id: string;
  text: string;
  depth: 2 | 3;
};

export type Step = {
  /** `step-{n}`, 1-based across the whole body (the HowTo `url` fragment). */
  id: string;
  /** The bold lead of the step («**عنوان گام** — …»), when present. */
  name: string | null;
  /** The rest of the step as plain text. */
  text: string;
};

/** Mutable state threaded through every plugin of one run. */
export type PipelineContext = {
  source: string;
  issues: MarkdownIssue[];
  slug?: string;
  glossary?: GlossaryOptions;
};
