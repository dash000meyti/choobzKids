import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { CategoryStrip } from "@/components/studio/CategoryStrip";
import { PageTurn } from "@/components/layout/PageTurn";
import { Prose } from "@/components/mag/Prose";
import { FilterBar } from "@/components/shop/FilterBar";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { Bubble } from "@/components/ui/Bubble";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PillChip } from "@/components/ui/PillChip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { shortTitle } from "@/db/queries/nav";
import { getSettings } from "@/db/queries/settings";
import { getCategoryPage, listCategorySlugs, type CategoryDetail, type CategoryPage, type ShopGuide } from "@/db/queries/shop";
import { formatAgeRange, toFaDigits } from "@/lib/format";
import { breadcrumbNode, collectionNodes, entitiesFromSameAs, entity, graph, JsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

/*
 * /shop/{category} (DESIGN.md §6.2, SEO.md §1.4, §2.3, §3.5.2, §8.3): the shop template for one
 * shelf. The window holds the category's drawing (morphing from its cubby); the intro's first
 * paragraph is visible and the rest waits in «بیشتر بخوانید» (still in the HTML). The buying
 * guide is linked above the grid and excerpted below it; then the category FAQ (visible, with no
 * FAQPage markup per SEO.md §3.3), its glossary terms and «سؤالی داری؟». An unknown or empty
 * category is a real 404.
 */

/** Filters earn their space from this many products; below it the whole shelf fits on a screen. */
const FILTER_MIN_PRODUCTS = 4;

export async function generateStaticParams() {
  return (await listCategorySlugs()).map((category) => ({ category }));
}

/** DB SEO titles carry the brand suffix (« | چوبز کیدز»); headings and JSON-LD names don't. */
const withoutSuffix = (title: string) => title.replace(/\s+\|[^|]*$/, "").trim();

function seoTitle(c: CategoryDetail): string {
  return c.seoTitle?.trim() || `${c.name} چوبی کودک`;
}

/** H1 = the SEO title without the brand (DESIGN.md §6.2), else the plain name. */
function heading(c: CategoryDetail): string {
  return c.seoTitle ? withoutSuffix(c.seoTitle) || c.name : c.name;
}

/** SEO.md §2.3: «{tagline}؛ {count} مدل برای {ageRange}، از {material}. ارسال به سراسر ایران، خرید قسطی.» */
function describe(page: CategoryPage, installments: boolean): string {
  const { category, products, ageRange } = page;
  if (category.seoDescription?.trim()) return category.seoDescription.trim();
  const ages = formatAgeRange(ageRange.min, ageRange.max);
  const lead = category.tagline ? `${category.tagline}؛ ` : "";
  return (
    `${lead}${toFaDigits(products.length)} مدل${ages ? ` برای ${ages}` : ""}، از تختهٔ چندلایی توس. ` +
    `ارسال به سراسر ایران${installments ? "، خرید قسطی" : ""}.`
  );
}

const canonical = (c: CategoryDetail) => c.canonicalPath || `/shop/${c.slug}`;

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const [page, settings] = await Promise.all([getCategoryPage(slug), getSettings()]);
  if (!page) return {};
  return pageMetadata({
    ownOgImage: true,
    title: seoTitle(page.category),
    description: describe(page, !!settings.snapppay?.enabled),
    path: canonical(page.category),
    noindex: page.category.noindex,
  });
}

