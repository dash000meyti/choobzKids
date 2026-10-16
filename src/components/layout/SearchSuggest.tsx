"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useId, useState, type RefObject } from "react";
import type { SearchHit, SuggestResponse } from "@/db/queries/search";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * Live search suggestions (DESIGN.md §4.4), loaded on the field's first focus. It turns the
 * plain input into a combobox: 150 ms debounced GET /api/suggest?q=, results grouped
 * «محصولات · راهنماها · واژه‌ها» as plain links in a listbox, arrow keys / Home / End to move,
 * Enter to follow, Esc to close. With an empty field it offers the viewer's recent searches
 * (localStorage, this device only). Submitting the form still goes to /search as before.
 */

export type SearchSuggestProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  listId: string;
  layout: "popup" | "inline";
  /** The field's value when the island loaded. */
  initialQuery: string;
  /** Whether the field had focus when the island loaded (it also loads on hover). */
  initiallyOpen: boolean;
};

type Option = { id: string; href: string; label: string; hint: string | null };
type Group = { key: string; label: string; options: Option[] };

const DEBOUNCE_MS = 150;
const MIN_QUERY = 2;
const PER_GROUP = 4;
const RECENT_KEY = "cz.search.recent";
const RECENT_MAX = 5;

const GROUPS: { key: keyof Pick<SuggestResponse, "products" | "guides" | "terms">; label: string }[] = [
  { key: "products", label: "محصولات" },
  { key: "guides", label: "راهنماها" },
  { key: "terms", label: "واژه‌ها" },
];

function searchHref(query: string) {
  return `/search?q=${encodeURIComponent(query)}`;
}

function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  const q = query.trim();
  if (q.length < MIN_QUERY) return;
  try {
    const next = [q, ...readRecent().filter((r) => r !== q)].slice(0, RECENT_MAX);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode: nothing to remember.
  }
}

function hitOption(prefix: string, hit: SearchHit): Option {
  return { id: `${prefix}-${hit.kind}-${hit.refId}`, href: hit.href, label: hit.title, hint: hit.hint };
}

/** Closes the menu, dialog or popover the field lives in before a programmatic navigation. */
function closeContainer(input: HTMLInputElement) {
  const scope = input.closest("[data-close-on-navigate]");
  if (scope instanceof HTMLDialogElement) scope.close();
  else if (scope instanceof HTMLElement && scope.matches(":popover-open")) scope.hidePopover();
}

