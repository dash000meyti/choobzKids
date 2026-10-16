/*
 * قفسهٔ مونته‌سوری اسباب‌بازی — 900 × 500 × 300 mm, 18 mm birch ply
 * (products.json `montessori-shelf`).
 *
 * Two side panels carry two shelves in dados, each tier 220 mm clear; the top
 * sits on the sides with rounded corners and a back panel closes the shelf
 * between them. The bottom shelf rides 6 mm above the floor so its tier is
 * the same 220 as the one above.
 *
 * Assembled, four of the shop's toys stand on it at their real size, as
 * simple shapes: the rainbow on top, the duck and a board book in the middle
 * tier, two pieces of the blocks set below. They are not part of the product,
 * so the exploded, dimension and sheet drawings leave them out (and the
 * layered stage fades them out when it explodes).
 */

import { grainLines, rrect } from "../project";
import duckPullToy from "./duck-pull-toy";
import { arcSeam, standingArc } from "./rainbow-stacker";
import { blockShapes } from "./wooden-blocks";
import type { Detail, Manifest, Part, Vec3 } from "./types";

const W = 900;
const H = 500;
const D = 300;
const T = 18;
const TIER = 220;
const BOTTOM_Y = H - T - 2 * TIER - 2 * T; // 6: underside of the bottom shelf
const SHELF_TOPS = [BOTTOM_Y + T, BOTTOM_Y + 2 * T + TIER] as const; // 24, 262
const SIDE_H = H - T;
const INNER = W - 2 * T;
const BACK_Z = D - T;

const shelfGrain = grainLines([
  [40, 90, 820, 96, 4],
  [60, 196, 800, 190, -4],
]);
const sideGrain = grainLines([
  [60, 30, 66, 440, 4],
  [180, 50, 174, 460, -5],
  [256, 20, 260, 300, 3],
]);

/** Moves a part by `offset` (world mm) under a new id; outlines are local, so only the anchor points move. */
function movePart<P extends Part>(part: P, offset: Vec3, id: string, extra: Partial<Part> = {}): P {
  const at = (p: Vec3): Vec3 => [p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]];
  const base = { ...part, id, ...extra } as P;
  switch (base.kind) {
    case "panel":
    case "extrusion":
      return { ...base, origin: at(base.origin) };
    case "rod":
      return { ...base, from: at(base.from), to: at(base.to) };
    case "cord":
      return { ...base, points: base.points.map(at) };
  }
}

/* ---- Toys (assembled only, never cut from the shelf's sheet) ---- */

const toy = { only: ["assembled"], sheet: false, shadow: false } as const;

/** The rainbow stacker on top: its silhouette with the eleven seams between the arcs. */
const RAINBOW = { cx: 640, z: 170, r: 180, hole: 18, band: 13.5 } as const;
const rainbowSeams: Detail = {
  d: Array.from({ length: 11 }, (_, i) => arcSeam(RAINBOW.cx, RAINBOW.r - (i + 1) * RAINBOW.band)).join(""),
  width: 0.75,
};

/** A board book in the middle tier, standing face-out against the back panel. */
const BOOK = { x: 620, w: 150, h: 150, t: 18 } as const;
const bookCover = rrect(0, 0, BOOK.w, BOOK.h, 4);

/** The duck pull toy (its own manifest's body, base and front wheels) in the middle tier, facing inline-end. */
const DUCK_AT: Vec3 = [130, SHELF_TOPS[1], 80];
const DUCK_PARTS = ["base", "body", "wheel-fl", "wheel-fr"];
const duckParts = duckPullToy.parts
  .filter((p) => DUCK_PARTS.includes(p.id))
  .map((p, i) => {
    const part = p as Part;
    // Keep the beak and the eye; the wing, grain and catch-light are too fine at shelf scale.
    const trimmed: Partial<Part> =
      part.kind === "extrusion"
        ? { strata: 3, grain: undefined, details: part.details?.filter((d) => d.fill === "asal" || d.fill === "char") }
        : part.kind === "panel"
          ? { grain: undefined }
          : {};
    return movePart(part, DUCK_AT, `duck-${p.id}`, { ...toy, ...trimmed, order: 6 + i / 10 });
  });

