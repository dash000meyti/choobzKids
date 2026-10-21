import type { SiteSettings } from "@/db/queries/settings";
import { InstallmentLine } from "@/components/ui/InstallmentLine";
import { InstallmentWheels } from "@/components/ui/InstallmentWheels";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/utils";
import type { Offer } from "./product-offers";
import { VariantSwap } from "./VariantPicker";

/*
 * Price block (DESIGN.md §6.3 block 5, §4.13; SEO.md §6.4), money voice. The price with its
 * struck-through compare-at and discount stamp; directly under it the SnappPay sentence in HTML
 * text with its «چطور؟» link; then the four cart wheels and their fine print. One copy per
 * variant (VariantSwap). The root carries `data-price-timeline`: as it scrolls out, the mobile
 * dock turns over to the buy bar on its view timeline (BottomDock.module.css, BuyBar).
 */

type PriceBlockProps = {
  offers: Offer[];
  snapppay: SiteSettings["snapppay"];
  className?: string;
};

export function PriceBlock({ offers, snapppay, className }: PriceBlockProps) {
  return (
    <section data-price-timeline="" aria-label="قیمت و اقساط" className={cn("flex flex-col gap-4", className)}>
      <VariantSwap offers={offers}>
        {(offer) => (
          <div className="flex flex-col gap-1">
            <Price price={offer.price} compareAt={offer.compareAt} size="lg" className="[&>data]:text-2xl" />
            <InstallmentLine price={offer.price} snapppay={snapppay} variant="pdp" />
          </div>
        )}
      </VariantSwap>
      <VariantSwap offers={offers} differsBy={(offer) => offer.price}>
        {(offer) => <InstallmentWheels total={offer.price} snapppay={snapppay} caption={null} wheelSize={36} />}
      </VariantSwap>
    </section>
  );
}
