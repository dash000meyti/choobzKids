"use client";

import Link from "@/components/ui/Link";
import { startTransition, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { FacetOption, FilterFacets } from "@/db/queries/shop";
import { Button, buttonClasses } from "@/components/ui/Button";
import { HexChip } from "@/components/ui/HexChip";
import { Icon } from "@/components/ui/Icon";
import { PillChip } from "@/components/ui/PillChip";
import { RemovableChip } from "@/components/ui/RemovableChip";
import { Sheet, SheetClose, sheetInvokerProps } from "@/components/ui/Sheet";
import { Toggle } from "@/components/ui/Toggle";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import styles from "./FilterBar.module.css";

/*
 * FilterBar (DESIGN.md §6.1, SEO.md §1.9), the shop's one island (≈3 KB). It wraps the
 * server-rendered ProductGrid and filters the cards already in the DOM: every card carries
 * data-age-min/max, data-skills, data-price, data-avail, data-order and data-published, and sits
 * in a `[data-slot]` cell. A filter hides cells (`hidden`), a sort sets `style.order` on them;
 * nothing moves in the DOM and nothing is fetched. Groups left empty hide, editorial interludes
 * show only in the default view, and the count is announced politely.
 *
 * Every control is a <button> (never a link), disabled in the server HTML and enabled once the
 * browser is idle, so the full list is always visible without JS and the bar's height never
 * changes (no CLS). State mirrors to the URL with history.replaceState (`?age=12-24&sort=new`)
 * and is read back on load; the server never sees it, so the page stays prerendered and the
 * canonical stays clean.
 *
 * Phones: a sticky rail under the header («فیلترها (۲)», quick age chips, sort) and a Sheet
 * with every facet. Desktop: a sticky 280px sidebar at inline-start.
 */

type Sort = "" | "new" | "price-asc" | "price-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "", label: "پیشنهاد چوبز" },
  { value: "new", label: "جدیدترین" },
  { value: "price-asc", label: "ارزان‌ترین" },
  { value: "price-desc", label: "گران‌ترین" },
];

type Filters = { age: string[]; skill: string[]; price: string | null; inStock: boolean; sort: Sort };

const DEFAULT: Filters = { age: [], skill: [], price: null, inStock: false, sort: "" };

/** What the bar needs to know about one card, read once from its data-* attributes. */
type Card = {
  id: string;
  ageMin: number;
  ageMax: number;
  skills: string[];
  price: number;
  ready: boolean;
  order: number;
  published: number;
  isNew: boolean;
};

type FilterBarProps = {
  facets: FilterFacets;
  /** Products in the server-rendered list (the count before JS). */
  total: number;
  /** The ProductGrid. */
  children: ReactNode;
};

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

/** "12-24" → [12, 24]; "8000000-" → [8000000, ∞). */
function range(value: string): [number, number] {
  const [from, to] = value.split("-");
  return [Number(from) || 0, to ? Number(to) : Number.POSITIVE_INFINITY];
}

const filterCount = (f: Filters) => f.age.length + f.skill.length + (f.price ? 1 : 0) + (f.inStock ? 1 : 0);
const isDefault = (f: Filters) => filterCount(f) === 0 && f.sort === "";

function matches(card: Card, f: Filters): boolean {
  if (f.inStock && !card.ready) return false;
  if (f.price) {
    const [min, max] = range(f.price);
    if (card.price < min || card.price >= max) return false;
  }
  if (f.age.length && !f.age.some((a) => {
    const [min, max] = range(a);
    return card.ageMin < max && card.ageMax > min;
  })) {
    return false;
  }
  return !f.skill.length || f.skill.some((s) => card.skills.includes(s));
}

const BY_SORT: Record<Exclude<Sort, "">, (a: Card, b: Card) => number> = {
  new: (a, b) => b.published - a.published || Number(b.isNew) - Number(a.isNew) || a.order - b.order,
  "price-asc": (a, b) => a.price - b.price || a.order - b.order,
  "price-desc": (a, b) => b.price - a.price || a.order - b.order,
};

