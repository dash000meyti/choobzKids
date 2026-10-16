/*
 * میز و صندلی کودک — table 600 × 500 × 460, chair 300 × 300 × 520 with its
 * seat at 260 (products.json `kids-table-chair`), 18 mm birch ply.
 *
 * The table top rests on two end panels set 50 mm in from its ends; each panel
 * is an arched frame whose legs splay out front and back, and a back apron ties
 * them together. The chair (two side panels, a seat between them, a backrest
 * with a carry hand-hole) stands in front, pushed 30% of its depth under the
 * top, so the drawing shows its back. The dimension drawing sets a second copy
 * of the chair sideways beside the table, so its seat and back heights read in
 * the front elevation and its width in the side elevation.
 */

import { add3, cross3, grainLines, roundedPolygon, rrect, scale3, stadium } from "../project";
import type { Dowel, Manifest, Part, Vec2, Vec3, View } from "./types";

const T = 18;

/* Table */
const W = 600;
const D = 500;
const H = 460;
const TOP_R = 40;
const END_X = 50; // outer face of each end panel, from the top's end
const FOOT_Z = 15; // the splayed feet stop 15 mm inside the top's front and back edges
const LEG = 56;
const SPLAY = 30; // each leg leans out this far over the panel's height
const APRON = 90; // depth of the end panels' top rail and of the back apron
const APRON_Y = H - T - APRON;
const APRON_Z = 420;

const legAt = (y: number) => FOOT_Z + SPLAY * (1 - y / (H - T));
/** End panel corners in (u = z, v = y), feet first; the two 70 mm corners round the arched opening. */
const endPoints: readonly Vec2[] = [
  [FOOT_Z, 0],
  [FOOT_Z + LEG, 0],
  [legAt(APRON_Y) + LEG, APRON_Y],
  [D - legAt(APRON_Y) - LEG, APRON_Y],
  [D - FOOT_Z - LEG, 0],
  [D - FOOT_Z, 0],
  [D - legAt(H - T), H - T],
  [legAt(H - T), H - T],
];
const endOutline = roundedPolygon(endPoints, [4, 4, 70, 70, 4, 4, 6, 6]);
const endGrain = grainLines([
  [40, 40, 58, 380, 3],
  [D - 40, 40, D - 58, 380, -3],
  [130, 398, 370, 402, 2],
]);

const INNER_W = W - 2 * (END_X + T);

/* Chair, in its own frame: a across (0 → 300), s from its back (0) to its front (300), y up. */
const CW = 300;
const CD = 300;
const CH = 520;
const SEAT = 260;
const BACK_S = 26; // backrest, s 26 → 44, inside the uprights
const BACK_Y = [390, 500] as const;

/** Chair side corners in (s, y): splayed legs under an arched opening, the seat line, the reclining upright. */
const chairSidePoints: readonly Vec2[] = [
  [0, 0],
  [50, 0],
  [64, 190],
  [236, 190],
  [250, 0],
  [CD, 0],
  [283, SEAT],
  [82, SEAT],
  [76, CH],
  [10, CH],
  [17, SEAT],
];
const chairSide = roundedPolygon(chairSidePoints, [4, 4, 40, 40, 4, 4, 14, 18, 22, 22, 400]);
const chairSideGrain = grainLines([
  [28, 40, 40, 480, 3],
  [276, 30, 264, 220, -2],
  [100, 226, 220, 229, 1],
]);
const seatOutline = roundedPolygon(
  [
    [BACK_S + T, T],
    [280, T],
    [280, CW - T],
    [BACK_S + T, CW - T],
  ],
  [3, 12, 12, 3],
);
const seatGrain = grainLines([
  [80, 60, 262, 66, 3],
  [76, 236, 258, 230, -3],
]);
const backrest = rrect(T, BACK_Y[0], CW - 2 * T, BACK_Y[1] - BACK_Y[0], 8);
const handHole = stadium([CW / 2 - 40, 445], [CW / 2 + 40, 445], 30);
const backrestGrain = grainLines([
  [40, 409, 260, 413, 2],
  [42, 482, 258, 478, -2],
]);

/** Corner lists and sizes shared with the room set, which redraws the table and chairs with fewer fillets. */
export const tableChairShapes = {
  table: { w: W, d: D, h: H, t: T, topRadius: TOP_R, endX: END_X, endPoints },
  chair: { w: CW, d: CD, h: CH, seat: SEAT, backS: BACK_S, backY: BACK_Y, sidePoints: chairSidePoints },
} as const;

type ChairFrame = {
  /** World position of the chair's back-left floor corner (a = 0, s = 0). */
  readonly at: Vec3;
  /** World direction the chair faces (its s axis); across runs along y × s. */
  readonly facing: Vec3;
};

const UP: Vec3 = [0, 1, 0];

