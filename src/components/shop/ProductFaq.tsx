import type { ProductFaqData } from "@/db/queries/product";
import { Prose } from "@/components/mag/Prose";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import styles from "./ProductFaq.module.css";

/*
 * «پرسش‌های این محصول» (DESIGN.md §6.3 block 17, SEO.md §3.5.8): the product's own Q&As as native
 * <details> (the first one open), answers rendered from Markdown on the server. The page's
 * FAQPage node is built from exactly these rows, so markup and text never drift apart.
 */

type ProductFaqProps = {
  faqs: ProductFaqData[];
  className?: string;
};

export function ProductFaq({ faqs, className }: ProductFaqProps) {
  if (!faqs.length) return null;
  return (
    <section id="faq" aria-labelledby="faq-title" className={cn("flex flex-col gap-5", className)}>
      <SectionHeader id="faq-title" size="content" title="پرسش‌های این محصول" />
      <div className="flex flex-col gap-3">
        {faqs.map((faq, index) => (
          <details key={faq.id} open={index === 0} className={styles.item}>
            <summary className={styles.summary}>
              <h3 className="text-base leading-relaxed font-bold text-ink">{faq.question}</h3>
              <Icon name="plus" className={cn("size-5 shrink-0 text-muted", styles.icon)} />
            </summary>
            <div className="px-5 pb-5">
              <Prose markdown={faq.answer} variant="compact" />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
