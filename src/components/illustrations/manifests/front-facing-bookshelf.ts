/*
 * کتابخانهٔ روبه‌رو — 600 wide × 800 high × 120 deep, 15 mm birch ply
 * (products.json `front-facing-bookshelf`, the 60 cm width).
 *
 * Stands on the floor against the wall (an L-bracket ties it back): a back
 * panel between two side panels, three ledges 80 deep with their tops at
 * 100 / 350 / 600 (spec: «حدود ۱۰، ۳۵ و ۶۰ سانتی‌متر») and a 60 mm lip in front
 * of each, set 10 mm behind the sides' front edge. The sides ease back above
 * the top lip. Picture books stand face-out on the ledges, leaning on the back
 * panel — plain tinted covers, no titles (assembled view only; they are not
 * part of the product).
 */

import { circle, grainLines, roundedPolygon, rrect } from "../project";
import type { Manifest, Part, Tone } from "./types";

const W = 600;
const H = 800;
const D = 120;
const T = 15;
const INNER = W - 2 * T;

const LEVELS = [100, 350, 600] as const;
const LEDGE_Z = [25, D - T] as const; // 80 deep, from the lip's back face to the back panel
const LIP = { z: 10, h: 60 } as const;

/** Side panel in (u = z, v = y): full depth up to the top lip, then easing back toward the wall. */
const sideOutline = roundedPolygon(
  [
    [0, 0],
    [D, 0],
    [D, H],
    [44, H],
    [0, 700],
  ],
  [6, 6, 6, 28, 90],
);
const sideGrain = grainLines([
  [30, 60, 34, 640, 5],
  [72, 120, 66, 760, -6],
  [102, 40, 106, 520, 4],
]);

const backGrain = grainLines([
  [80, 40, 86, 760, 8],
  [210, 120, 204, 700, -6],
  [330, 30, 336, 780, 7],
  [470, 90, 464, 740, -8],
]);

const lipOutline = rrect(0, 0, INNER, LIP.h, 5);
const lipGrain = grainLines([
  [30, 24, 540, 30, 3],
  [60, 42, 510, 38, -2],
]);

/**
 * A picture book: cover size, distance from the left side's inner face, and
 * cover paint. Drawing tones have no accent tints, so covers are washes of the
 * physical paints (pomegranate, honey, walnut) and one cream paper cover.
 */
type Book = { w: number; h: number; x: number; cover: Tone; opacity?: number };
const SHELVES: readonly (readonly Book[])[] = [
  [
    { w: 250, h: 220, x: 22, cover: "anar", opacity: 0.45 },
    { w: 230, h: 205, x: 300, cover: "paper" },
  ],
  [
    { w: 215, h: 215, x: 40, cover: "asal", opacity: 0.55 },
    { w: 260, h: 200, x: 278, cover: "char", opacity: 0.2 },
  ],
  [{ w: 245, h: 265, x: 150, cover: "anar", opacity: 0.25 }],
];
const BOOK_T = 11;
const BOOK_Z = LEDGE_Z[0] + 2; // front bottom edge just behind the lip

/** Lean that puts a book's top back edge on the back panel: h·sin a + t·cos a = reach. */
function leanFor(h: number): number {
  const reach = LEDGE_Z[1] - BOOK_Z;
  let a = 0.2;
  for (let i = 0; i < 12; i++) a = Math.asin((reach - BOOK_T * Math.cos(a)) / h);
  return a;
}

function book(level: number, b: Book, id: string, order: number): Part {
  const a = leanFor(b.h);
  const cover = rrect(0, 0, b.w, b.h, 4);
  return {
    id,
    kind: "panel",
    plane: { u: [1, 0, 0], v: [0, Math.cos(a), Math.sin(a)] },
    // Resting on its back bottom edge, which sits on the ledge.
    origin: [T + b.x, level + BOOK_T * Math.sin(a), BOOK_Z],
    t: BOOK_T,
    outline: cover,
    strata: 1,
    details: [{ d: cover, fill: b.cover, stroke: "ink", width: 1, opacity: b.opacity }],
    sheet: false,
    shadow: false,
    only: ["assembled"],
    order,
  };
}

