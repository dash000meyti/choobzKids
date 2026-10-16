import { AGE_STAGES, type AgeStageKey } from "@/lib/ages";
import { cn } from "@/lib/utils";

/*
 * Room scene kit (DESIGN.md §3.8): the stage behind the height-mark door and the /rooms
 * presets. One inline SVG in scene millimetres — 3200 × 2400, drawn in the same cabinet
 * oblique as every product drawing, S(x, y, z) = (x − 0.433z, −y − 0.25z) — so product
 * <img>s placed by `src/components/shop/room-slots.ts` stand on this floor at true scale.
 *
 * It is a stage, not a subject: flat tones, hairlines at low ink, one cultural note
 * (a geranium in a terracotta pot on the sill). Light comes from the upper right, so the
 * reveals and faces that look left sit in shade. Every colour is a theme token, so the room
 * dims by itself in the «لالایی» palette.
 *
 * Geometry (scene y grows downward):
 *   · back wall y 0 → 2080; the floor in front of it is 1280 mm deep (y 2080 → 2400)
 *   · window on the wall-end (left) side: sill at 1000 mm, pointed «جناغی» arch, lattice head
 *   · door at inline-start (right): casing 2480–2550, opening 2550–3150, head at 2000 mm;
 *     the kitchen counter (900 mm ⚑) stands 320 mm beyond the wall plane
 *   · variant "small" (9 m²): the back wall turns a corner at 2550 into a receding side wall
 *     that carries the door; the "kitchen" slot and the height marks belong to the default room
 *
 * The drawing is fixed, so its markup is assembled once from this geometry and injected as a
 * string: self-closing tags and a single RSC string instead of an element tree keep each
 * variant within the 4 KB inline budget (DESIGN.md §10.3, RSC double-payload rule).
 */

export const ROOM_VIEWBOX = { w: 3200, h: 2400 } as const;

/** Scene y where the back wall meets the floor. */
export const ROOM_FLOOR_Y = 2080;

/** Cabinet oblique, per mm of depth (DESIGN.md §3.7). */
export const OBLIQUE = { x: 0.433, y: 0.25 } as const;

/** Door casing and opening on the back wall (default variant), scene mm. */
export const ROOM_DOOR = { casingLeft: 2480, openingLeft: 2550, openingRight: 3150, headY: 80 } as const;

const W = ROOM_VIEWBOX.w;
const H = ROOM_VIEWBOX.h;
const FLOOR = ROOM_FLOOR_Y;
const FLOOR_DEPTH = (H - FLOOR) / OBLIQUE.y;
const WALL_THICKNESS = 220;
const SKIRT_TOP = FLOOR - 68;
const SMALL_CORNER_X = 2550;

const round = (n: number) => Math.round(n * 10) / 10;
const pct = (value: number, of: number) => `${Math.round((value / of) * 1000) / 10}%`;

/** Scene y of a height (mm) on the back wall. */
const onWall = (heightMm: number) => FLOOR - heightMm;

// ---------------------------------------------------------------- height marks

export type DoorMark = {
  key: AgeStageKey;
  label: string;
  heightCm: number;
  /** The pencil tick, in % of the stage box from its top-left corner; HTML labels go beside it. */
  top: string;
  tickLeft: string;
  tickRight: string;
};

const TICK = { from: 2452, to: 2546 };

/** Pencil ticks on the door casing at the WHO median heights ⚑ (AGE_STAGES). */
export const DOOR_MARKS: DoorMark[] = AGE_STAGES.map((stage) => ({
  key: stage.key,
  label: stage.markLabel,
  heightCm: stage.medianCm,
  top: pct(onWall(stage.medianCm * 10), H),
  tickLeft: pct(TICK.from, W),
  tickRight: pct(TICK.to, W),
}));

// ---------------------------------------------------------------- markup helpers

type Attrs = Record<string, string | number>;
const attrs = (a: Attrs) =>
  Object.entries(a)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join("");
