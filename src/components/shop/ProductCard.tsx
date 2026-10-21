import Link from "next/link";
import { useId, type CSSProperties, type ReactNode } from "react";
import type { ProductCardData } from "@/db/queries/catalog";
import { listVariantOptions, type VariantOption } from "@/db/queries/cards";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Button } from "@/components/ui/Button";
import { InstallmentLine } from "@/components/ui/InstallmentLine";
import { IntentLink } from "@/components/ui/IntentLink";
import { Price } from "@/components/ui/Price";
import { Sheet, sheetInvokerProps } from "@/components/ui/Sheet";
import { Stage, type StageProps } from "@/components/ui/Stage";
import { StockBadge } from "@/components/ui/StockBadge";
import { formatToman } from "@/lib/format";
import { Render } from "@/components/studio/Render";
import { cn, illustrationUrl, mediaUrl } from "@/lib/utils";
import styles from "./ProductCard.module.css";

/*
 * ProductCard (DESIGN.md §4.11), server. One raised card per product:
 *   AgeBadge · StampBadge → Stage (cutout or manifest drawing, morphs into the PDP's slide 1)
 *   → title (stretched link) → benefit → Price + installments → swatches · quick-add.
 * The whole card is the title's link; quick-add is a separate button stacked above it. Products
 * with several variants open a small server-rendered <dialog> (invoker command, zero JS of ours)
 * listing each variant with its own add button, so the visitor never adds the wrong size.
 * Hover (pointer devices): lift + crossfade to the exploded drawing; toys play instead.
 */

type ProductCardProps = {
  product: ProductCardData;
  /** The page's single LCP card: eager image with fetchpriority high. */
  priority?: boolean;
  /**
   * Full prefetch, so the Stage morph pairs with the PDP (the first 4 cards of a grid).
   * Without it the link prefetches on intent (pointer enter, focus, touch start).
   */
  prefetch?: boolean;
  /** Category name above the title, for mixed lists (search, related products). */
  showCategory?: boolean;
  /** A seasonal pick: shows «پیشنهاد یلدا» while settings.season is set. */
  seasonalStamp?: boolean;
  className?: string;
};

type Stamp = { label: string; tone: "accent" | "ink" };

const SEASON_LABEL: Record<NonNullable<SiteSettings["season"]>, string> = {
  yalda: "پیشنهاد یلدا",
  nowruz: "پیشنهاد نوروز",
};

/** How each toy plays on hover instead of exploding (HTML-wrapper transforms only). */
const TOY_PLAY: Record<string, "roll" | "rock"> = {
  "duck-pull-toy": "roll",
  "balance-board": "rock",
  "pikler-arch": "rock",
};

const HEX_COLOUR = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;

export async function ProductCard(props: ProductCardProps) {
  const [settings, variantsByProduct] = await Promise.all([getSettings(), listVariantOptions()]);
  return (
    <ProductCardView
      {...props}
      snapppay={settings.snapppay}
      season={settings.season}
      variants={variantsByProduct[props.product.id] ?? []}
    />
  );
}

type ProductCardViewProps = ProductCardProps & {
  snapppay: SiteSettings["snapppay"];
  season: SiteSettings["season"];
  variants: VariantOption[];
};

function ProductCardView({
  product,
  priority,
  prefetch,
  showCategory,
  seasonalStamp,
  className,
  snapppay,
  season,
  variants,
}: ProductCardViewProps) {
  // Unique per render, so a product shown twice on one page still gets two working sheets.
  const sheetId = `variants-${useId()}`;
  const href = `/product/${product.slug}`;
  const stage = stageMedia(product);
  const stamp = cardStamp(product, seasonalStamp ? season : null);
  const pricesDiffer = new Set(variants.map((v) => v.price)).size > 1;
  const needsChoice = variants.length > 1 && product.availability !== "out_of_stock";

  return (
    <>
      <article
        className={cn("group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-surface text-center", className)}
        data-product={product.id}
        data-age-min={product.ageMinMonths ?? undefined}
        data-age-max={product.ageMaxMonths ?? undefined}
        data-skills={product.skills.join(" ") || undefined}
        data-price={product.price}
        data-avail={product.availability}
        data-order={product.sortOrder}
        data-published={product.publishedAt ?? undefined}
      >
        <div className="relative px-5 pt-6 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          {stage && stage.media.kind !== "illustration" ? (
            <Stage {...stage.media} alt={stage.alt} slug={product.slug} priority={priority} vtName={`product-${product.id}`} />
          ) : (
            <Render
              productKey={product.illustration ?? product.slug}
              alt={`${product.name}، تصویر سه‌بعدی`}
              sizes="(min-width: 1280px) 300px, (min-width: 768px) 30vw, 46vw"
              priority={priority}
              box="1 / 1"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-1 px-4 pb-5 pt-3">
          {stamp ? <p className="eyebrow text-xs">{stamp.label}</p> : null}
          {showCategory ? <p className="text-xs text-muted">{product.category.name}</p> : null}
          <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-ink">
            <CardLink href={href} prefetch={prefetch} className={styles.link}>
              {product.name}
            </CardLink>
          </h3>
          {product.subtitle ? <p className="line-clamp-2 text-xs text-muted">{product.subtitle}</p> : null}
          <p className="mt-auto pt-2 text-sm">
            <data value={product.price}>
              {pricesDiffer ? "از " : ""}
              {formatToman(product.price)}
            </data>
          </p>
          <InstallmentLine price={product.price} snapppay={snapppay} link={false} />

          <div className="mt-3 flex items-center justify-center">
            {product.availability === "out_of_stock" ? (
              <StockBadge availability="out_of_stock" className="text-xs" />
            ) : needsChoice ? (
              <button
                type="button"
                className={cn(styles.above, "relative h-9 rounded-full bg-accent px-4 text-xs font-semibold text-on-accent")}
                {...sheetInvokerProps(sheetId)}
              >
                انتخاب و خرید
              </button>
            ) : (
              <AddToCartButton size="sm" label="افزودن به سبد" items={cartItem(product, variants[0] ?? null)} />
            )}
          </div>
        </div>
      </article>

      {needsChoice ? <VariantSheet id={sheetId} product={product} variants={variants} href={href} /> : null}
    </>
  );
}

