/*
 * نردبان سوئدی — 800 wide × 2000 high × 150 deep (products.json `swedish-ladder`).
 *
 * Two 24 mm birch-ply uprights with rounded tops, twelve hardwood rungs Ø30 at
 * 150 mm centres running right through them (end grain flush on the outer
 * faces), and four steel L-brackets — top and middle of each upright — that
 * tie the back edges to the wall. The wall is the plane z = 150; the assembled
 * view draws the thin line where it meets the floor, so the ladder reads as
 * wall-mounted.
 */

import { circle, grainLines, joinPaths, roundedPolygon, rrect } from "../project";
import type { Manifest, Part, Vec3 } from "./types";

const W = 800;
const H = 2000;
const D = 150;
const T = 24;

const RUNG_D = 30;
const RUNG_COUNT = 12;
const RUNG_PITCH = 150;
const FIRST_RUNG = 200;
const RUNG_Z = D / 2;
const rungY = (k: number) => FIRST_RUNG + k * RUNG_PITCH;

/** Upright in (u = z, v = y): square foot, generously rounded top. */
const uprightOutline = roundedPolygon(
  [
    [0, 0],
    [D, 0],
    [D, H],
    [0, H],
  ],
  [6, 6, 60, 60],
);

const uprightHoles = joinPaths(...Array.from({ length: RUNG_COUNT }, (_, k) => circle(RUNG_Z, rungY(k), RUNG_D / 2)));

const uprightGrain = grainLines([
  [28, 90, 34, 1240, 6],
  [52, 1380, 46, 1930, -4],
  [104, 60, 98, 820, -5],
  [118, 960, 124, 1880, 6],
]);

/*
 * Steel L-bracket: one leg screwed to the upright's outer face, the other to
 * the wall. The 3 mm plates are drawn flush (t = 0); their edge would not show.
 */
const BRACKET = { leg: 45, h: 60 } as const;
const BRACKET_Y = { top: 1890, mid: 1010 } as const;
type BracketLevel = keyof typeof BRACKET_Y;
const plate = rrect(0, 0, BRACKET.leg, BRACKET.h, 4);
const plateScrews = joinPaths(circle(BRACKET.leg / 2, 16, 4), circle(BRACKET.leg / 2, BRACKET.h - 16, 4));
const plateDetails = [
  { d: plate, fill: "ply-3" as const },
  { d: plateScrews, fill: "ply-1" as const },
];

function bracket(side: "l" | "r", level: BracketLevel, order: number): Part[] {
  const y = BRACKET_Y[level];
  const onUpright: Vec3 = side === "l" ? [0, y, D - BRACKET.leg] : [W, y, D - BRACKET.leg];
  const onWall: Vec3 = side === "l" ? [-BRACKET.leg, y, D] : [W, y, D];
  return [
    {
      id: `bracket-${side}-${level}`,
      kind: "panel",
      plane: "YZ",
      origin: onUpright,
      t: 0,
      outline: plate,
      details: plateDetails,
      sheet: false,
      order,
    },
    {
      id: `bracket-${side}-${level}-wall`,
      kind: "panel",
      plane: "XY",
      origin: onWall,
      t: 0,
      outline: plate,
      details: plateDetails,
      sheet: false,
      order: order - 0.5,
    },
  ];
}

const rungs: Part[] = Array.from({ length: RUNG_COUNT }, (_, k) => ({
  id: `rung-${k + 1}`,
  kind: "rod",
  from: [0, rungY(k), RUNG_Z] as Vec3,
  to: [W, rungY(k), RUNG_Z] as Vec3,
  d: RUNG_D,
  capOnTop: true,
  exposed: [T, W - T] as const,
  order: 3,
}));

/** A straight cord (one cubic segment with its handles on the line). */
function line(from: Vec3, to: Vec3): Vec3[] {
  const at = (t: number): Vec3 => [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
  return [from, at(1 / 3), at(2 / 3), to];
}

const WALL_REACH = 220;
/** The uprights lie lengthwise on a strip ripped from a full-length sheet of 24 mm ply. */
const SHEET_MARGIN = 40;

const swedishLadder = {
  key: "swedish-ladder",
  source: "measured",
  size: { w: W, h: H, d: D },
  sheet: { w: 2440, h: 2 * D + 3 * SHEET_MARGIN, t: T },
  parts: [
    {
      // Where the wall meets the floor, just behind the feet.
      id: "wall-line",
      kind: "cord",
      points: line([-WALL_REACH, 0, D], [W + WALL_REACH, 0, D]),
      tone: "ink",
      width: 1,
      only: ["assembled"],
      order: 0,
    },
    ...bracket("r", "top", 1),
    ...bracket("r", "mid", 1),
    {
      id: "upright-r",
      kind: "panel",
      plane: "YZ",
      origin: [W - T, 0, 0],
      t: T,
      outline: uprightOutline,
      holes: uprightHoles,
      grain: uprightGrain,
      sheetAt: { x: SHEET_MARGIN, y: SHEET_MARGIN, rot: 90 },
      order: 2,
    },
    ...rungs,
    {
      id: "upright-l",
      kind: "panel",
      plane: "YZ",
      origin: [0, 0, 0],
      t: T,
      outline: uprightOutline,
      holes: uprightHoles,
      grain: uprightGrain,
      sheetAt: { x: SHEET_MARGIN, y: 2 * SHEET_MARGIN + D, rot: 90 },
      order: 4,
    },
    ...bracket("l", "top", 6),
    ...bracket("l", "mid", 6),
  ],
  exploded: {
    "upright-l": [-170, 0, 0],
    "upright-r": [170, 0, 0],
    ...Object.fromEntries(
      (["l", "r"] as const).flatMap((side) =>
        (Object.keys(BRACKET_Y) as BracketLevel[]).flatMap((level) => {
          const out: Vec3 = [side === "l" ? -260 : 260, 0, 0];
          return [
            [`bracket-${side}-${level}`, out],
            [`bracket-${side}-${level}-wall`, out],
          ];
        }),
      ),
    ),
  },
  dowels: [
    ...[0, 5, 11].flatMap((k) => [
      { at: [0, rungY(k), RUNG_Z] as Vec3, part: "upright-l", with: `rung-${k + 1}` },
      { at: [W, rungY(k), RUNG_Z] as Vec3, part: "upright-r", with: `rung-${k + 1}` },
    ]),
    ...(Object.keys(BRACKET_Y) as BracketLevel[]).flatMap((level) => {
      const at: Vec3 = [0, BRACKET_Y[level] + BRACKET.h / 2, D - BRACKET.leg / 2];
      return [
        { at, part: `bracket-l-${level}`, with: "upright-l" },
        { at: [W, at[1], at[2]] as Vec3, part: `bracket-r-${level}`, with: "upright-r" },
      ];
    }),
  ],
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: W },
    { key: "heightCm", axis: "h", from: 0, to: H },
    { key: "depthCm", axis: "d", from: 0, to: D },
  ],
} satisfies Manifest;

export default swedishLadder;
