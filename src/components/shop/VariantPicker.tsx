import type { CSSProperties, ReactNode } from "react";
import type { ProductVariantData } from "@/db/queries/product";
import { InlineScript } from "@/components/ui/InlineScript";
import { formatToman } from "@/lib/format";
import { cn } from "@/lib/utils";
import { VARIANT_INPUT_NAME, variantInputId, variantSwapCss, type Offer } from "./product-offers";
import styles from "./VariantPicker.module.css";

/*
 * Variant picker (DESIGN.md §6.3 block 7): one radio per variant — a wood-chip swatch when the
 * variant has a colour, a plate with name and price otherwise. Choosing one swaps every price,
 * availability and add-to-cart copy on the page through `:has()` and the per-page <style> from
 * variantSwapCss (React hoists it into <head>); the inline manifest stage recolours through its
 * wood variables. No JS of ours is needed to choose.
 *
 * `?color=white` / `?variant=12` preselects before first paint (the inline script right after the
 * radios) and the choice is mirrored into the URL with replaceState. The canonical never carries
 * the query (pageMetadata builds it from the route).
 */

type VariantPickerProps = {
  productId: number;
  variants: ProductVariantData[];
  className?: string;
};

const HEX_COLOUR = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;

/*
 * Pre-paint: check the radio whose `data-q` ("key=value") matches the query string, then mirror
 * later choices into the URL, dropping every key the radios use. Constant code, no DB strings.
 */
const PRESELECT_SCRIPT =
  '!function(){try{var r=document.currentScript.previousElementSibling.querySelectorAll("input[data-q]"),' +
  "q=new URLSearchParams(location.search),k=[];r.forEach(function(i){var p=i.dataset.q.split(\"=\");" +
  "k.push(p[0]);if(q.get(p[0])===p[1])i.checked=!0});r.forEach(function(i){i.addEventListener(\"change\"," +
  "function(){var u=new URL(location.href),p=i.dataset.q.split(\"=\");k.forEach(function(x){u.searchParams.delete(x)});" +
  'u.searchParams.set(p[0],p[1]);history.replaceState(history.state,"",u)})})}catch(e){}}()';

/** «مدل»، «رنگ»، «عرض»… from the variants' option keys. */
function legendFor(variants: ProductVariantData[]): string {
  const keys = [...new Set(variants.flatMap((v) => Object.keys(v.options)))];
  return keys.length ? `انتخاب ${keys.join(" و ")}` : "انتخاب مدل";
}

export function VariantPicker({ productId, variants, className }: VariantPickerProps) {
  if (variants.length < 2) return null;
  const css = variantSwapCss(variants);
  return (
    <>
      <fieldset className={cn("flex flex-col gap-3", className)}>
        <legend className="mb-3 text-sm font-bold text-ink">{legendFor(variants)}</legend>
        <div className="flex flex-wrap gap-2.5">
          {variants.map((variant, index) => {
            const swatch = variant.swatch && HEX_COLOUR.test(variant.swatch) ? variant.swatch : null;
            return (
              <label key={variant.id} className={styles.option}>
                <input
                  type="radio"
                  name={VARIANT_INPUT_NAME}
                  id={variantInputId(variant.id)}
                  value={variant.id}
                  defaultChecked={index === 0}
                  data-q={variant.query}
                  className="sr-only"
                />
                {swatch ? (
                  <span aria-hidden="true" className={styles.chip} style={{ "--chip": swatch } as CSSProperties} />
                ) : null}
                <span className="flex flex-col">
                  <span className="text-sm font-bold text-ink">{variant.name}</span>
                  <span className="text-xs text-muted">
                    {variant.availability === "out_of_stock" ? "فعلاً تموم شده" : formatToman(variant.price)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {css ? (
          <style href={`variant-swap-${productId}`} precedence="medium">
            {css}
          </style>
        ) : null}
      </fieldset>
      <InlineScript html={PRESELECT_SCRIPT} />
    </>
  );
}

type VariantSwapProps = {
  offers: Offer[];
  children: (offer: Offer, index: number) => ReactNode;
  /**
   * Copies are only rendered when this value differs between offers (e.g. the availability):
   * identical copies would only cost bytes.
   */
  differsBy?: (offer: Offer) => string | number;
  as?: "div" | "span";
  className?: string;
};

/**
 * One copy of `children` per offer, stacked in one grid cell (sized to the longest copy, so a
 * switch never shifts the layout). The checked variant's copy is the visible one.
 */
export function VariantSwap({ offers, children, differsBy, as: Tag = "div", className }: VariantSwapProps) {
  const same = offers.length < 2 || (differsBy && new Set(offers.map(differsBy)).size === 1);
  if (same) return <Tag className={className}>{children(offers[0], 0)}</Tag>;
  return (
    <Tag className={cn(styles.swap, className)}>
      {offers.map((offer, index) => (
        <Tag
          key={offer.variantId ?? index}
          data-variant-only={offer.variantId ?? undefined}
          data-variant-default={index === 0 ? "" : undefined}
          className={styles.copy}
        >
          {children(offer, index)}
        </Tag>
      ))}
    </Tag>
  );
}
