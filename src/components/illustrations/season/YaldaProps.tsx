import { ARTBOARD, LEAN_PIVOT, POSES, type Point, type TatiPoseName } from "../tati/geometry";

/*
 * Yalda skin (DESIGN.md §1.4): Tati's knitted scarf and the pomegranate that
 * rests by the cover tower. Story layer only — never next to a price.
 */

const INK_LINE = { vectorEffect: "non-scaling-stroke" } as const;

/* ---------- Tati's scarf ---------- */

const round = (n: number) => Math.round(n * 100) / 100;

function polar(r: number, deg: number): Point {
  const a = (deg * Math.PI) / 180;
  return [round(r * Math.cos(a)), round(r * Math.sin(a))];
}

const pt = ([x, y]: Point) => `${x} ${y}`;

/**
 * The collar, in head-centred units (head r 7.5): a knitted band around the
 * bottom of the head, from under the beak (150°) to the nape (24°), straddling
 * the line where head meets body. Its ends are softly rounded.
 */
const COLLAR = (() => {
  const [outer, inner, from, to] = [8.7, 5.9, 150, 24];
  const [o1, o2, i2, i1] = [polar(outer, from), polar(outer, to), polar(inner, to), polar(inner, from)];
  const backEnd: Point = [round(o2[0] + 1.1), round((o2[1] + i2[1]) / 2)];
  const frontEnd: Point = [round(i1[0] - 1), round((i1[1] + o1[1]) / 2)];
  return `M${pt(o1)}A${outer} ${outer} 0 0 0 ${pt(o2)}Q${pt(backEnd)} ${pt(i2)}A${inner} ${inner} 0 0 1 ${pt(i1)}Q${pt(frontEnd)} ${pt(o1)}Z`;
})();

/** Knit ribs across the collar. */
const RIBS = [138, 122, 106, 90, 74, 58, 42].map((deg) => `M${pt(polar(6.4, deg))}L${pt(polar(8.2, deg))}`).join("");

/** Tails knotted at the nape: streaming back while he rolls, hanging when he is still. */
const TAILS = {
  flow: {
    tails: [
      "M5.6 4.6C8.6 3.4 11.4 4.8 14.6 3.6L15.2 6.2C12 7.4 9.2 6.2 6.4 7.2Z",
      "M5.8 6.4C8.2 7.2 10.4 8.8 13 8.6L12.8 11C10 11.2 7.6 9.4 5.6 8.6Z",
    ],
    stripes: ["M12.2 4.3 12.8 6.9", "M10.6 8.5 10.4 10.9"],
    fringe: "M14.9 4.9h1.5M15.3 6.2h1.4M13.1 9.8h1.4",
  },
  hang: {
    tails: [
      "M5.8 4.4C7.4 7 7.6 10 9.4 12.8L7.2 14C5.6 11 5.4 8 4.2 5.6Z",
      "M6.6 4.8C8.8 6.8 10.2 9 12.4 10.6L10.8 12.6C8.6 10.8 7.2 8.6 5.6 6.8Z",
    ],
    stripes: ["M5.6 10.8 7.8 9.6", "M9.2 9.9 10.8 8.3"],
    fringe: "M8.3 13.4l.6 1.4M9.4 13l.7 1.2M11.6 11.6l1.1 1",
  },
} as const;

/**
 * Yalda scarf for Tati: an overlay SVG on the same 48 × 40 artboard as the
 * body. It follows the pose's head position and lean, not the head's turn —
 * the scarf sits on the neck, which never turns.
 */
