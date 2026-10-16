import Image from "next/image";
import { ViewTransition, type CSSProperties, type ReactNode } from "react";
import { illustrationSize } from "@/components/illustrations/sizes";
import { grainStyle } from "@/lib/grain";
import { cn, illustrationUrl } from "@/lib/utils";

/*
 * The product stage (DESIGN.md §3.9, §4.13): a 4:5 «طاق» arch on kahgel with the product's own
 * grain board and a contact-shadow floor. Media-agnostic:
 *   illustration → plain <img> of the manifest SVG (never the optimiser, RSC double-payload rule)
 *   cutout       → next/image alpha AVIF standing on the same floor, so it reads like a drawing
 *   photo        → next/image filling the arch inside a 6px milk-paper frame
 * `children` are overlays (badges) the caller positions.
 */

export type IllustrationView = "assembled" | "exploded" | "ortho" | "flat";

type StageMedia =
  | {
      kind: "illustration";
      /** Manifest key, e.g. "learning-tower". */
      illustration: string;
      view?: IllustrationView;
      finish?: string;
      /**
       * Second view cross-faded in while the nearest `.group` (the card) is hovered. It is a
       * <picture> source gated on `(hover: hover)`, so phones never download it.
       */
      hoverView?: IllustrationView;
    }
  | {
      kind: "cutout" | "photo";
      /** URL from mediaUrl(path). */
      src: string;
      width: number;
      height: number;
      dominantColor?: string | null;
      /** Exact `sizes` for this slot. Defaults to the product-grid slot. */
      sizes?: string;
    };

export type StageProps = StageMedia & {
  /** Persian alt text that says what the product is (and the view, for drawings). */
  alt: string;
  /** Seeds the grain board (DESIGN.md §3.1). */
  slug: string;
  /** The page's single LCP image: eager + fetchpriority high. */
  priority?: boolean;
  /** Shared-element morph name, e.g. `product-${id}` (card ↔ PDP). */
  vtName?: string;
  className?: string;
  children?: ReactNode;
};

const GRID_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";
/* 1×1 transparent GIF: the hover <picture> fallback, so touch devices fetch nothing. */
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
/* Where an object stands inside the arch. */
const STANDING = "absolute inset-x-[9%] top-[9%] bottom-[6%]";

function loadingProps(priority: boolean | undefined) {
  return priority ? ({ loading: "eager", fetchPriority: "high" } as const) : ({ loading: "lazy" } as const);
}

function StageMediaView(props: StageProps) {
  if (props.kind === "illustration") {
    const { illustration, view = "assembled", finish, hoverView, alt, priority } = props;
    const { width, height } = illustrationSize(illustration, view);
    return (
      <span className={STANDING}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG, see header */}
        <img
          src={illustrationUrl(illustration, view, finish)}
          width={width}
          height={height}
          alt={alt}
          decoding="async"
          {...loadingProps(priority)}
          className={cn(
            "size-full object-contain object-bottom",
            hoverView && "transition-opacity duration-250 ease-wood group-hover:opacity-0",
          )}
        />
        {hoverView ? <HoverView illustration={illustration} view={hoverView} finish={finish} /> : null}
      </span>
    );
  }

  const { kind, src, width, height, dominantColor, sizes = GRID_SIZES, alt, priority } = props;
  const style: CSSProperties | undefined = dominantColor ? { backgroundColor: dominantColor } : undefined;
  if (kind === "photo") {
    return (
      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        sizes={sizes}
        quality={75}
        {...loadingProps(priority)}
        style={style}
        className="absolute inset-1.5 size-[calc(100%-0.75rem)] rounded-arch object-cover"
      />
    );
  }
  return (
    <span className={STANDING}>
      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        sizes={sizes}
        quality={75}
        {...loadingProps(priority)}
        className="size-full object-contain object-bottom"
      />
    </span>
  );
}

function HoverView({ illustration, view, finish }: { illustration: string; view: IllustrationView; finish?: string }) {
  const { width, height } = illustrationSize(illustration, view);
  return (
    <picture
      className="absolute inset-0 opacity-0 transition-opacity duration-250 ease-wood group-hover:opacity-100"
    >
      <source media="(hover: hover)" srcSet={illustrationUrl(illustration, view, finish)} />
      <img src={BLANK} width={width} height={height} alt="" loading="lazy" decoding="async" className="size-full object-contain object-bottom" />
    </picture>
  );
}

export function Stage(props: StageProps) {
  const { slug, vtName, className, children, kind } = props;
  const isPhoto = kind === "photo";
  const stage = (
    <div
      className={cn(
        "relative isolate aspect-[4/5] overflow-hidden rounded-arch",
        isPhoto ? "bg-shir" : "grain bg-surface",
        className,
      )}
      style={isPhoto ? undefined : (grainStyle(slug) as CSSProperties)}
    >
      {isPhoto ? null : (
        <span aria-hidden="true" className="contact-shadow absolute inset-x-[16%] bottom-[3.5%] h-[7%] rounded-[50%]" />
      )}
      <StageMediaView {...props} />
      {children}
    </div>
  );

  if (!vtName) return stage;
  return (
    <ViewTransition name={vtName} share="morph" default="none">
      {stage}
    </ViewTransition>
  );
}
