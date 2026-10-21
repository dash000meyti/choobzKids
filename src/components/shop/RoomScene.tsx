import type { ReactNode } from "react";
import { illustrationFrame, illustrationSize } from "@/components/illustrations/sizes";
import { isRoomSlot, placeOnStage } from "@/components/shop/room-slots";
import type { RoomCardData, RoomPiece } from "@/db/queries/cards";
import { cn, illustrationUrl } from "@/lib/utils";
import { Render } from "@/components/studio/Render";
import styles from "./RoomScene.module.css";

/*
 * A ready-made room. `RoomScene` is the Studio stage (the pieces as studio renders on one tile);
 * `ScenePiece` still places a single drawing at true scale for scenes built on the room kit.
 * The scene is a picture (aria-hidden): the piece list in RoomBuilder is the accessible content.
 * Pieces carry `data-scene-piece` + `data-room` so RoomTotals can fade the ones the visitor takes
 * out of the room.
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

export function RoomScene({ room, roomKey, children, className }: RoomSceneProps) {
  // Studio stage: the room's pieces as studio renders standing side by side on one light tile.
  // Toggles in RoomBuilder fade pieces out through `data-off` (RoomTotals).
  return (
    <div aria-hidden="true" className={cn("relative overflow-hidden rounded-[2rem] bg-surface px-6 pb-8 pt-10", className)}>
      <div className="flex items-end justify-center gap-2">
        {room.pieces.map((piece) => (
          <div
            key={piece.productId}
            data-scene-piece={piece.productId}
            data-room={roomKey}
            data-off={piece.defaultOn ? undefined : ""}
            className="min-w-0 flex-1 transition-opacity duration-300 data-[off]:opacity-20"
          >
            <Render productKey={piece.illustration ?? piece.slug} alt="" sizes="(min-width: 1024px) 180px, 22vw" box="3 / 4" />
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}
