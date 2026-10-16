/*
 * Markdown bodies (docs/CONTENT-FORMAT.md): link schemes, callouts, directives, anchors.
 * Pure and framework-free: safe in Server Components, route handlers and scripts.
 * The renderer is src/components/mag/Prose.tsx.
 */

export { compileMarkdown, lintMarkdown, parseMarkdown } from "./pipeline";
export { extractHeadings, extractSteps, markdownToPlain, stripDirectives, type StripOptions } from "./text";
export {
  LINK_SCHEMES,
  classifyHref,
  isExternalHref,
  isLinkScheme,
  parseSiteHref,
  resolveHref,
  siteHrefToPath,
  type LinkScheme,
  type SiteHref,
} from "./links";
export {
  CALLOUT_LABELS,
  EL,
  ILLUSTRATION_KEYS,
  ILLUSTRATION_VIEWS,
  type CalloutKind,
  type ElementProps,
  type IllustrationView,
  type MythSide,
} from "./elements";
export type { CompileOptions, GlossaryEntry, GlossaryOptions, Heading, MarkdownIssue, Step } from "./types";
