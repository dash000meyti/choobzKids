/*
 * Manifest → SVG (DESIGN.md §3.7). Pure string rendering shared by
 * `PartsRenderer` (inline, theme variables kept) and
 * `scripts/illustrations/build.ts` (static files, light-theme hex values).
 *
 * How a flat part is drawn: its outline is projected with one static matrix
 * and painted back to front — the far face (base of the ply band), a few
 * intermediate copies (the strata), straight connectors where the swept edge
 * leaves the outline, then the near face with its grain. Every cut edge that
 * faces the viewer therefore shows its plywood layers, holes included.
 */

import type {
  CordPart,
  DimKey,
  DimSpec,
  Detail,
  ExtrusionPart,
  Manifest,
  PanelPart,
  Part,
  RodPart,
  Tone,
  Vec2,
  Vec3,
  View,
} from "./manifests/types";
import {
  FRONT,
  OBLIQUE,
  SIDE,
  type Affine,
  type Box,
  type Polyline,
  type Projection,
  add2,
  add3,
  applyAffine,
  boxOf,
  convexHull,
  cross2,
  cross3,
  dot2,
  dot3,
  emptyBox,
  fmt,
  growBox,
  len2,
  nums,
  perp2,
  planeAxes,
  planeMatrix,
  project,
  projectDir,
  rrect,
  samplePath,
  scale2,
  scale3,
  shifted,
  sub2,
  sub3,
  unionBox,
  unit2,
  unit3,
} from "./project";

/* ------------------------------------------------------------------ */
/* Palette                                                             */
/* ------------------------------------------------------------------ */

type Ink = Tone | "grain" | "shadow";

/** Light-theme values of the CSS tokens (globals.css), for files that must not depend on page CSS. */
const LIGHT: Record<Ink, string> = {
  wood: "#E8D3AE",
  "wood-top": "#F0E0C2",
  "wood-side": "#D9BE92",
  "ply-1": "#F0E0C2",
  "ply-2": "#C8955A",
  "ply-3": "#9C6B3A",
  ink: "#33251B",
  char: "#33251B",
  paper: "#FFFBF3",
  anar: "#B23A26",
  asal: "#C8955A",
  grain: "#C8955A",
  shadow: "#33251B",
};

const CSS_VARS: Record<Ink, string> = {
  wood: "var(--wood)",
  "wood-top": "var(--wood-top)",
  "wood-side": "var(--wood-side)",
  "ply-1": "var(--ply-1)",
  "ply-2": "var(--ply-2)",
  "ply-3": "var(--ply-3)",
  ink: "var(--ink)",
  char: "var(--color-gerdu)",
  paper: "var(--color-shir-raised)",
  anar: "var(--color-anar)",
  asal: "var(--color-asal)",
  grain: "var(--wood-grain,var(--ply-2))",
  shadow: "rgb(var(--shadow-rgb))",
};

type FaceInk = "wood" | "wood-top" | "wood-side" | "grain";

function mixHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa
    .map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

/** Painted faces: a tint face, lighter top, shaded side; ply edges stay raw. */
function paintedFinish(face: string): Record<FaceInk, string> {
  return {
    wood: face,
    "wood-top": mixHex(face, "#FFFFFF", 0.4),
    "wood-side": mixHex(face, "#33251B", 0.09),
    grain: mixHex(face, "#33251B", 0.22),
  };
}

/** Face colours per finish (DESIGN.md §3.7 «Finishes»). `natural` uses the theme's wood tokens. */
export const FINISHES: Readonly<Record<string, Readonly<Record<FaceInk, string>> | null>> = {
  natural: null,
  white: { wood: "#F7F1E6", "wood-top": "#FCF9F3", "wood-side": "#E7DDCB", grain: "#D8C8AA" },
  terracotta: paintedFinish("#F3D5C8"),
  sage: paintedFinish("#DCE7D6"),
  mustard: paintedFinish("#F7E2A6"),
  sky: paintedFinish("#D6E7EE"),
  plum: paintedFinish("#ECDCE6"),
  mint: paintedFinish("#D7EBDA"),
};

/** CSS custom properties that recolour an inline drawing for a finish (none for natural). */
export function finishVars(finish?: string): Record<string, string> | undefined {
  const f = finish ? FINISHES[finish] : null;
  if (!f) return undefined;
  return { "--wood": f.wood, "--wood-top": f["wood-top"], "--wood-side": f["wood-side"], "--wood-grain": f.grain };
}

type Paint = (ink: Ink) => string;

function makePaint(mode: "css" | "static", finish?: string): Paint {
  if (mode === "css") return (ink) => CSS_VARS[ink];
  const f = finish ? FINISHES[finish] : null;
  return (ink) => (f && ink in f ? f[ink as FaceInk] : LIGHT[ink]);
}

/* Stroke widths in screen px at card size (non-scaling strokes). */
const LINE = { silhouette: 1.75, face: 1, detail: 1, stripe: 0.75, grain: 1 } as const;

/* ------------------------------------------------------------------ */
/* Options & results                                                   */
/* ------------------------------------------------------------------ */

export type RenderOptions = {
  /** `css` keeps theme variables (inline); `static` resolves them to light-theme hex values (files). */
  readonly palette?: "css" | "static";
  readonly finish?: string;
  /** Platform height in mm for manifests with an adjustable platform (learning tower). */
  readonly platformLevel?: number;
  readonly pose?: string;
  /** Id prefix, unique per inline instance on a page. */
  readonly idPrefix?: string;
};

export type OrthoLabel = {
  readonly key: DimKey;
  readonly axis: "w" | "h" | "d";
  readonly valueCm: number;
  /** Centre of the label in % of the drawing's width / height. */
  readonly x: number;
  readonly y: number;
};

export type OrthoFrame = {
  /** Floor line in % of the height. */
  readonly floorY: number;
  /** Horizontal extent of each elevation in % of the width. */
  readonly front: readonly [number, number];
  readonly side: readonly [number, number];
};

export type Drawing = {
  /** [minX, minY, width, height] in projected millimetres. */
  readonly viewBox: readonly [number, number, number, number];
  readonly width: number;
  readonly height: number;
  /** Where world (0, 0, 0) lands, measured from the drawing's top-left corner. */
  readonly origin: Vec2;
  /** Inner markup of the <svg> (style, defs and the drawing). */
  readonly body: string;
  readonly labels?: readonly OrthoLabel[];
  readonly frame?: OrthoFrame;
};

