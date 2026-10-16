import Link from "next/link";
import { TatiRider } from "@/components/illustrations/tati/TatiRider";
import { Wordmark } from "@/components/illustrations/Wordmark";
import { buttonClasses } from "@/components/ui/Button";
import { sheetInvokerProps } from "@/components/ui/Sheet";
import type { NavData } from "@/db/queries/nav";
import { cn } from "@/lib/utils";
import { CartButton } from "./cart/CartButton";
import { HeaderNav } from "./HeaderNav";
import { MENU_DIALOG_ID } from "./MenuDialog";
import { NavIcon } from "./NavIcons";
import { SEARCH_DIALOG_ID } from "./SearchDialog";
import { SearchForm } from "./SearchForm";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./SiteHeader.module.css";

/*
 * The site header (DESIGN.md §4.1). Sticky, 56px on phones and 72px from 1024px; it never
 * changes height. Start: the CHOOBZ wordmark home link, then a seat where Tati rests on the
 * thread before the page moves. Phones: search and «فهرست» open their dialogs. Desktop: the
 * centre nav with mega menus, search (a field from 1280px, the dialog below that), the lullaby
 * moon and the cart. The bottom edge is
 * Tati's red thread (TatiRider). A paper backing fades in over the first 80px of scroll.
 * Identical on every page; the dock is what changes per page.
 */

const ICON_BUTTON = buttonClasses({ variant: "icon", size: "md" });

export function SiteHeader({ nav }: { nav: NavData }) {
  return (
    <header className={styles.header} style={{ viewTransitionName: "site-header" }}>
      <div className="relative mx-auto flex h-header max-w-wide items-center gap-2 px-gutter lg:h-header-lg lg:gap-3">
        <Link href="/" aria-label="چوبز کیدز، صفحهٔ اصلی" className="shrink-0 rounded-bit-xs text-ink">
          <Wordmark className={styles.wordmark} />
        </Link>
        {/* Tati's seat on the thread: he waits here at the top of every page. */}
        <span aria-hidden="true" className={styles.seat} />

        <HeaderNav nav={nav} className="hidden min-w-0 flex-1 justify-center lg:flex" />

        <div className="ms-auto flex shrink-0 items-center gap-2 lg:ms-0">
          {/* Below 1280px the nav needs the room, so search opens the dialog there too. */}
          <div className={cn(styles.search, "max-xl:hidden")}>
            <SearchForm id="header-search" className={styles.searchForm} />
          </div>
          <ThemeToggle variant="icon" className="max-lg:hidden" />
          <CartButton className="max-lg:hidden" />

          <button {...sheetInvokerProps(SEARCH_DIALOG_ID)} type="button" aria-label="جستجو" className={cn(ICON_BUTTON, "xl:hidden")}>
            <NavIcon name="search" className="size-6" />
          </button>
          <button
            {...sheetInvokerProps(MENU_DIALOG_ID)}
            type="button"
            className={cn(buttonClasses({ variant: "secondary", size: "sm" }), "lg:hidden")}
          >
            <NavIcon name="menu" className="size-5" />
            فهرست
          </button>
        </div>
      </div>
      <TatiRider />
    </header>
  );
}
