import { PegDoll } from "@/components/illustrations/PegDoll";
import { DOOR_MARKS, RoomBackdrop } from "@/components/illustrations/RoomKit";
import { ScenePiece } from "@/components/shop/RoomScene";
import { placePerson } from "@/components/shop/room-slots";
import { Kashida } from "@/components/ui/Kashida";
import type { AgeRoom } from "@/db/queries/rooms";
import styles from "./DoorScene.module.css";

/*
 * The height-mark door (DESIGN.md §1.3 (2), §5.3): one room stage holding all five age rooms.
 * The doorframe carries the five pencil ticks (RoomKit) and their Mikhak labels; the peg-doll
 * child stands against the frame and grows to the chosen mark through `--child-cm`
 * (a compositor `scale` from the feet). Every room's pieces are server-rendered with
 * `data-room={stage}`; HeightDoor's CSS shows only the checked stage's pieces, its label and its
 * kashida pull. The scene is a picture (aria-hidden); the panel beside it is the content.
 */

type DoorSceneProps = {
  rooms: AgeRoom[];
  /** The child's drawn height before any stage applies `--child-cm` (the default stage's median). */
  childCm: number;
};

export function DoorScene({ rooms, childCm }: DoorSceneProps) {
  return (
    <div aria-hidden="true" className={styles.stage}>
      <RoomBackdrop showKitchen doorMarks className={styles.backdrop} />
      {DOOR_MARKS.map((mark) => (
        // The label ends where the pencil tick starts, its baseline on the tick (physical: the door is on the right).
        <span
          key={mark.key}
          data-mark={mark.key}
          className={styles.mark}
          style={{ top: mark.top, right: `calc(100% - ${mark.tickLeft})` }}
        >
          <Kashida trigger="none">{mark.label}</Kashida>
        </span>
      ))}
      {rooms.map((stage) =>
        stage.room?.pieces.map((piece) => (
          <ScenePiece key={`${stage.key}-${piece.productId}`} piece={piece} roomKey={stage.key} />
        )),
      )}
      {/* A full-stage layer so the doll's percentage size resolves against the stage; the doll is its only child. */}
      <span data-door-child="" className={styles.childLayer}>
        <PegDoll heightCm={childCm} className="absolute" style={placePerson("by-door", childCm)} />
      </span>
    </div>
  );
}
