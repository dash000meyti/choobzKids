import { finishVars } from "@/components/illustrations/render";
import type { CartItem } from "@/components/layout/cart/store";
import type { Availability, ProductPageData } from "@/db/queries/product";

/*
 * What the visitor can buy on a product page: one offer per variant (or the product itself when
 * it has none). Every price-dependent block (price, installments, شناسنامه payment row,
 * availability, add-to-cart, buy bar, rial row) renders one copy per offer, stacked in one grid
 * cell, and a per-page <style> hides all but the checked variant's copy (DESIGN.md §6.3 block 7):
 *
 *   [data-pdp]:has(#variant-2:checked) [data-variant-only]:not([data-variant-only="2"]) { … }
 *
 * Zero JS, no layout shift (the cell is sized to the longest copy), and every value is in the
 * server HTML. The first offer is the default selection.
 */

export type Offer = {
  variantId: number | null;
  variantName: string | null;
  /** Toman. */
  price: number;
  /** Struck-through Toman; only the base price carries the product's compare-at. */
  compareAt: number | null;
  availability: Availability;
};

export const VARIANT_INPUT_NAME = "variant";

export const variantInputId = (variantId: number) => `variant-${variantId}`;

export function productOffers({ product, variants }: Pick<ProductPageData, "product" | "variants">): Offer[] {
  if (!variants.length) {
    return [
      {
        variantId: null,
        variantName: null,
        price: product.price,
        compareAt: product.compareAtPrice,
        availability: product.availability,
      },
    ];
  }
  return variants.map((v) => ({
    variantId: v.id,
    variantName: v.name,
    price: v.price,
    compareAt: v.price === product.price ? product.compareAtPrice : null,
    availability: v.availability,
  }));
}

/** Whether a choice exists: a single variant row is bought as is, without a picker. */
export const hasChoice = (offers: Offer[]) => offers.length > 1;

export const pricesDiffer = (offers: Offer[]) => new Set(offers.map((o) => o.price)).size > 1;

export function cartItem(
  { product, media }: Pick<ProductPageData, "product" | "media">,
  offer: Offer,
): Omit<CartItem, "key" | "qty"> {
  return {
    productId: product.id,
    variantId: offer.variantId,
    slug: product.slug,
    name: product.name,
    variantName: offer.variantName,
    priceToman: offer.price,
    illustration: product.illustration,
    imagePath: media[0]?.path ?? null,
  };
}

/** Option values that have their own drawing finish (the rest keep the natural birch drawing). */
const FINISH_BY_VALUE: Record<string, string> = {
  سفید: "white",
  white: "white",
};

export function variantFinish(options: Record<string, string>): string | null {
  for (const value of Object.values(options)) {
    const finish = FINISH_BY_VALUE[value.trim()];
    if (finish) return finish;
  }
  return null;
}

/**
 * The per-page swap rules: one rule per variant, plus one per variant with its own finish, which
 * recolours the inline manifest stage through its wood variables. Ids are integers from the DB,
 * so nothing user-written reaches this stylesheet.
 */
export function variantSwapCss(variants: Pick<ProductPageData["variants"][number], "id" | "options">[]): string {
  if (variants.length < 2) return "";
  return variants
    .map((v) => {
      const checked = `[data-pdp]:has(#${variantInputId(v.id)}:checked)`;
      const hide = `${checked} [data-variant-only]:not([data-variant-only="${v.id}"]){visibility:hidden;opacity:0}`;
      const vars = finishVars(variantFinish(v.options) ?? undefined);
      const recolour = vars
        ? `${checked} [data-parts-stage]{${Object.entries(vars)
            .map(([name, value]) => `${name}:${value}`)
            .join(";")}}`
        : "";
      return hide + recolour;
    })
    .join("");
}
