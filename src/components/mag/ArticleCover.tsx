import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { illustrationSource } from "@/components/illustrations/sizes";
import { Render } from "@/components/studio/Render";
import type { ArticleCover as CoverData } from "@/db/queries/mag";
import { cn, mediaUrl } from "@/lib/utils";

/*
 * Article cover (DESIGN.md §7.3 #4): an arch-masked figure with its caption. A cover photo when
 * one is uploaded, otherwise the manifest drawing of the product the article is about, standing
 * on a grain board (truth layer: the caption says the drawing is drawn to real dimensions).
 * It is the page's LCP candidate, so the image loads eagerly with high priority, and it is the
 * other end of the card cover's `post-{id}` morph.
 */

type ArticleCoverProps = {
  postId: number;
  slug: string;
  cover: CoverData;
  className?: string;
};

/** The cover column is the article measure (≤ 38rem), full width on phones. */
const COVER_SIZES = "(min-width: 1024px) 38rem, (min-width: 640px) calc(100vw - 4rem), 100vw";

const SOURCE_LABEL = { dxf: "طرح دقیق از روی نقشهٔ برش", measured: "طرح از روی ابعاد واقعی" } as const;

export function ArticleCover({ postId, slug, cover, className }: ArticleCoverProps) {
  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <ViewTransition name={`post-${postId}`} share="morph" default="none">
        {cover.kind === "photo" ? (
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-arch bg-surface"
            style={cover.image.dominantColor ? { backgroundColor: cover.image.dominantColor } : undefined}
          >
            <Image
              src={mediaUrl(cover.image.path)}
              width={cover.image.width}
              height={cover.image.height}
              alt={cover.image.alt}
              sizes={COVER_SIZES}
              quality={75}
              loading="eager"
              fetchPriority="high"
              className="size-full object-cover"
            />
          </div>
        ) : (
          <Drawing slug={slug} illustration={cover.illustration} name={cover.product?.name ?? null} />
        )}
      </ViewTransition>
      <Caption cover={cover} />
    </figure>
  );
}

function Drawing({ illustration, name }: { slug: string; illustration: string; name: string | null }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-surface px-[12%] pb-6 pt-8">
      <Render
        productKey={illustration}
        alt={name ? `${name}، تصویر سه‌بعدی از روی ابعاد واقعی` : ""}
        sizes={COVER_SIZES}
        priority
        box="4 / 3"
      />
    </div>
  );
}

function Caption({ cover }: { cover: CoverData }) {
  if (cover.kind === "photo") {
    if (!cover.caption && !cover.credit) return null;
    return (
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm text-muted">
        {cover.caption ? <span className="text-ink">{cover.caption}</span> : null}
        {cover.credit ? <span className="text-xs">عکس: {cover.credit}</span> : null}
      </figcaption>
    );
  }
  const source = illustrationSource(cover.illustration);
  return (
    <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm text-muted">
      {cover.product ? (
        <Link href={`/product/${cover.product.slug}`} className="link-mark text-ink">
          {cover.product.name}
        </Link>
      ) : null}
      {source ? <span className="text-xs">{SOURCE_LABEL[source]}</span> : null}
    </figcaption>
  );
}
