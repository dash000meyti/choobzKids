/*
 * Parts-manifest format (DESIGN.md §3.7). One manifest per product, authored in
 * millimetres from the real dimensions (or, later, from the workshop's DXF files).
 *
 * World axes: x → right, y ↑ up, z → away from the viewer. The front of the
 * product faces the viewer (z = 0) and stands on the floor (y = 0).
 *
 * 2D outlines are written in each part's local (u, v) frame, also in mm, with v
 * pointing up like y. Helpers in `../project` build the usual shapes (rounded
 * polygons with router-bit corners, stadium hand-holes, arches, slats).
 */

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

/** The four drawings built from every manifest. */
export type View = "assembled" | "exploded" | "ortho" | "flat";

/**
 * Plane of a flat part. Local axes: XY → (u = x, v = y), YZ → (u = z, v = y),
 * XZ → (u = x, v = z). A custom plane gives its own unit axes; the thickness
 * grows along `u × v` (right-handed), so pick the order that puts it on the
 * side you want.
 */
export type Plane = "XY" | "YZ" | "XZ" | { readonly u: Vec3; readonly v: Vec3 };

/**
 * Colour roles. Faces are lit from the upper right; the renderer picks the face
 * tone itself. `ink` is the line colour (light in dark mode); `char` and `paper`
 * are physical dark / light paint that keeps its colour in both themes (a burnt
 * eye and its catch-light); `anar` and `asal` are painted details.
 */
export type Tone =
  | "wood"
  | "wood-top"
  | "wood-side"
  | "ply-1"
  | "ply-2"
  | "ply-3"
  | "ink"
  | "char"
  | "paper"
  | "anar"
  | "asal";

/** Extra artwork on a part's visible face, in its local (u, v) frame. */
export type Detail = {
  readonly d: string;
  readonly fill?: Tone;
  readonly stroke?: Tone;
  /** Stroke width in screen px at card size (non-scaling). Default 1. */
  readonly width?: number;
  readonly opacity?: number;
};

type PartBase = {
  /** Unique within the manifest; referenced by `exploded`, `dowels` and `platform.parts`. */
  readonly id: string;
  /** Painter's order for the oblique views: lower is drawn first (further back). Ties fall back to depth. */
  readonly order?: number;
  /** Draw this part only in these views (e.g. a seated platform without its tabs). */
  readonly only?: readonly View[];
  /** Leave this part out of these views. */
  readonly hideIn?: readonly View[];
  /** Whether the part's floor contact feeds the contact shadow. Default true. */
  readonly shadow?: boolean;
  /**
   * For an assembled-only stand-in (a platform drawn without the tabs hidden in
   * its slots): the part it represents. The layered stage keeps the stand-in
   * visible when exploded and moves it with that part's offset.
   */
  readonly explodesAs?: string;
};

type SheetPlacement = {
  /** Cut from the plywood sheet (flat view). Number = how many identical layers are cut. Default: true for panels. */
  readonly sheet?: boolean | number;
  /**
   * Top-left corner of the part's bounding box on the sheet, in mm (y down).
   * Auto-nested when omitted; place every part of a manifest or none, since
   * auto-nesting does not steer around hand-placed parts.
   */
  readonly sheetAt?: { readonly x: number; readonly y: number; readonly rot?: 0 | 90 };
};

type FaceOptions = {
  /** Path data of through-holes, in the same frame (even-odd fill). */
  readonly holes?: string;
  /** `wood` = a broad face; `edge` = the face itself is end grain / laminations (ply-1 + details). */
  readonly face?: "wood" | "edge";
  /** What the swept thickness shows: `ply` strata (cut plywood) or a plain `wood` surface. */
  readonly band?: "ply" | "wood";
  /** Hand-placed grain strokes on the visible face (3–7 per large face, along the long axis). */
  readonly grain?: string;
  readonly details?: readonly Detail[];
  /** Number of stripes in the ply band; derived from the band's drawn width when omitted. */
  readonly strata?: number;
};

/** A flat part cut from sheet stock: an outline in a plane with a thickness. */
export type PanelPart = PartBase &
  SheetPlacement &
  FaceOptions & {
    readonly kind: "panel";
    readonly plane: Plane;
    /** World position of the local (0, 0). */
    readonly origin: Vec3;
    /** Thickness along the plane normal. 0 draws only the face (a flush inlay). */
    readonly t: number;
    readonly outline: string;
  };

