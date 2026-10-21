import type { CSSProperties, ReactNode } from "react";
import { PegDoll, pegDollWidthCm } from "@/components/illustrations/PegDoll";
import { illustrationFrame, illustrationSize, orthoFrame, orthoLabels } from "@/components/illustrations/sizes";
import { ManifestStage } from "@/components/shop/ManifestStage";
import { GallerySync } from "@/components/shop/GallerySync";
import { ZoomDialog, type ZoomPhoto } from "@/components/shop/ZoomDialog";
import { defaultPreset } from "@/components/shop/scale-advice";
import type { ProductMediaData, ProductPageData } from "@/db/queries/product";
import { Icon } from "@/components/ui/Icon";
import { sheetInvokerProps } from "@/components/ui/Sheet";
import { Stage } from "@/components/ui/Stage";
import { grainStyle } from "@/lib/grain";
import { toFaDigits } from "@/lib/format";
import { cn, illustrationUrl, mediaUrl } from "@/lib/utils";
import styles from "./ProductGallery.module.css";

/*
 * «میز کار» — the product gallery (DESIGN.md §6.3 block 2, §3.9). 4:5 slides in a CSS
 * scroll-snap track, no carousel library:
 *   1. the layered manifest stage (assembled ↔ exploded)       — or the first photo/cut-out
 *   2. «ابعاد»: the ortho drawing on blueprint paper with HTML dimension labels
 *   3. «در خانه»: the drawing at true scale beside a peg-doll child (until real photos exist)
 *   4+ the remaining photos, each opening the zoom viewer
 * When a photo or cut-out exists it becomes slide 1 (the page's LCP image) and the drawings stay
 * as truth slides. The tabs under the track are `#slide-n` links; GallerySync keeps them in step.
 */

type ProductGalleryProps = {
  product: Pick<ProductPageData["product"], "id" | "slug" | "name" | "illustration" | "dimensions" | "ageMinMonths">;
  media: ProductMediaData[];
  className?: string;
};

type Slide = { key: string; tab: string; content: ReactNode };

const GALLERY_ID = "product-gallery";
const ZOOM_ID = "product-zoom";
/* The gallery is full width on phones, about 7/12 of the page column on desktop. */
const PHOTO_SIZES = "(min-width: 1024px) 40vw, 100vw";

const sized = (m: ProductMediaData): m is ProductMediaData & { width: number; height: number } =>
  m.width != null && m.height != null;

