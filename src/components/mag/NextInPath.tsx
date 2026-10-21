import type { ArticleCardData } from "@/db/queries/cards";
import { Kicker } from "@/components/ui/Kicker";
import { cn } from "@/lib/utils";
import { ArticleCard } from "./ArticleCard";

/*
 * «قدم بعدی در این مسیر» (DESIGN.md §7.3 #13, SEO.md §4.6): the next article of the cluster's
 * reading path (pillar first, then oldest first), as one wide card that prefetches fully so its
 * cover morphs into the next article.
 */

type NextInPathProps = {
  post: ArticleCardData | null;
  className?: string;
};

export function NextInPath({ post, className }: NextInPathProps) {
  if (!post) return null;
  return (
    <section aria-labelledby="next-in-path" className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1">
        <Kicker decorative doodle="arrow-curve-rtl">
          ادامهٔ راه
        </Kicker>
        <h2 id="next-in-path" className="font-display text-xl text-ink">
          قدم بعدی در این مسیر
        </h2>
      </div>
      <ArticleCard post={post} size="lg" prefetch />
    </section>
  );
}
