import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ArticleCard } from "@/components/mag/ArticleCard";
import { TermCard } from "@/components/mag/TermCard";
import { CategoryCubby } from "@/components/shop/CategoryCubby";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getArticleCardsBySlugs, listTermCards } from "@/db/queries/cards";
import { listCategories, listProductCards } from "@/db/queries/catalog";
import {
  cleanQuery,
  listPillarGuideSlugs,
  MAX_QUERY_LENGTH,
  search,
  type SearchHit,
  type SearchKind,
  type SearchResults,
} from "@/db/queries/search";
import { formatNumber } from "@/lib/format";

/*
 * Site search (DESIGN.md §4.4, SEO.md §7.5). Server-rendered and shareable; results in three
 * groups «محصولات · راهنماها · واژه‌ها». An empty query shows suggestions and the shop and
 * pillar guides; zero results still answer 200 with the same way out (DESIGN.md §11.2 #12).
 */

type SearchPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const PER_GROUP = 24;
const SUGGESTED_QUERIES = ["برج یادگیری", "مثلث پیکلر", "۱ سالگی", "اتاق مونته‌سوری"];

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = cleanQuery((await searchParams).q);
  return {
    title: query ? `جستجو برای «${query}»` : "جستجو",
    description: "جستجو در محصولات، راهنماهای مجله و واژه‌نامهٔ چوبز کیدز.",
    robots: { index: false, follow: true },
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="mx-auto max-w-page px-gutter pt-10 pb-section lg:pt-14">
      {/* The shell (header + empty form) is static; the query and results stream in. */}
      <Suspense fallback={<SearchHeader query="" />}>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchContent({ searchParams }: SearchPageProps) {
  const query = cleanQuery((await searchParams).q);
  if (!query) {
    return (
      <>
        <SearchHeader query="" />
        <SuggestedQueries />
        <Browse />
      </>
    );
  }

  const results = search(query, PER_GROUP);
  return (
    <>
      <SearchHeader query={query} total={results.total} />
      {results.total > 0 ? (
        <ResultGroups results={results} />
      ) : (
        <>
          <p className="mt-8 max-w-prose text-lead">
            برای «<bdi>{query}</bdi>» چیزی پیدا نکردیم؛ شاید این‌ها به کارت بیاد:
          </p>
          <Browse />
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Header + form                                                       */
/* ------------------------------------------------------------------ */

function SearchHeader({ query, total }: { query: string; total?: number }) {
  return (
    <header className="max-w-narrow">
      <h1 className="text-3xl text-ink">
        {query ? (
          <>
            جستجو برای «<bdi>{query}</bdi>»
          </>
        ) : (
          "جستجو"
        )}
      </h1>
      <SearchForm query={query} />
      {total ? <p className="mt-3 text-sm text-muted">{formatNumber(total)} نتیجه</p> : null}
    </header>
  );
}

function SearchForm({ query }: { query: string }) {
  return (
    // next/form: a plain GET form without JS, a client-side navigation with it.
    <Form action="/search" role="search" className="mt-6 flex items-stretch gap-2">
      <label htmlFor="search-q" className="sr-only">
        دنبال چی می‌گردی؟
      </label>
      <div className="relative min-w-0 flex-1">
        <Icon name="search" className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-5 text-muted" />
        <input
          // Remount per query so the field shows the search being displayed after a navigation.
          key={query}
          id="search-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="دنبال چی می‌گردی؟"
          maxLength={MAX_QUERY_LENGTH}
          autoComplete="off"
          enterKeyHint="search"
          dir="rtl"
          className="h-12 w-full rounded-bit-sm border-[1.5px] border-line-strong bg-sunken ps-11 pe-3.5 text-base text-ink inset-shadow-tray placeholder:text-muted focus-visible:border-focus"
        />
      </div>
      <Button variant="primary" size="md" type="submit">
        جستجو
      </Button>
    </Form>
  );
}

function SuggestedQueries() {
  return (
    <section aria-labelledby="search-suggested" className="mt-10">
      <h2 id="search-suggested" className="text-base font-semibold text-muted">
        شاید دنبال این‌ها باشی
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED_QUERIES.map((q) => (
          <li key={q}>
            <Link
              href={`/search?q=${encodeURIComponent(q)}`}
              prefetch={false}
              className="inline-flex h-10 items-center rounded-bead bg-wood px-4 text-sm font-semibold text-ink shadow-ply transition-[translate,box-shadow] duration-(--dur-press) active:translate-y-0.5 active:shadow-ply-pressed"
            >
              {q}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

/** Items whose slug was hit, in hit (relevance) order. */
function inHitOrder<T extends { slug: string }>(items: T[], hits: SearchHit[]): T[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  return hits.map((hit) => bySlug.get(hit.slug)).filter((item): item is T => item !== undefined);
}

const ofKind = (hits: SearchHit[], ...kinds: SearchKind[]) => hits.filter((hit) => kinds.includes(hit.kind));

async function ResultGroups({ results }: { results: SearchResults }) {
  const productHits = ofKind(results.products, "product");
  const postHits = ofKind(results.guides, "post");
  // Full cached lists filtered here (one cache entry each, not one per query); posts by slug.
  const [allProducts, articles, allTerms] = await Promise.all([
    listProductCards(),
    getArticleCardsBySlugs(postHits.map((hit) => hit.slug)),
    listTermCards(),
  ]);
  const products = inHitOrder(allProducts, productHits);
  const posts = inHitOrder(articles, postHits);
  const terms = inHitOrder(allTerms, results.terms);
  const shopShortcuts = ofKind(results.products, "category", "room");
  const topicShortcuts = ofKind(results.guides, "topic");

  return (
    <div className="mt-4">
      {products.length + shopShortcuts.length > 0 ? (
        <ResultGroup id="results-products" title="محصولات" count={products.length + shopShortcuts.length}>
          <Shortcuts hits={shopShortcuts} />
          {products.length ? (
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product, i) => (
                <li key={product.id}>
                  <ProductCard product={product} prefetch={i < 4} showCategory />
                </li>
              ))}
            </ul>
          ) : null}
        </ResultGroup>
      ) : null}

      {posts.length + topicShortcuts.length > 0 ? (
        <ResultGroup id="results-guides" title="راهنماها" count={posts.length + topicShortcuts.length}>
          <Shortcuts hits={topicShortcuts} />
          {posts.length ? (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
                <li key={post.slug}>
                  <ArticleCard post={post} prefetch={i < 3} />
                </li>
              ))}
            </ul>
          ) : null}
        </ResultGroup>
      ) : null}

      {terms.length ? (
        <ResultGroup id="results-terms" title="واژه‌ها" count={terms.length}>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {terms.map((term) => (
              <li key={term.slug}>
                <TermCard term={term} />
              </li>
            ))}
          </ul>
        </ResultGroup>
      ) : null}
    </div>
  );
}

function ResultGroup({ id, title, count, children }: { id: string; title: string; count: number; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <SectionHeader
        id={id}
        size="content"
        title={
          <>
            {title} <span className="font-body text-base text-muted">({formatNumber(count)})</span>
          </>
        }
      />
      {children}
    </section>
  );
}

const SHORTCUT: Partial<Record<SearchKind, { icon: IconName; label: string }>> = {
  category: { icon: "shelf", label: "دسته‌بندی" },
  room: { icon: "house", label: "چیدمان اتاق" },
  topic: { icon: "notebook", label: "موضوع مجله" },
};

/** Categories, rooms and topics: raised pills that jump straight to the hub page. */
function Shortcuts({ hits }: { hits: SearchHit[] }) {
  if (!hits.length) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {hits.map((hit) => {
        const shortcut = SHORTCUT[hit.kind]!;
        return (
          <li key={`${hit.kind}:${hit.slug}`}>
            <Link
              href={hit.href}
              className="ply inline-flex min-h-11 items-center gap-2 rounded-bead px-4 py-1.5 text-sm text-ink"
            >
              <Icon name={shortcut.icon} className="size-5 text-muted" />
              <span className="text-muted">{shortcut.label}:</span>
              <span className="font-semibold">{hit.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Empty query and zero results: the shop and the pillar guides         */
/* ------------------------------------------------------------------ */

async function Browse() {
  const [categories, guides] = await Promise.all([listCategories(), getArticleCardsBySlugs(listPillarGuideSlugs(3))]);
  const stocked = categories.filter((category) => category.productCount > 0);
  return (
    <>
      {stocked.length ? (
        <section aria-labelledby="browse-shop" className="mt-12">
          <SectionHeader id="browse-shop" size="content" title="دسته‌های فروشگاه" link={{ label: "همهٔ محصولات", href: "/shop" }} />
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stocked.map((category) => (
              <li key={category.slug}>
                <CategoryCubby category={category} compact />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {guides.length ? (
        <section aria-labelledby="browse-guides" className="mt-12">
          <SectionHeader id="browse-guides" size="content" title="راهنماهای اصلی مجله" link={{ label: "مجله چوبز", href: "/mag" }} />
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((post) => (
              <li key={post.slug}>
                <ArticleCard post={post} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
