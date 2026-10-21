import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { Kicker } from "@/components/ui/Kicker";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { getReviewsWall, type ReviewNote } from "@/db/queries/pages";
import { getSettings } from "@/db/queries/settings";
import { breadcrumbNode, graph, JsonLd, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";
import { fnv1a } from "@/lib/utils";
import styles from "./reviews.module.css";

/*
 * /reviews «رضایت شما» (DESIGN.md §8, SEO.md §1.2, §3.5.10): a sticky-note wall of approved
 * testimonials in the families' own words. Brand testimonials are self-serving, so the page
 * carries WebPage markup only, never Review or AggregateRating. Seed samples appear only outside
 * production, each tagged «نمونه» (getReviewsWall enforces both rules).
 */

const PATH = "/reviews";
const TITLE = "رضایت شما";
const SEO_TITLE = "رضایت شما؛ تجربهٔ خانواده‌ها از وسایل چوبز";
const DESCRIPTION =
  "یادداشت‌های مامان‌ها و باباها دربارهٔ برج یادگیری، مثلث پیکلر و دیگر وسایل چوبی چوبز؛ از رسیدن بسته تا بازی هر روز بچه‌ها در خانه.";

export const metadata: Metadata = pageMetadata({ title: SEO_TITLE, description: DESCRIPTION, path: PATH });

const PAPERS = ["raised", "kraft", "mint", "mustard"] as const;

/** Stable per note: the same tilt and paper on every build. */
function noteLook(id: number) {
  const seed = fnv1a(`review-${id}`);
  const tilt = ((seed % 7) - 3) * 0.6;
  return { paper: PAPERS[(seed >>> 3) % PAPERS.length], style: { "--tilt": `${tilt.toFixed(1)}deg` } as CSSProperties };
}

function Note({ review }: { review: ReviewNote }) {
  const look = noteLook(review.id);
  const signature = [review.authorName, review.city].filter(Boolean).join(" · ");
  return (
    <figure className={styles.note} data-paper={look.paper} style={look.style}>
      {review.isSample ? <SampleBadge className={styles.sample} /> : null}
      {review.title ? <p className="pe-12 text-sm leading-snug font-bold text-ink">{review.title}</p> : null}
      <blockquote className="font-accent text-lead text-ink">{review.body}</blockquote>
      <figcaption className="flex flex-col gap-0.5 border-t border-line pt-2 text-sm text-ink">
        <span className="font-semibold">{signature}</span>
        {review.childAge || review.product ? (
          <span className="text-xs text-muted">
            {review.childAge ? `کودک ${review.childAge}` : null}
            {review.childAge && review.product ? " · " : null}
            {review.product ? (
              <>
                با{" "}
                <Link href={`/product/${review.product.slug}`} className="link-mark text-ink">
                  {review.product.name}
                </Link>
              </>
            ) : null}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}

export default async function ReviewsPage() {
  const [reviews, settings] = await Promise.all([getReviewsWall(), getSettings()]);
  const trail = crumbTrail({ name: TITLE, path: PATH });
  const hasSamples = reviews.some((review) => review.isSample);
  const jsonLd = graph(
    webPageNode({ path: PATH, name: SEO_TITLE, description: DESCRIPTION, breadcrumb: true }),
    breadcrumbNode(trail),
  );

  return (
    <PageTurn>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={trail} />
        <header className="mt-6 max-w-narrow lg:mt-10">
          <Kicker decorative tone="success" doodle="heart" className="mb-1">
            از خونه‌های شما
          </Kicker>
          <h1 className="text-3xl text-ink">{TITLE}</h1>
          <p className="mt-4 max-w-prose text-lead text-muted">
            {reviews.length
              ? "یادداشت‌هایی که مامان‌ها و باباها بعد از رسیدن وسایل چوبز برامون فرستادن؛ با اجازهٔ خودشون، همون‌طور که نوشتن."
              : "هنوز یادداشتی روی این دیوار نچسبوندیم. اولین یادداشت می‌تونه مال شما باشه."}
          </p>
          {hasSamples ? (
            <p className="mt-4 flex items-center gap-3 text-sm text-muted">
              <SampleBadge />
              این یادداشت‌ها نمونه‌اند و فقط در نسخهٔ آزمایشی سایت دیده می‌شوند.
            </p>
          ) : null}
        </header>

        {reviews.length ? (
          <ul className={`${styles.wall} mt-10`}>
            {reviews.map((review) => (
              <li key={review.id} className={styles.item}>
                <Note review={review} />
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mx-auto mt-14 grid max-w-narrow gap-8">
          <AskChoobz
            socials={settings.socials}
            title="تجربه‌تون از وسایل چوبز رو برامون بنویسید؛ با اجازهٔ خودتون این‌جا می‌ذاریمش."
          />
          <nav aria-label="بیشتر از خانواده‌ها" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/gallery" className="link-mark text-base font-semibold text-ink">
              عکس‌های شما ←
            </Link>
            <Link href="/shop" className="link-mark text-base font-semibold text-ink">
              همهٔ محصولات ←
            </Link>
          </nav>
        </div>
      </div>
    </PageTurn>
  );
}
