import Form from "next/form";
import { cn } from "@/lib/utils";
import { NavIcon } from "./NavIcons";
import { SearchInput } from "./SearchInput";

/*
 * The site search form (DESIGN.md §4.4): a GET to /search that works without JS; next/form makes
 * the submit a client navigation once hydrated. The recessed field carries the magnifier as its
 * submit button at inline-start.
 */

type SearchFormProps = {
  /** Unique per page: the header, the search dialog and the menu each have one. */
  id: string;
  layout?: "popup" | "inline";
  autoFocus?: boolean;
  className?: string;
};

export function SearchForm({ id, layout = "popup", autoFocus, className }: SearchFormProps) {
  return (
    <Form action="/search" role="search" aria-label="جستجو در سایت" className={cn("relative flex items-start", className)}>
      <SearchInput id={id} layout={layout} autoFocus={autoFocus} />
      <button
        type="submit"
        aria-label="جستجو"
        className="absolute start-1 top-1 grid size-10 place-items-center rounded-bit-xs text-muted transition-colors duration-(--dur-quick) ease-wood hover:text-ink"
      >
        <NavIcon name="search" className="size-5" />
      </button>
    </Form>
  );
}
