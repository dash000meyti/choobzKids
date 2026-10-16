/*
 * رول نقاشی دیواری — 620 wide × 850 high × 120 deep, 15 mm birch ply
 * (products.json `wall-art-roll`).
 *
 * A backboard screwed to the wall (four screws), two holder arms at the top
 * carrying a Ø20 wooden axle through a 450 mm paper roll Ø80, the paper
 * pulled down over the board and under a wooden tear bar (no blade), and an
 * 80 mm-deep tool ledge with a lip and end cheeks at the bottom. The holder
 * arms are the front-most parts (z = 0); the wall is z = 120. Three crayons
 * lie on the ledge in the assembled view (not part of the product).
 *
 * Rods are always drawn wood-toned, so the roll is a circular prism (a YZ
 * panel 450 thick). Like any thin profile swept far, the renderer leaves its
 * body hollow; in the oblique views its own details repaint it in paper: the
 * swept body, the true outline, then the near end with its cardboard core.
 */

import { OBLIQUE_DX, OBLIQUE_DY, circle, grainLines, joinPaths, nums, roundedPolygon, rrect } from "../project";
import type { Detail, Manifest, Part, Tone, Vec2, Vec3 } from "./types";

const W = 620;
const H = 850;
const D = 120;
const T = 15;
const WALL_FACE = D - T; // front face of the backboard

/* Paper roll and its axle. */
const ROLL = { x0: 85, x1: 535, d: 80, core: 36 } as const;
const AXLE: Vec2 = [53, 775]; // (z, y): roll clears the board by 12 mm, holder arm reaches z = 0
const AXLE_D = 20;
const HOLDER_X = [62, W - 62 - T] as const;
const HOLDER_R = AXLE[0];

/* Paper path: off the back of the roll, down the board, under the tear bar. */
const PAPER_Z = WALL_FACE - 4;
const PAPER_BOTTOM = 205;
const BAR = { x: 70, y: 235, w: W - 140, h: 40 } as const;

/* Tool ledge: top at 150, 80 deep between the lip and the board. */
const LEDGE_TOP = 150;
const LEDGE_Z = [25, WALL_FACE] as const;
const LIP_Z = 10;

const boardOutline = roundedPolygon(
  [
    [0, 0],
    [W, 0],
    [W, H],
    [0, H],
  ],
  [12, 12, 40, 40],
);
const boardGrain = grainLines([
  [36, 40, 40, 700, 5],
  [584, 60, 580, 720, -5],
  [52, 300, 48, 810, -3],
]);
const wallScrews = joinPaths(
  ...[
    [30, 60],
    [W - 30, 60],
    [30, 805],
    [W - 30, 805],
  ].map(([x, y]) => circle(x, y, 5)),
);

/** Holder arm in (u = z, v = y): square against the board, a half round around the axle at the front. */
const holderOutline = roundedPolygon(
  [
    [0, AXLE[1] - HOLDER_R],
    [WALL_FACE, AXLE[1] - HOLDER_R],
    [WALL_FACE, AXLE[1] + HOLDER_R],
    [0, AXLE[1] + HOLDER_R],
  ],
  [HOLDER_R, 3, 3, HOLDER_R],
);
const axleHole = circle(AXLE[0], AXLE[1], AXLE_D / 2);

/* ---- The roll's oblique repaint, in its near end's frame (YZ at x = ROLL.x0: u = z, v = y). ---- */

const R = ROLL.d / 2;
const LENGTH = ROLL.x1 - ROLL.x0;
/** The far end lands LENGTH to the right on the page; in this frame that is: */
const SWEEP: Vec2 = [-LENGTH / OBLIQUE_DX, (LENGTH * OBLIQUE_DY) / OBLIQUE_DX];
const SWEEP_DEG = (Math.atan2(SWEEP[1], SWEEP[0]) * 180) / Math.PI;
const onEnd = (deg: number, far = false): Vec2 => {
  const a = (deg * Math.PI) / 180;
  return [AXLE[0] + R * Math.cos(a) + (far ? SWEEP[0] : 0), AXLE[1] + R * Math.sin(a) + (far ? SWEEP[1] : 0)];
};
const halfTurn = (to: Vec2) => `A${nums([R, R])} 0 0 1 ${nums(to)}`;
const [TOP, BOTTOM] = [SWEEP_DEG - 90, SWEEP_DEG + 90];

