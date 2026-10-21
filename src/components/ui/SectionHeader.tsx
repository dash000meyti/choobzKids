import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { DoodleName } from "./Doodle";
import { Kicker } from "./Kicker";

/*
 * Section header (DESIGN.md §4.12): kicker (story voice) · plain keyword title · optional sub ·
 * optional quiet link at inline-end («همه ←»). Aligned to start; centre only for TheEnd.
 */

type SectionHeaderProps = {
  title: ReactNode;
  /** Becomes the heading's id, for `aria-labelledby` on the section. */
  id?: string;
  as?: "h1" | "h2" | "h3";
  /** `home` = Ario text-2xl (home, hubs); `content` = text-xl (content pages). */
  size?: "home" | "content";
  kicker?: ReactNode;
  kickerTone?: "accent" | "success" | "muted";
  kickerDoodle?: DoodleName;
  /** Hide a purely decorative kicker (e.g. «فصل یکم · بازی») from assistive tech. */
  kickerDecorative?: boolean;
  /** Chapter titles only: Ario swash (ss02) on the title. */
  swash?: boolean;
  /** Painted face + raw ply edge. ≥ 40px and once per viewport. */
  plyType?: boolean;
  sub?: ReactNode;
  link?: { label: string; href: string; prefetch?: boolean };
  align?: "start" | "center";
  className?: string;
};

const TITLE_SIZE = { home: "text-2xl lg:text-[2.75rem]", content: "text-2xl lg:text-[2.25rem]" } as const;

export function SectionHeader({
  title,
  id,
  as: Heading = "h2",
  size = "home",
  kicker,
  kickerTone = "accent",
  kickerDoodle,
  kickerDecorative,
  swash,
  plyType,
  sub,
  link,
  align = "start",
  className,
}: SectionHeaderProps) {
  const centered = align === "center";
  return (
    <header
      className={cn(
        "flex gap-x-6 gap-y-3",
        centered ? "flex-col items-center text-center" : "flex-wrap items-end justify-between",
        className,
      )}
    >
      <div className={cn("flex min-w-0 flex-col gap-2", centered ? "items-center" : "flex-1 basis-80")}>
        {kicker ? (
          <Kicker tone={kickerTone} doodle={kickerDoodle} decorative={kickerDecorative}>
            {kicker}
          </Kicker>
        ) : null}
        <Heading
          id={id}
          className={cn(
            "headline",
            // Ply type paints its own face colour and needs ≥ 40px to read as a cut edge.
            plyType ? "ply-type text-[length:max(2.5rem,var(--text-3xl))] leading-[1.3]" : cn("text-ink", TITLE_SIZE[size]),
            swash && "swash",
          )}
        >
          {title}
        </Heading>
        {sub ? <p className={cn("max-w-prose text-lead text-muted", centered && "mx-auto")}>{sub}</p> : null}
      </div>
      {link ? (
        <Link href={link.href} prefetch={link.prefetch} className="link-arrow text-sm">
          {link.label}
        </Link>
      ) : null}
    </header>
  );
}
