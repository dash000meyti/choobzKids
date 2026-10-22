import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { getReviewsWall, type ReviewNote } from "@/db/queries/pages";
import { getSettings } from "@/db/queries/settings";
import { breadcrumbNode, graph, JsonLd, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";
import styles from "./reviews.module.css";

/*
 * /reviews «رضایت شما» (DESIGN.md §8, SEO.md §1.2, §3.5.10): a wall of approved
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

function Note({ review }: { review: ReviewNote }) {
  const signature = [review.authorName, review.city].filter(Boolean).join(" · ");
  return (
    <figure className={styles.note}>
      {review.isSample ? <SampleBadge className={styles.sample} /> : null}
      {review.title ? <p className="pe-14 text-base leading-snug font-bold text-ink">{review.title}</p> : null}
      <blockquote className="text-lead leading-relaxed text-ink">«{review.body}»</blockquote>
      <figcaption className="flex flex-col gap-0.5 pt-1 text-sm text-ink">
        <span className="font-semibold">{signature}</span>
        {review.childAge || review.product ? (
          <span className="text-xs text-muted">
            {review.childAge ? `کودک ${review.childAge}` : null}
            {review.childAge && review.product ? " · " : null}
            {review.product ? (
              <>
                با{" "}
                <Link href={`/product/${review.product.slug}`} className="text-link hover:underline">
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
        <header className="mx-auto mt-8 flex max-w-2xl flex-col items-center text-center lg:mt-12">
          <p className="eyebrow">از خونه‌های شما</p>
          <h1 className="headline mt-1 text-3xl lg:text-[4rem]">{TITLE}</h1>
          <p className="mt-3 text-lead text-muted">
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
            <Link href="/gallery" className="link-arrow text-base">
              عکس‌های شما
            </Link>
            <Link href="/shop" className="link-arrow text-base">
              همهٔ محصولات
            </Link>
          </nav>
        </div>
      </div>
    </PageTurn>
  );
}