const el = (name: string, a: Attrs) => `<${name}${attrs(a)}/>`;
const withClass = (cls: string): Attrs => (cls ? { class: cls } : {});
const path = (d: string, cls: string, extra: Attrs = {}) => el("path", { d, ...withClass(cls), ...extra });
const rect = (x: number, y: number, w: number, h: number, cls: string, extra: Attrs = {}) =>
  el("rect", { ...(x ? { x } : {}), ...(y ? { y } : {}), width: w, height: h, ...withClass(cls), ...extra });
const circles = (list: [number, number, number][]) => list.map(([cx, cy, r]) => el("circle", { cx, cy, r })).join("");
const group = (a: Attrs, body: string) => `<g${attrs(a)}>${body}</g>`;
const pattern = (id: string, a: Attrs, body: string) =>
  `<pattern id="${id}" patternUnits="userSpaceOnUse"${attrs(a)}>${body}</pattern>`;

/** Mixes a token toward the room's wall colour, so accents dim with the theme. */
const mix = (token: string, percent: number, base = "var(--surface)") => `color-mix(in srgb,var(${token}) ${percent}%,${base})`;

/*
 * Classes, scoped under .rk (the <style> of an inline SVG is global):
 *   w wall · pt paint (white trim, counter) · wd birch trim · s shade (style="fill-opacity" deepens it)
 *   o hairline outline · l hairline only · lf leaves · bl geranium blooms · pot terracotta
 */
const CSS =
  "<style>" +
  [
    ".rk .w{fill:var(--surface)}",
    ".rk .pt{fill:var(--surface-raised)}",
    ".rk .wd{fill:var(--wood-top)}",
    ".rk .s{fill:var(--ink);fill-opacity:.09}",
    ".rk .o,.rk .l{stroke:var(--ink);stroke-opacity:.34;stroke-width:1px;vector-effect:non-scaling-stroke}",
    ".rk .l{fill:none}",
    ".rk .lf{fill:var(--color-pesteh)}",
    ".rk .bl{fill:var(--accent)}",
    `.rk .pot{fill:${mix("--color-terracotta-ink", 76)}}`,
  ].join("") +
  "</style>";

/** Deeper shade on top of `s`, for the cut section of a wall. */
const DEEP = { style: "fill-opacity:.16" };

// ---------------------------------------------------------------- wall, floor

const DEFS_COMMON =
  // Straw in the kahgel plaster: a few short strokes per half-metre, barely there.
  pattern(
    "rk-st",
    { width: 620, height: 430 },
    path("M48 70l36 7M410 200l38-5M150 300l22 13", "", {
      stroke: "var(--ply-2)",
      "stroke-opacity": ".22",
      "stroke-width": 5,
    }),
  ) +
  // Floorboards run away from the viewer: vertical strips sheared 60° (the oblique's 30° recession).
  pattern(
    "rk-fl",
    { width: 450, height: 640, patternTransform: "skewX(60)" },
    rect(0, 0, 450, 640, "", { fill: "color-mix(in srgb,var(--ply-2) 40%,var(--wood-side))" }) +
      rect(150, 0, 150, 640, "s", { style: "fill-opacity:.04" }) +
      path("M0 0V640M150 0V640M300 0V640M0 214H150M150 362H300M300 286H450", "", {
        stroke: "var(--ink)",
        "stroke-opacity": ".15",
        "stroke-width": 3.5,
      }),
  ) +
  pattern(
    "rk-lt",
    { width: 80, height: 80, x: 20, y: 150 },
    path("M0 0L80 80M80 0L0 80", "", { stroke: "var(--wood-top)", "stroke-width": 8 }),
  );

const ROOM_SHELL = (wallRight: number) =>
  rect(0, 0, W, FLOOR, "w") +
  rect(0, 0, W, FLOOR, "", { fill: "url(#rk-st)" }) +
  rect(0, FLOOR, W, H - FLOOR, "", { fill: "url(#rk-fl)" }) +
  rect(0, FLOOR, W, 24, "s") +
  path(`M0 ${SKIRT_TOP}H${wallRight}V${FLOOR}H0Z`, "pt o");

// ---------------------------------------------------------------- window + geranium

