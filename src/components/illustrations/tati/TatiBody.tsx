import {
  ARTBOARD,
  BEAK,
  BELLY_HIGHLIGHT,
  BODY_GRAIN,
  EYE_OFFSET,
  FAR_WHEELS,
  LEAN_PIVOT,
  PLATFORM,
  POSES,
  SLEEP_MARKS,
  STRING_ANCHOR,
  WHEELS,
  WING,
  duckOutline,
  headPoint,
  type TatiPoseName,
} from "./geometry";

/** Ink lines keep their on-screen width at every size (§3.6: 1.5 px ≤ 64 px wide, 2 px above). */
export const INK_LINE = { vectorEffect: "non-scaling-stroke" } as const;

type TatiBodyProps = {
  pose: TatiPoseName;
  /** Draw the anar string and its bead. Scenes that draw their own string pass false. */
  string?: boolean;
  className?: string;
};

/**
 * Tati's static body for one pose: the duck, the cart and the far-side wheels.
 * The near wheels and the open eye are separate HTML-wrapped SVGs (TatiPose)
 * so they can rotate and blink on the compositor.
 *
 * Colours are CSS variables, so the lamp-lit «لالایی» palette applies by
 * itself, and a night scene can re-tint him by overriding --ink / --wood on a
 * wrapper. The SVG overflows its box on the left where the string runs.
 */
export function TatiBody({ pose, string = true, className }: TatiBodyProps) {
  const spec = POSES[pose];
  const { center, tilt, facing } = spec.head;
  const beakTurn = facing === "back" ? -tilt : tilt;
  const beakTransform = `translate(${center[0]} ${center[1]}) rotate(${beakTurn})${facing === "back" ? " scale(-1 1)" : ""}`;
  const lean = spec.lean ? `rotate(${spec.lean} ${LEAN_PIVOT[0]} ${LEAN_PIVOT[1]})` : undefined;
  const [eyeX, eyeY] = headPoint({ ...spec, lean: 0 }, EYE_OFFSET);

  return (
    <svg
      viewBox={`0 0 ${ARTBOARD.width} ${ARTBOARD.height}`}
      overflow="visible"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="var(--ink)"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth: "var(--tati-stroke, 1.5px)" }}
    >
      {/* far-side wheels, behind everything: the 3/4 hint */}
      <g opacity={0.55} fill="var(--wood-side)">
        {FAR_WHEELS.map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r={WHEELS.radius} {...INK_LINE} />
        ))}
      </g>

      <g transform={lean}>
        <path d={BEAK} transform={beakTransform} fill="var(--ply-2)" {...INK_LINE} />
        <path d={duckOutline(center)} fill="var(--wood)" {...INK_LINE} />
        <path d={BELLY_HIGHLIGHT} fill="var(--wood-top)" stroke="none" />
        <g stroke="var(--ply-2)" strokeOpacity={0.35} strokeWidth={0.45}>
          {BODY_GRAIN.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <path d={WING} {...INK_LINE} />
        {spec.eye === "closed" && (
          <path d={`M${eyeX - 1.7} ${eyeY - 0.2}q1.7 1.6 3.4 0`} {...INK_LINE} />
        )}
      </g>

      {pose === "sleeping" && (
        <g opacity={0.7}>
          {SLEEP_MARKS.map((d) => (
            <path key={d} d={d} {...INK_LINE} />
          ))}
        </g>
      )}

      {/* the cart: a birch board, its front edge showing the ply */}
      <rect
        x={PLATFORM.x}
        y={PLATFORM.y}
        width={PLATFORM.width}
        height={PLATFORM.height}
        rx={PLATFORM.radius}
        fill="var(--wood)"
        {...INK_LINE}
      />
      <g stroke="var(--ply-2)" strokeOpacity={0.7} strokeWidth={0.5} strokeLinecap="butt">
        <path d={`M${PLATFORM.x + 1} 27.35H${PLATFORM.x + PLATFORM.width - 1}`} />
        <path d={`M${PLATFORM.x + 0.6} 28.65H${PLATFORM.x + PLATFORM.width - 0.6}`} />
      </g>

      {string && (
        <>
          <path d={spec.string} stroke="var(--thread)" {...INK_LINE} />
          {spec.bead && (
            <circle cx={spec.bead[0]} cy={spec.bead[1]} r={1.6} fill="var(--wood)" {...INK_LINE} />
          )}
          <circle cx={STRING_ANCHOR[0]} cy={STRING_ANCHOR[1]} r={0.55} fill="var(--ink)" stroke="none" />
        </>
      )}
    </svg>
  );
}