export type Layer = {
  /** Part ids in this layer (space-separated in `data-part`). */
  readonly parts: readonly string[];
  readonly body: string;
  /** Exploded offset in % of the stage width / height. */
  readonly ex: number;
  readonly ey: number;
  /** Paint order among part layers (cover drop-in stagger). */
  readonly index: number;
  /** Shown only while assembled (e.g. a tab end flush in its slot) or only while exploded (dowel lines). */
  readonly state?: "assembled" | "exploded";
};

export type LayeredDrawing = {
  readonly viewBox: readonly [number, number, number, number];
  readonly width: number;
  readonly height: number;
  readonly layers: readonly Layer[];
};

/* ------------------------------------------------------------------ */
/* Placed geometry                                                     */
/* ------------------------------------------------------------------ */

type Prism = {
  readonly kind: "prism";
  readonly id: string;
  readonly order: number;
  readonly part: PanelPart | ExtrusionPart;
  readonly origin: Vec3;
  readonly u: Vec3;
  readonly v: Vec3;
  readonly n: Vec3;
  readonly t: number;
  readonly d: string;
  readonly outer: readonly Polyline[];
};

type Rod = {
  readonly kind: "rod";
  readonly id: string;
  readonly order: number;
  readonly part: RodPart;
  /** True ends (caps). */
  readonly from: Vec3;
  readonly to: Vec3;
  /** Drawn body (the exposed span, or the whole rod). */
  readonly bodyFrom: Vec3;
  readonly bodyTo: Vec3;
  /** The visible cap is flush on a later face and paints last. */
  readonly capOnTop: boolean;
  readonly r: number;
};

type Cord = {
  readonly kind: "cord";
  readonly id: string;
  readonly order: number;
  readonly part: CordPart;
  readonly points: readonly Vec3[];
};

type Geo = Prism | Rod | Cord;

const sampleCache = new Map<string, Polyline[]>();
function sampled(d: string): Polyline[] {
  let hit = sampleCache.get(d);
  if (!hit) {
    hit = samplePath(d);
    sampleCache.set(d, hit);
  }
  return hit;
}

function visibleIn(part: Part, view: View): boolean {
  if (part.only && !part.only.includes(view)) return false;
  if (part.hideIn?.includes(view)) return false;
  return true;
}

/** Applies pose, platform level and (for the exploded view) the part offsets. */
function placeParts(m: Manifest, view: View, opts: RenderOptions): Geo[] {
  const flip = Boolean(opts.pose && m.poses?.[opts.pose]?.flipY);
  const pos = (p: Vec3): Vec3 => (flip ? [p[0], m.size.h - p[1], p[2]] : p);
  const dir = (p: Vec3): Vec3 => (flip ? [p[0], -p[1], p[2]] : p);
  const platformShift =
    m.platform && opts.platformLevel !== undefined ? opts.platformLevel - m.platform.level : 0;
  const geos: Geo[] = [];
  for (const part of m.parts) {
    if (!visibleIn(part, view)) continue;
    const exploded = view === "exploded" ? (m.exploded?.[part.id] ?? [0, 0, 0]) : ([0, 0, 0] as Vec3);
    const lift = platformShift && m.platform?.parts.includes(part.id) ? platformShift : 0;
    const move: Vec3 = add3(exploded, [0, lift, 0]);
    const order = part.order ?? 0;
    if (part.kind === "panel" || part.kind === "extrusion") {
      const axes = planeAxes(part.kind === "panel" ? part.plane : "XY");
      const outline = part.kind === "panel" ? part.outline : part.profile;
      geos.push({
        kind: "prism",
        id: part.id,
        order,
        part,
        origin: pos(add3(part.origin, move)),
        u: dir(axes.u),
        v: dir(axes.v),
        n: dir(axes.n),
        t: part.kind === "panel" ? part.t : part.depth,
        d: outline + (part.holes ?? ""),
        outer: sampled(outline),
      });
    } else if (part.kind === "rod") {
      const from = pos(add3(part.from, move));
      const to = pos(add3(part.to, move));
      const seated = view !== "exploded" && part.exposed;
      const along = unit3(sub3(to, from));
      geos.push({
        kind: "rod",
        id: part.id,
        order,
        part,
        from,
        to,
        bodyFrom: seated ? add3(from, scale3(along, part.exposed![0])) : from,
        bodyTo: seated ? add3(from, scale3(along, part.exposed![1])) : to,
        capOnTop: view !== "exploded" && Boolean(part.capOnTop),
        r: part.d / 2,
      });
    } else {
      geos.push({ kind: "cord", id: part.id, order, part, points: part.points.map((p) => pos(add3(p, move))) });
    }
  }
  return geos;
}

function localToWorld(g: Prism, [a, b]: Vec2, depth = 0): Vec3 {
  return add3(add3(add3(g.origin, scale3(g.u, a)), scale3(g.v, b)), scale3(g.n, depth));
}

/** A handful of world points that bound a part (for depth sorting and the contact shadow). */
function worldSamples(g: Geo): Vec3[] {
  if (g.kind === "prism") {
    const pts: Vec3[] = [];
    for (const line of g.outer) {
      for (const p of line.points) {
        pts.push(localToWorld(g, p), localToWorld(g, p, g.t));
      }
    }
    return pts;
  }
  if (g.kind === "rod") {
    const out: Vec3[] = [];
    for (const c of [g.from, g.to]) {
      for (const [dx, dy, dz] of [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
      ] as const) {
        out.push(add3(c, [dx * g.r, dy * g.r, dz * g.r]));
      }
    }
    return out;
  }
  return [...g.points];
}

function centre(g: Geo): Vec3 {
  const pts = worldSamples(g);
  const lo: [number, number, number] = [Infinity, Infinity, Infinity];
  const hi: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) {
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i], p[i]);
      hi[i] = Math.max(hi[i], p[i]);
    }
  }
  return [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
}

/** Painter's order: manifest `order` first (oblique only), then far to near along the projectors. */
function paintOrder(geos: Geo[], proj: Projection, useOrder: boolean): Geo[] {
  const depth = new Map(geos.map((g) => [g, dot3(centre(g), proj.away)]));
  return [...geos].sort((a, b) => (useOrder ? a.order - b.order : 0) || depth.get(b)! - depth.get(a)!);
}

/* ------------------------------------------------------------------ */
/* SVG writer                                                          */
/* ------------------------------------------------------------------ */

type Attrs = Record<string, string | number | undefined | false>;

