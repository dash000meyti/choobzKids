import type { ProductCardData } from "@/db/queries/catalog";
import type { ProductRoomData } from "@/db/queries/product";
import { ProductCard } from "@/components/shop/ProductCard";
import { RoomCard } from "@/components/shop/RoomCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

/*
 * «اتاقش رو کامل کن» (DESIGN.md §6.3 block 20): the ready-made rooms this product stands in (each
 * with its live total and installments) and the pieces the workshop pairs with it
 * (`product_relations.kind = 'bundle'`). Rooms are capped at two so the block stays a nudge.
 */

type CompleteTheRoomProps = {
  productName: string;
  rooms: ProductRoomData[];
  bundle: ProductCardData[];
  className?: string;
};

const ROOM_LIMIT = 2;

export function CompleteTheRoom({ productName, rooms, bundle, className }: CompleteTheRoomProps) {
  if (!rooms.length && !bundle.length) return null;
  return (
    <section aria-labelledby="room-title" className={cn("flex flex-col gap-6", className)}>
      <SectionHeader
        id="room-title"
        size="content"
        title="اتاقش رو کامل کن"
        sub={rooms.length ? `چیدمان‌های آماده‌ای که ${productName} هم در آن‌هاست؛ با جمع کل و امکان خرید قسطی.` : undefined}
        link={rooms.length ? { label: "همهٔ چیدمان‌ها ←", href: "/rooms" } : undefined}
      />
      {rooms.length ? (
        <ul className="grid gap-5 lg:grid-cols-2">
          {rooms.slice(0, ROOM_LIMIT).map((room) => (
            <li key={room.id}>
              <RoomCard room={room} />
            </li>
          ))}
        </ul>
      ) : null}
      {bundle.length ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {bundle.map((card) => (
            <li key={card.id}>
              <ProductCard product={card} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
