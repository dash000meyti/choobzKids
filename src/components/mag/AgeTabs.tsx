import Link from "next/link";
import { AGE_HUBS } from "@/lib/ages";
import { cn } from "@/lib/utils";
import styles from "./AgeTabs.module.css";

/*
 * Age tabs (DESIGN.md §7.1): the three age hubs as hexagonal tabs in their age tints, sticking
 * out of the masthead notebook's lower edge like index dividers. On phones the row becomes a
 * rail that stays under the header while the hub scrolls, so «سن به سن» is always one tap away.
 */

export function AgeTabs({ className }: { className?: string }) {
  return (
    <nav aria-label="سن به سن" className={cn(styles.rail, className)}>
      <ul className="no-scrollbar flex min-w-0 items-center justify-center gap-2 overflow-x-auto py-1">
        {AGE_HUBS.map((hub) => (
          <li key={hub.slug} className="shrink-0">
            <Link href={`/age/${hub.slug}`} className="inline-flex h-10 items-center rounded-full bg-surface px-5 text-sm font-semibold text-ink hover:bg-sunken">
              {hub.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
