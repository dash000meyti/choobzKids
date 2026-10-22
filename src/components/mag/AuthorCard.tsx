import Image from "next/image";
import type { CSSProperties } from "react";
import { IntentLink } from "@/components/ui/IntentLink";
import type { TeamMember } from "@/db/queries/team";
import { formatNumber } from "@/lib/format";
import { grainStyle } from "@/lib/grain";
import { cn, mediaUrl } from "@/lib/utils";
import styles from "./AuthorCard.module.css";

/*
 * Team cards (DESIGN.md §7.6): an arch portrait — the person's photo, or their initial carved
 * into a birch face when there is none (never a stock face) — name, role, a short bio and what
 * they have written and reviewed. The whole card links to /team/{slug}.
 */

type AuthorCardProps = {
  member: TeamMember;
  /** Heading level inside the page outline. */
  as?: "h2" | "h3";
  className?: string;
};

export function AuthorCard({ member, as: Heading = "h2", className }: AuthorCardProps) {
  const counts = [
    member.authoredCount ? `${formatNumber(member.authoredCount)} مطلب` : null,
    member.reviewedCount ? `${formatNumber(member.reviewedCount)} بازبینی` : null,
  ].filter(Boolean);
  return (
    <article className={cn("relative flex h-full gap-5 p-6 lg:p-7", styles.card, className)}>
      <AuthorPortrait name={member.name} slug={member.slug} avatar={member.avatar} size={72} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Heading className="text-lg font-bold text-ink">
          <IntentLink href={`/team/${member.slug}`} transitionTypes={["nav-forward"]} className={styles.link}>
            {member.name}
          </IntentLink>
        </Heading>
        <p className="text-sm text-muted">{member.jobTitle || member.role}</p>
        {member.bio ? <p className="mt-1 line-clamp-3 text-sm text-ink">{member.bio}</p> : null}
        {counts.length ? <p className="mt-auto pt-2 text-xs font-semibold text-muted">{counts.join(" · ")}</p> : null}
      </div>
    </article>
  );
}

type AuthorPortraitProps = {
  name: string;
  slug: string;
  avatar: TeamMember["avatar"];
  /** Width in px; the arch is 1.2× as tall. */
  size: number;
  /** The one LCP portrait on a profile page. */
  priority?: boolean;
  className?: string;
};

/** Arch portrait. Decorative: the name always stands beside it. */
export function AuthorPortrait({ name, slug, avatar, size, priority, className }: AuthorPortraitProps) {
  const photo = avatar?.width && avatar.height ? { ...avatar, width: avatar.width, height: avatar.height } : null;
  const box = { inlineSize: size, blockSize: Math.round(size * 1.2) } as CSSProperties;
  if (photo) {
    return (
      <span aria-hidden="true" className={cn("relative shrink-0 overflow-hidden rounded-arch bg-surface", className)} style={box}>
        <Image
          src={mediaUrl(photo.path)}
          width={photo.width}
          height={photo.height}
          alt=""
          sizes={`${size}px`}
          quality={75}
          {...(priority ? { fetchPriority: "high" as const, loading: "eager" as const } : { loading: "lazy" as const })}
          style={photo.dominantColor ? { backgroundColor: photo.dominantColor } : undefined}
          className="size-full object-cover"
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn("grain grid shrink-0 place-items-center rounded-arch bg-wood font-display text-ink", styles.carved, className)}
      style={{ ...box, fontSize: Math.round(size * 0.46), ...(grainStyle(`team-${slug}`) as CSSProperties) }}
    >
      {name.trim().charAt(0)}
    </span>
  );
}
