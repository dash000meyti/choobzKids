"use client";

import { Toggle } from "@/components/ui/Toggle";
import { setCalmMotion, useCalmMotion } from "./preferences";

/*
 * «حرکت آرام» (DESIGN.md §4.6, §9.1 rule 7): stills every scene on its final frame, like the
 * OS reduced-motion setting. When the device already asks for that, the switch shows on and
 * says so, because the site honours the OS either way.
 */

export function MotionToggle({ className }: { className?: string }) {
  const calm = useCalmMotion();
  const system = calm === "system";
  return (
    <Toggle
      label="حرکت آرام"
      hint={system ? "دستگاهت خودش حرکت‌ها رو کم کرده." : undefined}
      checked={calm !== "off"}
      disabled={system}
      onChange={(event) => setCalmMotion(event.currentTarget.checked)}
      className={className}
    />
  );
}
