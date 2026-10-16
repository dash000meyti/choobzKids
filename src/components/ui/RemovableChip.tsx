import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import buttonStyles from "./Button.module.css";

/*
 * An applied filter (DESIGN.md §4.10): a pill with «×» that removes itself when pressed.
 * The whole pill is the button (44px hit area); its name says what it removes.
 * End the row with a quiet «پاک‌کردن همه» Button.
 */

type RemovableChipProps = {
  label: string;
  /** Accessible name; defaults to «حذف فیلتر {label}». */
  removeLabel?: string;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "aria-label">;

export function RemovableChip({ label, removeLabel, className, type = "button", ...button }: RemovableChipProps) {
  return (
    <button
      {...button}
      type={type}
      aria-label={removeLabel ?? `حذف فیلتر ${label}`}
      className={cn(
        buttonStyles.button,
        "relative inline-flex h-10 shrink-0 select-none items-center gap-2 rounded-bead border-[1.5px] border-line-strong bg-raised ps-4 pe-1.5 text-sm font-semibold whitespace-nowrap text-ink shadow-ply",
        "after:absolute after:-inset-y-0.5 after:inset-x-0 after:content-['']",
        "hover:bg-[color-mix(in_oklab,var(--surface-raised),white_6%)] active:translate-y-0.5 active:shadow-ply-pressed",
        className,
      )}
    >
      <span>{label}</span>
      <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-sunken inset-shadow-tray">
        <Icon name="close" className="size-4" />
      </span>
    </button>
  );
}
