import Link from "@/components/ui/Link";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Kicker";
import type { PageFaq } from "@/db/queries/pages";
import type { SiteSettings } from "@/db/queries/settings";
import type { BreadcrumbItem } from "@/lib/jsonld";
import { formatJalali, formatToman, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Prose } from "./Prose";
import styles from "./PolicyPage.module.css";

/*
 * PolicyPage (DESIGN.md §8): the template of the trust and legal pages — shipping, returns,
 * warranty, safety, trust, installments, privacy, terms, editorial policy, contact.
 * Breadcrumb, H1, a «خلاصه در یک نگاه» box holding the page's answer and its key numbers, any
 * page-specific blocks (the installment calculator, the eNamad seal…), the Markdown body in the
 * narrow measure, the page's own FAQs as drawers, then «آخرین به‌روزرسانی», related pages and
 * AskChoobz in a side column (below the body on phones).
 *
 * Truth layer: no Tati, no marks, no swash. The only story-voice line allowed is the optional
 * kicker above the H1. The route renders the page's JSON-LD; this template renders none.
 */

export type PolicyFact = {
  /** What the number is, e.g. «مهلت بازگشت کالا». */
  label: string;
  /** The number in words and Persian digits, e.g. «۷ روز». */
  value: ReactNode;
  /** A short qualifier under the value, e.g. «از روز تحویل». */
  note?: string;
};

export type PolicyLink = { label: string; href: string };

/* ------------------------------------------------------------------ */
/* Related pages                                                        */
/* ------------------------------------------------------------------ */

const LINKS = {
  shipping: { label: "ارسال و تحویل", href: "/shipping" },
  returns: { label: "بازگشت کالا", href: "/returns" },
  warranty: { label: "گارانتی و خدمات پس از فروش", href: "/warranty" },
  safety: { label: "ایمنی و مواد", href: "/safety" },
  installments: { label: "خرید قسطی با اسنپ‌پی", href: "/installments" },
  trust: { label: "اعتماد شما و نماد اعتماد", href: "/trust" },
  privacy: { label: "حریم خصوصی", href: "/privacy" },
  terms: { label: "قوانین و مقررات", href: "/terms" },
  contact: { label: "تماس با ما", href: "/contact" },
  workshop: { label: "کارگاه چوبز", href: "/workshop" },
  team: { label: "تیم و نویسندگان", href: "/team" },
  mag: { label: "مجله چوبز", href: "/mag" },
  faq: { label: "سؤالات متداول", href: "/faq" },
  safetyGuide: { label: "راهنمای ایمنی وسایل چوبی کودک", href: "/mag/wooden-toy-safety-guide" },
} as const satisfies Record<string, PolicyLink>;

const faqSection = (anchor: string, label: string): PolicyLink => ({ label, href: `/faq#${anchor}` });

const RELATED: Record<string, PolicyLink[]> = {
  shipping: [LINKS.returns, LINKS.installments, faqSection("shipping", "پرسش‌های ارسال"), LINKS.contact],
  returns: [LINKS.warranty, LINKS.shipping, faqSection("returns", "پرسش‌های بازگشت و ضمانت"), LINKS.contact],
  warranty: [LINKS.returns, LINKS.safety, LINKS.workshop, LINKS.contact],
  safety: [LINKS.safetyGuide, LINKS.workshop, LINKS.warranty, faqSection("safety", "پرسش‌های ایمنی و نگهداری")],
  installments: [faqSection("installments", "پرسش‌های اقساط"), LINKS.returns, LINKS.shipping, LINKS.trust],
  trust: [LINKS.contact, LINKS.privacy, LINKS.terms, LINKS.returns],
  privacy: [LINKS.terms, LINKS.trust, LINKS.contact],
  terms: [LINKS.privacy, LINKS.returns, LINKS.shipping, LINKS.warranty],
  "editorial-policy": [LINKS.team, LINKS.mag, LINKS.contact],
  contact: [LINKS.faq, LINKS.shipping, LINKS.returns, LINKS.trust],
};

/** The pages a reader of `slug` usually needs next; trust pages by default. */
export function relatedPolicies(slug: string): PolicyLink[] {
  return RELATED[slug] ?? [LINKS.shipping, LINKS.returns, LINKS.warranty, LINKS.contact];
}

/* ------------------------------------------------------------------ */
/* Key numbers from settings (⚑ fields: each fact exists only when set) */
/* ------------------------------------------------------------------ */

/** [1, 3] → «۱ تا ۳ روز کاری». */
export function workingDays([from, to]: readonly [number, number]): string {
  return from === to ? `${toFaDigits(from)} روز کاری` : `${toFaDigits(from)} تا ${toFaDigits(to)} روز کاری`;
}

