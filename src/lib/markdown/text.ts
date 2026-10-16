import type { Blockquote, ListItem, Nodes, Root, RootContent } from "mdast";
import { toString } from "mdast-util-to-string";
import { CALLOUT_ALIASES, CALLOUT_LABELS, CALLOUT_MARKERS, EL, type CalloutKind } from "./elements";
import { resolveHref } from "./links";
import { parseMarkdown } from "./pipeline";
import { headingId } from "./plugins/anchors";
import type { Heading, Step } from "./types";

/*
 * Read-only views of a body for other surfaces: the TOC (extractHeadings), HowTo JSON-LD
 * (extractSteps), search/feeds/descriptions (markdownToPlain) and the agent-facing Markdown
 * alternates and llms-full.txt (stripDirectives). They share the renderer's parser, so ids and
 * step numbers always match the page.
 */

const squash = (s: string) => s.replace(/\s+/g, " ").trim();
const inline = (node: Nodes) => squash(toString(node));

/** H2/H3 of the body in order, with the same ids the page renders. */
export function extractHeadings(markdown: string): Heading[] {
  const { tree } = parseMarkdown(markdown);
  return tree.children.flatMap((node): Heading[] => {
    if (node.type !== "heading" || (node.depth !== 2 && node.depth !== 3)) return [];
    const id = headingId(node);
    return id ? [{ id, text: inline(node), depth: node.depth }] : [];
  });
}

function stepsOf(tree: Root): ListItem[] {
  const items: ListItem[] = [];
  const walk = (node: Nodes) => {
    if (node.type === "listItem" && node.data?.hName === EL.step) items.push(node);
    if ("children" in node) node.children.forEach(walk);
  };
  walk(tree);
  return items;
}

/** The `:::steps` items of the body (HowTo steps), numbered like their `#step-{n}` anchors. */
export function extractSteps(markdown: string): Step[] {
  const { tree } = parseMarkdown(markdown);
  return stepsOf(tree).map((item) => {
    const props = item.data?.hProperties ?? {};
    const title = typeof props.title === "string" ? props.title : null;
    return { id: `step-${props.index}`, name: title, text: blocksToPlain(item.children).join(" ") };
  });
}

function blocksToPlain(nodes: readonly RootContent[]): string[] {
  return nodes.flatMap(blockToPlain).filter(Boolean);
}

function calloutTitle(node: Blockquote): string | null {
  const props = node.data?.hProperties ?? {};
  if (typeof props.title === "string" && props.title) return props.title;
  if (node.data?.hName === EL.myth) return CALLOUT_LABELS.myth;
  const kind = props.kind as CalloutKind | undefined;
  return kind ? CALLOUT_LABELS[kind] : null;
}

function blockToPlain(node: RootContent): string[] {
  switch (node.type) {
    case "paragraph":
    case "heading":
      return [inline(node)];
    case "blockquote": {
      const hName = node.data?.hName;
      if (hName === EL.mythFace) {
        const label = node.data?.hProperties?.side === "fact" ? "واقعیت" : "باور";
        const [first = "", ...rest] = blocksToPlain(node.children);
        return [`${label}: ${first}`, ...rest];
      }
      if (hName === EL.pullQuote) {
        const cite = node.data?.hProperties?.cite;
        return [...blocksToPlain(node.children), ...(typeof cite === "string" && cite ? [`— ${cite}`] : [])];
      }
      const title = hName === EL.callout || hName === EL.myth ? calloutTitle(node) : null;
      return [...(title ? [title] : []), ...blocksToPlain(node.children)];
    }
    case "list":
      return [node.children.map((item) => blocksToPlain(item.children).join(" ")).join("\n")];
    case "table":
      return [node.children.map((row) => row.children.map(inline).join(" | ")).join("\n")];
    case "code":
      return [node.value];
    case "leafDirective": {
      // Embeds are navigation, not text; an illustration keeps its caption.
      const caption = node.data?.hProperties?.caption;
      return node.data?.hName === EL.illustration && typeof caption === "string" ? [caption] : [];
    }
    case "containerDirective":
      return blocksToPlain(node.children);
    default:
      return [];
  }
}

