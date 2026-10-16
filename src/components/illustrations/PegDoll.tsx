import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/*
 * Waldorf peg dolls (DESIGN.md §3.8): a turned bell body and a sphere head, no face.
 * The story layer's people — in the scale tool, the height-mark door, room scenes and
 * play vignettes. Every figure is drawn on a 100-unit-tall artboard (1 unit = 1% of its
 * height), so a doll is always exactly `heightCm` tall on whatever cm scale it stands in.
 *
 * Sizing: the root <span> is `--cm` × `--peg-unit` tall (default 2px per cm). A scene that
 * draws at true scale sets `--peg-unit` (a room stage uses `calc(100% / 240)`: its 2400 mm
 * height is 240 cm). The child also listens to `--child-cm`: the door scene sets it and the
 * doll grows by `scale` from its feet, on the compositor, without relayout.
 *
 * Colours are theme tokens mixed with accent inks, so the dolls dim with the «لالایی» palette.
 */

export type PegDollVariant = "child" | "mother" | "mother-scarf" | "father" | "grandma";
export type PegDollTint = "sage" | "terracotta" | "mustard" | "sky";

type Circle = { cx: number; cy: number; r: number };

type Figure = {
  /** Artboard width; the height is always 100. */
  width: number;
  head: Circle;
  body: string;
  /** Turned-wood shade on the side away from the light (light comes from the upper right). */
  bodyShade: string;
  collar: string;
  /** Painted hair: where the fringe sits above the head's centre (× r), and an optional bun. */
  hair?: { fringe: number; bun?: boolean };
  /** A soft scarf (hijab) framing the face; the face then shows through `face`. */
  scarf?: { hood: string; shade: string; face: Circle };
  cheeks?: boolean;
};

const BODY_FILL: Record<PegDollTint, string> = {
  sage: "color-mix(in srgb, var(--color-sage-ink) 42%, var(--surface-raised))",
  terracotta: "color-mix(in srgb, var(--color-terracotta-ink) 46%, var(--wood-top))",
  mustard: "color-mix(in srgb, var(--color-zardchube) 62%, var(--wood-top))",
  sky: "color-mix(in srgb, var(--color-sky-ink) 42%, var(--surface-raised))",
};

/** A scarf never matches the dress it sits on. */
const SCARF_TINT: Record<PegDollTint, PegDollTint> = {
  sage: "terracotta",
  terracotta: "sage",
  mustard: "sage",
  sky: "terracotta",
};

const DEFAULT_TINT: Record<PegDollVariant, PegDollTint> = {
  child: "mustard",
  mother: "terracotta",
  "mother-scarf": "sage",
  father: "sky",
  grandma: "terracotta",
};

const HAIR_FILL = "var(--ply-3)";
const GRANDMA_SCARF_FILL = "color-mix(in srgb, var(--surface-raised) 70%, var(--tag))";

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Painted hair, the way peg dolls have it: a cap over the top of the head that comes down
 * the sides and ends in a soft side-parted fringe; a bun sits on top, behind the cap.
 */
function hairPaths({ cx, cy, r }: Circle, { fringe, bun }: NonNullable<Figure["hair"]>): string[] {
  const sideY = r2(cy + 0.12 * r);
  const sideX = Math.sqrt(r * r - (0.12 * r) ** 2);
  const p = (dx: number, dy: number) => `${r2(cx + dx * r)} ${r2(cy + dy * r)}`;
  const cap =
    `M${r2(cx - sideX)} ${sideY}A${r} ${r} 0 1 1 ${r2(cx + sideX)} ${sideY}` +
    `C${p(0.9, -fringe + 0.2)} ${p(0.55, -fringe - 0.1)} ${p(0.18, -fringe)}` +
    `C${p(-0.2, -fringe - 0.16)} ${p(-0.78, -fringe + 0.02)} ${r2(cx - sideX)} ${sideY}Z`;
  if (!bun) return [cap];
  const br = r2(0.38 * r);
  const by = r2(cy - 0.96 * r);
  return [`M${r2(cx - br)} ${by}a${br} ${br} 0 1 1 ${r2(2 * br)} 0 ${br} ${br} 0 1 1 ${r2(-2 * br)} 0Z`, cap];
}

