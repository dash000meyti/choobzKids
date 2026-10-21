import { HexLink } from "@/components/layout/HexLink";
import { AGE_HUBS, AGE_STAGES } from "@/lib/ages";
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
      <ul className="no-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto py-1 sm:gap-3">
        {AGE_HUBS.map((hub) => (
          <li key={hub.slug} className="shrink-0">
            <HexLink href={`/age/${hub.slug}`} tint={AGE_STAGES.find((s) => s.hub === hub.slug)?.key ?? "0-6m"}>
              {hub.label}
            </HexLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