/** The chair's four panels. `order` is the painter's order of its first part (oblique views only). */
function chairParts(prefix: string, frame: ChairFrame, only: readonly View[], order?: number): Part[] {
  const S = frame.facing;
  const A = cross3(UP, S);
  const at = (a: number, s: number, y = 0): Vec3 => add3(add3(add3(frame.at, scale3(A, a)), scale3(S, s)), scale3(UP, y));
  const step = (k: number) => (order === undefined ? undefined : order + k);
  // A side panel's thickness grows along s × y = −a, so each panel's origin is its +a face.
  const side = (id: string, a: number, k: number, grain?: string): Part => ({
    id: `${prefix}${id}`,
    kind: "panel",
    plane: { u: S, v: UP },
    origin: at(a, 0),
    t: T,
    outline: chairSide,
    grain,
    only,
    order: step(k),
  });
  return [
    side("side-r", CW, 0),
    {
      id: `${prefix}seat`,
      kind: "panel",
      plane: { u: S, v: A },
      origin: at(0, 0, SEAT - T),
      t: T,
      outline: seatOutline,
      grain: seatGrain,
      only,
      order: step(1),
    },
    {
      id: `${prefix}back`,
      kind: "panel",
      plane: { u: A, v: UP },
      origin: at(0, BACK_S),
      t: T,
      outline: backrest,
      holes: handHole,
      grain: backrestGrain,
      only,
      order: step(2),
    },
    side("side-l", T, 3, chairSideGrain),
  ];
}

/* Pushed in from the front: the chair's front feet stand 30% of its depth under the top. */
const TUCK = 0.3 * CD;
const CHAIR_X = (W - CW) / 2;
const seated: ChairFrame = { at: [CHAIR_X, 0, TUCK - CD], facing: [0, 0, 1] };
/* Dimension drawing: sideways, 100 mm right of the table, clear of it in the side elevation too. */
const ORTHO_CHAIR_X = W + 100 + CD;
const ORTHO_CHAIR_Z = -100 - CW;
const beside: ChairFrame = { at: [ORTHO_CHAIR_X, 0, ORTHO_CHAIR_Z], facing: [-1, 0, 0] };

/* Exploded: the chair slides out to the right and forward, clear of the table. */
const CHAIR_PULL: Vec3 = [460, 0, -220];
const chairAt = (a: number, s: number, y: number): Vec3 => [CHAIR_X + a, y, TUCK - CD + s];

const dowels: Dowel[] = [
  ...[110, 390].flatMap((z): Dowel[] => [
    { at: [END_X + T / 2, H - T, z], part: "end-l", with: "top" },
    { at: [W - END_X - T / 2, H - T, z], part: "end-r", with: "top" },
  ]),
  { at: [END_X + T, APRON_Y + APRON / 2, APRON_Z + T / 2], part: "end-l" },
  { at: [W - END_X - T, APRON_Y + APRON / 2, APRON_Z + T / 2], part: "end-r" },
  ...[90, 240].flatMap((s): Dowel[] => [
    { at: chairAt(T, s, SEAT - T / 2), part: "chair-side-l", with: "chair-seat" },
    { at: chairAt(CW - T, s, SEAT - T / 2), part: "chair-side-r", with: "chair-seat" },
  ]),
  { at: chairAt(T, BACK_S + T / 2, 445), part: "chair-side-l", with: "chair-back" },
  { at: chairAt(CW - T, BACK_S + T / 2, 445), part: "chair-side-r", with: "chair-back" },
];

const kidsTableChair = {
  key: "kids-table-chair",
  source: "measured",
  size: { w: W, h: CH, d: D + CD - TUCK },
  parts: [
    {
      id: "end-r",
      kind: "panel",
      plane: "YZ",
      origin: [W - END_X - T, 0, 0],
      t: T,
      outline: endOutline,
      grain: endGrain,
      order: 1,
    },
    {
      id: "apron",
      kind: "panel",
      plane: "XY",
      origin: [END_X + T, APRON_Y, APRON_Z],
      t: T,
      outline: rrect(0, 0, INNER_W, APRON, 3),
      grain: grainLines([
        [30, 30, 434, 36, 2],
        [40, 62, 424, 58, -2],
      ]),
      order: 2,
    },
    { id: "end-l", kind: "panel", plane: "YZ", origin: [END_X, 0, 0], t: T, outline: endOutline, grain: endGrain, order: 3 },
    {
      id: "top",
      kind: "panel",
      plane: "XZ",
      origin: [0, H - T, 0],
      t: T,
      outline: rrect(0, 0, W, D, TOP_R),
      grain: grainLines([
        [40, 120, 560, 130, 6],
        [30, 262, 570, 252, -8],
        [60, 392, 540, 398, 5],
      ]),
      order: 4,
    },
    ...chairParts("chair-", seated, ["assembled", "exploded", "flat"], 5),
    ...chairParts("ortho-chair-", beside, ["ortho"]),
  ],
  exploded: {
    top: [0, 170, 0],
    "end-l": [-120, 0, 0],
    "end-r": [120, 0, 0],
    "chair-side-l": add3(CHAIR_PULL, [-60, 0, 0]),
    "chair-side-r": add3(CHAIR_PULL, [60, 0, 0]),
    "chair-seat": add3(CHAIR_PULL, [0, 80, 0]),
    "chair-back": add3(CHAIR_PULL, [0, 50, -70]),
  },
  dowels,
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: W },
    { key: "depthCm", axis: "d", from: 0, to: D },
    { key: "heightCm", axis: "h", from: 0, to: H, view: "side" },
    { key: "extra.عرض صندلی", axis: "d", from: ORTHO_CHAIR_Z, to: ORTHO_CHAIR_Z + CW },
    { key: "extra.ارتفاع نشیمن صندلی", axis: "h", from: 0, to: SEAT },
    { key: "extra.ارتفاع کل صندلی", axis: "h", from: 0, to: CH },
  ],
} satisfies Manifest;

export default kidsTableChair;
