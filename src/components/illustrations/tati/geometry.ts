/*
 * Tati's construction (DESIGN.md §3.6), as numbers.
 *
 * Master artboard: 48 × 40, side view with a 3/4 hint. The table in §3.6 is
 * written from the logo's orientation (duck facing right). The journey Tati
 * always faces and rolls toward inline-end, which is left on this RTL site, so
 * every coordinate here is the table mirrored (x → 48 − x): head at (14, 10),
 * beak at (7, 11), tail tip at (41, 13), string leaving the cart at (4, 28).
 * Sizes, radii and proportions are the table's own.
 *
 * Everything that differs between the four poses lives in POSES; the drawing
 * components only read from here, and the brand scripts import the same file.
 */

export type TatiPoseName = "waiting" | "rolling" | "sleeping" | "slipped";

export type Point = readonly [x: number, y: number];

export const ARTBOARD = { width: 48, height: 40 } as const;

/** The floor (or the header thread) is where the wheels touch: bottom of an r 6 wheel at y 33. */
export const FLOOR_Y = 39;

export const HEAD_RADIUS = 7.5;

/** Near-side wheels, each drawn by TatiWheel inside its own HTML span. Front = under the head. */
export const WHEELS = {
  front: { cx: 14, cy: 33 },
  back: { cx: 34, cy: 33 },
  radius: 6,
} as const;

/** Far-side wheels: static, 55% opacity, part of the body drawing (the 3/4 hint). */
export const FAR_WHEELS: readonly Point[] = [
  [10, 32],
  [30, 32],
];

/** Where the string is tied to the cart (scenes that draw their own string start here). */
export const STRING_ANCHOR: Point = [3.6, 28];

export const PLATFORM = { x: 4, y: 26, width: 40, height: 4, radius: 1.5 } as const;

type HeadPose = {
  /** Centre of the head circle (artboard units). */
  center: Point;
  /** Degrees; positive lifts the beak, negative tucks it down. */
  tilt: number;
  /** "back" turns the head to look over the tail (the 404's «نخ از دستمون در رفت!»). */
  facing: "forward" | "back";
};

type PoseSpec = {
  head: HeadPose;
  /** Whole-duck lean around the seat, degrees (≤ 8° by the "never" list). Negative = forward. */
  lean: number;
  eye: "open" | "closed";
  /** Path of the anar string from STRING_ANCHOR. May run past the artboard's left edge. */
  string: string;
  /** Wooden bead at the string's end, or null when the string runs on as the header thread. */
  bead: Point | null;
};

/** The duck pivots on the middle of its seat, so leaning never lifts it off the cart. */
export const LEAN_PIVOT: Point = [24, 26.6];

export const POSES: Record<TatiPoseName, PoseSpec> = {
  // Cover: head up, string slack on the floor, eye blinks (HTML wrapper).
  waiting: {
    head: { center: [14, 9.6], tilt: 7, facing: "forward" },
    lean: 0,
    eye: "open",
    string: "M3.6 28C1.9 32.6.4 37.4-2.6 38.6-5.2 39.5-8 39.2-9.6 38.9",
    bead: [-11.2, 37.4],
  },
  // Thread rider: a 4° forward lean; the string drops onto the thread and becomes it.
  rolling: {
    head: { center: [14, 10], tilt: 0, facing: "forward" },
    lean: -4,
    eye: "open",
    string: "M3.6 28C2.4 32.4.3 37.2-4 39.6",
    bead: null,
  },
  // TheEnd / night 404: head tucked, eye a closed curve, three Z marks.
  sleeping: {
    head: { center: [15, 12.2], tilt: -16, facing: "forward" },
    lean: 0,
    eye: "closed",
    string: "M3.6 28C2.2 32.4 1.2 37.2-1.6 38.5-3 39.2-4.4 39.2-5.2 39",
    bead: [-6.8, 37.4],
  },
  // 404: string dropped in a curl on the floor, head turned back toward where the hand was.
  slipped: {
    head: { center: [14.4, 10.2], tilt: 4, facing: "back" },
    lean: 3,
    eye: "open",
    string: "M3.6 28C2.6 32 2 36.6-.6 38.4-2.8 39.9-6.4 39.4-6.6 37.2-6.8 35.2-4.1 34.9-3.6 36.8-3.1 38.9-7.8 39.6-11.4 39.1",
    bead: [-13, 37.4],
  },
};

/* ---------- small geometry helpers ---------- */

const round = (n: number) => Math.round(n * 100) / 100;

export function rotatePoint([x, y]: Point, deg: number, [px, py]: Point): Point {
  const r = (deg * Math.PI) / 180;
  const dx = x - px;
  const dy = y - py;
  return [round(px + dx * Math.cos(r) - dy * Math.sin(r)), round(py + dx * Math.sin(r) + dy * Math.cos(r))];
}

function onHead([cx, cy]: Point, deg: number): Point {
  const r = (deg * Math.PI) / 180;
  return [round(cx + HEAD_RADIUS * Math.cos(r)), round(cy + HEAD_RADIUS * Math.sin(r))];
}

