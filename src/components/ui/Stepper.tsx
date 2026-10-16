import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";
import { TabularNumber } from "./TabularNumber";

/*
 * Quantity stepper markup (DESIGN.md §4.9): − / + wooden keys (44px) around a recessed
 * tabular-nums value. Server-safe and stateless: the interactive version is StepperControl
 * (client), which passes the handlers in. With `name`, a hidden input carries the value in forms.
 */

type KeyProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label" | "type">;

export type StepperProps = {
  value: number;
  min?: number;
  max?: number;
  /** Names the group for assistive tech, e.g. «تعداد برج یادگیری». */
  label: string;
  name?: string;
  size?: "sm" | "md";
  decrementProps?: KeyProps;
  incrementProps?: KeyProps;
  className?: string;
};

export function Stepper({
  value,
  min = 1,
  max = 99,
  label,
  name,
  size = "md",
  decrementProps,
  incrementProps,
  className,
}: StepperProps) {
  const keySize = size === "sm" ? "sm" : "md";
  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center gap-1.5", className)}>
      <IconButton
        {...decrementProps}
        icon="minus"
        label="کم کردن"
        tone="wood"
        size={keySize}
        disabled={value <= min || decrementProps?.disabled}
      />
      <output
        aria-live="polite"
        className={cn(
          "grid min-w-12 place-items-center rounded-bit-sm bg-sunken px-2 font-bold text-ink inset-shadow-tray",
          size === "sm" ? "h-10 text-sm" : "h-11 text-base",
        )}
      >
        <TabularNumber value={value} />
      </output>
      <IconButton
        {...incrementProps}
        icon="plus"
        label="اضافه کردن"
        tone="wood"
        size={keySize}
        disabled={value >= max || incrementProps?.disabled}
      />
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </div>
  );
}
