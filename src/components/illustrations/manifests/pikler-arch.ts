/*
 * آرک پیکلر — 950 long × 450 high × 500 deep (products.json `pikler-arch`).
 *
 * Two arch sides cut from 18 mm birch ply (outer radius 475, band 90), joined
 * by 12 hardwood rungs Ø28 on the band's centre line with ~70 mm clear spacing.
 * Default pose is the bridge; `rocker` flips it into the cradle for room scenes.
 */

import { arcLine, archBand, circle, joinPaths } from "../project";
import type { Manifest, Part, Vec3 } from "./types";

const L = 950;
const H = 450;
const D = 500;
const T = 18;
const OUTER = 475;
const BAND = 90;
const CX = L / 2;
const CY = H - OUTER; // centre sits just below the floor, so the feet are cut flat
const RUNG_D = 28;
const RUNG_COUNT = 12;
const RUNG_R = OUTER - BAND / 2;
const RUNG_STEP = (RUNG_D + 70) / RUNG_R; // radians between rung centres

const side = archBand({ cx: CX, cy: CY, outer: OUTER, inner: OUTER - BAND, floor: 0, r: 6 });

const sideGrain = joinPaths(
  arcLine(CX, CY, OUTER - 18, 160, 112),
  arcLine(CX, CY, OUTER - 46, 128, 64),
  arcLine(CX, CY, OUTER - 70, 58, 18),
);

const rungAngle = (k: number) => Math.PI / 2 + (k - (RUNG_COUNT - 1) / 2) * RUNG_STEP;
const rungCentre = (k: number): [number, number] => [
  CX + RUNG_R * Math.cos(rungAngle(k)),
  CY + RUNG_R * Math.sin(rungAngle(k)),
];

const rungs: Part[] = Array.from({ length: RUNG_COUNT }, (_, k) => {
  const [x, y] = rungCentre(k);
  return {
    id: `rung-${k + 1}`,
    kind: "rod",
    from: [x, y, 0] as Vec3,
    to: [x, y, D] as Vec3,
    d: RUNG_D,
    capOnTop: true,
    exposed: [T, D - T] as const,
    order: 2,
  } satisfies Part;
});

const rungHoles = joinPaths(...Array.from({ length: RUNG_COUNT }, (_, k) => circle(...rungCentre(k), RUNG_D / 2)));

const piklerArch = {
  key: "pikler-arch",
  source: "measured",
  size: { w: L, h: H, d: D },
  parts: [
    {
      id: "side-back",
      kind: "panel",
      plane: "XY",
      origin: [0, 0, D - T],
      t: T,
      outline: side,
      holes: rungHoles,
      grain: sideGrain,
      order: 1,
    },
    ...rungs,
    {
      id: "side-front",
      kind: "panel",
      plane: "XY",
      origin: [0, 0, 0],
      t: T,
      outline: side,
      holes: rungHoles,
      grain: sideGrain,
      order: 3,
    },
  ],
  exploded: {
    "side-front": [0, 0, -170],
    "side-back": [0, 0, 170],
  },
  dowels: [0, 5, 11].flatMap((k) => {
    const [x, y] = rungCentre(k);
    return [
      { at: [x, y, 0] as Vec3, part: "side-front" },
      { at: [x, y, D] as Vec3, part: "side-back" },
    ];
  }),
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: L },
    { key: "heightCm", axis: "h", from: 0, to: H },
    { key: "depthCm", axis: "d", from: 0, to: D },
  ],
  poses: { rocker: { flipY: true } },
} satisfies Manifest;

export default piklerArch;