/** The numbers of the org's ShippingService, so the visible page matches its JSON-LD. */
export function shippingFacts(policy: SiteSettings["shippingPolicy"]): PolicyFact[] {
  if (!policy) return [];
  const facts: PolicyFact[] = [{ label: "محدودهٔ ارسال", value: "سراسر ایران" }];
  if (policy.handlingDays) {
    facts.push({ label: "آماده‌سازی در کارگاه", value: workingDays(policy.handlingDays), note: "برای محصولات موجود" });
  }
  if (policy.transitDays) facts.push({ label: "در راه تا شهر شما", value: workingDays(policy.transitDays) });
  if (policy.rateToman != null) {
    facts.push({ label: "هزینهٔ ارسال", value: policy.rateToman === 0 ? "رایگان" : formatToman(policy.rateToman) });
  }
  if (policy.freeOverToman != null) {
    facts.push({ label: "ارسال رایگان", value: `از ${formatToman(policy.freeOverToman)}`, note: "برای جمع سبد خرید" });
  }
  return facts;
}

/** The org's MerchantReturnPolicy in words. */
export function returnFacts(policy: SiteSettings["returnPolicy"]): PolicyFact[] {
  if (!policy) return [];
  const facts: PolicyFact[] = [
    policy.days > 0
      ? { label: "مهلت انصراف از خرید", value: `${toFaDigits(policy.days)} روز کاری`, note: "از روز تحویل کالا" }
      : { label: "بازگشت کالا", value: "امکان‌پذیر نیست" },
  ];
  if (policy.excludedTypes.length) {
    facts.push({ label: "بازگشت‌پذیر نیست", value: policy.excludedTypes.join("، ") });
  }
  return facts;
}

