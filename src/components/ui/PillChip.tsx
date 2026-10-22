import Link from "@/components/ui/Link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";
import buttonStyles from "./Button.module.css";

/*
 * Bead-shaped wooden chip (DESIGN.md §4.10) for filters and skills: 40px tall, 44px hit area.
 * Selected = pistachio face, check glyph, seated into its edge.
 *   with `href`  → a next/link (category "filters" are real links); `current` marks the page.
 *   otherwise    → a <button>; pass `pressed` to make it a toggle (aria-pressed).
 */

type PillChipOwn = {
  children: ReactNode;
  /** Leading icon, e.g. a skill glyph. Replaced by the check while selected. */
  icon?: IconName;
  className?: string;
};

export type PillChipButtonProps = PillChipOwn & {
  href?: undefined;
  pressed?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "aria-pressed">;

export type PillChipLinkProps = PillChipOwn & {
  href: string;
  /** This link is the current page/category (aria-current="page"). */
  current?: boolean;
} & Omit<ComponentProps<typeof Link>, "children" | "className" | "href" | "aria-current">;

export type PillChipProps = PillChipButtonProps | PillChipLinkProps;

const PILL = cn(
  buttonStyles.button,
  "relative inline-flex h-10 shrink-0 select-none items-center gap-1.5 rounded-bead px-4 text-sm font-semibold whitespace-nowrap",
  "after:absolute after:-inset-y-0.5 after:inset-x-0 after:content-['']",
  "bg-bg text-ink ring-1 ring-inset ring-line-strong/60",
  "not-aria-pressed:not-aria-[current=page]:hover:ring-ink",
  "aria-pressed:bg-ink aria-pressed:text-bg aria-pressed:ring-ink",
  "aria-[current=page]:bg-ink aria-[current=page]:text-bg aria-[current=page]:ring-ink",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

/** Studio pills are text-only; the icon prop is kept for API compatibility. */
function Content({ selected, children }: { icon?: IconName; selected: boolean; children: ReactNode }) {
  return (
    <>
      {selected ? <Icon name="check" className="-ms-1 size-[1.05em]" /> : null}
      <span>{children}</span>
    </>
  );
}

export function PillChip(props: PillChipProps) {
  if (props.href !== undefined) {
    const { children, icon, className, current, ...link } = props;
    return (
      <Link {...link} aria-current={current ? "page" : undefined} className={cn(PILL, className)}>
        <Content icon={icon} selected={!!current}>
          {children}
        </Content>
      </Link>
    );
  }
  const { children, icon, className, pressed, type = "button", ...button } = props;
  return (
    <button {...button} type={type} aria-pressed={pressed} className={cn(PILL, className)}>
      <Content icon={icon} selected={!!pressed}>
        {children}
      </Content>
    </button>
  );
}
