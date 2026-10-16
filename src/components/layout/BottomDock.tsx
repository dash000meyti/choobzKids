import type { CSSProperties } from "react";
import { grainStyle } from "@/lib/grain";
import { cn } from "@/lib/utils";
import { CartButton } from "./cart/CartButton";
import { NavIcon } from "./NavIcons";
import { NavLink } from "./NavLink";
import styles from "./BottomDock.module.css";

/*
 * The phone and tablet dock (DESIGN.md §4.2): a birch plank with its ply strata on top, five tabs
 * with icon and label — «خانه» · «فروشگاه» · «سن به سن» · «مجله» · «سبد». The current tab
 * carries an anar bead, bold label and aria-current. «سن به سن» jumps to the height door on the
 * home page. Server markup; the tabs know the path (NavLink) and the cart tab is the CartButton
 * island. It never turns with the page (view-transition-name: dock) and hides from 1024px.
 *
 * Product pages swap it for their buy bar: an element with [data-buybar] on the page hides the
 * dock, or, where scroll timelines and motion are allowed, rotates it away as the element with
 * [data-price-timeline] (the price block) scrolls out (BottomDock.module.css).
 */

export function BottomDock() {
  return (
    <nav aria-label="منوی پایین" className={cn(styles.dock, "grain bg-wood")} style={{ ...(grainStyle("dock") as CSSProperties), viewTransitionName: "dock" }}>
      <span aria-hidden="true" className="ply-band absolute inset-x-0 -top-[5px] h-[5px]" />
      <ul className={styles.tabs}>
        <li>
          <NavLink href="/" match="exact" className={styles.tab}>
            <NavIcon name="home" className="size-6" />
            <span>خانه</span>
          </NavLink>
        </li>
        <li>
          <NavLink href="/shop" also={["/product", "/rooms"]} className={styles.tab}>
            <NavIcon name="shelf" className="size-6" />
            <span>فروشگاه</span>
          </NavLink>
        </li>
        <li>
          <NavLink href="/age" homeHref="#height-door" className={styles.tab}>
            <NavIcon name="hex" className="size-6" />
            <span>سن به سن</span>
          </NavLink>
        </li>
        <li>
          <NavLink href="/mag" also={["/glossary"]} className={styles.tab}>
            <NavIcon name="notebook" className="size-6" />
            <span>مجله</span>
          </NavLink>
        </li>
        <li>
          <CartButton variant="dock" className={styles.tab} />
        </li>
      </ul>
    </nav>
  );
}
