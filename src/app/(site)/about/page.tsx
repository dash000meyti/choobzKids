import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { PegDoll, type PegDollTint, type PegDollVariant } from "@/components/illustrations/PegDoll";
import { LETTERING } from "@/components/illustrations/lettering/Lettering";
import { YekiBud } from "@/components/illustrations/lettering/YekiBud";
import { illustrationFrame, illustrationSize } from "@/components/illustrations/sizes";
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
import { illustrationUrl } from "@/lib/utils";
import styles from "./about.module.css";

/*
 * /about «داستان چوبز» (DESIGN.md §8, SEO.md §3.3, §8.11): the brand story as a picture book in
 * three spreads — the beginning, the workshop, the families — then the page body (mission and
 * the Montessori/Waldorf/Pikler inspiration, glossary-linked), its FAQs, and «چوبز در یک نگاه»
 * (#facts): short dated lines built only from settings and the catalogue, ⚑ fields hidden until
 * set. AboutPage markup points at the full OnlineStore node the root layout already defines.
 */

const PATH = "/about";
const SHEET = illustrationSize("learning-tower", "flat");

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");
  if (!page) return { title: "صفحه پیدا نشد", robots: { index: false, follow: true } };
  return pageMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.excerpt ?? page.title,
    path: page.canonicalPath ?? PATH,
    modifiedTime: page.updatedAt,
    noindex: page.noindex,
  });
}

/* ------------------------------------------------------------------ */
/* Picture pages: peg dolls and manifest drawings at one cm scale        */
/* ------------------------------------------------------------------ */

type Figure =
  | { kind: "doll"; variant: PegDollVariant; heightCm: number; tint?: PegDollTint }
  | { kind: "drawing"; illustration: string; alt: string };

function SceneFigure({ figure }: { figure: Figure }) {
  if (figure.kind === "doll") return <PegDoll variant={figure.variant} heightCm={figure.heightCm} tint={figure.tint} />;
  const frame = illustrationFrame(figure.illustration, "assembled");
  // Drawing units are projected mm: the front floor corner (originY) stands on the floor line.
  const style: CSSProperties = {
    width: `calc(${(frame.width / 10).toFixed(1)} * var(--u))`,
    marginBlockEnd: `calc(${(-(frame.height - frame.originY) / 10).toFixed(1)} * var(--u))`,
  };
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3)
    <img
      src={illustrationUrl(figure.illustration, "assembled")}
      width={Math.round(frame.width)}
      height={Math.round(frame.height)}
      alt={figure.alt}
      loading="lazy"
      decoding="async"
      className={styles.drawing}
      style={style}
    />
  );
}

function Scene({ figures, scale }: { figures: Figure[]; scale: number }) {
  return (
    <div className={styles.scene} style={{ "--k": scale } as CSSProperties}>
      {figures.map((figure, index) => (
        <SceneFigure key={index} figure={figure} />
      ))}
    </div>
  );
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
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={trail} />
        <header className="mt-6 max-w-narrow lg:mt-10">
          <h1 className="ply-type text-[length:max(2.5rem,var(--text-3xl))] leading-[1.3]">{page.title}</h1>
          {page.excerpt ? <p className="mt-4 max-w-prose text-lead text-muted">{page.excerpt}</p> : null}
        </header>

        <div className="mt-10 flex flex-col gap-8 lg:mt-14 lg:gap-12">
          <Spread
            id="spread-beginning"
            folio={1}
            picture={
              <Scene
                scale={1.7}
                figures={[
                  { kind: "doll", variant: "child", heightCm: 82 },
                  { kind: "drawing", illustration: "duck-pull-toy", alt: "اردک چرخ‌دار چوبی، نشان چوبز" },
                ]}
              />
            }
          >
            <YekiBud className="text-xl text-success" />
            <span className="sr-only">{LETTERING.yekiBud}</span>
            <h2 id="spread-beginning" className="font-display text-xl text-ink">
              چوبز برای چه ساخته شد؟
            </h2>
            <blockquote className="font-accent text-lead text-ink">
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
            picture={
              <>
                <div className={styles.sheet}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
                  <img
                    src={illustrationUrl("learning-tower", "flat")}
                    width={SHEET.width}
                    height={SHEET.height}
                    alt="قطعه‌های برج یادگیری، چیده‌شده روی یک ورق چندلایی پیش از برش"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <Scene
                  scale={1.25}
                  figures={[
                    { kind: "drawing", illustration: "learning-tower", alt: "برج یادگیری سرهم‌شده" },
                    { kind: "doll", variant: "child", heightCm: 92, tint: "sage" },
                  ]}
                />
              </>
            }
          >
            <Kicker decorative tone="success">
              از ورق تا خونه
            </Kicker>
            <h2 id="spread-workshop" className="font-display text-xl text-ink">
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
            picture={
              <Scene
                scale={0.8}
                figures={[
                  { kind: "doll", variant: "father", heightCm: 176 },
                  { kind: "doll", variant: "child", heightCm: 80, tint: "sky" },
                  { kind: "drawing", illustration: "pikler-triangle", alt: "مثلث پیکلر" },
                  { kind: "doll", variant: "mother-scarf", heightCm: 162 },
                ]}
              />
            }
          >
            <Kicker decorative tone="success">
              از خونه‌های شما
            </Kicker>
            <h2 id="spread-families" className="font-display text-xl text-ink">
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

        <div className="mx-auto mt-16 max-w-narrow lg:mt-24">
          <Prose markdown={page.body} variant="page" slug={page.slug} glossaryLinks />

          <PageFaqs faqs={page.faqs} name="faq-about" className="mt-14" />

          <section id="facts" aria-labelledby="facts-title" className={`${styles.facts} mt-14 rounded-bit-lg bg-raised p-5 shadow-paper sm:p-7`}>
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
    </PageTurn>
  );
}
