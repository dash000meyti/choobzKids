import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { EL } from "../elements";
import { report } from "../issues";
import type { PipelineContext } from "../types";

/*
 * GFM task lists → printable checklists (DESIGN.md §7.3 «Checklist»). Item indexes run on
 * across every list of the body, 1-based, so each tick has a stable storage key
 * `cz.check.{slug}.{index}`. Items are forced tight so their text can sit inside a <label>.
 */
export const remarkChecklists: Plugin<[PipelineContext], Root> = (ctx) => (tree) => {
  let index = 0;
  visit(tree, "list", (list) => {
    const tasks = list.children.filter((item) => typeof item.checked === "boolean").length;
    if (!tasks) return;
    if (tasks !== list.children.length) {
      report(ctx, "warning", "checklist-mixed", "a list mixes task items «- [ ]» with plain items; rendered as a plain list", list);
      return;
    }
    const first = index + 1;
    const preticked: number[] = [];
    list.spread = false;
    for (const item of list.children) {
      index += 1;
      if (item.checked) preticked.push(index);
      item.data = { ...item.data, hName: EL.check, hProperties: { index, ticked: item.checked === true } };
      item.checked = null; // the element renders its own checkbox
      item.spread = false;
    }
    list.data = {
      ...list.data,
      hName: EL.checklist,
      hProperties: { slug: ctx.slug ?? "page", first, count: list.children.length, preticked: preticked.join(",") },
    };
  });
};