/** A profile drawn in XY and extruded along z (balance board, rainbow arcs, duck body). */
export type ExtrusionPart = PartBase &
  SheetPlacement &
  FaceOptions & {
    readonly kind: "extrusion";
    readonly plane?: "XY";
    readonly origin: Vec3;
    readonly depth: number;
    readonly profile: string;
  };

/** A cylinder: rungs, dowels, rails, axles, a paper roll. */
export type RodPart = PartBase & {
  readonly kind: "rod";
  readonly from: Vec3;
  readonly to: Vec3;
  /** Diameter in mm. */
  readonly d: number;
  /** Tone of the visible end (end grain). Default `wood-side`. */
  readonly cap?: Tone;
  /** The visible end sits flush on a face drawn later (a through-rung): paint it after everything else. */
  readonly capOnTop?: boolean;
  /**
   * Span of the rod (mm from `from`) left showing between the parts it passes
   * through. Assembled and ortho views draw the body over this span only, so
   * the hidden tenons never paint over a panel; the exploded view shows the whole rod.
   */
  readonly exposed?: readonly [number, number];
};

/** A string or cord: a cubic Bézier through world points (1 + 3n points). */
export type CordPart = PartBase & {
  readonly kind: "cord";
  readonly points: readonly Vec3[];
  readonly tone?: Tone;
  /** Stroke width in screen px at card size. Default 1.5. */
  readonly width?: number;
};

export type Part = PanelPart | ExtrusionPart | RodPart | CordPart;

/** Which `products.dimensions` value a dimension line annotates (`extra.<Persian key>` for extras). */
export type DimKey = "widthCm" | "heightCm" | "depthCm" | `extra.${string}`;

/**
 * A dimension line in the ortho view. `axis` is the world axis it measures
 * (w = x, h = y, d = z), from `from` to `to` in mm. Width lines sit under the
 * front elevation, depth lines under the side elevation, height lines beside
 * the elevation named by `view` (front: default).
 */
export type DimSpec = {
  readonly key: DimKey;
  readonly axis: "w" | "h" | "d";
  readonly from: number;
  readonly to: number;
  readonly view?: "front" | "side";
};

/** A dashed assembly line in the exploded view: from `at` on `part` to the same point on `with`. */
export type Dowel = {
  readonly at: Vec3;
  readonly part: string;
  /** The part it joins; omitted = a part that does not move. */
  readonly with?: string;
};

export type Manifest = {
  readonly key: string;
  /** `dxf` once the workshop's cut files exist («طرح دقیق از روی نقشهٔ برش»), else «طرح از روی ابعاد واقعی». */
  readonly source: "measured" | "dxf";
  /** Placeholder geometry waiting for its real manifest. */
  readonly stub?: boolean;
  /** Overall size in mm along x, y, z (as drawn). */
  readonly size: { readonly w: number; readonly h: number; readonly d: number };
  /** Sheet used by the flat (nesting) view. Default 2440 × 1220 × 18. */
  readonly sheet?: { readonly w: number; readonly h: number; readonly t: number };
  readonly parts: readonly Part[];
  /** World-mm offsets per part id for the exploded view. */
  readonly exploded?: Readonly<Record<string, Vec3>>;
  readonly dowels?: readonly Dowel[];
  readonly dims: readonly DimSpec[];
  readonly anchors?: {
    /** [x, y, z, width, height] of the engraving plate's front face, world mm. */
    readonly engravePlate?: readonly [number, number, number, number, number];
    readonly platformLevels?: readonly number[];
  };
  /** Parts that move together when the platform level changes. `level` is the height they are authored at. */
  readonly platform?: {
    readonly parts: readonly string[];
    readonly level: number;
    readonly levels: readonly number[];
  };
  /** Alternative poses (e.g. the Pikler arch flipped into a rocker). Built as `{key}-assembled-{pose}.svg`. */
  readonly poses?: Readonly<Record<string, { readonly flipY?: boolean }>>;
  /** Extra finishes built as static files besides natural (e.g. `white`). */
  readonly finishes?: readonly string[];
};
