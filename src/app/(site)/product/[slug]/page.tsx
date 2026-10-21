import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Thing } from "schema-dts";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { orthoLabels, illustrationSize } from "@/components/illustrations/sizes";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { VariantPicker, VariantSwap } from "@/components/shop/VariantPicker";
import { cartItem, pricesDiffer, productOffers, type Offer } from "@/components/shop/product-offers";
import { pill } from "@/components/studio/Actions";
import { LocalNav } from "@/components/studio/LocalNav";
import { PriceLine } from "@/components/studio/PriceLine";
import { ProductViewer } from "@/components/studio/ProductViewer";
import { hasRender, Render } from "@/components/studio/Render";
import { getProductPage, listProductSlugs, type ProductPageData } from "@/db/queries/product";
import { getPriceValidUntil } from "@/db/queries/seo";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import { installmentPlan } from "@/components/ui/installments";
import { formatAgeRange, formatNumber, formatToman, toFaDigits } from "@/lib/format";
import { graph, ids, JsonLd, productNodes, type BreadcrumbItem } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";
import { torobMeta } from "@/lib/torob";

/*
 * Product page, Studio direction: an Apple-style product story (hero, feature statements with
 * studio renders, a live 3D view, dimensions) followed by the buy section, specs and answers.
 * Fully static: one cached read (getProductPage) feeds the visible page, the metadata, the Torob
 * tags and the JSON-LD, so they always agree. Variant choice is radios + :has(); the islands are
 * the 3D viewer and add-to-cart.
 */

