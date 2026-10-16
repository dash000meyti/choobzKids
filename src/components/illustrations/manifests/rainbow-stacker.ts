/*
 * رنگین‌کمان چوبی — 360 × 180 × 70 mm, 12 nested arcs (products.json `rainbow-stacker`).
 *
 * Each arc is CNC-cut from a blank of four 18 mm birch sheets glued face to
 * face, so its curved edges show the laminations. Bands are 13.5 mm wide and
 * the smallest arc keeps an 18 mm hole. The natural finish alternates wood /
 * wood-top / honey faces so the twelve pieces read apart.
 *
 * Nested arcs touch, so each one hides its neighbours' curved edges; drawn in
 * full they would paint those edges over each other's faces. So a nest is
 * drawn as its outer arc in full, then its smallest arc in full (only the
 * inside of its hole stays uncovered), then flat faces for the arcs between.
 * Assembled, the twelve arcs are one nest. Exploded, they slide toward the
 * viewer in three nests of four, each clear of the one behind it.
 */

import { nums } from "../project";
import type { Detail, Manifest, Part, Vec3 } from "./types";

const W = 360;
const H = 180;
const D = 70;
const COUNT = 12;
const HOLE = 18;
const BAND = (H - HOLE) / COUNT;
const CX = W / 2;
const LAYERS = 4; // 4 × 18 mm sheets ≈ 70 mm
const PER_NEST = 4;
const PULL = 90; // exploded step between nests, deeper than an arc

/**
 * One arc standing on its flat feet: the ring between `outer` and `inner`
 * around (cx, 0), with fillets of radius `r` at the four foot corners (the
 * archBand shape). Each half-ring is written as two quarter arcs: an SVG arc
 * between two nearly opposite points loses its centre once the path is
 * rounded to 0.1 mm, and neighbouring arcs would no longer meet.
 */
export function standingArc(cx: number, outer: number, inner: number, r = 3): string {
  const at = (x: number, y: number) => nums([x, y]);
  const arc = (radius: number, x: number, y: number, sweep: 0 | 1) => `A${nums([radius, radius])} 0 0 ${sweep} ${at(x, y)}`;
  const fo = Math.sqrt((outer - r) ** 2 - r ** 2);
  const fi = Math.sqrt((inner + r) ** 2 - r ** 2);
  const ko = outer / (outer - r);
  const ki = inner / (inner + r);
  return (
    `M${at(cx - fo, 0)}${arc(r, cx - fo * ko, r * ko, 0)}${arc(outer, cx, outer, 0)}` +
    `${arc(outer, cx + fo * ko, r * ko, 0)}${arc(r, cx + fo, 0, 0)}` +
    `L${at(cx + fi, 0)}${arc(r, cx + fi * ki, r * ki, 0)}${arc(inner, cx, inner, 1)}` +
    `${arc(inner, cx - fi * ki, r * ki, 1)}${arc(r, cx - fi, 0, 0)}Z`
  );
}

/**
 * The seam between two nested arcs: an open half circle of radius `r` around
 * (cx, 0). A single arc is exact here as long as cx ± r are whole tenths.
 */
export function arcSeam(cx: number, r: number): string {
  return `M${nums([cx - r, 0])}A${nums([r, r])} 0 0 0 ${nums([cx + r, 0])}`;
}

type Arc = {
  readonly id: string;
  /** 1 = outermost. */
  readonly n: number;
  readonly outer: number;
  readonly profile: string;
  /** Exploded nest, 0 = the back one. */
  readonly nest: number;
  readonly role: "outer" | "middle" | "smallest";
};

const arcs: Arc[] = Array.from({ length: COUNT }, (_, i) => {
  const outer = H - i * BAND;
  const place = i % PER_NEST;
  return {
    id: `arc-${i + 1}`,
    n: i + 1,
    outer,
    profile: standingArc(CX, outer, outer - BAND),
    nest: Math.floor(i / PER_NEST),
    role: place === 0 ? "outer" : place === PER_NEST - 1 ? "smallest" : "middle",
  };
});

