import Link from "@/components/ui/Link";
import type { ReactNode } from "react";
import { illustrationSize } from "@/components/illustrations/sizes";
import { RoomTotals, type RoomTotalsPiece } from "@/components/shop/RoomTotals";
import type { RoomCardData } from "@/db/queries/cards";
import { InstallmentWheels } from "@/components/ui/InstallmentWheels";
import type { SnappPaySettings } from "@/components/ui/installments";
import { Price } from "@/components/ui/Price";
import { StockBadge } from "@/components/ui/StockBadge";
import { Toggle } from "@/components/ui/Toggle";
import { cn, illustrationUrl } from "@/lib/utils";
import styles from "./RoomBuilder.module.css";

/*
 * «اتاقش رو بچین» — the editable room panel (DESIGN.md §5.3, §6.4), shared by the home height door
 * and /rooms/{preset}. Server markup carries everything that matters: the room's name, every piece
 * with its price, the total and the installments. A toggle per piece («توی اتاق») takes it out of
 * the room; RoomTotals (client) enables the toggles and recomputes the total, the wheels and the
 * add-all button. The summary is sticky inside this panel only (never pinned, no scroll trap).
 */

type RoomBuilderProps = {
  room: RoomCardData;
  /** Joins the toggles to the scene pieces (`data-room`): the age stage key or the preset slug. */
  roomKey: string;
  snapppay: SnappPaySettings;
  /** Panel heading: the preset name as an H3 on the home door, a section H2 on the preset page. */
  heading?: { as: "h2" | "h3"; text?: string; id?: string };
  /** Links and help under «همه را به سبد اضافه کن». */
  children?: ReactNode;
  className?: string;
};

export function RoomBuilder({ room, roomKey, snapppay, heading = { as: "h3" }, children, className }: RoomBuilderProps) {
  const Heading = heading.as;
  const pieces: RoomTotalsPiece[] = room.pieces.map((piece) => ({
    productId: piece.productId,
    variantId: piece.variantId,
    slug: piece.slug,
    name: piece.name,
    variantName: piece.variantName,
    priceToman: piece.priceToman,
    illustration: piece.illustration,
    imagePath: piece.imagePath,
    defaultOn: piece.defaultOn,
  }));

  return (
    <div data-room-builder="" data-room={roomKey} data-cart-source="" className={cn(styles.builder, className)}>
      <div className="flex flex-col gap-1">
        <Heading id={heading.id} className="text-lg font-bold text-ink">
          {heading.text ?? room.name}
        </Heading>
        <p className="text-sm text-muted">تکه‌ها رو بردار یا نگه دار؛ جمع و قسط‌ها همین‌جا حساب می‌شه.</p>
      </div>

      <ul className={cn("tray", styles.pieces)}>
        {room.pieces.map((piece) => (
          <li key={piece.productId} className={styles.piece}>
            <PieceThumb illustration={piece.illustration} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Link href={`/product/${piece.slug}`} className="link-mark self-start text-sm font-bold text-ink">
                {piece.name}
              </Link>
              {piece.variantName ? <span className="text-xs text-muted">{piece.variantName}</span> : null}
              <span className="flex flex-wrap items-center gap-x-3">
                <Price price={piece.priceToman} size="sm" />
                {piece.availability !== "in_stock" ? (
                  <StockBadge availability={piece.availability} className="text-xs" />
                ) : null}
              </span>
            </div>
            <Toggle
              label={
                <span className="text-xs text-muted">
                  <span className="sr-only">{piece.name}: </span>توی اتاق
                </span>
              }
              defaultChecked={piece.defaultOn}
              disabled
              data-room-toggle={piece.productId}
              className="shrink-0"
            />
          </li>
        ))}
      </ul>

      <RoomTotals
        roomKey={roomKey}
        pieces={pieces}
        snapppay={snapppay}
        wheels={<InstallmentWheels total={room.totalToman} snapppay={snapppay} caption={null} finePrint={false} wheelSize={28} />}
      >
        {children}
      </RoomTotals>
    </div>
  );
}

function PieceThumb({ illustration }: { illustration: string | null }) {
  if (!illustration) return <span aria-hidden="true" className={styles.thumb} />;
  const { width, height } = illustrationSize(illustration, "assembled");
  return (
    <span aria-hidden="true" className={styles.thumb}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
      <img
        src={illustrationUrl(illustration, "assembled")}
        width={width}
        height={height}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-full object-contain"
      />
    </span>
  );
}
