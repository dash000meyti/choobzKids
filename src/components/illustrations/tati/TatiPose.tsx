import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { YaldaScarf } from "../season/YaldaProps";
import { POSES, WHEELS, artboardBox, eyeCenter, type TatiPoseName } from "./geometry";
import { TatiBody } from "./TatiBody";
import { TatiEye, TatiWheel } from "./TatiWheel";
import styles from "./TatiPose.module.css";

export type { TatiPoseName } from "./geometry";

type TatiPoseProps = {
  pose: TatiPoseName;
  /** Rendered width in CSS px (height follows the 48:40 artboard). Omit to fill the parent's width. */
  size?: number;
  /** Yalda knitted scarf (settings.season === "yalda"). */
  scarf?: boolean;
  /** Draw his anar string and bead. Scenes that draw their own string pass false. */
  string?: boolean;
  className?: string;
};

/**
 * Tati, the journey duck (DESIGN.md §3.6), in one of his four poses.
 *
 * Markup: one span box holding the static body SVG, an optional scarf overlay,
 * the open eye and the two near wheels. The wheels carry the global classes
 * `wheel wheel--front` / `wheel wheel--back` (front = under the head) so a
 * caller's CSS can rotate them; `waiting` blinks every 7s on its eye wrapper.
 *
 * Always decorative (aria-hidden): give the surrounding control its own
 * accessible name. Part positions are physical (left/top) on purpose: they
 * map artboard coordinates, and the drawing never mirrors with direction.
 */
export function TatiPose({ pose, size, scarf = false, string = true, className }: TatiPoseProps) {
  const [eyeX, eyeY] = eyeCenter(pose);
  const style: CSSProperties | undefined = size ? { width: size } : undefined;

  return (
    <span aria-hidden="true" className={cn(styles.tati, className)} style={style}>
      <TatiBody pose={pose} string={string} />
      {scarf && <YaldaScarf pose={pose} />}
      {POSES[pose].eye === "open" && (
        <span
          className={cn(styles.part, styles.eye, pose === "waiting" && "motion-ok:animate-blink")}
          style={artboardBox(eyeX, eyeY, 4)}
        >
          <TatiEye />
        </span>
      )}
      <span className={cn(styles.part, "wheel wheel--front")} style={artboardBox(WHEELS.front.cx, WHEELS.front.cy, 12)}>
        <TatiWheel />
      </span>
      <span className={cn(styles.part, "wheel wheel--back")} style={artboardBox(WHEELS.back.cx, WHEELS.back.cy, 12)}>
        <TatiWheel />
      </span>
    </span>
  );
}