/**
 * Face tone, cycling wood → wood-top → honey from the outside in. `wood` is
 * the renderer's front; `wood-top` borrows the edge face, whose ply-1 fill is
 * the same light tone in both themes; honey is a ply-2 wash over the wood.
 */
function look(arc: Arc): { face?: "edge"; details?: readonly Detail[] } {
  const tone = (arc.n - 1) % 3;
  if (tone === 1) return { face: "edge" };
  if (tone === 2) return { details: [{ d: arc.profile, fill: "ply-2", opacity: 0.5 }] };
  return {};
}

const pull = (arc: Arc): Vec3 => [0, 0, -PULL * arc.nest];

/* Painter's order: nest by nest from the back; in each nest the outer arc, its smallest arc, then the faces. */
const orderOf = (arc: Arc, step: number) => arc.nest * 10 + step;

/** An arc as a solid. Listed smallest first, so the outer one paints last in the side elevation. */
function solidOf(arc: Arc): Part {
  // All twelve come out of one blank: concentric on the sheet, the way they are cut.
  const inset = H - arc.outer;
  return {
    id: arc.id,
    kind: "extrusion",
    origin: [0, 0, 0],
    depth: D,
    profile: arc.profile,
    strata: LAYERS,
    ...look(arc),
    // The outer arc of the whole rainbow is drawn in full everywhere; other nests' outer arcs only exploded.
    only: arc.n === 1 ? undefined : arc.role === "outer" ? ["exploded", "ortho", "flat"] : ["ortho", "flat"],
    order: orderOf(arc, 0),
    sheet: true,
    sheetAt: { x: 20 + inset, y: 20 + inset },
  };
}

const faceId = (arc: Arc) => `${arc.id}-face`;

/**
 * A nest's smallest arc in full under the faces, so its hole shows the inner
 * edge. The assembled copy moves with the arc's face on the layered stage.
 */
const depthOf = (arc: Arc, view: "assembled" | "exploded"): Part => ({
  id: `${arc.id}-${view}-depth`,
  kind: "extrusion",
  origin: [0, 0, 0],
  depth: D,
  profile: arc.profile,
  strata: LAYERS,
  only: [view],
  explodesAs: view === "assembled" ? faceId(arc) : undefined,
  order: view === "assembled" ? 1 : orderOf(arc, 1),
});

/**
 * A flat front face standing in for an arc inside a nest. Assembled, every arc
 * but the outermost is one; exploded, all but each nest's outer arc, which is
 * drawn in full there (and is what its assembled face moves with).
 */
const faceOf = (arc: Arc): Part => ({
  id: faceId(arc),
  kind: "panel",
  plane: "XY",
  origin: [0, 0, 0],
  t: 0,
  outline: arc.profile,
  ...look(arc),
  only: arc.role === "outer" ? ["assembled"] : ["assembled", "exploded"],
  explodesAs: arc.role === "outer" ? arc.id : undefined,
  sheet: false,
  order: orderOf(arc, 2),
});

const smallest = arcs[COUNT - 1];

/** Every part with the arc it belongs to, for the exploded offsets. */
const placed: (readonly [Part, Arc])[] = [
  ...[...arcs].reverse().map((arc) => [solidOf(arc), arc] as const),
  [depthOf(smallest, "assembled"), smallest],
  ...arcs.filter((a) => a.role === "smallest").map((a) => [depthOf(a, "exploded"), a] as const),
  ...arcs.slice(1).map((a) => [faceOf(a), a] as const),
];

const rainbowStacker = {
  key: "rainbow-stacker",
  source: "measured",
  size: { w: W, h: H, d: D },
  sheet: { w: W + 40, h: H + 50, t: D },
  parts: placed.map(([part]) => part),
  exploded: Object.fromEntries(placed.map(([part, arc]) => [part.id, pull(arc)])),
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: W },
    { key: "heightCm", axis: "h", from: 0, to: H },
    { key: "depthCm", axis: "d", from: 0, to: D },
  ],
} satisfies Manifest;

export default rainbowStacker;
