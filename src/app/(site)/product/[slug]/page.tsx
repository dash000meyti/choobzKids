import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Thing } from "schema-dts";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { AvailabilityLine } from "@/components/shop/AvailabilityLine";
import { BuyBar } from "@/components/shop/BuyBar";
import { PriceBlock } from "@/components/shop/PriceBlock";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { Shenasnameh } from "@/components/shop/Shenasnameh";
import { TrustRow } from "@/components/shop/TrustRow";
import { VariantPicker, VariantSwap } from "@/components/shop/VariantPicker";
import { cartItem, pricesDiffer, productOffers, type Offer } from "@/components/shop/product-offers";
import { getProductPage, listProductSlugs, type ProductPageData } from "@/db/queries/product";
import { getPriceValidUntil } from "@/db/queries/seo";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import { AgeBadge } from "@/components/ui/AgeBadge";
import { Button } from "@/components/ui/Button";
import { installmentPlan } from "@/components/ui/installments";
import { SKILLS } from "@/lib/ages";
import { formatAgeRange, formatToman, toFaDigits } from "@/lib/format";
import { graph, ids, JsonLd, productNodes, type BreadcrumbItem } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";
import { torobMeta } from "@/lib/torob";

/*
 * Product detail page (DESIGN.md §6.3, SEO.md §2.3 / §3.5.3–3.5.4 / §4.7 / §6.1 / §8.4).
 * Fully static: one cached read (getProductPage) feeds the visible page, the metadata, the Torob
 * tags and the JSON-LD, so they always agree. Variant choice, the exploded view and the scale
 * tool are radios + :has(); the only islands are the gallery tabs, the zoom viewer, the height
 * inputs and add-to-cart. Mobile order follows the spec's 22 blocks; on desktop the gallery is
 * sticky at inline-start (7 columns) beside the info column (5), and blocks 11–21 run below.
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

  return (
    <PageTurn>
      <JsonLd data={graph(productGraph(data, settings, { trail, priceValidUntil }))} />
      <div data-pdp="" className="mx-auto max-w-page px-gutter pt-4 pb-section lg:pt-8">
        <Breadcrumbs items={trail} />

        <div className="mt-4 grid gap-x-12 gap-y-8 lg:mt-6 lg:grid-cols-12">
          <div className="lg:sticky lg:top-[calc(var(--spacing-header-lg)+1.5rem)] lg:col-span-7 lg:self-start">
            <ProductGallery product={product} media={data.media} />
          </div>

          <div className="flex min-w-0 flex-col gap-7 lg:col-span-5">
            <TitleBlock data={data} />
            {product.summary ? <p className="text-lead text-ink">{product.summary}</p> : null}
            <PriceBlock offers={offers} snapppay={settings.snapppay} />
            <Shenasnameh product={product} offers={offers} settings={settings} />
            <VariantPicker productId={product.id} variants={data.variants} />
            <div className="flex flex-col gap-4">
              <AvailabilityLine offers={offers} leadTimeDays={product.leadTimeDays} shippingPolicy={settings.shippingPolicy} />
              <BuyButtons data={data} offers={offers} settings={settings} />
              <TrustRow settings={settings} className="mt-1" />
            </div>
          </div>
        </div>

        <BuyBar data={data} offers={offers} snapppay={settings.snapppay} />
      </div>
    </PageTurn>
  );
}

/* ------------------------------------------------------------------ */
/* Blocks 3 and 10                                                      */
/* ------------------------------------------------------------------ */

/** Only real, approved reviews count toward a visible rating (SEO.md §3.5.10). */
function realReviews(data: ProductPageData) {
  return data.reviews.filter((r) => !r.isSample && r.body.trim() && r.authorName.trim());
}

function TitleBlock({ data }: { data: ProductPageData }) {
  const { product } = data;
  const real = realReviews(data);
  const rating = real.length >= 3 ? Math.round((real.reduce((s, r) => s + r.rating, 0) / real.length) * 10) / 10 : null;
  const skills = product.skills.filter((s) => SKILLS[s]).slice(0, 4);
  return (
    <header className="flex flex-col gap-3">
      <h1 className="text-2xl text-ink">{product.name}</h1>
      {product.subtitle ? <p className="text-lead text-muted">{product.subtitle}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <AgeBadge min={product.ageMinMonths} max={product.ageMaxMonths} link />
        {rating ? (
          <a href="#reviews" className="link-mark text-sm font-semibold text-ink">
            <span aria-hidden="true">★ </span>
            {toFaDigits(String(rating).replace(".", "٫"))} از ۵ · {toFaDigits(real.length)} نظر
          </a>
        ) : null}
        {skills.length ? (
          <ul aria-label="مهارت‌هایی که تقویت می‌کند" className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <li key={skill} className="rounded-bead bg-surface px-3 py-0.5 text-xs font-semibold text-ink">
                {SKILLS[skill]}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </header>
  );
}

function BuyButtons({ data, offers, settings }: { data: ProductPageData; offers: Offer[]; settings: SiteSettings }) {
  const { product } = data;
  const bale = settings.socials.bale;
  const instagram = settings.socials.instagramHandle
    ? `https://ig.me/m/${encodeURIComponent(settings.socials.instagramHandle)}`
    : settings.socials.instagram;
  return (
    <div className="flex flex-col gap-3">
      <VariantSwap offers={offers} differsBy={(o) => `${o.variantId}:${o.availability}`}>
        {(offer) =>
          offer.availability === "out_of_stock" ? (
            <AddToCartButton size="lg" items={cartItem(data, offer)} label="فعلاً تموم شده" disabled className="w-full" />
          ) : (
            <AddToCartButton
              size="lg"
              items={cartItem(data, offer)}
              toastLabel={`${product.name}${offer.variantName ? ` (${offer.variantName})` : ""} به سبد اضافه شد`}
              className="w-full"
            />
          )
        }
      </VariantSwap>
      {bale ? (
        <Button variant="consult" size="md" href={bale} target="_blank" rel="noopener" iconStart="bale" block>
          سؤال داری؟ قبل از خرید در بله بپرس
        </Button>
      ) : instagram ? (
        <Button variant="consult" size="md" href={instagram} target="_blank" rel="noopener" iconStart="instagram" block>
          سؤال داری؟ قبل از خرید در اینستاگرام بپرس
        </Button>
      ) : null}
    </div>
  );
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
