import type { Link, Root } from "mdast";
import type { Plugin } from "unified";
import type { Parent } from "unist";
import { visit } from "unist-util-visit";
import { EL } from "../elements";
import { report } from "../issues";
import { classifyHref, parseSiteHref, siteHrefToPath } from "../links";
import type { GlossaryEntry, PipelineContext } from "../types";

/*
 * Resolves the internal link schemes to site paths (product:x → /product/x, …) on links and on
 * reference definitions. `term:` links become <cz-term> so they get the glossary hover card.
 * A link with an unknown or malformed scheme cannot be resolved: it is reported and unwrapped
 * to its text, so a typo never ships a broken href.
 */

export function termLinkData(entry: Pick<GlossaryEntry, "definition"> | undefined, slug: string, auto = false): Link["data"] {
  return {
    hName: EL.term,
    hProperties: {
      term: slug,
      ...(entry?.definition ? { definition: entry.definition } : {}),
      ...(auto ? { auto: true } : {}),
    },
  };
}

export const remarkSiteLinks: Plugin<[PipelineContext], Root> = (ctx) => (tree) => {
  const terms = new Map((ctx.glossary?.terms ?? []).map((t) => [t.slug, t]));

  visit(tree, "definition", (node) => {
    const site = parseSiteHref(node.url);
    if (site) node.url = siteHrefToPath(site);
  });

  visit(tree, "link", (node, index, parent: Parent | undefined) => {
    const href = node.url;
    const kind = classifyHref(href);
    if (kind === "site") {
      const site = parseSiteHref(href)!;
      node.url = siteHrefToPath(site);
      if (site.scheme === "term") node.data = { ...node.data, ...termLinkData(terms.get(site.slug), site.slug) };
      return;
    }
    if (kind === "pass") {
      if (href.startsWith("/")) {
        report(ctx, "warning", "link-hardcoded", `hard-coded site path "${href}"; use a link scheme so it survives route changes`, node);
      }
      return;
    }
    if (kind === "relative") {
      report(ctx, "warning", "link-relative", `relative link "${href}"; use a link scheme (product:, post:, …) or a full URL`, node);
      return;
    }
    report(
      ctx,
      "error",
      kind === "malformed-site" ? "link-slug-invalid" : "link-scheme-unknown",
      kind === "malformed-site" ? `malformed site link "${href}"; unwrapped` : `unknown link scheme in "${href}"; unwrapped`,
      node,
    );
    if (parent && index !== undefined) {
      parent.children.splice(index, 1, ...node.children);
      return index;
    }
  });
};
