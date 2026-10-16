/*
 * پنل‌های شش‌ضلعی صعود — a set of three 18 mm birch-ply hexagons, each
 * 690 vertex to vertex × 600 flat to flat × 80 deep with its holds
 * (products.json `climbing-hex-panels`).
 *
 * The drawing shows the set as it is usually hung: a honeycomb cluster on the
 * wall, 50 mm apart, the lowest panel at the floor. Every panel carries five
 * rounded wooden holds; behind it, four screws through spacers hold it off the
 * wall (the side elevation shows them). Depth: holds 47 + panel 18 + spacer
 * 15 = 80. The product's dimensions are per panel, so the dimension lines
 * annotate single panels: the width under the lower left one, the height
 * beside the right one.
 */

import { circle, grainLines, joinPaths, nums, roundedPolygon } from "../project";
import type { Manifest, Part, Vec2, Vec3 } from "./types";

const HEX_W = 690; // vertex to vertex (x)
const HEX_H = 600; // flat to flat (y)
const T = 18;
const HOLD_D = 47;
const SPACER = 15;
const D = HOLD_D + T + SPACER;
const GAP = 50;

const hexOutline = roundedPolygon(
  [
    [0, HEX_H / 2],
    [HEX_W / 4, 0],
    [(3 * HEX_W) / 4, 0],
    [HEX_W, HEX_H / 2],
    [(3 * HEX_W) / 4, HEX_H],
    [HEX_W / 4, HEX_H],
  ],
  14,
);

/* Honeycomb neighbours: straight up, and across the upper-right edge (offset along its normal). */
const edgeNormal: Vec2 = (() => {
  const dx = HEX_H / 2;
  const dy = HEX_W / 4;
  const len = Math.hypot(dx, dy);
  return [dx / len, dy / len];
})();
const PANELS = {
  a: [0, 0],
  b: [(3 * HEX_W) / 4 + GAP * edgeNormal[0], HEX_H / 2 + GAP * edgeNormal[1]],
  c: [0, HEX_H + GAP],
} as const satisfies Record<string, Vec2>;
type PanelKey = keyof typeof PANELS;
const PANEL_KEYS = Object.keys(PANELS) as PanelKey[];

/** Closed Catmull-Rom curve through points around (0, 0): an organic, rounded hold. */
function blob(points: readonly Vec2[]): string {
  const n = points.length;
  const p = (i: number) => points[(i + n) % n];
  let d = `M${nums(p(0))}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1: Vec2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Vec2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${nums([...c1, ...c2, ...p2])}`;
  }
  return `${d}Z`;
}

/** Points on a wobbly ellipse: `radii` are relative radii at evenly spaced angles. */
const ring = (rx: number, ry: number, radii: readonly number[], turn = 0): Vec2[] =>
  radii.map((k, i) => {
    const a = turn + (i / radii.length) * 2 * Math.PI;
    return [rx * k * Math.cos(a), ry * k * Math.sin(a)];
  });

const HOLD_SHAPES = [
  blob(ring(68, 50, [1, 0.92, 1.06, 0.88, 1, 0.9])), // pebble
  blob(ring(78, 40, [1, 0.8, 1.15, 1, 0.75, 1.1], 0.4)), // bean
  blob(ring(54, 54, [1, 0.86, 1, 0.86, 1, 0.86], Math.PI / 2)), // rounded triangle
  blob(ring(60, 45, [1.05, 0.95, 0.9, 1.1, 0.95, 0.85], -0.3)), // knuckle
  blob(ring(48, 40, [1, 0.95, 1, 0.95, 1, 0.95])), // button
] as const;

/* Hold layouts (panel-local mm, centres) — the same five holds, set differently on each panel. */
const LAYOUTS: Record<PanelKey, readonly Vec2[]> = {
  a: [
    [180, 170],
    [470, 130],
    [330, 330],
    [170, 450],
    [520, 420],
  ],
  b: [
    [200, 140],
    [500, 200],
    [320, 360],
    [480, 470],
    [180, 440],
  ],
  c: [
    [470, 160],
    [190, 200],
    [360, 330],
    [520, 450],
    [210, 470],
  ],
};

