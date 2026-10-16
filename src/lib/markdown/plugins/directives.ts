import type { List, ListItem, Root, RootContent, Text } from "mdast";
import type { ContainerDirective, LeafDirective, TextDirective } from "mdast-util-directive";
import { toString } from "mdast-util-to-string";
import type { Plugin } from "unified";
import type { Parent } from "unist";
import { SKIP, visit } from "unist-util-visit";
import { EL, ILLUSTRATION_KEYS, ILLUSTRATION_VIEWS } from "../elements";
import { report, sourceOf } from "../issues";
import type { PipelineContext } from "../types";

/*
 * Block directives (docs/CONTENT-FORMAT.md «Blocks», DESIGN.md §0.3 #11):
 *
 *   ::product{slug="pikler-triangle" why="…"}     → <cz-product>
 *   ::products{slugs="a,b,c"}                      → <cz-products>  (2–4 items)
 *   ::illustration{name="learning-tower" caption="…" view="exploded"} → <cz-illustration>
 *   :::steps  1. **عنوان** — توضیح …  :::          → <cz-steps> of <cz-step>
 *
 * Anything else is reported and dropped (leaf), unwrapped (container) or put back as plain text
 * (text directives, which are almost always an accidental «:word» in prose).
 */

type Directive = ContainerDirective | LeafDirective | TextDirective;

type AttrSpec = { required: readonly string[]; optional: readonly string[] };

const LEAF_SPECS: Record<string, AttrSpec> = {
  product: { required: ["slug"], optional: ["why"] },
  products: { required: ["slugs"], optional: [] },
  illustration: { required: ["name"], optional: ["caption", "view"] },
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STEP_LEAD_SEPARATOR = /^\s*[—–-]\s*/;
/** DESIGN.md §7.3: at most three product embeds per article. */
const MAX_EMBEDS = 3;

const isIllustrationKey = (value: string) => (ILLUSTRATION_KEYS as readonly string[]).includes(value);
const isIllustrationView = (value: string) => (ILLUSTRATION_VIEWS as readonly string[]).includes(value);

function attributes(node: Directive): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(node.attributes ?? {})) {
    if (typeof value === "string") out[key] = value.trim();
  }
  return out;
}

function checkAttributes(ctx: PipelineContext, node: Directive, spec: AttrSpec, attrs: Record<string, string>): boolean {
  let ok = true;
  for (const key of spec.required) {
    if (!attrs[key]) {
      report(ctx, "error", "directive-attr-missing", `::${node.name} needs ${key}="…"`, node);
      ok = false;
    }
  }
  for (const key of Object.keys(attrs)) {
    if (!spec.required.includes(key) && !spec.optional.includes(key)) {
      report(ctx, "warning", "directive-attr-unknown", `::${node.name} ignores the attribute "${key}"`, node);
    }
  }
  return ok;
}

/** `::product` / `::products` / `::illustration` → the element and its props, or null to drop it. */
function leafElement(ctx: PipelineContext, node: LeafDirective) {
  const spec = LEAF_SPECS[node.name];
  if (!spec) {
    report(ctx, "error", "directive-unknown", `unknown block ::${node.name}; removed`, node);
    return null;
  }
  const attrs = attributes(node);
  if (!checkAttributes(ctx, node, spec, attrs)) return null;

  if (node.name === "product") {
    if (!SLUG.test(attrs.slug)) {
      report(ctx, "error", "directive-attr-invalid", `::product slug "${attrs.slug}" is not a product slug`, node);
      return null;
    }
    return { hName: EL.product, hProperties: { slug: attrs.slug, ...(attrs.why ? { why: attrs.why } : {}) } };
  }

  if (node.name === "products") {
    const slugs = attrs.slugs.split(",").map((s) => s.trim()).filter(Boolean);
    const bad = slugs.filter((s) => !SLUG.test(s));
    if (bad.length) report(ctx, "error", "directive-attr-invalid", `::products has invalid slugs: ${bad.join(", ")}`, node);
    const good = [...new Set(slugs.filter((s) => SLUG.test(s)))];
    if (good.length < 2 || good.length > 4) {
      report(ctx, "warning", "directive-attr-invalid", `::products should list 2–4 products (has ${good.length})`, node);
    }
    return good.length ? { hName: EL.products, hProperties: { slugs: good.join(",") } } : null;
  }

  // illustration
  if (!isIllustrationKey(attrs.name)) {
    report(ctx, "error", "directive-attr-invalid", `::illustration name "${attrs.name}" is not a manifest key`, node);
    return null;
  }
  if (attrs.view && !isIllustrationView(attrs.view)) {
    report(ctx, "error", "directive-attr-invalid", `::illustration view "${attrs.view}" is not one of ${ILLUSTRATION_VIEWS.join("/")}`, node);
    delete attrs.view;
  }
  return { hName: EL.illustration, hProperties: { ...attrs } };
}