function readCard(el: HTMLElement): Card {
  const d = el.dataset;
  const slot = el.closest<HTMLElement>("[data-slot]");
  return {
    id: d.product ?? "",
    ageMin: d.ageMin ? Number(d.ageMin) : 0,
    ageMax: d.ageMax ? Number(d.ageMax) : Number.POSITIVE_INFINITY,
    skills: d.skills ? d.skills.split(" ") : [],
    price: Number(d.price) || 0,
    ready: d.avail === "in_stock",
    order: Number(d.order) || 0,
    published: d.published ? Date.parse(d.published) || 0 : 0,
    isNew: slot?.dataset.new === "true",
  };
}

/**
 * URL → filters, keeping only values this list offers. An age value may also be a wider range
 * («12-36») that covers several of the buckets.
 */
function fromSearch(search: string, facets: FilterFacets): Filters {
  const q = new URLSearchParams(search);
  const values = (key: string) => [...new Set(q.getAll(key).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean))];
  const age = facets.ages
    .filter((f) => {
      const [min, max] = range(f.value);
      return values("age").some((v) => {
        const [from, to] = range(v);
        return min >= from && max <= to;
      });
    })
    .map((f) => f.value);
  const sort = q.get("sort") ?? "";
  return {
    age,
    skill: facets.skills.filter((f) => values("skill").includes(f.value)).map((f) => f.value),
    price: facets.prices.find((f) => f.value === q.get("price"))?.value ?? null,
    inStock: facets.inStock && q.get("in_stock") === "1",
    sort: SORTS.some((s) => s.value === sort) ? (sort as Sort) : "",
  };
}

const FACET_KEYS = new Set(["age", "skill", "price", "in_stock", "sort"]);

/**
 * `search` with our facets replaced by `f`: `?age=…&skill=…&price=…&in_stock=1&sort=…`, commas
 * left readable. Anything else in the query (a campaign tag, say) is kept as it was.
 */
function withFilters(search: string, f: Filters): string {
  const kept = search
    .replace(/^\?/, "")
    .split("&")
    .filter((part) => part && !FACET_KEYS.has(part.split("=")[0]));
  const ours = [
    f.age.length ? `age=${f.age.join(",")}` : "",
    f.skill.length ? `skill=${f.skill.join(",")}` : "",
    f.price ? `price=${f.price}` : "",
    f.inStock ? "in_stock=1" : "",
    f.sort ? `sort=${f.sort}` : "",
  ].filter(Boolean);
  const parts = [...kept, ...ours];
  return parts.length ? `?${parts.join("&")}` : "";
}

const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

