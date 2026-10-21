import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";
import type { ArticleCardData, PostFormat } from "@/db/queries/cards";
import { hasRender, Render } from "@/components/studio/Render";
import { AgeBadge } from "@/components/ui/AgeBadge";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IntentLink } from "@/components/ui/IntentLink";
import { toFaDigits } from "@/lib/format";
import { cn, mediaUrl } from "@/lib/utils";
import styles from "./ArticleCard.module.css";

/*
 * ArticleCard (Studio): a grey tile with the cover (the cover photo, or the studio render of the
 * post's product), the format line (plus «راهنمای کامل» for pillars), the question-form title as
 * a stretched link, a 2-line excerpt and a meta row «topic · age · ۷ دقیقه». The cover morphs
 * into the article cover (`post-{id}`).
 */

type ArticleCardProps = {
  post: ArticleCardData;
  /** `lg`: featured slot — cover beside the text once the card is wide enough, larger title. */
  size?: "md" | "lg";
  /** Full prefetch so the cover morph pairs (first cards of a list); otherwise on intent. */
  prefetch?: boolean;
  className?: string;
};

export const FORMAT_LABEL: Record<PostFormat, { label: string; icon: IconName }> = {
  guide: { label: "راهنما", icon: "book" },
  article: { label: "مقاله", icon: "notebook" },
  howto: { label: "آموزش گام‌به‌گام", icon: "ruler" },
  comparison: { label: "مقایسه", icon: "sort" },
  checklist: { label: "چک‌لیست", icon: "check" },
  story: { label: "روایت", icon: "heart" },
};

const COVER_SIZES = {
  md: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  lg: "(min-width: 1024px) 33vw, 100vw",
} as const;

export function ArticleCard({ post, size = "md", prefetch, className }: ArticleCardProps) {
  const large = size === "lg";
  const format = FORMAT_LABEL[post.format];
  return (
    <article
      className={cn("@container relative h-full overflow-hidden rounded-[1.75rem] bg-surface", styles.card, className)}
      data-format={post.format}
    >
      <div className={cn("flex h-full flex-col", large && "@xl:grid @xl:grid-cols-2")}>
        <div className="relative">
          <Cover post={post} sizes={COVER_SIZES[size]} />
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-6 pt-2 pb-6 @xl:pt-6">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
            {post.isPillar ? <span className="text-eyebrow">راهنمای کامل ·</span> : null}
            {format.label}
          </p>
          <h3 className={cn("leading-snug font-extrabold text-ink", large ? "text-2xl" : "text-lg", "line-clamp-3")}>
            <CardLink href={`/mag/${post.slug}`} prefetch={prefetch} className={styles.link}>
              {post.title}
            </CardLink>
          </h3>
          {post.excerpt ? (
            <p className={cn("text-sm text-muted", large ? "line-clamp-3" : "line-clamp-2")}>{post.excerpt}</p>
          ) : null}
          <Meta post={post} />
        </div>
      </div>
    </article>
  );
}

function Cover({ post, sizes }: { post: ArticleCardData; sizes: string }) {
  const photo = post.cover?.width && post.cover.height ? { ...post.cover, width: post.cover.width, height: post.cover.height } : null;
  const render = !photo && post.illustration && hasRender(post.illustration) ? post.illustration : null;
  return (
    <ViewTransition name={`post-${post.id}`} share="morph" default="none">
      <div className={cn("relative overflow-hidden", render ? "px-[14%] pt-[8%] pb-[2%]" : "aspect-[4/3]")}>
        {photo ? (
          <Image
            src={mediaUrl(photo.path)}
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            sizes={sizes}
            quality={75}
            loading="lazy"
            style={photo.dominantColor ? { backgroundColor: photo.dominantColor } : undefined}
            className="size-full object-cover"
          />
        ) : render ? (
          // The title says what the article is about; the render is decoration here.
          <Render productKey={render} alt="" sizes={sizes} box="16 / 11" className={styles.render} />
        ) : null}
      </div>
    </ViewTransition>
  );
}

function Meta({ post }: { post: ArticleCardData }) {
  const dot = (
    <span aria-hidden="true" className="text-line-strong">
      ·
    </span>
  );
  return (
    <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs text-muted">
      {post.topic ? (
        <>
          <span>{post.topic.name}</span>
          {dot}
        </>
      ) : null}
      {post.ageMinMonths != null || post.ageMaxMonths != null ? (
        <>
          <AgeBadge min={post.ageMinMonths} max={post.ageMaxMonths} />
          {dot}
        </>
      ) : null}
      <span className="inline-flex items-center gap-1">
        <Icon name="clock" className="size-3.5" />
        <span className="sr-only">زمان مطالعه:</span>
        {toFaDigits(post.readingMinutes)} دقیقه
      </span>
    </p>
  );
}

function CardLink({
  href,
  prefetch,
  className,
  children,
}: {
  href: string;
  prefetch?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (prefetch) {
    return (
      <Link href={href} prefetch transitionTypes={["nav-forward"]} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <IntentLink href={href} transitionTypes={["nav-forward"]} className={className}>
      {children}
    </IntentLink>
  );
}
