import Image from "next/image";
import Link from "next/link";
import type { MagPerson } from "@/db/queries/mag";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn, mediaUrl } from "@/lib/utils";

/*
 * The people behind the magazine (DESIGN.md §7.1): real, named authors and reviewers only.
 * Placeholder people and collective authors are filtered out by the query; while nobody
 * qualifies the row does not render at all (CONTENT-PLAN.md §4 — never invent experts).
 */

type ExpertsRowProps = {
  experts: MagPerson[];
  className?: string;
};

export function ExpertsRow({ experts, className }: ExpertsRowProps) {
  if (!experts.length) return null;
  return (
    <section aria-labelledby="mag-experts" className={cn("flex flex-col gap-6", className)}>
      <SectionHeader
        id="mag-experts"
        title="نویسنده‌ها و بازبین‌های مجله"
        link={{ label: "سیاست تحریریه ←", href: "/editorial-policy" }}
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {experts.map((person) => (
          <li key={person.slug}>
            <ExpertCard person={person} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Arch portrait: the person's photo, or their initial on a birch face. Decorative (the name is beside it). */
export function PersonPortrait({ name, avatar, size = 64 }: { name: string; avatar: MagPerson["avatar"]; size?: number }) {
  const photo = avatar?.width && avatar.height ? avatar : null;
  return (
    <span
      aria-hidden="true"
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-arch bg-wood font-display text-ink"
      style={{ inlineSize: size, blockSize: Math.round(size * 1.2), fontSize: size * 0.42 }}
    >
      {photo ? (
        <Image
          src={mediaUrl(photo.path)}
          width={photo.width!}
          height={photo.height!}
          alt=""
          sizes={`${size}px`}
          loading="lazy"
          className="size-full object-cover"
          style={photo.dominantColor ? { backgroundColor: photo.dominantColor } : undefined}
        />
      ) : (
        name.trim().charAt(0)
      )}
    </span>
  );
}

function ExpertCard({ person }: { person: MagPerson }) {
  return (
    <article className="relative flex h-full items-start gap-4 rounded-bit bg-raised p-4 shadow-ply">
      <PersonPortrait name={person.name} avatar={person.avatar} />
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-base font-bold text-ink">
          <Link href={`/team/${person.slug}`} className="after:absolute after:inset-0 after:rounded-bit after:content-['']">
            {person.name}
          </Link>
        </h3>
        <p className="text-sm text-muted">{person.jobTitle ?? person.role}</p>
        {person.credentials.length ? (
          <p className="line-clamp-2 text-xs text-muted">{person.credentials.join("، ")}</p>
        ) : null}
      </div>
    </article>
  );
}
