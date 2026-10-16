/*
 * Every product drawing key (`products.illustration`, `categories.illustration`)
 * maps to one manifest here. CI rule (DESIGN.md §3.7): a key without a manifest
 * and its built files is a broken drawing.
 */

import balanceBoard from "./balance-board";
import climbingHex from "./climbing-hex";
import duckPullToy from "./duck-pull-toy";
import frontFacingBookshelf from "./front-facing-bookshelf";
import kidsTableChair from "./kids-table-chair";
import learningTower from "./learning-tower";
import montessoriShelf from "./montessori-shelf";
import piklerArch from "./pikler-arch";
import piklerTriangle from "./pikler-triangle";
import rainbowStacker from "./rainbow-stacker";
import roomSet from "./room-set";
import swedishLadder from "./swedish-ladder";
import type { Manifest } from "./types";
import wallArtRoll from "./wall-art-roll";
import woodenBlocks from "./wooden-blocks";

export const manifests = {
  "learning-tower": learningTower,
  "pikler-triangle": piklerTriangle,
  "pikler-arch": piklerArch,
  "swedish-ladder": swedishLadder,
  "climbing-hex": climbingHex,
  "balance-board": balanceBoard,
  "front-facing-bookshelf": frontFacingBookshelf,
  "wall-art-roll": wallArtRoll,
  "kids-table-chair": kidsTableChair,
  "montessori-shelf": montessoriShelf,
  "rainbow-stacker": rainbowStacker,
  "duck-pull-toy": duckPullToy,
  "wooden-blocks": woodenBlocks,
  "room-set": roomSet,
} satisfies Record<string, Manifest>;

export type ManifestKey = keyof typeof manifests;

export const MANIFEST_KEYS = Object.keys(manifests) as ManifestKey[];

export function isManifestKey(key: string): key is ManifestKey {
  return Object.hasOwn(manifests, key);
}

/** The manifest for a drawing key, or null for unknown keys (so a bad DB value hides the drawing instead of crashing). */
export function getManifest(key: string | null | undefined): Manifest | null {
  return key && isManifestKey(key) ? manifests[key] : null;
}

export type { Manifest } from "./types";
