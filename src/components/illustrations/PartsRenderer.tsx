import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { getManifest } from "./manifests";
import { DRAWING_CLASS, finishVars, renderDrawing, renderLayers } from "./render";

export type PartsView = "assembled" | "exploded" | "ortho" | "flat";

export type PartsRendererProps = {
  /** `products.illustration` / `categories.illustration` key. Unknown keys render nothing. */
  manifestKey: string;
  view: PartsView;
  /**
   * Assembled drawing split into stacked layers (cover tower, PDP stage). Each
   * layer is an HTML <span data-part="ids…"> with `--ex` / `--ey` (exploded
   * offset, already in %) and `--i` (paint order); explode by translating it:
   * `[data-exploded] [data-part] { translate: var(--ex) var(--ey) }`.
   * `data-state="assembled"` layers (a tab end flush in its slot) should fade
   * out when exploded, `data-state="exploded"` ones (dowel lines) fade in.
   */
  layered?: boolean;
  /** `natural` (default), `white`, or a painted tint (`sage`, `terracotta`, …). */
  finish?: string;
  /** Learning tower platform height in mm (300 / 380 / 460). */
  platformLevel?: number;
  /** Alternative pose from the manifest (e.g. `rocker` for the Pikler arch). */
  pose?: string;
  className?: string;
};

/**
 * Inline manifest drawing (server component). Keeps the theme variables, so it
 * follows dark mode and finish changes (`--wood`, `--wood-top`, `--wood-side`).
 * Inline only where DESIGN.md §10.3 allows it; grids use the static <img> files.
 */
export function PartsRenderer({
  manifestKey,
  view,
  layered = false,
  finish,
  platformLevel,
  pose,
  className,
}: PartsRendererProps) {
  const idPrefix = `p${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const manifest = getManifest(manifestKey);
  if (!manifest) return null;
  const finishStyle = finishVars(finish) as CSSProperties | undefined;

  if (layered) {
    const stage = renderLayers(manifest, { palette: "css", platformLevel, pose, idPrefix });
    const viewBox = stage.viewBox.join(" ");
    return (
      <div
        aria-hidden="true"
        data-parts-stage={manifest.key}
        className={cn("relative", className)}
        style={{ aspectRatio: `${stage.width} / ${stage.height}`, ...finishStyle }}
      >
        {stage.layers.map((layer) => (
          <span
            key={layer.index}
            data-part={layer.parts.join(" ")}
            data-state={layer.state}
            className="absolute inset-0 block"
            style={{ "--ex": `${layer.ex}%`, "--ey": `${layer.ey}%`, "--i": layer.index } as CSSProperties}
          >
            <svg
              viewBox={viewBox}
              className={cn(DRAWING_CLASS, "block size-full")}
              focusable="false"
              dangerouslySetInnerHTML={{ __html: layer.body }}
            />
          </span>
        ))}
      </div>
    );
  }

  const drawing = renderDrawing(manifest, view, { palette: "css", platformLevel, pose, idPrefix });
  return (
    <svg
      viewBox={drawing.viewBox.join(" ")}
      width={Math.round(drawing.width)}
      height={Math.round(drawing.height)}
      className={cn(DRAWING_CLASS, className)}
      style={finishStyle}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: drawing.body }}
    />
  );
}

export default PartsRenderer;
