import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/*
 * Shared anatomy of Checkbox and Radio (DESIGN.md §4.9): a 22px recessed hole; when checked a
 * raised wooden peg drops into it. The real input stays in the DOM (visually hidden, first child)
 * so forms, keyboard and screen readers work natively; siblings react through `peer-*`.
 */

export type PegChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  label: ReactNode;
  /** Secondary line under the label. */
  hint?: ReactNode;
};

export function PegChoice({
  type,
  label,
  hint,
  className,
  ...input
}: PegChoiceProps & { type: "checkbox" | "radio" }) {
  return (
    <label
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-3 text-base text-ink has-disabled:cursor-not-allowed has-disabled:opacity-60",
        className,
      )}
    >
      <input {...input} type={type} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          "grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] border-line-strong bg-sunken inset-shadow-tray",
          "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
          "peer-checked:border-ply-dark peer-checked:[&>span]:translate-y-0 peer-checked:[&>span]:scale-100 peer-checked:[&>span]:opacity-100",
        )}
      >
        <span
          className={cn(
            "grid size-[18px] -translate-y-1 scale-75 place-items-center rounded-full bg-wood text-ink opacity-0",
            "shadow-[0_1px_0_var(--ply-1),0_2px_0_var(--ply-3),0_3px_4px_-2px_rgb(var(--shadow-rgb)/.45)]",
            "transition-[translate,scale,opacity] duration-(--dur-gentle) ease-settle",
          )}
        >
          {type === "checkbox" ? (
            <Icon name="check" className="size-3.5" />
          ) : (
            <span className="size-1.5 rounded-full bg-ply-dark" />
          )}
        </span>
      </span>
      <span className="flex flex-col">
        <span>{label}</span>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}