const FIGURES: Record<PegDollVariant, Figure> = {
  // Toddler proportions: the head is about 1/4.5 of the height.
  child: {
    width: 44,
    head: { cx: 22, cy: 11.6, r: 11 },
    body: "M9 31C9 25.5 14 22 22 22S35 25.5 35 31C35 52 41 70 41.5 92 41.6 97.5 39 100 34 100H10C5 100 2.4 97.5 2.5 92 3 70 9 52 9 31Z",
    bodyShade: "M9 31C9 52 3 70 2.5 92 2.4 97.5 5 100 10 100H14.5C11.5 95 11 80 12.4 62 13.3 50 13.6 38 13.2 26.4 10.6 27.4 9 28.9 9 31Z",
    collar: "M12.4 27.6Q22 32.2 31.6 27.6",
    hair: { fringe: 0.3 },
    cheeks: true,
  },
  // Adults: the head is about 1/6.5 of the height.
  mother: {
    width: 34,
    head: { cx: 17, cy: 10.4, r: 7.6 },
    body: "M6 23.5C6 19 10 16.6 17 16.6S28 19 28 23.5C28 50 32.6 72 32.8 93 32.8 97.6 31 100 27 100H7C3 100 1.2 97.6 1.2 93 1.4 72 6 50 6 23.5Z",
    bodyShade: "M6 23.5C6 50 1.4 72 1.2 93 1.2 97.6 3 100 7 100H10.4C8.3 94 8 76 9 60 9.8 47 10 34 9.7 18.2 7.4 19.3 6 21.1 6 23.5Z",
    collar: "M8.6 20.6Q17 24.4 25.4 20.6",
    hair: { fringe: 0.34, bun: true },
  },
  "mother-scarf": {
    width: 34,
    head: { cx: 17, cy: 10.6, r: 7.4 },
    body: "M6 23.5C6 19 10 16.6 17 16.6S28 19 28 23.5C28 50 32.6 72 32.8 93 32.8 97.6 31 100 27 100H7C3 100 1.2 97.6 1.2 93 1.4 72 6 50 6 23.5Z",
    bodyShade: "M6 23.5C6 50 1.4 72 1.2 93 1.2 97.6 3 100 7 100H10.4C8.3 94 8 76 9 60 9.8 47 10 34 9.7 18.2 7.4 19.3 6 21.1 6 23.5Z",
    collar: "M8.6 27.8Q17 31.2 25.4 27.8",
    scarf: {
      hood: "M17 .8C23 .8 26.6 5.3 26.6 10.6 26.6 14.4 27.2 17.6 30 21.4 31 24.6 26.8 27.8 17 27.8S3 24.6 4 21.4C6.8 17.6 7.4 14.4 7.4 10.6 7.4 5.3 11 .8 17 .8Z",
      shade: "M17 .8C11 .8 7.4 5.3 7.4 10.6 7.4 14.4 6.8 17.6 4 21.4 3.4 23.6 5.2 25.6 9.4 26.8 8.6 22 9.6 17.4 10.6 13.2 11.4 8.6 13.4 3.8 17 .8Z",
      face: { cx: 17, cy: 11.2, r: 6.1 },
    },
  },
  father: {
    width: 38,
    head: { cx: 19, cy: 10, r: 7.4 },
    body: "M5 24.5C5 18.8 10 16.4 19 16.4S33 18.8 33 24.5C33 50 35.5 74 35.6 93 35.6 97.6 33.6 100 29.6 100H8.4C4.4 100 2.4 97.6 2.4 93 2.5 74 5 50 5 24.5Z",
    bodyShade: "M5 24.5C5 50 2.5 74 2.4 93 2.4 97.6 4.4 100 8.4 100H11.6C9.6 94 9.2 76 10 60 10.6 47 10.4 33 9.8 17.6 7 18.6 5 20.8 5 24.5Z",
    collar: "M9.4 20.4Q19 24 28.6 20.4",
    hair: { fringe: 0.5 },
  },
  grandma: {
    width: 38,
    head: { cx: 19, cy: 10.8, r: 7.2 },
    body: "M7 25C7 19.2 11.5 17 19 17S31 19.2 31 25C31 40 36.5 55 36.6 80 36.7 95 34 100 28.5 100H9.5C4 100 1.3 95 1.4 80 1.5 55 7 40 7 25Z",
    bodyShade: "M7 25C7 40 1.5 55 1.4 80 1.3 95 4 100 9.5 100H12.6C10.2 92 9.8 74 10.8 58 11.6 46 11.6 32 11.2 18.4 8.6 19.6 7 21.8 7 25Z",
    collar: "M10 28.6Q19 32 28 28.6",
    scarf: {
      hood: "M19 1.2C24.8 1.2 28.4 5.6 28.4 11 28.4 14.8 29.2 18 32.4 22 33.4 25.4 28.8 28.6 19 28.6S4.6 25.4 5.6 22C8.8 18 9.6 14.8 9.6 11 9.6 5.6 13.2 1.2 19 1.2Z",
      shade: "M19 1.2C13.2 1.2 9.6 5.6 9.6 11 9.6 14.8 8.8 18 5.6 22 5 24.2 6.8 26.4 11.2 27.6 10.4 22.8 11.6 18 12.6 13.8 13.4 9.2 15.4 4.4 19 1.2Z",
      face: { cx: 19, cy: 11.4, r: 5.9 },
    },
    cheeks: true,
  },
};

