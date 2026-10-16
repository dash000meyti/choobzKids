import type { CSSProperties } from "react";
import { ROOM_DOOR, ROOM_FLOOR_Y, ROOM_VIEWBOX } from "@/components/illustrations/RoomKit";
import { illustrationFrame, illustrationSize } from "@/components/illustrations/sizes";
import { isRoomSlot, placeOnStage } from "@/components/shop/room-slots";
import type { RoomCardData, RoomPiece } from "@/db/queries/cards";
import { getSettings } from "@/db/queries/settings";
import { InstallmentLine } from "@/components/ui/InstallmentLine";
import { IntentLink } from "@/components/ui/IntentLink";
import { formatToman, toFaDigits } from "@/lib/format";
import { cn, illustrationUrl } from "@/lib/utils";
import styles from "./RoomCard.module.css";

/*
 * RoomCard (DESIGN.md §4.11, §6.4): a wide card for one ready-made room — a mini room scene,
 * the preset name, «۵ تکه · ۳۵ میلیون تومان», the installment line and «این چیدمان را ببین ←».
 * The whole card links to /rooms/{slug}.
 *
 * The mini scene is drawn in CSS (wall, skirting, floor, doorway) on the same 3200 × 2400 mm
 * geometry as RoomKit, with the pieces as plain <img>s placed at true scale by room-slots.
 * The full inline RoomBackdrop stays on the room builder only: inlined once per card it would
 * cost ~4 KB twice (HTML + RSC) for every room in a list (DESIGN.md §10.3).
 */

type RoomCardProps = {
  room: RoomCardData;
  className?: string;
};

/** «۳۵ میلیون تومان» when the total is a round tenth of a million, else the exact figure. */
function formatRoomTotal(toman: number): string {
  if (toman < 1_000_000 || toman % 100_000 !== 0) return formatToman(toman);
  const millions = toman / 1_000_000;
  const text = Number.isInteger(millions) ? String(millions) : millions.toFixed(1).replace(".", "٫");
  return `${toFaDigits(text)} میلیون تومان`;
}

export async function RoomCard({ room, className }: RoomCardProps) {
  const { snapppay } = await getSettings();
  const inRoom = room.pieces.filter((piece) => piece.defaultOn);
  return (
    <article className={cn("@container relative h-full overflow-hidden rounded-bit", styles.card, className)}>
      <div className="grid h-full @lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <MiniRoom variant={room.variant} pieces={inRoom} />
        <div className="flex flex-col gap-1.5 p-4 @lg:p-5">
          <h3 className="text-lg font-bold text-ink">
            <IntentLink href={`/rooms/${room.slug}`} transitionTypes={["nav-forward"]} className={styles.link}>
              {room.name}
            </IntentLink>
          </h3>
          {room.tagline ? <p className="text-sm text-muted">{room.tagline}</p> : null}
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 font-bold text-ink">
            <span>{toFaDigits(room.pieceCount)} تکه</span>
            {/* Muted and spaced: a bare «·» beside Persian digits reads as a zero («۳۵۰»). */}
            <span aria-hidden="true" className="font-normal text-line-strong">
              ·
            </span>
            <data value={room.totalToman}>{formatRoomTotal(room.totalToman)}</data>
          </p>
          {inRoom.length ? (
            <p className="sr-only">شامل {inRoom.map((piece) => piece.name).join("، ")}</p>
          ) : null}
          <InstallmentLine price={room.totalToman} snapppay={snapppay} link={false} />
          {/* The visible cue; the title link already carries the card's name. */}
          <span aria-hidden="true" className="link-mark mt-auto self-start pt-2 text-sm font-semibold text-ink">
            این چیدمان را ببین ←
          </span>
        </div>
      </div>
    </article>
  );
}

const pct = (value: number, of: number) => `${Math.round((value / of) * 10000) / 100}%`;

/* Casing width around the door opening, mm (RoomKit draws a 70 mm birch casing). */
const CASING_MM = ROOM_DOOR.openingLeft - ROOM_DOOR.casingLeft;
const SKIRTING_MM = 68;

/* RoomKit geometry as CSS variables, so the CSS room and the placed drawings share one floor. */
const SCENE_VARS = {
  "--floor-top": pct(ROOM_FLOOR_Y, ROOM_VIEWBOX.h),
  "--skirting-top": pct(ROOM_FLOOR_Y - SKIRTING_MM, ROOM_VIEWBOX.h),
  "--casing-top": pct(ROOM_DOOR.headY - CASING_MM, ROOM_VIEWBOX.h),
  "--casing-left": pct(ROOM_DOOR.casingLeft, ROOM_VIEWBOX.w),
  "--opening-top": pct(ROOM_DOOR.headY, ROOM_VIEWBOX.h),
  "--opening-left": pct(ROOM_DOOR.openingLeft, ROOM_VIEWBOX.w),
  "--opening-right": pct(ROOM_VIEWBOX.w - ROOM_DOOR.openingRight, ROOM_VIEWBOX.w),
} as CSSProperties;

function MiniRoom({ variant, pieces }: { variant: RoomCardData["variant"]; pieces: RoomPiece[] }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative aspect-[4/3] overflow-hidden", styles.scene)}
      style={SCENE_VARS}
    >
      {variant === "small" ? (
        <span className={styles.corner} />
      ) : (
        <>
          <span className={styles.casing} />
          <span className={styles.opening} />
        </>
      )}
      <span className={styles.skirting} />
      <span className={styles.floor} />
      {pieces.map((piece) => (
        <PlacedPiece key={piece.productId} piece={piece} />
      ))}
    </div>
  );
}

function PlacedPiece({ piece }: { piece: RoomPiece }) {
  if (!piece.illustration || !isRoomSlot(piece.slot)) return null;
  const { width, height } = illustrationSize(piece.illustration, "assembled");
  // Drawing frames are in projected mm; room-slots works in cm. The front floor corner sits
  // `height - originY` above the drawing's bottom edge (the contact shadow lies below it).
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
      className="absolute h-auto max-w-none"
      style={placement}
    />
  );
}
