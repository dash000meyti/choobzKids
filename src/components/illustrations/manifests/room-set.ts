/*
 * پک اتاق مونته‌سوری — the five pieces of the room set, each at its real size
 * (products.json `montessori-room-set`): the learning tower (450 × 900 × 450),
 * the Montessori shelf (900 × 500 × 300), the 100 cm front-facing bookshelf
 * (1000 × 800 × 120), the table (600 × 500 × 460) with its two chairs, and the
 * wall art roll (620 × 850 × 120, mounted 250 mm off the floor).
 *
 * Five pieces fit the drawing budget only as their visible faces: across a
 * 4.5 m scene an 18 mm ply edge or a 6 mm fillet is under a pixel. So panels
 * are drawn as the one face the viewer sees (t = 0), fillets under 10 mm are
 * left sharp, and only the two tops and the rods keep their depth. Books and
 * paper are painted on the panels they rest against.
 *
 * The set's three dimensions are its largest piece on each axis: the
 * bookshelf's width, the tower's height and the table's depth. Assembled, the
 * wall pieces stand along the back wall with the table and chairs in front of
 * the art roll and the tower at the end; exploded, the pieces step apart; the
 * dimension drawing lines them up along one wall.
 */

import { OBLIQUE, cross3, dot3, planeAxes, roundedPolygon, rrect, stadium } from "../project";
import { tableChairShapes } from "./kids-table-chair";
import type { Detail, Manifest, PanelPart, Part, Plane, Tone, Vec2, Vec3, View } from "./types";

const { table: TABLE, chair: CHAIR } = tableChairShapes;

type Place = {
  /** World x and z of the piece's front-left floor corner. */
  readonly x: number;
  readonly z: number;
  /** Painter's order of the piece; its parts follow in steps of 0.01. */
  readonly order: number;
  readonly only: readonly View[];
  readonly prefix: string;
};

const toViewer: Vec3 = [-OBLIQUE.away[0], -OBLIQUE.away[1], -OBLIQUE.away[2]];

/** A rectangle with sharp corners (fillets under a pixel at this scale). */
const box = (w: number, h: number, x = 0, y = 0) => rrect(x, y, w, h, 0);
/** Corners with only the large radii kept. */
const outline = (points: readonly Vec2[], radii: readonly number[]) => roundedPolygon(points, radii.map((r) => (r < 10 ? 0 : r)));

/**
 * A flat part reduced to its visible face: the slab from `origin` along the
 * plane normal by `t`, drawn as whichever of its two broad faces looks at the
 * viewer, so the face keeps the full panel's position, tone and paint order.
 */
function face(
  p: Place,
  name: string,
  step: number,
  plane: Plane,
  origin: Vec3,
  t: number,
  shape: string,
  extra: Partial<PanelPart> = {},
): PanelPart {
  const { n } = planeAxes(plane);
  const front = dot3(n, toViewer) > 0;
  return {
    id: `${p.prefix}-${name}`,
    kind: "panel",
    plane,
    origin: front ? [origin[0] + n[0] * t, origin[1] + n[1] * t, origin[2] + n[2] * t] : origin,
    t: 0,
    outline: shape,
    order: p.order + step / 100,
    only: p.only,
    ...extra,
  };
}

/** A top that keeps its thickness: its front edge still reads. */
function slab(p: Place, name: string, step: number, origin: Vec3, t: number, shape: string): PanelPart {
  return {
    id: `${p.prefix}-${name}`,
    kind: "panel",
    plane: "XZ",
    origin,
    t,
    outline: shape,
    strata: 1,
    order: p.order + step / 100,
    only: p.only,
  };
}

const at = (p: Place, dx: number, y: number, dz: number): Vec3 => [p.x + dx, y, p.z + dz];

/* ---- Learning tower: side panels with the hand-hole, platform at the middle level, two box steps, two rails ---- */

const TW = 450;
const TH = 900;
const T18 = 18;
const towerSide = outline(
  [
    [0, 0],
    [62, 0],
    [92, 34],
    [358, 34],
    [388, 0],
    [TW, 0],
    [TW, TH],
    [70, TH],
    [0, 520],
  ],
  [0, 0, 0, 0, 0, 0, 26, 26, 220],
);
const towerHole = stadium([165, 822], [325, 822], 38);
const towerTread = box(TW - 2 * T18, 100);
const towerApron = box(TW - 2 * T18, 78); // the apron and the tread's front edge above it

