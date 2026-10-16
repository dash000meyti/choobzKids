import type { Heading, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { report } from "../issues";
import type { PipelineContext } from "../types";

/*
 * Stable heading anchors (SEO.md §4.4): `## برج یادگیری چیست؟ {#what-is-a-learning-tower}`.
 * The `{#id}` suffix is removed from the text and becomes the heading's id. Body-level H2/H3
 * without one fall back to `s-{n}` (n = their 1-based position), which CI flags as unstable.
 * The TOC, deep links and the Markdown alternates all read ids from here (extractHeadings).
 */

const ANCHOR_SUFFIX = /[ \t]*\{#([^}]*)\}[ \t]*$/;
/* Digits may lead: age anchors such as #0-6-months are part of the URL contract (DESIGN.md §0.3 #3). */
const VALID_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Ids the page itself uses around the body (SEO.md §4.3); a heading must not take them. */
const RESERVED_IDS = new Set(["main", "tldr", "toc", "faq", "sources", "author", "top"]);

export function headingId(node: Heading): string | undefined {
  const id = node.data?.hProperties?.id;
  return typeof id === "string" ? id : undefined;
}

/** Removes a trailing `{#id}` from the heading's text and returns the raw id (or null). */
function takeAnchor(node: Heading): string | null {
  const last = node.children.at(-1);
  if (last?.type !== "text") return null;
  const match = ANCHOR_SUFFIX.exec(last.value);
  if (!match) return null;
  last.value = last.value.slice(0, match.index).trimEnd();
  if (!last.value) node.children.pop();
  return match[1].trim();
}

function setId(node: Heading, id: string) {
  node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
}

export const remarkHeadingAnchors: Plugin<[PipelineContext], Root> = (ctx) => (tree) => {
  const used = new Set<string>();
  let ordinal = 0;

  const claim = (wanted: string, node: Heading) => {
    let id = wanted;
    for (let n = 2; used.has(id) || RESERVED_IDS.has(id); n++) id = `${wanted}-${n}`;
    if (id !== wanted) report(ctx, "error", "anchor-duplicate", `heading id "${wanted}" is duplicated or reserved; renamed to "${id}"`, node);
    used.add(id);
    setId(node, id);
  };

  for (const node of tree.children) {
    if (node.type !== "heading") continue;
    if (node.depth === 1) {
      report(ctx, "error", "h1-in-body", "bodies must not contain an H1 (the page title is the only H1); rendered as H2", node);
      node.depth = 2;
    }
    const authored = takeAnchor(node);
    const valid = authored != null && VALID_ID.test(authored);
    if (authored != null && !valid) {
      report(ctx, "error", "anchor-invalid", `heading id "${authored}" must be lowercase ASCII kebab-case`, node);
    }
    if (node.depth > 3) {
      if (valid) claim(authored, node);
      continue;
    }
    ordinal += 1;
    if (valid) {
      claim(authored, node);
    } else {
      if (authored == null) report(ctx, "warning", "anchor-missing", `heading has no {#id}; using the unstable fallback "s-${ordinal}"`, node);
      claim(`s-${ordinal}`, node);
    }
  }

  // Headings nested in callouts or lists are not sections: drop the suffix, keep a valid id if given.
  visit(tree, "heading", (node, _index, parent) => {
    if (parent === tree) return;
    const authored = takeAnchor(node);
    if (authored && VALID_ID.test(authored) && !used.has(authored)) claim(authored, node);
  });
};
