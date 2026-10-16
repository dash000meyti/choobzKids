/*
 * npx tsx scripts/textures/orosi.ts
 * Bakes the Orosi light (DESIGN.md §3.4): morning sun through an arched گره‌چینی lattice with
 * four coloured panes — zardchube, sage, lapis, soft pomegranate — thrown diagonally from the
 * upper right, pre-blurred, alpha ≤ 35%. Writes public/light/orosi-morning.{avif,webp} (720×540)
 * and orosi-morning-mobile.{avif,webp} (480×360) and checks the byte budgets.
 *
 * Colour and coverage are rendered as two layers and joined afterwards, so blurring never pulls
 * the black of transparent pixels into the light (the usual dark fringe of blurred RGBA).
 */
import fs from "node:fs";
import path from "node:path";
import sharp, { type Sharp } from "sharp";

const OUT_DIR = path.resolve("public/light");

/** Window in its own units: a pointed «جناغی» arch, 300 wide, 440 tall, spring line at 130. */
const WINDOW = { w: 300, h: 440, spring: 130 };
const WINDOW_PATH = "M0 130C0 62 84 22 150 0C216 22 300 62 300 130V440H0Z";
/** Lozenge lattice pitch; cells are diamonds of this width. */
const PITCH = 60;
const BAR = 8;

const CLEAR_LIGHT = "#FFF4DC";
/** Each pane is a 2 × 2 group of lattice cells centred on a lattice node; together they bloom like a flower. */
const PANES = [
  { colour: "#F2B93B", cx: 150, cy: 90 }, // zardchube, under the arch
  { colour: "#B9D3B5", cx: 90, cy: 270 }, // sage
  { colour: "#8EA6CF", cx: 210, cy: 270 }, // lapis
  { colour: "#E59A84", cx: 150, cy: 330 }, // soft pomegranate
] as const;

/** Peak opacity for clear glass and for the coloured panes (DESIGN.md: max 35%). */
const ALPHA_CLEAR = 0.3;
const ALPHA_PANE = 0.35;

/** Light from the upper right lands sheared toward the lower left (inline-end in RTL). */
const THROW = "translate(420 40) rotate(-5) skewX(-26) scale(1.14 1.03)";

const VARIANTS = [
  { name: "orosi-morning", width: 720, height: 540, budget: 22 * 1024 },
  { name: "orosi-morning-mobile", width: 480, height: 360, budget: 14 * 1024 },
] as const;

const SOURCE = { width: 720, height: 540 };
/** «Gaussian ≈ 18 px at source scale»: an 18–20 px radius, σ ≈ 10. */
const BLUR_SIGMA = 10;

function diamond(cx: number, cy: number, half: number): string {
  return `M${cx - half} ${cy}L${cx} ${cy - half}L${cx + half} ${cy}L${cx} ${cy + half}Z`;
}

/** Diagonal lattice (x ± y = k·PITCH) plus the transom at the spring line. */
function latticeBars(): string {
  const reach = WINDOW.w + WINDOW.h;
  let d = `M0 ${WINDOW.spring}H${WINDOW.w}`;
  for (let k = -Math.ceil(reach / PITCH); k <= Math.ceil(reach / PITCH); k++) {
    const c = k * PITCH;
    d += `M${c} 0L${c + reach} ${reach}`; // x − y = c
    d += `M${c} 0L${c - reach} ${reach}`; // x + y = c
  }
  return d;
}

function svgDocument(body: string, background: string): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SOURCE.width}" height="${SOURCE.height}" viewBox="0 0 ${SOURCE.width} ${SOURCE.height}">` +
      `<rect width="100%" height="100%" fill="${background}"/>` +
      `<defs><clipPath id="w"><path d="${WINDOW_PATH}"/></clipPath></defs>` +
      `<g transform="${THROW}">${body}</g></svg>`,
  );
}

/** Colour layer: opaque everywhere so the blur only ever mixes real light colours. */
function colourLayer(): Buffer {
  const panes = PANES.map((p) => `<path d="${diamond(p.cx, p.cy, PITCH + BAR)}" fill="${p.colour}"/>`).join("");
  return svgDocument(panes, CLEAR_LIGHT);
}

/** Coverage layer: grey level = opacity; lattice bars cast shadow (zero light). */
function coverageLayer(): Buffer {
  const grey = (alpha: number) => {
    const v = Math.round(alpha * 255);
    return `rgb(${v},${v},${v})`;
  };
  const panes = PANES.map((p) => `<path d="${diamond(p.cx, p.cy, PITCH)}" fill="${grey(ALPHA_PANE)}"/>`).join("");
  const body =
    `<g clip-path="url(#w)"><path d="${WINDOW_PATH}" fill="${grey(ALPHA_CLEAR)}"/>${panes}` +
    `<path d="${latticeBars()}" stroke="#000" stroke-width="${BAR}" fill="none"/></g>`;
  return svgDocument(body, "#000");
}

async function render(variant: (typeof VARIANTS)[number]) {
  const scale = variant.width / SOURCE.width;
  const sigma = BLUR_SIGMA * scale;
  const size = { width: variant.width, height: variant.height };

  const colour = await sharp(colourLayer())
    .resize(size)
    .blur(sigma)
    .removeAlpha()
    .raw()
    .toBuffer();
  const coverage = await sharp(coverageLayer())
    .resize(size)
    .blur(sigma)
    .greyscale()
    .extractChannel(0)
    .raw()
    .toBuffer();

  const image = sharp(colour, { raw: { ...size, channels: 3 } }).joinChannel(coverage, {
    raw: { ...size, channels: 1 },
  });

  const results: boolean[] = [];
  for (const [ext, encode] of [
    ["avif", (s: Sharp) => s.avif({ quality: 50, effort: 9, chromaSubsampling: "4:2:0" })],
    ["webp", (s: Sharp) => s.webp({ quality: 72, alphaQuality: 60, effort: 6, smartSubsample: true })],
  ] as const) {
    const file = path.join(OUT_DIR, `${variant.name}.${ext}`);
    await encode(image.clone()).toFile(file);
    const bytes = fs.statSync(file).size;
    const ok = bytes <= variant.budget;
    results.push(ok);
    console.log(`[orosi] ${path.basename(file)}  ${(bytes / 1024).toFixed(1)} KB${ok ? "" : `  ✗ over ${variant.budget / 1024} KB budget`}`);
  }
  return results.every(Boolean);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  for (const variant of VARIANTS) results.push(await render(variant));
  if (results.includes(false)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
