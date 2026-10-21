/*
 * Converts the studio renders (public/renders/raw/*.png, produced by the dev-only /studio page)
 * into the catalogue sources served from public/renders/*.webp: transparent margins trimmed to a
 * small even padding, then high-quality WebP. Writes the intrinsic sizes to
 * src/components/studio/renders.json so <Render> can reserve space (no layout shift).
 * next/image derives every AVIF/WebP size from these on demand.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const RAW = path.resolve("public/renders/raw");
const OUT = path.resolve("public/renders");
const SIZES = path.resolve("src/components/studio/renders.json");

const sizes: Record<string, [number, number]> = {};
let total = 0;
for (const f of fs.readdirSync(RAW).filter((n) => n.endsWith(".png")).sort()) {
  const name = f.replace(/\.png$/, "");
  const trimmed = await sharp(path.join(RAW, f)).trim({ threshold: 2 }).toBuffer({ resolveWithObject: true });
  const pad = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 0.03);
  const info = await sharp(trimmed.data)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 90, effort: 6 })
    .toFile(path.join(OUT, `${name}.webp`));
  sizes[name] = [info.width, info.height];
  total += info.size;
}
fs.writeFileSync(SIZES, JSON.stringify(sizes, null, 0) + "\n");
console.log(`[renders] ${Object.keys(sizes).length} files, ${(total / 1024 / 1024).toFixed(1)} MB`);
