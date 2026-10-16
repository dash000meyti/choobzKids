import { BODY_GRAIN, PLATFORM, POSES, WHEELS, WING, duckOutline } from "./tati/geometry";

/*
 * The CHOOBZ wordmark: a rounded geometric uppercase, drawn as monoline
 * strokes on a 24-unit cap height, like letters routed out of ply with a
 * round bit (nothing in the workshop is sharp). The duck-on-cart mark is the
 * logo's line drawing, built on Tati's own construction so the two always
 * match. Everything is currentColor: the header, the night footer and print
 * all colour it from text colour.
 */

const CAP = 24;
const LETTER_STROKE = 4;

/** Letters as [x offset, path] on a 0–24 cap box; offsets carry the optical spacing (rounds sit closer). */
const LETTERS: readonly [number, string][] = [
  [0, "M18.69 4.57A10 10 0 1 0 18.69 19.43"], // C
  [25.7, "M2 2V22M18 2V22M2 12H18"], // H
  [50.2, "M22 12A10 10 0 1 0 2 12 10 10 0 1 0 22 12Z"], // O
  [77.2, "M22 12A10 10 0 1 0 2 12 10 10 0 1 0 22 12Z"], // O
  [105.7, "M2 11.5H10A5.25 5.25 0 0 1 10 22H2V2H9.5A4.75 4.75 0 0 1 9.5 11.5H2"], // B
  [126.9, "M2 2H16L2 22H16"], // Z
];
const LETTERS_WIDTH = 144.9;

/** The mark sits on Tati's 48 × 40 artboard, scaled to 1.5 × the cap height. */
const MARK_SCALE = 0.9;
const MARK = { width: 48 * MARK_SCALE, height: 40 * MARK_SCALE };
const GAP = 8;

function Letters({ y }: { y: number }) {
  return (
    <g transform={`translate(0 ${y})`} strokeWidth={LETTER_STROKE}>
      {LETTERS.map(([x, d], i) => (
        <path key={i} d={d} transform={`translate(${x} 0)`} />
      ))}
    </g>
  );
}

/* Line art has no fills to hide overlaps, so the mark's beak and wheels are
   drawn only where they show: the beak from the head's edge, the wheels below the cart. */
const MARK_BEAK = "M-7.4-1.2C-8.6-1.2-9.8-1.5-10.8-1.3-12-1.1-12.3.8-11.2 1.5-10 2.2-8.4 2.4-7.17 2.2";
const MARK_WHEEL_R = WHEELS.radius - 0.4;

function wheelBelowCart(cx: number, cy: number) {
  const bottom = PLATFORM.y + PLATFORM.height;
  const half = Math.sqrt(MARK_WHEEL_R ** 2 - (cy - bottom) ** 2);
  return `M${round(cx - half)} ${bottom}A${MARK_WHEEL_R} ${MARK_WHEEL_R} 0 1 0 ${round(cx + half)} ${bottom}`;
}

/** The duck-on-cart mark in line: outline, wing, grain, cart and two wheels. One colour. */
function Mark({ x, y }: { x: number; y: number }) {
  const { center: head, tilt } = POSES.waiting.head;
  return (
    <g transform={`translate(${x} ${y}) scale(${MARK_SCALE})`} strokeWidth={2.6}>
      <path d={MARK_BEAK} transform={`translate(${head[0]} ${head[1]}) rotate(${tilt})`} />
      <path d={duckOutline(head)} />
      <path d={WING} />
      <g strokeWidth={1.2} strokeOpacity={0.4}>
        {BODY_GRAIN.slice(1).map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <circle cx={head[0] - 1.1} cy={head[1] - 0.9} r={1.8} fill="currentColor" stroke="none" />
      <rect x={PLATFORM.x} y={PLATFORM.y} width={PLATFORM.width} height={PLATFORM.height} rx={PLATFORM.radius} />
      {[WHEELS.front, WHEELS.back].map(({ cx, cy }) => (
        <g key={cx}>
          <path d={wheelBelowCart(cx, cy)} />
          <circle cx={cx} cy={cy} r={1.9} fill="currentColor" stroke="none" />
        </g>
      ))}
    </g>
  );
}

type WordmarkProps = {
  className?: string;
  /** Include the duck-on-cart mark (default). */
  withMark?: boolean;
  /** Mark above the letters, as on the Instagram avatar; otherwise the mark sits at inline-start (right). */
  stacked?: boolean;
};

/**
 * Inline SVG wordmark. Decorative: the caller supplies the accessible name,
 * e.g. `<Link href="/" aria-label="چوبز کیدز، صفحهٔ اصلی"><Wordmark className="h-8 w-auto" /></Link>`.
 * The width/height attributes are only a default size; size it with CSS.
 */
export function Wordmark({ className, withMark = true, stacked = false }: WordmarkProps) {
  let width = LETTERS_WIDTH;
  let height = CAP;
  let lettersY = 0;
  let mark: { x: number; y: number } | null = null;

  if (withMark && stacked) {
    width = LETTERS_WIDTH;
    height = MARK.height + 6 + CAP;
    lettersY = MARK.height + 6;
    mark = { x: (LETTERS_WIDTH - MARK.width) / 2, y: 0 };
  } else if (withMark) {
    width = LETTERS_WIDTH + GAP + MARK.width;
    height = MARK.height;
    lettersY = (MARK.height - CAP) / 2 + 1.5;
    mark = { x: LETTERS_WIDTH + GAP, y: 0 };
  }

  return (
    <svg
      viewBox={`-2 -2 ${round(width + 4)} ${round(height + 4)}`}
      width={round(width + 4)}
      height={round(height + 4)}
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Letters y={lettersY} />
      {mark && <Mark x={mark.x} y={mark.y} />}
    </svg>
  );
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
