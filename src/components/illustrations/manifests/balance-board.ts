/*
 * تخته تعادل — 800 long × 180 high × 300 wide, 15 mm thick (products.json `balance-board`).
 *
 * One bent-laminated birch board: an arc band 15 mm thick with fully rounded
 * ends, its lowest point on the floor and both tips 180 above it. The front
 * face is the end grain of the pressed veneers, so the laminations run along
 * the whole curve (the hero detail); grain strokes follow the curve on the
 * concave top surface. The flat view shows the ten 1.5 mm veneer blanks the
 * board is pressed from, grain along their length.
 *
 * The renderer paints an extrusion as its front and back profiles joined by
 * silhouette lines, which reads right for sheet parts but leaves a thin profile
 * swept 300 mm deep hollow. So, in the oblique views, the board's own details
 * repaint it: the swept surface as overlapping copies of the profile, the
 * shaded underside at the left end, the true outline (the back profile's
 * leading edges and the tangent lines along the sweep), the grain, and the
 * front face on top.
 */

import { OBLIQUE_DX, OBLIQUE_DY, arcLine, joinPaths, nums, rrect } from "../project";
import type { Detail, Manifest, Vec2 } from "./types";

const L = 800;
const H = 180;
const D = 300;
const T = 15;
const END_R = T / 2;

/*
 * Arc through the band's centre line, radius Rm around (L/2, Rm + END_R),
 * spanning ±θ from the bottom. Tips: Rm·sin θ + END_R = L/2 and
 * Rm·(1 − cos θ) + T = H, so tan(θ/2) = (H − T) / (L/2 − END_R).
 */
const HALF_ANGLE = 2 * Math.atan((H - T) / (L / 2 - END_R));
const RM = (L / 2 - END_R) / Math.sin(HALF_ANGLE);
const RO = RM + END_R;
const RI = RM - END_R;
const CENTRE: Vec2 = [L / 2, RO];

const DEG = Math.PI / 180;
/** Standard angles (degrees, counter-clockwise, v up) of the band's ends seen from the arc centre. */
const LEFT_END = 270 - HALF_ANGLE / DEG;
const RIGHT_END = 270 + HALF_ANGLE / DEG;

/** Point at standard angle `deg` on the circle of radius `r` around `c`. */
const polar = (c: Vec2, r: number, deg: number): Vec2 => [
  c[0] + r * Math.cos(deg * DEG),
  c[1] + r * Math.sin(deg * DEG),
];
const arcTo = (r: number, to: Vec2, ccw: boolean) => `A${nums([r, r])} 0 0 ${ccw ? 1 : 0} ${nums(to)}`;

/** Centre of a tip's rounding, on the band's centre line. */
const tipCentre = (c: Vec2, end: number) => polar(c, RM, end);

/** The band around arc centre `c`: outer arc, rounded right tip, inner arc back, rounded left tip. */
function band(c: Vec2): string {
  return (
    `M${nums(polar(c, RO, LEFT_END))}` +
    arcTo(RO, polar(c, RO, RIGHT_END), true) +
    arcTo(END_R, polar(c, RI, RIGHT_END), true) +
    arcTo(RI, polar(c, RI, LEFT_END), false) +
    arcTo(END_R, polar(c, RO, LEFT_END), true) +
    "Z"
  );
}

const profile = band(CENTRE);

/**
 * Glue lines between the veneers, each running on into the rounded tips until
 * it meets the rounding. Drawn as four layers, like every ply band (3–5
 * stripes), rather than the real ten.
 */
const laminations = joinPaths(
  ...[0.25, 0.5, 0.75].map((f) => {
    const r = RI + f * T;
    const reach = Math.acos((r * r + RM * RM - END_R * END_R) / (2 * r * RM)) / DEG;
    return arcLine(CENTRE[0], CENTRE[1], r, LEFT_END - reach, RIGHT_END + reach);
  }),
);

/* ---- The oblique repaint, in the front face's frame (XY at z = 0, v up). ---- */

/** Where the back profile (z = D) lands in that frame. */
const SWEEP: Vec2 = [-OBLIQUE_DX * D, OBLIQUE_DY * D];
const BACK: Vec2 = [CENTRE[0] + SWEEP[0], CENTRE[1] + SWEEP[1]];
const SWEEP_DEG = Math.atan2(SWEEP[1], SWEEP[0]) / DEG;
/** Outline normals perpendicular to the sweep: where the silhouette leaves the profile. */
const TANGENT_LO = SWEEP_DEG - 90;
const TANGENT_HI = SWEEP_DEG + 90;

/** Copies of the profile along the sweep, close enough that the rounded tips leave no visible scallops. */
const SURFACE_STEPS = 24;
const surface: Detail[] = Array.from({ length: SURFACE_STEPS + 1 }, (_, k) => ({
  d: band([CENTRE[0] + (SWEEP[0] * k) / SURFACE_STEPS, CENTRE[1] + (SWEEP[1] * k) / SURFACE_STEPS]),
  fill: "wood-top",
}));

/**
 * Where the back inner arc dips behind the front face: the lower crossing of
 * the two equal inner circles, as a standard angle on the back circle.
 */
const BACK_INNER_HIDDEN = (() => {
  const half = Math.hypot(SWEEP[0], SWEEP[1]) / 2;
  const across = Math.sqrt(RI * RI - half * half);
  const toward = TANGENT_LO * DEG; // the sweep's normal that points up into the bowl
  const crossing: Vec2 = [
    CENTRE[0] + SWEEP[0] / 2 - across * Math.cos(toward),
    CENTRE[1] + SWEEP[1] / 2 - across * Math.sin(toward),
  ];
  const deg = Math.atan2(crossing[1] - BACK[1], crossing[0] - BACK[0]) / DEG;
  return (deg + 360) % 360;
})();

