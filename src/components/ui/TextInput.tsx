import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/*
 * Text input (DESIGN.md §4.9): a 48px recessed tray with a pencil-line border (≥ 3:1).
 * `numeric` sets inputmode for phone/number fields; whoever reads the value normalises
 * Persian digits with toEnDigits() (src/lib/format.ts).
 */

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  numeric?: boolean;
  size?: "md" | "lg";
};

export const inputClasses = cn(
  "w-full rounded-bit-sm border-[1.5px] border-line-strong bg-sunken px-3.5 text-base text-ink inset-shadow-tray",
  "placeholder:text-muted transition-[border-color] duration-(--dur-quick) ease-wood",
  "focus:border-focus aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-60",
);

export function TextInput({ numeric, size = "md", className, type = "text", dir = "rtl", ...input }: TextInputProps) {
  return (
    <input
      {...input}
      type={type}
      dir={dir}
      inputMode={numeric ? "numeric" : input.inputMode}
      className={cn(inputClasses, size === "lg" ? "h-14" : "h-12", className)}
    />
  );
}
