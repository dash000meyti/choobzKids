import Link from "next/link";
import type { CSSProperties } from "react";
import { ArticleCard } from "@/components/mag/ArticleCard";
import { Callout } from "@/components/mag/Callout";
import { Prose } from "@/components/mag/Prose";
import { ProductCard } from "@/components/shop/ProductCard";
import { RoomCard } from "@/components/shop/RoomCard";
import { AGE_TINT } from "@/components/ui/tints";
import type { AgeSectionData } from "@/db/queries/age";
import type { FaqEntry } from "@/db/queries/faq";
import type { AgeStageKey } from "@/lib/ages";
import { grainStyle } from "@/lib/grain";
import { cn } from "@/lib/utils";
import styles from "./AgeSection.module.css";

/*
 * One anchored sub-range of an age hub (DESIGN.md §7.5): #1-2-years, #2-3-years …
 *   milestone paragraph (guide voice, YMYL) → home-play tips → products carded here, plus the ones
 *   carded in a neighbouring range that suit this one too → the matching ready-made room →
 *   guides for this age. Every block renders only when it has something real to show.
 *
 * `FaqDrawers` is the cabinet-drawer FAQ (DESIGN.md §5.10) shared by the hub FAQ and /faq:
 * server-rendered <details>, the first one open, answers through Prose so FAQPage mirrors them.
 */

type AgeSectionProps = {
  section: AgeSectionData;
  /** «نوزاد» or «کودک»: who the heading asks about. */
  noun: string;
  /** Tint for a sub-range that opens no home-door stage (e.g. 4 to 6 years). */
  fallbackTint: AgeStageKey;
  className?: string;
};

const PREFETCHED = 4;

export function AgeSection({ section, noun, fallbackTint, className }: AgeSectionProps) {
  const titleId = `${section.anchor}-title`;
  const tint = section.stage?.key ?? fallbackTint;
  return (
    <section id={section.anchor} aria-labelledby={titleId} className={cn(styles.section, className)}>
      <header className="flex flex-col items-start gap-3">
        <span className={cn(styles.badge, AGE_TINT[tint])}>{section.label}</span>
        <h2 id={titleId} className="font-display text-2xl text-ink">
          {noun} {section.label}ه چه کارهایی می‌کند؟
        </h2>
      </header>

      {section.milestone || section.tips.length ? (
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          {section.milestone ? <p className="max-w-prose text-lead text-ink">{section.milestone}</p> : null}
          {section.tips.length ? (
            <Callout kind="tip" title="بازی‌های پیشنهادی برای این سن">
              <ul className={styles.tips}>
                {section.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </Callout>
          ) : null}
        </div>
      ) : null}

      {section.products.length || section.alsoSuitable.length ? (
        <div className="mt-10">
          <h3 className="text-lg font-bold text-ink">وسایل چوبی مناسب {section.label}</h3>
          {section.products.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {section.products.map((product, i) => (
                <li key={product.id}>
                  <ProductCard product={product} prefetch={i < PREFETCHED} />
                </li>
              ))}
            </ul>
          ) : null}
          {section.alsoSuitable.length ? (
            <p className="mt-4 text-sm text-muted">
              {section.products.length ? "این‌ها هم برای همین سن مناسب‌اند: " : "برای این سن مناسب‌اند: "}
              {section.alsoSuitable.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 ? "، " : null}
                  <Link href={`/product/${p.slug}`} className="link-mark text-ink">
                    {p.name}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      ) : null}

      {section.room ? (
        <div className="mt-10">
          <h3 className="text-lg font-bold text-ink">چیدمان آمادهٔ اتاق برای این سن</h3>
          <RoomCard room={section.room} className="mt-4 lg:max-w-3xl" />
        </div>
      ) : null}

      {section.posts.length ? (
        <div className="mt-10">
          <h3 className="text-lg font-bold text-ink">راهنماهای این سن در مجلهٔ چوبز</h3>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.posts.map((post) => (
              <li key={post.id}>
                <ArticleCard post={post} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ drawers                                                         */
/* ------------------------------------------------------------------ */

type FaqDrawersProps = {
  faqs: FaqEntry[];
  /** Open the first drawer (DESIGN.md §5.10, SEO.md §8.10). */
  openFirst?: boolean;
  /** Grain seed, so neighbouring lists don't share a board. */
  seed: string;
  className?: string;
};

export function FaqDrawers({ faqs, openFirst = true, seed, className }: FaqDrawersProps) {
  if (!faqs.length) return null;
  return (
    <div className={cn("flex flex-col", className)} style={grainStyle(seed) as CSSProperties}>
      {faqs.map((faq, i) => (
        <details key={faq.id} className={styles.drawer} open={openFirst && i === 0}>
          <summary className={styles.front}>
            <h3 className={styles.question}>{faq.question}</h3>
            <span aria-hidden="true" className={styles.knob} />
          </summary>
          <div className={styles.answer}>
            <Prose markdown={faq.answer} variant="compact" />
          </div>
        </details>
      ))}
    </div>
  );
}
