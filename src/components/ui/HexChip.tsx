import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import type { AgeStageKey } from "@/lib/ages";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { ACCENT_TINT, AGE_TINT, type AccentKey } from "./tints";
import styles from "./HexChip.module.css";

/*
 * Hexagonal age chip (DESIGN.md §4.10).
 *   with `name` + `value` → a <label> around a visually hidden radio: the height door's five ages
 *                           work with zero JS (`:has(:checked)` drives the room). Seated + check
 *                           bead when checked.
 *   with `pressed`        → a <button aria-pressed> for filters (FilterBar wires onClick).
 * Min 56 × 44. The label stays plain words («۱ تا ۲ سال»).
 */

/** Face colour: an age band, a category accent, or plain birch. */
export type HexTint = AgeStageKey | AccentKey | "wood";

function tintClass(tint: HexTint) {
  if (tint === "wood") return "bg-wood text-ink";
  if (tint in AGE_TINT) return AGE_TINT[tint as AgeStageKey];
  return ACCENT_TINT[tint as AccentKey];
}

type HexChipCommon = {
  children: ReactNode;
  tint?: HexTint;
  className?: string;
};

export type HexChipRadioProps = HexChipCommon & {
  pressed?: undefined;
  name: string;
  value: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "name" | "value" | "children" | "className">;

export type HexChipToggleProps = HexChipCommon & {
  pressed: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "aria-pressed">;

export type HexChipProps = HexChipRadioProps | HexChipToggleProps;

function Face({ tint, children }: { tint: HexTint; children: ReactNode }) {
  return (
    <>
      <span className={cn(styles.face, tintClass(tint))}>{children}</span>
      <span className={styles.check} aria-hidden="true">
        <Icon name="check" className="size-3.5" />
      </span>
    </>
  );
}

export function HexChip(props: HexChipProps) {
  if (props.pressed === undefined) {
    const { children, tint = "wood", className, name, value, ...input } = props;
    return (
      <label className={cn(styles.chip, className)}>
        <input {...input} type="radio" name={name} value={value} className="sr-only" />
        <Face tint={tint}>{children}</Face>
      </label>
    );
  }
  const { children, tint = "wood", className, pressed, type = "button", ...button } = props;
  return (
    <button {...button} type={type} aria-pressed={pressed} className={cn(styles.chip, className)}>
      <Face tint={tint}>{children}</Face>
    </button>
  );
}
