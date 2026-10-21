import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { ArticleCover } from "@/components/mag/ArticleCover";
import { ArticleFaq, FAQ_SECTION_ID, FAQ_TITLE } from "@/components/mag/ArticleFaq";
import { ArticleHeader } from "@/components/mag/ArticleHeader";
import { AuthorBox } from "@/components/mag/AuthorBox";
import { Byline, EDITORIAL_NAME, shownReviewer } from "@/components/mag/Byline";
import { MedicalNote } from "@/components/mag/MedicalNote";
import { NextInPath } from "@/components/mag/NextInPath";
import { Prose } from "@/components/mag/Prose";
import { RelatedPosts } from "@/components/mag/RelatedPosts";
import { ShareRow } from "@/components/mag/ShareRow";
import { Sources, SOURCES_SECTION_ID, SOURCES_TITLE } from "@/components/mag/Sources";
import { Tldr } from "@/components/mag/Tldr";
import { TOC_SHEET_ID, TocAside, TocInline, TocPill, tocScope, type TocItem } from "@/components/mag/Toc";
import { TocSpy } from "@/components/mag/TocSpy";
import { ProductCard } from "@/components/shop/ProductCard";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { getArticle, listPostSlugs, type ArticleData, type MagPerson } from "@/db/queries/mag";
import { shortTitle } from "@/db/queries/nav";
import { getSettings } from "@/db/queries/settings";
import { articleNodes, graph, JsonLd, type AuthorLdInput } from "@/lib/jsonld";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

/*
 * /mag/{slug} — the article (DESIGN.md §7.3, SEO.md §4.3, §8.7), in the order of §7.3:
 * breadcrumbs · header (eyebrow, H1, dek) · byline · cover · TL;DR · TOC · body · medical note ·
 * FAQ · sources · author box · products seen · next step + related · share · ask · closing line.
 * Phones: one column. ≥ 1024px: the TOC sticks in the inline-start column, the prose takes the
 * centre and the inline-end column is left as the margin for marginalia.
 * JSON-LD: WebPage (reviewer) + Article (citation, about, mentions) + author/reviewer +
 * primary image + BreadcrumbList + FAQPage, and HowTo for `howto` posts only.
 */

/** DESIGN.md §7.3 #6: a TOC only for articles longer than this. */
const TOC_MIN_WORDS = 1200;
/** «وسایلی که در این مطلب دیدید»: a mini grid of one to three products. */
const SEEN_PRODUCTS = 3;
/** The body already carries the disclaimer when an author wrote it into a callout. */
const DISCLAIMER_TEXT = "جایگزین مشاورهٔ پزشک نیست";

export async function generateStaticParams() {
  return (await listPostSlugs()).map((slug) => ({ slug }));
}

const pathOf = (post: ArticleData["post"]) => post.canonicalPath ?? `/mag/${post.slug}`;

/** People as the JSON-LD builders take them; collective authors carry the byline's name. */
function ldPerson(person: MagPerson | null): AuthorLdInput | null {
  if (!person || person.isPlaceholder) return null;
  return { ...person, name: person.isOrganization ? EDITORIAL_NAME : person.name };
}

export async function generateMetadata({ params }: PageProps<"/mag/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArticle(slug);
  if (!data) return { title: "این صفحه پیدا نشد", robots: { index: false, follow: true } };
  const { post, topic, author } = data;
  const named = author && !author.isPlaceholder ? author : null;
  return pageMetadata({
    ownOgImage: true,
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    path: pathOf(post),
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.contentUpdatedAt,
    authors: named ? [`/team/${named.slug}`] : undefined,
    section: topic?.name,
    tags: [post.primaryQuery, ...post.secondaryQueries].filter((t): t is string => !!t),
    markdownPath: `/mag/${post.slug}.md`,
    noindex: post.noindex,
  });
}

