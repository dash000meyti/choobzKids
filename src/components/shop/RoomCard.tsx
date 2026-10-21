import Link from "next/link";
import type { RoomCardData } from "@/db/queries/cards";
import { getSettings } from "@/db/queries/settings";
import { Render } from "@/components/studio/Render";
import { installmentPlan } from "@/components/ui/installments";
import { formatToman, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * A ready-made room (Studio style): the pieces standing side by side as studio renders, then the
 * room's name, what it is for, the piece count and the total with installments. The whole tile
 * links to /rooms/{slug}.
 */

type RoomCardProps = {
  room: RoomCardData;
  className?: string;
};

export async function RoomCard({ room, className }: RoomCardProps) {
  const settings = await getSettings();
  const pieces = room.pieces.filter((p) => p.defaultOn);
  const plan = installmentPlan(room.totalToman, settings.snapppay);
  return (
    <article className={cn("group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-surface", className)}>
      <div aria-hidden="true" className="flex items-end justify-center gap-1 px-6 pt-8 transition-transform duration-500 group-hover:scale-[1.02]">
        {pieces.slice(0, 5).map((piece) => (
          <div key={piece.productId} className="min-w-0 flex-1">
            <Render productKey={piece.illustration ?? piece.slug} alt="" sizes="(min-width: 1024px) 140px, 20vw" box="3 / 4" />
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-6 pt-4">
        <h3 className="text-xl font-extrabold">
          <Link href={`/rooms/${room.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {room.name}
          </Link>
        </h3>
        {room.tagline ? <p className="text-sm text-muted">{room.tagline}</p> : null}
        <p className="mt-auto pt-3 text-sm">
          {toFaDigits(room.pieceCount)} وسیله · <data value={room.totalToman}>{formatToman(room.totalToman)}</data>
        </p>
        {plan ? (
          <p className="text-xs text-muted">
            یا {toFaDigits(plan.count)} قسط {formatToman(plan.amount, false)} تومانی
          </p>
        ) : null}
        <span className="link-arrow mt-3 text-sm">این چیدمان را ببینید</span>
      </div>
    </article>
  );
}
