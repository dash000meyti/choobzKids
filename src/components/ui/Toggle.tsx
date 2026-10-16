import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * On/off switch (DESIGN.md §4.9): a wooden bead sliding in a 44 × 26 groove. A native checkbox
 * with role="switch", so it works without JS and reports on/off to assistive tech. The bead
 * travels toward inline-end when on; position (not colour alone) shows the state.
 */

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role" | "children"> & {
  label: ReactNode;
  hint?: ReactNode;
  /** Put the label before the switch instead of after it. */
  labelFirst?: boolean;
};

export function Toggle({ label, hint, labelFirst, className, ...input }: ToggleProps) {
  const text = (
    <span className="flex flex-col">
      <span>{label}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </span>
  );
  return (
    <label
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-3 text-base text-ink has-disabled:cursor-not-allowed has-disabled:opacity-60",
        labelFirst && "flex-row-reverse justify-end",
        className,
      )}
    >
      <input {...input} type="checkbox" role="switch" className="peer sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-[26px] w-11 shrink-0 rounded-bead border-[1.5px] border-line-strong bg-sunken inset-shadow-tray",
          "transition-[background-color,border-color] duration-(--dur-quick) ease-wood",
          "peer-checked:border-success peer-checked:bg-success",
          "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
          // 44 − 20 (bead) − 2 × 1.5 (border) − 2 × 1.5 (gap) = 18px of travel; --dir is −1 in RTL.
          "peer-checked:[&>span]:translate-x-[calc(var(--dir,-1)*18px)]",
        )}
      >
        <span
          className={cn(
            "absolute start-[1.5px] top-1/2 size-5 -translate-y-1/2 rounded-full bg-wood",
            "shadow-[0_1px_0_var(--ply-1),0_2px_0_var(--ply-3),0_3px_5px_-2px_rgb(var(--shadow-rgb)/.5)]",
            "transition-[translate] duration-(--dur-base) ease-settle",
          )}
        />
      </span>
      {text}
    </label>
  );
}
