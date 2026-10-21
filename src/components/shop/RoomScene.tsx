import type { ReactNode } from "react";
import { PegDoll } from "@/components/illustrations/PegDoll";
import { RoomBackdrop } from "@/components/illustrations/RoomKit";
import { illustrationFrame, illustrationSize } from "@/components/illustrations/sizes";
import { isRoomSlot, placeOnStage, placePerson, wallLineTop } from "@/components/shop/room-slots";
import type { RoomCardData, RoomPiece } from "@/db/queries/cards";
import { toFaDigits } from "@/lib/format";
import { cn, illustrationUrl } from "@/lib/utils";
import styles from "./RoomScene.module.css";

/*
 * One ready-made room at true scale (DESIGN.md §3.8, §6.4): the RoomKit backdrop with each piece's
 * manifest drawing standing in its named slot, a peg-doll child for scale and, on /rooms/{preset},
 * the dashed 70 cm «خط دید کودک» that teaches the Montessori eye line.
 *
 * The scene is a picture (aria-hidden): the piece list in RoomBuilder is the accessible content.
 * Pieces carry `data-scene-piece` + `data-room` so RoomTotals can fade the ones the visitor takes
 * out of the room, and so the home door's AgeRoomVT can name them for the room morph.
 */

/** The Montessori eye line drawn on /rooms/{preset}, in cm above the floor. */
export const EYE_LINE_CM = 70;

type ScenePieceProps = {
  piece: RoomPiece;
  /** The room this piece belongs to (age stage key on the home door, preset slug elsewhere). */
  roomKey: string;
};

/**
 * A product drawing placed in its slot, exactly as RoomCard places it: the drawing's frame ÷ 10
 * in cm, its real depth, and its foot line above the contact shadow. Optional pieces start faded.
 */
export function ScenePiece({ piece, roomKey }: ScenePieceProps) {
  if (!piece.illustration || !isRoomSlot(piece.slot)) return null;
  const { width, height } = illustrationSize(piece.illustration, "assembled");
  const frame = illustrationFrame(piece.illustration, "assembled");
  const placement = placeOnStage(piece.slot, frame.width / 10, frame.height / 10, {
    depthCm: piece.depthCm ?? undefined,
    footCm: (frame.height - frame.originY) / 10,
  });
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3)
    <img
      src={illustrationUrl(piece.illustration, "assembled")}
      width={width}
      height={height}
      alt=""
      loading="lazy"
      decoding="async"
      data-scene-piece={piece.productId}
      data-room={roomKey}
      data-off={piece.defaultOn ? undefined : ""}
      className={styles.piece}
      style={placement}
    />
  );
}

type RoomSceneProps = {
  room: RoomCardData;
  /** Matches the RoomBuilder's `roomKey`, so its toggles reach these pieces. */
  roomKey: string;
  /** A peg-doll child of this height (cm) stands by the door; null for none. */
  childCm?: number | null;
  /** Draw the dashed 70 cm eye line with its label. */
  eyeLine?: boolean;
  /** Extra overlays inside the stage box (e.g. the 9 m² plan inset). */
  children?: ReactNode;
  className?: string;
};

export function RoomScene({ room, roomKey, childCm, eyeLine = false, children, className }: RoomSceneProps) {
  const kitchen = room.variant === "default" && room.pieces.some((piece) => piece.slot === "kitchen");
  return (
    <div aria-hidden="true" className={cn(styles.stage, className)}>
      <RoomBackdrop variant={room.variant} showKitchen={kitchen} className={styles.backdrop} />
      {eyeLine ? (
        <span className={styles.eyeLine} style={{ top: wallLineTop(EYE_LINE_CM) }}>
          <span className={styles.eyeLabel}>خط دید کودک · {toFaDigits(EYE_LINE_CM)} سانت</span>
        </span>
      ) : null}
      {room.pieces.map((piece) => (
        <ScenePiece key={piece.productId} piece={piece} roomKey={roomKey} />
      ))}
      {childCm ? (
        <PegDoll heightCm={childCm} className={styles.person} style={placePerson("by-door", childCm)} />
      ) : null}
      {children}
    </div>
  );
}
