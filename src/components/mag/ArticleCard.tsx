import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type CSSProperties, type ReactNode } from "react";
import { illustrationSize } from "@/components/illustrations/sizes";
import type { ArticleCardData, PostFormat } from "@/db/queries/cards";
import { AgeBadge } from "@/components/ui/AgeBadge";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IntentLink } from "@/components/ui/IntentLink";
import { StampBadge } from "@/components/ui/StampBadge";
import { grainStyle } from "@/lib/grain";
import { toFaDigits } from "@/lib/format";
import { cn, illustrationUrl, mediaUrl } from "@/lib/utils";
import styles from "./ArticleCard.module.css";

/*
 * ArticleCard (DESIGN.md §4.11). A raised paper card: an arch-masked cover (the cover photo, or
 * the post's manifest drawing standing on a grain board), the format's stationery as a corner
 * device plus a format chip, the question-form title as a stretched link, a 2-line excerpt and
 * a meta row «topic · age · ۷ دقیقه». The cover morphs into the article cover (`post-{id}`).
 *
 * Stationery: guide = kraft notebook with an elastic band · article = ruled paper ·
 * howto = blueprint grid · comparison = graph paper · checklist = pencil-ticked boxes ·
 * story = photo-album corners. All CSS, no images.
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
      className={cn("@container relative h-full overflow-hidden rounded-bit", styles.card, className)}
      data-format={post.format}
    >
      <div className={cn("flex h-full flex-col", large && "@xl:grid @xl:grid-cols-2")}>
        <div className="relative p-3 pb-0 @xl:pb-3">
          <Cover post={post} sizes={COVER_SIZES[size]} />
          {post.isPillar ? (
            <StampBadge tone="success" className="absolute start-5 top-5">
              راهنمای کامل
            </StampBadge>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-4 pt-3 pb-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Icon name={format.icon} className="size-4" />
            {format.label}
          </p>
          <h3 className={cn("font-bold text-ink", large ? "text-xl" : "text-lg", "line-clamp-3")}>
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
      <Stationery format={post.format} />
    </article>
  );
}

function Cover({ post, sizes }: { post: ArticleCardData; sizes: string }) {
  const photo = post.cover?.width && post.cover.height ? { ...post.cover, width: post.cover.width, height: post.cover.height } : null;
  return (
    <ViewTransition name={`post-${post.id}`} share="morph" default="none">
      <div
        className={cn("relative isolate aspect-[4/3] overflow-hidden rounded-arch bg-surface", !photo && "grain")}
        style={photo ? undefined : (grainStyle(post.slug) as CSSProperties)}
      >
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
        ) : post.illustration ? (
          <>
            <span aria-hidden="true" className="contact-shadow absolute inset-x-[24%] bottom-[5%] h-[8%] rounded-[50%]" />
            <CoverDrawing illustration={post.illustration} />
          </>
        ) : null}
      </div>
    </ViewTransition>
  );
}

function CoverDrawing({ illustration }: { illustration: string }) {
  const { width, height } = illustrationSize(illustration, "assembled");
  return (
    <span className="absolute inset-x-[18%] top-[12%] bottom-[8%]">
      {/* The title says what the article is about; the drawing is decoration here. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
      <img
        src={illustrationUrl(illustration, "assembled")}
        width={width}
        height={height}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-full object-contain object-bottom"
      />
    </span>
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

/** The corner device for the post's format (decorative). */
function Stationery({ format }: { format: PostFormat }) {
  return (
    <span aria-hidden="true" className={cn(styles.stationery, styles[format])}>
      <span className={styles.corner}>
        {format === "checklist" ? (
          <>
            <span className={styles.tick}>
              <Icon name="check" />
            </span>
            <span className={styles.tick}>
              <Icon name="check" />
            </span>
          </>
        ) : null}
      </span>
      {format === "guide" ? <span className={styles.band} /> : null}
      {format === "story" ? <span className={styles.cornerOpposite} /> : null}
    </span>
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
