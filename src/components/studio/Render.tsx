import Image from "next/image";
import { cn } from "@/lib/utils";
import sizes from "./renders.json";

/*
 * A studio render of a product (public/renders/{key}-{angle}.webp, transparent, trimmed).
 * Produced from the product manifest by the dev-only /studio bench and scripts/renders/optimize.mts;
 * replaced by real photography later without touching the pages.
 */

export type RenderAngle = "hero" | "front" | "side" | "top" | "low" | "hero-exploded" | "hero-white";

const SIZES = sizes as unknown as Record<string, [number, number]>;

export function renderSrc(key: string, angle: RenderAngle = "hero") {
  return `/renders/${key}-${angle}.webp`;
}

export function hasRender(key: string, angle: RenderAngle = "hero") {
  return `${key}-${angle}` in SIZES;
}

export function Render({
  productKey,
  angle = "hero",
  alt,
  sizes: sizesAttr = "(min-width: 1024px) 40vw, 90vw",
  priority = false,
  box,
  className,
}: {
  productKey: string;
  angle?: RenderAngle;
  alt: string;
  sizes?: string;
  priority?: boolean;
  /** Fit the render inside a box of this aspect ratio (e.g. "4 / 3"), resting on its floor. */
  box?: string;
  className?: string;
}) {
  const [width, height] = SIZES[`${productKey}-${angle}`] ?? SIZES[`${productKey}-hero`] ?? [1600, 2000];
  const image = (
    <Image
      src={hasRender(productKey, angle) ? renderSrc(productKey, angle) : renderSrc(productKey)}
      alt={alt}
      width={width}
      height={height}
      sizes={sizesAttr}
      quality={90}
      draggable={false}
      className={cn(box ? "h-full w-full object-contain object-bottom" : "h-auto w-full", "select-none", className)}
      {...(priority ? { fetchPriority: "high" as const, loading: "eager" as const } : {})}
    />
  );
  return box ? (
    <div className="relative w-full" style={{ aspectRatio: box }}>
      {image}
    </div>
  ) : (
    image
  );
}
