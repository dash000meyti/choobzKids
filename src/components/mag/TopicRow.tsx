import type { ArticleCardData } from "@/db/queries/cards";
import type { MagTopic } from "@/db/queries/mag";
import { PillChip } from "@/components/ui/PillChip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArticleCard } from "./ArticleCard";

/*
 * Topic rows (DESIGN.md §7.1): per topic, three article cards and «همه ←» to its hub. On phones
 * the cards sit on a rail that scrolls inside itself; from tablets up they form a row of three.
 * `TopicIndex` is the chip index of all nine hubs, so every hub is linked even when a cluster
 * has no row (SEO.md §8.5); on phones it is two rows of chips that scroll sideways.
 */

type TopicRowProps = {
  topic: MagTopic;
  posts: ArticleCardData[];
  className?: string;
};

export function TopicRow({ topic, posts, className }: TopicRowProps) {
  if (!posts.length) return null;
  const headingId = `topic-${topic.slug}`;
  return (
    <section aria-labelledby={headingId} className={cn("flex flex-col gap-5", className)}>
      <SectionHeader
        id={headingId}
        as="h3"
        size="content"
        kicker={topic.tagline}
        title={topic.name}
        link={{ label: "همه ←", href: `/mag/topic/${topic.slug}` }}
      />
      <ul className="no-scrollbar -mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto px-gutter pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id} className="w-[82%] shrink-0 snap-start sm:w-auto">
            <ArticleCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}

type TopicIndexProps = {
  topics: MagTopic[];
  className?: string;
};

export function TopicIndex({ topics, className }: TopicIndexProps) {
  if (!topics.length) return null;
  return (
    <nav aria-labelledby="topic-index" className={cn("flex flex-col gap-4", className)}>
      <h2 id="topic-index" className="font-display text-2xl text-ink">
        موضوع‌های مجله
      </h2>
      <ul className="no-scrollbar -mx-gutter grid auto-cols-max grid-flow-col grid-rows-2 gap-2.5 overflow-x-auto px-gutter pt-1 pb-2 lg:mx-0 lg:flex lg:flex-wrap lg:overflow-visible lg:px-0">
        {topics.map((topic) => (
          <li key={topic.slug} className="shrink-0">
            <PillChip href={`/mag/topic/${topic.slug}`}>
              {topic.name}
              {topic.postCount ? (
                <>
                  <span aria-hidden="true" className="ms-1.5 text-xs font-normal text-muted">
                    ({toFaDigits(topic.postCount)})
                  </span>
                  <span className="sr-only">، {toFaDigits(topic.postCount)} مقاله</span>
                </>
              ) : null}
            </PillChip>
          </li>
        ))}
      </ul>
    </nav>
  );
}
