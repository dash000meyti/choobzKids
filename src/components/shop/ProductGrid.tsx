import Link from "next/link";
import type { ProductCardData } from "@/db/queries/catalog";
import type { RoomCardData } from "@/db/queries/cards";
import type { ShopGuide } from "@/db/queries/shop";
import { EditorialInterlude, type InterludeItem } from "@/components/shop/EditorialInterlude";
import { ProductCard } from "@/components/shop/ProductCard";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * ProductGrid (DESIGN.md §6.1): the full server-rendered list, grouped by category on /shop
 * (an H2 per category with «همه ←» to its page) and a single group on a category page.
 * Two columns on phones (12px gap), three and four as the grid's own width allows — measured
 * with a container query, so the columns follow the space left beside FilterBar's sidebar.
 *
 * Every card sits in an `<li data-slot>`; FilterBar hides those cells and orders them, and
 * hides a `[data-group]` that has nothing left. Every 8th slot of the default view is an
 * EditorialInterlude two columns wide (`[data-interlude]`, hidden once the view changes):
 * the guide of the shelf it lands on, or a room that uses one of that shelf's pieces.
 */

export type GridGroup = {
  /** Category slug: the group's id and the target of «همه ←». */
  slug: string;
  /** Visible H2; leave out on a category page (the H1 already names it). */
  title?: string;
  /** Screen-reader H2 when there is no visible title. */
  srTitle?: string;
  products: ProductCardData[];
  /** This shelf's buying guide, for interludes. */
  guide?: ShopGuide | null;
};

type ProductGridProps = {
  groups: GridGroup[];
  /** Rooms the interludes may show. */
  rooms?: RoomCardData[];
  /** Interludes need at least this many products after them; none on short lists. */
  interludeEvery?: number;
  className?: string;
};

const PREFETCHED = 4;

type Cell = { kind: "product"; product: ProductCardData; index: number } | { kind: "interlude"; item: InterludeItem };

/**
 * Lays the groups out as cells and puts an interlude in every `every`-th slot, counting across
 * groups (no single shelf is that long). Interludes alternate guide → room, never repeat, and
 * never end the list.
 */
function layout(groups: GridGroup[], rooms: RoomCardData[], every: number): Cell[][] {
  const total = groups.reduce((sum, g) => sum + g.products.length, 0);
  const usedGuides = new Set<number>();
  const usedRooms = new Set<number>();
  let slot = 0;
  let index = 0;
  let interludes = 0;

  const pick = (group: GridGroup): InterludeItem | null => {
    const guide = group.guide && !usedGuides.has(group.guide.id) ? group.guide : null;
    const ids = new Set(group.products.map((p) => p.id));
    const free = rooms.filter((r) => !usedRooms.has(r.id));
    const room = free.find((r) => r.pieces.some((piece) => ids.has(piece.productId))) ?? free[0] ?? null;
    const preferGuide = interludes % 2 === 0;
    if (guide && (preferGuide || !room)) {
      usedGuides.add(guide.id);
      return { kind: "guide", guide };
    }
    if (room) {
      usedRooms.add(room.id);
      return { kind: "room", room };
    }
    return null;
  };

  return groups.map((group) => {
    const cells: Cell[] = [];
    for (const product of group.products) {
      cells.push({ kind: "product", product, index });
      index += 1;
      slot += 1;
      if ((slot + 1) % every === 0 && index < total) {
        const item = pick(group);
        if (item) {
          cells.push({ kind: "interlude", item });
          interludes += 1;
          slot += 1;
        }
      }
    }
    return cells;
  });
}

export function ProductGrid({ groups, rooms = [], interludeEvery = 8, className }: ProductGridProps) {
  const laidOut = layout(groups, rooms, interludeEvery);
  return (
    <div className={cn("@container flex flex-col gap-12 lg:gap-16", className)}>
      {groups.map((group, g) => {
        const headingId = `shelf-${group.slug}`;
        return (
          <section key={group.slug} data-group={group.slug} aria-labelledby={headingId}>
            {group.title ? (
              <header className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-2">
                <h2 id={headingId} className="font-display text-xl text-ink">
                  {group.title}
                  <span className="ms-2 align-middle font-body text-sm text-muted">
                    {toFaDigits(group.products.length)} مدل
                  </span>
                </h2>
                <Link
                  href={`/shop/${group.slug}`}
                  transitionTypes={["nav-forward"]}
                  className="link-mark mb-1 shrink-0 text-sm font-semibold text-ink"
                >
                  همه<span className="sr-only"> محصولات {group.title}</span>
                  <span aria-hidden="true"> ←</span>
                </Link>
              </header>
            ) : (
              <h2 id={headingId} className="sr-only">
                {group.srTitle ?? "محصولات"}
              </h2>
            )}
            <ul className="grid grid-flow-dense grid-cols-2 gap-3 @min-[36rem]:grid-cols-3 @min-[36rem]:gap-4 @min-[56rem]:grid-cols-4 @min-[56rem]:gap-5">
              {laidOut[g].map((cell) =>
                cell.kind === "product" ? (
                  <li key={cell.product.id} data-slot="" data-new={cell.product.isNew || undefined}>
                    <ProductCard
                      product={cell.product}
                      prefetch={cell.index < PREFETCHED}
                      // Drawings are not the LCP (the H1 is); a real first photo is.
                      priority={cell.index === 0 && cell.product.image !== null}
                    />
                  </li>
                ) : (
                  <li
                    key={cell.item.kind === "guide" ? `guide-${cell.item.guide.id}` : `room-${cell.item.room.id}`}
                    data-interlude=""
                    className="col-span-2"
                  >
                    <EditorialInterlude item={cell.item} />
                  </li>
                ),
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
