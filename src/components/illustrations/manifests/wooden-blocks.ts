/*
 * مکعب‌های ساختنی چوبی — 32 laminated birch blocks in 6 shapes on a 40 mm unit,
 * and their open storage box, 330 × 250 × 100 mm (products.json `wooden-blocks`).
 *
 * The box is 12 mm ply: full-width front and back, end panels with stadium
 * hand-holes between them, and an inset bottom. Columns and standing
 * rectangles line its back like a skyline; in front of it stand a little
 * arch–rectangle–half-circle stack and a triangle ramp leaning on a cube, so
 * all six shapes show. The dimension drawing keeps only the box and one cube.
 */

import { grainLines, nums, roundedPolygon, rrect, stadium } from "../project";
import type { ExtrusionPart, Manifest, Vec3 } from "./types";

const U = 40; // the unit
const BW = 330;
const BD = 250;
const BH = 100;
const T = 12;
const INNER_D = BD - 2 * T;

/* Block profiles, in the XY plane of a block extruded 40 mm along z. */
const cube = rrect(0, 0, U, U, 3);
const column = rrect(0, 0, U, 4 * U, 3); // standing
const standingRect = rrect(0, 0, U, 2 * U, 3);
const rect = rrect(0, 0, 2 * U, U, 3);
const triangle = roundedPolygon(
  [
    [0, 0],
    [U, 0],
    [U, U],
  ],
  3,
);

/** Two units long with a half-circle (r = 20) cut from its underside; quarter arcs keep the curve exact. */
const arch = (() => {
  const p = (x: number, y: number) => nums([x, y]);
  const r = U / 2;
  return (
    `M${p(3, 0)}H${U / 2}A${r} ${r} 0 0 0 ${p(U, r)}A${r} ${r} 0 0 0 ${p(1.5 * U, 0)}` +
    `H${2 * U - 3}A3 3 0 0 1 ${p(2 * U, 3)}V${U - 3}A3 3 0 0 1 ${p(2 * U - 3, U)}H3A3 3 0 0 1 ${p(0, U - 3)}V3A3 3 0 0 1 ${p(3, 0)}Z`
  );
})();

/** Half a disc of radius 40 on its flat side. */
const halfCircle = (() => {
  const p = (x: number, y: number) => nums([x, y]);
  return `M${p(0, 0)}H${2 * U}A${U} ${U} 0 0 1 ${p(U, U)}A${U} ${U} 0 0 1 ${p(0, 0)}Z`;
})();

/** The block shapes, for drawings that show a few blocks (the Montessori shelf's toys). */
export const blockShapes = { unit: U, cube, column, standingRect, rect, triangle, arch, halfCircle } as const;

/** A laminated block, extruded 40 mm along z; four strata stand for its glued layers. */
function block(id: string, profile: string, at: Vec3, order: number, extra: Partial<ExtrusionPart> = {}): ExtrusionPart {
  return { id, kind: "extrusion", origin: at, depth: U, profile, strata: 4, order, ...extra };
}

/* The skyline along the back of the box, drawn right to left so each block covers its neighbour's hidden side. */
const SKY_Z = BD - T - U - 8;
const skyline = [
  { profile: standingRect, x: 274 },
  { profile: column, x: 234 },
  { profile: standingRect, x: 194 },
  { profile: standingRect, x: 154 },
  { profile: column, x: 114 },
  { profile: column, x: 74 },
  { profile: standingRect, x: 34 },
].map(({ profile, x }, i) => block(`box-block-${i + 1}`, profile, [x, T, SKY_Z], 4 + i, { hideIn: ["ortho"] }));

/* In front of the box: the stack at its right end, the ramp and cube beside it. */
const FRONT_Z = -90;
const STACK_X = BW - 100;
const CUBE_X = BW + 50;

const endGrain = grainLines([
  [20, 24, 206, 28, 2],
  [24, 50, 90, 52, 1],
]);

const woodenBlocks = {
  key: "wooden-blocks",
  source: "measured",
  size: { w: CUBE_X + U, h: 4 * U + T, d: BD - FRONT_Z },
  sheet: { w: 1220, h: 610, t: T },
  parts: [
    {
      id: "box-back",
      kind: "panel",
      plane: "XY",
      origin: [0, 0, BD - T],
      t: T,
      outline: rrect(0, 0, BW, BH, 4),
      order: 1,
    },
    {
      id: "box-end-r",
      kind: "panel",
      plane: "YZ",
      origin: [BW - T, 0, T],
      t: T,
      outline: rrect(0, 0, INNER_D, BH, 3),
      holes: stadium([90, 74], [136, 74], 22),
      order: 2,
    },
    {
      id: "box-bottom",
      kind: "panel",
      plane: "XZ",
      origin: [T, 0, T],
      t: T,
      outline: rrect(0, 0, BW - 2 * T, INNER_D, 2),
      // Out of sight inside the box from every side: only the sheet shows it.
      only: ["flat"],
      order: 3,
    },
    ...skyline,
    block("arch", arch, [STACK_X, 0, FRONT_Z], 40, { hideIn: ["ortho"] }),
    block("rectangle", rect, [STACK_X, U, FRONT_Z], 41, { hideIn: ["ortho"] }),
    block("half-circle", halfCircle, [STACK_X, 2 * U, FRONT_Z], 42, { hideIn: ["ortho"] }),
    {
      id: "box-end-l",
      kind: "panel",
      plane: "YZ",
      origin: [0, 0, T],
      t: T,
      outline: rrect(0, 0, INNER_D, BH, 3),
      holes: stadium([90, 74], [136, 74], 22),
      grain: endGrain,
      order: 30,
    },
    {
      id: "box-front",
      kind: "panel",
      plane: "XY",
      origin: [0, 0, 0],
      t: T,
      outline: rrect(0, 0, BW, BH, 4),
      grain: grainLines([
        [24, 26, 306, 30, 2],
        [30, 70, 300, 66, -2],
      ]),
      order: 31,
    },
    block("cube", cube, [CUBE_X, 0, FRONT_Z], 43),
    block("triangle", triangle, [CUBE_X - U, 0, FRONT_Z], 44, { hideIn: ["ortho"] }),
  ],
  exploded: {
    ...Object.fromEntries(skyline.map((b) => [b.id, [0, 130, 0] as Vec3])),
    rectangle: [0, 45, 0],
    "half-circle": [0, 90, 0],
    cube: [60, 0, 0],
  },
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: BW },
    { key: "depthCm", axis: "d", from: 0, to: BD },
    { key: "heightCm", axis: "h", from: 0, to: BH, view: "side" },
    { key: "extra.واحد پایه", axis: "w", from: CUBE_X, to: CUBE_X + U },
  ],
} satisfies Manifest;

export default woodenBlocks;