/** A half-circle on an arch, from the blocks set, on the bottom shelf. */
const STACK_AT = { x: 300, z: 120 } as const;
const stackBlock = (name: "arch" | "halfCircle", level: number): Part => ({
  id: `block-${name === "halfCircle" ? "half-circle" : name}`,
  kind: "extrusion",
  origin: [STACK_AT.x, SHELF_TOPS[0] + level * blockShapes.unit, STACK_AT.z],
  depth: blockShapes.unit,
  profile: blockShapes[name],
  band: "wood",
  order: 4 + level / 10,
  ...toy,
});

const toys: Part[] = [
  stackBlock("arch", 0),
  stackBlock("halfCircle", 1),
  ...duckParts,
  {
    id: "rainbow",
    kind: "extrusion",
    origin: [0, H, RAINBOW.z],
    depth: 70,
    profile: standingArc(RAINBOW.cx, RAINBOW.r, RAINBOW.hole),
    strata: 2,
    details: [rainbowSeams],
    order: 9,
    ...toy,
  },
  {
    id: "book",
    kind: "panel",
    plane: "XY",
    origin: [BOOK.x, SHELF_TOPS[1], BACK_Z - BOOK.t - 2],
    t: BOOK.t,
    outline: bookCover,
    strata: 1,
    details: [{ d: bookCover, fill: "anar", stroke: "ink", width: 1, opacity: 0.3 }],
    order: 6.5,
    ...toy,
  },
];

const montessoriShelf = {
  key: "montessori-shelf",
  source: "measured",
  size: { w: W, h: H + RAINBOW.r, d: D },
  parts: [
    {
      id: "back",
      kind: "panel",
      plane: "XY",
      origin: [T, BOTTOM_Y, BACK_Z],
      t: T,
      outline: rrect(0, 0, INNER, SIDE_H - BOTTOM_Y, 3),
      grain: grainLines([
        [60, 120, 800, 128, 5],
        [40, 330, 820, 322, -6],
      ]),
      order: 1,
    },
    { id: "side-r", kind: "panel", plane: "YZ", origin: [W - T, 0, 0], t: T, outline: rrect(0, 0, D, SIDE_H, 6), order: 2 },
    {
      id: "shelf-1",
      kind: "panel",
      plane: "XZ",
      origin: [T, BOTTOM_Y, 0],
      t: T,
      outline: rrect(0, 0, INNER, BACK_Z, 3),
      order: 3,
    },
    {
      id: "shelf-2",
      kind: "panel",
      plane: "XZ",
      origin: [T, SHELF_TOPS[1] - T, 0],
      t: T,
      outline: rrect(0, 0, INNER, BACK_Z, 3),
      grain: shelfGrain,
      order: 5,
    },
    {
      id: "side-l",
      kind: "panel",
      plane: "YZ",
      origin: [0, 0, 0],
      t: T,
      outline: rrect(0, 0, D, SIDE_H, 6),
      grain: sideGrain,
      order: 7,
    },
    {
      id: "top",
      kind: "panel",
      plane: "XZ",
      origin: [0, SIDE_H, 0],
      t: T,
      outline: rrect(0, 0, W, D, 20),
      grain: grainLines([
        [50, 70, 850, 78, 5],
        [30, 160, 870, 152, -7],
        [70, 240, 830, 246, 4],
      ]),
      order: 8,
    },
    ...toys,
  ],
  exploded: {
    "side-l": [-130, 0, 0],
    "side-r": [130, 0, 0],
    top: [0, 150, 0],
    back: [0, 0, 160],
  },
  dowels: [
    ...SHELF_TOPS.flatMap((y, k) =>
      [70, 230].flatMap((z) => [
        { at: [0, y - T / 2, z] as Vec3, part: "side-l", with: `shelf-${k + 1}` },
        { at: [W, y - T / 2, z] as Vec3, part: "side-r", with: `shelf-${k + 1}` },
      ]),
    ),
    ...[60, 240].flatMap((z) => [
      { at: [T / 2, SIDE_H, z] as Vec3, part: "side-l", with: "top" },
      { at: [W - T / 2, SIDE_H, z] as Vec3, part: "side-r", with: "top" },
    ]),
    { at: [W / 2, SHELF_TOPS[1] - T / 2, BACK_Z], part: "back", with: "shelf-2" },
  ],
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: W },
    { key: "extra.ارتفاع فضای هر طبقه", axis: "h", from: SHELF_TOPS[0], to: SHELF_TOPS[0] + TIER },
    { key: "heightCm", axis: "h", from: 0, to: H },
    { key: "depthCm", axis: "d", from: 0, to: D },
  ],
} satisfies Manifest;

export default montessoriShelf;
