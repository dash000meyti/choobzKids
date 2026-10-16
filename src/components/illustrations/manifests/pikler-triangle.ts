/*
 * مثلث پیکلر با رمپ — open 700 wide × 850 deep × 750 high (products.json `pikler-triangle`).
 *
 * Drawn with the A-frame facing the viewer: world x runs along the product's
 * 850 mm depth, z along its 700 mm rungs. Two ladders hinge at the apex (the
 * right one nests inside the left so it folds to ~120 mm); 8 hardwood rungs
 * per side, Ø25 with ~70 mm clear spacing. The double-sided ramp (1000 × 400)
 * hooks over the left ladder's third rung from the top, climbing face up.
 */

import { circle, grainLines, joinPaths, rrect, slat, slatAxis } from "../project";
import type { Manifest, Part, Vec2, Vec3 } from "./types";

const SPAN = 850; // A-frame footprint (product depth)
const H = 750;
const RUNG_LEN = 700; // product width
const T = 18;
const LEG_W = 60;
const RUNG_D = 25;
const RUNG_PITCH = 93; // along the leg: 25 mm rung + ~68 mm clear
const FIRST_RUNG = 92; // from the hinge centre down the leg
const RUNGS_PER_SIDE = 8;

const hinge: Vec2 = [SPAN / 2, H - LEG_W / 2];
const leftLeg = slat([0, 0], hinge, LEG_W, "right");
const rightLeg = slat([SPAN, 0], hinge, LEG_W, "left");
const leftAxis = slatAxis([0, 0], hinge, LEG_W, "right");
const rightAxis = slatAxis([SPAN, 0], hinge, LEG_W, "left");

const rungAt = (axis: typeof leftAxis, k: number) => axis.at(FIRST_RUNG + k * RUNG_PITCH);

const legGrain = (axis: typeof leftAxis) => {
  const a = axis.at(150, -15);
  const b = axis.at(720, -17);
  const c = axis.at(230, 16);
  const d = axis.at(780, 14);
  return grainLines([
    [a[0], a[1], b[0], b[1], 3],
    [c[0], c[1], d[0], d[1], -2],
  ]);
};

const hingeBolt = circle(hinge[0], hinge[1], 7);

/** Rung holes along the leg plus the hinge bolt hole. */
const legHoles = (axis: typeof leftAxis) =>
  joinPaths(
    circle(hinge[0], hinge[1], 5),
    ...Array.from({ length: RUNGS_PER_SIDE }, (_, k) => {
      const [x, y] = rungAt(axis, k);
      return circle(x, y, RUNG_D / 2);
    }),
  );

/* Outer ladder (left): legs on the outside faces, rungs right through them. */
const outerZ = { front: 0, back: RUNG_LEN - T } as const;
/* Inner ladder (right): legs just inside, so the frame folds flat. */
const innerZ = { front: T, back: RUNG_LEN - 2 * T } as const;

function rungs(prefix: string, axis: typeof leftAxis, z0: number, z1: number, inset: number): Part[] {
  return Array.from({ length: RUNGS_PER_SIDE }, (_, k) => {
    const [x, y] = rungAt(axis, k);
    return {
      id: `${prefix}-${k + 1}`,
      kind: "rod",
      from: [x, y, z0] as Vec3,
      to: [x, y, z1] as Vec3,
      d: RUNG_D,
      capOnTop: true,
      exposed: [inset, z1 - z0 - inset] as const,
      order: 3,
    } satisfies Part;
  });
}