function el(tag: string, attrs: Attrs, children?: string): string {
  let s = `<${tag}`;
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    s += ` ${k}="${typeof v === "number" ? fmt(v, 2) : v}"`;
  }
  return children === undefined ? `${s}/>` : `${s}>${children}</${tag}>`;
}

/** Transform numbers stay space-separated (the transform grammar is stricter than path data). */
const matrixAttr = (m: Affine) =>
  `matrix(${m
    .slice(0, 4)
    .map((v) => fmt(v, 3))
    .concat(m.slice(4).map((v) => fmt(v)))
    .join(" ")})`;

/** A flush rod end, painted after everything else. */
type Cap = { readonly d: string; readonly tone: Tone };

class Writer {
  readonly parts: string[] = [];
  readonly defs: string[] = [];
  readonly caps: Cap[] = [];
  readonly bounds: Box = emptyBox();
  private readonly shapes = new Map<string, { id: string; at: Vec2 }>();
  constructor(
    readonly paint: Paint,
    private readonly ids: { prefix: string; next: number },
    /** Reuse identical shapes through <use> (never across layers: each layer has its own writer). */
    private readonly reuse = true,
  ) {}

  /** Static files get short ids ("a0"); inline instances "<prefix>-0", which never collide across prefixes. */
  id(): string {
    const n = (this.ids.next++).toString(36);
    return this.ids.prefix ? `${this.ids.prefix}-${n}` : `a${n}`;
  }

  add(markup: string) {
    this.parts.push(markup);
  }

  include(points: Iterable<Vec2>) {
    for (const p of points) growBox(this.bounds, p);
  }

  /** Returns an existing shape for `key`, or registers this one. */
  shared(key: string, at: Vec2): { id: string; at: Vec2; fresh: boolean } {
    const hit = this.reuse ? this.shapes.get(key) : undefined;
    if (hit) return { ...hit, fresh: false };
    const entry = { id: this.id(), at };
    this.shapes.set(key, entry);
    return { ...entry, fresh: true };
  }
}

/* ------------------------------------------------------------------ */
/* Faces and tones                                                     */
/* ------------------------------------------------------------------ */

type Style = {
  /** Tone of a visible broad face with outward normal `n`. */
  readonly face: (n: Vec3) => Tone;
  readonly grain: boolean;
};

/** Light from the upper right: tops lightest, fronts mid, receding left sides in shade. */
const OBLIQUE_STYLE: Style = {
  face: (n) => {
    const top = n[1];
    const front = -n[2];
    const side = -n[0];
    if (top >= front && top >= side) return "wood-top";
    return side > front ? "wood-side" : "wood";
  },
  grain: true,
};

const ORTHO_STYLE: Style = { face: () => "wood", grain: true };

/** Bands drawn wider than this (mm) are laminated blocks rather than a single sheet's edge. */
const THICK_BAND = 20;

/** Two to five stripes depending on how wide the band is drawn. */
function stripeCount(bandWidth: number, override?: number): number {
  if (override) return override;
  return Math.max(2, Math.min(5, Math.round(bandWidth / 4.5)));
}

/* ------------------------------------------------------------------ */
/* Prisms (panels and extrusions)                                      */
/* ------------------------------------------------------------------ */

function drawDetails(w: Writer, details: readonly Detail[] | undefined, m: Affine) {
  for (const det of details ?? []) {
    w.add(
      el("path", {
        d: det.d,
        transform: matrixAttr(m),
        fill: det.fill ? w.paint(det.fill) : "none",
        stroke: det.stroke ? w.paint(det.stroke) : det.fill ? "none" : undefined,
        "stroke-width": det.stroke || !det.fill ? (det.width ?? LINE.detail) : undefined,
        opacity: det.opacity,
      }),
    );
  }
}

function drawPrism(w: Writer, g: Prism, proj: Projection, style: Style) {
  const part = g.part;
  const m = planeMatrix(g, g.origin, proj);
  const det = m[0] * m[3] - m[1] * m[2];
  const band = projectDir(proj, scale3(g.n, g.t));

  if (Math.abs(det) < 1e-6) {
    drawEdgeOn(w, g, m, band);
    return;
  }

  const plusIsFar = dot3(g.n, proj.away) > 0;
  const near: Vec2 = plusIsFar ? [0, 0] : band;
  const far: Vec2 = plusIsFar ? band : [0, 0];
  const visibleNormal = plusIsFar ? scale3(g.n, -1) : g.n;
  const faceTone: Tone = part.face === "edge" ? "ply-1" : style.face(visibleNormal);
  const at = (off: Vec2): Affine => [m[0], m[1], m[2], m[3], m[4] + off[0], m[5] + off[1]];
  const toScreen = (off: Vec2) => (p: Vec2) => applyAffine(at(off), p);

  for (const line of g.outer) {
    w.include(line.points.map(toScreen(near)));
    w.include(line.points.map(toScreen(far)));
  }

  const hasBand = g.t > 0 && len2(band) > 0.5;
  if (!hasBand) {
    // A face seen square-on (ortho) or a flush inlay: one shape, reused when repeated.
    const anchor: Vec2 = [m[4] + near[0], m[5] + near[1]];
    const flat = w.shared(`face|${g.d}|${nums(m.slice(0, 4), 3)}|${faceTone}`, anchor);
    if (flat.fresh) {
      w.add(
        el("path", {
          id: flat.id,
          d: g.d,
          transform: matrixAttr(at(near)),
          fill: w.paint(faceTone),
          "stroke-width": LINE.detail,
        }),
      );
    } else {
      const [x, y] = sub2(anchor, flat.at);
      w.add(el("use", { href: `#${flat.id}`, x: x ? fmt(x) : undefined, y: y ? fmt(y) : undefined }));
    }
    if (style.grain && part.grain && part.face !== "edge") drawGrain(w, part.grain, at(near));
    drawDetails(w, part.details, at(near));
    return;
  }

  // The far face is the shared shape; every other copy is a <use> of it.
  const plainBand = part.band === "wood";
  const farAnchor: Vec2 = [m[4] + far[0], m[5] + far[1]];
  const key = `${g.d}|${nums(m.slice(0, 4), 3)}|${nums(band)}|${plainBand}`;
  const shape = w.shared(key, farAnchor);
  const rel = (off: Vec2): Vec2 => sub2([m[4] + off[0], m[5] + off[1]], shape.at);
  const copyAt = (off: Vec2, attrs: Attrs) => {
    const [x, y] = rel(off);
    return el("use", { href: `#${shape.id}`, x: x ? fmt(x) : undefined, y: y ? fmt(y) : undefined, ...attrs });
  };

  if (shape.fresh) {
    const farPath = el("path", { id: shape.id, d: g.d, transform: matrixAttr(at(far)) });
    if (plainBand) {
      w.defs.push(farPath);
      w.add(copyAt(far, { fill: w.paint("wood-top") }));
    } else {
      w.add(farPath); // inherits the ply-1 fill and the silhouette stroke
    }
  } else {
    w.add(copyAt(far, plainBand ? { fill: w.paint("wood-top") } : {}));
  }

  if (!plainBand) {
    const stripes = stripeCount(len2(band), part.strata);
    // Thin edges read best as alternating veneer stripes; thick laminations as fine glue lines.
    const fineLines = len2(band) > THICK_BAND;
    for (let k = stripes - 1; k >= 1; k--) {
      const off = add2(near, scale2(sub2(far, near), k / stripes));
      w.add(
        copyAt(
          off,
          fineLines
            ? { stroke: w.paint(k % 2 === 0 ? "ply-3" : "ply-2"), "stroke-width": LINE.stripe }
            : { fill: w.paint(k % 2 === 1 ? "ply-2" : "ply-1"), stroke: "none" },
        ),
      );
    }
  }

  const connectors = silhouetteConnectors(g.outer, toScreen(near), sub2(far, near));
  if (connectors) w.add(el("path", { d: connectors, fill: "none" }));

  w.add(copyAt(near, { fill: w.paint(faceTone), "stroke-width": LINE.face }));

  if (style.grain && part.grain && part.face !== "edge") drawGrain(w, part.grain, at(near));
  drawDetails(w, part.details, at(near));
}