const WIN = { left: 110, right: 650, mid: 380, sill: onWall(1000), spring: 420, apex: 150, frame: 55 };

function arch(left: number, right: number, spring: number, apex: number, bottom: number) {
  const mid = (left + right) / 2;
  const half = (right - left) / 2;
  const rise = spring - apex;
  const c1 = `${left} ${Math.round(spring - rise * 0.44)} ${Math.round(mid - half * 0.56)} ${Math.round(apex + rise * 0.2)}`;
  const c2 = `${Math.round(mid + half * 0.56)} ${Math.round(apex + rise * 0.2)} ${right} ${Math.round(spring - rise * 0.44)}`;
  return `M${left} ${bottom}V${spring}C${c1} ${mid} ${apex}C${c2} ${right} ${spring}V${bottom}Z`;
}

/** The opening is defined once (id rk-wo) and reused as the glass and as the sash's clip. */
const WIN_OPENING = arch(WIN.left, WIN.right, WIN.spring, WIN.apex, WIN.sill);
const WIN_OUTER = arch(WIN.left - WIN.frame, WIN.right + WIN.frame, WIN.spring, WIN.apex - WIN.frame * 1.2, WIN.sill);

/** The sash sits halfway into the wall: it shows shifted up-left inside the opening. */
const SASH = { dx: round(-OBLIQUE.x * (WALL_THICKNESS / 2)), dy: round(-OBLIQUE.y * (WALL_THICKNESS / 2)) };

/** A diamond pane of the arch lattice (cell 80, centred on a cell). */
const pane = (cx: number, cy: number, fill: string) => path(`M${cx} ${cy - 40}l40 40-40 40-40-40z`, "", { fill });

const WINDOW = (() => {
  const { left, right, mid, sill, spring, apex } = WIN;
  const sash = group(
    { transform: `translate(${SASH.dx} ${SASH.dy})` },
    rect(left, apex, right - left, spring - apex, "", { fill: "url(#rk-lt)" }) +
      // three panes of coloured glass in the head: the Orosi, quietly
      group(
        { opacity: ".5" },
        pane(mid, 230, "var(--color-zardchube)") + pane(mid - 80, 310, "var(--color-lapis)") + pane(mid + 80, 310, "#E59A84"),
      ) +
      path(`M${left} ${spring}H${right}M${mid} ${spring}V${sill}M${left} 760H${right}`, "", {
        stroke: "var(--wood-top)",
        "stroke-width": 16,
      }),
  );
  // the wall's thickness inside the opening: right reveal in shade, inner sill lit from above
  const rightReveal = path(`M${right} ${spring - 40}V${sill}l${SASH.dx} ${SASH.dy}V${spring - 40 + SASH.dy}z`, "s");
  const innerSill = path(`M${left} ${sill}H${right}l${SASH.dx} ${SASH.dy}H${left + SASH.dx}Z`, "wd o");
  const [l, r, dx, dy] = [left - 20, right + 20, round(OBLIQUE.x * 120), round(OBLIQUE.y * 120)];
  return (
    path(`${WIN_OUTER}M${l} ${sill}H${r}L${r + dx} ${sill + dy}H${l + dx}Z`, "wd o") +
    el("use", { href: "#rk-wo", fill: mix("--focus", 15, "var(--surface-raised)"), class: "o" }) +
    group({ "clip-path": "url(#rk-wc)" }, sash + rightReveal + innerSill) +
    // the sill board, 120 mm deep: lit top (drawn with the frame), shaded front
    path(`M${l + dx} ${sill + dy}H${r + dx}V${sill + dy + 40}H${l + dx}Z`, "o", { fill: "var(--wood-side)" })
  );
})();

