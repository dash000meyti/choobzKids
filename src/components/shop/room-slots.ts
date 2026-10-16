import type { CSSProperties } from "react";
import { pegDollWidthCm, type PegDollVariant } from "@/components/illustrations/PegDoll";
import { OBLIQUE, ROOM_FLOOR_Y, ROOM_VIEWBOX } from "@/components/illustrations/RoomKit";

/*
 * Named places in the room scene (DESIGN.md §3.8) where a product drawing or a peg doll
 * stands. A stage is a positioned box with the backdrop's 4:3 shape, holding <RoomBackdrop>
 * at full size; pieces are absolutely positioned <img>s inside it at true relative scale
 * (1 drawing unit = 1 mm = 1 scene unit).
 *
 * Every slot pins one edge of the drawing — wall-start its right edge (clear of the child and
 * the door), wall-end and floor-end their left edge (inside the frame), the kitchen its right
 * edge (inside the doorway), the rest their centre — so pieces of any width stay in place. It
 * also sets how far the piece's back stands from the wall: in the cabinet oblique a piece d mm
 * in front of the wall stands 0.25·d lower on the page, which is why depth matters for `bottom`.
 *
 * Paint order follows depth: wall pieces, then the child by the door and the learning tower
 * at the kitchen counter, then floor pieces from the wall toward the viewer. `layer` is
 * returned as `zIndex`, so spreading the placement into `style` layers pieces correctly.
 *
 * At true scale a 3.2 m view is full: deep rooms overlap a little (a Pikler triangle stands in
 * front of the low shelf), the way they do in a photograph. The pieces of one preset never
 * collide in space, only in the picture.
 */

export type RoomSlot =
  | "wall-start"
  | "wall-mid"
  | "wall-end"
  | "floor-start"
  | "floor-mid"
  | "floor-end"
  | "by-door"
  | "kitchen";

type SlotSpec = {
  /** Scene x (mm) of the pinned edge. */
  x: number;
  /** Which edge of the drawing sits on `x` (physical: the scene is not mirrored in RTL). */
  align: "left" | "center" | "right";
  /** Gap between the room's back wall and the piece's back, mm (negative = beyond the doorway). */
  back: number;
  /** Depth assumed when the caller does not pass one, mm. */
  depth: number;
  layer: number;
};

export const ROOM_SLOTS: Record<RoomSlot, SlotSpec> = {
  // Against the back wall, right to left. The ladder hangs in front of the hex panels it shares a wall with.
  "wall-start": { x: 2100, align: "right", back: 0, depth: 120, layer: 1 },
  "wall-mid": { x: 1120, align: "center", back: 0, depth: 150, layer: 2 },
  "wall-end": { x: 10, align: "left", back: 0, depth: 120, layer: 1 },
  // The child stands with its back to the wall beside the casing, under the pencil marks.
  "by-door": { x: 2290, align: "center", back: 0, depth: 0, layer: 3 },
  // Through the doorway, back against the counter 320 mm beyond the wall plane (default variant only).
  kitchen: { x: 3190, align: "right", back: -320, depth: 450, layer: 3 },
  // On the floor, from the wall toward the viewer.
  "floor-mid": { x: 1050, align: "center", back: 40, depth: 300, layer: 4 },
  "floor-end": { x: 40, align: "left", back: 330, depth: 850, layer: 5 },
  "floor-start": { x: 2000, align: "center", back: 640, depth: 200, layer: 6 },
};

export function isRoomSlot(value: string): value is RoomSlot {
  return Object.hasOwn(ROOM_SLOTS, value);
}

export type StagePlacement = Pick<CSSProperties, "aspectRatio" | "zIndex"> & {
  left: string;
  bottom: string;
  width: string;
};

const W = ROOM_VIEWBOX.w;
const H = ROOM_VIEWBOX.h;
const pct = (value: number, of: number) => `${Math.round((value / of) * 10000) / 100}%`;

/** Scene y of the floor line for a piece whose front is `frontMm` in front of the back wall. */
const floorLineY = (frontMm: number) => ROOM_FLOOR_Y + OBLIQUE.y * frontMm;

export type PlaceOptions = {
  /** The product's real depth (`dimensions.depthCm`); defaults to a typical piece for the slot. */
  depthCm?: number;
  /** Height of the drawing's foot line above its bottom edge, when a contact shadow is drawn below it. */
  footCm?: number;
};

/**
 * Position for a product drawing in a slot, as percentages of the stage box.
 *
 * `widthCm` × `heightCm` is the size of the **drawing** — its viewBox in mm ÷ 10, i.e.
 * `illustrationSize(key, 'assembled')` ÷ 10 — not of the product: an oblique drawing is wider
 * and taller than the piece by its receding depth. `depthCm` moves the piece's front edge, and so
 * its foot line, toward the viewer.
 *
 * `aspectRatio` is `auto w / h`: an <img> keeps its own ratio, a wrapper <span> gets the drawing's.
 */
export function placeOnStage(slot: RoomSlot, widthCm: number, heightCm: number, options: PlaceOptions = {}): StagePlacement {
  const spec = ROOM_SLOTS[slot];
  const width = widthCm * 10;
  const depth = options.depthCm != null ? options.depthCm * 10 : spec.depth;
  const left = spec.align === "left" ? spec.x : spec.align === "center" ? spec.x - width / 2 : spec.x - width;
  const bottom = floorLineY(spec.back + depth) + (options.footCm ?? 0) * 10;
  return {
    left: pct(left, W),
    bottom: pct(H - bottom, H),
    width: pct(width, W),
    aspectRatio: `auto ${widthCm} / ${heightCm}`,
    zIndex: spec.layer,
  };
}

/**
 * Position for a <PegDoll> in a slot: centred on the slot, feet on its floor line, sized by
 * `--peg-unit` so the doll is exactly `heightCm` tall on the stage (the stage is 240 cm high).
 * The doll must be absolutely positioned in the stage box for the percentage to resolve.
 */
export function placePerson(slot: RoomSlot, heightCm: number, variant: PegDollVariant = "child"): CSSProperties {
  const spec = ROOM_SLOTS[slot];
  const width = pegDollWidthCm(variant, heightCm) * 10;
  return {
    left: pct(spec.x - width / 2, W),
    bottom: pct(H - floorLineY(spec.back), H),
    zIndex: spec.layer,
    "--peg-unit": `calc(100% / ${H / 10})`,
  } as CSSProperties;
}

/** `top` (%) of a horizontal line `heightCm` above the floor on the back wall — eye lines, door labels. */
export function wallLineTop(heightCm: number): string {
  return pct(ROOM_FLOOR_Y - heightCm * 10, H);
}