/** «۱۲ ماه» on every product, or «۶ تا ۱۲ ماه» when products differ. */
export function warrantyFact(months: { min: number; max: number } | null): PolicyFact | null {
  if (!months) return null;
  const same = months.min === months.max;
  return {
    label: "گارانتی ساخت",
    value: same ? `${toFaDigits(months.max)} ماه` : `${toFaDigits(months.min)} تا ${toFaDigits(months.max)} ماه`,
    note: same ? "روی همهٔ محصولات، از روز تحویل" : "بسته به محصول، از روز تحویل",
  };
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

/** «خلاصه در یک نگاه»: the page's answer, then its key numbers as a definition list. */
export function PolicySummary({ text, facts = [], className }: { text?: string | null; facts?: PolicyFact[]; className?: string }) {
  if (!text && !facts.length) return null;
  // Frame system: the summary and its numbers as one cells panel (shared hairlines).
  return (
    <section
      aria-labelledby="summary-title"
      className={cn("cells", facts.length > 1 && "grid-cols-2", facts.length > 2 && "sm:grid-cols-3", className)}
    >
      <div className="col-span-full p-6 sm:p-8">
        <h2 id="summary-title" className="text-sm font-semibold text-muted">
          خلاصه در یک نگاه
        </h2>
        {text ? <p className="mt-3 text-base leading-8 text-ink sm:text-[1.125rem]">{text}</p> : null}
      </div>
      {facts.length ? (
        <dl className="contents">
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-1 bg-bg p-5 sm:p-6">
              <dt className="text-xs text-muted">{fact.label}</dt>
              <dd className="flex flex-col">
                <span className="text-base leading-snug font-bold text-ink sm:text-lg">{fact.value}</span>
                {fact.note ? <span className="mt-0.5 text-xs text-muted">{fact.note}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

export type FactRow = { label: string; value: ReactNode };

/** Label/value lines on hairlines (business identifiers, «چوبز در یک نگاه»). Empty rows are the caller's to drop. */
export function FactList({ rows, className }: { rows: FactRow[]; className?: string }) {
  if (!rows.length) return null;
  return (
    <dl className={cn("flex flex-col", className)}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid gap-x-6 gap-y-0.5 border-b border-line py-3 last:border-b-0 sm:grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)]"
        >
          <dt className="text-sm text-muted">{row.label}</dt>
          <dd className="text-base text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A page's own FAQs as an exclusive set of drawers, the first one open. Server HTML, no JS. */
export function PageFaqs({
  faqs,
  name,
  title = "پرسش‌های پرتکرار",
  className,
}: {
  faqs: PageFaq[];
  /** Groups the drawers so opening one closes the others (`<details name>`). */
  name: string;
  title?: string;
  className?: string;
}) {
  if (!faqs.length) return null;
  return (
    <section id="faq" aria-labelledby="faq-title" className={cn("scroll-mt-24", className)}>
      <h2 id="faq-title" className="headline text-2xl lg:text-[2.25rem]">
        {title}
      </h2>
      <div className="mt-5 flex flex-col gap-3">
        {faqs.map((faq, index) => (
          <details key={faq.question} name={name} open={index === 0} className={styles.drawer}>
            <summary className={styles.front}>
              <span className="min-w-0 flex-1 font-semibold">{faq.question}</span>
              <span aria-hidden="true" className={styles.knob} />
            </summary>
            <div className={styles.inside}>
              <Prose markdown={faq.answer} variant="compact" />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/** «آخرین به‌روزرسانی» from the row's own timestamp (never the clock). */
export function LastUpdated({ date, className }: { date: string; className?: string }) {
  return (
    <p className={cn("text-sm text-muted", className)}>
      آخرین به‌روزرسانی: <time dateTime={date}>{formatJalali(new Date(date))}</time>
    </p>
  );
}

export function RelatedLinks({ links, className }: { links: PolicyLink[]; className?: string }) {
  if (!links.length) return null;
  return (
    <nav aria-labelledby="related-title" className={className}>
      <h2 id="related-title" className="text-base font-bold text-ink">
        صفحه‌های مرتبط
      </h2>
      <ul className="mt-2 flex flex-col">
        {links.map((link) => (
          <li key={link.href} className="border-b border-line last:border-b-0">
            <Link href={link.href} className="group flex min-h-12 items-center justify-between gap-3 text-sm text-ink">
              <span className="link-mark">{link.label}</span>
              <Icon
                name="chevron-end"
                className="size-4 text-muted transition-[translate] duration-(--dur-quick) ease-wood group-hover:-translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* The template                                                        */
/* ------------------------------------------------------------------ */

type PolicyPageProps = {
  /** Home first, this page last (crumbTrail); the route passes the same list to breadcrumbNode. */
  trail: BreadcrumbItem[];
  /** The H1, in plain search words. */
  title: string;
  /** Optional story-voice line above the H1 (decorative, hidden from assistive tech). */
  kicker?: string;
  /** A lead paragraph under the H1, for pages without a summary box (e.g. contact). */
  intro?: string | null;
  summary?: { text?: string | null; facts?: PolicyFact[] } | null;
  /** The page's Markdown body. */
  body: string;
  /** The page slug: seeds checklist storage and the FAQ drawer group. */
  slug: string;
  /** Link first mentions of glossary terms in the body (brand pages; off for legal text). */
  glossaryLinks?: boolean;
  /** ISO timestamp of the page row. */
  updatedAt: string;
  faqs?: PageFaq[];
  related?: PolicyLink[];
  socials: SiteSettings["socials"];
  /** AskChoobz in the side column; off where the page itself is the way to ask (contact). */
  ask?: boolean;
  /** Page-specific blocks between the summary and the body. */
  children?: ReactNode;
  /** Blocks after the body, before the FAQs. */
  after?: ReactNode;
};

export function PolicyPage({
  trail,
  title,
  kicker,
  intro,
  summary,
  body,
  slug,
  glossaryLinks = false,
  updatedAt,
  faqs = [],
  related,
  socials,
  ask = true,
  children,
  after,
}: PolicyPageProps) {
  const links = related ?? relatedPolicies(slug);
  return (
    <PageTurn>
      <div className="frame-col frame-pad pt-6 pb-band lg:pt-10">
        <Breadcrumbs items={trail} />
        <header className="page-head mt-5 pb-10 lg:mt-8 lg:pb-14">
          <div>
            {kicker ? (
              <Kicker decorative className="mb-2">
                {kicker}
              </Kicker>
            ) : null}
            <h1 className="headline text-3xl lg:text-[3.5rem]">{title}</h1>
          </div>
          {intro ? <p className="text-lead text-muted">{intro}</p> : null}
        </header>
        {/* Frame system: a rail-to-rail rule, then the reading column beside a framed sidebar. */}
        <div className={cn(styles.layout, "frame-rule-in pt-10 lg:pt-14")}>
          <article className="min-w-0">
            {summary ? <PolicySummary text={summary.text} facts={summary.facts} /> : null}

            {children ? <div className="mt-10 flex flex-col gap-12">{children}</div> : null}

            {body.trim() ? (
              <Prose markdown={body} variant="page" slug={slug} glossaryLinks={glossaryLinks} className="mt-12" />
            ) : null}

            {after ? <div className="mt-12 flex flex-col gap-12">{after}</div> : null}

            <PageFaqs faqs={faqs} name={`faq-${slug}`} className="rule-dash mt-14 pt-12" />
          </article>

          <aside aria-label="دربارهٔ این صفحه" className={cn(styles.aside, "frame-box p-6")}>
            <LastUpdated date={updatedAt} />
            <RelatedLinks links={links} />
            {ask ? <AskChoobz socials={socials} /> : null}
          </aside>
        </div>
      </div>
    </PageTurn>
  );
}