function drawGrain(w: Writer, grain: string, m: Affine) {
  w.add(
    el("path", {
      d: grain,
      transform: matrixAttr(m),
      fill: "none",
      stroke: w.paint("grain"),
      "stroke-opacity": 0.35,
      "stroke-width": LINE.grain,
    }),
  );
}

/**
 * Where the swept edge of a part leaves its outline (outline tangent parallel
 * to the sweep), a straight silhouette line joins the near and far faces.
 */
function silhouetteConnectors(lines: readonly Polyline[], toScreen: (p: Vec2) => Vec2, sweep: Vec2): string {
  let d = "";
  for (const line of lines) {
    if (!line.closed) continue;
    const pts = line.points.map(toScreen);
    if (len2(sub2(pts[0], pts[pts.length - 1])) < 1e-6) pts.pop();
    const n = pts.length;
    const signs = pts.map((p, i) => Math.sign(cross2(sub2(pts[(i + 1) % n], p), sweep)));
    // Carry the previous sign across edges parallel to the sweep.
    let last = signs.find((s) => s !== 0) ?? 0;
    for (let i = 0; i < n; i++) {
      if (signs[i] === 0) signs[i] = last;
      else last = signs[i];
    }
    for (let i = 0; i < n; i++) {
      if (signs[(i + n - 1) % n] !== signs[i]) d += `M${nums(pts[i])}l${nums(sweep)}`;
    }
  }
  return d;
}

/** A part seen exactly edge-on (ortho views): its cut edge as a strip with ply strata. */
function drawEdgeOn(w: Writer, g: Prism, m: Affine, band: Vec2) {
  const flat = g.outer.flatMap((l) => l.points.map((p) => applyAffine(m, p)));
  if (flat.length === 0) return;
  const pts = flat.concat(flat.map((p) => add2(p, band)));
  const hull = convexHull(pts);
  w.include(hull);
  w.add(el("path", { d: `M${hull.map((p) => nums(p)).join("L")}Z`, fill: w.paint("ply-1"), "stroke-width": LINE.face }));
  // The outline collapses onto a line: its two extremes carry the strata.
  let far = flat[0];
  for (const p of flat) if (len2(sub2(p, flat[0])) > len2(sub2(far, flat[0]))) far = p;
  const axis = len2(sub2(far, flat[0])) > 1e-6 ? unit2(sub2(far, flat[0])) : ([1, 0] as Vec2);
  let lo = flat[0];
  let hi = flat[0];
  for (const p of flat) {
    if (dot2(p, axis) < dot2(lo, axis)) lo = p;
    if (dot2(p, axis) > dot2(hi, axis)) hi = p;
  }
  const stripes = stripeCount(len2(band), g.part.strata);
  if (len2(band) < 0.5 || len2(sub2(hi, lo)) < 0.5) return;
  let d = "";
  for (let k = 1; k < stripes; k++) {
    const off = scale2(band, k / stripes);
    d += `M${nums(add2(lo, off))}L${nums(add2(hi, off))}`;
  }
  w.add(el("path", { d, fill: "none", stroke: w.paint("ply-2"), "stroke-width": LINE.stripe }));
}

/* ------------------------------------------------------------------ */
/* Rods                                                                */
/* ------------------------------------------------------------------ */

type EllipseAxes = { rx: number; ry: number; angle: number; major: Vec2 };

/** Principal axes of the ellipse with conjugate semi-diameters a and b. */
function ellipseAxes(a: Vec2, b: Vec2): EllipseAxes {
  const sxx = a[0] * a[0] + b[0] * b[0];
  const syy = a[1] * a[1] + b[1] * b[1];
  const sxy = a[0] * a[1] + b[0] * b[1];
  const mean = (sxx + syy) / 2;
  const spread = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy);
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const rx = Math.sqrt(Math.max(0, mean + spread));
  const ry = Math.sqrt(Math.max(0, mean - spread));
  return { rx, ry, angle: (angle * 180) / Math.PI, major: [Math.cos(angle) * rx, Math.sin(angle) * rx] };
}

function ellipsePath(c: Vec2, e: EllipseAxes): string {
  const arc = `a${nums([e.rx, e.ry])} ${fmt(e.angle)} 1 0 `;
  const across = scale2(e.major, -2);
  return `M${nums(add2(c, e.major))}${arc}${nums(across)}${arc}${nums(scale2(across, -1))}Z`;
}

/** Sweep flag (y-down screen space) for an arc through start → mid → end. */
const sweepFlag = (start: Vec2, mid: Vec2, end: Vec2) => (cross2(sub2(mid, start), sub2(end, mid)) > 0 ? 1 : 0);

const LIGHT_DIR: Vec2 = unit2([0.6, -0.8]);

/**
 * `bodyCaps`: also cap the drawn body where it enters a panel. Only the layered
 * stage needs it — the cap hides under the panel's layer until it explodes away.
 */
