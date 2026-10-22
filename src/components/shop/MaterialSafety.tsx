import Link from "@/components/ui/Link";
import type { ProductPageData } from "@/db/queries/product";
import type { SiteSettings } from "@/db/queries/settings";
import { Callout } from "@/components/mag/Callout";
import { Prose } from "@/components/mag/Prose";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { faNumber, firstClause, warrantyText } from "./product-facts";
import styles from "./MaterialSafety.module.css";

/*
 * «جنس و ایمنی» (DESIGN.md §6.3 block 14). A macro cross-section of the board's cut edge with HTML
 * labels for the finish, the plywood and the rounded edge; a check list of the safety facts
 * (max load, finish, the workshop's ⚑ safety points from settings); the product's safety notes
 * as a «نکتهٔ ایمنی» callout; care notes; the warranty line. Truth layer: no marks here.
 */

type MaterialSafetyProps = {
  product: Pick<
    ProductPageData["product"],
    "name" | "material" | "finish" | "maxLoadKg" | "safetyNotes" | "careNotes" | "guaranteeText" | "warrantyMonths"
  >;
  safetyPoints: SiteSettings["safety_points"];
  className?: string;
};

/** The magnified edge: 13 alternating plies under a clear coat, with a router-rounded end. */
function PlyMacro({ material, finish }: { material: string | null; finish: string | null }) {
  return (
    <figure className={styles.macro}>
      <div dir="ltr" className={styles.scene} aria-hidden="true">
        <span className={styles.board}>
          {Array.from({ length: 13 }, (_, i) => (
            <span key={i} className={styles.ply} />
          ))}
          <span className={styles.coat} />
        </span>
        {finish ? <span className={cn(styles.label, styles.labelCoat)}>{finish}</span> : null}
        {material ? <span className={cn(styles.label, styles.labelPly)}>{material}</span> : null}
        <span className={cn(styles.label, styles.labelEdge)}>لبهٔ گرد، بدون گوشهٔ تیز</span>
      </div>
      <figcaption className="mt-3 text-xs text-muted">
        <span className="sr-only">
          {[finish && `روکش: ${finish}`, material && `بدنه: ${material}`, "لبهٔ گرد، بدون گوشهٔ تیز"].filter(Boolean).join("؛ ")}.{" "}
        </span>
        لبهٔ برش‌خوردهٔ تخته، از نزدیک
      </figcaption>
    </figure>
  );
}

export function MaterialSafety({ product, safetyPoints, className }: MaterialSafetyProps) {
  const material = firstClause(product.material);
  const finish = firstClause(product.finish);
  const warranty = warrantyText(product);
  const checks: { text: string; href?: string }[] = [
    ...(product.maxLoadKg ? [{ text: `تحمل وزن تا ${faNumber(product.maxLoadKg)} کیلوگرم` }] : []),
    ...(product.finish ? [{ text: product.finish }] : []),
    ...safetyPoints.map((point) => ({ text: point.title, href: point.href })),
  ];

  return (
    <section aria-labelledby="safety-title" className={className}>
      <SectionHeader id="safety-title" size="content" title="جنس و ایمنی" sub={product.material ?? undefined} />
      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <PlyMacro material={material} finish={finish} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-7">
          {checks.length ? (
            <ul className="flex flex-col gap-2.5">
              {checks.map((check) => (
                <li key={check.text} className="flex items-start gap-3 text-base text-ink">
                  <span aria-hidden="true" className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-success text-on-accent">
                    <Icon name="check" className="size-4" />
                  </span>
                  {check.href ? (
                    <Link href={check.href} className="link-mark">
                      {check.text}
                    </Link>
                  ) : (
                    <span>{check.text}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {product.safetyNotes ? (
            <Callout kind="warning">
              <Prose markdown={product.safetyNotes} variant="compact" />
            </Callout>
          ) : null}

          {product.careNotes ? (
            <div>
              <h3 className="text-lg font-bold text-ink">نگهداری</h3>
              <Prose markdown={product.careNotes} variant="compact" className="mt-1.5" />
            </div>
          ) : null}

          {warranty ? (
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-ink">
              <Icon name="stamp" className="size-5 text-success" />
              <span className="font-semibold">{warranty}</span>
              <Link href="/warranty" className="link-mark font-semibold">
                شرایط ضمانت ←
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
