import { ViewTransition, type CSSProperties } from "react";
import { PartsRenderer } from "@/components/illustrations/PartsRenderer";
import { illustrationSize, illustrationSource } from "@/components/illustrations/sizes";
import { Icon } from "@/components/ui/Icon";
import { grainStyle } from "@/lib/grain";
import { cn } from "@/lib/utils";
import styles from "./ManifestStage.module.css";

/*
 * The product page's first slide when there is no photo yet (DESIGN.md §6.3 block 2, §3.7): the
 * manifest drawing rendered as stacked part layers on the 4:5 «طاق» stage, with a two-option
 * toggle «نمای کامل / نمای انفجاری». Two radios and `:has()` do the switch (zero JS): each part
 * slides out by its own exploded offset (--ex/--ey) on the settle spring, assembled-only details
 * fade out and the dashed dowel lines fade in. Only `translate` and `opacity` on HTML wrappers.
 * The foot says honestly where the drawing comes from (measured dimensions or the cut files).
 */

type ManifestStageProps = {
  manifestKey: string;
  /** Product name, for the drawing's accessible description. */
  name: string;
  /** Seeds the stage's grain board. */
  slug: string;
  /** Shared-element morph with the product card's stage, `product-{id}`. */
  vtName?: string;
  className?: string;
};

const SOURCE_LABEL = { dxf: "طرح دقیق از روی نقشهٔ برش", measured: "طرح از روی ابعاد واقعی" } as const;

export function ManifestStage({ manifestKey, name, slug, vtName, className }: ManifestStageProps) {
  const source = illustrationSource(manifestKey);
  if (!source) return null;
  // The layered stage spans both states, so it is about as wide as the exploded drawing.
  const exploded = illustrationSize(manifestKey, "exploded");
  const group = `stage-view-${slug}`;

  const stage = (
    <div
      className={cn("grain relative isolate aspect-[4/5] overflow-hidden rounded-arch bg-surface", styles.stage)}
      style={{ ...(grainStyle(slug) as CSSProperties), "--ratio": exploded.width / exploded.height } as CSSProperties}
    >
      <div role="img" aria-label={`طرح ${name}، ${SOURCE_LABEL[source]}`} className={styles.drawing}>
        <PartsRenderer manifestKey={manifestKey} view="assembled" layered />
      </div>

      <div className={styles.foot}>
        <fieldset className={styles.views}>
          <legend className="sr-only">نمای طرح</legend>
          <label className={styles.view}>
            <input type="radio" name={group} value="assembled" defaultChecked className="sr-only" />
            نمای کامل
          </label>
          <label className={styles.view}>
            <input type="radio" name={group} value="exploded" className={cn("sr-only", styles.exploded)} />
            نمای انفجاری
          </label>
        </fieldset>
        <p className="flex items-center gap-1.5 text-2xs font-semibold text-muted">
          <Icon name="ruler" className="size-4" />
          {SOURCE_LABEL[source]}
        </p>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {vtName ? (
        <ViewTransition name={vtName} share="morph" default="none">
          {stage}
        </ViewTransition>
      ) : (
        stage
      )}
    </div>
  );
}