function level(k: number): Part[] {
  const y = LEVELS[k];
  const order = 3 + k;
  return [
    {
      id: `ledge-${k + 1}`,
      kind: "panel",
      plane: "XZ",
      origin: [T, y - T, LEDGE_Z[0]],
      t: T,
      outline: rrect(0, 0, INNER, LEDGE_Z[1] - LEDGE_Z[0], 3),
      order,
    },
    ...SHELVES[k].map((b, i) => book(y, b, `book-${k + 1}-${i + 1}`, order + 0.3)),
    {
      id: `lip-${k + 1}`,
      kind: "panel",
      plane: "XY",
      origin: [T, y - T, LIP.z],
      t: LEDGE_Z[0] - LIP.z,
      outline: lipOutline,
      grain: lipGrain,
      order: order + 0.6,
    },
  ];
}

/** Steel L-bracket on the back panel's top edge, screwed up into the wall (clear of the top book). */
const BRACKET = { x: W - T - 110, w: 40, up: 40 } as const;
const bracketPlate = rrect(0, 0, BRACKET.w, BRACKET.up + 2, 3);

const frontFacingBookshelf = {
  key: "front-facing-bookshelf",
  source: "measured",
  size: { w: W, h: H, d: D },
  sheet: { w: 2440, h: 1220, t: T },
  parts: [
    {
      id: "side-r",
      kind: "panel",
      plane: "YZ",
      origin: [W - T, 0, 0],
      t: T,
      outline: sideOutline,
      grain: sideGrain,
      order: 1,
    },
    {
      id: "back",
      kind: "panel",
      plane: "XY",
      origin: [T, 0, D - T],
      t: T,
      outline: rrect(0, 0, INNER, H, 3),
      grain: backGrain,
      order: 2,
    },
    {
      id: "bracket",
      kind: "panel",
      plane: "XY",
      origin: [BRACKET.x, H - 2, D],
      t: 0,
      outline: bracketPlate,
      details: [
        { d: bracketPlate, fill: "ply-3" },
        { d: circle(BRACKET.w / 2, BRACKET.up - 12, 4), fill: "ply-1" },
      ],
      sheet: false,
      order: 2.5,
    },
    ...level(0),
    ...level(1),
    ...level(2),
    {
      id: "side-l",
      kind: "panel",
      plane: "YZ",
      origin: [0, 0, 0],
      t: T,
      outline: sideOutline,
      grain: sideGrain,
      order: 7,
    },
  ],
  exploded: {
    "side-l": [-130, 0, 0],
    "side-r": [130, 0, 0],
    back: [0, 0, 170],
    bracket: [0, 60, 170],
    ...Object.fromEntries(LEVELS.map((_, k) => [`lip-${k + 1}`, [0, 0, -150] as const])),
  },
  dowels: [
    ...LEVELS.flatMap((y, k) => [
      { at: [0, y - T / 2, 65] as const, part: "side-l", with: `ledge-${k + 1}` },
      { at: [W, y - T / 2, 65] as const, part: "side-r", with: `ledge-${k + 1}` },
      { at: [W / 2, y - T / 2, LEDGE_Z[0]] as const, part: `lip-${k + 1}`, with: `ledge-${k + 1}` },
    ]),
  ],
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: W },
    { key: "heightCm", axis: "h", from: 0, to: H },
    { key: "depthCm", axis: "d", from: 0, to: D },
    { key: "extra.عمق هر طبقه", axis: "d", from: LEDGE_Z[0], to: LEDGE_Z[1] },
  ],
} satisfies Manifest;

export default frontFacingBookshelf;
