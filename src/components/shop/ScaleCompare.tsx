import type { CSSProperties } from "react";
import { PegDoll } from "@/components/illustrations/PegDoll";
import { illustrationFrame, illustrationSize, orthoFrame, orthoLabels } from "@/components/illustrations/sizes";
import type { ProductPageData } from "@/db/queries/product";
import { HexChip } from "@/components/ui/HexChip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ageStageFor } from "@/components/ui/tints";
import { WHO_SOURCE } from "@/lib/ages";
import { toFaDigits } from "@/lib/format";
import { cn, illustrationUrl } from "@/lib/utils";
import { HeightInputs } from "./HeightInputs";
import { faNumber } from "./product-facts";
import { AGE_PRESETS, CABINET_CM, adviceSentence, defaultPreset, platformLevels, recommendLevel } from "./scale-advice";
import styles from "./ScaleCompare.module.css";

/*
 * «با قدِ بچه‌ت مقایسه کن» (DESIGN.md §6.3 block 11, §3.7 `scale` view). The ortho front
 * elevation at true scale beside a peg-doll child. Five age radios (WHO medians ⚑) set
 * `--child-cm` through `:has()` and the doll grows from its feet on the compositor — zero JS;
 * the default is the product's minimum age. HeightInputs adds «قد بچهٔ خودم» and, for the
 * learning tower, the cabinet height with the platform recommendation. The recommendation for
 * each preset is server-rendered and swapped by the same radios. Nothing typed leaves the device.
 *
 * The stage is a box in centimetres: [doll zone | front elevation], floor shared, so the doll's
 * `--peg-unit` and the drawing use one scale. Physical coordinates (never mirrored).
 */

type ScaleCompareProps = {
  product: Pick<ProductPageData["product"], "name" | "illustration" | "dimensions" | "ageMinMonths">;
  className?: string;
};

export const SCALE_ROOT_ID = "scale-compare";
const AGE_INPUT = "scale-age";
/** Width kept for the doll beside the drawing, cm (a 130 cm child is ~57 cm wide). */
const DOLL_ZONE_CM = 64;
/** Headroom above the floor at least this tall, cm, so the oldest preset (103) stands inside. */
const MIN_ABOVE_FLOOR_CM = 112;
/** The doll is drawn at this height and scaled to the chosen one (`--cm` vs `--child-cm`). */
const DOLL_BASE_CM = 100;

const pct = (value: number, of: number) => `${Math.round((value / of) * 10000) / 100}%`;

/** Footprint and the extras a room needs: «کفِ لازم: ۴۵ × ۴۵ سانتی‌متر». */
function footprint(d: NonNullable<ProductPageData["product"]["dimensions"]>): string[] {
  const lines = [`کفِ لازم: ${faNumber(d.widthCm)} × ${faNumber(d.depthCm)} سانتی‌متر`];
  for (const [name, value] of Object.entries(d.extra ?? {})) {
    if (name.includes("طول رمپ")) lines.push(`به‌اضافهٔ جای رمپ جلوی آن (طول رمپ ${faNumber(value)} سانتی‌متر)`);
    if (name.includes("سقف")) lines.push(`ارتفاع سقف: دست‌کم ${faNumber(value)} سانتی‌متر`);
  }
  return lines;
}

/** Big enough for a child to stand beside: toys smaller than a step stool skip the tool. */
export function hasScaleCompare(product: ScaleCompareProps["product"]): boolean {
  const d = product.dimensions;
  return !!(product.illustration && d && orthoFrame(product.illustration) && Math.max(d.heightCm, d.widthCm) >= 45);
}