/** شمعدانی in a terracotta pot, standing 60 mm in from the sill's front edge. */
const GERANIUM = (() => {
  const cx = 590;
  const rim = WIN.sill + 15 - 150;
  return (
    path(`M${cx - 8} ${rim}Q${cx - 14} ${rim - 120} ${cx - 40} ${rim - 186}M${cx + 6} ${rim}Q${cx + 20} ${rim - 100} ${cx + 50} ${rim - 160}`, "l", { style: "stroke-opacity:.55" }) +
    // back leaves catch the window light
    group({ class: "lf", style: "opacity:.55" }, circles([[cx - 74, rim - 66, 32], [cx + 66, rim - 72, 34], [cx + 2, rim - 96, 40]])) +
    group({ class: "lf o" }, circles([[cx - 42, rim - 30, 44], [cx + 42, rim - 34, 48]])) +
    // two umbels: three florets packed into a dome each
    group({ class: "bl" }, circles([[cx - 56, rim - 180, 18], [cx - 28, rim - 180, 18], [cx - 42, rim - 198, 18], [cx + 38, rim - 154, 14], [cx + 60, rim - 154, 14], [cx + 49, rim - 168, 14]])) +
    path(`M${cx - 66} ${rim + 34}h132l-16 116h-100zM${cx - 75} ${rim}h150l-7 34h-136z`, "pot o") +
    path(`M${cx - 66} ${rim + 34}h40l2 116h-26z`, "s")
  );
})();

// ---------------------------------------------------------------- door, kitchen

const DOOR_CLIP_W = ROOM_DOOR.openingRight - ROOM_DOOR.openingLeft;

/** Kitchen beyond the doorway: counter front 320 mm past the wall plane, 600 deep, 900 high ⚑. */
const KITCHEN = (() => {
  const base = round(FLOOR - OBLIQUE.y * 320);
  const front = base - 900;
  const back = round(front - OBLIQUE.y * 600);
  const x = 2550;
  // a band of 200 mm wall tiles above the counter
  const tiles = `M${x} ${back - 200}H3150` + [2650, 2850, 3050].map((tx) => `M${tx} ${back - 400}V${back}`).join("");
  return (
    rect(x, 0, 600, FLOOR, "pt", { opacity: ".6" }) +
    path(tiles, "l", { style: "stroke:var(--focus)" }) +
    rect(x, back, 600, front - back, "pt o") +
    rect(x, front, 600, base - front, "o", { fill: "var(--bubble)" }) +
    path(`M${x} ${back - 400}H3150M${x} ${front + 40}H3150M${x} ${base - 18}H3150M2860 ${front + 66}V${base - 46}M2846 ${front + 120}v70M2874 ${front + 120}v70`, "l")
  );
})();

const CLOSED_DOOR =
  rect(ROOM_DOOR.openingLeft, ROOM_DOOR.headY, DOOR_CLIP_W, FLOOR - ROOM_DOOR.headY, "wd") +
  path("M2620 190h460v760h-460zM2620 1070h460v880h-460z", "l") +
  el("circle", { cx: 2612, cy: 1130, r: 18, class: "pt o" });

function door(showKitchen: boolean, marks: boolean) {
  const { casingLeft, openingLeft, openingRight, headY } = ROOM_DOOR;
  // the wall's thickness, seen where it faces the viewer: the right reveal (in shade) and the threshold
  const through = { dx: round(-OBLIQUE.x * WALL_THICKNESS), dy: round(-OBLIQUE.y * WALL_THICKNESS) };
  const reveal = path(`M${openingRight} ${headY}V${FLOOR}l${through.dx} ${through.dy}V${headY + through.dy}z`, "s");
  const threshold = path(`M${openingLeft} ${FLOOR}H${openingRight}l${through.dx} ${through.dy}H${openingLeft}Z`, "pt o");
  const casing = path(
    `M${casingLeft} ${FLOOR}V${headY - 70}H${W + 20}V${FLOOR}H${openingRight}V${headY}H${openingLeft}V${FLOOR}Z`,
    "pt o",
  );
  // pencil: graphite grey, a touch heavier than the room's hairlines
  const ticks = DOOR_MARKS.map((m) => `M${TICK.from} ${onWall(m.heightCm * 10)}h${TICK.to - TICK.from}`).join("");
  return (
    group({ "clip-path": "url(#rk-dc)" }, (showKitchen ? KITCHEN : CLOSED_DOOR) + reveal + threshold) +
    // the casing stands proud of the plaster; light from the upper right drops its shadow to the left
    rect(casingLeft - 14, 0, 14, FLOOR, "s") +
    casing +
    (marks ? path(ticks, "l", { style: "stroke-opacity:.75;stroke-width:1.5px" }) : "")
  );
}