/** The intro up to and including its first paragraph, and the rest. */
function splitIntro(markdown: string): [string, string] {
  const blocks = markdown.trim().split(/\n{2,}/);
  const first = blocks.findIndex((b) => !/^\s*(#|>|[-*+] |\d+\. |:::|\|)/.test(b));
  const cut = first === -1 ? blocks.length : first + 1;
  return [blocks.slice(0, cut).join("\n\n"), blocks.slice(cut).join("\n\n")];
}

export default async function CategoryShopPage({ params }: PageProps<"/shop/[category]">) {
  const { category: slug } = await params;
  const [page, settings] = await Promise.all([getCategoryPage(slug), getSettings()]);
  if (!page) notFound();

  const { category, products, guide, faqs, terms, ageRange } = page;
  const path = `/shop/${category.slug}`;
  const trail = crumbTrail({ name: "فروشگاه", path: "/shop" }, { name: category.name, path });
  const description = describe(page, !!settings.snapppay?.enabled);
  const [lead, more] = category.description ? splitIntro(category.description) : ["", ""];

  const about = terms.slice(0, 3).map((t) => (t.sameAs.length ? (entitiesFromSameAs(t.sameAs, t.term)[0] ?? entity(t.slug)) : entity(t.slug)));
  const jsonLd = graph(
    collectionNodes({
      path,
      name: withoutSuffix(seoTitle(category)),
      description,
      breadcrumb: true,
      about: about.length ? about : null,
      audience: { minMonths: ageRange.min, maxMonths: ageRange.max },
      items: products.map((p) => ({ path: `/product/${p.slug}`, name: p.name })),
      order: "ascending",
    }),
    breadcrumbNode(trail),
  );

  const grid = (
    <ProductGrid groups={[{ slug: category.slug, srTitle: `محصولات ${category.name}`, products, guide }]} />
  );

  return (
    <PageTurn>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-page px-gutter pt-5 pb-section lg:pt-8">
        <header className="pb-8 pt-4 lg:pb-10 lg:pt-10">
          <Breadcrumbs items={trail} />
          <h1 className="headline mt-6 text-3xl lg:text-[4.5rem]">
            {heading(category)}
            {category.tagline ? (
              <>
                {" "}
                <span className="block text-xl text-muted lg:text-[2rem] lg:leading-snug">{category.tagline}</span>
              </>
            ) : null}
          </h1>
          <p className="mt-4 text-sm text-muted">
            {toFaDigits(products.length)} محصول{formatAgeRange(ageRange.min, ageRange.max) ? ` · مناسب ${formatAgeRange(ageRange.min, ageRange.max)}` : ""}
          </p>
          <div className="mt-5 max-w-[46rem]">
            {lead ? <Prose markdown={lead} variant="page" className="text-muted" /> : null}
            {more ? <MoreIntro markdown={more} /> : null}
          </div>
        </header>

        <CategoryStrip categories={page.categories} current={category.slug} />

        {guide ? <GuideLink guide={guide} className="mt-6 lg:mt-8" /> : null}

        <div className="mt-6 lg:mt-8">
          {products.length >= FILTER_MIN_PRODUCTS ? (
            <FilterBar facets={page.facets} total={products.length}>
              {grid}
            </FilterBar>
          ) : (
            grid
          )}
        </div>

        {guide && guide.tldr.length ? <GuideExcerpt guide={guide} className="mt-16 lg:mt-24" /> : null}

        <div className="mt-16 grid gap-10 lg:mt-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="flex max-w-prose flex-col gap-12">
            {faqs.length ? <CategoryFaq name={category.name} faqs={faqs} /> : null}
            {terms.length ? <Terms terms={terms} /> : null}
          </div>
          <AskChoobz socials={settings.socials} className="self-start lg:sticky lg:top-[calc(var(--spacing-header-lg)+1.5rem)]" />
        </div>
      </div>
    </PageTurn>
  );
}

/* ------------------------------------------------------------------ */

/** The rest of the intro: in the DOM for readers and crawlers, folded for the shop. */
function MoreIntro({ markdown }: { markdown: string }) {
  return (
    <details className="group mt-3">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-bit-xs text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <span className="link-mark group-open:hidden">بیشتر بخوانید</span>
        <span className="link-mark hidden group-open:inline">بستن</span>
        <Icon name="chevron-down" className="size-4 transition-transform duration-(--dur-base) ease-wood group-open:rotate-180" />
      </summary>
      <Prose markdown={markdown} variant="page" className="mt-2 text-muted" />
    </details>
  );
}

/** «راهنمای انتخاب: … ←» above the grid (category ↔ pillar, both ways). */
function GuideLink({ guide, className }: { guide: ShopGuide; className?: string }) {
  return (
    <p className={className}>
      <Link
        href={`/mag/${guide.slug}`}
        transitionTypes={["nav-forward"]}
        className="ply flex min-h-12 w-full items-center gap-2.5 rounded-bit-sm bg-raised px-4 py-2.5 text-sm text-ink active:translate-y-0.5 active:shadow-ply-pressed sm:inline-flex sm:w-auto"
      >
        <Icon name="book" className="size-5 shrink-0 text-success" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span>
            <span className="font-bold">راهنمای انتخاب: </span>
            {shortTitle(guide.title)}
          </span>
          <span className="text-xs text-muted">{toFaDigits(guide.readingMinutes)} دقیقه مطالعه</span>
        </span>
        <span aria-hidden="true" className="shrink-0 font-semibold">
          ←
        </span>
      </Link>
    </p>
  );
}

const EXCERPT_POINTS = 3;

/** The guide's answer-first summary, quoted in a mint bubble, then the way in. */
function GuideExcerpt({ guide, className }: { guide: ShopGuide; className?: string }) {
  return (
    <section aria-labelledby="buying-guide" className={cn("max-w-prose", className)}>
      <SectionHeader
        id="buying-guide"
        size="content"
        kicker="خلاصهٔ راهنمای انتخاب"
        kickerTone="success"
        title="پیش از خرید چه بدانیم؟"
      />
      <Bubble size="lg" className="mt-5">
        <ul className="flex list-disc flex-col gap-2.5 ps-5 text-base marker:text-success">
          {guide.tldr.slice(0, EXCERPT_POINTS).map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </Bubble>
      <Button variant="quiet" href={`/mag/${guide.slug}`} transitionTypes={["nav-forward"]} className="mt-1 whitespace-normal">
        <span className="link-mark">خواندن راهنمای کامل: {shortTitle(guide.title)}</span>
        <span aria-hidden="true">←</span>
      </Button>
    </section>
  );
}

function CategoryFaq({ name, faqs }: { name: string; faqs: CategoryPage["faqs"] }) {
  return (
    <section aria-labelledby="category-faq">
      <h2 id="category-faq" className="font-display text-xl text-ink">
        سؤال‌های رایج دربارهٔ {name}
      </h2>
      <div className="mt-4 divide-y divide-line border-y border-line">
        {faqs.map((faq) => (
          <div key={faq.id} className="py-5">
            <h3 className="text-base font-bold text-ink">{faq.question}</h3>
            <Prose markdown={faq.answer} variant="compact" className="mt-1.5 text-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Terms({ terms }: { terms: CategoryPage["terms"] }) {
  return (
    <section aria-labelledby="category-terms">
      <h2 id="category-terms" className="font-display text-xl text-ink">
        واژه‌هایی که به کارتان می‌آید
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {terms.map((t) => (
          <li key={t.slug}>
            <PillChip href={`/glossary/${t.slug}`} icon="book" title={t.definition} prefetch={false}>
              {t.term}
            </PillChip>
          </li>
        ))}
      </ul>
    </section>
  );
}
