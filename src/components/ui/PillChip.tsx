import Link from "next/link";
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
  "bg-wood text-ink shadow-ply",
  "active:translate-y-0.5 active:shadow-ply-pressed",
  "not-aria-pressed:not-aria-[current=page]:hover:bg-[color-mix(in_oklab,var(--wood),white_6%)]",
  "aria-pressed:translate-y-0.5 aria-pressed:bg-success aria-pressed:text-on-accent aria-pressed:shadow-ply-pressed",
  "aria-[current=page]:translate-y-0.5 aria-[current=page]:bg-success aria-[current=page]:text-on-accent aria-[current=page]:shadow-ply-pressed",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

function Content({ icon, selected, children }: { icon?: IconName; selected: boolean; children: ReactNode }) {
  const glyph = selected ? "check" : icon;
  return (
    <>
      {glyph ? <Icon name={glyph} className="-ms-1 size-[1.15em]" /> : null}
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