export function SearchSuggest({ inputRef, listId, layout, initialQuery, initiallyOpen }: SearchSuggestProps) {
  const router = useRouter();
  const prefix = useId().replace(/:/g, "");
  const [query, setQuery] = useState(initialQuery.trim());
  /** The latest answer, with the query it answers (the server normalises its own copy). */
  const [answer, setAnswer] = useState<{ query: string; data: SuggestResponse } | null>(null);
  const [recent, setRecent] = useState<string[]>(() => readRecent());
  const [open, setOpen] = useState(initiallyOpen);
  const [active, setActive] = useState(-1);

  const typed = query.length >= MIN_QUERY;
  const results = typed && answer?.query === query ? answer.data : null;
  const groups: Group[] = [];
  if (results) {
    for (const { key, label } of GROUPS) {
      const options = results[key].slice(0, PER_GROUP).map((hit) => hitOption(prefix, hit));
      if (options.length) groups.push({ key, label, options });
    }
    groups.push({
      key: "all",
      label: "همه",
      options: [{ id: `${prefix}-all`, href: searchHref(query), label: `همهٔ نتیجه‌ها برای «${query}»`, hint: null }],
    });
  } else if (!query && recent.length) {
    groups.push({
      key: "recent",
      label: "جستجوهای اخیر",
      options: recent.map((q, i) => ({ id: `${prefix}-recent-${i}`, href: searchHref(q), label: q, hint: null })),
    });
  }
  const options = groups.flatMap((g) => g.options);
  const expanded = open && options.length > 0;
  const activeOption = expanded ? options[active] : undefined;
  const resultCount = results ? results.total : null;

  // Fetch suggestions 150 ms after typing stops; a newer query aborts the older request.
  useEffect(() => {
    if (query.length < MIN_QUERY) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(query)}&limit=${PER_GROUP}`, { signal: controller.signal })
        .then((response) => (response.ok ? (response.json() as Promise<SuggestResponse>) : null))
        .then((data) => {
          if (data) setAnswer({ query, data });
        })
        .catch(() => {
          // Offline or aborted: the form still submits to /search.
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const follow = (option: Option) => {
    const input = inputRef.current;
    saveRecent(query);
    setOpen(false);
    if (input) closeContainer(input);
    router.push(option.href);
  };

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (expanded) {
        // First Esc closes the list; the next one may close the dialog.
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        setActive(-1);
      }
      return;
    }
    if (!options.length) return;
    const last = options.length - 1;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (event.key === "ArrowDown") setActive((i) => (i >= last ? 0 : i + 1));
      else setActive((i) => (i <= 0 ? last : i - 1));
    } else if (expanded && (event.key === "Home" || event.key === "End") && active !== -1) {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : last);
    } else if (event.key === "Enter" && activeOption) {
      event.preventDefault();
      follow(activeOption);
    }
  });

  const onInput = useEffectEvent(() => {
    setQuery(inputRef.current?.value.trim() ?? "");
    setActive(-1);
    setOpen(true);
  });

  // Wire the input it enhances: combobox semantics, typing, keys, focus and submit.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const form = input.form;
    const keydown = (event: KeyboardEvent) => onKeyDown(event);
    const typing = () => onInput();
    let blurTimer: number | undefined;
    const focus = () => {
      window.clearTimeout(blurTimer);
      setRecent(readRecent());
      setOpen(true);
    };
    const blur = () => {
      blurTimer = window.setTimeout(() => setOpen(false), 120);
    };
    const submit = () => saveRecent(input.value);

    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", listId);
    input.addEventListener("keydown", keydown);
    input.addEventListener("input", typing);
    input.addEventListener("focus", focus);
    input.addEventListener("blur", blur);
    form?.addEventListener("submit", submit);
    return () => {
      window.clearTimeout(blurTimer);
      for (const name of ["role", "aria-autocomplete", "aria-controls", "aria-expanded", "aria-activedescendant"]) {
        input.removeAttribute(name);
      }
      input.removeEventListener("keydown", keydown);
      input.removeEventListener("input", typing);
      input.removeEventListener("focus", focus);
      input.removeEventListener("blur", blur);
      form?.removeEventListener("submit", submit);
    };
  }, [inputRef, listId]);

  // Keep the input's state attributes in step with the list.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.setAttribute("aria-expanded", String(expanded));
    if (activeOption) input.setAttribute("aria-activedescendant", activeOption.id);
    else input.removeAttribute("aria-activedescendant");
  }, [inputRef, expanded, activeOption]);

  return (
    <>
      <div
        id={listId}
        role="listbox"
        aria-label="پیشنهادهای جستجو"
        hidden={!expanded}
        className={cn(
          "flex flex-col gap-2 rounded-bit bg-raised p-2 text-ink",
          layout === "popup"
            ? "absolute inset-x-0 top-full z-10 mt-2 max-h-[min(70vh,28rem)] overflow-y-auto shadow-paper"
            : "mt-3 border border-line",
        )}
      >
        {groups.map((group) => (
          <div key={group.key} role="group" aria-labelledby={`${prefix}-${group.key}`}>
            <div id={`${prefix}-${group.key}`} className={cn("px-3 pt-1 pb-0.5 text-xs font-semibold text-muted", group.key === "all" && "sr-only")}>
              {group.label}
            </div>
            {group.options.map((option) => {
              const selected = option === activeOption;
              return (
                <a
                  key={option.id}
                  id={option.id}
                  href={option.href}
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  // Keep focus in the field so the list does not close before the click lands.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.preventDefault();
                    follow(option);
                  }}
                  className={cn(
                    "flex min-h-11 flex-col justify-center rounded-bit-sm px-3 py-1.5 text-sm",
                    selected ? "bg-sunken inset-shadow-tray" : "hover:bg-sunken",
                    group.key === "all" && "font-semibold",
                  )}
                >
                  <span className={cn(selected && "font-semibold")}>{option.label}</span>
                  {option.hint ? <span className="text-xs text-muted">{option.hint}</span> : null}
                </a>
              );
            })}
          </div>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {resultCount === null ? "" : resultCount > 0 ? `${toFaDigits(resultCount)} پیشنهاد` : "پیشنهادی پیدا نشد"}
      </p>
    </>
  );
}
