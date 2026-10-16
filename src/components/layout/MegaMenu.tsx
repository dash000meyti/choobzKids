import type { ReactNode } from "react";
import { Bubble } from "@/components/ui/Bubble";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { installmentPlan } from "@/components/ui/installments";
import type { NavData, NavRoom } from "@/db/queries/nav";
import { formatToman, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DrawingImg } from "./DrawingImg";
import { HexLink } from "./HexLink";
import { NavIcon } from "./NavIcons";
import { NavLink } from "./NavLink";
import styles from "./MegaMenu.module.css";

/*
 * Desktop mega menus (DESIGN.md §4.1): `popover="auto"` panels fixed under the header, the full
 * container wide, opening like a toy-box lid. Zero JS: the trigger button's `popovertarget` opens
 * and closes them, Esc and light dismiss close them, focus returns to the trigger. HoverIntent
 * adds the 120 ms hover-open for mouse users; NavDismiss closes a panel when one of its links is
 * followed. Drawings inside are lazy <img>s, so nothing loads until a panel opens.
 */

export function MegaTrigger({ target, children }: { target: string; children: ReactNode }) {
  return (
    <button type="button" popoverTarget={target} data-hover-popover="" className={cn(styles.trigger, navItemClasses)}>
      {children}
      <NavIcon name="chevron-down" className={cn(styles.chevron, "size-4")} />
    </button>
  );
}

/** Shared look of the header's top-level items (triggers and plain links). */
export const navItemClasses =
  "inline-flex min-h-11 items-center gap-1 rounded-bit-xs px-3 text-sm font-semibold text-ink " +
  "transition-colors duration-(--dur-quick) ease-wood hover:text-accent aria-[current=page]:font-bold";

export function MegaPanel({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div id={id} popover="auto" data-close-on-navigate="" className={styles.panel}>
      <h2 className="sr-only">{title}</h2>
      {children}
    </div>
  );
}

