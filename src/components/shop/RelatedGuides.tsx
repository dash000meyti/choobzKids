import type { ArticleCardData } from "@/db/queries/cards";
import { ArticleCard } from "@/components/mag/ArticleCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

/*
 * «قبل از خرید بخوانید» (DESIGN.md §6.3 block 19): up to three guides from the magazine that
 * feature this product (`post_products` reversed), the ones it leads first — the category's
 * pillar guide and two more. Each post appears once per page, so its cover morph stays unique.
 */

type RelatedGuidesProps = {
  guides: ArticleCardData[];
  className?: string;
};

export function RelatedGuides({ guides, className }: RelatedGuidesProps) {
  if (!guides.length) return null;
  return (
    <section aria-labelledby="guides-title" className={cn("flex flex-col gap-6", className)}>
      <SectionHeader
        id="guides-title"
        size="content"
        kicker="از مجله چوبز"
        kickerTone="success"
        kickerDecorative
        title="قبل از خرید بخوانید"
        link={{ label: "همهٔ راهنماها ←", href: "/mag" }}
      />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((post) => (
          <li key={post.id}>
            <ArticleCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
