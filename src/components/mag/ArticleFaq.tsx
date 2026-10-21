import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import styles from "./ArticleFaq.module.css";

/*
 * «پرسش‌های پرتکرار» (DESIGN.md §7.3 #9): native <details> drawers, the first one open, every
 * answer in the server HTML. The same Q&As feed the page's FAQPage node verbatim.
 */

export type FaqEntry = { question: string; answer: string };

type ArticleFaqProps = {
  faqs: FaqEntry[];
  className?: string;
};

export const FAQ_SECTION_ID = "faq";
export const FAQ_TITLE = "پرسش‌های پرتکرار";

export function ArticleFaq({ faqs, className }: ArticleFaqProps) {
  if (!faqs.length) return null;
  return (
    <section id={FAQ_SECTION_ID} aria-labelledby="faq-h" className={cn("flex flex-col gap-4", className)}>
      <h2 id="faq-h" className="text-xl font-extrabold text-ink">
        {FAQ_TITLE}
      </h2>
      <div className="flex flex-col gap-3">
        {faqs.map((faq, index) => (
          <details key={index} open={index === 0} className={styles.drawer}>
            <summary className={styles.summary}>
              <span className="flex-1">{faq.question}</span>
              <Icon name="plus" className={cn("size-5 shrink-0", styles.toggle)} />
            </summary>
            <div className="flex flex-col gap-3 px-4 pb-4 text-base text-ink">
              {faq.answer
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
