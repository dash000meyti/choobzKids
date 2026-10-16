/*
 * Geometry for the parts-manifest drawings (DESIGN.md §3.7):
 *   1. vector maths,
 *   2. projections — cabinet oblique S(x, y, z) = (x − 0.433·z, −y − 0.25·z)
 *      plus the two orthographic elevations — and the per-plane SVG matrices,
 *   3. path builders for manifests (local mm, v up, router-bit corners),
 *   4. a small SVG path sampler used for bounds, silhouettes and hulls.
 *
 * Pure functions only: shared by the server renderer and the build script.
 */

import type { Plane, Vec2, Vec3 } from "./manifests/types";

/* ------------------------------------------------------------------ */
/* 1. Vectors                                                          */
/* ------------------------------------------------------------------ */

export const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale3 = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot3 = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len3 = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const unit3 = (a: Vec3): Vec3 => scale3(a, 1 / (len3(a) || 1));

export const add2 = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];
export const sub2 = (a: Vec2, b: Vec2): Vec2 => [a[0] - b[0], a[1] - b[1]];
export const scale2 = (a: Vec2, k: number): Vec2 => [a[0] * k, a[1] * k];
export const dot2 = (a: Vec2, b: Vec2) => a[0] * b[0] + a[1] * b[1];
export const cross2 = (a: Vec2, b: Vec2) => a[0] * b[1] - a[1] * b[0];
export const len2 = (a: Vec2) => Math.hypot(a[0], a[1]);
export const unit2 = (a: Vec2): Vec2 => scale2(a, 1 / (len2(a) || 1));
/** Rotate 90° counter-clockwise in a v-up frame. */
export const perp2 = (a: Vec2): Vec2 => [-a[1], a[0]];

/* ------------------------------------------------------------------ */
/* 2. Projections                                                      */
/* ------------------------------------------------------------------ */

/** Cabinet oblique, α = 30°, k = 0.5: depth recedes toward the upper inline-end (left). */
export const OBLIQUE_DX = 0.433;
export const OBLIQUE_DY = 0.25;

/** S(x, y, z) in SVG space (y grows downward). */
export function S([x, y, z]: Vec3): Vec2 {
  return [x - OBLIQUE_DX * z, -y - OBLIQUE_DY * z];
}

/**
 * A parallel projection to SVG space: `row0·p`, `row1·p`, plus a 2D shift.
 * `away` is the world direction that points away from the viewer along the
 * projectors (it projects to zero); it decides which copy of a part is nearer.
 */
export type Projection = {
  readonly rows: readonly [Vec3, Vec3];
  readonly away: Vec3;
  readonly shift: Vec2;
};

export const OBLIQUE: Projection = {
  rows: [
    [1, 0, -OBLIQUE_DX],
    [0, -1, -OBLIQUE_DY],
  ],
  away: [OBLIQUE_DX, -OBLIQUE_DY, 1],
  shift: [0, 0],
};

/** Front elevation, looking along +z. */
export const FRONT: Projection = {
  rows: [
    [1, 0, 0],
    [0, -1, 0],
  ],
  away: [0, 0, 1],
  shift: [0, 0],
};

/** Left-side elevation, looking along +x: the product's front (z = 0) is on the right. */
export const SIDE: Projection = {
  rows: [
    [0, 0, -1],
    [0, -1, 0],
  ],
  away: [1, 0, 0],
  shift: [0, 0],
};

export function shifted(p: Projection, shift: Vec2): Projection {
  return { ...p, shift };
}

/** Projects a direction (no shift). */
export function projectDir(p: Projection, v: Vec3): Vec2 {
  return [dot3(p.rows[0], v), dot3(p.rows[1], v)];
}

/** Projects a point. */
export function project(p: Projection, v: Vec3): Vec2 {
  return [dot3(p.rows[0], v) + p.shift[0], dot3(p.rows[1], v) + p.shift[1]];
}

export type PlaneAxes = { readonly u: Vec3; readonly v: Vec3; readonly n: Vec3 };

