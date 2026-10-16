/*
 * برج یادگیری — 450 × 450 × 900 mm, 18 mm birch ply (products.json `learning-tower`).
 *
 * Two side panels carry a stadium hand-hole and three through-slots for the
 * platform tabs (platform top at 300 / 380 / 460 ⚑). Two box steps (tread +
 * apron) at the front, rails front and back at the top; the side panels' top
 * edge is the side rail, 440 above the highest platform. Front faces z = 0.
 */

import { circle, grainLines, joinPaths, roundedPolygon, rrect, stadium } from "../project";
import type { Manifest, Vec3 } from "./types";

const W = 450;
const D = 450;
const H = 900;
const T = 18;

const LEVELS = [300, 380, 460] as const;
const LEVEL = 380;
const SLOT_Z = [170, 370] as const;
const PLATFORM_Z = [100, 440] as const;
const RAIL_Y = 860;
const RAIL_Z = { front: 100, back: 405 } as const;
const RAIL_D = 28;

/** Side panel in (u = z, v = y): vertical back against the counter, front edge easing back above the steps. */
const sideOutline = roundedPolygon(
  [
    [0, 0],
    [62, 0],
    [92, 34],
    [358, 34],
    [388, 0],
    [D, 0],
    [D, H],
    [70, H],
    [0, 520],
  ],
  [6, 8, 22, 22, 8, 6, 26, 26, 220],
);

const sideHoles = joinPaths(
  stadium([165, 822], [325, 822], 38),
  circle(RAIL_Z.front, RAIL_Y, RAIL_D / 2),
  circle(RAIL_Z.back, RAIL_Y, RAIL_D / 2),
  ...LEVELS.map((level) => rrect(SLOT_Z[0], level - T, SLOT_Z[1] - SLOT_Z[0], T, 3)),
);

const sideGrain = grainLines([
  [30, 70, 34, 700, 6],
  [118, 120, 110, 760, -8],
  [250, 60, 244, 250, -5],
  [262, 520, 268, 770, 5],
  [410, 60, 416, 840, 7],
]);

/** Barrel-nut heads where the steps are screwed through the outer face. */
const screwHeads = joinPaths(
  ...[
    [9, 92],
    [30, 131],
    [75, 131],
    [9, 212],
    [30, 251],
    [75, 251],
  ].map(([z, y]) => circle(z, y, 4.5)),
);

/** Platform with its tabs (u = x, v = z); the seated drawing hides the tabs inside the slots. */
const platformTabbed = roundedPolygon(
  [
    [T, PLATFORM_Z[0]],
    [W - T, PLATFORM_Z[0]],
    [W - T, SLOT_Z[0]],
    [W, SLOT_Z[0]],
    [W, SLOT_Z[1]],
    [W - T, SLOT_Z[1]],
    [W - T, PLATFORM_Z[1]],
    [T, PLATFORM_Z[1]],
    [T, SLOT_Z[1]],
    [0, SLOT_Z[1]],
    [0, SLOT_Z[0]],
    [T, SLOT_Z[0]],
  ],
  3,
);
const platformSeated = rrect(T, PLATFORM_Z[0], W - 2 * T, PLATFORM_Z[1] - PLATFORM_Z[0], 3);
const platformGrain = grainLines([
  [40, 160, 410, 168, 4],
  [30, 300, 400, 290, -5],
  [60, 410, 390, 416, 3],
]);

const INNER = W - 2 * T;
const tread = rrect(0, 0, INNER, 100, 3);
const treadGrain = grainLines([
  [20, 40, 390, 46, 3],
  [40, 76, 370, 71, -2],
]);
const apron = rrect(0, 0, INNER, 60, 3);
const apronGrain = grainLines([
  [20, 22, 390, 28, 2],
  [50, 44, 360, 40, -2],
]);

const railEnds = (z: number): [Vec3, Vec3] => [
  [0, RAIL_Y, z],
  [W, RAIL_Y, z],
];

