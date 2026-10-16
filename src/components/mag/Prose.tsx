import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import { cacheLife, cacheTag } from "next/cache";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { listGlossaryLinkTerms } from "@/db/queries/glossary-links";
import { IntentLink } from "@/components/ui/IntentLink";
import { tag } from "@/lib/cache-tags";
import { compileMarkdown, EL, isExternalHref } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { Callout } from "./Callout";
import { Checklist, ChecklistItem } from "./Checklist";
import { CompareTable } from "./CompareTable";
import { GlossaryLink } from "./GlossaryLink";
import { InlineIllustration } from "./InlineIllustration";
import { MythFace, MythFact } from "./MythFact";
import { ProductEmbed } from "./ProductEmbed";
import { ProductRow } from "./ProductRow";
import { PullQuote } from "./PullQuote";
import { Step, Steps } from "./Steps";
import styles from "./Prose.module.css";

/*
 * Markdown body → server HTML (docs/CONTENT-FORMAT.md, DESIGN.md §7.3). The whole render is one
 * cached unit: the pipeline (src/lib/markdown) runs once per body, and every data read inside
 * (glossary definitions, product embeds, settings) is itself a tagged `'use cache'` query, so
 * the result belongs to the page's static shell. All meaning is in the initial HTML; the only
 * islands are checklist ticks, quick-add and intent prefetch on links.
 */

export type ProseVariant = "article" | "product" | "page" | "compact";

type ProseProps = {
  markdown: string;
  /** `article` = magazine body (text-lead, 1.9); `product`/`page` = body size; `compact` = FAQ answers, short intros. */
  variant?: ProseVariant;
  /** Link first mentions of glossary terms (≤ 8, never in headings). Explicit `term:` links always get hover cards. */
  glossaryLinks?: boolean;
  /** The page's slug: seeds checklist storage keys (`cz.check.{slug}.{i}`). */
  slug?: string;
  /** Term slugs never auto-linked, e.g. the term of the glossary page being rendered. */
  excludeTerms?: string[];
  className?: string;
};

/* Inline links: shape marks them (link-mark band); site links prefetch only on intent, off-site ones open a new tab. */
function ProseLink({ href = "", className, children, ...rest }: ComponentPropsWithoutRef<"a">) {
  const classes = cn("link-mark", className);
  if (href.startsWith("/")) {
    return (
      <IntentLink {...rest} href={href} prefetch={false} className={classes}>
        {children}
      </IntentLink>
    );
  }
  const external = isExternalHref(href);
  return (
    <a {...rest} href={href} className={classes} target={external ? "_blank" : undefined} rel={external ? "noopener" : undefined}>
      {children}
    </a>
  );
}

/* Question H2 with its «#» deep link (the id is the author's ASCII anchor). */
function ProseH2({ id, children, ...rest }: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2 id={id} {...rest}>
      {children}
      {id ? <a href={`#${id}`} className={styles.anchor} aria-label="پیوند مستقیم به این بخش" /> : null}
    </h2>
  );
}

const COMPONENTS = {
  a: ProseLink,
  h2: ProseH2,
  table: CompareTable,
  [EL.callout]: Callout,
  [EL.myth]: MythFact,
  [EL.mythFace]: MythFace,
  [EL.pullQuote]: PullQuote,
  [EL.product]: ProductEmbed,
  [EL.products]: ProductRow,
  [EL.steps]: Steps,
  [EL.step]: Step,
  [EL.checklist]: Checklist,
  [EL.check]: ChecklistItem,
  [EL.illustration]: InlineIllustration,
  [EL.term]: GlossaryLink,
} as Record<string, (props: never) => ReactNode | Promise<ReactNode>>;

export async function Prose({ markdown, variant = "article", glossaryLinks = false, slug, excludeTerms, className }: ProseProps) {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.glossary);

  const terms = await listGlossaryLinkTerms();
  const { tree } = compileMarkdown(markdown, {
    slug,
    glossary: { terms, autoLink: glossaryLinks, exclude: excludeTerms },
  });

  const content = toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    // The `cz-*` block elements are not intrinsic JSX tags, hence the cast.
    components: COMPONENTS as unknown as Partial<Components>,
    passKeys: true,
  });

  return (
    <div className={cn(styles.prose, styles[variant], className)} data-prose="">
      {content}
    </div>
  );
}
