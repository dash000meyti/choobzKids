import type { Metadata } from "next";
import Form from "next/form";
import Link from "@/components/ui/Link";
import { Suspense, type ReactNode } from "react";
import { ArticleCard } from "@/components/mag/ArticleCard";
import { TermCard } from "@/components/mag/TermCard";
import { ProductCard } from "@/components/shop/ProductCard";
import { pill } from "@/components/studio/Actions";
import { CategoryStrip } from "@/components/studio/CategoryStrip";
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
    <div className="frame-col frame-pad pt-12 pb-band lg:pt-20">
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
    <header className="mx-auto flex max-w-2xl flex-col items-center text-center">
      <h1 className="headline text-3xl lg:text-[3.5rem]">
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
    <Form action="/search" prefetch={false} role="search" className="mt-7 flex w-full items-stretch gap-2">
      <label htmlFor="search-q" className="sr-only">
        دنبال چی می‌گردی؟
      </label>
      <div className="relative min-w-0 flex-1">
        <Icon name="search" className="pointer-events-none absolute inset-y-0 start-4 my-auto size-5 text-muted" />
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
          className="h-12 w-full rounded-full bg-surface ps-12 pe-4 text-base text-ink placeholder:text-muted focus-visible:outline-3 focus-visible:outline-focus"
        />
      </div>
      <button type="submit" className={pill("primary", "lg")}>
        جستجو
      </button>
    </Form>
  );
}

function SuggestedQueries() {
  return (
    <section aria-labelledby="search-suggested" className="mt-8 text-center">
      <h2 id="search-suggested" className="text-sm font-semibold text-muted">
        شاید دنبال این‌ها باشی
      </h2>
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {SUGGESTED_QUERIES.map((q) => (
          <li key={q}>
            <Link
              href={`/search?q=${encodeURIComponent(q)}`}
              prefetch={false}
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-ink ring-1 ring-line ring-inset transition-colors hover:ring-muted"
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
            <ul className="cells mt-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
            <ul className="cells mt-6 sm:grid-cols-2 lg:grid-cols-3">
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
          <ul className="cells mt-6 sm:grid-cols-2 lg:grid-cols-3">
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
    <section aria-labelledby={id} className="frame-rule-in frame-band">
      <SectionHeader
        id={id}
        size="content"
        title={
          <>
            {title} <span className="text-base font-semibold text-muted">({formatNumber(count)})</span>
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
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-sm text-ink transition-colors hover:bg-line"
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
        <section aria-labelledby="browse-shop" className="frame-rule-in frame-band">
          <SectionHeader id="browse-shop" size="content" title="دسته‌های فروشگاه" link={{ label: "همهٔ محصولات", href: "/shop" }} />
          <div className="mt-6">
            <CategoryStrip categories={stocked} />
          </div>
        </section>
      ) : null}
      {guides.length ? (
        <section aria-labelledby="browse-guides" className="frame-rule-in frame-band">
          <SectionHeader id="browse-guides" size="content" title="راهنماهای اصلی مجله" link={{ label: "مجله چوبز", href: "/mag" }} />
          <ul className="cells mt-6 sm:grid-cols-2 lg:grid-cols-3">
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