/* Wall screws, each through a spacer. */
const SCREWS: readonly Vec2[] = [
  [HEX_W / 2, 70],
  [HEX_W / 2, HEX_H - 70],
  [110, HEX_H / 2],
  [HEX_W - 110, HEX_H / 2],
];
const screwHeads = joinPaths(...SCREWS.map(([x, y]) => circle(x, y, 4)));

/* On the sheet the three hexagons nest as a honeycomb zigzag, 20 mm apart (sheet mm, y down). */
const NEST = [(3 * HEX_W) / 4 + 20 * edgeNormal[0], HEX_H / 2 + 20 * edgeNormal[1]] as const;
const SHEET_AT: Record<PanelKey, { x: number; y: number }> = {
  a: { x: 40, y: 40 },
  b: { x: 40 + NEST[0], y: 40 + NEST[1] },
  c: { x: 40 + 2 * NEST[0], y: 40 },
};

const panelGrain = grainLines([
  [90, 140, 600, 150, 5],
  [40, 300, 650, 290, -6],
  [110, 470, 580, 462, 4],
]);

function panelParts(key: PanelKey, order: number): Part[] {
  const [px, py] = PANELS[key];
  const panel: Part = {
    id: `panel-${key}`,
    kind: "panel",
    plane: "XY",
    origin: [px, py, HOLD_D],
    t: T,
    outline: hexOutline,
    grain: panelGrain,
    details: [{ d: screwHeads, fill: "ply-2" }],
    sheetAt: SHEET_AT[key],
    order,
  };
  const holds: Part[] = LAYOUTS[key].map(([hx, hy], i) => ({
    id: `hold-${key}-${i + 1}`,
    kind: "extrusion",
    origin: [px + hx, py + hy, 0] as Vec3,
    depth: HOLD_D,
    profile: HOLD_SHAPES[i],
    band: "wood",
    strata: 1,
    // Above every panel, so the holds stay in front when the exploded view pulls them off.
    order: 4,
  }));
  const spacers: Part[] = SCREWS.map(([sx, sy], i) => ({
    id: `spacer-${key}-${i + 1}`,
    kind: "rod",
    from: [px + sx, py + sy, HOLD_D + T] as Vec3,
    to: [px + sx, py + sy, D] as Vec3,
    d: 40,
    only: ["ortho"],
    order: 0,
  }));
  return [...spacers, panel, ...holds];
}

const holdIds = PANEL_KEYS.flatMap((key) => LAYOUTS[key].map((_, i) => `hold-${key}-${i + 1}`));
const FORWARD: Vec3 = [0, 0, -260];

const climbingHex = {
  key: "climbing-hex",
  source: "measured",
  size: { w: PANELS.b[0] + HEX_W, h: PANELS.c[1] + HEX_H, d: D },
  parts: [...panelParts("c", 1), ...panelParts("b", 2), ...panelParts("a", 3)],
  exploded: Object.fromEntries(holdIds.map((id) => [id, FORWARD])),
  dowels: PANEL_KEYS.flatMap((key) =>
    [0, 2].map((i) => {
      const [hx, hy] = LAYOUTS[key][i];
      const [px, py] = PANELS[key];
      return { at: [px + hx, py + hy, HOLD_D] as Vec3, part: `hold-${key}-${i + 1}` };
    }),
  ),
  sheet: { w: 2440, h: 1220, t: T },
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: HEX_W },
    { key: "heightCm", axis: "h", from: PANELS.b[1], to: PANELS.b[1] + HEX_H },
    { key: "depthCm", axis: "d", from: 0, to: D },
  ],
} satisfies Manifest;

export default climbingHex;