export function planeAxes(plane: Plane): PlaneAxes {
  switch (plane) {
    case "XY":
      return { u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] };
    case "YZ":
      return { u: [0, 0, 1], v: [0, 1, 0], n: [1, 0, 0] };
    case "XZ":
      return { u: [1, 0, 0], v: [0, 0, 1], n: [0, 1, 0] };
    default: {
      const u = unit3(plane.u);
      const v = unit3(plane.v);
      return { u, v, n: unit3(cross3(u, v)) };
    }
  }
}

/**
 * `matrix(a b c d e f)` that maps a part's local (u, v) mm onto the drawing:
 * (a, b) = P(u), (c, d) = P(v), (e, f) = P(origin). For the oblique view this
 * gives XY → (1 0 0 −1), YZ → (−0.433 −0.25 0 −1), XZ → (1 0 −0.433 −0.25).
 */
export type Affine = readonly [number, number, number, number, number, number];

export function planeMatrix(axes: Pick<PlaneAxes, "u" | "v">, origin: Vec3, proj: Projection = OBLIQUE): Affine {
  const [a, b] = projectDir(proj, axes.u);
  const [c, d] = projectDir(proj, axes.v);
  const [e, f] = project(proj, origin);
  return [a, b, c, d, e, f];
}

export function applyAffine(m: Affine, [x, y]: Vec2): Vec2 {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

/* ------------------------------------------------------------------ */
/* 3. Path builders (local mm, v up)                                   */
/* ------------------------------------------------------------------ */

/** Number formatting for SVG output: one decimal, no trailing zeros, no "-0". */
export function fmt(n: number, digits = 1): string {
  const k = 10 ** digits;
  const r = Math.round(n * k) / k;
  if (r === 0) return "0";
  return String(r).replace(/^(-?)0\./, "$1.");
}

/** Joins numbers compactly ("10 -5" → "10-5"). */
export function nums(values: readonly number[], digits = 1): string {
  let out = "";
  for (const v of values) {
    const s = fmt(v, digits);
    out += out === "" || s.startsWith("-") ? s : ` ${s}`;
  }
  return out;
}

const pt = (p: Vec2) => nums(p);

/** Arc segment command. `ccw` follows the local v-up frame (SVG sweep-flag 1). */
function arcTo(r: number, to: Vec2, ccw: boolean, large = false): string {
  return `A${nums([r, r])} 0 ${large ? 1 : 0} ${ccw ? 1 : 0} ${pt(to)}`;
}

/**
 * Closed polygon with rounded corners (router-bit radius per corner). Radii
 * are clamped so neighbouring fillets never overlap; 0 keeps a sharp corner.
 */
export function roundedPolygon(points: readonly Vec2[], radius: number | readonly number[] = 3): string {
  const n = points.length;
  const radii = typeof radius === "number" ? points.map(() => radius) : radius;
  let d = "";
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const prev = points[(i + n - 1) % n];
    const next = points[(i + 1) % n];
    const toPrev = sub2(prev, p);
    const toNext = sub2(next, p);
    const la = len2(toPrev);
    const lb = len2(toNext);
    const ua = scale2(toPrev, 1 / la);
    const ub = scale2(toNext, 1 / lb);
    const angle = Math.acos(Math.max(-1, Math.min(1, dot2(ua, ub))));
    let r = radii[i] ?? 0;
    if (r <= 0 || angle > Math.PI - 1e-3) {
      d += `${i === 0 ? "M" : "L"}${pt(p)}`;
      continue;
    }
    let t = r / Math.tan(angle / 2);
    const tMax = Math.min(la, lb) / 2;
    if (t > tMax) {
      t = tMax;
      r = t * Math.tan(angle / 2);
    }
    const p1 = add2(p, scale2(ua, t));
    const p2 = add2(p, scale2(ub, t));
    const leftTurn = cross2(sub2(p, prev), sub2(next, p)) > 0;
    d += `${i === 0 ? "M" : "L"}${pt(p1)}${arcTo(r, p2, leftTurn)}`;
  }
  return `${d}Z`;
}

/** Rounded rectangle from its lower-left corner. */
export function rrect(x: number, y: number, w: number, h: number, r = 3): string {
  return roundedPolygon(
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    r,
  );
}

