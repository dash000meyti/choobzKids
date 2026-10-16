"use client";

import { buttonClasses } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { NavIcon } from "@/components/layout/NavIcons";
import { cn } from "@/lib/utils";
import { setLullaby, useLullaby } from "./preferences";

/*
 * «حالت لالایی» (DESIGN.md §4.1, §4.6): the night palette, for reading at 1 a.m. `switch` is the
 * labelled bead-in-groove toggle (footer, menu); `icon` is the header's moon bead, pressed while
 * the lullaby palette is on. Writes localStorage and html[data-theme].
 */

type ThemeToggleProps = {
  variant?: "switch" | "icon";
  className?: string;
};

export function ThemeToggle({ variant = "switch", className }: ThemeToggleProps) {
  const dark = useLullaby();

  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-pressed={dark}
        aria-label="حالت لالایی"
        title="حالت لالایی"
        onClick={() => setLullaby(!dark)}
        className={cn(buttonClasses({ variant: "icon", size: "md" }), className)}
      >
        <NavIcon name={dark ? "sun" : "moon"} className="size-6" />
      </button>
    );
  }

  return (
    <Toggle
      label="حالت لالایی"
      checked={dark}
      onChange={(event) => setLullaby(event.currentTarget.checked)}
      className={className}
    />
  );
}
