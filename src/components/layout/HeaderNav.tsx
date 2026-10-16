import type { NavData } from "@/db/queries/nav";
import { cn } from "@/lib/utils";
import { AgePanel, MagPanel, MegaPanel, MegaTrigger, navItemClasses, ShopPanel } from "./MegaMenu";
import { NavLink } from "./NavLink";

/*
 * Desktop centre navigation (DESIGN.md §4.1), in plain search words:
 * «فروشگاه ▾» · «سن به سن ▾» · «اتاق‌ها» · «مجله ▾» · «کارگاه» · «خرید قسطی».
 * The three ▾ items open mega menus; the rest are links that mark the current section.
 */

export function HeaderNav({ nav, className }: { nav: NavData; className?: string }) {
  return (
    <nav aria-label="منوی اصلی" className={cn("items-center", className)}>
      <ul className="flex items-center gap-0.5 xl:gap-1.5">
        <li>
          <MegaTrigger target="mega-shop">فروشگاه</MegaTrigger>
          <MegaPanel id="mega-shop" title="فروشگاه">
            <ShopPanel nav={nav} />
          </MegaPanel>
        </li>
        <li>
          <MegaTrigger target="mega-age">سن به سن</MegaTrigger>
          <MegaPanel id="mega-age" title="سن به سن">
            <AgePanel nav={nav} />
          </MegaPanel>
        </li>
        {nav.rooms.length ? (
          <li>
            <NavLink href="/rooms" className={navItemClasses}>
              اتاق‌ها
            </NavLink>
          </li>
        ) : null}
        <li>
          <MegaTrigger target="mega-mag">مجله</MegaTrigger>
          <MegaPanel id="mega-mag" title="مجله">
            <MagPanel nav={nav} />
          </MegaPanel>
        </li>
        <li>
          <NavLink href="/workshop" className={navItemClasses}>
            کارگاه
          </NavLink>
        </li>
        <li>
          <NavLink href="/installments" className={navItemClasses}>
            خرید قسطی
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
