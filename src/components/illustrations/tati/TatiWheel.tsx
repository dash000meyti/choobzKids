import { WHEELS } from "./geometry";
import { INK_LINE } from "./TatiBody";

const R = WHEELS.radius;

/** 4 spoke ticks between hub and rim, so a turning wheel reads as turning. */
const SPOKES = [45, 135, 225, 315]
  .map((deg) => {
    const a = (deg * Math.PI) / 180;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    const p = (r: number) => `${(R + r * c).toFixed(2)} ${(R + r * s).toFixed(2)}`;
    return `M${p(2.9)}L${p(4.5)}`;
  })
  .join("");

/**
 * One near-side wheel (r 6 disc, anar hub). Rendered twice by TatiPose, each in
 * an HTML span that rotates; never animate this SVG's own children.
 */
export function TatiWheel({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${R * 2} ${R * 2}`}
      overflow="visible"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="var(--ink)"
      strokeLinecap="round"
      style={{ strokeWidth: "var(--tati-stroke, 1.5px)" }}
    >
      <circle cx={R} cy={R} r={R} fill="var(--wood)" {...INK_LINE} />
      <circle cx={R} cy={R} r={R - 1.4} stroke="var(--ply-2)" strokeOpacity={0.55} strokeWidth={0.45} />
      <path d={SPOKES} {...INK_LINE} />
      <circle cx={R} cy={R} r={2} fill="var(--thread)" stroke="none" />
    </svg>
  );
}

/** The open eye: an ink dot with a catch-light toward the light (upper right). Blinks in its wrapper. */
export function TatiEye({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 4 4" overflow="visible" aria-hidden="true" focusable="false" className={className}>
      <circle cx={2} cy={2} r={1.6} fill="var(--ink)" />
      <circle cx={2.55} cy={1.45} r={0.6} fill="var(--bg)" />
    </svg>
  );
}