const learningTower = {
  key: "learning-tower",
  source: "measured",
  size: { w: W, h: H, d: D },
  finishes: ["white"],
  parts: [
    {
      id: "side-r",
      kind: "panel",
      plane: "YZ",
      origin: [W - T, 0, 0],
      t: T,
      outline: sideOutline,
      holes: sideHoles,
      grain: sideGrain,
      order: 1,
    },
    { id: "rail-back", kind: "rod", from: railEnds(RAIL_Z.back)[0], to: railEnds(RAIL_Z.back)[1], d: RAIL_D, capOnTop: true, exposed: [T, W - T], order: 2 },
    {
      id: "platform",
      kind: "panel",
      plane: "XZ",
      origin: [0, LEVEL - T, 0],
      t: T,
      outline: platformTabbed,
      grain: platformGrain,
      hideIn: ["assembled"],
      order: 3,
    },
    {
      id: "platform-seated",
      kind: "panel",
      plane: "XZ",
      origin: [0, LEVEL - T, 0],
      t: T,
      outline: platformSeated,
      grain: platformGrain,
      only: ["assembled"],
      explodesAs: "platform",
      sheet: false,
      order: 3,
    },
    { id: "apron-1", kind: "panel", plane: "XY", origin: [T, 62, 0], t: T, outline: apron, grain: apronGrain, order: 4 },
    { id: "tread-1", kind: "panel", plane: "XZ", origin: [T, 122, 0], t: T, outline: tread, grain: treadGrain, order: 5 },
    { id: "apron-2", kind: "panel", plane: "XY", origin: [T, 182, 0], t: T, outline: apron, grain: apronGrain, order: 6 },
    { id: "tread-2", kind: "panel", plane: "XZ", origin: [T, 242, 0], t: T, outline: tread, grain: treadGrain, order: 7 },
    { id: "rail-front", kind: "rod", from: railEnds(RAIL_Z.front)[0], to: railEnds(RAIL_Z.front)[1], d: RAIL_D, capOnTop: true, exposed: [T, W - T], order: 8 },
    {
      id: "side-l",
      kind: "panel",
      plane: "YZ",
      origin: [0, 0, 0],
      t: T,
      outline: sideOutline,
      holes: sideHoles,
      grain: sideGrain,
      details: [{ d: screwHeads, fill: "ply-3" }],
      order: 9,
    },
    {
      // The platform's tab end, flush in the occupied slot of the left panel.
      id: "tab-end",
      kind: "panel",
      plane: "YZ",
      origin: [0, LEVEL - T, 0],
      t: 0,
      outline: rrect(SLOT_Z[0], 0, SLOT_Z[1] - SLOT_Z[0], T, 3),
      face: "edge",
      details: [{ d: `M${SLOT_Z[0] + 4} 6H${SLOT_Z[1] - 4}M${SLOT_Z[0] + 4} 12H${SLOT_Z[1] - 4}`, stroke: "ply-2", width: 0.75 }],
      only: ["assembled"],
      sheet: false,
      order: 10,
    },
  ],
  platform: { parts: ["platform", "platform-seated", "tab-end"], level: LEVEL, levels: LEVELS },
  exploded: {
    "side-l": [-150, 0, 0],
    "side-r": [150, 0, 0],
  },
  dowels: [
    { at: [0, RAIL_Y, RAIL_Z.front], part: "side-l", with: "rail-front" },
    { at: [W, RAIL_Y, RAIL_Z.front], part: "side-r", with: "rail-front" },
    { at: [0, RAIL_Y, RAIL_Z.back], part: "side-l", with: "rail-back" },
    { at: [W, RAIL_Y, RAIL_Z.back], part: "side-r", with: "rail-back" },
    { at: [T, 131, 50], part: "side-l", with: "tread-1" },
    { at: [W - T, 131, 50], part: "side-r", with: "tread-1" },
    { at: [T, 251, 50], part: "side-l", with: "tread-2" },
    { at: [W - T, 251, 50], part: "side-r", with: "tread-2" },
    { at: [0, LEVEL - T / 2, 270], part: "side-l", with: "platform" },
    { at: [W, LEVEL - T / 2, 270], part: "side-r", with: "platform" },
  ],
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: W },
    { key: "heightCm", axis: "h", from: 0, to: H },
    { key: "depthCm", axis: "d", from: 0, to: D },
    { key: "extra.ارتفاع سکو (وسط)", axis: "h", from: 0, to: LEVEL, view: "side" },
  ],
  anchors: {
    engravePlate: [T, 182, 0, INNER, 60],
    platformLevels: LEVELS,
  },
} satisfies Manifest;

export default learningTower;
