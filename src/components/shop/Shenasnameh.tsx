import Link from "@/components/ui/Link";
import type { ReactNode } from "react";
import { orthoLabels } from "@/components/illustrations/sizes";
import type { ProductPageData } from "@/db/queries/product";
import type { SiteSettings } from "@/db/queries/settings";
import { Icon, type IconName } from "@/components/ui/Icon";
import { INSTALLMENTS_HREF, installmentPlan } from "@/components/ui/installments";
import { ageHubFor } from "@/components/ui/tints";
import { ageBadgeLabel } from "@/components/ui/AgeBadge";
import { formatNumber, formatToman, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { dimensionsText, faNumber, firstClause, leadTimeText, listOr, warrantyText } from "./product-facts";
import type { Offer } from "./product-offers";
import { platformLevels } from "./scale-advice";
import { VariantSwap } from "./VariantPicker";
import styles from "./Shenasnameh.module.css";

/*
 * «شناسنامهٔ این محصول» (DESIGN.md §6.3 block 6) — SEO.md §4.7's «در یک نگاه» <dl>, styled as a
 * kraft birth certificate with a burnt workshop stamp. Truth layer: flat paper (it is read, not
 * pressed), ink only. Rows: age (→ age hub), dimensions, max load, material & finish (→ /safety),
 * lead time, warranty (→ /warranty), payment (→ /installments), made by (→ /workshop). Rows
 * whose data is missing are left out; price-dependent rows follow the chosen variant.
 */

type ShenasnamehProps = {
  product: ProductPageData["product"];
  offers: Offer[];
  settings: Pick<SiteSettings, "snapppay" | "shippingPolicy" | "org">;
  className?: string;
};

type Row = { key: string; icon: IconName; label: string; value: ReactNode; wide?: boolean };

function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="link-mark text-ink">
      {children}
    </Link>
  );
}

/** W × D × H plus the one extra a buyer looks for: the platform levels, or the drawing's extra dimension. */
function dimensionsValue(product: ProductPageData["product"]): ReactNode {
  const d = product.dimensions;
  if (!d) return null;
  const levels = platformLevels(d);
  const extra = product.illustration ? orthoLabels(product.illustration).find((l) => l.name) : undefined;
  const note = levels.length
    ? `سکو در ${toFaDigits(levels.length)} ارتفاع: ${listOr(levels.map((l) => l.heightCm))}`
    : extra
      ? `${extra.name}: ${extra.label}`
      : null;
  return (
    <>
      <span className="block">{dimensionsText(d)}</span>
      <span className="block text-xs font-normal">عرض × عمق × ارتفاع{note ? ` · ${note}` : ""}</span>
    </>
  );
}

function paymentValue(offer: Offer, snapppay: SiteSettings["snapppay"]): ReactNode {
  const plan = installmentPlan(offer.price, snapppay);
  if (!plan) return formatToman(offer.price);
  return (
    <>
      {formatToman(offer.price)} یا{" "}
      <RowLink href={INSTALLMENTS_HREF}>
        {toFaDigits(plan.count)} قسط {formatNumber(plan.amount)} تومانی با اسنپ‌پی
      </RowLink>
    </>
  );
}

export function Shenasnameh({ product, offers, settings, className }: ShenasnamehProps) {
  const age = ageBadgeLabel(product.ageMinMonths, product.ageMaxMonths);
  const material = [firstClause(product.material), firstClause(product.finish)].filter(Boolean).join(" · ");
  const warranty = warrantyText(product);
  const city = settings.org.city?.trim();

  const rows: (Row | null)[] = [
    age
      ? {
          key: "age",
          icon: "hex",
          label: "مناسب برای سن",
          value: <RowLink href={`/age/${ageHubFor(product.ageMinMonths ?? 0)}`}>{age}</RowLink>,
        }
      : null,
    product.dimensions ? { key: "size", icon: "ruler", label: "ابعاد", value: dimensionsValue(product) } : null,
    product.maxLoadKg
      ? { key: "load", icon: "shield-leaf", label: "حداکثر وزن قابل تحمل", value: `${faNumber(product.maxLoadKg)} کیلوگرم` }
      : null,
    material
      ? { key: "material", icon: "leaf", label: "جنس و روکش", value: <RowLink href="/safety">{material}</RowLink>, wide: true }
      : null,
    {
      key: "lead",
      icon: "clock",
      label: "زمان آماده‌سازی و ارسال",
      value: (
        <VariantSwap offers={offers} differsBy={(o) => o.availability} as="span">
          {(offer) => leadTimeText(offer.availability, product.leadTimeDays, settings.shippingPolicy)}
        </VariantSwap>
      ),
    },
    warranty ? { key: "warranty", icon: "stamp", label: "ضمانت", value: <RowLink href="/warranty">{warranty}</RowLink> } : null,
    {
      key: "payment",
      icon: "wheels",
      label: "پرداخت",
      value: (
        <VariantSwap offers={offers} differsBy={(o) => o.price} as="span">
          {(offer) => paymentValue(offer, settings.snapppay)}
        </VariantSwap>
      ),
      wide: true,
    },
    {
      key: "maker",
      icon: "saw",
      label: "ساخت",
      // ⚑ The workshop's city shows once settings.org.city is confirmed.
      value: <RowLink href="/workshop">{city ? `کارگاه چوبز، ${city}` : "کارگاه چوبز"}</RowLink>,
    },
  ];

  return (
    <section aria-labelledby="shenasnameh-title" className={cn(styles.card, className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="shenasnameh-title" className="text-lg font-bold text-ink">
            شناسنامهٔ این محصول
          </h2>
          <p className="text-xs text-ink/75">در یک نگاه</p>
        </div>
        <span aria-hidden="true" className={styles.stamp}>
          <Icon name="stamp" className="size-5" />
          <span>ساخت چوبز</span>
        </span>
      </div>
      <dl className={styles.rows}>
        {rows
          .filter((row): row is Row => row !== null)
          .map((row) => (
            <div key={row.key} className={cn(styles.row, row.wide && styles.wide)}>
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink/80">
                <Icon name={row.icon} className="size-4 shrink-0" />
                {row.label}
              </dt>
              <dd className="ps-[1.375rem] text-sm leading-relaxed font-bold text-ink">{row.value}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}