/** The text a reader sees, block by block (paragraphs separated by a blank line, list items by a line break). */
export function markdownToPlain(markdown: string): string {
  const { tree } = parseMarkdown(markdown);
  return blocksToPlain(tree.children).join("\n\n");
}

/* ------------------------------------------------------------------ */
/* Portable Markdown (llms-full.txt, /mag/x.md)                         */
/* ------------------------------------------------------------------ */

export type StripOptions = {
  /** Keep `{#id}` heading suffixes (useful when the output is re-parsed by this pipeline). */
  keepAnchors?: boolean;
  /**
   * What to do with `product:` / `post:` … links: `"path"` (default) maps them to site paths,
   * a function maps that path further (e.g. to an absolute URL), `"keep"` leaves them.
   */
  links?: "keep" | "path" | ((path: string) => string);
  /** Markdown that replaces a leaf block (`::product{…}`); return null (the default) to remove it. */
  leaf?: (name: string, attributes: Record<string, string>) => string | null;
};

const FENCE = /^\s*(```|~~~)/;
const LEAF_LINE = /^\s*::([a-z][\w-]*)(?:\[[^\]]*\])?(?:\{(.*)\})?\s*$/;
const CONTAINER_LINE = /^\s*:::(?:[a-z][\w-]*.*)?\s*$/;
const CALLOUT_LINE = /^(\s*>\s*)\[!([A-Za-z]+)\][ \t]*(.*)$/;
const ANCHOR_SUFFIX = /[ \t]*\{#[^}]*\}[ \t]*$/;
const HEADING_LINE = /^\s{0,3}#{1,6}\s/;
const INLINE_LINK = /\]\(\s*([^)\s]+)((?:\s+"[^"]*")?)\s*\)/g;
const REFERENCE_DEFINITION = /^(\s{0,3}\[[^\]]+\]:\s*)(\S+)(.*)$/;
const ATTRIBUTE = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s"'}]+))/g;

function directiveAttributes(raw: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of (raw ?? "").matchAll(ATTRIBUTE)) out[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
  return out;
}

/**
 * Body Markdown without the Choobz-only syntax, for agents and feeds: leaf blocks removed (or
 * replaced via `leaf`), `:::` fences dropped with their content kept, callout markers turned
 * into a bold title line, `{#id}` suffixes removed and site links resolved.
 */
export function stripDirectives(markdown: string, options: StripOptions = {}): string {
  const { keepAnchors = false, links = "path", leaf } = options;
  const mapLink = (href: string) => {
    if (links === "keep") return href;
    const resolved = resolveHref(href);
    if (typeof links === "function" && resolved.startsWith("/")) return links(resolved);
    return resolved;
  };

  const out: string[] = [];
  let inCode = false;
  for (const line of markdown.split("\n")) {
    if (FENCE.test(line)) inCode = !inCode;
    if (inCode || FENCE.test(line)) {
      out.push(line);
      continue;
    }

    const block = LEAF_LINE.exec(line);
    if (block) {
      const replacement = leaf?.(block[1], directiveAttributes(block[2])) ?? null;
      if (replacement != null) out.push(replacement);
      continue;
    }
    if (CONTAINER_LINE.test(line)) continue;

    let text = line;
    const callout = CALLOUT_LINE.exec(text);
    if (callout) {
      const marker = callout[2].toUpperCase();
      const kind = CALLOUT_MARKERS[marker] ?? CALLOUT_ALIASES[marker] ?? "note";
      text = `${callout[1]}**${callout[3].trim() || CALLOUT_LABELS[kind]}**`;
    }
    if (!keepAnchors && HEADING_LINE.test(text)) text = text.replace(ANCHOR_SUFFIX, "");
    text = text.replace(INLINE_LINK, (_, href: string, title: string) => `](${mapLink(href)}${title})`);
    const definition = REFERENCE_DEFINITION.exec(text);
    if (definition) text = `${definition[1]}${mapLink(definition[2])}${definition[3]}`;
    out.push(text);
  }
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
