import { pill } from "./Actions";

/*
 * Apple's product sub-navigation: the product name at the start, section links, and a «خرید»
 * pill at the end. Sticks under the global nav; glass background.
 */
export function LocalNav({ title, links, buyHref }: { title: string; links: { href: string; label: string }[]; buyHref: string }) {
  return (
    <nav
      aria-label={`بخش‌های ${title}`}
      className="glass sticky top-[var(--spacing-header)] z-[25] border-b border-line/60 lg:top-[var(--spacing-header-lg)]"
    >
      <div className="mx-auto flex h-13 max-w-[61.25rem] items-center justify-between gap-4 px-gutter">
        <p className="truncate text-lg font-extrabold">{title}</p>
        <div className="flex items-center gap-5">
          <ul className="hidden items-center gap-5 text-xs text-muted md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a href={buyHref} className={`${pill("primary")} h-7 px-3.5 text-xs`}>
            خرید
          </a>
        </div>
      </div>
    </nav>
  );
}
