import Image from "next/image";
import type { CSSProperties } from "react";
import type { ProductPageData } from "@/db/queries/product";
import type { SiteSettings } from "@/db/queries/settings";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { illustrationSize } from "@/components/illustrations/sizes";
import { installmentPlan } from "@/components/ui/installments";
import { formatNumber, toFaDigits } from "@/lib/format";
import { grainStyle } from "@/lib/grain";
import { cn, illustrationUrl, mediaUrl } from "@/lib/utils";
import { cartItem, type Offer } from "./product-offers";
import { VariantSwap } from "./VariantPicker";
import styles from "./BuyBar.module.css";

/*
 * The mobile buy bar (DESIGN.md §4.2, §6.3 block 22, §9.5): the dock's second face. It sits where
 * the dock sits — 64px + the safe area, a birch plank with its ply strata on top — showing the
 * stage thumb, the price, «یا ۴ قسط» and «افزودن به سبد». `data-buybar` tells the dock to step
 * aside; where scroll timelines and motion are allowed the dock turns away and this face turns in
 * on the price block's view timeline (--price), otherwise the bar is simply always there.
 * Never two bars stacked. Hidden from 1024px, where the info column keeps the button in view.
 */

type BuyBarProps = {
  data: Pick<ProductPageData, "product" | "media">;
  offers: Offer[];
  snapppay: SiteSettings["snapppay"];
  className?: string;
};

const THUMB = 40;

function Thumb({ data }: { data: BuyBarProps["data"] }) {
  const photo = data.media.find((m) => m.width && m.height);
  if (photo) {
    return (
      <Image
        src={mediaUrl(photo.path)}
        width={photo.width!}
        height={photo.height!}
        alt=""
        sizes={`${THUMB}px`}
        quality={60}
        loading="lazy"
        className={cn(styles.thumbImage, photo.kind === "photo" && "object-cover")}
      />
    );
  }
  const key = data.product.illustration;
  if (!key) return null;
  const { width, height } = illustrationSize(key, "assembled");
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3)
    <img src={illustrationUrl(key, "assembled")} width={width} height={height} alt="" loading="lazy" decoding="async" className={styles.thumbImage} />
  );
}

export function BuyBar({ data, offers, snapppay, className }: BuyBarProps) {
  const { product } = data;
  return (
    <div
      data-buybar=""
      role="region"
      aria-label={`خرید ${product.name}`}
      className={cn("grain bg-wood", styles.bar, className)}
      style={grainStyle("dock") as CSSProperties}
    >
      <span aria-hidden="true" className="ply-band absolute inset-x-0 -top-[5px] h-[5px]" />
      <div data-cart-source="" className={styles.inner}>
        <span className={styles.thumb}>
          <Thumb data={data} />
        </span>
        <VariantSwap offers={offers} className="min-w-0 flex-1">
          {(offer) => {
            const plan = installmentPlan(offer.price, snapppay);
            return (
              <p className="flex flex-col leading-tight">
                <data value={offer.price} className="truncate text-base font-bold text-ink">
                  {formatNumber(offer.price)} <span className="text-xs font-semibold">تومان</span>
                </data>
                {plan ? (
                  <span className="text-xs font-semibold text-success">یا {toFaDigits(plan.count)} قسط</span>
                ) : null}
              </p>
            );
          }}
        </VariantSwap>
        <VariantSwap offers={offers} differsBy={(o) => `${o.variantId}:${o.availability}`}>
          {(offer) =>
            offer.availability === "out_of_stock" ? (
              <AddToCartButton size="sm" items={cartItem(data, offer)} label="فعلاً تموم شده" disabled />
            ) : (
              <AddToCartButton
                size="sm"
                items={cartItem(data, offer)}
                toastLabel={`${product.name}${offer.variantName ? ` (${offer.variantName})` : ""} به سبد اضافه شد`}
              />
            )
          }
        </VariantSwap>
      </div>
    </div>
  );
}
