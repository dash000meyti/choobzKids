/*
 * Intrinsic sizes and ortho label positions of the built drawings
 * (sizes.generated.json, written by scripts/illustrations/build.ts).
 *
 * Drawing units are projected millimetres, so a size doubles as the true-scale
 * extent: the assembled tower is ~680 × 1060 mm on paper, oblique depth
 * included. Use it for <img width height> and for placing drawings at scale.
 */

import { toFaDigits } from "@/lib/format";
import data from "./sizes.generated.json";

export type IllustrationView = "assembled" | "exploded" | "ortho" | "flat";

export type IllustrationFrame = {
  /** viewBox size in projected mm. */
  width: number;
  height: number;
  /** Where the product's front-left floor corner (world 0, 0, 0) sits, from the drawing's top-left, in mm. */
  originX: number;
  originY: number;
};

export type OrthoLabel = {
  /** `products.dimensions` key: `widthCm`, `heightCm`, `depthCm` or `extra.<Persian key>`. */
  key: string;
  /** Ready-to-render value in Persian digits, in cm («۴۵», «۳۸»). */
  label: string;
  /** For `extra.*` dimensions: the Persian name of the measurement. */
  name?: string;
  valueCm: number;
  /** World axis measured: w = width (x), h = height (y), d = depth (z). */
  axis: "w" | "h" | "d";
  /** Label centre in % of the ortho drawing (x from the left edge, y from the top); centre the HTML label on it. */
  x: number;
  y: number;
};

export type OrthoFrame = {
  /** Floor line in % of the drawing height. */
  floorY: number;
  /** Horizontal extent of the front and side elevations in % of the width. */
  front: readonly [number, number];
  side: readonly [number, number];
};

type Entry = {
  source: "measured" | "dxf";
  stub: boolean;
  finishes: string[];
  views: Record<IllustrationView, IllustrationFrame>;
  poses: Record<string, Partial<Record<IllustrationView, IllustrationFrame>>>;
  ortho: { labels: { key: string; axis: "w" | "h" | "d"; valueCm: number; x: number; y: number }[]; frame: OrthoFrame | null } | null;
};

const SIZES = data as unknown as Record<string, Entry | undefined>;

/** Portrait 4:5 fallback for an unknown key, so a bad DB value never breaks layout. */
const FALLBACK: IllustrationFrame = { width: 400, height: 500, originX: 0, originY: 500 };

/** Exact frame of a built drawing (projected mm). */
export function illustrationFrame(key: string, view: IllustrationView = "assembled", pose?: string): IllustrationFrame {
  const entry = SIZES[key];
  return (pose ? entry?.poses[pose]?.[view] : undefined) ?? entry?.views[view] ?? FALLBACK;
}

/** Intrinsic size for `<img width height>` (rounded viewBox size). */
export function illustrationSize(key: string, view: IllustrationView = "assembled", pose?: string): { width: number; height: number } {
  const frame = illustrationFrame(key, view, pose);
  return { width: Math.round(frame.width), height: Math.round(frame.height) };
}

function cmLabel(value: number): string {
  return toFaDigits(String(value)).replace(".", "٫");
}

/** Dimension labels for the ortho drawing, positioned in % of its viewBox (labels are HTML, never SVG text). */
export function orthoLabels(key: string): OrthoLabel[] {
  return (SIZES[key]?.ortho?.labels ?? []).map((l) => ({
    ...l,
    label: cmLabel(l.valueCm),
    name: l.key.startsWith("extra.") ? l.key.slice("extra.".length) : undefined,
  }));
}

/** Where the floor and the two elevations sit in the ortho drawing (for the peg-doll scale view). */
export function orthoFrame(key: string): OrthoFrame | null {
  return SIZES[key]?.ortho?.frame ?? null;
}

/** «طرح دقیق از روی نقشهٔ برش» for `dxf`, «طرح از روی ابعاد واقعی» for `measured`; null for unknown keys. */
export function illustrationSource(key: string): "measured" | "dxf" | null {
  return SIZES[key]?.source ?? null;
}

/** Whether a static file exists for this finish (natural always does). */
export function hasFinish(key: string, finish: string | null | undefined): boolean {
  if (!finish || finish === "natural") return Boolean(SIZES[key]);
  return SIZES[key]?.finishes.includes(finish) ?? false;
}
