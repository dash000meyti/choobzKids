import Link from "next/link";
import type { CategorySummary } from "@/db/queries/catalog";
import { cn } from "@/lib/utils";
import { Render } from "./Render";

/* The Apple Store category row: small renders with names, scrolling sideways on phones. */
/** The studio render that stands for each category (also used by its share card). */
export const CATEGORY_RENDER: Record<string, string> = {
  climbing: "pikler-triangle",
  "learning-towers": "learning-tower",
  furniture: "kids-table-chair",
  art: "wall-art-roll",
  toys: "rainbow-stacker",
  "room-sets": "room-set",
};

export function CategoryStrip({ categories, current }: { categories: CategorySummary[]; current?: string }) {
  return (
    <nav aria-label="دسته‌بندی‌ها" className="no-scrollbar -mx-gutter overflow-x-auto px-gutter">
      <ul className="flex min-w-max gap-2 md:justify-center">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/shop/${c.slug}`}
              aria-current={current === c.slug ? "page" : undefined}
              className={cn(
                "flex w-28 flex-col items-center gap-2 rounded-[1.25rem] px-2 pb-3 pt-2 text-center text-xs font-semibold transition-colors hover:bg-surface",
                current === c.slug && "bg-surface",
              )}
            >
              <span className="w-20">
                <Render productKey={CATEGORY_RENDER[c.slug] ?? c.illustration ?? c.slug} alt="" sizes="80px" box="1 / 1" />
              </span>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