/* Ramp: its underside rests on the hooked rung and its lower end on the floor. */
const RAMP_LEN = 1000;
const RAMP_W = 400;
const RAMP_Z0 = (RUNG_LEN - RAMP_W) / 2;
const OVERHANG = 50;
const hook = rungAt(leftAxis, 2);
const rampAngle = (() => {
  // Contact point C = rung centre + r·n(θ); C.y = (RAMP_LEN − OVERHANG)·sin θ. Solve by iteration.
  let theta = 0.5;
  for (let i = 0; i < 20; i++) theta = Math.asin((hook[1] + (RUNG_D / 2) * Math.cos(theta)) / (RAMP_LEN - OVERHANG));
  return theta;
})();
const down: Vec3 = [-Math.cos(rampAngle), -Math.sin(rampAngle), 0];
const up: Vec3 = [-Math.sin(rampAngle), Math.cos(rampAngle), 0];
const contact: Vec3 = [hook[0] + (RUNG_D / 2) * up[0], hook[1] + (RUNG_D / 2) * up[1], 0];
const rampTop: Vec3 = [contact[0] - OVERHANG * down[0], contact[1] - OVERHANG * down[1], RAMP_Z0];
const onRamp = (s: number, lift: number, z: number): Vec3 => [
  rampTop[0] + s * down[0] + lift * up[0],
  rampTop[1] + s * down[1] + lift * up[1],
  z,
];

const CLEAT_D = 18;
const cleats: Part[] = [150, 270, 390, 510, 630, 750, 870].map((s, i) => ({
  id: `cleat-${i + 1}`,
  kind: "rod",
  from: onRamp(s, T + CLEAT_D / 2 - 2, RAMP_Z0 + 22),
  to: onRamp(s, T + CLEAT_D / 2 - 2, RAMP_Z0 + RAMP_W - 22),
  d: CLEAT_D,
  cap: "ply-1",
  order: 5,
}));

const leg = (id: string, axis: typeof leftAxis, outline: string, z: number, order: number, extra?: Partial<Part>): Part =>
  ({
    id,
    kind: "panel",
    plane: "XY",
    origin: [0, 0, z],
    t: T,
    outline,
    holes: legHoles(axis),
    grain: legGrain(axis),
    order,
    ...extra,
  }) as Part;

const piklerTriangle = {
  key: "pikler-triangle",
  source: "measured",
  size: { w: SPAN, h: H, d: RUNG_LEN },
  finishes: ["white"],
  parts: [
    leg("leg-l-back", leftAxis, leftLeg, outerZ.back, 1),
    leg("leg-r-back", rightAxis, rightLeg, innerZ.back, 2),
    ...rungs("rung-l", leftAxis, 0, RUNG_LEN, T),
    ...rungs("rung-r", rightAxis, innerZ.front, innerZ.back + T, T),
    {
      id: "ramp",
      kind: "panel",
      plane: { u: down, v: [0, 0, 1] },
      origin: rampTop,
      t: T,
      outline: rrect(0, 0, RAMP_LEN, RAMP_W, 6),
      grain: grainLines([
        [60, 90, 940, 100, 6],
        [40, 210, 960, 196, -8],
        [80, 320, 900, 330, 5],
      ]),
      order: 4,
    },
    ...cleats,
    leg("leg-r-front", rightAxis, rightLeg, innerZ.front, 6),
    leg("leg-l-front", leftAxis, leftLeg, outerZ.front, 7, {
      details: [{ d: hingeBolt, fill: "ply-3" }],
    }),
  ],
  exploded: {
    ramp: [-150, 110, 0],
    ...Object.fromEntries(cleats.map((c) => [c.id, [-150, 110, 0] as Vec3])),
    "leg-r-front": [70, 0, 0],
    "leg-r-back": [70, 0, 0],
    ...Object.fromEntries(Array.from({ length: RUNGS_PER_SIDE }, (_, k) => [`rung-r-${k + 1}`, [70, 0, 0] as Vec3])),
  },
  dowels: [
    { at: [contact[0], contact[1], RAMP_Z0 + 60], part: "ramp" },
    { at: [contact[0], contact[1], RAMP_Z0 + RAMP_W - 60], part: "ramp" },
    { at: [hinge[0], hinge[1], 0], part: "leg-r-front" },
    { at: [hinge[0], hinge[1], RUNG_LEN - T], part: "leg-r-back" },
  ],
  dims: [
    { key: "depthCm", axis: "w", from: 0, to: SPAN },
    { key: "heightCm", axis: "h", from: 0, to: H },
    { key: "widthCm", axis: "d", from: 0, to: RUNG_LEN },
  ],
} satisfies Manifest;

export default piklerTriangle;
