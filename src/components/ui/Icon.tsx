import { cn } from "@/lib/utils";

/*
 * Icons from the /icons.svg sprite (DESIGN.md §3.8): 24px grid, 1.75px pencil stroke.
 * The sprite's symbols carry geometry only; stroke, caps and colour are set here and
 * inherit into the <use> shadow tree, so every icon follows `currentColor`.
 */

export const ICON_NAMES = [
  "cart", "search", "menu", "close", "chevron-down", "chevron-start", "chevron-end", "arrow-start", "arrow-end",
  "home", "shelf", "hex", "notebook", "house", "saw", "wheels", "ruler", "sprout", "shield-leaf", "stamp",
  "bale", "instagram", "phone", "moon", "sun", "slow", "parcel", "truck", "check", "plus", "minus", "trash",
  "share", "link", "info", "warning", "star", "heart", "clock", "filter", "sort", "play", "zoom", "gift",
  "pencil", "book", "leaf",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

const ICON_SET: ReadonlySet<string> = new Set(ICON_NAMES);

export function isIconName(value: string | null | undefined): value is IconName {
  return value != null && ICON_SET.has(value);
}

/* Drawn left-to-right in the sprite; mirrored here so "start"/"end" follow the writing direction. */
const DIRECTIONAL: ReadonlySet<IconName> = new Set(["chevron-start", "chevron-end", "arrow-start", "arrow-end"]);

type IconProps = {
  name: IconName;
  className?: string;
  /** Accessible name. Without it the icon is decorative and hidden from assistive tech. */
  title?: string;
};

export function Icon({ name, className, title }: IconProps) {
  return (
    <svg
      // Attributes rather than classes, so any size utility in `className` wins.
      width="1.25em"
      height="1.25em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", DIRECTIONAL.has(name) && "rtl:-scale-x-100", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