function drawRod(w: Writer, g: Rod, proj: Projection, bodyCaps = false) {
  const axis = sub3(g.to, g.from);
  const a = unit3(axis);
  const ref: Vec3 = Math.abs(a[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const e1 = unit3(cross3(a, ref));
  const e2 = cross3(a, e1);
  const E1 = scale2(projectDir(proj, e1), g.r);
  const E2 = scale2(projectDir(proj, e2), g.r);
  const c0 = project(proj, g.bodyFrom);
  const c1 = project(proj, g.bodyTo);
  const run = sub2(c1, c0);
  const ell = ellipseAxes(E1, E2);
  const half: Vec2 = [Math.hypot(E1[0], E2[0]), Math.hypot(E1[1], E2[1])];
  w.include([sub2(c0, half), add2(c0, half), sub2(c1, half), add2(c1, half)]);

  const capAtTo = dot3(a, proj.away) < -1e-6;
  const capAtFrom = dot3(a, proj.away) > 1e-6;
  // A flush cap sits at the rod's true end; a free end caps the drawn body.
  const capCentre = capAtTo
    ? g.capOnTop ? project(proj, g.to) : c1
    : capAtFrom
      ? g.capOnTop ? project(proj, g.from) : c0
      : null;
  if (capCentre) w.include([sub2(capCentre, half), add2(capCentre, half)]);
  const capTone: Tone = g.part.cap ?? "ply-2";

  let body = "";
  if (len2(run) < 0.5) {
    // Seen end-on: only the cap.
  } else if (ell.ry < 0.05 * g.r) {
    // Cross-section edge-on: a plain strip.
    const m = ell.major;
    const quad = [add2(c0, m), add2(c1, m), sub2(c1, m), sub2(c0, m)];
    body += el("path", { d: `M${quad.map((p) => nums(p)).join("L")}Z`, fill: w.paint("wood"), "stroke-width": LINE.face });
  } else {
    const theta = Math.atan2(cross2(E2, run), cross2(E1, run));
    const T = add2(scale2(E1, Math.cos(theta)), scale2(E2, Math.sin(theta)));
    let M = add2(scale2(E1, -Math.sin(theta)), scale2(E2, Math.cos(theta)));
    if (dot2(M, run) < 0) M = scale2(M, -1);
    const arc = (start: Vec2, mid: Vec2, end: Vec2) =>
      `A${nums([ell.rx, ell.ry])} ${fmt(ell.angle)} 0 ${sweepFlag(start, mid, end)} ${nums(end)}`;
    const s1 = add2(c0, T);
    const e1p = add2(c1, T);
    const e2p = sub2(c1, T);
    const s2 = sub2(c0, T);
    const d =
      `M${nums(s1)}L${nums(e1p)}${arc(e1p, add2(c1, M), e2p)}` + `L${nums(s2)}${arc(s2, sub2(c0, M), s1)}Z`;
    body += el("path", { d, fill: w.paint("wood"), "stroke-width": LINE.face });
    // A soft highlight along the lit side.
    let side = unit2(perp2(run));
    if (dot2(side, LIGHT_DIR) < 0) side = scale2(side, -1);
    const reach = Math.abs(cross2(T, unit2(run))) * 0.48;
    const off = scale2(side, reach);
    body += el("path", {
      d: `M${nums(add2(c0, off))}L${nums(add2(c1, off))}`,
      fill: "none",
      stroke: w.paint("wood-top"),
      "stroke-width": 1.5,
    });
  }

  let cap = "";
  if (capCentre) {
    if (g.capOnTop) w.caps.push({ d: ellipsePath(capCentre, ell), tone: capTone });
    const bodyEnd = capAtTo ? c1 : c0;
    if (!g.capOnTop || bodyCaps) {
      cap = el("path", { d: ellipsePath(bodyEnd, ell), fill: w.paint(capTone), "stroke-width": LINE.detail });
    }
  }

  const markup = body + cap;
  if (!markup) return;
  const key = `rod|${nums([...run, ...E1, ...E2], 2)}|${capTone}|${g.capOnTop}|${bodyCaps}`;
  const shape = w.shared(key, c0);
  if (shape.fresh) {
    w.add(el("g", { id: shape.id }, markup));
  } else {
    const [x, y] = sub2(c0, shape.at);
    w.add(el("use", { href: `#${shape.id}`, x: x ? fmt(x) : undefined, y: y ? fmt(y) : undefined }));
  }
}

function drawCord(w: Writer, g: Cord, proj: Projection) {
  const pts = g.points.map((p) => project(proj, p));
  w.include(pts);
  let d = `M${nums(pts[0])}`;
  for (let i = 1; i + 2 < pts.length; i += 3) d += `C${nums([...pts[i], ...pts[i + 1], ...pts[i + 2]])}`;
  w.add(
    el("path", { d, fill: "none", stroke: w.paint(g.part.tone ?? "anar"), "stroke-width": g.part.width ?? 1.5 }),
  );
}

function drawCaps(w: Writer, caps: readonly Cap[]) {
  const byTone = new Map<Tone, string>();
  for (const c of caps) byTone.set(c.tone, (byTone.get(c.tone) ?? "") + c.d);
  for (const [tone, d] of byTone) w.add(el("path", { d, fill: w.paint(tone), "stroke-width": LINE.detail }));
}

function drawGeo(w: Writer, g: Geo, proj: Projection, style: Style, bodyCaps = false) {
  if (g.kind === "prism") drawPrism(w, g, proj, style);
  else if (g.kind === "rod") drawRod(w, g, proj, bodyCaps);
  else drawCord(w, g, proj);
}

/* ------------------------------------------------------------------ */
/* Contact shadow                                                      */
/* ------------------------------------------------------------------ */

type Ellipse = { cx: number; cy: number; rx: number; ry: number };

/** One soft ellipse under whatever touches the floor. */
function contactShadow(m: Manifest, geos: readonly Geo[]): Ellipse | null {
  const tol = Math.max(10, 0.04 * m.size.h);
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const g of geos) {
    if (g.kind === "cord" || g.part.shadow === false) continue;
    for (const p of worldSamples(g)) {
      if (p[1] > tol) continue;
      x0 = Math.min(x0, p[0]);
      x1 = Math.max(x1, p[0]);
      z0 = Math.min(z0, p[2]);
      z1 = Math.max(z1, p[2]);
    }
  }
  if (!Number.isFinite(x0)) return null;
  const span = Math.max(x1 - x0, z1 - z0);
  const [cx, cy] = project(OBLIQUE, [(x0 + x1) / 2, 0, (z0 + z1) / 2]);
  const rx = ((x1 - x0) + 0.433 * (z1 - z0)) / 2 + 0.06 * span;
  const ry = Math.max(0.25 * (z1 - z0) * 0.62, 0.05 * rx) + 0.03 * span;
  return { cx, cy, rx, ry };
}

function drawShadow(w: Writer, e: Ellipse) {
  const id = w.id();
  const stop = (offset: number, opacity: number) =>
    el("stop", { offset, "stop-color": w.paint("shadow"), "stop-opacity": opacity });
  w.defs.push(el("radialGradient", { id }, stop(0, 0.15) + stop(0.6, 0.2) + stop(1, 0)));
  w.add(el("ellipse", { cx: fmt(e.cx), cy: fmt(e.cy), rx: fmt(e.rx), ry: fmt(e.ry), fill: `url(#${id})`, stroke: "none" }));
  w.include([
    [e.cx - e.rx, e.cy - e.ry],
    [e.cx + e.rx, e.cy + e.ry],
  ]);
}

/* ------------------------------------------------------------------ */
/* Document assembly                                                   */
/* ------------------------------------------------------------------ */

const ROOT_CLASS = "prt";

/** Inherited defaults (as CSS on the root so every layer and <use> clone shares them) + non-scaling strokes. */
function rootStyle(paint: Paint): string {
  return el(
    "style",
    {},
    `.${ROOT_CLASS}{fill:${paint("ply-1")};stroke:${paint("ink")};stroke-width:${LINE.silhouette}px;stroke-linejoin:round;stroke-linecap:round;fill-rule:evenodd}.${ROOT_CLASS} *{vector-effect:non-scaling-stroke}`,
  );
}

function assemble(w: Writer, withStyle: boolean): string {
  return (withStyle ? rootStyle(w.paint) : "") + (w.defs.length ? el("defs", {}, w.defs.join("")) : "") + w.parts.join("");
}

function finalViewBox(box: Box, margin: number): [number, number, number, number] {
  const x = Math.floor((box.minX - margin) * 10) / 10;
  const y = Math.floor((box.minY - margin) * 10) / 10;
  return [x, y, Math.ceil((box.maxX + margin - x) * 10) / 10, Math.ceil((box.maxY + margin - y) * 10) / 10];
}

function drawingFrom(w: Writer, viewBox: [number, number, number, number], extra?: Partial<Drawing>): Drawing {
  return {
    viewBox,
    width: viewBox[2],
    height: viewBox[3],
    origin: [-viewBox[0], -viewBox[1]],
    body: assemble(w, true),
    ...extra,
  };
}

/* ------------------------------------------------------------------ */
/* Oblique views                                                       */
/* ------------------------------------------------------------------ */

function drawOblique(w: Writer, m: Manifest, geos: Geo[], withDowels: boolean) {
  const shadow = contactShadow(m, geos);
  if (shadow) drawShadow(w, shadow);
  for (const g of paintOrder(geos, OBLIQUE, true)) drawGeo(w, g, OBLIQUE, OBLIQUE_STYLE);
  drawCaps(w, w.caps);
  if (withDowels) {
    const d = dowelPath(m);
    if (d) w.add(dowelElement(w, d));
  }
}

function dowelPath(m: Manifest): string {
  const off = (id?: string): Vec3 => (id ? (m.exploded?.[id] ?? [0, 0, 0]) : [0, 0, 0]);
  return (m.dowels ?? [])
    .map(({ at, part, with: other }) => {
      const a = project(OBLIQUE, add3(at, off(part)));
      const b = project(OBLIQUE, add3(at, off(other)));
      return `M${nums(a)}L${nums(b)}`;
    })
    .join("");
}

const dowelElement = (w: Writer, d: string) =>
  el("path", {
    d,
    fill: "none",
    stroke: w.paint("ink"),
    "stroke-width": 1,
    "stroke-dasharray": "3 3",
    "stroke-opacity": 0.6,
  });

function marginFor(box: Box) {
  return Math.max(box.maxX - box.minX, box.maxY - box.minY) * 0.03 + 4;
}

/* ------------------------------------------------------------------ */
/* Ortho view (front + side elevations, dimension lines)               */
/* ------------------------------------------------------------------ */

function projectedBox(geos: readonly Geo[], proj: Projection): Box {
  const box = emptyBox();
  for (const g of geos) for (const p of worldSamples(g)) growBox(box, project(proj, p));
  return box;
}

function drawOrtho(w: Writer, m: Manifest, geos: Geo[]): Partial<Drawing> & { box: Box } {
  const big = Math.max(m.size.w, m.size.h, m.size.d);
  const frontBox = projectedBox(geos, FRONT);
  const sideRaw = projectedBox(geos, SIDE);
  const gap = 0.16 * big;
  const side = shifted(SIDE, [frontBox.minX - gap - sideRaw.maxX, 0]);
  const sideBox = projectedBox(geos, side);

  for (const proj of [side, FRONT]) {
    for (const g of paintOrder(geos, proj, false)) drawGeo(w, g, proj, ORTHO_STYLE);
    drawCaps(w, w.caps.splice(0));
  }

  // Floor line under both elevations.
  const reach = 0.05 * big;
  w.add(
    el("path", {
      d: `M${nums([sideBox.minX - reach, 0])}H${fmt(frontBox.maxX + reach)}`,
      fill: "none",
      "stroke-width": LINE.detail,
    }),
  );

  const lane = 0.085 * big;
  const first = 0.075 * big;
  const ext = 0.018 * big;
  const tick = 0.012 * big;
  const counters = { w: 0, d: 0, hFront: 0, hSide: 0 };
  const labels: { key: DimKey; axis: DimSpec["axis"]; valueCm: number; at: Vec2 }[] = [];
  let d = "";
  const slash = ([x, y]: Vec2) => `M${nums([x - tick, y + tick])}L${nums([x + tick, y - tick])}`;

  for (const dim of m.dims) {
    const valueCm = Math.round(dim.to - dim.from) / 10;
    if (dim.axis === "w" || dim.axis === "d") {
      const proj = dim.axis === "w" ? FRONT : side;
      const box = dim.axis === "w" ? frontBox : sideBox;
      const lineY = box.maxY + first + lane * counters[dim.axis]++;
      const toX = (v: number) => project(proj, dim.axis === "w" ? [v, 0, 0] : [0, 0, v])[0];
      const xa = toX(dim.from);
      const xb = toX(dim.to);
      d += `M${nums([xa, box.maxY + ext])}V${fmt(lineY + ext)}M${nums([xb, box.maxY + ext])}V${fmt(lineY + ext)}`;
      d += `M${nums([Math.min(xa, xb) - tick * 1.5, lineY])}H${fmt(Math.max(xa, xb) + tick * 1.5)}`;
      d += slash([xa, lineY]) + slash([xb, lineY]);
      labels.push({ key: dim.key, axis: dim.axis, valueCm, at: [(xa + xb) / 2, lineY] });
    } else {
      const onSide = dim.view === "side";
      const box = onSide ? sideBox : frontBox;
      const index = onSide ? counters.hSide++ : counters.hFront++;
      const lineX = onSide ? box.minX - first - lane * index : box.maxX + first + lane * index;
      const edgeX = onSide ? box.minX - ext : box.maxX + ext;
      const toward = onSide ? -ext : ext;
      const ya = -dim.from;
      const yb = -dim.to;
      d += `M${nums([edgeX, ya])}H${fmt(lineX + toward)}M${nums([edgeX, yb])}H${fmt(lineX + toward)}`;
      d += `M${nums([lineX, Math.max(ya, yb) + tick * 1.5])}V${fmt(Math.min(ya, yb) - tick * 1.5)}`;
      d += slash([lineX, ya]) + slash([lineX, yb]);
      labels.push({ key: dim.key, axis: dim.axis, valueCm, at: [lineX, (ya + yb) / 2] });
    }
  }
  if (d) w.add(el("path", { d, fill: "none", "stroke-width": LINE.detail, "stroke-opacity": 0.85 }));

  const box = unionBox(unionBox(frontBox, sideBox), w.bounds);
  for (const l of labels) growBox(box, l.at);
  return {
    box,
    labels: labels.map((l) => ({ key: l.key, axis: l.axis, valueCm: l.valueCm, x: l.at[0], y: l.at[1] })),
    frame: { floorY: 0, front: [frontBox.minX, frontBox.maxX], side: [sideBox.minX, sideBox.maxX] },
  };
}

/* ------------------------------------------------------------------ */
/* Flat view (the parts nested on their plywood sheet)                 */
/* ------------------------------------------------------------------ */

type SheetItem = {
  readonly g: Prism;
  /** Bounding box of the outline in local mm. */
  readonly u0: number;
  readonly v0: number;
  readonly v1: number;
  /** Footprint on the sheet (after rotation). */
  readonly w: number;
  readonly h: number;
  readonly rot: boolean;
  /** Hand-placed top-left corner, if any. */
  readonly at?: Vec2;
};

/** Skyline bottom-left packing for parts without a hand-placed `sheetAt`. */
function nest(items: readonly { w: number; h: number }[], sheetW: number, gap: number): Vec2[] {
  type Seg = { x: number; w: number; y: number };
  let sky: Seg[] = [{ x: gap, w: sheetW - 2 * gap, y: gap }];
  const placed: Vec2[] = new Array(items.length);
  const orderIdx = items.map((_, i) => i).sort((a, b) => items[b].h - items[a].h || items[b].w - items[a].w);
  for (const i of orderIdx) {
    const { w, h } = items[i];
    let best: { x: number; y: number } | null = null;
    for (const s of sky) {
      const x = s.x;
      if (x + w > sheetW - gap + 1e-6) continue;
      const y = Math.max(...sky.filter((o) => o.x < x + w + gap && o.x + o.w > x).map((o) => o.y));
      if (!best || y < best.y || (y === best.y && x < best.x)) best = { x, y };
    }
    const at = best ?? { x: gap, y: Math.max(...sky.map((s) => s.y)) };
    placed[i] = [at.x, at.y];
    const top = at.y + h + gap;
    const left = at.x;
    const right = at.x + w + gap;
    const next: Seg[] = [];
    for (const s of sky) {
      if (s.x + s.w <= left || s.x >= right) {
        next.push(s);
        continue;
      }
      if (s.x < left) next.push({ x: s.x, w: left - s.x, y: s.y });
      if (s.x + s.w > right) next.push({ x: right, w: s.x + s.w - right, y: s.y });
    }
    next.push({ x: left, w: right - left, y: top });
    sky = next.sort((a, b) => a.x - b.x);
  }
  return placed;
}

function drawFlat(w: Writer, m: Manifest, geos: Geo[]): Box {
  const sheet = m.sheet ?? { w: 2440, h: 1220, t: 18 };
  const items: SheetItem[] = [];
  for (const g of geos) {
    if (g.kind !== "prism") continue;
    const want = g.part.sheet ?? g.part.kind === "panel";
    const copies = typeof want === "number" ? want : want ? 1 : 0;
    const b = boxOf(g.outer.flatMap((l) => l.points));
    const place = g.part.sheetAt;
    const rot = place?.rot === 90;
    const [w0, h0] = [b.maxX - b.minX, b.maxY - b.minY];
    for (let i = 0; i < copies; i++) {
      items.push({
        g,
        u0: b.minX,
        v0: b.minY,
        v1: b.maxY,
        w: rot ? h0 : w0,
        h: rot ? w0 : h0,
        rot,
        // Only the first copy can be hand-placed; extra laminations are nested automatically.
        at: place && i === 0 ? [place.x, place.y] : undefined,
      });
    }
  }
  const loose = items.filter((it) => !it.at);
  const nested = nest(loose, sheet.w, 30);
  const positionOf = (it: SheetItem) => it.at ?? nested[loose.indexOf(it)];

  w.add(el("path", { d: rrect(0, 0, sheet.w, sheet.h, 8), fill: w.paint("wood"), "stroke-width": LINE.face }));
  w.include([
    [0, 0],
    [sheet.w, sheet.h],
  ]);
  const grain = [0.18, 0.43, 0.71]
    .map((f, i) => {
      const y = sheet.h * f;
      const bow = (i % 2 ? -1 : 1) * sheet.h * 0.03;
      return `M${nums([sheet.w * 0.04, y])}Q${nums([sheet.w * 0.5, y + bow, sheet.w * 0.96, y - bow / 2])}`;
    })
    .join("");
  w.add(el("path", { d: grain, fill: "none", stroke: w.paint("grain"), "stroke-opacity": 0.35, "stroke-width": LINE.grain }));

  for (const it of items) {
    const [x, y] = positionOf(it);
    // Sheet space is y-down; local outlines are v-up.
    const mtx: Affine = it.rot ? [0, 1, 1, 0, x - it.v0, y - it.u0] : [1, 0, 0, -1, x - it.u0, y + it.v1];
    w.add(el("path", { d: it.g.d, transform: matrixAttr(mtx), fill: w.paint("wood-top"), "stroke-width": LINE.detail }));
  }
  return w.bounds;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Renders one view as the inner markup of an <svg> plus its geometry. */
export function renderDrawing(m: Manifest, view: View, opts: RenderOptions = {}): Drawing {
  const paint = makePaint(opts.palette ?? "css", opts.finish);
  const w = new Writer(paint, { prefix: opts.idPrefix ?? "", next: 0 });
  const geos = placeParts(m, view, opts);

  if (view === "ortho") {
    const result = drawOrtho(w, m, geos);
    const big = Math.max(m.size.w, m.size.h, m.size.d);
    const viewBox = finalViewBox(result.box, 0.07 * big);
    const pctX = (x: number) => Math.round(((x - viewBox[0]) / viewBox[2]) * 1000) / 10;
    const pctY = (y: number) => Math.round(((y - viewBox[1]) / viewBox[3]) * 1000) / 10;
    return drawingFrom(w, viewBox, {
      labels: result.labels?.map((l) => ({ ...l, x: pctX(l.x), y: pctY(l.y) })),
      frame: result.frame && {
        floorY: pctY(0),
        front: [pctX(result.frame.front[0]), pctX(result.frame.front[1])],
        side: [pctX(result.frame.side[0]), pctX(result.frame.side[1])],
      },
    });
  }

  if (view === "flat") {
    const box = drawFlat(w, m, geos);
    return drawingFrom(w, finalViewBox(box, 0.02 * Math.max(box.maxX - box.minX, box.maxY - box.minY)));
  }

  drawOblique(w, m, geos, view === "exploded");
  return drawingFrom(w, finalViewBox(w.bounds, marginFor(w.bounds)));
}

/** A standalone SVG file (static palette): `public/illustrations/{key}-{view}[-{finish}].svg`. */
export function renderSvgFile(m: Manifest, view: View, opts: Omit<RenderOptions, "palette" | "idPrefix"> = {}): string {
  const drawing = renderDrawing(m, view, { ...opts, palette: "static" });
  const [x, y, width, height] = drawing.viewBox;
  return el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: [x, y, width, height].map((v) => fmt(v)).join(" "),
      width: Math.round(width),
      height: Math.round(height),
      class: ROOT_CLASS,
    },
    drawing.body,
  );
}

