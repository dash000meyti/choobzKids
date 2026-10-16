/*
 * npx tsx scripts/textures/grain.ts
 * Writes the 12 birch-grain tiles public/textures/grain-00.svg … grain-11.svg (DESIGN.md §3.1).
 * Deterministic: tile i is seeded with fnv1a("choobz-grain-" + i), so re-running produces
 * byte-identical files. Output is committed; src/lib/grain.ts picks a tile per slug.
 */
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { fnv1a } from "../../src/lib/utils";

const TILE_COUNT = 12;
const WIDTH = 400;
const HEIGHT = 500;
const INK = "#3A2412";
const GZIP_BUDGET = 3 * 1024;
const OUT_DIR = path.resolve("public/textures");

/** Mulberry32: tiny, fast, good enough for texture noise. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One decimal, no trailing ".0", no leading zero — what SVGO `precision: 1` would emit. */
function num(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = String(Object.is(rounded, -0) ? 0 : rounded);
  return text.replace(/^(-?)0\./, "$1.");
}

type Knot = { x: number; y: number };

/** 0–2 knots, one in 65% of tiles. */
function placeKnots(rnd: () => number): Knot[] {
  const roll = rnd();
  const count = roll < 0.65 ? 1 : roll < 0.85 ? 0 : 2;
  return Array.from({ length: count }, () => ({ x: 50 + rnd() * 300, y: 70 + rnd() * 360 }));
}

/** Grain lines part around a knot: up to ±14 units of sideways push, fading out by 60 units. */
function bendAroundKnots(x: number, y: number, knots: Knot[]): number {
  let bent = x;
  for (const knot of knots) {
    const distance = Math.hypot(x - knot.x, y - knot.y);
    if (distance >= 60) continue;
    const side = x >= knot.x ? 1 : -1;
    bent += side * 14 * 0.5 * (1 + Math.cos((Math.PI * distance) / 60));
  }
  return bent;
}

/** A near-vertical wavy line as smooth quadratic segments (vertices are the Q controls). */
function grainLine(startX: number, rnd: () => number, knots: Knot[]): string {
  const points: [number, number][] = [];
  let x = startX;
  let y = -10;
  points.push([bendAroundKnots(x, y, knots), y]);
  while (y < HEIGHT + 10) {
    y += 40 + rnd() * 30;
    x += (rnd() - 0.5) * 10;
    points.push([bendAroundKnots(x, y, knots), y]);
  }

  const [first, ...rest] = points;
  let d = `M${num(first[0])} ${num(first[1])}`;
  for (let i = 0; i < rest.length - 1; i++) {
    const [cx, cy] = rest[i];
    const [nx, ny] = rest[i + 1];
    d += `Q${num(cx)} ${num(cy)} ${num((cx + nx) / 2)} ${num((cy + ny) / 2)}`;
  }
  const [lx, ly] = rest[rest.length - 1];
  return `${d}L${num(lx)} ${num(ly)}`.replace(/ -/g, "-");
}

/** 3–5 concentric ellipses growing from rx 6 / ry 3 to rx 14 / ry 6. */
function knotRings(knot: Knot, rnd: () => number): string[] {
  const rings = 3 + Math.floor(rnd() * 3);
  return Array.from({ length: rings }, (_, i) => {
    const t = rings === 1 ? 1 : i / (rings - 1);
    const rx = 6 + t * 8;
    const ry = 3 + t * 3;
    return stroked(`<ellipse cx="${num(knot.x)}" cy="${num(knot.y)}" rx="${num(rx)}" ry="${num(ry)}"`, rnd) + "/>";
  });
}

/** Opacity needs two decimals (0.10–0.16); still drop the leading zero. */
function fraction(value: number): string {
  return String(Math.round(value * 100) / 100).replace(/^0\./, ".");
}

/** Per-mark stroke: opacity 0.10–0.16, width 1–1.6. */
function stroked(open: string, rnd: () => number): string {
  const opacity = 0.1 + rnd() * 0.06;
  const width = 1 + rnd() * 0.6;
  return `${open} stroke-opacity="${fraction(opacity)}" stroke-width="${num(width)}"`;
}

function tile(index: number): string {
  const rnd = mulberry32(fnv1a(`choobz-grain-${index}`));
  const lines = 14 + Math.floor(rnd() * 9);
  const knots = placeKnots(rnd);
  const spacing = WIDTH / lines;

  const marks: string[] = [];
  for (let n = 0; n < lines; n++) {
    const startX = (n + rnd() * 0.6) * spacing;
    marks.push(stroked(`<path d="${grainLine(startX, rnd, knots)}"`, rnd) + "/>");
  }
  for (const knot of knots) marks.push(...knotRings(knot, rnd));

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="none">` +
    `<g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${marks.join("")}</g></svg>\n`
  );
}

fs.mkdirSync(OUT_DIR, { recursive: true });
let failed = false;
for (let i = 0; i < TILE_COUNT; i++) {
  const svg = tile(i);
  const file = path.join(OUT_DIR, `grain-${String(i).padStart(2, "0")}.svg`);
  fs.writeFileSync(file, svg);
  const gz = gzipSync(svg, { level: 9 }).length;
  const over = gz > GZIP_BUDGET;
  failed ||= over;
  console.log(`[grain] ${path.basename(file)}  ${svg.length} B raw · ${gz} B gzip${over ? "  ✗ over 3 KB budget" : ""}`);
}
if (failed) process.exitCode = 1;
