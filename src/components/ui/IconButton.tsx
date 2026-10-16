import { Button, type ButtonAsButton, type ButtonAsLink } from "./Button";
import type { IconName } from "./Icon";

/*
 * The 44px round "bead" button (DESIGN.md §4.8 `icon` variant): close, quick-add «+», stepper keys.
 * `label` is required because the icon alone has no accessible name.
 */

type IconOnly<T> = T extends unknown
  ? Omit<T, "variant" | "children" | "iconStart" | "iconEnd" | "aria-label"> & {
      icon: IconName;
      /** Accessible name, e.g. «بستن». */
      label: string;
    }
  : never;

export type IconButtonProps = IconOnly<ButtonAsButton> | IconOnly<ButtonAsLink>;

export function IconButton({ icon, label, ...rest }: IconButtonProps) {
  return <Button {...rest} variant="icon" iconStart={icon} aria-label={label} />;
}