const pt = ([x, y]: Point) => `${x} ${y}`;

/**
 * The duck's outline: one closed path that is the union of the plump
 * teardrop body and the head circle. The body contour leaves the head at the
 * throat and rejoins it at the nape (both points lie on the circle), then the
 * outline follows the head's outer arc, so there is no seam line at the neck.
 */
export function duckOutline(head: Point): string {
  const throat = onHead(head, 132);
  const nape = onHead(head, 30);
  const [tx, ty] = throat;
  return [
    `M${pt(throat)}`,
    // chest: swells forward under the beak, then rounds into the flat seat
    `C${pt([tx - 1.2, ty + 1.3])} ${pt([6.1, 19.4])} ${pt([6.3, 22])}`,
    `C${pt([6.6, 25])} ${pt([8.8, 26.6])} ${pt([11.8, 26.6])}`,
    `L${pt([33, 26.6])}`,
    // rump rises into the upturned tail; the tip is rounded (nothing CNC-cut is sharp)
    `C${pt([38.6, 26.6])} ${pt([42.4, 23.4])} ${pt([42.2, 19])}`,
    `C${pt([42.1, 16.6])} ${pt([41.9, 14.6])} ${pt([41.5, 13.3])}`,
    `C${pt([41.2, 12.4])} ${pt([40.4, 12.4])} ${pt([39.7, 13])}`,
    // back: dips into the saddle, then climbs to the nape
    `C${pt([36.6, 15.6])} ${pt([32.4, 17.5])} ${pt([28.2, 17.4])}`,
    `C${pt([24.6, 17.3])} ${pt([22.6, 16])} ${pt(nape)}`,
    // over the crown and back down the face to the throat
    `A${HEAD_RADIUS} ${HEAD_RADIUS} 0 1 0 ${pt(throat)}Z`,
  ].join("");
}

/** Lighter breast and belly (wood-top), drawn inside the outline. */
export const BELLY_HIGHLIGHT =
  "M7.6 21.4C7.9 24.4 10.4 25.6 14.2 25.6H31.4C27.6 24.6 17.6 24.8 12.8 23.3 10.6 22.6 9 21.4 7.6 21.4Z";

/** Three grain strokes along the body's long axis (ply-2 at 35%). */
export const BODY_GRAIN = [
  "M24.4 19.9C28.4 19.3 33.4 19.8 39.6 18.6",
  "M11.6 22.3C18 21.2 26.6 22.6 40.2 21.7",
  "M16.8 24.7C22.4 24.1 30.2 24.9 37.6 24.1",
] as const;

/** The wing: one carved curve, stroke only (§3.6: from (16,17) to (27,20), mirrored). */
export const WING = "M21 19.8C23.4 23.5 30.2 23.6 32.8 17.4";

/** Beak relative to the head centre, facing left (a rounded wedge, 4.5 × 3). */
export const BEAK = "M-6.4-1.2C-8-1.1-9.6-1.5-10.8-1.3-12-1.1-12.3.8-11.2 1.5-9.8 2.4-7.6 2.5-6.2 2.2Z";

/** Eye relative to the head centre: r 1.6 dot, slightly forward of and above the centre. */
export const EYE_OFFSET: Point = [-1, -1];
export const EYE_RADIUS = 1.6;

/** Head-relative point → artboard point, applying the head's turn, tilt and the duck's lean. */
export function headPoint(pose: PoseSpec, local: Point): Point {
  const { center, tilt, facing } = pose.head;
  const mirrored: Point = facing === "back" ? [-local[0], local[1]] : local;
  const tilted = rotatePoint(mirrored, facing === "back" ? -tilt : tilt, [0, 0]);
  const placed: Point = [center[0] + tilted[0], center[1] + tilted[1]];
  return pose.lean ? rotatePoint(placed, pose.lean, LEAN_PIVOT) : [round(placed[0]), round(placed[1])];
}

/** The eye's centre in artboard units, after the pose's lean (used to place the HTML eye wrapper). */
export function eyeCenter(pose: TatiPoseName): Point {
  return headPoint(POSES[pose], EYE_OFFSET);
}

/** Three Z marks floating up over the back (sleeping), as ink strokes. */
export const SLEEP_MARKS = [
  [24.2, 7.4, 2.2],
  [28.6, 3.8, 2.8],
  [33.6, -0.2, 3.4],
].map(([x, y, s]) => `M${x} ${y}h${s}l${-s} ${s}h${s}`);

/** Percent box for an HTML wrapper laid over the artboard (physical: the drawing never mirrors). */
export function artboardBox(cx: number, cy: number, size: number) {
  return {
    left: `${round(((cx - size / 2) / ARTBOARD.width) * 100)}%`,
    top: `${round(((cy - size / 2) / ARTBOARD.height) * 100)}%`,
    width: `${round((size / ARTBOARD.width) * 100)}%`,
  };
}
