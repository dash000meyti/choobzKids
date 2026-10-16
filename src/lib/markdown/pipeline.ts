import type { Root as HastRoot } from "hast";
import type { Root as MdastRoot } from "mdast";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { remarkHeadingAnchors } from "./plugins/anchors";
import { remarkCallouts } from "./plugins/callouts";
import { remarkTableCaptions } from "./plugins/captions";
import { remarkChecklists } from "./plugins/checklists";
import { remarkContentChecks } from "./plugins/content-checks";
import { remarkDirectiveBlocks } from "./plugins/directives";
import { remarkGlossaryLinks } from "./plugins/glossary";
import { remarkSiteLinks } from "./plugins/links";
import { rehypeProse } from "./plugins/rehype-prose";
import type { CompileOptions, MarkdownIssue, PipelineContext } from "./types";

/*
 * The unified pipeline behind every body: remark-parse + GFM + directives, then the Choobz
 * plugins (anchors → blocks → callouts → checklists → captions → links → glossary), then
 * remark-rehype + the reading-shape pass. Pure and synchronous; the caller caches.
 */

function context(markdown: string, options: CompileOptions): PipelineContext {
  return { source: markdown, issues: [], slug: options.slug, glossary: options.glossary };
}

function remarkProcessor(ctx: PipelineContext) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkHeadingAnchors, ctx)
    .use(remarkDirectiveBlocks, ctx)
    .use(remarkCallouts, ctx)
    .use(remarkChecklists, ctx)
    .use(remarkTableCaptions, ctx)
    .use(remarkSiteLinks, ctx)
    .use(remarkGlossaryLinks, ctx);
}

/** Markdown → the transformed mdast (blocks recognised, anchors set, links resolved). */
export function parseMarkdown(markdown: string, options: CompileOptions = {}): { tree: MdastRoot; issues: MarkdownIssue[] } {
  const ctx = context(markdown, options);
  const processor = remarkProcessor(ctx);
  const tree = processor.runSync(processor.parse(markdown));
  return { tree, issues: ctx.issues };
}

/** Markdown → hast with the `cz-*` block elements, ready for the component map (src/components/mag/Prose). */
export function compileMarkdown(markdown: string, options: CompileOptions = {}): { tree: HastRoot; issues: MarkdownIssue[] } {
  const ctx = context(markdown, options);
  const processor = remarkProcessor(ctx)
    .use(remarkRehype, {
      // Raw HTML in bodies is dropped (remark-rehype's default); these are only for GFM footnotes.
      clobberPrefix: "fn-",
      footnoteLabel: "پانویس‌ها",
      footnoteBackLabel: "بازگشت به متن",
    })
    .use(rehypeProse);
  const tree = processor.runSync(processor.parse(markdown));
  return { tree, issues: ctx.issues };
}

/** Every content problem in a body: structure, blocks, links and typing rules. */
export function lintMarkdown(markdown: string, options: CompileOptions = {}): MarkdownIssue[] {
  const ctx = context(markdown, options);
  const processor = remarkProcessor(ctx).use(remarkContentChecks, ctx);
  processor.runSync(processor.parse(markdown));
  return ctx.issues;
}
