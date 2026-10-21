import type { CategorySummary } from "@/db/queries/catalog";
import { CategoryCubby } from "@/components/shop/CategoryCubby";
import { cn } from "@/lib/utils";

/*
 * Category rail (DESIGN.md §6.1): the mini cubbies as real links to `/shop/{category}` —
 * categories are indexable pages, never a filter parameter (SEO.md §1.9). A swipeable row on
 * phones, one shelf of six from `lg`. On a category page the rail leaves out the page's own
 * category («قفسه‌های دیگر»), so each cubby can keep its morph into the category page's
 * shop-window drawing without two elements sharing one `category-{slug}` name.
 */

type CategoryRailProps = {
  categories: CategorySummary[];
  /** The category page this rail sits on, if any. */
  current?: string;
  className?: string;
};

export function CategoryRail({ categories, current, className }: CategoryRailProps) {
  const shown = categories.filter((c) => c.productCount > 0 && c.slug !== current);
  if (!shown.length) return null;
  const label = current ? "قفسه‌های دیگر" : "دسته‌بندی‌های فروشگاه";
  return (
    <nav aria-label={label} className={className}>
      {current ? <p className="mb-3 text-sm font-bold text-muted">{label}</p> : null}
      <ul
        className={cn(
          "no-scrollbar -mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto px-gutter pt-1 pb-3",
          "lg:mx-0 lg:flex-wrap lg:snap-none lg:overflow-visible lg:px-0",
        )}
      >
        {shown.map((category) => (
          <li key={category.slug} className="w-[6.5rem] shrink-0 snap-start sm:w-28 lg:w-36">
            <CategoryCubby category={category} compact morph />
          </li>
        ))}
      </ul>
    </nav>
  );
}
