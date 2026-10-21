import type { CSSProperties } from "react";
import { getManifest } from "@/components/illustrations/manifests";
import { illustrationFrame } from "@/components/illustrations/sizes";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { inputClasses } from "@/components/ui/TextInput";
import { getEngraver } from "@/db/queries/home-story";
import { getSettings } from "@/db/queries/settings";
import { formatToman, toFaDigits } from "@/lib/format";
import { SITE } from "@/lib/seo";
import { cn, illustrationUrl } from "@/lib/utils";
import { EngraverIsland, type StoryCardTemplate } from "./EngraverIsland";
import styles from "./NameEngraver.module.css";

/*
 * «اسمش رو روی چوب حک کن» (DESIGN.md §1.3 signature 3, §5.7). The learning tower's top step in
 * ortho front, drawn to the manifest's engraving plate (414 × 60 mm between the side panels,
 * under the tread nose), with an example name burnt in. The mother types her child's name and,
 * after a pause, the workshop laser burns it right to left (EngraverIsland, loaded on first
 * focus or pointer). Without JS the field is a GET form to the product page with `engrave=`.
 * The preview is decoration (aria-hidden); the field itself carries the name.
 */

const TITLE_ID = "engraver-title";
const FORM_ID = "engraver-form";
const STAGE_ID = "engraver-stage";
const INPUT_ID = "engraver-name";
const EXAMPLE_NAME = "آیلین";

/* Stage drawing in mm, 16:5: the plate face sits between two side-panel edges, under the tread. */
const VIEW = { w: 480, h: 150 } as const;
const FACE = { x: 33, y: 45, w: 414, h: 60 } as const;
const SIDE_W = 18;

const pct = (n: number, of: number) => `${(n / of) * 100}%`;

/** Ply strata on a cut edge: thin alternating veneer lines along the edge's length. */
function strata(x: number, y: number, w: number, h: number, along: "x" | "y") {
  const lines = [0.25, 0.5, 0.75].map((f, i) => {
    const d = along === "y" ? `M${x + w * f} ${y}V${y + h}` : `M${x} ${y + h * f}H${x + w}`;
    return <path key={i} d={d} stroke={i === 1 ? "var(--ply-3)" : "var(--ply-2)"} strokeWidth={0.9} />;
  });
  return <g opacity={0.8}>{lines}</g>;
}

function PlateDrawing() {
  const { x, y, w, h } = FACE;
  const right = x + w;
  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className={styles.drawing}
      focusable="false"
      fill="none"
      stroke="var(--ink)"
      strokeLinejoin="round"
    >
      {/* the tower's inside, in shadow below the step */}
      <rect x={x} y={y + h} width={w} height={VIEW.h - y - h} fill="rgb(var(--shadow-rgb) / 0.16)" stroke="none" />
      {/* side panels, seen on their front edges */}
      {[x - SIDE_W, right].map((sx) => (
        <g key={sx}>
          <rect x={sx} y={-4} width={SIDE_W} height={VIEW.h + 8} rx={3} fill="var(--ply-1)" className={styles.line} />
          {strata(sx, -4, SIDE_W, VIEW.h + 8, "y")}
        </g>
      ))}
      {/* the apron: the plate itself */}
      <rect x={x} y={y} width={w} height={h} rx={3} fill="var(--wood)" className={styles.line} />
      <path
        d={`M${x + 22} ${y + 37}Q${x + 200} ${y + 34} ${x + 392} ${y + 31}M${x + 54} ${y + 16}Q${x + 210} ${y + 19} ${x + 362} ${y + 21}M${x + 120} ${y + 50}Q${x + 250} ${y + 48} ${x + 320} ${y + 51}`}
        stroke="var(--ply-2)"
        strokeOpacity={0.35}
        strokeWidth={0.9}
      />
      {/* the tread nose above it, and the shadow it throws on the plate */}
      <rect x={x} y={y + 1} width={w} height={7} fill="rgb(var(--shadow-rgb) / 0.12)" stroke="none" />
      <rect x={x} y={y - SIDE_W} width={w} height={SIDE_W} rx={3} fill="var(--ply-1)" className={styles.line} />
      {strata(x, y - SIDE_W, w, SIDE_W, "x")}
    </svg>
  );
}

/** One copy of the name for a burn layer; the island keeps all three in step. */
function NameLayer({ layer, className }: { layer: "pencil" | "char" | "glow"; className: string }) {
  return (
    <span data-layer={layer} className={cn(styles.layer, className)}>
      <svg viewBox={`0 0 ${FACE.w} ${FACE.h}`} className="block size-full overflow-visible" focusable="false">
        <text
          x={FACE.w / 2}
          y={FACE.h / 2}
          direction="rtl"
          textAnchor="middle"
          dominantBaseline="central"
          className={styles.name}
          style={{ fontSize: 38, fontVariationSettings: '"KSHD" 150' } as CSSProperties}
        >
          {EXAMPLE_NAME}
        </text>
      </svg>
    </span>
  );
}