/** Top tangent line, the far end's visible half, bottom tangent line back to the near end. */
const rollOutline =
  `M${nums(onEnd(TOP))}L${nums(onEnd(TOP, true))}` + halfTurn(onEnd(BOTTOM, true)) + `L${nums(onEnd(BOTTOM))}`;
const rollBody = `${rollOutline}${halfTurn(onEnd(TOP))}Z`;
const rollEnd = circle(AXLE[0], AXLE[1], R);
const rollCore = circle(AXLE[0], AXLE[1], ROLL.core / 2);

const rollEndDetails: Detail[] = [
  { d: rollEnd, fill: "paper", stroke: "ink", width: 1 },
  { d: rollCore, fill: "wood-side", stroke: "ink", width: 1 },
];

const rollBase = {
  kind: "panel",
  plane: "YZ",
  origin: [ROLL.x0, 0, 0],
  t: LENGTH,
  outline: rollEnd,
  band: "wood",
  strata: 1,
  sheet: false,
} as const;

/* ---- Paper, tear bar, ledge, crayons ---- */

const paperOutline = rrect(0, 0, LENGTH, AXLE[1] - PAPER_BOTTOM, 2);

/** A child's crayon drawing on the pulled-down paper (paper frame, v up from its bottom edge): two hills and a sun. */
const hills = "M40 118Q78 172 128 152Q172 132 206 166Q252 208 302 160Q344 122 412 142";
const sun = joinPaths(
  "M346 360C347 381 330 392 314 390C296 388 287 372 290 356C293 340 308 330 323 332C338 334 346 346 345 357",
  ...(
    [
      [20, 44, 60],
      [78, 42, 62],
      [136, 44, 58],
      [196, 42, 60],
      [258, 44, 56],
      [318, 42, 62],
    ] as const
  ).map(([deg, from, to]) => {
    const a = (deg * Math.PI) / 180;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return `M${nums([318 + from * c, 360 + from * s])}L${nums([318 + to * c, 360 + to * s])}`;
  }),
);

const barOutline = rrect(0, 0, BAR.w, BAR.h, 8);
const barScrews = joinPaths(circle(8, BAR.h / 2, 4), circle(BAR.w - 8, BAR.h / 2, 4));
const barGrain = grainLines([[40, 16, 440, 22, 2]]);

const cheekOutline = roundedPolygon(
  [
    [LIP_Z, 120],
    [WALL_FACE, 120],
    [WALL_FACE, 195],
    [48, 195],
    [LIP_Z, 170],
  ],
  [6, 3, 3, 14, 8],
);

const CRAYON_D = 14;
const crayonY = LEDGE_TOP + CRAYON_D / 2;
const CRAYONS: readonly { from: Vec3; to: Vec3; cap: Tone }[] = [
  { from: [140, crayonY, 86], to: [240, crayonY, 91], cap: "anar" },
  { from: [272, crayonY, 92], to: [370, crayonY, 87], cap: "asal" },
  { from: [418, crayonY, 88], to: [514, crayonY, 93], cap: "char" },
];

const holder = (side: "l" | "r", order: number): Part => ({
  id: `holder-${side}`,
  kind: "panel",
  plane: "YZ",
  origin: [side === "l" ? HOLDER_X[0] : HOLDER_X[1], 0, 0],
  t: T,
  outline: holderOutline,
  holes: axleHole,
  order,
});

const cheek = (side: "l" | "r", order: number): Part => ({
  id: `cheek-${side}`,
  kind: "panel",
  plane: "YZ",
  origin: [side === "l" ? 0 : W - T, 0, 0],
  t: T,
  outline: cheekOutline,
  order,
});

