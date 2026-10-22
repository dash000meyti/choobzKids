import Link from "@/components/ui/Link";
import type { MagPage } from "@/db/queries/mag";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArticleCard } from "./ArticleCard";

/*
 * The newest-first listing (DESIGN.md §7.1, SEO.md §1.8): twelve cards per page and plain
 * <a href> links to the previous, next and numbered pages — page 1 is /mag itself, the rest
 * /mag/page/{n}. The first four cards prefetch fully so their cover morph pairs.
 */

const PREFETCH_FIRST = 4;

export function magPageHref(page: number): string {
  return page <= 1 ? "/mag" : `/mag/page/${page}`;
}

type LatestListProps = {
  page: MagPage;
  /** The section heading; pages whose H1 already names the list pass `null`. */
  title?: string | null;
  className?: string;
};

export function LatestList({ page, title = "تازه‌ترین مطالب", className }: LatestListProps) {
  if (!page.posts.length) return null;
  return (
    <section
      aria-labelledby={title ? "latest-posts" : undefined}
      aria-label={title ? undefined : "مطالب این صفحه"}
      className={cn("flex flex-col gap-6", className)}
    >
      {title ? <SectionHeader id="latest-posts" kicker="تازه نوشتیم" title={title} /> : null}
      <ul className="cells sm:grid-cols-2 lg:grid-cols-3">
        {page.posts.map((post, index) => (
          <li key={post.id}>
            <ArticleCard post={post} prefetch={index < PREFETCH_FIRST} />
          </li>
        ))}
      </ul>
      <Pagination page={page.page} totalPages={page.totalPages} />
    </section>
  );
}

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages < 2) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const step = "inline-flex min-h-11 items-center gap-1.5 rounded-bit-xs px-2 text-sm font-semibold text-ink";
  return (
    <nav aria-label="صفحه‌های مجله" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4">
      {page > 1 ? (
        <Link href={magPageHref(page - 1)} transitionTypes={["nav-back"]} className={step}>
          <Icon name="arrow-start" className="size-4" />
          <span className="link-mark">صفحهٔ قبل</span>
        </Link>
      ) : (
        <span />
      )}
      <ol className="flex flex-wrap items-center gap-1.5">
        {pages.map((n) => (
          <li key={n}>
            {n === page ? (
              <span
                aria-current="page"
                className="grid size-11 place-items-center rounded-bead bg-success text-sm font-bold text-on-accent shadow-ply-pressed"
              >
                {toFaDigits(n)}
              </span>
            ) : (
              <Link
                href={magPageHref(n)}
                transitionTypes={[n < page ? "nav-back" : "nav-forward"]}
                aria-label={`صفحهٔ ${toFaDigits(n)}`}
                className="grid size-11 place-items-center rounded-bead bg-wood text-sm font-semibold text-ink shadow-ply active:translate-y-0.5 active:shadow-ply-pressed"
              >
                {toFaDigits(n)}
              </Link>
            )}
          </li>
        ))}
      </ol>
      {page < totalPages ? (
        <Link href={magPageHref(page + 1)} transitionTypes={["nav-forward"]} className={step}>
          <span className="link-mark">صفحهٔ بعد</span>
          <Icon name="arrow-end" className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
