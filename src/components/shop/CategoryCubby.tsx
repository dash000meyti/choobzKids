import Link from "@/components/ui/Link";
import { ViewTransition } from "react";
import { illustrationSize } from "@/components/illustrations/sizes";
import type { CategorySummary } from "@/db/queries/catalog";
import { Icon } from "@/components/ui/Icon";
import { toFaDigits } from "@/lib/format";
import { cn, illustrationUrl } from "@/lib/utils";
import styles from "./CategoryCubby.module.css";

/*
 * CategoryCubby (DESIGN.md §4.11, §5.2): one compartment of the low Montessori toy shelf.
 * A recessed kahgel cubby holds the category's drawing on a ply-band shelf lip; below it a
 * raised label plate (the tappable cue) carries the plain name and «۶ مدل». The whole cubby is
 * one link to /shop/{slug}; the drawing morphs into the category page's shop-window drawing.
 * `compact` is the mini cubby of the category rail and search shortcuts (no drop-in motion).
 * Compact cubbies don't carry the morph name by default: on /shop/{category} the rail's own
 * cubby would otherwise share `category-{slug}` with the shop-window drawing, and duplicate
 * view-transition names abort the page turn.
 */

type CategoryCubbyProps = {
  category: CategorySummary;
  compact?: boolean;
  /** Shared-element morph into the category page's drawing. Defaults to `!compact`. */
  morph?: boolean;
  className?: string;
};

function countLabel(productCount: number): string {
  return productCount > 0 ? `${toFaDigits(productCount)} مدل` : "به‌زودی";
}

export function CategoryCubby({ category, compact, morph = !compact, className }: CategoryCubbyProps) {
  const count = countLabel(category.productCount);
  const toy = (
    <span className={cn("absolute inset-x-[14%] top-[16%] bottom-[calc(5px+3%)] flex items-end justify-center", styles.toy)}>
      {category.illustration ? (
        <CubbyDrawing illustration={category.illustration} />
      ) : (
        <Icon name="shelf" className="size-1/2 self-center text-muted" />
      )}
    </span>
  );
  return (
    <Link
      href={`/shop/${category.slug}`}
      prefetch
      transitionTypes={["nav-forward"]}
      className={cn("flex flex-col rounded-bit-lg", styles.cubby, !compact && styles.drops, className)}
    >
      <span
        className={cn(
          "relative block overflow-hidden rounded-bit-lg bg-surface inset-shadow-tray",
          compact ? "aspect-square" : "aspect-[5/6]",
        )}
      >
        <span aria-hidden="true" className="contact-shadow absolute inset-x-[18%] bottom-[5px] h-[9%] rounded-[50%]" />
        {morph ? (
          <ViewTransition name={`category-${category.slug}`} share="morph" default="none">
            {toy}
          </ViewTransition>
        ) : (
          toy
        )}
        {/* The shelf lip the drawing stands on. */}
        <span aria-hidden="true" className="ply-band absolute inset-x-0 bottom-0 h-[5px]" />
      </span>

      <span
        className={cn(
          "mt-2 flex flex-col items-center rounded-bit-sm px-2 text-center",
          compact ? "py-1" : "py-1.5",
          styles.plate,
        )}
      >
        <span className={cn("font-bold text-ink", compact ? "text-xs" : "text-sm")}>{category.name}</span>
        <span className="text-xs text-muted">{count}</span>
      </span>
    </Link>
  );
}

function CubbyDrawing({ illustration }: { illustration: string }) {
  const { width, height } = illustrationSize(illustration, "assembled");
  return (
    // The plate below names the category, so the drawing is decorative here.
    // eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3)
    <img
      src={illustrationUrl(illustration, "assembled")}
      width={width}
      height={height}
      alt=""
      loading="lazy"
      decoding="async"
      className="size-full object-contain object-bottom"
    />
  );
}
