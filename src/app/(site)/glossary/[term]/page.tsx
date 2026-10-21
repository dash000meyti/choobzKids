import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { ArticleCard } from "@/components/mag/ArticleCard";
import { Prose } from "@/components/mag/Prose";
import { TermCard } from "@/components/mag/TermCard";
import { TermHero } from "@/components/mag/TermHero";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IntentLink } from "@/components/ui/IntentLink";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getGlossaryTerm, listGlossaryTermSlugs, type GlossaryTerm } from "@/db/queries/glossary";
import { breadcrumbNode, definedTermNode, definedTermSetNode, graph, ids, JsonLd, webPageNode } from "@/lib/jsonld";
import { clampText, pageMetadata } from "@/lib/seo";

/*
 * /glossary/{term} (DESIGN.md §7.4, SEO.md §1.6, §3.5.7, §8.9): the definition first, then the
 * short body, the pillar guide, related products, posts and neighbouring terms, and visible
 * Wikipedia links. Quality gate: a term without a 150-word body or 2 related posts/products is
 * `noindex, follow` (and out of the sitemap), but still a full page for readers.
 */

/*
 * `params` is awaited before any Suspense so an unknown term is a real 404 (TECH.md §2.5). Every
 * term is prerendered by generateStaticParams, so navigations land on a complete static page;
 * the dev-only instant-shell validation (which assumes an unlisted param) is off here.
 */
export const instant = false;

const SUFFIX = " | واژه‌نامه چوبز";

export async function generateStaticParams() {
  const slugs = await listGlossaryTermSlugs();
  return slugs.map((term) => ({ term }));
}

const pathOf = (slug: string) => `/glossary/${slug}`;
const titleOf = (term: GlossaryTerm) => `${term.term} چیست؟ تعریف کوتاه و کاربرد`;

/** The definition's leading sentences that fit a meta description (SEO.md §2.3: verbatim, ≤ 155). */
function metaDescription(definition: string): string {
  const sentences = definition.match(/[^.!؟?]+[.!؟?]+/g) ?? [definition];
  let text = "";
  for (const sentence of sentences) {
    const next = `${text} ${sentence.trim()}`.trim();
    if ([...next].length > 155) break;
    text = next;
  }
  return text || clampText(definition, 155);
}

export async function generateMetadata({ params }: PageProps<"/glossary/[term]">): Promise<Metadata> {
  const { term: slug } = await params;
  const term = await getGlossaryTerm(slug);
  if (!term) return {};
  return pageMetadata({
    title: titleOf(term),
    suffix: SUFFIX,
    description: metaDescription(term.definition),
    path: pathOf(term.slug),
    markdownPath: `${pathOf(term.slug)}.md`,
    noindex: !term.indexable,
  });
}

export default async function GlossaryTermPage({ params }: PageProps<"/glossary/[term]">) {
  const { term: slug } = await params;
  const term = await getGlossaryTerm(slug);
  if (!term) notFound();

  const path = pathOf(term.slug);
  const trail = crumbTrail({ name: "واژه‌نامه", path: "/glossary" }, { name: term.term, path });
  const guides = term.posts.filter((p) => p.slug !== term.pillar?.slug);
  const subjectOf = [...(term.pillar ? [term.pillar.slug] : []), ...guides.map((p) => p.slug)];

  const ld = graph(
    webPageNode({ path, name: titleOf(term), breadcrumb: true, mainEntity: ids.term(term.slug), dateModified: term.updatedAt }),
    definedTermNode({
      slug: term.slug,
      term: term.term,
      originalTerm: term.originalTerm,
      definition: term.definition,
      alternateNames: term.alternateNames,
      sameAs: term.sameAs,
      postSlugs: subjectOf,
    }),
    definedTermSetNode(),
    breadcrumbNode(trail),
  );

  return (
    <PageTurn>
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={trail} />

        <div className="mt-6 max-w-narrow lg:mt-8">
          <TermHero term={term} />

          {term.body ? (
            <Prose markdown={term.body} variant="page" glossaryLinks excludeTerms={[term.slug]} className="mt-8 max-w-prose" />
          ) : null}

          {term.pillar ? <PillarLink slug={term.pillar.slug} title={term.pillar.title} /> : null}

          {term.wikipedia.length ? (
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>بیشتر بخوانید در ویکی‌پدیا:</span>
              {term.wikipedia.map((w) => (
                <a key={w.lang} href={w.url} target="_blank" rel="noopener" className="link-mark text-ink">
                  {w.lang === "fa" ? (
                    "ویکی‌پدیای فارسی"
                  ) : (
                    <bdi lang="en" dir="ltr">
                      English Wikipedia
                    </bdi>
                  )}
                </a>
              ))}
            </p>
          ) : null}
        </div>

        {term.products.length ? (
          <section aria-labelledby="term-products" className="mt-section">
            <SectionHeader id="term-products" size="content" title="وسایل مرتبط در فروشگاه چوبز" />
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {term.products.map((product, i) => (
                <li key={product.id}>
                  <ProductCard product={product} prefetch={i < 4} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {guides.length ? (
          <section aria-labelledby="term-guides" className="mt-section">
            <SectionHeader id="term-guides" size="content" title="راهنماهای مرتبط در مجلهٔ چوبز" />
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((post, i) => (
                <li key={post.id}>
                  <ArticleCard post={post} prefetch={i < 3} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {term.relatedTerms.length ? (
          <section aria-labelledby="term-neighbours" className="mt-section">
            <SectionHeader id="term-neighbours" size="content" title="واژه‌های نزدیک" />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {term.relatedTerms.map((t) => (
                <li key={t.id}>
                  <TermCard term={t} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-section">
          <Button href={`/glossary#${term.letterAnchor}`} variant="quiet" iconEnd="arrow-end" transitionTypes={["nav-back"]}>
            همهٔ واژه‌های واژه‌نامه
          </Button>
        </p>
      </div>
      <JsonLd data={ld} />
    </PageTurn>
  );
}

/* The pillar guide this term belongs to: a raised slip that is the link (SEO.md §1.10). */
function PillarLink({ slug, title }: { slug: string; title: string }) {
  return (
    <IntentLink
      href={`/mag/${slug}`}
      transitionTypes={["nav-forward"]}
      className="mt-8 flex items-center gap-4 rounded-[1.5rem] bg-surface p-5 transition-colors hover:bg-sunken"
    >
      <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-bg text-ink">
        <Icon name="notebook" className="size-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="eyebrow text-xs">راهنمای کامل</span>
        <span className="font-bold text-ink">{title}</span>
      </span>
      <Icon name="arrow-end" className="size-5 shrink-0 text-muted" />
    </IntentLink>
  );
}
