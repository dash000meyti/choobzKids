import type { ProductCardData } from "@/db/queries/catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

/*
 * «شاید این‌ها هم» (DESIGN.md §6.3 block 21): the related products (`product_relations.kind =
 * 'related'`), as a row of product cards. Card links prefetch on intent: none of them is the
 * page's main path, and the current product never appears (its morph name is taken).
 */

type RelatedProductsProps = {
  products: ProductCardData[];
  className?: string;
};

const LIMIT = 4;

export function RelatedProducts({ products, className }: RelatedProductsProps) {
  if (!products.length) return null;
  return (
    <section aria-labelledby="related-title" className={cn("flex flex-col gap-6", className)}>
      <SectionHeader id="related-title" size="content" title="شاید این‌ها هم" link={{ label: "همهٔ وسایل ←", href: "/shop" }} />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {products.slice(0, LIMIT).map((card) => (
          <li key={card.id}>
            <ProductCard product={card} showCategory />
          </li>
        ))}
      </ul>
    </section>
  );
}
