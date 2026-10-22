import Link from "@/components/ui/Link";
import type { BreadcrumbItem } from "@/lib/jsonld";
import { cn } from "@/lib/utils";
import styles from "./Breadcrumbs.module.css";

/*
 * Breadcrumbs — string and beads (DESIGN.md §4.5, SEO.md §1.7): above the H1 on every page but
 * home. Items sit on a thin string and are separated by small wooden beads; the current page is
 * muted, marked aria-current and cut at 22 characters. On phones the trail stays on one line and
 * scrolls inside itself with a fade at its end. Links go back a page (`nav-back` page turn).
 *
 * The page builds the trail once and gives the same items to `breadcrumbNode()` (src/lib/jsonld)
 * for its BreadcrumbList, so the visible names and the markup always match:
 *
 *   const trail = crumbTrail({ name: "فروشگاه", path: "/shop" }, { name: category.name, path: `/shop/${category.slug}` });
 *   <Breadcrumbs items={trail} />  …  graph(…, breadcrumbNode(trail))
 */

export type { BreadcrumbItem };

export const HOME_CRUMB: BreadcrumbItem = { name: "خانه", path: "/" };

/** The full trail, home first: pass every level after home, the current page last. */
export function crumbTrail(...items: BreadcrumbItem[]): BreadcrumbItem[] {
  return [HOME_CRUMB, ...items];
}

type BreadcrumbsProps = {
  /** Home first, current page last (see crumbTrail). */
  items: readonly BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length < 2) return null;
  const last = items.length - 1;
  return (
    <nav aria-label="مسیر صفحه" className={cn(styles.nav, className)}>
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={`${index}-${item.path}`} className={styles.item}>
            {index === last ? (
              <span aria-current="page" className={styles.current} title={item.name}>
                {item.name}
              </span>
            ) : (
              <Link href={item.path} transitionTypes={["nav-back"]} className="text-muted hover:text-ink">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
