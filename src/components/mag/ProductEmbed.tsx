import type { ReactNode } from "react";
import { getProductCardsBySlugs, type ProductCardData } from "@/db/queries/catalog";
import { listVariantOptions, type VariantOption } from "@/db/queries/cards";
import { getSettings } from "@/db/queries/settings";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { AgeBadge } from "@/components/ui/AgeBadge";
import { InstallmentLine } from "@/components/ui/InstallmentLine";
import { IntentLink } from "@/components/ui/IntentLink";
import { Price } from "@/components/ui/Price";
import { Stage, type StageProps } from "@/components/ui/Stage";
import { StockBadge } from "@/components/ui/StockBadge";
import { toFaDigits } from "@/lib/format";
import { cn, mediaUrl } from "@/lib/utils";
import styles from "./ProductEmbed.module.css";

/*
 * `::product{slug why}` (DESIGN.md §7.3, SEO.md §4.6): the product the guide just talked about,
 * as one horizontal raised card: mini Stage · name · age · price · installments · «چرا اینجا؟»
 * · «دیدن محصول ←» · quick add. The whole card is the name's link; quick add sits above it.
 * Products that need a variant choice link to the product page instead of guessing a variant.
 */

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type StageMedia = DistributiveOmit<StageProps, "alt" | "slug" | "priority" | "vtName" | "className" | "children">;

/** Embeds prefer the manifest drawing (truthful, light), then a cut-out, then a framed photo. */
export function embedStage(product: ProductCardData, sizes: string): { media: StageMedia; alt: string } | null {
  if (product.illustration) {
    return { media: { kind: "illustration", illustration: product.illustration }, alt: `طرح ${product.name}` };
  }
  const image = product.image;
  if (image?.width && image.height && (image.kind === "cutout" || image.kind === "photo")) {
    return {
      media: {
        kind: image.kind,
        src: mediaUrl(image.path),
        width: image.width,
        height: image.height,
        dominantColor: image.dominantColor,
        sizes,
      },
      alt: image.alt || product.name,
    };
  }
  return null;
}

/** Quick add, a stock note, or nothing when the visitor has to pick a variant on the product page. */
export function EmbedQuickAdd({ product, variants }: { product: ProductCardData; variants: VariantOption[] }): ReactNode {
  if (product.availability === "out_of_stock") return <StockBadge availability="out_of_stock" className="text-xs" />;
  if (variants.length > 1) return null;
  const variant = variants[0] ?? null;
  return (
    <AddToCartButton
      size="icon"
      label={`افزودن ${product.name} به سبد`}
      items={{
        productId: product.id,
        variantId: variant?.id ?? null,
        slug: product.slug,
        name: product.name,
        variantName: variant?.name ?? null,
        priceToman: variant?.price ?? product.price,
        illustration: product.illustration,
        imagePath: product.image?.path ?? null,
      }}
    />
  );
}

export const pricesDiffer = (variants: VariantOption[]) => new Set(variants.map((v) => v.price)).size > 1;

type ProductEmbedProps = {
  slug: string;
  /** «چرا اینجا؟»: one sentence on why this product answers the section above. */
  why?: string;
};

export async function ProductEmbed({ slug, why }: ProductEmbedProps) {
  const [[product], settings, variantsByProduct] = await Promise.all([
    getProductCardsBySlugs([slug]),
    getSettings(),
    listVariantOptions(),
  ]);
  if (!product) return null; // unpublished or renamed: the guide reads fine without it

  const variants = variantsByProduct[product.id] ?? [];
  const stage = embedStage(product, "(min-width: 40rem) 144px, 112px");
  const href = `/product/${product.slug}`;

  return (
    <div data-block="" data-cart-source="" className={cn("group", styles.card, styles.embed)}>
      {stage ? (
        <Stage {...stage.media} alt={stage.alt} slug={product.slug} className={styles.stage} />
      ) : (
        <span aria-hidden="true" className={cn("rounded-arch bg-surface", styles.stage)} />
      )}

      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs text-muted">در این راهنما از این استفاده کردیم</p>
        <p className="text-base leading-snug font-bold text-ink">
          <IntentLink href={href} transitionTypes={["nav-forward"]} className={styles.link}>
            {product.name}
          </IntentLink>
        </p>
        <AgeBadge min={product.ageMinMonths} max={product.ageMaxMonths} className="self-start" />
        <div className="mt-1 flex flex-col gap-0.5">
          <Price price={product.price} compareAt={product.compareAtPrice} from={pricesDiffer(variants)} size="sm" />
          <InstallmentLine price={product.price} snapppay={settings.snapppay} link={false} />
        </div>
        {why ? (
          <p className="mt-1 text-sm leading-relaxed text-ink">
            <span className="font-bold">چرا اینجا؟ </span>
            {why}
          </p>
        ) : null}
        <div className="mt-1 flex min-h-11 items-center justify-between gap-3">
          <span className="text-sm font-semibold text-ink" aria-hidden="true">
            دیدن محصول ←
          </span>
          {variants.length > 1 ? (
            <span className="text-xs text-muted">{toFaDigits(variants.length)} مدل</span>
          ) : null}
          <div className={styles.above}>
            <EmbedQuickAdd product={product} variants={variants} />
          </div>
        </div>
      </div>
    </div>
  );
}
