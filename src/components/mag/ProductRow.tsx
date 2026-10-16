import { getProductCardsBySlugs } from "@/db/queries/catalog";
import { listVariantOptions } from "@/db/queries/cards";
import { IntentLink } from "@/components/ui/IntentLink";
import { Price } from "@/components/ui/Price";
import { Stage } from "@/components/ui/Stage";
import { cn } from "@/lib/utils";
import { EmbedQuickAdd, embedStage, pricesDiffer } from "./ProductEmbed";
import styles from "./ProductEmbed.module.css";

/*
 * `::products{slugs="a,b,c"}` (docs/CONTENT-FORMAT.md): a small row of 2–4 products, e.g. at the
 * end of a checklist. Compact raised pieces (stage, name, price, quick add); no view-transition
 * names, so a product can also appear in the page's own product grid.
 */

export async function ProductRow({ slugs }: { slugs: string }) {
  const wanted = slugs.split(/[,\s]+/).filter(Boolean);
  const [products, variantsByProduct] = await Promise.all([getProductCardsBySlugs(wanted), listVariantOptions()]);
  if (!products.length) return null;

  return (
    <div data-block="">
      <p className="mb-2 text-xs text-muted">در این راهنما از این‌ها استفاده کردیم</p>
      <ul role="list" data-count={products.length} className={styles.row}>
        {products.map((product) => {
          const variants = variantsByProduct[product.id] ?? [];
          const stage = embedStage(product, "(min-width: 40rem) 180px, 45vw");
          return (
            <li key={product.id} data-cart-source="" className={cn("group", styles.card, styles.item)}>
              {stage ? (
                <Stage {...stage.media} alt={stage.alt} slug={product.slug} />
              ) : (
                <span aria-hidden="true" className={cn("rounded-arch bg-surface", styles.stage)} />
              )}
              <p className="line-clamp-2 px-1 text-sm leading-snug font-bold text-ink">
                <IntentLink href={`/product/${product.slug}`} transitionTypes={["nav-forward"]} className={styles.link}>
                  {product.name}
                </IntentLink>
              </p>
              <div className="mt-auto flex min-h-11 items-center justify-between gap-2 ps-1">
                <Price price={product.price} compareAt={product.compareAtPrice} from={pricesDiffer(variants)} size="sm" showDiscount={false} />
                <div className={styles.above}>
                  <EmbedQuickAdd product={product} variants={variants} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
