import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { LETTERING } from "@/components/illustrations/lettering/Lettering";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { FactList, LastUpdated, PageFaqs, workingDays, type FactRow } from "@/components/mag/PolicyPage";
import { Prose } from "@/components/mag/Prose";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { EnamadBadge } from "@/components/ui/EnamadBadge";
import { Kicker } from "@/components/ui/Kicker";
import { KraftTag } from "@/components/ui/KraftTag";
import { listCategories } from "@/db/queries/catalog";
import { getPage, getWarrantyMonths } from "@/db/queries/pages";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import { formatJalali, formatNumber, toFaDigits } from "@/lib/format";
import { breadcrumbNode, graph, ids, JsonLd, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";
import { Render } from "@/components/studio/Render";
import styles from "./about.module.css";

/*
 * /about «داستان چوبز» (DESIGN.md §8, SEO.md §3.3, §8.11): the brand story as a picture book in
 * three spreads — the beginning, the workshop, the families — then the page body (mission and
 * the Montessori/Waldorf/Pikler inspiration, glossary-linked), its FAQs, and «چوبز در یک نگاه»
 * (#facts): short dated lines built only from settings and the catalogue, ⚑ fields hidden until
 * set. AboutPage markup points at the full OnlineStore node the root layout already defines.
 */

const PATH = "/about";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");
  if (!page) return { title: "این صفحه پیدا نشد", robots: { index: false, follow: true } };
  return pageMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.excerpt ?? page.title,
    path: page.canonicalPath ?? PATH,
    modifiedTime: page.updatedAt,
    noindex: page.noindex,
  });
}

