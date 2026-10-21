import type { ReactNode } from "react";
import type { ProductPageData } from "@/db/queries/product";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatNumber, tomanToRial } from "@/lib/format";
import { cn } from "@/lib/utils";
import { dimensionsText, faNumber } from "./product-facts";
import type { Offer } from "./product-offers";

/*
 * «مشخصات کامل» (DESIGN.md §6.3 block 16, SEO.md §2.7): the product's spec rows in a real <table>,
 * plus dimensions and weight when the rows do not already say them, the product code, and the
 * price in rials — the JSON-LD carries IRR, so the same figure is printed here, once per variant.
 * The same rows feed JSON-LD `additionalProperty`.
 */

type SpecsTableProps = {
  product: Pick<ProductPageData["product"], "name" | "sku" | "specs" | "dimensions" | "weightKg">;
  offers: Offer[];
  className?: string;
};

type Row = { label: string; value: ReactNode };

export function SpecsTable({ product, offers, className }: SpecsTableProps) {
  const has = (prefix: string) => product.specs.some((s) => s.label.trim().startsWith(prefix));
  const rows: Row[] = [
    ...product.specs.map((s) => ({ label: s.label, value: s.value })),
    ...(product.dimensions && !has("ابعاد") ? [{ label: "ابعاد (عرض × عمق × ارتفاع)", value: dimensionsText(product.dimensions) }] : []),
    ...(product.weightKg && !has("وزن") ? [{ label: "وزن", value: `${faNumber(product.weightKg)} کیلوگرم` }] : []),
    ...(product.sku
      ? [{ label: "کد محصول", value: <bdi dir="ltr" lang="en">{product.sku}</bdi> }]
      : []),
    ...offers.map((offer) => ({
      label: offers.length > 1 && offer.variantName ? `قیمت به ریال (${offer.variantName})` : "قیمت به ریال",
      value: (
        <data value={tomanToRial(offer.price)}>
          {formatNumber(tomanToRial(offer.price))} ریال
        </data>
      ),
    })),
  ];

  return (
    <section aria-labelledby="specs-title" className={cn("flex flex-col gap-5", className)}>
      <SectionHeader id="specs-title" size="content" title="مشخصات کامل" />
      <div className="overflow-hidden rounded-bit bg-raised shadow-paper">
        <table className="w-full border-collapse text-start text-sm">
          <caption className="sr-only">مشخصات {product.name}</caption>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-b-0 even:bg-surface/50">
                <th scope="row" className="w-2/5 px-4 py-3 text-start align-top font-semibold text-muted">
                  {row.label}
                </th>
                <td className="px-4 py-3 align-top font-semibold text-ink">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
