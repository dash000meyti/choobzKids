import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import type { NavData } from "@/db/queries/nav";
import { formatToman, toFaDigits } from "@/lib/format";
import { DrawingImg } from "./DrawingImg";
import { HexLink } from "./HexLink";
import { MotionToggle } from "./MotionToggle";
import { NavLink } from "./NavLink";
import { SearchForm } from "./SearchForm";
import { socialLinks } from "./socials";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./MenuDialog.module.css";

/*
 * «فهرست» (DESIGN.md §4.3): a full-screen <dialog> laid out like a storybook's contents page.
 * Server markup, opened by the header's menu button with an invoker command (InvokerPolyfill
 * covers older browsers). Search on top, then the shop with dotted leaders to each category's
 * count, ages as hex chips, rooms, the magazine's topics, the brand and help pages, socials and
 * the two display toggles. Following any link closes it (NavDismiss).
 */

export const MENU_DIALOG_ID = "site-menu";

function Chapter({ id, title, children, more }: { id: string; title: string; children: ReactNode; more?: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={id} className="font-display text-xl text-ink">
          {title}
        </h3>
        {more}
      </div>
      {children}
    </section>
  );
}

const ROW = "flex min-h-11 items-center gap-3 rounded-bit-xs text-base text-ink aria-[current=page]:font-bold";

export function MenuDialog({ nav }: { nav: NavData }) {
  const socials = socialLinks(nav.settings.socials);
  const titleId = `${MENU_DIALOG_ID}-title`;

  return (
    <dialog id={MENU_DIALOG_ID} aria-labelledby={titleId} closedby="any" data-close-on-navigate="" className={styles.menu}>
      <div className="mx-auto flex w-full max-w-narrow flex-col gap-8 px-gutter pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <div className={styles.top}>
          <h2 id={titleId} className="font-display text-2xl text-ink">
            فهرست
          </h2>
          <form method="dialog">
            <IconButton icon="close" label="بستن فهرست" type="submit" />
          </form>
        </div>

        <SearchForm id={`${MENU_DIALOG_ID}-q`} layout="inline" />

        <nav aria-label="فهرست سایت" className="flex flex-col gap-9">
          <Chapter
            id={`${MENU_DIALOG_ID}-shop`}
            title="فروشگاه"
            more={
              <Button href="/shop" variant="quiet" size="sm">
                همهٔ محصولات ←
              </Button>
            }
          >
            <ul className="flex flex-col">
              {nav.categories.map((category) => (
                <li key={category.slug}>
                  <NavLink href={`/shop/${category.slug}`} className={ROW}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-bit-xs bg-surface">
                      {category.illustration ? <DrawingImg illustration={category.illustration} size={32} /> : null}
                    </span>
                    <span>{category.name}</span>
                    <span aria-hidden="true" className={styles.leader} />
                    <span className="shrink-0 text-sm text-muted">{toFaDigits(category.productCount)} مدل</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </Chapter>

          <Chapter
            id={`${MENU_DIALOG_ID}-age`}
            title="سن به سن"
            more={
              <Button href="/age" variant="quiet" size="sm">
                همهٔ سن‌ها ←
              </Button>
            }
          >
            <ul className="flex flex-wrap gap-3">
              {nav.ageHubs.map((hub) => (
                <li key={hub.slug}>
                  <HexLink href={hub.href} tint={hub.tint}>
                    {hub.label}
                  </HexLink>
                </li>
              ))}
            </ul>
          </Chapter>

          {nav.rooms.length ? (
            <Chapter
              id={`${MENU_DIALOG_ID}-rooms`}
              title="اتاق‌ها"
              more={
                <Button href="/rooms" variant="quiet" size="sm">
                  همهٔ چیدمان‌ها ←
                </Button>
              }
            >
              <ul className="flex flex-col">
                {nav.rooms.map((room) => (
                  <li key={room.slug}>
                    <NavLink href={`/rooms/${room.slug}`} className={ROW}>
                      <span>{room.name}</span>
                      <span aria-hidden="true" className={styles.leader} />
                      {room.pieceCount > 0 ? (
                        <span className="shrink-0 text-sm text-muted">
                          {toFaDigits(room.pieceCount)} تکه · {formatToman(room.totalToman)}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </Chapter>
          ) : null}

          <Chapter
            id={`${MENU_DIALOG_ID}-mag`}
            title="مجله"
            more={
              <Button href="/mag" variant="quiet" size="sm">
                مجله چوبز ←
              </Button>
            }
          >
            <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {nav.topics.map((topic) => (
                <li key={topic.slug}>
                  <NavLink href={`/mag/topic/${topic.slug}`} className={ROW}>
                    {topic.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </Chapter>

          {nav.brandLinks.length ? (
            <ul className="flex flex-col border-t border-line pt-6">
              {nav.brandLinks.map((link) => (
                <li key={link.href}>
                  <NavLink href={link.href} className={ROW}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : null}
        </nav>

        {socials.bale || socials.instagram ? (
          <div className="flex flex-wrap gap-3">
            {socials.bale ? (
              <Button href={socials.bale} target="_blank" rel="noopener" variant="consult" size="sm" iconStart="bale">
                کانال بله
              </Button>
            ) : null}
            {socials.instagram ? (
              <Button href={socials.instagram} target="_blank" rel="noopener" variant="secondary" size="sm" iconStart="instagram">
                اینستاگرام چوبز
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="tray flex flex-col gap-1 p-4">
          <ThemeToggle />
          <MotionToggle />
        </div>
      </div>
    </dialog>
  );
}