/** Stadium (capsule) between two centre points: hand-holes, slots, legs. */
export function stadium(from: Vec2, to: Vec2, width: number): string {
  const r = width / 2;
  const n = scale2(perp2(unit2(sub2(to, from))), r);
  return `M${pt(add2(from, n))}L${pt(add2(to, n))}${arcTo(r, sub2(to, n), false)}L${pt(sub2(from, n))}${arcTo(r, add2(from, n), false)}Z`;
}

export function circle(cx: number, cy: number, r: number): string {
  const half = `a${nums([r, r])} 0 1 0 `;
  return `M${pt([cx - r, cy])}${half}${nums([2 * r, 0])}${half}${nums([-2 * r, 0])}Z`;
}

/**
 * Arch band standing on the floor (Pikler arch sides, rainbow arcs): the ring
 * between two concentric arcs around (cx, cy), cut flat at `floor`, with
 * fillets of radius `r` at the four foot corners.
 */
export function archBand(opts: { cx: number; cy: number; outer: number; inner: number; floor?: number; r?: number }): string {
  const { cx, cy, outer, inner, floor = 0, r = 6 } = opts;
  const fy = floor + r;
  const outerFillet = (side: -1 | 1) => {
    const fx = cx + side * Math.sqrt((outer - r) ** 2 - (fy - cy) ** 2);
    const onArc = add2([cx, cy], scale2(sub2([fx, fy], [cx, cy]), outer / (outer - r)));
    return { onFloor: [fx, floor] as Vec2, onArc };
  };
  const innerFillet = (side: -1 | 1) => {
    const fx = cx + side * Math.sqrt((inner + r) ** 2 - (fy - cy) ** 2);
    const onArc = add2([cx, cy], scale2(sub2([fx, fy], [cx, cy]), inner / (inner + r)));
    return { onFloor: [fx, floor] as Vec2, onArc };
  };
  const ol = outerFillet(-1);
  const or = outerFillet(1);
  const il = innerFillet(-1);
  const ir = innerFillet(1);
  return (
    `M${pt(ol.onFloor)}${arcTo(r, ol.onArc, false)}` +
    `${arcTo(outer, or.onArc, false)}${arcTo(r, or.onFloor, false)}` +
    `L${pt(ir.onFloor)}${arcTo(r, ir.onArc, false)}` +
    `${arcTo(inner, il.onArc, true)}${arcTo(r, il.onFloor, false)}Z`
  );
}

/** Axis of a leaning slat: the line parallel to its outer edge through the centre of its rounded end. */
export type SlatAxis = {
  /** Unit vector along the slat, pointing from the foot up toward the rounded end. */
  readonly dir: Vec2;
  /** Unit vector across the slat, from its outer edge toward its body. */
  readonly inward: Vec2;
  /** Point on the axis `s` mm below the rounded end's centre, shifted `across` mm toward the body side. */
  at(s: number, across?: number): Vec2;
};

/**
 * Axis of a leaning slat (A-frame leg) whose outer edge starts at the floor
 * corner `foot` and runs tangent to the rounded end centred on `top`. `side`
 * says which way the slat's body lies when walking from the foot to the top.
 */
export function slatAxis(foot: Vec2, top: Vec2, width: number, side: "left" | "right"): SlatAxis {
  const r = width / 2;
  const toTop = sub2(top, foot);
  const tilt = Math.asin(r / len2(toTop)) * (side === "right" ? 1 : -1);
  const base = unit2(toTop);
  const dir: Vec2 = [
    base[0] * Math.cos(tilt) - base[1] * Math.sin(tilt),
    base[0] * Math.sin(tilt) + base[1] * Math.cos(tilt),
  ];
  const inward: Vec2 = side === "right" ? [dir[1], -dir[0]] : perp2(dir);
  return { dir, inward, at: (s, across = 0) => add2(sub2(top, scale2(dir, s)), scale2(inward, across)) };
}

/** The leaning slat itself: flat foot on the floor, semicircular top. */
export function slat(foot: Vec2, top: Vec2, width: number, side: "left" | "right", footRadius = 4): string {
  const r = width / 2;
  const { dir, inward } = slatAxis(foot, top, width, side);
  const capMid = add2(top, scale2(dir, r));
  const outerTop = sub2(capMid, scale2(inward, r));
  const innerTop = add2(capMid, scale2(inward, r));
  const innerFoot = sub2(innerTop, scale2(dir, (innerTop[1] - foot[1]) / dir[1]));
  return roundedPolygon([foot, outerTop, innerTop, innerFoot], [footRadius, r, r, footRadius]);
}