/* ------------------------------------------------------------------ */

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type StageMedia = DistributiveOmit<StageProps, "alt" | "slug" | "priority" | "vtName" | "className" | "children">;

/**
 * Grids prefer a cutout (it stands on the stage like a drawing), then the manifest drawing,
 * then a framed photo (DESIGN.md §3.9).
 */
function stageMedia(product: ProductCardData): { media: StageMedia; alt: string; play?: "roll" | "rock" } | null {
  const image = product.image;
  const sized = image && image.width && image.height ? { ...image, width: image.width, height: image.height } : null;
  const play = product.illustration ? TOY_PLAY[product.illustration] : undefined;

  if (sized?.kind === "cutout") {
    return {
      media: { kind: "cutout", src: mediaUrl(sized.path), width: sized.width, height: sized.height, dominantColor: sized.dominantColor },
      alt: sized.alt || product.name,
      play,
    };
  }
  if (product.illustration) {
    return {
      media: {
        kind: "illustration",
        illustration: product.illustration,
        // Toys play on hover instead of coming apart.
        hoverView: play ? undefined : "exploded",
      },
      alt: `طرح ${product.name}`,
      play,
    };
  }
  if (sized) {
    return {
      media: { kind: "photo", src: mediaUrl(sized.path), width: sized.width, height: sized.height, dominantColor: sized.dominantColor },
      alt: sized.alt || product.name,
    };
  }
  return null;
}

/** Availability first (it changes the decision), then the season, then «جدید». Max one. */
function cardStamp(product: ProductCardData, season: SiteSettings["season"]): Stamp | null {
  if (product.availability === "made_to_order") return { label: "ساخت سفارشی", tone: "ink" };
  if (product.availability === "preorder") return { label: "پیش‌سفارش", tone: "ink" };
  if (season) return { label: SEASON_LABEL[season], tone: "accent" };
  if (product.isNew) return { label: "جدید", tone: "accent" };
  return null;
}

function cartItem(product: ProductCardData, variant: VariantOption | null) {
  return {
    productId: product.id,
    variantId: variant?.id ?? null,
    slug: product.slug,
    name: product.name,
    variantName: variant?.name ?? null,
    priceToman: variant?.price ?? product.price,
    illustration: product.illustration,
    imagePath: product.image?.path ?? null,
  };
}

function CardLink({
  href,
  prefetch,
  className,
  children,
}: {
  href: string;
  prefetch?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (prefetch) {
    return (
      <Link href={href} prefetch transitionTypes={["nav-forward"]} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <IntentLink href={href} transitionTypes={["nav-forward"]} className={className}>
      {children}
    </IntentLink>
  );
}


function WoodChip({ colour }: { colour: string }) {
  return <span aria-hidden="true" className={styles.chip} style={{ "--chip": colour } as CSSProperties} />;
}

/**
 * The variant mini sheet: one row per variant, each with its own add button. The rows sit in a
 * `data-cart-source` box whose first <img> (the thumb) is the picture that hops into the cart,
 * and `data-close-dialog-on-add` asks AddToCartButton to close this sheet once the item is in,
 * so the confirmation toast lands on the page.
 */
function VariantSheet({
  id,
  product,
  variants,
  href,
}: {
  id: string;
  product: ProductCardData;
  variants: VariantOption[];
  href: string;
}) {
  return (
    <Sheet
      id={id}
      title={product.name}
      description="مدلی رو که می‌خوای انتخاب کن و به سبد اضافه کن."
      footer={
        <Button variant="quiet" href={href} transitionTypes={["nav-forward"]}>
          جزئیات و ابعاد این محصول ←
        </Button>
      }
    >
      <div data-cart-source="" data-close-dialog-on-add="" className="flex flex-col gap-4">
        {product.illustration ? (
          <div className="flex items-center gap-3">
            <span className="grid size-16 shrink-0 place-items-center rounded-bit-sm bg-surface p-1.5 inset-shadow-tray">
              {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
              <img
                src={illustrationUrl(product.illustration, "assembled")}
                width={64}
                height={64}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-contain"
              />
            </span>
            {product.subtitle ? <p className="text-sm text-muted">{product.subtitle}</p> : null}
          </div>
        ) : null}
        <ul className="tray flex flex-col divide-y divide-line p-2">
          {variants.map((variant) => (
            <li key={variant.id} className="flex items-center gap-3 px-2 py-3">
              {variant.swatch && HEX_COLOUR.test(variant.swatch) ? <WoodChip colour={variant.swatch} /> : null}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold text-ink">{variant.name}</span>
                <Price price={variant.price} size="sm" showDiscount={false} />
              </div>
              {/* Bead buttons per row: a column of primary blocks would break «one primary per view». */}
              <AddToCartButton
                size="icon"
                label={`افزودن ${product.name}، ${variant.name}، به سبد`}
                toastLabel={`${product.name} (${variant.name}) به سبد اضافه شد`}
                items={cartItem(product, variant)}
              />
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}