function tower(p: Place): Part[] {
  const rail = (name: string, step: number, z: number): Part => ({
    id: `${p.prefix}-${name}`,
    kind: "rod",
    from: at(p, 0, 860, z),
    to: at(p, TW, 860, z),
    d: 28,
    capOnTop: true,
    exposed: [T18, TW - T18],
    order: p.order + step / 100,
    only: p.only,
  });
  return [
    face(p, "side-r", 1, "YZ", at(p, TW - T18, 0, 0), T18, towerSide, { holes: towerHole }),
    rail("rail-back", 2, 405),
    face(p, "platform", 3, "XZ", at(p, T18, 380 - T18, 0), T18, box(TW - 2 * T18, 340, 0, 100)),
    face(p, "apron-1", 4, "XY", at(p, T18, 62, 0), T18, towerApron),
    face(p, "tread-1", 5, "XZ", at(p, T18, 122, 0), T18, towerTread),
    face(p, "apron-2", 6, "XY", at(p, T18, 182, 0), T18, towerApron),
    face(p, "tread-2", 7, "XZ", at(p, T18, 242, 0), T18, towerTread),
    rail("rail-front", 8, 100),
    face(p, "side-l", 9, "YZ", at(p, 0, 0, 0), T18, towerSide, { holes: towerHole }),
  ];
}

/* ---- Front-facing bookshelf, 100 cm: 15 mm ply, ledges at 100 / 350 / 600 behind 60 mm lips ---- */

const BW = 1000;
const BH = 800;
const BD = 120;
const T15 = 15;
const bookSide = outline(
  [
    [0, 0],
    [BD, 0],
    [BD, BH],
    [44, BH],
    [0, 700],
  ],
  [6, 6, 6, 28, 90],
);
const LEDGES = [100, 350, 600] as const;

/** Picture books standing face-out on the ledges: plain tinted covers, painted on the back panel. */
type Book = { ledge: number; x: number; w: number; h: number; cover: Tone; opacity?: number };
const BOOKS: readonly Book[] = [
  { ledge: 0, x: 60, w: 240, h: 220, cover: "anar", opacity: 0.4 },
  { ledge: 0, x: 560, w: 220, h: 205, cover: "paper" },
  { ledge: 1, x: 290, w: 230, h: 215, cover: "asal", opacity: 0.5 },
  { ledge: 2, x: 110, w: 210, h: 200, cover: "paper" },
];
const books: Detail[] = BOOKS.map((b) => ({
  d: box(b.w, b.h, b.x, LEDGES[b.ledge]),
  fill: b.cover,
  stroke: "ink",
  width: 1,
  opacity: b.opacity,
}));

function bookshelf(p: Place): Part[] {
  const inner = BW - 2 * T15;
  const ledge = box(inner, 80);
  const lip = box(inner, 60);
  return [
    face(p, "side-r", 1, "YZ", at(p, BW - T15, 0, 0), T15, bookSide),
    face(p, "back", 2, "XY", at(p, T15, 0, BD - T15), T15, box(inner, BH), { details: books }),
    ...LEDGES.flatMap((y, k) => [
      face(p, `ledge-${k + 1}`, 3 + 2 * k, "XZ", at(p, T15, y - T15, 25), T15, ledge),
      face(p, `lip-${k + 1}`, 4 + 2 * k, "XY", at(p, T15, y - T15, 10), T15, lip),
    ]),
    face(p, "side-l", 9, "YZ", at(p, 0, 0, 0), T15, bookSide),
  ];
}

/* ---- Montessori shelf: two 220 mm tiers, back panel, top on the sides ---- */

const SW = 900;
const SH = 500;
const SD = 300;

function shelf(p: Place): Part[] {
  const inner = SW - 2 * T18;
  const side = box(SD, SH - T18);
  const tier = box(inner, SD - T18);
  return [
    face(p, "side-r", 1, "YZ", at(p, SW - T18, 0, 0), T18, side),
    face(p, "back", 2, "XY", at(p, T18, 6, SD - T18), T18, box(inner, SH - T18 - 6)),
    face(p, "shelf-1", 3, "XZ", at(p, T18, 6, 0), T18, tier),
    face(p, "shelf-2", 4, "XZ", at(p, T18, 244, 0), T18, tier),
    face(p, "side-l", 5, "YZ", at(p, 0, 0, 0), T18, side),
    slab(p, "top", 6, at(p, 0, SH - T18, 0), T18, rrect(0, 0, SW, SD, 20)),
  ];
}

/* ---- Table with a chair at each end ---- */

const UP: Vec3 = [0, 1, 0];
const tableEnd = outline(TABLE.endPoints, [4, 4, 70, 70, 4, 4, 6, 6]);
const chairSide = outline(CHAIR.sidePoints, [0, 0, 40, 40, 0, 0, 0, 0, 22, 22, 0]);
const chairSeat = box(280 - CHAIR.backS - T18, CHAIR.w - 2 * T18, CHAIR.backS + T18, T18);
const chairBack = box(CHAIR.w - 2 * T18, CHAIR.backY[1] - CHAIR.backY[0], T18, CHAIR.backY[0]);
const chairHole = stadium([CHAIR.w / 2 - 40, 445], [CHAIR.w / 2 + 40, 445], 30);