/** An open circular arc from angle `a0` to `a1` (degrees, counter-clockwise, v up): curved grain, bent laminations. */
export function arcLine(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p = (a: number): Vec2 => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const span = a1 - a0;
  return `M${pt(p(a0))}${arcTo(r, p(a1), span > 0, Math.abs(span) > 180)}`;
}

/** Gentle grain strokes: each [x1, y1, x2, y2, bow] is a quadratic bowed by `bow` mm. */
export function grainLines(lines: readonly (readonly [number, number, number, number, number?])[]): string {
  return lines
    .map(([x1, y1, x2, y2, bow = 0]) => {
      const mid: Vec2 = [(x1 + x2) / 2, (y1 + y2) / 2];
      const c = add2(mid, scale2(perp2(unit2([x2 - x1, y2 - y1])), bow));
      return `M${nums([x1, y1])}Q${nums([c[0], c[1], x2, y2])}`;
    })
    .join("");
}

export function joinPaths(...paths: readonly (string | false | null | undefined)[]): string {
  return paths.filter(Boolean).join("");
}

/* ------------------------------------------------------------------ */
/* 4. Path sampling                                                    */
/* ------------------------------------------------------------------ */

export type Polyline = { readonly points: Vec2[]; readonly closed: boolean };

function tokenize(d: string): (string | number)[] {
  const out: (string | number)[] = [];
  let i = 0;
  let cmd = "";
  let argIndex = 0;
  const isNumberStart = (ch: string) => /[-+.\d]/.test(ch);
  while (i < d.length) {
    const ch = d[i];
    if (/[a-zA-Z]/.test(ch)) {
      cmd = ch.toLowerCase();
      argIndex = 0;
      out.push(ch);
      i++;
    } else if (isNumberStart(ch)) {
      // Arc flags may be written without separators ("a5 5 0 011 1").
      if (cmd === "a" && (argIndex % 7 === 3 || argIndex % 7 === 4)) {
        out.push(Number(ch));
        i++;
      } else {
        const m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(d.slice(i));
        if (!m) throw new Error(`Bad path data near "${d.slice(i, i + 12)}"`);
        out.push(Number(m[0]));
        i += m[0].length;
      }
      argIndex++;
    } else {
      i++;
    }
  }
  return out;
}

