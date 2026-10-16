import { IconButton } from "@/components/ui/IconButton";
import { PillChip } from "@/components/ui/PillChip";
import { SearchForm } from "./SearchForm";
import styles from "./SearchDialog.module.css";

/*
 * The search dialog (DESIGN.md §4.4) opened by the header's magnifier below 1280px:
 * a sheet from the top with the recessed «دنبال چی می‌گردی؟» field, popular searches as chips,
 * and (once the field is focused) the viewer's recent searches and live suggestions.
 * Opened with an invoker command, closed by Esc, the backdrop, «بستن» or following a result.
 */

export const SEARCH_DIALOG_ID = "search-dialog";

const POPULAR = ["برج یادگیری", "مثلث پیکلر", "۱ سالگی", "اتاق مونته‌سوری"];

export function SearchDialog() {
  return (
    <dialog
      id={SEARCH_DIALOG_ID}
      aria-labelledby={`${SEARCH_DIALOG_ID}-title`}
      closedby="any"
      data-close-on-navigate=""
      className={styles.dialog}
    >
      <div className="mx-auto flex w-full max-w-narrow flex-col gap-5 px-gutter pt-3 pb-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id={`${SEARCH_DIALOG_ID}-title`} className="text-lg font-bold text-ink">
            جستجو
          </h2>
          <form method="dialog">
            <IconButton icon="close" label="بستن جستجو" size="sm" type="submit" />
          </form>
        </div>
        <SearchForm id={`${SEARCH_DIALOG_ID}-q`} layout="inline" autoFocus />
        <section aria-labelledby={`${SEARCH_DIALOG_ID}-popular`}>
          <h3 id={`${SEARCH_DIALOG_ID}-popular`} className="mb-2 text-sm font-semibold text-muted">
            جستجوهای پرطرفدار
          </h3>
          <ul className="flex flex-wrap gap-2">
            {POPULAR.map((query) => (
              <li key={query}>
                <PillChip href={`/search?q=${encodeURIComponent(query)}`} icon="search">
                  {query}
                </PillChip>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </dialog>
  );
}
