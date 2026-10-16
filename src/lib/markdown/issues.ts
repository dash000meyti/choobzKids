import type { Node } from "unist";
import type { IssueLevel, PipelineContext } from "./types";

export function report(ctx: PipelineContext, level: IssueLevel, code: string, message: string, node?: Node) {
  ctx.issues.push({ level, code, message, line: node?.position?.start.line });
}

/** The exact source text of a node (for restoring syntax the pipeline does not own). */
export function sourceOf(ctx: PipelineContext, node: Node): string | null {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  return start == null || end == null ? null : ctx.source.slice(start, end);
}
