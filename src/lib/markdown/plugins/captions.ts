import type { Paragraph, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { EL } from "../elements";
import { report } from "../issues";
import type { PipelineContext } from "../types";

/*
 * Table captions (DESIGN.md §0.3 #11): a paragraph starting «جدول:» directly above a GFM table
 * is that table's <caption>. Here the paragraph is tagged and its prefix removed; the rehype
 * pass moves it inside the table. Tables without one are reported (SEO.md §4.3 wants captions).
 */

const PREFIX = /^\s*جدول\s*[:：]\s*/;

function isCaptionLine(node: Paragraph): boolean {
  const head = node.children[0];
  return head?.type === "text" && PREFIX.test(head.value);
}

export const remarkTableCaptions: Plugin<[PipelineContext], Root> = (ctx) => (tree) => {
  visit(tree, "paragraph", (node, index, parent) => {
    if (!isCaptionLine(node) || !parent || index === undefined) return;
    if (parent.children[index + 1]?.type !== "table") {
      report(ctx, "warning", "caption-orphan", "«جدول:» line is not directly above a table", node);
      return;
    }
    const head = node.children[0];
    if (head.type === "text") head.value = head.value.replace(PREFIX, "");
    node.data = { ...node.data, hName: EL.caption };
  });

  visit(tree, "table", (table, index, parent) => {
    const previous = parent && index !== undefined ? parent.children[index - 1] : undefined;
    if (previous?.type === "paragraph" && previous.data?.hName === EL.caption) return;
    report(ctx, "warning", "table-caption-missing", "table has no «جدول: …» caption line above it", table);
  });
};
