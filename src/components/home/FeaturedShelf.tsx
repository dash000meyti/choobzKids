import type { CSSProperties } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { listFeaturedProductCards } from "@/db/queries/catalog";
import { listSeasonalPickIds } from "@/db/queries/home-story";
import { getSettings } from "@/db/queries/settings";
import { cn } from "@/lib/utils";
import styles from "./FeaturedShelf.module.css";

/*
 * Workshop picks (DESIGN.md §5.4): the featured products standing on a front-facing wall
 * shelf, a laminated shelf board under every row. Two columns on phones; on desktop the row
 * length follows the count (4 × 2 for eight, 3 × 2 for six) so no row is left half empty.
 * The season's gift-guide picks carry «پیشنهاد یلدا». The first four cards prefetch fully so
 * their stage morphs into the product page.
 */

const TITLE_ID = "featured-title";

export async function FeaturedShelf() {
  const [products, settings] = await Promise.all([listFeaturedProductCards(8), getSettings()]);
  if (!products.length) return null;

  const seasonal = new Set(settings.season ? await listSeasonalPickIds(settings.season) : []);
  const wideColumns = products.length % 4 === 0 ? styles.four : styles.three;

  return (
    <section aria-labelledby={TITLE_ID}>
      <div className="frame-col frame-pad py-band">
        <SectionHeader
          id={TITLE_ID}
          title="پیشنهادهای کارگاه"
          sub="اگه نمی‌دونی از کجا شروع کنی، از همین‌ها شروع کن."
          link={{ label: "همهٔ محصولات ←", href: "/shop" }}
        />
        <ul role="list" className={cn(styles.shelf, wideColumns, "mt-10")}>
          {products.map((product, i) => (
            <li key={product.id} className={styles.slot} style={{ "--i": i } as CSSProperties}>
              <div className={styles.rise}>
                <ProductCard product={product} prefetch={i < 4} seasonalStamp={seasonal.has(product.id)} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
