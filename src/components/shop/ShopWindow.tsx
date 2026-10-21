import { ViewTransition, type ReactNode } from "react";
import { illustrationSize } from "@/components/illustrations/sizes";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Kicker";
import type { AgeRangeMonths } from "@/db/queries/shop";
import { formatAgeRange, toFaDigits } from "@/lib/format";
import { cn, illustrationUrl } from "@/lib/utils";
import styles from "./ShopWindow.module.css";

/*
 * «ویترین» (DESIGN.md §6.1–§6.2): the header of /shop and of every category page. The
 * breadcrumb, a decorative kicker over the plain keyword H1 (the page's LCP, never animated),
 * the lead, «۱۴ محصول · برای ۶ ماه تا ۶ سال», and the intro — beside an arched kahgel shop
 * window recessed into the wall. On a category page the window holds the category's drawing,
 * which morphs from the cubby the visitor tapped (`category-{slug}`); on /shop a few of the
 * shelves' drawings stand together on its sill.
 * Text sits flat on the paper (law 2: the recess is a container, not a reading surface).
 */

type Display =
  | { kind: "category"; slug: string; illustration: string | null }
  | { kind: "shelf"; illustrations: string[] };

type ShopWindowProps = {
  trail: readonly BreadcrumbItem[];
  title: string;
  kicker?: string;
  lead?: string | null;
  count: number;
  ageRange: AgeRangeMonths;
  display: Display;
  /** The intro (Prose); a category page puts its «بیشتر بخوانید» details here too. */
  children?: ReactNode;
};

export function ShopWindow({ trail, title, kicker, lead, count, ageRange, display, children }: ShopWindowProps) {
  const ages = formatAgeRange(ageRange.min, ageRange.max);
  return (
    <header className={styles.window}>
      <Breadcrumbs items={trail} className={styles.crumbs} />

      <div className={cn(styles.text, "flex flex-col gap-2 lg:gap-3")}>
        {kicker ? (
          <Kicker decorative className="text-base lg:text-lead">
            {kicker}
          </Kicker>
        ) : null}
        <h1 className="text-3xl text-ink">{title}</h1>
        {lead ? <p className="max-w-prose text-base text-muted lg:text-lead">{lead}</p> : null}
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-semibold text-ink">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="shelf" className="size-4.5 text-muted" />
            <span>
              <data value={count}>{toFaDigits(count)}</data> محصول
            </span>
          </span>
          {ages ? (
            <>
              {/* Muted and spaced: a bare «·» beside Persian digits reads as a zero. */}
              <span aria-hidden="true" className="font-normal text-line-strong">
                ·
              </span>
              <span>برای {ages}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className={styles.niche} aria-hidden="true">
        <span className="contact-shadow absolute inset-x-[16%] bottom-[7px] h-[7%] rounded-[50%]" />
        {display.kind === "category" ? <CategoryDrawing {...display} /> : <Sill illustrations={display.illustrations} />}
        <span className="ply-band absolute inset-x-0 bottom-0 h-[6px]" />
      </div>

      {children ? <div className={styles.intro}>{children}</div> : null}
    </header>
  );
}

function Drawing({ illustration, className }: { illustration: string; className?: string }) {
  const { width, height } = illustrationSize(illustration, "assembled");
  return (
    // Decorative: the H1 says what the window holds. Above the fold, so not lazy.
    // eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3)
    <img
      src={illustrationUrl(illustration, "assembled")}
      width={width}
      height={height}
      alt=""
      decoding="async"
      className={cn("h-auto max-h-full w-full object-contain object-bottom", className)}
    />
  );
}

function CategoryDrawing({ slug, illustration }: { slug: string; illustration: string | null }) {
  if (!illustration) return null;
  return (
    <ViewTransition name={`category-${slug}`} share="morph" default="none">
      <span className={styles.single}>
        <Drawing illustration={illustration} />
      </span>
    </ViewTransition>
  );
}

/** Up to three drawings side by side on the sill, the middle one in front. */
function Sill({ illustrations }: { illustrations: string[] }) {
  const shown = illustrations.slice(0, 3);
  return (
    <span className={styles.sill}>
      {shown.map((illustration, i) => (
        <span key={illustration} className={cn(styles.piece, i === 1 && styles.front)}>
          <Drawing illustration={illustration} />
        </span>
      ))}
    </span>
  );
}
