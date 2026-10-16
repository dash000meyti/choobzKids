import type { Blockquote, BlockContent, DefinitionContent, Paragraph, PhrasingContent, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { CALLOUT_ALIASES, CALLOUT_MARKERS, EL, type MythSide } from "../elements";
import { report } from "../issues";
import type { PipelineContext } from "../types";

/*
 * GitHub alert callouts (docs/CONTENT-FORMAT.md «Callouts»):
 *
 *   > [!WORKSHOP] از کارگاه چوبز        → <cz-callout kind="workshop" title="…">
 *   > [!MYTH] باور رایج                 → <cz-myth> with a «باور» face and a «واقعیت» face
 *   > **باور:** …
 *   > **واقعیت:** …
 *
 * Text after the marker on the same line is the title. A blockquote without a marker is a pull
 * quote; a last line starting with «—» names the speaker.
 */

type Flow = BlockContent | DefinitionContent;

const MARKER = /^\[!([A-Za-z]+)\][ \t]*/;


const MYTH_LABEL = /^(باور(?:\s+رایج)?|واقعیت)\s*[:：]?$/;
const CITE_LINE = /^[—―–]\s*/;

function paragraph(children: PhrasingContent[]): Paragraph {
  return { type: "paragraph", children };
}

/** Splits the marker paragraph at its first line break: the title line, then the rest. */
function splitTitleLine(first: Paragraph): { title: string; rest: PhrasingContent[] } {
  const titleNodes: PhrasingContent[] = [];
  const rest: PhrasingContent[] = [];
  let inTitle = true;
  for (const child of first.children) {
    if (!inTitle) {
      rest.push(child);
    } else if (child.type === "break") {
      inTitle = false;
    } else if (child.type === "text" && child.value.includes("\n")) {
      const cut = child.value.indexOf("\n");
      const before = child.value.slice(0, cut);
      const after = child.value.slice(cut + 1);
      if (before) titleNodes.push({ type: "text", value: before });
      if (after) rest.push({ type: "text", value: after });
      inTitle = false;
    } else {
      titleNodes.push(child);
    }
  }
  return { title: toString(paragraph(titleNodes)).trim(), rest };
}

function isBlank(nodes: PhrasingContent[]): boolean {
  return nodes.every((n) => (n.type === "text" ? !n.value.trim() : n.type === "break"));
}

function trimEdges(nodes: PhrasingContent[]): PhrasingContent[] {
  const out = [...nodes];
  while (out[0]?.type === "break") out.shift();
  while (out.at(-1)?.type === "break") out.pop();
  const first = out[0];
  if (first?.type === "text") out[0] = { ...first, value: first.value.replace(/^\s+/, "") };
  const last = out.at(-1);
  if (last?.type === "text") out[out.length - 1] = { ...last, value: last.value.replace(/\s+$/, "") };
  return out.filter((n) => n.type !== "text" || n.value !== "");
}

function mythLabel(node: PhrasingContent): MythSide | null {
  if (node.type !== "strong") return null;
  const match = MYTH_LABEL.exec(toString(node).trim());
  if (!match) return null;
  return match[1] === "واقعیت" ? "fact" : "belief";
}

/**
 * Sorts the myth body into its two faces. The «**باور:**» / «**واقعیت:**» labels may start any
 * line, also inside one paragraph (soft line breaks); they are removed because the faces print
 * their own labels. Returns null when either face is missing.
 */
function splitMyth(body: Flow[]): Record<MythSide, Flow[]> | null {
  const faces: Record<MythSide, Flow[]> = { belief: [], fact: [] };
  const seen = new Set<MythSide>();
  let side: MythSide = "belief";

  for (const block of body) {
    if (block.type !== "paragraph") {
      faces[side].push(block);
      continue;
    }
    let segment: PhrasingContent[] = [];
    const flush = () => {
      const trimmed = trimEdges(segment);
      if (!isBlank(trimmed)) faces[side].push(paragraph(trimmed));
      segment = [];
    };
    for (const child of block.children) {
      const label = mythLabel(child);
      if (label) {
        flush();
        side = label;
        seen.add(label);
      } else {
        segment.push(child);
      }
    }
    flush();
  }
  return seen.has("fact") && faces.belief.length && faces.fact.length ? faces : null;
}

/** «— نام» as the last line of a pull quote → the cited speaker. */
function takeCite(node: Blockquote): string | undefined {
  const last = node.children.at(-1);
  if (last?.type !== "paragraph") return undefined;
  const text = last.children.at(-1);
  if (last.children.length === 1 && text?.type === "text" && CITE_LINE.test(text.value)) {
    node.children.pop();
    return text.value.replace(CITE_LINE, "").trim();
  }
  // The speaker on the last line of the quote's own paragraph.
  if (text?.type === "text") {
    const cut = text.value.lastIndexOf("\n");
    const tail = text.value.slice(cut + 1);
    if (cut >= 0 && CITE_LINE.test(tail)) {
      text.value = text.value.slice(0, cut);
      return tail.replace(CITE_LINE, "").trim();
    }
  }
  return undefined;
}

export const remarkCallouts: Plugin<[PipelineContext], Root> = (ctx) => (tree) => {
  visit(tree, "blockquote", (node) => {
    if (node.data?.hName) return; // a myth face built below

    const first = node.children[0];
    const head = first?.type === "paragraph" ? first.children[0] : undefined;
    const marker = head?.type === "text" ? MARKER.exec(head.value) : null;

    if (!marker || first?.type !== "paragraph" || head?.type !== "text") {
      const cite = takeCite(node);
      node.data = { ...node.data, hName: EL.pullQuote, hProperties: cite ? { cite } : {} };
      return;
    }

    const type = marker[1].toUpperCase();
    let kind = CALLOUT_MARKERS[type] ?? CALLOUT_ALIASES[type];
    if (!kind) {
      report(ctx, "error", "callout-unknown", `unknown callout type [!${marker[1]}]; rendered as NOTE`, node);
      kind = "note";
    } else if (CALLOUT_ALIASES[type]) {
      report(ctx, "warning", "callout-alias", `[!${type}] is not a Choobz callout; rendered as ${kind.toUpperCase()}`, node);
    }

    head.value = head.value.slice(marker[0].length);
    const { title, rest } = splitTitleLine(first);
    const body: Flow[] = [...(isBlank(rest) ? [] : [paragraph(trimEdges(rest))]), ...node.children.slice(1)];

    if (kind === "myth") {
      const faces = splitMyth(body);
      if (faces) {
        node.data = { ...node.data, hName: EL.myth, hProperties: title ? { title } : {} };
        node.children = (["belief", "fact"] as const).map(
          (side): Blockquote => ({
            type: "blockquote",
            data: { hName: EL.mythFace, hProperties: { side } },
            children: faces[side],
          }),
        );
        return;
      }
      report(ctx, "error", "myth-format", "[!MYTH] needs a «**باور:**» line and a «**واقعیت:**» line; rendered as NOTE", node);
      kind = "note";
    }

    if (!body.length) report(ctx, "warning", "callout-empty", `[!${type}] callout has no body`, node);
    node.data = { ...node.data, hName: EL.callout, hProperties: { kind, ...(title ? { title } : {}) } };
    node.children = body;
  });
};