/** How wide a doll of `heightCm` stands, for placing it before it renders. */
export function pegDollWidthCm(variant: PegDollVariant, heightCm: number): number {
  return (heightCm * FIGURES[variant].width) / 100;
}

const INK_LINE = { vectorEffect: "non-scaling-stroke" } as const;

type PegDollProps = {
  heightCm: number;
  variant?: PegDollVariant;
  tint?: PegDollTint;
  className?: string;
  /** Positioning from the caller (e.g. `placePerson()` in a room stage). */
  style?: CSSProperties;
};

export function PegDoll({ heightCm, variant = "child", tint, className, style }: PegDollProps) {
  const figure = FIGURES[variant];
  const bodyTint = tint ?? DEFAULT_TINT[variant];
  const { head, scarf } = figure;
  const face = scarf?.face ?? head;
  const scarfFill = variant === "grandma" ? GRANDMA_SCARF_FILL : BODY_FILL[SCARF_TINT[bodyTint]];

  const sizing = {
    "--cm": heightCm,
    display: "inline-block",
    height: "calc(var(--cm) * var(--peg-unit, 2px))",
    aspectRatio: `${figure.width} / 100`,
    // Only the child grows with the door scene's --child-cm; adults keep their height.
    ...(variant === "child" && {
      scale: "calc(var(--child-cm, var(--cm)) / var(--cm))",
      transformOrigin: "50% 100%",
    }),
  } as CSSProperties;

  return (
    <span className={cn("pointer-events-none", className)} style={{ ...sizing, ...style }}>
      <svg
        viewBox={`0 0 ${figure.width} 100`}
        width="100%"
        height="100%"
        overflow="visible"
        aria-hidden="true"
        focusable="false"
        stroke="var(--ink)"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={figure.body} fill={BODY_FILL[bodyTint]} {...INK_LINE} />
        <path d={figure.bodyShade} fill="var(--ink)" fillOpacity={0.1} stroke="none" />
        <path d={figure.collar} fill="none" strokeOpacity={0.45} strokeWidth={1} {...INK_LINE} />

        {scarf ? (
          <>
            <path d={scarf.hood} fill={scarfFill} {...INK_LINE} />
            <path d={scarf.shade} fill="var(--ink)" fillOpacity={0.1} stroke="none" />
          </>
        ) : null}

        <circle cx={face.cx} cy={face.cy} r={face.r} fill="var(--wood)" {...INK_LINE} />
        {figure.hair && hairPaths(head, figure.hair).map((d) => <path key={d} d={d} fill={HAIR_FILL} {...INK_LINE} />)}
        {variant === "grandma" && (
          <g fill="var(--color-anar)" fillOpacity={0.45} stroke="none">
            <circle cx="12.4" cy="21.6" r="1" />
            <circle cx="19" cy="25.4" r="1" />
            <circle cx="25.6" cy="21.6" r="1" />
          </g>
        )}

        {/* the sphere catches the light at its upper right */}
        <ellipse
          cx={face.cx + face.r * 0.38}
          cy={face.cy - face.r * 0.42}
          rx={face.r * 0.26}
          ry={face.r * 0.17}
          fill="var(--surface-raised)"
          fillOpacity={0.35}
          stroke="none"
          transform={`rotate(32 ${face.cx + face.r * 0.38} ${face.cy - face.r * 0.42})`}
        />
        {figure.cheeks && (
          <g fill="var(--color-anar)" fillOpacity={0.3} stroke="none">
            <circle cx={face.cx - face.r * 0.5} cy={face.cy + face.r * 0.3} r={face.r * 0.15} />
            <circle cx={face.cx + face.r * 0.5} cy={face.cy + face.r * 0.3} r={face.r * 0.15} />
          </g>
        )}
      </svg>
    </span>
  );
}
