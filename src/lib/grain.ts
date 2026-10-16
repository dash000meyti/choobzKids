import { fnv1a } from "./utils";

/*
 * Slug-seeded wood-grain board selection (DESIGN.md §3.1):
 * 12 tiles × 2 flips × 4 offsets = 96 boards, so neighbouring cards rarely share one.
 */
export function grainFor(slug: string) {
  const h = fnv1a(slug);
  return { index: h % 12, flip: (h >>> 4) & 1 ? -1 : 1, offset: ((h >>> 5) % 4) * 25 };
}

/** CSS custom properties consumed by the `.grain` pseudo-element. */
export function grainStyle(slug: string): Record<string, string> {
  const g = grainFor(slug);
  return {
    "--grain": `url("/textures/grain-${String(g.index).padStart(2, "0")}.svg")`,
    "--grain-x": `${g.offset}%`,
    "--grain-flip": String(g.flip),
  };
}