function sampleArc(
  from: Vec2,
  rxIn: number,
  ryIn: number,
  angleDeg: number,
  large: boolean,
  sweep: boolean,
  to: Vec2,
  out: Vec2[],
) {
  // SVG implementation notes F.6.5: endpoint → centre parameterisation.
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx < 1e-9 || ry < 1e-9) {
    out.push(to);
    return;
  }
  const phi = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (from[0] - to[0]) / 2;
  const dy = (from[1] - to[1]) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (k * rx * y1) / ry;
  const cyp = (-k * ry * x1) / rx;
  const cx = cos * cxp - sin * cyp + (from[0] + to[0]) / 2;
  const cy = sin * cxp + cos * cyp + (from[1] + to[1]) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const theta1 = angle(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry);
  let delta = angle((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  const steps = Math.max(2, Math.ceil(Math.abs(delta) / (Math.PI / 24)));
  for (let s = 1; s <= steps; s++) {
    const th = theta1 + (delta * s) / steps;
    const ex = rx * Math.cos(th);
    const ey = ry * Math.sin(th);
    out.push([cos * ex - sin * ey + cx, sin * ex + cos * ey + cy]);
  }
}

/** Flattens path data into polylines (one per subpath). Curves are sampled finely enough for silhouettes. */
export function samplePath(d: string): Polyline[] {
  const tokens = tokenize(d);
  const lines: Polyline[] = [];
  let current: Vec2[] = [];
  let pos: Vec2 = [0, 0];
  let start: Vec2 = [0, 0];
  let lastCtrl: Vec2 | null = null;
  let lastCmd = "";
  let i = 0;
  const flush = (closed: boolean) => {
    if (current.length > 1) lines.push({ points: current, closed });
    current = [];
  };
  const read = () => tokens[i++] as number;
  while (i < tokens.length) {
    const token = tokens[i];
    let cmd: string;
    if (typeof token === "string") {
      cmd = token;
      i++;
    } else {
      cmd = lastCmd === "M" ? "L" : lastCmd === "m" ? "l" : lastCmd;
    }
    const rel = cmd === cmd.toLowerCase();
    const lower = cmd.toLowerCase();
    const at = (x: number, y: number): Vec2 => (rel ? [pos[0] + x, pos[1] + y] : [x, y]);
    switch (lower) {
      case "m": {
        flush(false);
        pos = at(read(), read());
        start = pos;
        current.push(pos);
        lastCtrl = null;
        break;
      }
      case "l":
        pos = at(read(), read());
        current.push(pos);
        lastCtrl = null;
        break;
      case "h": {
        const x = read();
        pos = [rel ? pos[0] + x : x, pos[1]];
        current.push(pos);
        lastCtrl = null;
        break;
      }
      case "v": {
        const y = read();
        pos = [pos[0], rel ? pos[1] + y : y];
        current.push(pos);
        lastCtrl = null;
        break;
      }
      case "c":
      case "s": {
        const c1: Vec2 =
          lower === "c"
            ? at(read(), read())
            : lastCtrl && /[cs]/i.test(lastCmd)
              ? [2 * pos[0] - lastCtrl[0], 2 * pos[1] - lastCtrl[1]]
              : pos;
        const c2 = at(read(), read());
        const end = at(read(), read());
        const p0 = pos;
        for (let s = 1; s <= 12; s++) {
          const t = s / 12;
          const mt = 1 - t;
          current.push([
            mt * mt * mt * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t * t * t * end[0],
            mt * mt * mt * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t * t * t * end[1],
          ]);
        }
        lastCtrl = c2;
        pos = end;
        break;
      }
      case "q":
      case "t": {
        const c: Vec2 =
          lower === "q"
            ? at(read(), read())
            : lastCtrl && /[qt]/i.test(lastCmd)
              ? [2 * pos[0] - lastCtrl[0], 2 * pos[1] - lastCtrl[1]]
              : pos;
        const end = at(read(), read());
        const p0 = pos;
        for (let s = 1; s <= 10; s++) {
          const t = s / 10;
          const mt = 1 - t;
          current.push([
            mt * mt * p0[0] + 2 * mt * t * c[0] + t * t * end[0],
            mt * mt * p0[1] + 2 * mt * t * c[1] + t * t * end[1],
          ]);
        }
        lastCtrl = c;
        pos = end;
        break;
      }
      case "a": {
        const rx = read();
        const ry = read();
        const rot = read();
        const large = read() !== 0;
        const sweep = read() !== 0;
        const end = at(read(), read());
        sampleArc(pos, rx, ry, rot, large, sweep, end, current);
        pos = end;
        lastCtrl = null;
        break;
      }
      case "z":
        flush(true);
        pos = start;
        current.push(pos);
        lastCtrl = null;
        break;
      default:
        throw new Error(`Unsupported path command "${cmd}"`);
    }
    lastCmd = cmd;
  }
  flush(false);
  return lines;
}

export type Box = { minX: number; minY: number; maxX: number; maxY: number };

export function emptyBox(): Box {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

export function growBox(box: Box, [x, y]: Vec2): Box {
  box.minX = Math.min(box.minX, x);
  box.minY = Math.min(box.minY, y);
  box.maxX = Math.max(box.maxX, x);
  box.maxY = Math.max(box.maxY, y);
  return box;
}

export function boxOf(points: readonly Vec2[]): Box {
  const box = emptyBox();
  for (const p of points) growBox(box, p);
  return box;
}

export function unionBox(a: Box, b: Box): Box {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

/** Andrew's monotone chain; returns the hull counter-clockwise in a y-down frame. */
export function convexHull(points: readonly Vec2[]): Vec2[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const turn = (o: Vec2, a: Vec2, b: Vec2) => cross2(sub2(a, o), sub2(b, o));
  const lower: Vec2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && turn(lower[lower.length - 2], lower[lower.length - 1], p) <= 1e-9) lower.pop();
    lower.push(p);
  }
  const upper: Vec2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && turn(upper[upper.length - 2], upper[upper.length - 1], p) <= 1e-9) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