export default async function ArticlePage({ params }: PageProps<"/mag/[slug]">) {
  const { slug } = await params;
  const data = await getArticle(slug);
  if (!data) notFound();
  const settings = await getSettings();

  const { post, topic, author, reviewer, faqs, products, headings, steps, wordCount, next, related, cover } = data;
  const path = pathOf(post);
  const trail = crumbTrail(
    { name: "مجله", path: "/mag" },
    ...(topic ? [{ name: topic.name, path: `/mag/topic/${topic.slug}` }] : []),
    { name: shortTitle(post.title), path },
  );

  const toc: TocItem[] =
    wordCount > TOC_MIN_WORDS
      ? [
          ...headings.filter((h) => h.depth === 2).map((h) => ({ id: h.id, text: h.text })),
          ...(faqs.length ? [{ id: FAQ_SECTION_ID, text: FAQ_TITLE }] : []),
          ...(post.sources.length ? [{ id: SOURCES_SECTION_ID, text: SOURCES_TITLE }] : []),
        ]
      : [];
  const hasToc = toc.length > 1;
  const showMedicalNote = post.ymyl && !post.body.includes(DISCLAIMER_TEXT);
  const seen = products.slice(0, SEEN_PRODUCTS);

  const jsonLd = graph(
    articleNodes(
      {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        publishedAt: post.publishedAt,
        contentUpdatedAt: post.contentUpdatedAt,
        reviewedAt: post.reviewedAt,
        readingMinutes: post.readingMinutes,
        wordCount,
        sources: post.sources,
        primaryQuery: post.primaryQuery,
        secondaryQueries: post.secondaryQueries,
        aboutEntities: post.aboutEntities,
        ageMinMonths: post.ageMinMonths,
        ageMaxMonths: post.ageMaxMonths,
        illustration: post.illustration,
      },
      {
        author: ldPerson(author),
        reviewer: ldPerson(shownReviewer(reviewer)),
        topic,
        images: cover?.kind === "photo" ? [{ ...cover.image, caption: cover.caption, credit: cover.credit }] : [],
        productSlugs: products.map((p) => p.slug),
        breadcrumb: trail,
        faqs,
        steps: post.format === "howto" ? steps.map((s) => ({ name: s.name, text: s.text })) : undefined,
      },
    ),
  );

  return (
    <PageTurn>
      <article className={cn("mx-auto max-w-page px-gutter pt-3 pb-section", hasToc && tocScope)}>
        <Breadcrumbs items={trail} className="mb-5" />

        <div className="lg:grid lg:grid-cols-[minmax(11rem,15rem)_minmax(0,38rem)_minmax(0,1fr)] lg:gap-x-10 xl:gap-x-14">
          {hasToc ? (
            <aside className="hidden lg:col-start-1 lg:row-start-1 lg:block">
              <TocAside items={toc} />
            </aside>
          ) : null}

          <div className="flex min-w-0 flex-col gap-7 lg:col-start-2 lg:row-start-1">
            <ArticleHeader
              title={post.title}
              dek={post.excerpt}
              format={post.format}
              topic={topic}
              ageMinMonths={post.ageMinMonths}
              ageMaxMonths={post.ageMaxMonths}
            >
              <Byline
                author={author}
                reviewer={reviewer}
                publishedAt={post.publishedAt}
                updatedAt={post.contentUpdatedAt}
                reviewedAt={post.reviewedAt}
                readingMinutes={post.readingMinutes}
                className="mt-1"
              />
            </ArticleHeader>

            {cover ? <ArticleCover postId={post.id} slug={post.slug} cover={cover} /> : null}
            <Tldr items={post.tldr} />
            {hasToc ? <TocInline items={toc} className="lg:hidden" /> : null}

            <Prose markdown={post.body} variant="article" glossaryLinks slug={post.slug} className="max-w-prose" />

            <div className="flex flex-col gap-10 pt-4 [content-visibility:auto] [contain-intrinsic-size:auto_1400px]">
              {showMedicalNote ? <MedicalNote /> : null}
              <ArticleFaq faqs={faqs} />
              <Sources sources={post.sources} />
              <AuthorBox author={author} reviewer={reviewer} />
            </div>
          </div>
        </div>

        <div className="mt-section flex flex-col gap-section [content-visibility:auto] [contain-intrinsic-size:auto_1600px]">
          {seen.length ? (
            <section aria-labelledby="seen-products" className="flex flex-col gap-5">
              <h2 id="seen-products" className="font-display text-xl text-ink">
                وسایلی که در این مطلب دیدید
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:max-w-[60rem]">
                {seen.map((product, index) => (
                  <li key={product.id}>
                    <ProductCard product={product} prefetch={index < 4} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {next || related.length ? (
            <div className="flex flex-col gap-12">
              <NextInPath post={next} className="lg:max-w-[60rem]" />
              <RelatedPosts posts={related} topic={topic} />
            </div>
          ) : null}

          <div className="flex flex-col gap-8 lg:max-w-[48rem]">
            <ShareRow url={absoluteUrl(path)} title={post.title} />
            {products.length ? <AskChoobz socials={settings.socials} /> : null}
            <p className="font-accent text-lead text-muted">قصهٔ این مطلب همین‌جا تموم شد؛ قصهٔ بچه‌ت تازه شروع شده.</p>
          </div>
        </div>

        {hasToc ? (
          <>
            <TocPill items={toc} />
            <TocSpy ids={toc.map((item) => item.id)} sheetId={TOC_SHEET_ID} />
          </>
        ) : null}
      </article>
      <JsonLd data={jsonLd} />
    </PageTurn>
  );
}
