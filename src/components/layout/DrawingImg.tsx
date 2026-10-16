import { cn, illustrationUrl } from "@/lib/utils";

/*
 * A small manifest drawing for menus and cart lines: a plain lazy <img> of the static SVG (never
 * the optimiser, never inline: DESIGN.md §10.3 RSC double-payload rule). The box is square and the
 * drawing is contained, so the slot is sized before the file arrives.
 */

type DrawingImgProps = {
  illustration: string;
  /** Box edge in CSS px. */
  size: number;
  /** Empty when a visible label next to it already names the product. */
  alt?: string;
  className?: string;
};

export function DrawingImg({ illustration, size, alt = "", className }: DrawingImgProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static manifest SVG, see header
    <img
      src={illustrationUrl(illustration, "assembled")}
      width={size}
      height={size}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn("object-contain", className)}
    />
  );
}