/** Where the plate sits inside the static tower drawing, for the 1080 × 1920 story card. */
function storyTemplate(): StoryCardTemplate | null {
  const manifest = getManifest("learning-tower");
  const plate = manifest?.anchors?.engravePlate;
  if (!plate) return null;
  const frame = illustrationFrame("learning-tower", "assembled");
  const [px, py, , pw, ph] = plate;
  // The assembled drawing keeps the front plane (z = 0) undistorted: x stays, y flips.
  return {
    src: illustrationUrl("learning-tower", "assembled"),
    width: frame.width,
    height: frame.height,
    plate: [
      (frame.originX + px) / frame.width,
      (frame.originY - (py + ph)) / frame.height,
      pw / frame.width,
      ph / frame.height,
    ],
  };
}

export async function NameEngraver() {
  const [engraver, settings] = await Promise.all([getEngraver(), getSettings()]);
  if (!engraver) return null;
  const { orderable, priceToman, maxChars, product } = engraver;
  const faceBox: CSSProperties = {
    left: pct(FACE.x, VIEW.w),
    top: pct(FACE.y, VIEW.h),
    width: pct(FACE.w, VIEW.w),
    height: pct(FACE.h, VIEW.h),
  };

  return (
    <section aria-labelledby={TITLE_ID} className="paper">
      <div className={cn("mx-auto max-w-page px-gutter py-section", styles.spread)}>
        <SectionHeader
          id={TITLE_ID}
          kicker="حالا نوبت شماست"
          title="اسمش رو روی چوب حک کن"
          sub="اسم کوچولوت رو بنویس و ببین لیزرِ کارگاه چطور، از راست به چپ، روی پلهٔ برج یادگیری حکش می‌کنه."
          className={styles.header}
        />

        <div className={styles.stageSlot}>
          <div id={STAGE_ID} aria-hidden="true" data-state="burnt" className={styles.stage}>
            <PlateDrawing />
            {/* Physical left/top: they map the drawing's coordinates, which never mirror. */}
            <span data-layer="face" className={styles.face} style={faceBox}>
              <NameLayer layer="pencil" className={styles.pencil} />
              <NameLayer layer="char" className={styles.char} />
              <NameLayer layer="glow" className={styles.glow} />
              <span data-layer="ember" className={styles.ember} />
              <span data-layer="smoke" className={styles.smoke} />
            </span>
          </div>
        </div>

        <form
          id={FORM_ID}
          method="get"
          action={`/product/${product.slug}`}
          className={cn("tray flex flex-col gap-4 p-4 sm:p-5", styles.form)}
          data-max={maxChars}
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor={INPUT_ID} className="text-sm font-semibold text-ink">
              اسم کوچولوت چیه؟
            </label>
            <input
              id={INPUT_ID}
              name="engrave"
              type="text"
              dir="rtl"
              lang="fa"
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              enterKeyHint="done"
              placeholder={`مثلاً ${EXAMPLE_NAME}`}
              aria-describedby={`${INPUT_ID}-note ${INPUT_ID}-error`}
              className={cn(inputClasses, "h-14 font-accent text-lead")}
            />
            <p id={`${INPUT_ID}-error`} role="alert" hidden className="flex items-start gap-1.5 text-sm text-danger">
              <Icon name="warning" className="mt-0.5 size-[1.15em]" />
              <span>اسم حداکثر {toFaDigits(maxChars)} حرف جا می‌شه.</span>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {orderable && priceToman ? (
              <Button type="submit" variant="primary" size="lg" block data-order>
                سفارش با حک اسم · {formatToman(priceToman)}
              </Button>
            ) : (
              <p className="flex min-h-12 items-center justify-center gap-2 rounded-bit-sm border-[1.5px] border-dashed border-line-strong px-4 text-sm text-muted">
                <Icon name="clock" className="size-4" />
                حک اسم روی سفارش به‌زودی
              </p>
            )}
            <Button type="button" variant="secondary" size="lg" block iconStart="share" data-story hidden>
              ذخیره برای استوری
            </Button>
          </div>

          <p id={`${INPUT_ID}-note`} className="flex items-center gap-2 text-xs text-muted">
            <Icon name="shield-leaf" className="size-4" />
            این اسم فقط روی گوشی خودت می‌مونه.
          </p>
          <p data-status aria-live="polite" className="sr-only" />
        </form>

        <EngraverIsland
          formId={FORM_ID}
          stageId={STAGE_ID}
          story={storyTemplate()}
          handle={settings.socials.instagramHandle}
          host={new URL(SITE.url).host}
        />
      </div>
    </section>
  );
}
