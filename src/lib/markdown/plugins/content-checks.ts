import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { report } from "../issues";
import type { PipelineContext } from "../types";

/*
 * Typing rules from docs/CONTENT-FORMAT.md that a renderer cannot fix silently: Persian ی/ک
 * (never Arabic ي/ك), no typed kashida «ـ», Persian digits in prose (Latin digits are fine
 * inside Latin names such as «EN 71» and in code). Warnings only; one per rule and line.
 */

const ARABIC_LETTERS = /[يك]/;
const KASHIDA = /ـ/;
const LATIN_NAME = /[A-Za-z][A-Za-z0-9]*(?:[ '’./&+-]+[A-Za-z0-9]+)*/g;
const LATIN_DIGIT = /[0-9]/;

export const remarkContentChecks: Plugin<[PipelineContext], Root> = (ctx) => (tree) => {
  const seen = new Set<string>();
  const once = (code: string, message: string, node: Parameters<typeof report>[4]) => {
    const key = `${code}:${node?.position?.start.line ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    report(ctx, "warning", code, message, node);
  };

  visit(tree, "text", (node) => {
    if (ARABIC_LETTERS.test(node.value)) once("arabic-letters", "Arabic ي/ك in text; use Persian ی/ک", node);
    if (KASHIDA.test(node.value)) once("kashida", "typed kashida «ـ» in text", node);
    const outsideNames = node.value.replace(LATIN_NAME, "");
    const digit = LATIN_DIGIT.exec(outsideNames);
    if (digit) {
      const around = outsideNames.slice(Math.max(0, digit.index - 12), digit.index + 12).trim();
      once("latin-digits", `Latin digits in prose («…${around}…»); write Persian digits`, node);
    }
  });
};
