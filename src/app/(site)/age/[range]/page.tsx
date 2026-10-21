import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { AgeHubHero } from "@/components/mag/AgeHubHero";
import { AgeSection, FaqDrawers } from "@/components/mag/AgeSection";
import { HubSources, MilestoneBlock } from "@/components/mag/MilestoneBlock";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { getAgeHub, listAgeHubSlugs, type AgeHubData } from "@/db/queries/age";
import { getSettings } from "@/db/queries/settings";
import { formatNumber } from "@/lib/format";
import {
  breadcrumbNode,
  collectionNodes,
  entity,
  faqNode,
  graph,
  JsonLd,
  personNode,
  ref,
  type ListEntry,
} from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /age/{range} (DESIGN.md §7.5, SEO.md §1.5, §3.5.6, §8.8): the hub header with the door fixed at
 * the hub's stage, the reviewed milestone summary, one anchored section per sub-range (milestone,
 * tips, products, room, guides), the age FAQ and the sources. JSON-LD: CollectionPage with
 * `audience` + an ItemList of the products and guides in visible order, BreadcrumbList, and
 * FAQPage when the hub has its own Q&As.
 */

/*
 * `params` is awaited before any Suspense so an unknown range is a real 404 (TECH.md §2.5). All
 * three hubs are prerendered by generateStaticParams, so navigations land on a complete static
 * page; the dev-only instant-shell validation (which assumes an unlisted param) is off here.
 */
export const instant = false;

export async function generateStaticParams() {
  const slugs = await listAgeHubSlugs();
  return slugs.map((range) => ({ range }));
}

const pathOf = (slug: string) => `/age/${slug}`;
const titleOf = (hub: Pick<AgeHubData, "label">) => `بازی و وسایل مناسب کودک ${hub.label}`;
/** «نوزاد» for the first year, «کودک» after it, as in the H1s (SEO.md §1.5). */
const nounOf = (hub: Pick<AgeHubData, "maxMonths">) => (hub.maxMonths <= 12 ? "نوزاد" : "کودک");

function descriptionOf(hub: AgeHubData): string {
  const reviewed = hub.reviewer ? `؛ بازبینی‌شده توسط ${hub.reviewer.name}` : "";
  return `مهم‌ترین مهارت‌های رشد ${nounOf(hub)} ${hub.label}ه، بازی‌های پیشنهادی در خانه و ${formatNumber(hub.productCount)} وسیلهٔ چوبی مناسب این سن، همراه با چیدمان آمادهٔ اتاق${reviewed}.`;
}

/** Wikidata entities the page is about: child development, plus infant or toddler where they fit. */
function aboutOf(hub: AgeHubData) {
  const nodes = [entity("Q407784")];
  if (hub.maxMonths <= 12) nodes.push(entity("Q998"));
  else if (hub.minMonths >= 12 && hub.maxMonths <= 36) nodes.push(entity("Q1340307"));
  return nodes;
}

export async function generateMetadata({ params }: PageProps<"/age/[range]">): Promise<Metadata> {
  const { range } = await params;
  const hub = await getAgeHub(range);
  if (!hub) return {};
  return pageMetadata({ title: titleOf(hub), description: descriptionOf(hub), path: pathOf(hub.slug) });
}

export default async function AgeHubPage({ params }: PageProps<"/age/[range]">) {
  const { range } = await params;
  const hub = await getAgeHub(range);
  if (!hub) notFound();

  const { socials } = await getSettings();
  const path = pathOf(hub.slug);
  const noun = nounOf(hub);
  const trail = crumbTrail({ name: "سن به سن", path: "/age" }, { name: hub.label, path });

  // Products and guides in the order the page shows them (SEO.md §3.5.6).
  const items: ListEntry[] = hub.sections.flatMap((s) => [
    ...s.products.map((p) => ({ path: `/product/${p.slug}`, name: p.name })),
    ...s.posts.map((p) => ({ path: `/mag/${p.slug}`, name: p.title })),
  ]);
  // A person reviewer is its own node (referenced); a collective one is inlined, as on articles.
  const reviewer = hub.reviewer ? personNode(hub.reviewer, { worksFor: false }) : null;
  const reviewerId = reviewer && "@id" in reviewer ? reviewer["@id"] : undefined;
  const [page, list] = collectionNodes({
    path,
    name: titleOf(hub),
    description: descriptionOf(hub),
    breadcrumb: true,
    audience: { minMonths: hub.minMonths, maxMonths: hub.maxMonths },
    about: aboutOf(hub),
    reviewedBy: reviewer ? (reviewerId ? ref(reviewerId) : reviewer) : null,
    items,
  });
  const ld = graph(
    page,
    list,
    breadcrumbNode(trail),
    hub.faqs.length ? faqNode(hub.faqs, path) : null,
    reviewerId ? reviewer : null,
  );

  return (
    <PageTurn>
      {/* overflow-x-clip: a guard against card badges that outgrow a 2-column phone grid. */}
      <div className="mx-auto max-w-page overflow-x-clip px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={trail} />
        <AgeHubHero hub={hub} className="mt-6 lg:mt-8" />

        {hub.intro ? (
          <MilestoneBlock
            title={`${noun} ${hub.label}ه چطور رشد می‌کند؟`}
            intro={hub.intro}
            reviewer={hub.reviewer}
            sourceCount={hub.sources.length}
            className="mt-section"
          />
        ) : null}

        <div className="mt-section flex flex-col gap-section">
          {hub.sections.map((section) => (
            <AgeSection key={section.anchor} section={section} noun={noun} fallbackTint={hub.tint} />
          ))}
        </div>

        {hub.faqs.length ? (
          <section id="faq" aria-labelledby="age-faq-title" className="mt-section max-w-narrow">
            <h2 id="age-faq-title" className="font-display text-xl text-ink">
              پرسش‌های پرتکرار
            </h2>
            <FaqDrawers faqs={hub.faqs} seed={`age-faq-${hub.slug}`} className="mt-5" />
          </section>
        ) : null}

        <AskChoobz socials={socials} title="برای سنِ بچه‌ت چی بگیری؟ قبل از خرید از خودِ کارگاه بپرس" className="mt-12 max-w-narrow" />

        <HubSources sources={hub.sources} className="mt-12" />
      </div>
      <JsonLd data={ld} />
    </PageTurn>
  );
}