/** Pulls «**عنوان گام** —» off the front of a step and returns it as the step title. */
function takeStepTitle(item: ListItem): string | undefined {
  const lead = item.children[0];
  if (lead?.type !== "paragraph") return undefined;
  const strong = lead.children[0];
  if (strong?.type !== "strong") return undefined;
  const title = toString(strong).trim().replace(/[:：]$/, "");
  if (!title) return undefined;
  lead.children.shift();
  const next = lead.children[0];
  if (next?.type === "text") {
    next.value = next.value.replace(STEP_LEAD_SEPARATOR, "");
    if (!next.value) lead.children.shift();
  }
  if (!lead.children.length) item.children.shift();
  return title;
}

/** `:::steps` → <cz-steps>; returns false when the block is not a single ordered list. */
function buildSteps(ctx: PipelineContext, node: ContainerDirective, counter: { step: number }): boolean {
  const content = node.children.filter((child) => !(child.type === "paragraph" && child.data?.directiveLabel));
  const list = content[0];
  if (content.length !== 1 || list?.type !== "list" || !list.ordered) {
    report(ctx, "error", "steps-format", ":::steps must contain exactly one numbered list; shown as plain content", node);
    return false;
  }
  for (const item of (list as List).children) {
    counter.step += 1;
    const title = takeStepTitle(item);
    if (!title) report(ctx, "warning", "step-title-missing", `step ${counter.step} has no «**عنوان** —» lead`, item);
    item.data = { ...item.data, hName: EL.step, hProperties: { index: counter.step, ...(title ? { title } : {}) } };
  }
  // Bead numbers replace the list markers; role="list" keeps the list semantics in Safari.
  list.data = { ...list.data, hProperties: { ...list.data?.hProperties, role: "list" } };
  node.data = { ...node.data, hName: EL.steps, hProperties: { count: list.children.length } };
  node.children = [list];
  return true;
}

export const remarkDirectiveBlocks: Plugin<[PipelineContext], Root> = (ctx) => (tree) => {
  const counter = { step: 0 };
  let embeds = 0;
  let seenH2 = false;

  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 2) seenH2 = true;
    if (node.type === "leafDirective" && node.name === "product") {
      embeds += 1;
      if (!seenH2) report(ctx, "warning", "embed-early", "::product before the first H2 (embeds never sit in the first screen)", node);
    }
  }
  if (embeds > MAX_EMBEDS) report(ctx, "warning", "embed-limit", `${embeds} ::product embeds; at most ${MAX_EMBEDS} per body`);

  visit(tree, (node, index, parent: Parent | undefined) => {
    if (index === undefined || !parent) return;
    if (node.type !== "leafDirective" && node.type !== "containerDirective" && node.type !== "textDirective") return;
    const directive = node as Directive;

    if (directive.type === "textDirective") {
      report(ctx, "warning", "text-directive", `":${directive.name}" looks like a directive; kept as text`, directive);
      const text: Text = { type: "text", value: sourceOf(ctx, directive) ?? `:${directive.name}` };
      parent.children.splice(index, 1, text);
      return [SKIP, index + 1];
    }

    if (directive.type === "leafDirective") {
      const element = leafElement(ctx, directive);
      if (!element) {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
      directive.data = { ...directive.data, ...element };
      directive.children = [];
      return SKIP;
    }

    if (directive.name === "steps" && buildSteps(ctx, directive, counter)) return SKIP;
    if (directive.name !== "steps") report(ctx, "error", "directive-unknown", `unknown container :::${directive.name}; unwrapped`, directive);
    parent.children.splice(index, 1, ...(directive.children as RootContent[]));
    return index;
  });
};