/**
 * The visible outline beyond the front face: the back profile's leading edges
 * (right tip into the inner arc, up to where the front face hides it; left tip
 * into the outer arc) and the three lines along the sweep where the outline
 * turns away — over both tips and under the left end's outer arc. The inner
 * arc's own turning line is no edge: the swept left tip covers it.
 */
const silhouette = (() => {
  const back = (r: number, deg: number) => polar(BACK, r, deg);
  const front = (r: number, deg: number) => polar(CENTRE, r, deg);
  const rightTip = (c: Vec2, n: number) => polar(tipCentre(c, RIGHT_END), END_R, n);
  const leftTip = (c: Vec2, n: number) => polar(tipCentre(c, LEFT_END), END_R, n);
  const line = (a: Vec2, b: Vec2) => `M${nums(a)}L${nums(b)}`;
  return joinPaths(
    `M${nums(rightTip(BACK, TANGENT_LO))}` +
      arcTo(END_R, back(RI, RIGHT_END), true) +
      arcTo(RI, back(RI, BACK_INNER_HIDDEN), false),
    `M${nums(leftTip(BACK, TANGENT_LO))}` +
      arcTo(END_R, back(RO, LEFT_END), true) +
      arcTo(RO, back(RO, TANGENT_HI), true),
    line(rightTip(CENTRE, TANGENT_LO), rightTip(BACK, TANGENT_LO)),
    line(leftTip(CENTRE, TANGENT_LO), leftTip(BACK, TANGENT_LO)),
    line(front(RO, TANGENT_HI), back(RO, TANGENT_HI)),
  );
})();

/**
 * The shaded part of the left end: the strip of convex underside that turns
 * toward the viewer there, and the lower half of the rounded tip (normals past
 * 135° face the receding side rather than up — the same rule the renderer uses
 * for faces).
 */
const SHADE_SPLIT = 135;
const leftShade = (() => {
  const tip = (c: Vec2, n: number) => polar(tipCentre(c, LEFT_END), END_R, n);
  return (
    `M${nums(polar(CENTRE, RO, LEFT_END))}` +
    arcTo(RO, polar(CENTRE, RO, TANGENT_HI), true) +
    `L${nums(polar(BACK, RO, TANGENT_HI))}` +
    arcTo(RO, polar(BACK, RO, LEFT_END), false) +
    arcTo(END_R, tip(BACK, SHADE_SPLIT), false) +
    `L${nums(tip(CENTRE, SHADE_SPLIT))}` +
    arcTo(END_R, polar(CENTRE, RO, LEFT_END), true) +
    "Z"
  );
})();

/** Grain along the concave top: the inner arc at depth z, from/to in degrees either side of the bottom, kept in view. */
const topGrain = joinPaths(
  ...(
    [
      [70, -14, 38],
      [150, -20, 32],
      [230, -10, 40],
    ] as const
  ).map(([z, from, to]) => arcLine(CENTRE[0] - OBLIQUE_DX * z, CENTRE[1] + OBLIQUE_DY * z, RI, 270 + from, 270 + to)),
);

const laminationLines: Detail = { d: laminations, stroke: "ply-2", width: 1 };

const boardBase = {
  kind: "extrusion",
  origin: [0, 0, 0],
  depth: D,
  profile,
  face: "edge",
  band: "wood",
  strata: 1,
  sheet: false,
} as const;

/** Developed length of the centre line, tip to tip: the veneer blank before pressing. */
const BLANK = Math.ceil((RM * 2 * HALF_ANGLE + T) / 10) * 10;
const VENEERS = 10; // 15 mm of 1.5 mm birch veneer
/** A veneer leaf just big enough for the blanks in two columns (the flat view nests parts 30 mm apart). */
const NEST_GAP = 30;
const LEAF = { w: 2 * BLANK + 3 * NEST_GAP, h: (VENEERS / 2) * (D + NEST_GAP) + NEST_GAP, t: 1.5 } as const;

const balanceBoard = {
  key: "balance-board",
  source: "measured",
  size: { w: L, h: H, d: D },
  sheet: LEAF,
  parts: [
    {
      ...boardBase,
      id: "board",
      only: ["assembled", "exploded"],
      details: [
        ...surface,
        { d: leftShade, fill: "wood-side" },
        { d: silhouette, stroke: "ink", width: 1.75 },
        { d: topGrain, stroke: "ply-2", width: 1, opacity: 0.35 },
        { d: profile, fill: "ply-1", stroke: "ink", width: 1 },
        laminationLines,
      ],
    },
    {
      // The elevations see the front face square-on: laminations only.
      ...boardBase,
      id: "board-elevation",
      only: ["ortho"],
      details: [laminationLines],
    },
    {
      id: "veneer",
      kind: "panel",
      plane: "XZ",
      origin: [0, 0, 0],
      t: LEAF.t,
      outline: rrect(0, 0, BLANK, D, 6),
      sheet: VENEERS,
      only: ["flat"],
    },
  ],
  dims: [
    { key: "widthCm", axis: "w", from: 0, to: L },
    { key: "heightCm", axis: "h", from: 0, to: H },
    { key: "depthCm", axis: "d", from: 0, to: D },
  ],
} satisfies Manifest;

export default balanceBoard;