/**
 * A chair as visible faces. `back` is its back-left floor corner, `facing` the
 * way a seated child looks. `farSide: false` drops the far side panel, which
 * only shows through the near one's opening.
 */
function chair(p: Place, name: string, step: number, back: Vec3, facing: Vec3, farSide = true): Part[] {
  const S = facing;
  const A = cross3(UP, S);
  const pt = (a: number, s: number, y = 0): Vec3 => [back[0] + A[0] * a + S[0] * s, y, back[2] + A[2] * a + S[2] * s];
  // A side's thickness grows along s × y = −a, so a side spanning a0 → a0 + 18 has its origin at a0 + 18.
  const sidePlane: Plane = { u: S, v: UP };
  const nearIsPlusA = dot3(A, toViewer) > 0;
  const sub = { ...p, prefix: `${p.prefix}-${name}` };
  return [
    ...(farSide ? [face(sub, "side-far", step, sidePlane, pt(nearIsPlusA ? T18 : CHAIR.w, 0), T18, chairSide)] : []),
    face(sub, "seat", step + 1, { u: S, v: A }, pt(0, 0, CHAIR.seat - T18), T18, chairSeat),
    face(sub, "back", step + 2, { u: A, v: UP }, pt(0, CHAIR.backS), T18, chairBack, { holes: chairHole }),
    face(sub, "side-near", step + 3, sidePlane, pt(nearIsPlusA ? CHAIR.w : T18, 0), T18, chairSide),
  ];
}

/** Each chair's seat reaches 40 mm under the top's overhang, clear of the end panels. */
const CHAIR_TUCK = 40;
const CHAIR_REACH = CHAIR.d - CHAIR_TUCK;
const CHAIR_GAP = 60;

/**
 * `ends`: a chair at each end, facing each other (the room). `lineup`: both at
 * the left end facing the same way, the second one beside the first (the
 * dimension drawing, where two facings would cost two copies of every outline).
 */
function tableSet(p: Place, chairs: "ends" | "lineup" = "ends"): Part[] {
  const midZ = (TABLE.d - CHAIR.w) / 2;
  // Side on, in the dimension drawing, the far side panel hides exactly behind the near one.
  const leftChair = (name: string, step: number, x: number) =>
    chair(p, name, step, at(p, x, 0, midZ + CHAIR.w), [1, 0, 0], chairs === "ends");
  return [
    ...(chairs === "ends"
      ? chair(p, "chair-r", 1, at(p, TABLE.w + CHAIR_REACH, 0, midZ), [-1, 0, 0])
      : leftChair("chair-beside", 1, -CHAIR_REACH - CHAIR.d - CHAIR_GAP)),
    face(p, "end-r", 6, "YZ", at(p, TABLE.w - TABLE.endX - TABLE.t, 0, 0), TABLE.t, tableEnd),
    face(p, "end-l", 7, "YZ", at(p, TABLE.endX, 0, 0), TABLE.t, tableEnd),
    slab(p, "top", 8, at(p, 0, TABLE.h - TABLE.t, 0), TABLE.t, rrect(0, 0, TABLE.w, TABLE.d, TABLE.topRadius)),
    ...leftChair("chair-l", 10, -CHAIR_REACH),
  ];
}

/* ---- Wall art roll: board 250 mm off the floor, paper roll between two arms, cutter bar, tool ledge ---- */

const AW = 620;
const AH = 850;
const AD = 120;
const MOUNT = 250;
const PAPER_W = 450;
const ROLL = { y: MOUNT + 785, z: 52, d: 80 } as const;
const CUTTER_Y = MOUNT + 200;
const TOOL_LEDGE_Y = MOUNT + 50;