/** Small room: a point on the receding side wall, `s` mm from the corner toward the viewer. */
const onSide = (s: number, heightMm: number) => `${round(SMALL_CORNER_X + OBLIQUE.x * s)} ${round(FLOOR + OBLIQUE.y * s - heightMm)}`;
const sideQuad = (s1: number, s2: number, h1: number, h2: number) =>
  `M${onSide(s1, h1)}L${onSide(s1, h2)}L${onSide(s2, h2)}L${onSide(s2, h1)}Z`;

function sideWall(showKitchen: boolean) {
  const frontX = round(SMALL_CORNER_X + OBLIQUE.x * FLOOR_DEPTH);
  // the side wall plus, beyond its front edge, the wall's cut section (the dollhouse view)
  const face = `M${SMALL_CORNER_X} 0H${W}V${H}H${frontX}L${SMALL_CORNER_X} ${FLOOR}Z`;
  const opening = sideQuad(360, 1140, 0, 2000);
  return (
    path(face, "w") +
    path(face, "s") +
    path(sideQuad(0, FLOOR_DEPTH, 0, 68), "pt o") +
    path(sideQuad(290, 1210, 0, 2070), "pt o") +
    (showKitchen
      ? path(opening, "pt o", { opacity: ".7" }) + path(sideQuad(360, 460, 0, 2000), "s")
      : path(opening, "wd o") + path(sideQuad(450, 1050, 1100, 1900) + sideQuad(450, 1050, 160, 980), "l")) +
    path(`M${SMALL_CORNER_X} 0V${FLOOR}M${frontX} 0V${H}`, "l") +
    rect(frontX, 0, W - frontX, H, "s", DEEP)
  );
}

// ---------------------------------------------------------------- assembly

function markup(small: boolean, showKitchen: boolean, marks: boolean) {
  const defs =
    "<defs>" +
    DEFS_COMMON +
    el("path", { id: "rk-wo", d: WIN_OPENING }) +
    `<clipPath id="rk-wc">${el("use", { href: "#rk-wo" })}</clipPath>` +
    (small
      ? ""
      : `<clipPath id="rk-dc">${rect(ROOM_DOOR.openingLeft, ROOM_DOOR.headY, DOOR_CLIP_W, FLOOR - ROOM_DOOR.headY, "")}</clipPath>`) +
    "</defs>";
  const wallRight = small ? SMALL_CORNER_X : ROOM_DOOR.casingLeft;
  return CSS + defs + ROOM_SHELL(wallRight) + WINDOW + GERANIUM + (small ? sideWall(showKitchen) : door(showKitchen, marks));
}

const cache = new Map<string, string>();
function backdropMarkup(small: boolean, showKitchen: boolean, marks: boolean) {
  const key = `${small}-${showKitchen}-${marks}`;
  let svg = cache.get(key);
  if (!svg) {
    svg = markup(small, showKitchen, marks);
    cache.set(key, svg);
  }
  return svg;
}

type RoomBackdropProps = {
  /** "small" = the 9 m² preset: a corner and a side wall with the door, no kitchen slot. */
  variant?: "default" | "small";
  /** Kitchen counter through the doorway; otherwise a closed door. */
  showKitchen?: boolean;
  /** Pencil height marks on the door casing (default variant). Labels are HTML: see DOOR_MARKS. */
  doorMarks?: boolean;
  className?: string;
};

/**
 * The room behind the furniture. Render it at the full size of a 4:3 stage box
 * (`aspect-[4/3]`); place pieces with `placeOnStage` / `placePerson` from room-slots.
 */
export function RoomBackdrop({ variant = "default", showKitchen = true, doorMarks = false, className }: RoomBackdropProps) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className={cn("rk block", className)}
      dangerouslySetInnerHTML={{ __html: backdropMarkup(variant === "small", showKitchen, doorMarks) }}
    />
  );
}