/**
 * The assembled view split into stacked layers (one small <svg> per run of
 * parts that move together), for the cover and the PDP stage. Explode by
 * translating each layer's HTML wrapper by (ex %, ey %).
 */
export function renderLayers(m: Manifest, opts: RenderOptions = {}): LayeredDrawing {
  const paint = makePaint(opts.palette ?? "css", opts.finish);
  const ids = { prefix: opts.idPrefix ?? "", next: 0 };
  const geos = paintOrder(placeParts(m, "assembled", opts), OBLIQUE, true);
  const explodedParts = new Set(m.parts.filter((p) => visibleIn(p, "exploded")).map((p) => p.id));

  // Bounds cover both states so the exploded parts stay inside the stage.
  const probe = new Writer(paint, { prefix: "", next: 0 }, false);
  drawOblique(probe, m, geos, false);
  const exploded = new Writer(paint, { prefix: "", next: 0 }, false);
  drawOblique(exploded, m, placeParts(m, "exploded", opts), true);
  const box = unionBox(probe.bounds, exploded.bounds);
  const viewBox = finalViewBox(box, marginFor(box));
  const movesAs = (g: Geo) => g.part.explodesAs ?? g.id;
  const offsetOf = (g: Geo): Vec2 => project(OBLIQUE, m.exploded?.[movesAs(g)] ?? [0, 0, 0]);
  const pct = (o: Vec2): [number, number] => [
    Math.round((o[0] / viewBox[2]) * 10000) / 100,
    Math.round((o[1] / viewBox[3]) * 10000) / 100,
  ];

  const layers: Layer[] = [];
  const shadowWriter = new Writer(paint, ids, false);
  const shadow = contactShadow(m, geos);
  if (shadow) drawShadow(shadowWriter, shadow);
  layers.push({ parts: ["shadow"], body: assemble(shadowWriter, true), ex: 0, ey: 0, index: 0 });

  // One layer per part (the cover drops them in one by one); consecutive rods
  // that move together (a run of rungs) share a layer to keep the DOM small.
  type Run = { geos: Geo[]; offset: Vec2; state?: "assembled" };
  const runs: Run[] = [];
  for (const g of geos) {
    const offset = offsetOf(g);
    // Assembled-only details (a tab end flush in its slot) fade out; stand-ins stay.
    const state = explodedParts.has(movesAs(g)) ? undefined : "assembled";
    const last = runs.at(-1);
    const joins =
      last &&
      g.kind === "rod" &&
      last.geos.every((x) => x.kind === "rod") &&
      last.offset[0] === offset[0] &&
      last.offset[1] === offset[1] &&
      last.state === state;
    if (joins) last.geos.push(g);
    else runs.push({ geos: [g], offset, state });
  }

  const caps: Cap[] = [];
  runs.forEach((r, i) => {
    const writer = new Writer(paint, ids);
    for (const g of r.geos) drawGeo(writer, g, OBLIQUE, OBLIQUE_STYLE, true);
    caps.push(...writer.caps);
    const [ex, ey] = pct(r.offset);
    layers.push({ parts: r.geos.map((g) => g.id), body: assemble(writer, false), ex, ey, index: i + 1, state: r.state });
  });
  let index = runs.length;

  if (caps.length) {
    // Flush end grain on a panel face: only meaningful while assembled.
    const cw = new Writer(paint, ids, false);
    drawCaps(cw, caps);
    layers.push({ parts: ["caps"], body: assemble(cw, false), ex: 0, ey: 0, index: ++index, state: "assembled" });
  }

  const dowels = dowelPath(m);
  if (dowels) {
    const dw = new Writer(paint, ids, false);
    dw.add(dowelElement(dw, dowels));
    layers.push({ parts: ["dowels"], body: assemble(dw, false), ex: 0, ey: 0, index: ++index, state: "exploded" });
  }

  return { viewBox, width: viewBox[2], height: viewBox[3], layers };
}

/** The class every drawing's root <svg> carries (its <style> targets it). */
export const DRAWING_CLASS = ROOT_CLASS;