/** Runs `fn` once the main thread is idle (filters are never urgent on load). */
function whenIdle(fn: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout: 2000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 200);
  return () => window.clearTimeout(id);
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function FilterBar({ facets, total, children }: FilterBarProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const sheetId = `filters-${useId()}`;
  const [cards, setCards] = useState<Card[] | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT);
  const ready = cards !== null;

  // Hydrate on idle: read the cards and the URL, then enable the controls.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    return whenIdle(() => {
      const read = [...grid.querySelectorAll<HTMLElement>("[data-product]")].map(readCard);
      let initial = DEFAULT;
      try {
        initial = fromSearch(window.location.search, facets);
      } catch {
        // A malformed query string just means the default view.
      }
      startTransition(() => {
        setCards(read);
        setFilters(initial);
      });
    });
  }, [facets]);

  // Apply: hide, order, and mirror into the URL.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !cards) return;
    const byId = new Map(cards.map((c) => [c.id, c]));
    const shown = new Set(cards.filter((c) => matches(c, filters)).map((c) => c.id));
    const sorted = filters.sort ? [...cards].sort(BY_SORT[filters.sort]).map((c) => c.id) : [];

    for (const el of grid.querySelectorAll<HTMLElement>("[data-product]")) {
      const id = el.dataset.product ?? "";
      const slot = el.closest<HTMLElement>("[data-slot]") ?? el;
      slot.hidden = byId.has(id) && !shown.has(id);
      slot.style.order = filters.sort ? String(sorted.indexOf(id)) : "";
    }
    for (const el of grid.querySelectorAll<HTMLElement>("[data-interlude]")) el.hidden = !isDefault(filters);
    for (const group of grid.querySelectorAll<HTMLElement>("[data-group]")) {
      group.hidden = !group.querySelector("[data-slot]:not([hidden])");
    }

    const { pathname, search, hash } = window.location;
    const next = withFilters(search, filters);
    if (next !== search) {
      try {
        window.history.replaceState(null, "", `${pathname}${next}${hash}`);
      } catch {
        // Some embedded browsers refuse history writes; the filters still work.
      }
    }
  }, [cards, filters]);

  const update = (next: (f: Filters) => Filters) => startTransition(() => setFilters(next));
  const clear = () => update((f) => ({ ...DEFAULT, sort: f.sort }));

  const count = cards ? cards.filter((c) => matches(c, filters)).length : total;
  const active = filterCount(filters);
  const singleAge = filters.age.length === 1 ? facets.ages.find((a) => a.value === filters.age[0]) : undefined;
  const countLabel = `${toFaDigits(count)} محصول`;

  const panel = (
    <FacetPanel facets={facets} filters={filters} update={update} disabled={!ready} idPrefix={sheetId} />
  );

  return (
    <div className={styles.catalog}>
      <aside className={styles.sidebar} aria-labelledby={`${sheetId}-side`}>
        <div className="tray flex flex-col gap-5 p-4">
          <div className="flex min-h-10 items-center justify-between gap-2">
            <h2 id={`${sheetId}-side`} className="text-base font-bold text-ink">
              فیلتر و ترتیب
            </h2>
            {active ? (
              <Button variant="quiet" size="sm" onClick={clear}>
                پاک‌کردن همه
              </Button>
            ) : null}
          </div>
          {panel}
        </div>
      </aside>

      <div className="min-w-0">
        <div className={styles.rail}>
          <div className={styles.railScroll}>
            <button
              type="button"
              disabled={!ready}
              className={cn(buttonClasses({ size: "sm" }), styles.railStart, "rounded-bead disabled:opacity-60")}
              {...sheetInvokerProps(sheetId)}
            >
              <Icon name="filter" className="size-5" />
              <span>فیلترها{active ? ` (${toFaDigits(active)})` : ""}</span>
            </button>
            {facets.ages.map((age) => (
              <HexChip
                key={age.value}
                tint={age.tint}
                pressed={filters.age.includes(age.value)}
                disabled={!ready}
                onClick={() => update((f) => ({ ...f, age: toggleIn(f.age, age.value) }))}
                className="shrink-0"
              >
                {age.label}
              </HexChip>
            ))}
            <SortBead value={filters.sort} disabled={!ready} onChange={(sort) => update((f) => ({ ...f, sort }))} />
          </div>
        </div>

        <div className={styles.status}>
          <p role="status" className="shrink-0 text-sm font-semibold text-ink">
            {countLabel}
          </p>
          {active ? (
            <>
              <AppliedChips facets={facets} filters={filters} update={update} />
              <Button variant="quiet" size="sm" onClick={clear} className="shrink-0">
                پاک‌کردن همه
              </Button>
            </>
          ) : null}
        </div>
        {singleAge?.guide ? (
          <p className="-mt-1 mb-4 text-sm">
            <Link href={singleAge.guide.href} className="link-mark font-semibold text-ink">
              {singleAge.guide.label} ←
            </Link>
          </p>
        ) : null}

        <div ref={gridRef}>{children}</div>
        {ready && count === 0 ? <EmptyState onClear={clear} /> : null}
      </div>

      <Sheet
        id={sheetId}
        title="فیلتر و ترتیب"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button variant="quiet" size="sm" onClick={clear} disabled={!active}>
              پاک‌کردن همه
            </Button>
            <SheetClose variant="primary">دیدن {countLabel}</SheetClose>
          </div>
        }
      >
        {panel}
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Parts                                                               */
/* ------------------------------------------------------------------ */

type Update = (next: (f: Filters) => Filters) => void;

