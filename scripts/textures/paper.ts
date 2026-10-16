/*
 * npx tsx scripts/textures/paper.ts
 * Writes the paper tiles public/textures/paper.webp (day: dark specks) and paper-night.webp
 * (night: light specks), 160 × 160, seamless (DESIGN.md §3.3). Every pixel shares one grey;
 * only alpha varies (0–6%), so the tile tints whatever paper colour sits under it.
 * Deterministic: both tiles share one seeded layout of specks and fibres.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fnv1a } from "../../src/lib/utils";

const SIZE = 160;
const MAX_ALPHA = 0.06;
const SPECKS = 720;
const FIBRES = 40;
const BYTE_BUDGET = 2 * 1024;
const OUT_DIR = path.resolve("public/textures");

const TILES = [
  { file: "paper.webp", grey: 40 },
  { file: "paper-night.webp", grey: 236 },
] as const;

/** Mulberry32 — same tiny PRNG as the grain tiles. */
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

const wrap = (v: number) => ((Math.round(v) % SIZE) + SIZE) % SIZE;

function buildAlpha(): Float32Array {
  const rnd = mulberry32(fnv1a("choobz-paper"));
  const alpha = new Float32Array(SIZE * SIZE);
  const deposit = (x: number, y: number, amount: number) => {
    const i = wrap(y) * SIZE + wrap(x);
    alpha[i] = Math.min(MAX_ALPHA, alpha[i] + amount);
  };

  // Speckle: mostly single grains, a few two-pixel crumbs.
  for (let n = 0; n < SPECKS; n++) {
    const x = rnd() * SIZE;
    const y = rnd() * SIZE;
    const strength = 0.015 + rnd() * 0.045;
    deposit(x, y, strength);
    if (rnd() < 0.18) deposit(x + (rnd() < 0.5 ? 1 : 0), y + (rnd() < 0.5 ? 0 : 1), strength * 0.6);
  }

  // Fibres: short, gently curving hairs pressed into the sheet.
  for (let n = 0; n < FIBRES; n++) {
    let x = rnd() * SIZE;
    let y = rnd() * SIZE;
    let angle = rnd() * Math.PI * 2;
    const length = 4 + rnd() * 8;
    const curl = (rnd() - 0.5) * 0.35;
    const strength = 0.02 + rnd() * 0.025;
    for (let step = 0; step < length; step++) {
      deposit(x, y, strength);
      angle += curl;
      x += Math.cos(angle);
      y += Math.sin(angle);
    }
  }
  return alpha;
}

async function writeTile(alpha: Float32Array, file: string, grey: number) {
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  for (let i = 0; i < alpha.length; i++) {
    rgba[i * 4] = grey;
    rgba[i * 4 + 1] = grey;
    rgba[i * 4 + 2] = grey;
    // Quantised to steps of 3/255: invisible difference, much smaller file.
    rgba[i * 4 + 3] = Math.round((alpha[i] * 255) / 3) * 3;
  }
  const out = path.join(OUT_DIR, file);
  await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } })
    .webp({ lossless: true, effort: 6, exact: true })
    .toFile(out);
  const bytes = fs.statSync(out).size;
  console.log(`[paper] ${file}  ${bytes} B${bytes > BYTE_BUDGET ? "  ✗ over 2 KB budget" : ""}`);
  return bytes <= BYTE_BUDGET;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const alpha = buildAlpha();
  const results = await Promise.all(TILES.map((t) => writeTile(alpha, t.file, t.grey)));
  if (results.includes(false)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