function artRoll(p: Place): Part[] {
  const arm = stadium([50, ROLL.y], [60, ROLL.y], 90);
  // The paper hangs from the roll down the board to the cutter bar.
  const paper: Detail = {
    d: box(PAPER_W, ROLL.y - CUTTER_Y, (AW - PAPER_W) / 2, CUTTER_Y - MOUNT),
    fill: "paper",
    stroke: "ink",
    width: 1,
  };
  return [
    face(p, "board", 1, "XY", at(p, 0, MOUNT, AD - T15), T15, rrect(0, 0, AW, AH, 24), { details: [paper] }),
    face(p, "arm-r", 2, "YZ", at(p, AW - 75, 0, 0), T15, arm),
    face(p, "cutter", 3, "XY", at(p, 60, CUTTER_Y - 20, AD - T15 - 22), 22, box(AW - 120, 36)),
    {
      id: `${p.prefix}-roll`,
      kind: "rod",
      from: at(p, 60, ROLL.y, ROLL.z),
      to: at(p, AW - 60, ROLL.y, ROLL.z),
      d: ROLL.d,
      cap: "paper",
      capOnTop: true,
      exposed: [T15, AW - 120 - T15],
      order: p.order + 0.04,
      only: p.only,
    },
    face(p, "ledge", 5, "XZ", at(p, 20, TOOL_LEDGE_Y - T15, 25), T15, box(AW - 40, AD - T15 - 25)),
    face(p, "lip", 6, "XY", at(p, 20, TOOL_LEDGE_Y - 20, 20), T15, box(AW - 40, 30)),
    face(p, "arm-l", 7, "YZ", at(p, 60, 0, 0), T15, arm),
  ];
}

/* ---- Layouts ---- */

type PieceName = "tower" | "shelf" | "bookshelf" | "table" | "artRoll";
const BUILD: Record<PieceName, (p: Place) => Part[]> = { tower, shelf, bookshelf, table: (p) => tableSet(p), artRoll };
const DEPTH: Record<PieceName, number> = { tower: TW, shelf: SD, bookshelf: BD, table: TABLE.d, artRoll: AD };

/** Back wall of the assembled room, mm from the front. */
const WALL = 650;

/**
 * Front-left corners. Along the wall: the shelf, the bookshelf and the art
 * roll; the table and chairs stand in front of the art roll, the tower at the
 * end of the row. Paint order runs from the wall forward.
 */
const ROOM: Record<PieceName, { x: number; z: number; order: number }> = {
  shelf: { x: 0, z: WALL - SD, order: 1 },
  bookshelf: { x: 1000, z: WALL - BD, order: 2 },
  artRoll: { x: 2140, z: WALL - AD, order: 3 },
  table: { x: 2120, z: 0, order: 4 },
  tower: { x: 3080, z: 0, order: 5 },
};

/** Exploded: the pieces step apart. */
const APART: Record<PieceName, Vec3> = {
  shelf: [-200, 0, 0],
  bookshelf: [-60, 0, 0],
  artRoll: [80, 160, 0],
  table: [60, 0, -320],
  tower: [320, 0, -60],
};

/** Dimension drawing: side by side with their backs on one wall, the tower last so its height line stands beside it. */
const ROW_GAP = 120;
const ROW_ORDER: readonly PieceName[] = ["table", "artRoll", "bookshelf", "shelf", "tower"];
const ROW_WIDTH: Record<PieceName, number> = {
  tower: TW,
  table: TABLE.w + 2 * CHAIR_REACH + CHAIR_GAP + CHAIR_TUCK,
  artRoll: AW,
  bookshelf: BW,
  shelf: SW,
};
const ROW_X = (() => {
  const out = {} as Record<PieceName, number>;
  let x = 0;
  for (const name of ROW_ORDER) {
    // A table's x is the table itself; its chairs line up to its left.
    out[name] = name === "table" ? x + 2 * CHAIR_REACH + CHAIR_GAP + CHAIR_TUCK : x;
    x += ROW_WIDTH[name] + ROW_GAP;
  }
  return out;
})();

const pieces = (Object.keys(BUILD) as PieceName[]).map((name) => {
  const rowPlace: Place = { x: ROW_X[name], z: TABLE.d - DEPTH[name], order: 0, only: ["ortho"], prefix: `row-${name}` };
  return {
    name,
    placed: BUILD[name]({ ...ROOM[name], only: ["assembled", "exploded", "flat"], prefix: name }),
    row: name === "table" ? tableSet(rowPlace, "lineup") : BUILD[name](rowPlace),
  };
});

const roomSet = {
  key: "room-set",
  source: "measured",
  size: { w: ROOM.tower.x + TW, h: MOUNT + AH, d: WALL },
  // Three standard 2440 × 1220 sheets, long edges together.
  sheet: { w: 2440, h: 3660, t: T18 },
  parts: pieces.flatMap((p) => [...p.placed, ...p.row]),
  exploded: Object.fromEntries(pieces.flatMap((p) => p.placed.map((part) => [part.id, APART[p.name]]))),
  dims: [
    { key: "widthCm", axis: "w", from: ROW_X.bookshelf, to: ROW_X.bookshelf + BW },
    { key: "heightCm", axis: "h", from: 0, to: TH },
    { key: "depthCm", axis: "d", from: 0, to: TABLE.d },
  ],
} satisfies Manifest;

export default roomSet;