function ColumnTitle({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-xs font-semibold text-muted">{children}</p>;
}

/* ---------- «فروشگاه» ---------- */

function featuredRoom(rooms: NavRoom[]): NavRoom | null {
  return rooms.find((r) => r.ageStage === "2-3y" && r.pieceCount > 0) ?? rooms.find((r) => r.pieceCount > 0) ?? null;
}

function RoomTeaser({ room, snapppay }: { room: NavRoom; snapppay: NavData["settings"]["snapppay"] }) {
  const plan = installmentPlan(room.totalToman, snapppay);
  return (
    <NavLink href={`/rooms/${room.slug}`} className="ply flex h-full flex-col gap-3 rounded-bit p-4">
      <span className="grid h-28 place-items-center rounded-bit-sm bg-surface">
        {room.illustration ? <DrawingImg illustration={room.illustration} size={104} /> : null}
      </span>
      <span className="text-base font-bold text-ink">{room.name}، کامل</span>
      <span className="text-sm text-muted">
        {toFaDigits(room.pieceCount)} تکه · {formatToman(room.totalToman)}
        {plan ? <span className="text-success"> · یا {toFaDigits(plan.count)} قسط</span> : null}
      </span>
      <span className="link-mark mt-auto self-start text-sm font-semibold text-ink">این چیدمان را ببین ←</span>
    </NavLink>
  );
}

export function ShopPanel({ nav }: { nav: NavData }) {
  const room = featuredRoom(nav.rooms);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-8 xl:grid-cols-[minmax(0,1fr)_auto_17rem]">
      <div>
        <ColumnTitle>دسته‌ها</ColumnTitle>
        <ul className="grid grid-cols-3 gap-4">
          {nav.categories.map((category) => (
            <li key={category.slug}>
              <NavLink href={`/shop/${category.slug}`} className={styles.cubby}>
                <span className={styles.cubbyBox}>
                  {category.illustration ? <DrawingImg illustration={category.illustration} size={72} className="size-18" /> : null}
                  <span aria-hidden="true" className="ply-band absolute inset-x-0 bottom-0 h-[5px]" />
                </span>
                <span className={cn(styles.plate, "ply rounded-bit-xs")}>
                  <span className="block text-sm leading-snug font-bold text-ink">{category.name}</span>
                  <span className="block text-xs text-muted">{toFaDigits(category.productCount)} مدل</span>
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
        <Button href="/shop" variant="quiet" size="sm" className="mt-3">
          همهٔ محصولات ←
        </Button>
      </div>
      <div>
        <ColumnTitle>سن به سن</ColumnTitle>
        <ul className="flex flex-col items-start gap-2.5">
          {nav.ageStages.map((stage) => (
            <li key={stage.key}>
              <HexLink href={stage.href} tint={stage.key}>
                {stage.label}
              </HexLink>
            </li>
          ))}
        </ul>
      </div>
      {room ? (
        <div className="hidden xl:block">
          <ColumnTitle>یک اتاق کامل</ColumnTitle>
          <RoomTeaser room={room} snapppay={nav.settings.snapppay} />
        </div>
      ) : null}
    </div>
  );
}

/* ---------- «سن به سن» ---------- */

export function AgePanel({ nav }: { nav: NavData }) {
  return (
    <div className="grid grid-cols-3 gap-8">
      {nav.ageHubs.map((hub) => {
        const stages = new Set(nav.ageStages.filter((s) => s.hub === hub.slug).map((s) => s.key));
        const rooms = nav.rooms.filter((room) => room.ageStage && stages.has(room.ageStage));
        return (
          <div key={hub.slug} className="flex flex-col items-start gap-3">
            <HexLink href={hub.href} tint={hub.tint}>
              {hub.label}
            </HexLink>
            <ul className="flex flex-col">
              {hub.sections.map((section) => (
                <li key={section.href}>
                  <NavLink href={section.href} className="link-mark inline-flex min-h-11 items-center text-sm text-ink">
                    {section.label}
                  </NavLink>
                </li>
              ))}
              {rooms.map((room) => (
                <li key={room.slug}>
                  <NavLink href={`/rooms/${room.slug}`} className="link-mark inline-flex min-h-11 items-center text-sm text-ink">
                    چیدمان {room.name}
                  </NavLink>
                </li>
              ))}
            </ul>
            <Button href={hub.href} variant="quiet" size="sm">
              همهٔ وسایل و راهنماهای {hub.label} ←
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- «مجله» ---------- */

export function MagPanel({ nav }: { nav: NavData }) {
  return (
    <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-8">
      <div>
        <ColumnTitle>موضوع‌ها</ColumnTitle>
        <ul className="grid grid-cols-2 gap-x-6">
          {nav.topics.map((topic) => (
            <li key={topic.slug}>
              <NavLink href={`/mag/topic/${topic.slug}`} className="link-mark inline-flex min-h-11 items-center text-sm text-ink">
                {topic.name}
              </NavLink>
            </li>
          ))}
        </ul>
        <Button href="/mag" variant="quiet" size="sm" className="mt-2">
          مجله چوبز ←
        </Button>
      </div>
      <div>
        <ColumnTitle>راهنماهای اصلی</ColumnTitle>
        <ul className="flex flex-col gap-1">
          {nav.pillarGuides.map((guide) => (
            <li key={guide.slug}>
              <NavLink href={`/mag/${guide.slug}`} className="flex min-h-11 items-start gap-2 py-1.5 text-sm font-semibold text-ink">
                <Icon name="notebook" className="mt-0.5 size-5 text-muted" />
                <span className="link-mark">{guide.shortTitle}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      {nav.question ? (
        <div>
          <ColumnTitle>سؤال امروز</ColumnTitle>
          <Bubble size="md">
            <NavLink href={nav.question.href} className="text-base font-bold text-ink">
              {nav.question.label}
            </NavLink>
          </Bubble>
        </div>
      ) : null}
    </div>
  );
}