export function ScaleCompare({ product, className }: ScaleCompareProps) {
  const key = product.illustration;
  const d = product.dimensions;
  const frame = key ? orthoFrame(key) : null;
  if (!key || !d || !frame || !hasScaleCompare(product)) return null;

  // The ortho drawing in cm (1 drawing unit = 1 mm), cropped to its front elevation.
  const ortho = illustrationFrame(key, "ortho");
  const { width: imgW, height: imgH } = illustrationSize(key, "ortho");
  const ow = ortho.width / 10;
  const oh = ortho.height / 10;
  const floorFromTop = (frame.floorY / 100) * oh;
  const cropFrom = (frame.side[1] + frame.front[0]) / 2;
  const cropX = (cropFrom / 100) * ow;
  const cropW = ow - cropX;
  const below = oh - floorFromTop;
  const above = Math.max(floorFromTop, MIN_ABOVE_FLOOR_CM) + 6;
  const stageW = DOLL_ZONE_CM + cropW;
  const stageH = above + below;

  const labels = orthoLabels(key).filter((l) => l.x > cropFrom);
  const preset = defaultPreset(product.ageMinMonths);
  const levels = platformLevels(d);

  const ratio = Math.round((stageW / stageH) * 1000) / 1000;
  const stageVars = { aspectRatio: String(ratio), "--ratio": ratio } as CSSProperties;
  const crop = {
    left: pct(DOLL_ZONE_CM, stageW),
    top: pct(above - floorFromTop, stageH),
    width: pct(cropW, stageW),
    height: pct(oh, stageH),
  };

  return (
    <section id={SCALE_ROOT_ID} aria-labelledby="scale-title" className={cn(styles.scale, className)}>
      <SectionHeader
        id="scale-title"
        size="content"
        kicker="قدش به کجا می‌رسه؟"
        kickerDecorative
        title="با قدِ بچه‌ت مقایسه کن"
        sub={`${product.name} و یک بچه، هر دو به اندازهٔ واقعی؛ سن بچه را انتخاب کن.`}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className={cn("lg:col-span-7", styles.paper)}>
          <div dir="ltr" className={styles.stage} style={stageVars}>
            <span aria-hidden="true" className={styles.floor} style={{ top: pct(above, stageH) }} />
            <div className={styles.crop} style={crop}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
              <img
                src={illustrationUrl(key, "ortho")}
                width={imgW}
                height={imgH}
                alt={`نمای روبه‌روی ${product.name} با ابعاد واقعی`}
                loading="lazy"
                decoding="async"
                className="absolute top-0 h-full max-w-none"
                style={{ left: pct(-cropX, cropW), width: pct(ow, cropW) }}
              />
              {labels.map((label) => (
                <span
                  key={label.key}
                  aria-hidden="true"
                  className={styles.dim}
                  style={{ left: pct((label.x / 100) * ow - cropX, cropW), top: `${label.y}%` }}
                >
                  {label.label}
                </span>
              ))}
            </div>
            <PegDoll
              heightCm={DOLL_BASE_CM}
              className={cn("absolute", styles.doll)}
              style={
                {
                  left: pct(DOLL_ZONE_CM / 2, stageW),
                  bottom: pct(below, stageH),
                  "--peg-unit": `calc(100% / ${Math.round(stageH * 100) / 100})`,
                } as CSSProperties
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-5">
          <fieldset>
            <legend className="mb-3 text-sm font-bold text-ink">سنِ بچه · قد میانگین (سانتی‌متر)</legend>
            <div className="flex flex-wrap gap-2">
              {AGE_PRESETS.map((p) => (
                <HexChip
                  key={p.months}
                  name={AGE_INPUT}
                  value={String(p.heightCm)}
                  defaultChecked={p.months === preset.months}
                  tint={ageStageFor(p.months)}
                >
                  {p.label} · {toFaDigits(p.heightCm)}
                </HexChip>
              ))}
            </div>
            <p className="mt-2 text-2xs text-muted">{WHO_SOURCE}</p>
          </fieldset>

          <HeightInputs rootId={SCALE_ROOT_ID} ageInputName={AGE_INPUT} levels={levels} defaultCabinetCm={CABINET_CM.default} />

          {levels.length ? (
            <div className={styles.advice}>
              {AGE_PRESETS.map((p) => {
                const level = recommendLevel(p.heightCm, CABINET_CM.default, levels);
                return level ? (
                  <p key={p.months} data-advice={p.heightCm} className="text-base font-semibold text-ink">
                    {adviceSentence(p.heightCm, CABINET_CM.default, level)}
                  </p>
                ) : null;
              })}
            </div>
          ) : null}

          <ul className="flex flex-col gap-1 text-sm text-ink">
            {footprint(d).map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-line-strong" />
                {line}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">این اعداد فقط روی گوشی خودت می‌مونه.</p>
        </div>
      </div>
    </section>
  );
}
