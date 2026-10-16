"use client";

import { useRef, useState, type ComponentType } from "react";
import { inputClasses } from "@/components/ui/TextInput";
import { cn } from "@/lib/utils";
import type { SearchSuggestProps } from "./SearchSuggest";

/*
 * The search field inside the header and search-dialog forms. A plain `name="q"` input that
 * works with no JS (the form is a GET to /search); the live suggestions (SearchSuggest, ≈ 3 KB)
 * are imported on first focus or hover and then take over the combobox behaviour.
 */

type SearchInputProps = {
  id: string;
  /** `popup` floats the suggestions under the field (header); `inline` stacks them below (dialog). */
  layout?: "popup" | "inline";
  autoFocus?: boolean;
  className?: string;
};

export const SEARCH_PLACEHOLDER = "دنبال چی می‌گردی؟";

export function SearchInput({ id, layout = "popup", autoFocus, className }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const loading = useRef(false);
  const [island, setIsland] = useState<{
    Suggest: ComponentType<SearchSuggestProps>;
    initialQuery: string;
    initiallyOpen: boolean;
  } | null>(null);

  const load = () => {
    if (loading.current) return;
    loading.current = true;
    import("./SearchSuggest").then(
      (module) => {
        const input = inputRef.current;
        setIsland({
          Suggest: module.SearchSuggest,
          initialQuery: input?.value ?? "",
          initiallyOpen: !!input && document.activeElement === input,
        });
      },
      () => {
        loading.current = false;
      },
    );
  };

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        جستجو در چوبز
      </label>
      <input
        ref={inputRef}
        id={id}
        name="q"
        type="search"
        autoComplete="off"
        enterKeyHint="search"
        maxLength={100}
        // Rendered as the HTML autofocus attribute, so showModal() focuses it (search dialog).
        autoFocus={autoFocus}
        placeholder={SEARCH_PLACEHOLDER}
        onFocus={load}
        onPointerEnter={load}
        className={cn(inputClasses, "h-12 ps-11 [&::-webkit-search-cancel-button]:hidden", className)}
      />
      {island ? (
        <island.Suggest
          inputRef={inputRef}
          listId={`${id}-suggestions`}
          layout={layout}
          initialQuery={island.initialQuery}
          initiallyOpen={island.initiallyOpen}
        />
      ) : null}
    </div>
  );
}