function FacetPanel({
  facets,
  filters,
  update,
  disabled,
  idPrefix,
}: {
  facets: FilterFacets;
  filters: Filters;
  update: Update;
  disabled: boolean;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {facets.ages.length > 1 ? (
        <FacetGroup id={`${idPrefix}-age`} label="سن">
          {facets.ages.map((age) => (
            <HexChip
              key={age.value}
              tint={age.tint}
              pressed={filters.age.includes(age.value)}
              disabled={disabled}
              onClick={() => update((f) => ({ ...f, age: toggleIn(f.age, age.value) }))}
            >
              {age.label}
            </HexChip>
          ))}
        </FacetGroup>
      ) : null}

      {facets.skills.length > 1 ? (
        <FacetGroup id={`${idPrefix}-skill`} label="مهارت">
          {facets.skills.map((skill) => (
            <PillChip
              key={skill.value}
              icon={skill.icon}
              pressed={filters.skill.includes(skill.value)}
              disabled={disabled}
              onClick={() => update((f) => ({ ...f, skill: toggleIn(f.skill, skill.value) }))}
            >
              {skill.label}
            </PillChip>
          ))}
        </FacetGroup>
      ) : null}

      {facets.prices.length > 1 ? (
        <FacetGroup id={`${idPrefix}-price`} label="قیمت">
          {facets.prices.map((price) => (
            <PillChip
              key={price.value}
              pressed={filters.price === price.value}
              disabled={disabled}
              onClick={() => update((f) => ({ ...f, price: f.price === price.value ? null : price.value }))}
            >
              {price.label}
            </PillChip>
          ))}
        </FacetGroup>
      ) : null}

      {facets.inStock ? (
        <Toggle
          label="فقط آمادهٔ ارسال"
          hint="بدون صبر برای ساخت"
          checked={filters.inStock}
          disabled={disabled}
          onChange={(event) => {
            const inStock = event.currentTarget.checked;
            update((f) => ({ ...f, inStock }));
          }}
        />
      ) : null}

      <FacetGroup id={`${idPrefix}-sort`} label="ترتیب">
        {SORTS.map((sort) => (
          <PillChip
            key={sort.value || "default"}
            pressed={filters.sort === sort.value}
            disabled={disabled}
            onClick={() => update((f) => ({ ...f, sort: sort.value }))}
          >
            {sort.label}
          </PillChip>
        ))}
      </FacetGroup>
    </div>
  );
}

function FacetGroup({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-2.5">
      <p id={id} className="text-sm font-bold text-ink">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** Sort on the phone rail: a sort bead with the native picker laid over it. */
function SortBead({ value, disabled, onChange }: { value: Sort; disabled: boolean; onChange: (sort: Sort) => void }) {
  return (
    <span className={cn(styles.railEnd, "relative grid size-10 shrink-0 place-items-center rounded-full bg-raised text-ink shadow-ply has-disabled:opacity-60")}>
      <Icon name="sort" className="size-5" />
      {value ? <span aria-hidden="true" className="absolute end-1 top-1 size-2 rounded-full bg-accent" /> : null}
      <select
        aria-label="ترتیب نمایش"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value as Sort)}
        className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0 disabled:cursor-not-allowed"
      >
        {SORTS.map((sort) => (
          <option key={sort.value || "default"} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>
    </span>
  );
}

function AppliedChips({ facets, filters, update }: { facets: FilterFacets; filters: Filters; update: Update }) {
  const label = (options: FacetOption[], value: string) => options.find((o) => o.value === value)?.label ?? value;
  return (
    <>
      {filters.age.map((value) => (
        <RemovableChip
          key={`age-${value}`}
          label={label(facets.ages, value)}
          onClick={() => update((f) => ({ ...f, age: f.age.filter((v) => v !== value) }))}
        />
      ))}
      {filters.skill.map((value) => (
        <RemovableChip
          key={`skill-${value}`}
          label={label(facets.skills, value)}
          onClick={() => update((f) => ({ ...f, skill: f.skill.filter((v) => v !== value) }))}
        />
      ))}
      {filters.price ? (
        <RemovableChip label={label(facets.prices, filters.price)} onClick={() => update((f) => ({ ...f, price: null }))} />
      ) : null}
      {filters.inStock ? (
        <RemovableChip label="فقط آمادهٔ ارسال" onClick={() => update((f) => ({ ...f, inStock: false }))} />
      ) : null}
    </>
  );
}

/** «با این فیلترها چیزی پیدا نکردیم.» under an empty cubby. */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <span aria-hidden="true" className={styles.emptyCubby}>
        <span className="contact-shadow absolute inset-x-[22%] bottom-[7px] h-[8%] rounded-[50%] opacity-60" />
        <span className="ply-band absolute inset-x-0 bottom-0 h-[6px]" />
      </span>
      <p className="text-lead text-ink">با این فیلترها چیزی پیدا نکردیم.</p>
      <Button variant="secondary" onClick={onClear}>
        پاک‌کردن فیلترها
      </Button>
    </div>
  );
}
