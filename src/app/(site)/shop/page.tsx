import type { Metadata } from "next";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { CategoryStrip } from "@/components/studio/CategoryStrip";
import { LeadText } from "@/components/studio/LeadText";
import { PageTurn } from "@/components/layout/PageTurn";
import { Prose } from "@/components/mag/Prose";
import { FilterBar } from "@/components/shop/FilterBar";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { Button } from "@/components/ui/Button";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import { getShopIndex, type ShopIndex } from "@/db/queries/shop";
import { formatAgeRange, toFaDigits } from "@/lib/format";
import { breadcrumbNode, collectionNodes, graph, JsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /shop — every product (DESIGN.md §6.1, SEO.md §1.4, §2.3, §3.5.2, §8.3). One prerendered page:
 * the shop window, the category rail (real links), FilterBar around the grid grouped by
 * category, then the buying FAQ (visible; the FAQPage lives on /faq) and «سؤالی داری؟».
 * Facets are client-side only, so the canonical is always the clean /shop. Not paginated.
 */

const PATH = "/shop";
const TITLE = "فروشگاه وسایل چوبی کودک؛ مونته‌سوری و پیکلر";
const TRAIL = crumbTrail({ name: "فروشگاه", path: PATH });

/** SEO.md §2.3: «{productCount} محصول چوبی برای کودک ۰ تا ۶ سال؛ … ارسال سراسری و خرید قسطی.» */
function describe(shop: ShopIndex, settings: SiteSettings): string {
  const ages = formatAgeRange(shop.ageRange.min, shop.ageRange.max);
  const installments = settings.snapppay?.enabled ? " و خرید قسطی" : "";
  return (
    `${toFaDigits(shop.products.length)} محصول چوبی مونته‌سوری و پیکلر${ages ? ` برای کودک ${ages}` : ""}؛ ` +
    `برج یادگیری، مثلث پیکلر، قفسه و اسباب‌بازی از چندلایی توس. ارسال سراسری${installments}.`
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const [shop, settings] = await Promise.all([getShopIndex(), getSettings()]);
  return pageMetadata({
    ownOgImage: true, title: TITLE, description: describe(shop, settings), path: PATH });
}

export default async function ShopPage() {
  const [shop, settings] = await Promise.all([getShopIndex(), getSettings()]);
  const description = describe(shop, settings);
  const jsonLd = graph(
    collectionNodes({
      path: PATH,
      name: TITLE,
      description,
      breadcrumb: true,
      audience: { minMonths: shop.ageRange.min, maxMonths: shop.ageRange.max },
      items: shop.products.map((p) => ({ path: `/product/${p.slug}`, name: p.name })),
      order: "ascending",
    }),
    breadcrumbNode(TRAIL),
  );

  return (
    <PageTurn>
      <JsonLd data={jsonLd} />
      <div className="frame-col frame-pad pt-5 pb-band lg:pt-8">
        <header className="pb-8 pt-4 lg:pb-12 lg:pt-10">
          <Breadcrumbs items={TRAIL} />
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <h1 className="headline text-3xl lg:text-[4.5rem]">
              فروشگاه.{" "}
              <span className="text-muted">بهترین راه برای خرید وسایل چوبز.</span>
            </h1>
          </div>
          {shop.intro ? <LeadText text={shop.intro} className="mt-5 max-w-[46rem]" /> : null}
        </header>

        <div className="frame-rule-in pt-8">
          <CategoryStrip categories={shop.categories} />
        </div>

        <div className="mt-6 lg:mt-10">
          <FilterBar facets={shop.facets} total={shop.products.length}>
            <ProductGrid
              groups={shop.groups.map((g) => ({
                slug: g.category.slug,
                title: g.category.name,
                products: g.products,
                guide: g.guide,
              }))}
              rooms={shop.rooms}
            />
          </FilterBar>
        </div>

        <div className="frame-rule-in frame-band grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          {shop.faqs.length ? <BuyingFaq faqs={shop.faqs} /> : null}
          <AskChoobz socials={settings.socials} className="self-start lg:sticky lg:top-[calc(var(--spacing-header-lg)+1.5rem)]" />
        </div>
      </div>
    </PageTurn>
  );
}

function BuyingFaq({ faqs }: { faqs: ShopIndex["faqs"] }) {
  return (
    <section aria-labelledby="buying-faq" className="max-w-prose">
      <h2 id="buying-faq" className="headline text-2xl text-ink">
        پیش از خرید چه بپرسیم؟
      </h2>
      <div className="mt-4 divide-y divide-line border-y border-line">
        {faqs.map((faq) => (
          <div key={faq.id} className="py-5">
            <h3 className="text-base font-bold text-ink">{faq.question}</h3>
            <Prose markdown={faq.answer} variant="compact" className="mt-1.5 text-muted" />
          </div>
        ))}
      </div>
      <Button variant="quiet" size="sm" href="/faq" className="mt-3">
        همهٔ سؤال‌های خرید، ارسال و اقساط ←
      </Button>
    </section>
  );
}
