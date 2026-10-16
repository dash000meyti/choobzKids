/*
 * npx tsx scripts/illustrations/build.ts [--only learning-tower,duck-pull-toy]
 *
 * Builds the static product drawings from the parts manifests (DESIGN.md §3.7):
 *   public/illustrations/{key}-{assembled|exploded|ortho|flat}.svg
 *   public/illustrations/{key}-{assembled|exploded|ortho}-{finish}.svg   (finishes other than natural)
 *   public/illustrations/{key}-assembled-{pose}.svg                      (alternative poses)
 * and src/components/illustrations/sizes.generated.json (intrinsic sizes,
 * ortho label positions) read by src/components/illustrations/sizes.ts.
 *
 * Files use the light-theme hex values, never page CSS. Each is checked
 * against the budget (≤ 150 nodes, ≤ 8 KB raw) and every manifest's dimension
 * lines against products.json. `--only` rebuilds some keys and keeps the
 * other entries of the sizes file.
 */
import fs from "node:fs";
import path from "node:path";
import { manifests, type ManifestKey } from "../../src/components/illustrations/manifests";
import type { Manifest, View } from "../../src/components/illustrations/manifests/types";
import { renderDrawing, renderSvgFile } from "../../src/components/illustrations/render";

const OUT_DIR = path.resolve("public/illustrations");
const SIZES_FILE = path.resolve("src/components/illustrations/sizes.generated.json");
const PRODUCTS_FILE = path.resolve("seed/content/products.json");
const VIEWS: readonly View[] = ["assembled", "exploded", "ortho", "flat"];
const FINISH_VIEWS: readonly View[] = ["assembled", "exploded", "ortho"];
const BUDGET = { nodes: 150, bytes: 8 * 1024 };

type Size = { width: number; height: number; originX: number; originY: number };
type Entry = {
  source: Manifest["source"];
  stub: boolean;
  finishes: string[];
  views: Record<string, Size>;
  poses: Record<string, Record<string, Size>>;
  ortho: { labels: unknown[]; frame: unknown } | null;
};

type SeedProduct = {
  slug: string;
  illustration?: string | null;
  dimensions?: { widthCm?: number; heightCm?: number; depthCm?: number; extra?: Record<string, number> } | null;
  variants?: { name?: string; swatch?: string | null; options?: Record<string, string>; urlParam?: string }[];
};

function parseOnly(argv: readonly string[]): Set<string> | null {
  const i = argv.indexOf("--only");
  const inline = argv.find((a) => a.startsWith("--only="));
  const value = inline ? inline.slice("--only=".length) : i >= 0 ? argv[i + 1] : undefined;
  if (value === undefined) return null;
  const keys = value.split(",").map((k) => k.trim()).filter(Boolean);
  const unknown = keys.filter((k) => !(k in manifests));
  if (unknown.length) {
    console.error(`[illustrations] unknown key(s): ${unknown.join(", ")}`);
    process.exit(1);
  }
  return new Set(keys);
}

function readProducts(): SeedProduct[] {
  if (!fs.existsSync(PRODUCTS_FILE)) return [];
  const raw = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
  return Array.isArray(raw) ? raw : (raw.products ?? []);
}

/** A variant counts as white when its name, options or URL say so, or its swatch is the white finish. */
function hasWhiteVariant(product: SeedProduct): boolean {
  return (product.variants ?? []).some((v) => {
    const text = [v.name, ...Object.values(v.options ?? {})].join(" ");
    return text.includes("سفید") || /color=white/.test(v.urlParam ?? "") || v.swatch?.toUpperCase() === "#F7F1E6";
  });
}

/** Warns when a manifest's dimension lines disagree with the product's real dimensions. */
function checkDims(key: string, m: Manifest, products: readonly SeedProduct[]): string[] {
  const problems: string[] = [];
  for (const product of products.filter((p) => p.illustration === key)) {
    const dims = product.dimensions;
    if (!dims) continue;
    for (const dim of m.dims) {
      const real = dim.key.startsWith("extra.")
        ? dims.extra?.[dim.key.slice("extra.".length)]
        : dims[dim.key as "widthCm" | "heightCm" | "depthCm"];
      const drawn = (dim.to - dim.from) / 10;
      if (real === undefined) problems.push(`${product.slug}: ${dim.key} is not in products.json`);
      else if (Math.abs(real - drawn) > 0.05) problems.push(`${product.slug}: ${dim.key} drawn ${drawn} cm, product says ${real} cm`);
    }
  }
  return problems;
}

