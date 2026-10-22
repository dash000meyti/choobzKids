import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { ArticleCard } from "@/components/mag/ArticleCard";
import { Prose } from "@/components/mag/Prose";
import { TermCard } from "@/components/mag/TermCard";
import { ProductCard } from "@/components/shop/ProductCard";
import { hasRender, Render } from "@/components/studio/Render";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getTopicPage, listTopicSlugs, type TopicPage } from "@/db/queries/mag";
import { getSettings } from "@/db/queries/settings";
import { toFaDigits } from "@/lib/format";
import { breadcrumbNode, collectionNodes, entitiesFromSameAs, graph, JsonLd, type ListEntry } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /mag/topic/{topic} (DESIGN.md §7.2, SEO.md §1.4): the topic hub. Header with the topic's render
 * and the pillar guide above the fold, the intro, every cluster article, the topic's products and
 * glossary terms, then AskChoobz. JSON-LD: CollectionPage + ItemList of the articles in visible
 * order (about = the topic's entities), BreadcrumbList.
 */

/* Every topic is prerendered by generateStaticParams; see age/[range] for why this is off. */
export const instant = false;

export async function generateStaticParams() {
  const slugs = await listTopicSlugs();
  return slugs.map((topic) => ({ topic }));
}

const pathOf = (slug: string) => `/mag/topic/${slug}`;

function descriptionOf({ topic, posts }: TopicPage): string {
  return (
    topic.seoDescription ??
    `${topic.tagline ?? topic.name}؛ ${toFaDigits(posts.length)} راهنما و مقالهٔ مجله چوبز دربارهٔ ${topic.name}، همراه با وسایل چوبی مرتبط و واژه‌های کلیدی.`
  );
}

export async function generateMetadata({ params }: PageProps<"/mag/topic/[topic]">): Promise<Metadata> {
  const { topic: slug } = await params;
  const data = await getTopicPage(slug);
  if (!data) return {};
  return pageMetadata({
    title: data.topic.seoTitle ?? `${data.topic.name}: راهنماها و مقاله‌ها`,
    suffix: " | مجله چوبز",
    description: descriptionOf(data),
    path: data.topic.canonicalPath ?? pathOf(data.topic.slug),
    modifiedTime: data.lastModified,
    noindex: data.topic.noindex,
  });
}

export default async function TopicHubPage({ params }: PageProps<"/mag/topic/[topic]">) {
  const { topic: slug } = await params;
  const data = await getTopicPage(slug);
  if (!data) notFound();

  const { topic, pillar, posts, products, terms } = data;
  const { socials } = await getSettings();
  const path = pathOf(topic.slug);
  const trail = crumbTrail({ name: "مجله", path: "/mag" }, { name: topic.name, path });
  const rest = pillar ? posts.filter((p) => p.id !== pillar.id) : posts;

  const items: ListEntry[] = posts.map((p) => ({ path: `/mag/${p.slug}`, name: p.title }));
  const [page, list] = collectionNodes({
    path,
    name: `${topic.name}: راهنماها و مقاله‌ها`,
    description: descriptionOf(data),
    breadcrumb: true,
    about: topic.sameAs.length ? entitiesFromSameAs(topic.sameAs, topic.name) : undefined,
    dateModified: data.lastModified ?? undefined,
    items,
  });
  const render = topic.illustration && hasRender(topic.illustration) ? topic.illustration : null;

  return (
    <PageTurn>
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={trail} />

        <header className="mt-6 grid items-center gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div>
            <p className="eyebrow">مجله چوبز · {toFaDigits(posts.length)} مطلب</p>
            <h1 className="headline mt-1 text-3xl lg:text-[4rem]">{topic.name}</h1>
            {topic.tagline ? <p className="mt-3 max-w-prose text-lead text-muted">{topic.tagline}</p> : null}
            {pillar ? (
              <Link
                href={`/mag/${pillar.slug}`}
                transitionTypes={["nav-forward"]}
                className="mt-7 flex max-w-xl flex-col rounded-[1.5rem] bg-surface p-6 transition-transform duration-300 hover:scale-[1.01]"
              >
                <span className="text-xs font-semibold text-eyebrow">از این‌جا شروع کنید · راهنمای کامل</span>
                <span className="mt-1.5 text-lg leading-snug font-bold text-ink">{pillar.title}</span>
                <span className="link-arrow mt-3 text-sm">خواندن راهنما</span>
              </Link>
            ) : null}
          </div>
          {render ? (
            <div aria-hidden="true" className="rounded-[1.75rem] bg-surface px-10 pt-12 pb-6">
              <Render productKey={render} alt="" sizes="(min-width: 1024px) 26rem, 90vw" box="4 / 3" priority />
            </div>
          ) : null}
        </header>

        {topic.description ? (
          <section aria-label={`دربارهٔ ${topic.name}`} className="mt-section max-w-prose">
            <Prose markdown={topic.description} variant="page" slug={`topic-${topic.slug}`} glossaryLinks />
          </section>
        ) : null}

        {rest.length ? (
          <section aria-labelledby="topic-posts" className="mt-section">
            <SectionHeader id="topic-posts" title={`همهٔ مطالب ${topic.name}`} />
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post, i) => (
                <li key={post.id}>
                  <ArticleCard post={post} prefetch={i < 3} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {products.length ? (
          <section aria-labelledby="topic-products" className="mt-section">
            <SectionHeader id="topic-products" title="وسایل مرتبط" link={{ label: "همهٔ محصولات", href: "/shop" }} />
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} showCategory />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {terms.length ? (
          <section aria-labelledby="topic-terms" className="mt-section">
            <SectionHeader id="topic-terms" title="واژه‌های کلیدی" link={{ label: "واژه‌نامه", href: "/glossary" }} />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {terms.map((term) => (
                <li key={term.slug}>
                  <TermCard term={term} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <AskChoobz socials={socials} className="mt-section max-w-narrow" />
      </div>
      <JsonLd data={graph(page, list, breadcrumbNode(trail))} />
    </PageTurn>
  );
}
