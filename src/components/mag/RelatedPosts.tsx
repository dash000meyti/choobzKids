import type { ArticleCardData } from "@/db/queries/cards";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { ArticleCard } from "./ArticleCard";

/*
 * Related articles (DESIGN.md §7.3 #13): three cards — same cluster first, then shared entities,
 * then an overlapping age — and the link back to the topic hub. Phones get a rail that scrolls
 * inside itself.
 */

type RelatedPostsProps = {
  posts: ArticleCardData[];
  topic: { slug: string; name: string } | null;
  className?: string;
};

export function RelatedPosts({ posts, topic, className }: RelatedPostsProps) {
  if (!posts.length) return null;
  return (
    <section aria-labelledby="related-posts" className={cn("flex flex-col gap-5", className)}>
      <SectionHeader
        id="related-posts"
        size="content"
        title="این‌ها را هم بخوانید"
        link={topic ? { label: `همهٔ مطالب ${topic.name} ←`, href: `/mag/topic/${topic.slug}` } : undefined}
      />
      <ul className="cells sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <ArticleCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
