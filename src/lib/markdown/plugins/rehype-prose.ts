import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import { toString } from "hast-util-to-string";
import type { Plugin } from "unified";
import { EL } from "../elements";

/*
 * The hast pass that shapes a body for reading (SEO.md §4.3–4.4, DESIGN.md §7.3):
 *  - «جدول:» captions move into their table; header cells get scope="col", the first cell of
 *    every row becomes <th scope="row">, every cell carries data-label (stacked cards < 600px),
 *    a column whose header names «چوبز» is flagged for its mustard band;
 *  - each H2 and what follows it becomes <section aria-labelledby="{h2 id}">;
 *  - headings above a checklist are kept when only the checklist is printed;
 *  - Latin runs become <bdi lang="en" dir="ltr"> islands (FONTS.md §7.1).
 */

const CHOOBZ = /چوبز/;
/*
 * A Latin word, then more words joined by one space, an apostrophe, a dot or a hyphen, or by
 * « / », «&», «+». It must end on a letter or digit, so sentence punctuation stays in the
 * Persian flow (a trailing dot inside the island would show on the wrong side).
 */
const LATIN_RUN = /[A-Za-z][A-Za-z0-9]*(?:(?: ?[/&+] ?|[ '’.-])[A-Za-z0-9]+)*/g;
const NO_ISLANDS = new Set(["code", "pre", "bdi", "kbd", "samp", "script", "style"]);
const HEADINGS = new Set(["h2", "h3", "h4"]);

const isElement = (node: RootContent | ElementContent | undefined, tagName?: string): node is Element =>
  node?.type === "element" && (tagName === undefined || node.tagName === tagName);

const isWhitespace = (node: RootContent | ElementContent) => node.type === "text" && !node.value.trim();

function elementChildren(node: Element, tagName: string): Element[] {
  return node.children.filter((child): child is Element => isElement(child, tagName));
}

function shapeTable(table: Element, caption: Element | null, sectionHeading: string | null) {
  const head = elementChildren(table, "thead")[0];
  const body = elementChildren(table, "tbody")[0];
  const headerCells = head ? elementChildren(head, "tr").flatMap((row) => elementChildren(row, "th")) : [];
  const labels = headerCells.map((cell) => toString(cell).trim());
  const choobzColumns = new Set(labels.flatMap((label, i) => (CHOOBZ.test(label) ? [i] : [])));

  headerCells.forEach((cell, i) => {
    delete cell.properties.align;
    cell.properties.scope = "col";
    if (choobzColumns.has(i)) cell.properties.dataChoobz = true;
  });

  for (const row of body ? elementChildren(body, "tr") : []) {
    row.children
      .filter((cell): cell is Element => isElement(cell) && (cell.tagName === "td" || cell.tagName === "th"))
      .forEach((cell, i) => {
        delete cell.properties.align;
        if (i === 0) {
          cell.tagName = "th";
          cell.properties.scope = "row";
        }
        if (labels[i]) cell.properties.dataLabel = labels[i];
        if (choobzColumns.has(i)) cell.properties.dataChoobz = true;
      });
  }

  if (caption) {
    table.children.unshift({ type: "element", tagName: "caption", properties: {}, children: caption.children });
    table.properties.label = toString(caption).trim();
  } else if (sectionHeading) {
    table.properties.labelledBy = sectionHeading;
  }
}

/** Walks a parent's children in order: captions + tables, remembering the latest heading id. */
function shapeTables(parent: Root | Element, state: { heading: string | null }) {
  const children = parent.children as (RootContent | ElementContent)[];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!isElement(child)) continue;
    if (HEADINGS.has(child.tagName) && typeof child.properties.id === "string") state.heading = child.properties.id;

    if (child.tagName === EL.caption) {
      let next = i + 1;
      while (next < children.length && isWhitespace(children[next])) next++;
      const table = children[next];
      if (isElement(table, "table")) {
        shapeTable(table, child, state.heading);
        // Drop the caption paragraph and the whitespace after it; the loop then steps past the table.
        children.splice(i, next - i);
      } else {
        child.tagName = "p";
      }
      continue;
    }
    if (child.tagName === "table") {
      shapeTable(child, null, state.heading);
      continue;
    }
    shapeTables(child, state);
  }
}

function containsTag(node: Element, tagName: string): boolean {
  return node.children.some((child) => isElement(child) && (child.tagName === tagName || containsTag(child, tagName)));
}

function wrapSections(tree: Root) {
  const out: RootContent[] = [];
  let section: Element | null = null;
  for (const child of tree.children) {
    const id = isElement(child, "h2") ? child.properties.id : undefined;
    if (typeof id === "string") {
      const opened: Element = { type: "element", tagName: "section", properties: { ariaLabelledBy: [id] }, children: [] };
      out.push(opened);
      section = opened;
    }
    if (section) section.children.push(child as ElementContent);
    else out.push(child);
  }
  tree.children = out;
}

/** Marks what a checklist-only print keeps: the heading right above each list and its section's H2. */
function markChecklistHeadings(parent: Root | Element) {
  const children = parent.children as (RootContent | ElementContent)[];
  children.forEach((child, i) => {
    if (!isElement(child)) return;
    if (child.tagName === EL.checklist) {
      let previous = i - 1;
      while (previous >= 0 && isWhitespace(children[previous])) previous--;
      const heading = children[previous];
      if (isElement(heading) && HEADINGS.has(heading.tagName)) heading.properties.dataPrintKeep = true;
      return;
    }
    if (child.tagName === "section" && containsTag(child, EL.checklist)) {
      const h2 = child.children.find((c) => isElement(c, "h2"));
      if (isElement(h2)) h2.properties.dataPrintKeep = true;
    }
    markChecklistHeadings(child);
  });
}

function latinIslands(parent: Root | Element) {
  const children = parent.children as (RootContent | ElementContent)[];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isElement(child)) {
      if (!NO_ISLANDS.has(child.tagName) && child.properties.lang === undefined) latinIslands(child);
      continue;
    }
    if (child.type !== "text") continue;

    const parts: ElementContent[] = [];
    let cursor = 0;
    for (const match of child.value.matchAll(LATIN_RUN)) {
      if (match.index > cursor) parts.push({ type: "text", value: child.value.slice(cursor, match.index) });
      const island: Text = { type: "text", value: match[0] };
      parts.push({ type: "element", tagName: "bdi", properties: { lang: "en", dir: "ltr" }, children: [island] });
      cursor = match.index + match[0].length;
    }
    if (!parts.length) continue;
    if (cursor < child.value.length) parts.push({ type: "text", value: child.value.slice(cursor) });
    children.splice(i, 1, ...parts);
    i += parts.length - 1;
  }
}

/** GFM task items that were not turned into a checklist still carry static checkboxes. */
function freezeStrayCheckboxes(parent: Root | Element) {
  for (const child of parent.children) {
    if (!isElement(child)) continue;
    if (child.tagName === "input" && child.properties.type === "checkbox") child.properties.readOnly = true;
    freezeStrayCheckboxes(child);
  }
}

export const rehypeProse: Plugin<[], Root> = () => (tree) => {
  shapeTables(tree, { heading: null });
  wrapSections(tree);
  markChecklistHeadings(tree);
  freezeStrayCheckboxes(tree);
  latinIslands(tree);
};