export function ProductGallery({ product, media, className }: ProductGalleryProps) {
  const vtName = `product-${product.id}`;
  const photos = media.filter(sized);
  const zoomable = photos.filter((m) => m.kind === "photo");
  const key = product.illustration;

  const photoSlide = (photo: (typeof photos)[number], index: number, first: boolean): Slide => {
    const zoomIndex = zoomable.indexOf(photo);
    return {
      key: `photo-${photo.id}`,
      tab: photos.length > 1 ? `عکس ${toFaDigits(index + 1)}` : "عکس",
      content: (
        <Stage
          kind={photo.kind === "cutout" ? "cutout" : "photo"}
          src={mediaUrl(photo.path)}
          width={photo.width}
          height={photo.height}
          dominantColor={photo.dominantColor}
          sizes={PHOTO_SIZES}
          alt={photo.alt || product.name}
          slug={product.slug}
          priority={first}
          vtName={first ? vtName : undefined}
        >
          {zoomIndex >= 0 ? (
            <button
              type="button"
              {...sheetInvokerProps(ZOOM_ID)}
              data-zoom-index={zoomIndex}
              aria-label={`بزرگ‌نمایی ${photo.alt || product.name}`}
              className={styles.zoom}
            >
              <span className={styles.zoomBadge} aria-hidden="true">
                <Icon name="zoom" className="size-5" />
              </span>
            </button>
          ) : null}
        </Stage>
      ),
    };
  };

  const slides: Slide[] = [];
  const [lead, ...rest] = photos;
  if (lead) slides.push(photoSlide(lead, 0, true));
  if (key) {
    slides.push({
      key: "drawing",
      tab: "طرح",
      content: <ManifestStage manifestKey={key} name={product.name} slug={product.slug} vtName={lead ? undefined : vtName} />,
    });
    if (orthoFrame(key)) {
      slides.push({ key: "ortho", tab: "ابعاد", content: <OrthoSlide illustration={key} name={product.name} slug={product.slug} /> });
    }
    // Real photos of the product in use replace the drawn vignette.
    if (!photos.some((m) => m.kind === "photo")) {
      slides.push({
        key: "home",
        tab: "در خانه",
        content: <HomeVignette illustration={key} product={product} />,
      });
    }
  }
  rest.forEach((photo, i) => slides.push(photoSlide(photo, i + 1, false)));
  if (!slides.length) return null;

  return (
    <section id={GALLERY_ID} aria-label={`تصاویر و طرح‌های ${product.name}`} className={cn(styles.gallery, className)}>
      <div data-track="" className={styles.track}>
        {slides.map((slide, i) => (
          <div
            key={slide.key}
            id={`slide-${i + 1}`}
            role="group"
            aria-roledescription="اسلاید"
            aria-label={`${toFaDigits(i + 1)} از ${toFaDigits(slides.length)}: ${slide.tab}`}
            className={styles.slide}
          >
            {slide.content}
          </div>
        ))}
      </div>

      {slides.length > 1 ? (
        <nav aria-label="اسلایدهای گالری" className={styles.tabs}>
          {slides.map((slide, i) => (
            <a key={slide.key} href={`#slide-${i + 1}`} data-tab="" aria-current={i === 0 ? "true" : undefined} className={styles.tab}>
              {slide.tab}
            </a>
          ))}
        </nav>
      ) : null}

      {slides.length > 1 ? <GallerySync galleryId={GALLERY_ID} /> : null}
      {zoomable.length ? (
        <ZoomDialog
          id={ZOOM_ID}
          title={`عکس‌های ${product.name}`}
          photos={zoomable.map(
            (m): ZoomPhoto => ({ src: mediaUrl(m.path), width: m.width, height: m.height, alt: m.alt || product.name, caption: m.caption }),
          )}
        />
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* «ابعاد»: ortho drawing on blueprint paper                            */
/* ------------------------------------------------------------------ */

const AXIS_NAME = { w: "عرض", h: "ارتفاع", d: "عمق" } as const;

function OrthoSlide({ illustration, name, slug }: { illustration: string; name: string; slug: string }) {
  const { width, height } = illustrationSize(illustration, "ortho");
  const labels = orthoLabels(illustration);
  const legend = labels.map((l) => ({ key: l.key, name: l.name ?? AXIS_NAME[l.axis], value: l.label }));
  return (
    <figure className={cn("relative isolate aspect-[4/5] overflow-hidden rounded-arch", styles.blueprint)} style={grainStyle(slug) as CSSProperties}>
      <div className={styles.orthoArea}>
        {/* Physical coordinates: the drawing is never mirrored, so labels use left/top. */}
        <div className="relative w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
          <img
            src={illustrationUrl(illustration, "ortho")}
            width={width}
            height={height}
            alt={`نقشهٔ ابعاد ${name}: ${legend.map((l) => `${l.name} ${l.value} سانتی‌متر`).join("، ")}`}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
          {labels.map((label) => (
            <span
              key={label.key}
              aria-hidden="true"
              className={styles.dim}
              style={{ left: `${label.x}%`, top: `${label.y}%` }}
            >
              {label.label}
            </span>
          ))}
        </div>
      </div>
      <figcaption className={styles.orthoLegend}>
        <dl className="flex flex-wrap justify-center gap-x-3 gap-y-0.5">
          {legend.map((l) => (
            <div key={l.key} className="flex gap-1">
              <dt className="text-muted">{l.name}</dt>
              <dd className="font-bold text-ink">{l.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-2xs text-muted">همهٔ اندازه‌ها به سانتی‌متر</p>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* «در خانه»: true-scale vignette with a peg-doll child                 */
/* ------------------------------------------------------------------ */

/* Scene proportions: the floor line sits at 80% of the 4:5 box, as in a photo taken at a child's eye line. */
const FLOOR_AT = 0.8;
const GAP_CM = 14;

function HomeVignette({
  illustration,
  product,
}: {
  illustration: string;
  product: Pick<ProductPageData["product"], "name" | "dimensions" | "ageMinMonths" | "slug">;
}) {
  const frame = illustrationFrame(illustration, "assembled");
  const { width: imgW, height: imgH } = illustrationSize(illustration, "assembled");
  const preset = defaultPreset(product.ageMinMonths);
  const child = preset.heightCm;

  // Everything in cm. The drawing's front floor corner stands on the floor line.
  const drawW = frame.width / 10;
  const aboveFloor = frame.originY / 10;
  const dollW = pegDollWidthCm("child", child);
  const content = drawW + GAP_CM + dollW;
  const sceneW = Math.max(content * 1.3, (Math.max(aboveFloor, child) * 1.18) / FLOOR_AT / 1.25);
  const sceneH = sceneW * 1.25;
  const floorY = sceneH * FLOOR_AT;
  const left = (sceneW - content) / 2;
  // The wall meets the floor just behind the piece (its back stands 0.25 × depth higher in the oblique).
  const depth = product.dimensions?.depthCm ?? 30;
  const wallY = Math.max(sceneH * 0.45, floorY - 0.25 * (depth + 20));

  const pct = (value: number, of: number) => `${Math.round((value / of) * 10000) / 100}%`;
  const vars = {
    "--wall-y": pct(wallY, sceneH),
    "--floor-y": pct(floorY, sceneH),
  } as CSSProperties;

  return (
    <figure className={cn("relative isolate aspect-[4/5] overflow-hidden rounded-arch", styles.room)} style={vars}>
      <span aria-hidden="true" className={styles.skirting} />
      <span aria-hidden="true" className={styles.floor} />
      {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
      <img
        src={illustrationUrl(illustration, "assembled")}
        width={imgW}
        height={imgH}
        alt={`${product.name} کنار کودکی با قد ${toFaDigits(child)} سانتی‌متر، به اندازهٔ واقعی`}
        loading="lazy"
        decoding="async"
        className="absolute h-auto max-w-none"
        style={{ left: pct(left, sceneW), top: pct(floorY - aboveFloor, sceneH), width: pct(drawW, sceneW) }}
      />
      <PegDoll
        heightCm={child}
        className="absolute"
        style={
          {
            left: pct(left + drawW + GAP_CM + dollW / 2, sceneW),
            bottom: pct(sceneH - floorY, sceneH),
            translate: "-50% 0",
            "--peg-unit": `calc(100% / ${Math.round(sceneH * 100) / 100})`,
          } as CSSProperties
        }
      />
      <figcaption className={styles.roomCaption}>
        کنار بچه‌ای {toFaDigits(child)} سانتی، میانگین قد {preset.atAge}
      </figcaption>
    </figure>
  );
}
