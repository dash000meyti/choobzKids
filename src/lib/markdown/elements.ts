import type { IllustrationKey } from "@/db/seed/types";

/*
 * Custom elements the pipeline emits into hast for the renderer's component map. Each block of
 * docs/CONTENT-FORMAT.md becomes one `cz-*` element whose properties are the block's props, so
 * the transforms (here) and the React components (src/components/mag) share one contract.
 */

export const EL = {
  callout: "cz-callout",
  myth: "cz-myth",
  mythFace: "cz-myth-face",
  pullQuote: "cz-quote",
  product: "cz-product",
  products: "cz-products",
  steps: "cz-steps",
  step: "cz-step",
  checklist: "cz-checklist",
  check: "cz-check",
  illustration: "cz-illustration",
  term: "cz-term",
  /** «جدول:» paragraph in mdast; moved into its table as <caption> by the rehype pass. */
  caption: "cz-caption",
} as const;

export type CalloutKind = "tip" | "note" | "warning" | "workshop" | "expert";

/** The plain label each callout prints (DESIGN.md §7.3); also the title when the author gave none. */
export const CALLOUT_LABELS: Record<CalloutKind | "myth", string> = {
  tip: "نکته",
  note: "توضیح",
  warning: "نکتهٔ ایمنی",
  workshop: "از کارگاه چوبز",
  expert: "نگاه متخصص",
  myth: "باور رایج",
};

/** `> [!MARKER]` → kind (docs/CONTENT-FORMAT.md «Callouts»). */
export const CALLOUT_MARKERS: Record<string, CalloutKind | "myth"> = {
  TIP: "tip",
  NOTE: "note",
  WARNING: "warning",
  WORKSHOP: "workshop",
  EXPERT: "expert",
  MYTH: "myth",
};

/** GitHub's other alert types, accepted so pasted content still renders. */
export const CALLOUT_ALIASES: Record<string, CalloutKind> = { IMPORTANT: "note", CAUTION: "warning" };

export type MythSide = "belief" | "fact";
export type IllustrationView = "assembled" | "exploded" | "ortho" | "flat";

/** Prop shapes per element, as the component map receives them (plus `children`). */
export type ElementProps = {
  [EL.callout]: { kind: CalloutKind; title?: string };
  [EL.myth]: { title?: string };
  [EL.mythFace]: { side: MythSide };
  [EL.pullQuote]: { cite?: string };
  [EL.product]: { slug: string; why?: string };
  /** Comma-separated product slugs, in display order. */
  [EL.products]: { slugs: string };
  [EL.steps]: { count: number };
  [EL.step]: { index: number; title?: string };
  /**
   * `first` = storage index of the first item; indexes run on across the lists of one body.
   * `preticked` = comma-separated indexes the author wrote as «- [x]».
   */
  [EL.checklist]: { slug: string; first: number; count: number; preticked: string };
  [EL.check]: { index: number; ticked: boolean };
  [EL.illustration]: { name: string; caption?: string; view?: IllustrationView };
  [EL.term]: { href: string; term: string; definition?: string; auto?: boolean };
};

/** Manifest keys a body may embed with `::illustration` (src/db/seed/types.ts → IllustrationKey). */
export const ILLUSTRATION_KEYS = [
  "learning-tower",
  "pikler-triangle",
  "pikler-arch",
  "swedish-ladder",
  "climbing-hex",
  "balance-board",
  "front-facing-bookshelf",
  "wall-art-roll",
  "kids-table-chair",
  "montessori-shelf",
  "rainbow-stacker",
  "duck-pull-toy",
  "wooden-blocks",
  "room-set",
] as const satisfies readonly IllustrationKey[];

/* Compile-time guard: a new IllustrationKey must be added above too. */
type MissingIllustrationKey = Exclude<IllustrationKey, (typeof ILLUSTRATION_KEYS)[number]>;
const allIllustrationKeysListed: [MissingIllustrationKey] extends [never] ? true : never = true;
void allIllustrationKeysListed;

export const ILLUSTRATION_VIEWS: readonly IllustrationView[] = ["assembled", "exploded", "ortho", "flat"];
