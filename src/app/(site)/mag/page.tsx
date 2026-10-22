import type { Metadata } from "next";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { AgeTabs } from "@/components/mag/AgeTabs";
import { ExpertsRow } from "@/components/mag/ExpertsRow";
import { GlossaryTeaser } from "@/components/mag/GlossaryTeaser";
import { LatestList } from "@/components/mag/LatestList";
import { MAG_H1, MAG_SEO, MagHero } from "@/components/mag/MagHero";
import { PillarShelf } from "@/components/mag/PillarShelf";
import { QuestionOfDay } from "@/components/mag/QuestionOfDay";
import { TopicIndex, TopicRow } from "@/components/mag/TopicRow";
import { getMagHome, getQuestionOfDay } from "@/db/queries/mag";
import { breadcrumbNode, collectionNodes, graph, JsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /mag — «مجله چوبز» (DESIGN.md §7.1, SEO.md §1.3, §8.5): masthead and question box, the age
 * tabs, today's question, the pillar shelf, every topic hub (with rows of articles the listing
 * does not already show), page 1 of the newest-first listing, the glossary teaser and the
 * people behind it. CollectionPage + ItemList of the listed articles + BreadcrumbList.
 */

const PATH = "/mag";

export const metadata: Metadata = pageMetadata({
  title: MAG_SEO.title,
  description: MAG_SEO.description,
  path: PATH,
  suffix: false,
});

export default async function MagPage() {
  const [home, question] = await Promise.all([getMagHome(), getQuestionOfDay()]);
  const trail = crumbTrail({ name: "مجله", path: PATH });

  return (
    <PageTurn>
      {/* Framed column: each block is a band with its own rule reaching the rails. */}
      <div className="frame-col frame-pad flex flex-col pt-3 pb-band">
        <Breadcrumbs items={trail} className="mb-4" />
        <MagHero />
        <AgeTabs className="mb-8 md:mb-12" />
        <QuestionOfDay item={question} className="mb-band" />
        <div className="frame-rule-in py-band">
          <PillarShelf pillars={home.pillars} />
        </div>
        <div className="frame-rule-in py-band">
          <TopicIndex topics={home.topics} />
        </div>
        {home.topicRows.map((row) => (
          <div key={row.topic.slug} className="frame-rule-in py-band">
            <TopicRow topic={row.topic} posts={row.posts} />
          </div>
        ))}
        <div className="frame-rule-in py-band">
          <LatestList page={home.latest} />
        </div>
        <div className="frame-rule-in py-band">
          <GlossaryTeaser letters={home.letters} termCount={home.termCount} terms={home.terms} />
        </div>
        <div className="frame-rule-in pt-band">
          <ExpertsRow experts={home.experts} />
        </div>
      </div>
      <JsonLd
        data={graph(
          collectionNodes({
            path: PATH,
            name: MAG_H1,
            description: MAG_SEO.description,
            breadcrumb: true,
            items: home.latest.posts.map((post) => ({ path: `/mag/${post.slug}`, name: post.title })),
            order: "descending",
          }),
          breadcrumbNode(trail),
        )}
      />
    </PageTurn>
  );
}