function Spread({
  id,
  folio,
  flip,
  tall,
  picture,
  children,
}: {
  id: string;
  folio: number;
  flip?: boolean;
  /** Room on the picture page for something on the wall above the figures. */
  tall?: boolean;
  picture: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={styles.spread} data-flip={flip ? "" : undefined}>
      <div className={styles.picture} data-tall={tall ? "" : undefined}>
        {picture}
      </div>
      <div className={styles.text}>
        {children}
        <span aria-hidden="true" className={styles.folio}>
          {toFaDigits(folio)}
        </span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* «چوبز در یک نگاه»                                                    */
/* ------------------------------------------------------------------ */

function factRows(
  settings: SiteSettings,
  categories: { name: string; productCount: number }[],
  warranty: { min: number; max: number } | null,
): FactRow[] {
  const { org, socials, shippingPolicy, returnPolicy, snapppay } = settings;
  const stocked = categories.filter((c) => c.productCount > 0);
  const productCount = stocked.reduce((sum, c) => sum + c.productCount, 0);
  const more = (href: string, label: string) => (
    <Link href={href} className="link-mark ms-1 text-sm text-muted">
      {label}
    </Link>
  );
  const rows: (FactRow | null)[] = [
    stocked.length
      ? {
          label: "چه می‌سازیم",
          value: (
            <>
              {stocked.map((c) => c.name).join("، ")}؛ {toFaDigits(productCount)} محصول در {toFaDigits(stocked.length)} دسته.
              {more("/shop", "فروشگاه")}
            </>
          ),
        }
      : null,
    { label: "جنس", value: "تختهٔ چندلایی توس" },
    { label: "کجا ساخته می‌شود", value: org.city ? `کارگاه خود چوبز در ${org.city}` : "کارگاه خود چوبز" },
    org.foundingDate ? { label: "سال شروع", value: toFaDigits(org.foundingDate) } : null,
    shippingPolicy
      ? {
          label: "ارسال",
          value: (
            <>
              به سراسر ایران
              {shippingPolicy.handlingDays ? `؛ آماده‌سازی ${workingDays(shippingPolicy.handlingDays)}` : ""}
              {shippingPolicy.transitDays ? `، ${workingDays(shippingPolicy.transitDays)} در راه` : ""}.
              {more("/shipping", "جزئیات")}
            </>
          ),
        }
      : null,
    warranty
      ? {
          label: "گارانتی",
          value: (
            <>
              {warranty.min === warranty.max
                ? `${toFaDigits(warranty.max)} ماه گارانتی ساخت روی همهٔ محصولات.`
                : `${toFaDigits(warranty.min)} تا ${toFaDigits(warranty.max)} ماه گارانتی ساخت، بسته به محصول.`}
              {more("/warranty", "جزئیات")}
            </>
          ),
        }
      : null,
    returnPolicy && returnPolicy.days > 0
      ? {
          label: "بازگشت کالا",
          value: (
            <>
              {toFaDigits(returnPolicy.days)} روز کاری مهلت انصراف از روز تحویل.
              {more("/returns", "جزئیات")}
            </>
          ),
        }
      : null,
    snapppay?.enabled
      ? {
          label: "خرید قسطی",
          value: (
            <>
              {toFaDigits(snapppay.count > 0 ? snapppay.count : 4)} قسط با اسنپ‌پی، طبق شرایط اسنپ‌پی.
              {more("/installments", "جزئیات")}
            </>
          ),
        }
      : null,
    socials.instagramHandle || socials.bale || org.phone
      ? {
          label: "تماس",
          value: (
            <>
              {socials.instagramHandle ? (
                <>
                  دایرکت اینستاگرام{" "}
                  <bdi lang="en" dir="ltr">
                    @{socials.instagramHandle}
                  </bdi>
                </>
              ) : socials.bale ? (
                "کانال بله"
              ) : (
                <span dir="ltr">{toFaDigits(org.phone!)}</span>
              )}
              {more("/contact", "همهٔ راه‌ها")}
            </>
          ),
        }
      : null,
    socials.followers && socials.followersAsOf
      ? {
          label: "همراهان",
          value: (
            <>
              {formatNumber(socials.followers)} دنبال‌کننده در اینستاگرام (
              <time dateTime={socials.followersAsOf}>{formatJalali(new Date(socials.followersAsOf))}</time>)
            </>
          ),
        }
      : null,
  ];
  return rows.filter((row): row is FactRow => row !== null);
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const TEXT_LINK = "link-mark self-start text-base font-semibold text-ink";

export default async function AboutPage() {
  const [page, settings, categories, warranty] = await Promise.all([
    getPage("about"),
    getSettings(),
    listCategories(),
    getWarrantyMonths(),
  ]);
  if (!page) notFound();

  const trail = crumbTrail({ name: page.title, path: PATH });
  const steps = settings.workshopSteps;
  const followers = settings.socials.followers;
  const jsonLd = graph(
    webPageNode({
      path: PATH,
      type: "AboutPage",
      name: page.seoTitle ?? page.title,
      description: page.seoDescription ?? page.excerpt,
      breadcrumb: true,
      mainEntity: ids.organization(),
      about: { "@id": ids.organization() },
      dateModified: page.updatedAt,
    }),
    breadcrumbNode(trail),
  );

  return (
    <PageTurn>
      <JsonLd data={jsonLd} />
      <div className="frame-col frame-pad pt-6 pb-band lg:pt-10">
        <Breadcrumbs items={trail} />
        <header className="page-head mt-6 lg:mt-10">
          <h1 className="headline text-3xl lg:text-[4.5rem]">{page.title}</h1>
          {page.excerpt ? <p className="text-lead text-muted">{page.excerpt}</p> : null}
        </header>

        <div className="frame-rule-in mt-10 flex flex-col gap-8 pt-10 lg:mt-14 lg:gap-12 lg:pt-14">
          <Spread
            id="spread-beginning"
            folio={1}
            picture={<Render productKey="duck-pull-toy" alt="اردک چرخ‌دار چوبی، نشان چوبز" sizes="(min-width: 1024px) 480px, 88vw" box="4 / 3" />}
          >
            <p className="eyebrow">{LETTERING.yekiBud}</p>
            <h2 id="spread-beginning" className="headline text-2xl text-ink lg:text-[2.25rem]">
              چوبز برای چه ساخته شد؟
            </h2>
            <blockquote className="text-lead font-semibold text-ink">
              «لازم نیست مامانِ کاملی باشی. فقط کافیه دنیای بچه‌ت رو آماده کنی؛ ما کنارتیم تا اون دنیا رو با هم، از
              چوب بسازیم.»
            </blockquote>
            <p className="text-base text-ink">
              نشان چوبز اردکی چوبی روی گاری چرخ‌دار است؛ همان اسباب‌بازی‌ای که بچه‌ها با اولین قدم‌هایشان پشت سر خودشان
              می‌کشند.
              {settings.tagline ? ` ${settings.tagline}.` : ""}
            </p>
          </Spread>

          <Spread
            id="spread-workshop"
            folio={2}
            flip
            tall
            picture={<Render productKey="learning-tower" angle="hero-exploded" alt="قطعه‌های برج یادگیری پیش از مونتاژ" sizes="(min-width: 1024px) 480px, 88vw" box="4 / 3" />}
          >
            <Kicker decorative tone="success">
              از ورق تا خونه
            </Kicker>
            <h2 id="spread-workshop" className="headline text-2xl text-ink lg:text-[2.25rem]">
              هر وسیلهٔ چوبز از کجا می‌آید؟
            </h2>
            <p className="text-base text-ink">{settings.org.description}</p>
            {steps.length ? (
              <ol className="flex flex-col gap-1.5 text-sm text-ink">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex items-baseline gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-wood text-xs font-bold">
                      {toFaDigits(index + 1)}
                    </span>
                    {step.title}
                  </li>
                ))}
              </ol>
            ) : null}
            <Link href="/workshop" transitionTypes={["nav-forward"]} className={TEXT_LINK}>
              داستان کامل کارگاه ←
            </Link>
          </Spread>

          <Spread
            id="spread-families"
            folio={3}
            picture={<Render productKey="pikler-triangle" alt="مثلث پیکلر" sizes="(min-width: 1024px) 480px, 88vw" box="4 / 3" />}
          >
            <Kicker decorative tone="success">
              از خونه‌های شما
            </Kicker>
            <h2 id="spread-families" className="headline text-2xl text-ink lg:text-[2.25rem]">
              قصهٔ چوبز کجا ادامه پیدا می‌کند؟
            </h2>
            <p className="text-base text-ink">
              توی خانه‌های شما. عکس‌هایی که از بازی بچه‌ها برایمان می‌فرستید و پرسش‌هایی که پیش از خرید می‌پرسید، دلیل
              اصلی ادامهٔ کار ماست.
              {followers && settings.socials.followersAsOf
                ? ` تا ${formatJalali(new Date(settings.socials.followersAsOf))}، ${formatNumber(followers)} نفر صفحهٔ اینستاگرام چوبز را دنبال می‌کنند.`
                : ""}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <Link href="/gallery" className={TEXT_LINK}>
                عکس‌های شما ←
              </Link>
              <Link href="/reviews" className={TEXT_LINK}>
                رضایت شما ←
              </Link>
            </div>
          </Spread>
        </div>

        <div className="frame-rule-in frame-band">
        <div className="mx-auto max-w-narrow">
          <Prose markdown={page.body} variant="page" slug={page.slug} glossaryLinks />

          <PageFaqs faqs={page.faqs} name="faq-about" className="mt-14" />

          <section id="facts" aria-labelledby="facts-title" className={`${styles.facts} frame-box mt-14 p-6 sm:p-8`}>
            <KraftTag as="h2">
              <span id="facts-title">چوبز در یک نگاه</span>
            </KraftTag>
            <FactList rows={factRows(settings, categories, warranty)} className="mt-4" />
            <LastUpdated date={page.updatedAt} className="mt-4 border-t border-line pt-3" />
          </section>

          {settings.enamad ? (
            <div className="mt-8 flex items-center gap-4">
              <EnamadBadge enamad={settings.enamad} />
              <p className="text-sm text-muted">
                نماد اعتماد الکترونیکی چوبز؛ روی آن کلیک کنید تا اطلاعات ثبت‌شده را در سایت اینماد ببینید.{" "}
                <Link href="/trust" className="link-mark text-ink">
                  دربارهٔ نماد اعتماد
                </Link>
              </p>
            </div>
          ) : null}

          <AskChoobz socials={settings.socials} className="mt-12" />
        </div>
        </div>
      </div>
    </PageTurn>
  );
}