const wallArtRoll = {
  key: "wall-art-roll",
  source: "measured",
  size: { w: W, h: H, d: D },
  sheet: { w: 2440, h: 1220, t: T },
  parts: [
    {
      id: "board",
      kind: "panel",
      plane: "XY",
      origin: [0, 0, WALL_FACE],
      t: T,
      outline: boardOutline,
      grain: boardGrain,
      details: [{ d: wallScrews, fill: "ply-3" }],
      order: 1,
    },
    {
      id: "paper",
      kind: "panel",
      plane: "XY",
      origin: [ROLL.x0, PAPER_BOTTOM, PAPER_Z],
      t: 0,
      outline: paperOutline,
      details: [
        { d: paperOutline, fill: "paper", stroke: "ink", width: 1 },
        { d: hills, stroke: "asal", width: 1.75 },
        { d: sun, stroke: "anar", width: 1.5 },
      ],
      sheet: false,
      shadow: false,
      hideIn: ["exploded"],
      order: 2,
    },
    holder("r", 3),
    {
      id: "tear-bar",
      kind: "panel",
      plane: "XY",
      origin: [BAR.x, BAR.y, PAPER_Z - T],
      t: T,
      outline: barOutline,
      grain: barGrain,
      details: [{ d: barScrews, fill: "ply-3" }],
      order: 4,
    },
    {
      ...rollBase,
      id: "roll",
      only: ["assembled", "exploded"],
      details: [{ d: rollBody, fill: "paper" }, { d: rollOutline, stroke: "ink", width: 1.75 }, ...rollEndDetails],
      order: 5,
    },
    {
      // Elevations: the front sees the roll as a strip, the side sees its end (behind the holder arm).
      ...rollBase,
      id: "roll-elevation",
      only: ["ortho"],
      details: rollEndDetails,
      order: 5,
    },
    holder("l", 6),
    {
      id: "axle",
      kind: "rod",
      from: [HOLDER_X[0], AXLE[1], AXLE[0]],
      to: [HOLDER_X[1] + T, AXLE[1], AXLE[0]],
      d: AXLE_D,
      capOnTop: true,
      // Only the stub between the left arm and the roll shows; the rest runs inside the roll.
      exposed: [T, ROLL.x0 - HOLDER_X[0]],
      order: 7,
    },
    cheek("r", 8),
    {
      id: "ledge",
      kind: "panel",
      plane: "XZ",
      origin: [T, LEDGE_TOP - T, LEDGE_Z[0]],
      t: T,
      outline: rrect(0, 0, W - 2 * T, LEDGE_Z[1] - LEDGE_Z[0], 3),
      order: 9,
    },
    ...CRAYONS.map((c, i): Part => ({
      id: `crayon-${i + 1}`,
      kind: "rod",
      from: c.from,
      to: c.to,
      d: CRAYON_D,
      cap: c.cap,
      shadow: false,
      only: ["assembled"],
      order: 10,
    })),
    {
      id: "lip",
      kind: "panel",
      plane: "XY",
      origin: [T, LEDGE_TOP - T, LIP_Z],
      t: LEDGE_Z[0] - LIP_Z,
      outline: rrect(0, 0, W - 2 * T, 30, 5),
      order: 11,
    },
    cheek("l", 12),
  ],
  exploded: {
    roll: [0, 150, 0],
    axle: [0, 270, 0],
    "holder-l": [-110, 0, 0],
    "holder-r": [110, 0, 0],
    "tear-bar": [0, 0, -140],
    ledge: [0, -40, -120],
    lip: [0, -40, -220],
    "cheek-l": [-90, -40, -120],
    "cheek-r": [90, -40, -120],
  },
  dowels: [
    { at: [HOLDER_X[0], AXLE[1], AXLE[0]], part: "holder-l", with: "axle" },
    { at: [HOLDER_X[1] + T, AXLE[1], AXLE[0]], part: "holder-r", with: "axle" },
    { at: [HOLDER_X[0] + T / 2, AXLE[1], WALL_FACE], part: "holder-l" },
    { at: [HOLDER_X[1] + T / 2, AXLE[1], WALL_FACE], part: "holder-r" },
    { at: [BAR.x + 8, BAR.y + BAR.h / 2, PAPER_Z], part: "tear-bar" },
    { at: [BAR.x + BAR.w - 8, BAR.y + BAR.h / 2, PAPER_Z], part: "tear-bar" },
    { at: [W / 2, LEDGE_TOP - T / 2, LEDGE_Z[1]], part: "ledge" },
  ],
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: W },
    { key: "extra.عرض رول کاغذ", axis: "w", from: ROLL.x0, to: ROLL.x1 },
    { key: "heightCm", axis: "h", from: 0, to: H },
    { key: "depthCm", axis: "d", from: 0, to: D },
    { key: "extra.عمق طاقچهٔ ابزار", axis: "d", from: LEDGE_Z[0], to: LEDGE_Z[1] },
  ],
} satisfies Manifest;

export default wallArtRoll;