const round = (n: number) => Math.round(n * 10) / 10;

function sizeOf(m: Manifest, view: View, pose?: string): Size {
  const d = renderDrawing(m, view, { palette: "static", pose });
  return { width: round(d.width), height: round(d.height), originX: round(d.origin[0]), originY: round(d.origin[1]) };
}

const fileName = (key: string, view: View, suffix?: string) => `${key}-${view}${suffix ? `-${suffix}` : ""}.svg`;

function writeSvg(name: string, svg: string, report: string[]) {
  fs.writeFileSync(path.join(OUT_DIR, name), svg);
  const nodes = (svg.match(/<[a-zA-Z]/g) ?? []).length;
  const bytes = Buffer.byteLength(svg);
  const over = nodes > BUDGET.nodes || bytes > BUDGET.bytes;
  report.push(`${over ? "✗" : " "} ${name.padEnd(46)} ${String(nodes).padStart(4)} nodes ${(bytes / 1024).toFixed(1).padStart(5)} KB`);
  return over;
}

function main() {
  const only = parseOnly(process.argv.slice(2));
  const products = readProducts();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const previous: Record<string, Entry> =
    only && fs.existsSync(SIZES_FILE) ? JSON.parse(fs.readFileSync(SIZES_FILE, "utf8")) : {};
  const sizes: Record<string, Entry> = {};
  const report: string[] = [];
  const warnings: string[] = [];
  let overBudget = 0;

  for (const key of Object.keys(manifests) as ManifestKey[]) {
    if (only && !only.has(key)) {
      if (previous[key]) sizes[key] = previous[key];
      continue;
    }
    const m: Manifest = manifests[key];
    const whiteFromSeed = products.some((p) => p.illustration === key && hasWhiteVariant(p));
    const finishes = [...new Set([...(m.finishes ?? []), ...(whiteFromSeed ? ["white"] : [])])];

    for (const view of VIEWS) overBudget += Number(writeSvg(fileName(key, view), renderSvgFile(m, view), report));
    for (const finish of finishes) {
      for (const view of FINISH_VIEWS) {
        overBudget += Number(writeSvg(fileName(key, view, finish), renderSvgFile(m, view, { finish }), report));
      }
    }
    const poses: Entry["poses"] = {};
    for (const pose of Object.keys(m.poses ?? {})) {
      overBudget += Number(writeSvg(fileName(key, "assembled", pose), renderSvgFile(m, "assembled", { pose }), report));
      poses[pose] = { assembled: sizeOf(m, "assembled", pose) };
    }

    const ortho = renderDrawing(m, "ortho", { palette: "static" });
    sizes[key] = {
      source: m.source,
      stub: Boolean(m.stub),
      finishes,
      views: Object.fromEntries(VIEWS.map((view) => [view, sizeOf(m, view)])),
      poses,
      ortho: { labels: [...(ortho.labels ?? [])], frame: ortho.frame ?? null },
    };
    warnings.push(...checkDims(key, m, products).map((w) => `${key}: ${w}`));
    if (m.stub) warnings.push(`${key}: placeholder manifest (stub)`);
  }

  fs.writeFileSync(SIZES_FILE, `${JSON.stringify(sizes, null, 2)}\n`);
  console.log(report.join("\n"));
  for (const w of warnings) console.warn(`[illustrations] ${w}`);
  console.log(`[illustrations] ${report.length} files → ${path.relative(process.cwd(), OUT_DIR)}, sizes → ${path.relative(process.cwd(), SIZES_FILE)}`);
  if (overBudget) {
    console.error(`[illustrations] ${overBudget} file(s) over budget (${BUDGET.nodes} nodes / ${BUDGET.bytes / 1024} KB)`);
    process.exitCode = 1;
  }
}

main();