export function YaldaScarf({ pose, className }: { pose: TatiPoseName; className?: string }) {
  const spec = POSES[pose];
  const [hx, hy] = spec.head.center;
  const lean = spec.lean ? `rotate(${spec.lean} ${LEAN_PIVOT[0]} ${LEAN_PIVOT[1]}) ` : "";
  const tails = TAILS[pose === "rolling" ? "flow" : "hang"];

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
      <g transform={`${lean}translate(${hx} ${hy})`}>
        {tails.tails.map((d) => (
          <path key={d} d={d} fill="var(--thread)" {...INK_LINE} />
        ))}
        <path d={tails.stripes.join("")} stroke="var(--color-mahtab)" strokeWidth={0.9} strokeLinecap="butt" />
        <path d={tails.fringe} stroke="var(--thread)" strokeWidth={0.6} />
        <path d={COLLAR} fill="var(--thread)" {...INK_LINE} />
        <path d={RIBS} stroke="var(--accent-press)" strokeOpacity={0.75} strokeWidth={0.45} />
        {/* the knot */}
        <circle cx={5.8} cy={5.2} r={1.5} fill="var(--thread)" {...INK_LINE} />
      </g>
    </svg>
  );
}

/* ---------- Pomegranate ---------- */

/** Seeds in the split half: [x, y] centres, r 0.9, packed inside the pith. */
const ARILS: Point[] = [
  [25.4, 18.4], [27.5, 17.9], [29.5, 18.6],
  [24.6, 20.4], [26.6, 20.1], [28.6, 20.4], [30.5, 20.8],
  [25.4, 22.4], [27.5, 22.3], [29.5, 22.8],
  [26.6, 24], [28.5, 24.2],
];

/**
 * A pomegranate for the Yalda cover (§1.4), with an optional split half that
 * shows its seeds. The fruit keeps its own reds in every light; the outline
 * follows --ink at the same non-scaling width as Tati, so the two sit together.
 */
export function Pomegranate({ split = true, className }: { split?: boolean; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${split ? 34 : 24} 28`}
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="var(--ink)"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeWidth: "var(--tati-stroke, 1.5px)" }}
    >
      {/* whole fruit, crown up, lit from the upper right */}
      <path
        d="M12.2 6.6C17.4 6.4 21.6 10.4 21.6 16 21.6 21.8 17.4 26.4 11.8 26.4 6.4 26.4 2.2 22.2 2.2 16.4 2.2 10.8 6.6 6.8 12.2 6.6Z"
        fill="var(--color-anar)"
        {...INK_LINE}
      />
      <path d="M5 20.8C6.4 23.8 9 25.2 12.2 25" stroke="var(--color-anar-deep)" strokeWidth={1.4} strokeOpacity={0.55} />
      <path d="M15.4 9.6C17.6 10.6 19.2 12.6 19.6 15" stroke="var(--color-ember)" strokeWidth={1.3} />
      <path d="M9.6 7.4 9.4 4.2 10.9 5.2 12.1 3.2 13.3 5.2 14.8 4.2 14.6 7.2" fill="var(--color-anar-deep)" {...INK_LINE} />

      {split && (
        <>
          {/* split half lying on its side: rind, pale pith, ruby seeds */}
          <path
            d="M21.8 20.8C21.8 16.8 24.6 14.6 27.6 14.6 30.8 14.6 33.2 17.2 33.2 20.8 33.2 24.6 30.4 26.6 27.6 26.6 24.4 26.6 21.8 24.4 21.8 20.8Z"
            fill="var(--color-anar)"
            {...INK_LINE}
          />
          <path
            d="M23.4 20.9C23.4 18 25.4 16.2 27.6 16.2 30 16.2 31.8 18.2 31.8 21 31.8 23.8 29.8 25.3 27.6 25.3 25.2 25.3 23.4 23.6 23.4 20.9Z"
            fill="var(--color-kraft)"
            stroke="none"
          />
          <g fill="var(--color-anar)">
            {ARILS.map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={0.9} stroke="none" />
            ))}
          </g>
          <g fill="var(--color-mahtab)" opacity={0.85}>
            {ARILS.filter((_, i) => i % 3 === 1).map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x + 0.3} cy={y - 0.3} r={0.26} stroke="none" />
            ))}
          </g>
        </>
      )}
    </svg>
  );
}
