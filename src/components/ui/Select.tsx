import type { SelectHTMLAttributes } from "react";
import { grainStyle } from "@/lib/grain";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/*
 * Native <select> dressed as a raised wood block with a chevron at inline-end (DESIGN.md §4.9).
 * The wood face and grain sit on a wrapper (selects can't carry pseudo-elements); the options
 * stay native so every phone shows its own picker.
 */

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Seed for the grain board. */
  grainSeed?: string;
  wrapperClassName?: string;
};

export function Select({ grainSeed = "select", wrapperClassName, className, children, ...select }: SelectProps) {
  return (
    <span
      className={cn(
        "grain relative inline-flex h-12 w-full rounded-bit-sm bg-wood text-ink shadow-ply has-disabled:opacity-60",
        wrapperClassName,
      )}
      style={grainStyle(grainSeed)}
    >
      <select
        {...select}
        className={cn(
          "size-full cursor-pointer appearance-none rounded-[inherit] bg-transparent ps-4 pe-11 text-base font-semibold text-ink",
          "disabled:cursor-not-allowed",
          className,
        )}
      >
        {children}
      </select>
      <Icon name="chevron-down" className="pointer-events-none absolute end-3.5 top-1/2 size-5 -translate-y-1/2" />
    </span>
  );
}
