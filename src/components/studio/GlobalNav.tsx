import Link from "@/components/ui/Link";
import { Wordmark } from "@/components/illustrations/Wordmark";
import { SEARCH_DIALOG_ID } from "@/components/layout/SearchDialog";
import { sheetInvokerProps } from "@/components/ui/Sheet";
import type { NavData } from "@/db/queries/nav";
import { BagButton } from "./BagButton";
import styles from "./GlobalNav.module.css";

/*
 * The global navigation bar: 48px, translucent glass, small quiet links (Studio design).
 * Phones get the logo, search, bag and a full-screen popover menu; nothing here needs JS
 * except the bag count.
 */

const MENU_ID = "global-menu";

export function navLinks(nav: NavData) {
  const bySlug = new Map(nav.categories.map((c) => [c.slug, c]));
  const pick = (slug: string, label?: string) => {
    const c = bySlug.get(slug);
    return c ? { label: label ?? c.name, href: `/shop/${c.slug}` } : null;
  };
  return [
    { label: "فروشگاه", href: "/shop" },
    pick("learning-towers", "برج یادگیری"),
    pick("climbing", "پیکلر و صعود"),
    pick("furniture", "مبلمان"),
    pick("toys", "اسباب‌بازی"),
    { label: "چیدمان اتاق", href: "/rooms" },
    { label: "مجله", href: "/mag" },
    { label: "پشتیبانی", href: "/faq" },
  ].filter((l): l is { label: string; href: string } => !!l);
}

export function GlobalNav({ nav }: { nav: NavData }) {
  const links = navLinks(nav);
  return (
    <header className={`${styles.bar} glass`} style={{ viewTransitionName: "site-header" }}>
      <nav aria-label="منوی اصلی" className="mx-auto flex h-header max-w-[64rem] items-center justify-between gap-2 px-gutter lg:h-header-lg">
        <Link href="/" aria-label="چوبز کیدز، صفحهٔ اصلی" className="flex shrink-0 items-center text-ink">
          <Wordmark className="h-[1.15rem] w-auto" />
        </Link>

        <ul className="hidden flex-1 items-center justify-evenly px-6 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={styles.link}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center">
          <button
            type="button"
            {...sheetInvokerProps(SEARCH_DIALOG_ID)}
            aria-label="جستجو"
            className="grid size-11 place-items-center rounded-full text-ink/80 transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-[1.1rem]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 4.5 4.5" strokeLinecap="round" />
            </svg>
          </button>
          <BagButton />
          <button
            type="button"
            popoverTarget={MENU_ID}
            aria-label="فهرست"
            className="grid size-11 place-items-center rounded-full text-ink/80 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M5 9h14M5 15h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      <div id={MENU_ID} popover="auto" data-close-on-navigate className={`${styles.menu} lg:hidden`} aria-label="فهرست">
        <ul>
          {links.map((l, i) => (
            <li key={l.href} style={{ transitionDelay: `${i * 30}ms` }} className={styles.menuLink}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <div className="mt-10 grid gap-2 text-sm text-muted">
          <Link href="/installments">خرید قسطی با اسنپ‌پی</Link>
          <Link href="/shipping">ارسال و بازگشت کالا</Link>
          <Link href="/about">داستان چوبز</Link>
          <Link href="/contact">تماس با ما</Link>
        </div>
      </div>
    </header>
  );
}