export async function generateStaticParams() {
  const slugs = await listProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

const productPath = (p: ProductPageData["product"]) => p.canonicalPath?.trim() || `/product/${p.slug}`;

/** «{name} {qualifier}؛ قیمت و خرید» (SEO.md §2.3); a DB seoTitle wins. */
function titleCore(p: ProductPageData["product"]): string {
  if (p.seoTitle?.trim()) return p.seoTitle.trim();
  const qualifier = /چوب/.test(p.name) ? "" : " چوبی";
  return `${p.name}${qualifier}؛ قیمت و خرید`;
}

/** The title without a brand suffix, for the ItemPage name and og:title. */
const withoutSuffix = (title: string) => title.replace(/ \| [^|]*چوبز[^|]*$/, "").trim();

/** «{summary's first sentence} مناسب {age}، {material}. {price} تومان یا ۴ قسط با اسنپ‌پی.» */
function description(data: ProductPageData, settings: SiteSettings, offer: Offer): string {
  const p = data.product;
  if (p.seoDescription?.trim()) return p.seoDescription.trim();
  const lead = p.summary.split(/(?<=[.؟!])\s/)[0]?.trim() ?? "";
  const age = formatAgeRange(p.ageMinMonths, p.ageMaxMonths);
  const material = p.material?.split(/[،؛(]/)[0]?.trim();
  const facts = [age ? `مناسب ${age}` : null, material].filter(Boolean).join("، ");
  const plan = installmentPlan(offer.price, settings.snapppay);
  const price = `${formatToman(offer.price)}${plan ? ` یا ${toFaDigits(plan.count)} قسط با اسنپ‌پی` : ""}.`;
  return [lead, facts ? `${facts}.` : null, price].filter(Boolean).join(" ");
}

function trailFor(data: ProductPageData): BreadcrumbItem[] {
  return crumbTrail(
    { name: "فروشگاه", path: "/shop" },
    { name: data.category.name, path: `/shop/${data.category.slug}` },
    { name: data.product.name, path: productPath(data.product) },
  );
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [data, settings] = await Promise.all([getProductPage(slug), getSettings()]);
  if (!data) return {};
  const p = data.product;
  const offers = productOffers(data);
  return pageMetadata({
    ownOgImage: true,
    title: titleCore(p),
    description: description(data, settings, offers[0]),
    path: productPath(p),
    noindex: p.noindex,
    markdownPath: `/product/${p.slug}.md`,
    other: torobMeta({
      id: p.id,
      name: p.name,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      availability: p.availability,
      warrantyMonths: p.warrantyMonths,
      guaranteeText: p.guaranteeText,
      torobEnabled: p.torobEnabled,
      variants: data.variants.map((v) => ({ price: v.ownPrice })),
    }),
  });
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const [data, settings, priceValidUntil] = await Promise.all([getProductPage(slug), getSettings(), getPriceValidUntil()]);
  if (!data) notFound();

  const { product } = data;
  const offers = productOffers(data);
  const trail = trailFor(data);
  const key = product.illustration ?? product.slug;
  const base = offers[0];
  const age = formatAgeRange(product.ageMinMonths, product.ageMaxMonths);
  const finishes = hasRender(key, "hero-white") && data.variants.some((v) => Object.values(v.options).some((o) => o.includes("سفید")))
    ? (["natural", "white"] as const)
    : (["natural"] as const);
  const highlights = product.highlights.slice(0, 3);
  const angles = ["front", "low", "top"] as const;

  return (
    <PageTurn>
      <JsonLd data={graph(productGraph(data, settings, { trail, priceValidUntil }))} />
      <div data-pdp="">
        <LocalNav
          title={product.name}
          links={[
            { href: "#overview", label: "نمای کلی" },
            { href: "#dimensions", label: "ابعاد" },
            { href: "#specs", label: "مشخصات" },
            ...(data.faqs.length ? [{ href: "#faq", label: "پرسش‌ها" }] : []),
          ]}
          buyHref="#buy"
        />

        {/* Hero */}
        <section id="overview" aria-labelledby="product-title" className="bg-surface">
          <div className="mx-auto max-w-[75rem] px-gutter pt-6">
            <Breadcrumbs items={trail} />
          </div>
          <div className="mx-auto flex max-w-[61.25rem] flex-col items-center px-gutter pb-6 pt-8 text-center lg:pt-12">
            <p className="eyebrow">{data.category.name}</p>
            <h1 id="product-title" className="headline mt-1 text-3xl lg:text-display">
              {product.name}
            </h1>
            {product.subtitle && <p className="mt-3 text-lead text-muted lg:text-[1.75rem] lg:leading-snug">{product.subtitle}</p>}
            <PriceLine price={base.price} from={pricesDiffer(offers)} snapppay={settings.snapppay} className="mt-3 text-sm" />
            <div className="mt-5 flex gap-4">
              <a href="#buy" className={pill("primary")}>
                خرید
              </a>
            </div>
          </div>
          <div className="mx-auto max-w-[52rem] px-gutter pb-12">
            <Render
              productKey={key}
              alt={`${product.name}، تصویر سه‌بعدی از روی ابعاد واقعی`}
              sizes="(min-width: 1024px) 832px, 92vw"
              priority
              box="16 / 11"
            />
          </div>
        </section>

        {/* Summary statement */}
        {product.summary && (
          <section aria-label="خلاصه" className="mx-auto max-w-[61.25rem] px-gutter py-section text-center">
            <p className="headline reveal text-2xl leading-[1.35] lg:text-[3rem]">{product.summary}</p>
          </section>
        )}

        {/* Feature statements */}
        {highlights.map((h, i) => {
          const angle = angles[i % angles.length];
          const night = i === 1;
          return (
            <section key={h} aria-label={h} className={night ? "theme-night" : i % 2 ? "bg-bg" : "bg-surface"}>
              <div className="mx-auto grid max-w-[75rem] items-center gap-10 px-gutter py-section lg:grid-cols-2">
                <p className={`headline reveal text-2xl lg:text-[2.75rem] ${i % 2 ? "lg:order-2" : ""}`}>{h}</p>
                <div className="reveal mx-auto w-full max-w-[32rem]">
                  <Render productKey={key} angle={hasRender(key, angle) ? angle : "hero"} alt="" sizes="(min-width: 1024px) 512px, 88vw" box="1 / 1" />
                </div>
              </div>
            </section>
          );
        })}

        {/* Live 3D */}
        <section aria-labelledby="viewer-title" className="mx-auto max-w-[75rem] px-gutter py-section text-center">
          <h2 id="viewer-title" className="headline text-2xl lg:text-[3.25rem]">
            از هر زاویه ببینید.
          </h2>
          <p className="mt-3 text-lead text-muted">بکشید تا بچرخد؛ نمای انفجاری قطعه‌ها را جدا نشان می‌دهد.</p>
          <div className="mt-10">
            <ProductViewer productKey={key} finishes={[...finishes]}>
              <div className="w-[min(100%,36rem)]">
                <Render productKey={key} alt="" sizes="(min-width: 1024px) 576px, 90vw" />
              </div>
            </ProductViewer>
          </div>
        </section>

        <Dimensions data={data} />
        <BuySection data={data} offers={offers} settings={settings} age={age} />
        <Specs data={data} age={age} />
        <InTheBox data={data} />
        <Faq data={data} />
        <Related data={data} snapppay={settings.snapppay} />
      </div>
    </PageTurn>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function Dimensions({ data }: { data: ProductPageData }) {
  const { product } = data;
  const key = product.illustration ?? product.slug;
  const labels = orthoLabels(key);
  const size = illustrationSize(key, "ortho");
  const d = product.dimensions;
  return (
    <section id="dimensions" aria-labelledby="dimensions-title" className="bg-surface">
      <div className="mx-auto max-w-[61.25rem] px-gutter py-section text-center">
        <h2 id="dimensions-title" className="headline text-2xl lg:text-[3.25rem]">
          ابعاد دقیق.
        </h2>
        {d && (
          <p className="mt-3 text-lead text-muted">
            {toFaDigits(d.widthCm)} × {toFaDigits(d.depthCm)} × {toFaDigits(d.heightCm)} سانتی‌متر (عرض × عمق × ارتفاع)
          </p>
        )}
        <figure className="relative mx-auto mt-10 w-full max-w-[48rem]">
          {/* eslint-disable-next-line @next/next/no-img-element -- static line drawing, sized by its viewBox */}
          <img
            src={`/illustrations/${key}-ortho.svg`}
            width={size.width}
            height={size.height}
            alt={`نقشهٔ ابعاد ${product.name}`}
            loading="lazy"
            decoding="async"
            className="h-auto w-full"
          />
          {labels.map((l) => (
            <span
              key={`${l.key}-${l.x}-${l.y}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface px-1.5 text-xs font-bold text-ink tabular-nums"
              style={{ left: `${l.x}%`, top: `${l.y}%` }}
            >
              {l.label}
            </span>
          ))}
          <figcaption className="mt-4 text-xs text-muted">اندازه‌ها به سانتی‌متر است.</figcaption>
        </figure>
      </div>
    </section>
  );
}

function BuySection({ data, offers, settings, age }: { data: ProductPageData; offers: Offer[]; settings: SiteSettings; age: string | null }) {
  const { product } = data;
  const key = product.illustration ?? product.slug;
  const bale = settings.socials.bale;
  const instagram = settings.socials.instagramHandle
    ? `https://ig.me/m/${encodeURIComponent(settings.socials.instagramHandle)}`
    : settings.socials.instagram;
  const shipping = settings.shippingPolicy;
  return (
    <section id="buy" aria-labelledby="buy-title" className="scroll-mt-24">
      <div className="mx-auto grid max-w-[75rem] gap-10 px-gutter py-section lg:grid-cols-[1.15fr_1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] bg-surface p-8">
            <Render productKey={key} alt={product.name} sizes="(min-width: 1024px) 560px, 90vw" box="1 / 1" />
          </div>
        </div>
        <div className="flex flex-col gap-7">
          <div>
            <h2 id="buy-title" className="headline text-2xl lg:text-[2.5rem]">
              خرید {product.name}
            </h2>
            {age && <p className="mt-2 text-sm text-muted">مناسب {age}</p>}
          </div>

          <VariantPicker productId={product.id} variants={data.variants} />

          <div className="border-t border-line pt-6">
            <VariantSwap offers={offers} differsBy={(o) => `${o.price}:${o.compareAt}`}>
              {(offer) => (
                <div>
                  <p className="text-xl font-extrabold">
                    <data value={offer.price}>{formatToman(offer.price)}</data>
                    {offer.compareAt ? (
                      <s className="ms-3 text-base font-medium text-muted">
                        <span className="sr-only">قیمت قبلی: </span>
                        {formatToman(offer.compareAt)}
                      </s>
                    ) : null}
                  </p>
                  <Installments price={offer.price} settings={settings} />
                </div>
              )}
            </VariantSwap>
          </div>

          <VariantSwap offers={offers} differsBy={(o) => `${o.variantId}:${o.availability}`}>
            {(offer) =>
              offer.availability === "out_of_stock" ? (
                <AddToCartButton size="lg" items={cartItem(data, offer)} label="فعلاً موجود نیست" disabled className="w-full" />
              ) : (
                <AddToCartButton
                  size="lg"
                  items={cartItem(data, offer)}
                  label="افزودن به سبد خرید"
                  toastLabel={`${product.name}${offer.variantName ? ` (${offer.variantName})` : ""} به سبد اضافه شد`}
                  className="w-full"
                />
              )
            }
          </VariantSwap>

          <ul className="divide-y divide-line rounded-[1.25rem] border border-line text-sm">
            <li className="flex gap-3 p-4">
              <strong className="w-28 shrink-0 font-bold">ارسال</strong>
              <span className="text-muted">
                {product.availability === "made_to_order" && product.leadTimeDays
                  ? `ساخت سفارشی؛ آماده در ${toFaDigits(product.leadTimeDays)} روز کاری، سپس ارسال به سراسر ایران.`
                  : shipping?.transitDays
                    ? `ارسال به سراسر ایران در ${toFaDigits(shipping.transitDays[0])} تا ${toFaDigits(shipping.transitDays[1])} روز کاری.`
                    : "ارسال به سراسر ایران."}{" "}
                <Link href="/shipping" className="link-mark">
                  جزئیات
                </Link>
              </span>
            </li>
            {product.warrantyMonths ? (
              <li className="flex gap-3 p-4">
                <strong className="w-28 shrink-0 font-bold">ضمانت</strong>
                <span className="text-muted">
                  {toFaDigits(product.warrantyMonths)} ماه ضمانت ساخت کارگاه چوبز.{" "}
                  <Link href="/warranty" className="link-mark">
                    شرایط
                  </Link>
                </span>
              </li>
            ) : null}
            {settings.returnPolicy ? (
              <li className="flex gap-3 p-4">
                <strong className="w-28 shrink-0 font-bold">بازگشت</strong>
                <span className="text-muted">
                  {toFaDigits(settings.returnPolicy.days)} روز مهلت بازگشت کالا.{" "}
                  <Link href="/returns" className="link-mark">
                    شرایط
                  </Link>
                </span>
              </li>
            ) : null}
          </ul>

          {(bale || instagram) && (
            <p className="text-sm text-muted">
              سؤالی دارید؟{" "}
              <a href={bale ?? instagram!} target="_blank" rel="noopener" className="link-mark">
                قبل از خرید از خودِ کارگاه بپرسید
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Installments({ price, settings }: { price: number; settings: SiteSettings }) {
  const plan = installmentPlan(price, settings.snapppay);
  if (!plan) return null;
  return (
    <p className="mt-1 text-sm text-muted">
      یا {toFaDigits(plan.count)} قسط {formatToman(plan.amount, false)} تومانی با اسنپ‌پی،{" "}
      <Link href="/installments" className="link-mark">
        طبق شرایط اسنپ‌پی
      </Link>
    </p>
  );
}

function Specs({ data, age }: { data: ProductPageData; age: string | null }) {
  const { product } = data;
  const d = product.dimensions;
  const rows: { label: string; value: string }[] = [
    ...(d ? [{ label: "ابعاد", value: `${toFaDigits(d.widthCm)} × ${toFaDigits(d.depthCm)} × ${toFaDigits(d.heightCm)} سانتی‌متر` }] : []),
    ...Object.entries(d?.extra ?? {}).map(([label, v]) => ({ label, value: `${toFaDigits(String(v).replace(".", "٫"))} سانتی‌متر` })),
    ...(product.weightKg ? [{ label: "وزن", value: `${toFaDigits(String(product.weightKg).replace(".", "٫"))} کیلوگرم` }] : []),
    ...(product.maxLoadKg ? [{ label: "حداکثر وزن قابل تحمل", value: `${toFaDigits(product.maxLoadKg)} کیلوگرم` }] : []),
    ...(age ? [{ label: "مناسب برای", value: age }] : []),
    ...(product.material ? [{ label: "جنس", value: product.material }] : []),
    ...(product.finish ? [{ label: "پرداخت", value: product.finish }] : []),
    ...(product.assemblyMinutes ? [{ label: "زمان نصب", value: `حدود ${toFaDigits(product.assemblyMinutes)} دقیقه` }] : []),
    ...product.specs,
    { label: "قیمت به ریال", value: `${formatNumber(product.price * 10)} ریال` },
  ];
  const seen = new Set<string>();
  const unique = rows.filter((r) => (seen.has(r.label) ? false : (seen.add(r.label), true)));
  return (
    <section id="specs" aria-labelledby="specs-title" className="bg-surface">
      <div className="mx-auto max-w-[61.25rem] px-gutter py-section">
        <h2 id="specs-title" className="headline text-2xl lg:text-[3.25rem]">
          مشخصات فنی
        </h2>
        <dl className="mt-10 divide-y divide-line border-y border-line">
          {unique.map((r) => (
            <div key={r.label} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr]">
              <dt className="font-bold">{r.label}</dt>
              <dd className="text-muted">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function InTheBox({ data }: { data: ProductPageData }) {
  const { product } = data;
  if (!product.inTheBox.length && !product.safetyNotes && !product.careNotes) return null;
  return (
    <section aria-label="جعبه، ایمنی و نگهداری" className="mx-auto grid max-w-[75rem] gap-3 px-gutter py-section md:grid-cols-3">
      {product.inTheBox.length > 0 && (
        <div className="rounded-[1.75rem] bg-surface p-8">
          <h2 className="text-xl font-extrabold">توی جعبه چی هست؟</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {product.inTheBox.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      {product.safetyNotes && (
        <div className="rounded-[1.75rem] bg-surface p-8">
          <h2 className="text-xl font-extrabold">ایمنی</h2>
          <p className="mt-4 text-sm text-muted">{product.safetyNotes}</p>
          <Link href="/safety" className="link-arrow mt-4 inline-block text-sm">
            جنس و ایمنی
          </Link>
        </div>
      )}
      {product.careNotes && (
        <div className="rounded-[1.75rem] bg-surface p-8">
          <h2 className="text-xl font-extrabold">نگهداری</h2>
          <p className="mt-4 text-sm text-muted">{product.careNotes}</p>
        </div>
      )}
    </section>
  );
}

function Faq({ data }: { data: ProductPageData }) {
  if (!data.faqs.length) return null;
  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-[61.25rem] px-gutter pb-section">
      <h2 id="faq-title" className="headline text-2xl lg:text-[3.25rem]">
        پرسش‌های پرتکرار
      </h2>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {data.faqs.map((f, i) => (
          <details key={f.id} name="product-faq" open={i === 0} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-bold">
              {f.question}
              <span aria-hidden="true" className="text-2xl font-light text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-[48rem] text-muted">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Related({ data, snapppay }: { data: ProductPageData; snapppay: SiteSettings["snapppay"] }) {
  const related = [...data.bundle, ...data.related].filter((p, i, all) => all.findIndex((x) => x.id === p.id) === i).slice(0, 4);
  return (
    <>
      {data.guides.length > 0 && (
        <section aria-labelledby="guides-title" className="bg-surface">
          <div className="mx-auto max-w-[75rem] px-gutter py-section">
            <h2 id="guides-title" className="headline text-2xl lg:text-[2.75rem]">
              قبل از خرید بخوانید.
            </h2>
            <ul className="mt-8 grid gap-3 md:grid-cols-3">
              {data.guides.slice(0, 3).map((g) => (
                <li key={g.id}>
                  <Link href={`/mag/${g.slug}`} className="flex h-full flex-col rounded-[1.75rem] bg-bg p-7">
                    <p className="text-xs font-semibold text-muted">
                      {g.topic?.name} · {toFaDigits(g.readingMinutes)} دقیقه
                    </p>
                    <h3 className="mt-2 text-lg font-extrabold leading-snug">{g.title}</h3>
                    {g.tldr && <p className="mt-2 line-clamp-3 text-sm text-muted">{g.tldr}</p>}
                    <span className="link-arrow mt-auto pt-4 text-sm">خواندن</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mx-auto max-w-[75rem] px-gutter py-section">
          <h2 id="related-title" className="headline text-2xl lg:text-[2.75rem]">
            کنارش خوب می‌نشیند.
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}>
                <Link href={`/product/${p.slug}`} className="group flex h-full flex-col items-center rounded-[1.75rem] bg-surface p-6 text-center">
                  <div className="w-full transition-transform duration-500 group-hover:scale-[1.03]">
                    <Render productKey={p.illustration ?? p.slug} alt="" sizes="(min-width: 1024px) 260px, 44vw" box="1 / 1" />
                  </div>
                  <h3 className="mt-4 font-extrabold">{p.name}</h3>
                  <PriceLine price={p.price} from={p.variantCount > 1} snapppay={snapppay} className="mt-1 text-xs text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** Only real, approved reviews count toward a visible rating or markup (SEO.md §3.5.10). */
function realReviews(data: ProductPageData) {
  return data.reviews.filter((r) => !r.isSample && r.body.trim() && r.authorName.trim());
}

/* ------------------------------------------------------------------ */
/* JSON-LD                                                              */
/* ------------------------------------------------------------------ */

function productGraph(
  data: ProductPageData,
  settings: SiteSettings,
  { trail, priceValidUntil }: { trail: BreadcrumbItem[]; priceValidUntil: string },
): Thing[] {
  const p = data.product;
  const offers = productOffers(data);
  // One Offer when every variant costs the same; a ProductGroup with one Offer per variant otherwise.
  const variants = pricesDiffer(offers) ? data.variants : [];
  const nodes = productNodes(
    {
      id: p.id,
      slug: p.slug,
      name: p.name,
      summary: p.summary,
      sku: p.sku,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      availability: p.availability,
      leadTimeDays: p.leadTimeDays,
      ageMinMonths: p.ageMinMonths,
      ageMaxMonths: p.ageMaxMonths,
      material: p.material,
      finish: p.finish,
      dimensions: p.dimensions,
      weightKg: p.weightKg,
      maxLoadKg: p.maxLoadKg,
      specs: p.specs,
      warrantyMonths: p.warrantyMonths,
      alternateNames: p.alternateNames,
      illustration: p.illustration,
      updatedAt: p.updatedAt,
      category: data.category,
      images: data.media.map((m) => ({ path: m.path, width: m.width, height: m.height, alt: m.alt, caption: m.caption, credit: m.credit })),
      variants: variants.map((v) => ({ id: v.id, name: v.name, sku: v.sku, price: v.ownPrice, options: v.options, urlParam: v.urlParam })),
    },
    {
      settings,
      pageName: withoutSuffix(titleCore(p)),
      breadcrumb: trail,
      faqs: data.faqs,
      relatedSlugs: [...data.bundle, ...data.related].map((c) => c.slug),
      accessoryForSlugs: data.accessoryForSlugs,
      articleSlugs: data.articleSlugs,
      reviews: realReviews(data).map((r) => ({ authorName: r.authorName, rating: r.rating, body: r.body, createdAt: r.createdAt })),
      priceValidUntil,
      dateModified: p.updatedAt,
    },
  );
  return withVariantAvailability(nodes, data, variants);
}

/**
 * productNodes gives every variant the product's availability; a sold-out variant of an
 * in-stock product must say so in its own Offer, as the page does.
 */
function withVariantAvailability(nodes: Thing[], data: ProductPageData, variants: ProductPageData["variants"]): Thing[] {
  const soldOut = new Set(
    variants.filter((v) => v.availability === "out_of_stock").map((v) => ids.product(data.product.slug, v.urlParam ?? `variant=${v.id}`)),
  );
  if (!soldOut.size) return nodes;
  return nodes.map((node) => {
    const group = node as { "@type"?: string; hasVariant?: { "@id"?: string; offers?: object }[] };
    if (group["@type"] !== "ProductGroup" || !group.hasVariant) return node;
    return {
      ...group,
      hasVariant: group.hasVariant.map((v) =>
        v["@id"] && soldOut.has(v["@id"]) ? { ...v, offers: { ...v.offers, availability: "https://schema.org/OutOfStock" } } : v,
      ),
    } as Thing;
  });
}
