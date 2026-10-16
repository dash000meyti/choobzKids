/*
 * اردک چرخ‌دار چوبی — 200 long × 160 high × 110 wide (products.json `duck-pull-toy`).
 *
 * The real product behind Tati: a duck laminated from three layers of 18 mm
 * birch ply on an 18 mm cart base, four ply wheels Ø54 on hardwood axles (hidden
 * inside the base; the exploded view shows their axis), a short cotton string
 * with a wooden handle. Faces inline-end (left), like Tati.
 * Colour only where the toy is painted: the wheel hubs (anar) and the beak (asal).
 */

import { circle, grainLines, rrect } from "../project";
import type { Manifest, Part, Vec3 } from "./types";

const L = 200;
const H = 160;
const W = 110;
const T = 18;
const WHEEL_R = 27;
const WHEEL_T = 14;
const AXLE_Y = WHEEL_R;
const BASE = { x: 10, y: 18, z: 16, length: 180, width: 78 } as const;
const BODY_Z = 28;
const BODY_DEPTH = 3 * T;

/** Side profile, beak at x = 0, tail tip at x = 200, sitting on the base top (y = 36). */
const bodyProfile =
  "M44 36H164C182 36 194 66 200 106C188 101 170 90 148 88C126 86 108 94 99 112" +
  "C97 140 84 160 60 160C42 160 30 150 26 134L9 131C3 130 0 126 0 122C0 118 3 115 9 114L28 110" +
  "C20 100 12 82 17 62C21 46 31 36 44 36Z";

const beak = "M26 134L9 131C3 130 0 126 0 122C0 118 3 115 9 114L28 110C25 118 24 127 26 134Z";
const eye = circle(50, 132, 4.6);
const eyeLight = circle(48.6, 133.6, 1.4);
const wing = "M98 74C110 60 136 58 156 74C142 70 128 72 118 82C112 88 104 86 98 74Z";
const bodyGrain = grainLines([
  [46, 52, 160, 54, 3],
  [62, 96, 92, 120, -3],
  [120, 46, 176, 60, -2],
]);

const wheel = circle(0, 0, WHEEL_R);
const hub = circle(0, 0, 8);

function wheelPart(id: string, x: number, z: number, order: number): Part {
  return {
    id,
    kind: "panel",
    plane: "XY",
    origin: [x, AXLE_Y, z],
    t: WHEEL_T,
    outline: wheel,
    details: [{ d: hub, fill: "anar", stroke: "ink", width: 1 }],
    order,
  };
}

const WHEEL_X = [50, 150] as const;
const BACK_Z = W - WHEEL_T;

const handleZ = [40, 92] as const;
const handleAt: Vec3 = [-74, 8, (handleZ[0] + handleZ[1]) / 2];

const duckPullToy = {
  key: "duck-pull-toy",
  source: "measured",
  size: { w: L, h: H, d: W },
  sheet: { w: 640, h: 340, t: T },
  parts: [
    wheelPart("wheel-bl", WHEEL_X[0], BACK_Z, 1),
    wheelPart("wheel-br", WHEEL_X[1], BACK_Z, 1),
    {
      id: "base",
      kind: "panel",
      plane: "XZ",
      origin: [BASE.x, BASE.y, BASE.z],
      t: T,
      outline: rrect(0, 0, BASE.length, BASE.width, 8),
      grain: grainLines([
        [14, 22, 166, 26, 2],
        [20, 54, 160, 50, -2],
      ]),
      order: 3,
    },
    {
      id: "body",
      kind: "extrusion",
      origin: [0, 0, BODY_Z],
      depth: BODY_DEPTH,
      profile: bodyProfile,
      grain: bodyGrain,
      strata: 6,
      sheet: 3,
      details: [
        { d: beak, fill: "asal", stroke: "ink", width: 1 },
        { d: wing, fill: "wood-side", stroke: "ink", width: 1 },
        { d: eye, fill: "char" },
        { d: eyeLight, fill: "paper" },
      ],
      order: 4,
    },
    {
      id: "string",
      kind: "cord",
      points: [
        [BASE.x, 27, 55],
        [-14, 27, 56],
        [-30, 6, 60],
        [handleAt[0] + 8, 9, handleAt[2]],
      ],
      tone: "anar",
      width: 1.5,
      order: 5,
    },
    {
      id: "handle",
      kind: "rod",
      from: [handleAt[0], handleAt[1], handleZ[0]],
      to: [handleAt[0], handleAt[1], handleZ[1]],
      d: 16,
      shadow: false,
      order: 6,
    },
    wheelPart("wheel-fl", WHEEL_X[0], 0, 7),
    wheelPart("wheel-fr", WHEEL_X[1], 0, 7),
  ],
  exploded: {
    "wheel-fl": [0, 0, -60],
    "wheel-fr": [0, 0, -60],
    "wheel-bl": [0, 0, 60],
    "wheel-br": [0, 0, 60],
    body: [0, 56, 0],
  },
  dowels: [
    ...WHEEL_X.flatMap((x) => [
      { at: [x, AXLE_Y, 0] as Vec3, part: `wheel-f${x === WHEEL_X[0] ? "l" : "r"}` },
      { at: [x, AXLE_Y, W] as Vec3, part: `wheel-b${x === WHEEL_X[0] ? "l" : "r"}` },
    ]),
    { at: [70, 36, 55], part: "body" },
    { at: [140, 36, 55], part: "body" },
  ],
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: L },
    { key: "heightCm", axis: "h", from: 0, to: H },
    { key: "depthCm", axis: "d", from: 0, to: W },
  ],
} satisfies Manifest;

export default duckPullToy;
