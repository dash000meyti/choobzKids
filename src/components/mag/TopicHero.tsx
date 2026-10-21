import Link from "next/link";
import { illustrationSize } from "@/components/illustrations/sizes";
import type { ArticleCardData } from "@/db/queries/cards";
import { Icon } from "@/components/ui/Icon";
import { StampBadge } from "@/components/ui/StampBadge";
import { ACCENT_TINT, isAccentKey } from "@/components/ui/tints";
import { toFaDigits } from "@/lib/format";
import { cn, illustrationUrl } from "@/lib/utils";

/*
 * Topic hub hero (DESIGN.md §7.2, SEO.md §1.3): the topic's accent as a soft band holding the H1
 * (topics.name), its tagline and — above the fold — the link to the cluster's pillar guide,
 * which links back. The topic drawing stands at the band's inline-end on wide screens.
 */

type TopicHeroProps = {
  name: string;
  tagline: string | null;
  accent: string | null;
  illustration: string | null;
  postCount: number;
  pillar: ArticleCardData | null;
  className?: string;
};

export function TopicHero({ name, tagline, accent, illustration, postCount, pillar, className }: TopicHeroProps) {
  const tint = isAccentKey(accent) ? ACCENT_TINT[accent] : ACCENT_TINT.wood;
  return (
    <header className={cn("relative isolate overflow-hidden rounded-bit-xl px-5 py-7 sm:px-8 sm:py-9 lg:px-12", tint, className)}>
      {illustration ? <TopicDrawing illustration={illustration} /> : null}
      <div className="flex max-w-narrow flex-col gap-3">
        <p className="text-sm font-semibold opacity-80">
          موضوع مجله{postCount ? ` · ${toFaDigits(postCount)} مقاله` : null}
        </p>
        <h1 className="font-display text-3xl text-balance">{name}</h1>
        {tagline ? <p className="max-w-prose font-accent text-lead">{tagline}</p> : null}
        {pillar ? (
          <Link
            href={`/mag/${pillar.slug}`}
            prefetch
            transitionTypes={["nav-forward"]}
            className="group mt-3 flex max-w-prose items-center gap-3 rounded-bit bg-raised p-4 text-ink shadow-ply transition-[translate,box-shadow] duration-(--dur-quick) ease-wood active:translate-y-0.5 active:shadow-ply-pressed sm:p-5"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <StampBadge tone="success" className="self-start">
                راهنمای کامل
              </StampBadge>
              <span className="text-base font-bold text-balance sm:text-lg">{pillar.title}</span>
              <span className="text-xs text-muted">{toFaDigits(pillar.readingMinutes)} دقیقه مطالعه · از اینجا شروع کنید</span>
            </span>
            <Icon name="arrow-end" className="size-6 shrink-0 text-accent" />
          </Link>
        ) : null}
      </div>
    </header>
  );
}

function TopicDrawing({ illustration }: { illustration: string }) {
  const { width, height } = illustrationSize(illustration, "assembled");
  return (
    <span aria-hidden="true" className="pointer-events-none absolute end-6 bottom-0 -z-10 hidden h-[78%] w-[30%] max-w-80 lg:block">
      {/* eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3) */}
      <img
        src={illustrationUrl(illustration, "assembled")}
        width={width}
        height={height}
        alt=""
        decoding="async"
        className="size-full object-contain object-bottom opacity-90"
      />
    </span>
  );
}
