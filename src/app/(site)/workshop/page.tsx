import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Render, type RenderAngle } from "@/components/studio/Render";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { LastUpdated, PageFaqs, RelatedLinks } from "@/components/mag/PolicyPage";
import { Prose } from "@/components/mag/Prose";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { Kicker } from "@/components/ui/Kicker";
import { getPage, listWorkshopLog, type WorkshopLogEntry } from "@/db/queries/pages";
import { getSettings } from "@/db/queries/settings";
import { formatJalali, formatNumber, toFaDigits } from "@/lib/format";
import { breadcrumbNode, graph, ids, JsonLd, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /workshop «کارگاه چوبز» (DESIGN.md §5.6, §8; SEO.md §8.11): the five steps from
 * settings.workshopSteps as picture cards, the page body (materials, CNC, handwork, finishing,
 * final checks), the latest workshop_log entries — each with its own date, so nothing claims to
 * be live — and the page FAQs. Video, machines and visiting hours appear once they exist ⚑;
 * a ToyStore node only if the workshop opens to visitors.
 */

const PATH = "/workshop";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("workshop");
  if (!page) return { title: "این صفحه پیدا نشد", robots: { index: false, follow: true } };
  return pageMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.excerpt ?? page.title,
    path: page.canonicalPath ?? PATH,
    modifiedTime: page.updatedAt,
    noindex: page.noindex,
  });
}

/** What each step looks like, as studio renders of the learning tower: board → cut → parts → finished → the duck. */
const STEP_PICTURES: { key: string; angle: RenderAngle; alt: string }[] = [
  { key: "learning-tower", angle: "top", alt: "برج یادگیری از بالا؛ صفحه‌های چندلای توس" },
  { key: "learning-tower", angle: "front", alt: "برج یادگیری از روبه‌رو، با برش‌های دقیق CNC" },
  { key: "learning-tower", angle: "hero-exploded", alt: "قطعه‌های برج یادگیری پیش از سرهم شدن" },
  { key: "learning-tower", angle: "hero", alt: "برج یادگیری سرهم‌شده با روکش نهایی" },
  { key: "duck-pull-toy", angle: "hero", alt: "اردک چرخ‌دار چوبی، آمادهٔ بسته‌بندی" },
];

function StepPicture({ index }: { index: number }) {
  const picture = STEP_PICTURES[index] ?? STEP_PICTURES[3];
  return (
    <div className="rounded-[1.5rem] bg-surface px-5 pb-4 pt-6">
      <Render productKey={picture.key} angle={picture.angle} alt={picture.alt} sizes="(min-width: 1024px) 240px, 45vw" box="1 / 1" />
    </div>
  );
}

function WorkshopLog({ entries }: { entries: WorkshopLogEntry[] }) {
  if (!entries.length) return null;
  return (
    <section aria-labelledby="log-title" className="mt-14">
      <h2 id="log-title" className="headline text-2xl lg:text-[2.25rem]">
        این روزها در کارگاه چه گذشت؟
      </h2>
      <ol className="mt-5 flex flex-col">
        {entries.map((entry) => (
          <li key={entry.id} className="grid gap-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
            <time dateTime={entry.createdAt} className="text-sm text-muted">
              {formatJalali(new Date(entry.createdAt))}
            </time>
            <p className="text-base text-ink">
              <span className="font-bold">{entry.stage}</span>
              {entry.count != null ? ` · ${formatNumber(entry.count)} عدد` : ""}
              {" — "}
              {entry.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function WorkshopPage() {
  const [page, settings, log] = await Promise.all([getPage("workshop"), getSettings(), listWorkshopLog(10)]);
  if (!page) notFound();

  const trail = crumbTrail({ name: page.title, path: PATH });
  const steps = settings.workshopSteps;
  const jsonLd = graph(
    webPageNode({
      path: PATH,
      name: page.seoTitle ?? page.title,
      description: page.seoDescription ?? page.excerpt,
      breadcrumb: true,
      about: { "@id": ids.organization() },
      dateModified: page.updatedAt,
    }),
    breadcrumbNode(trail),
  );

  return (
    <PageTurn>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={trail} />
        <header className="mx-auto mt-8 max-w-[48rem] text-center lg:mt-12">
          <Kicker decorative tone="success" className="mb-1">
            از ورق تا اتاقِ بچه‌ت
          </Kicker>
          <h1 className="headline text-3xl lg:text-[4.5rem]">{page.title}</h1>
          {page.excerpt ? <p className="mx-auto mt-4 max-w-prose text-lead text-muted">{page.excerpt}</p> : null}
        </header>

        {steps.length ? (
          <section aria-labelledby="steps-title" className="mt-12 lg:mt-16">
            <h2 id="steps-title" className="headline text-2xl lg:text-[3rem]">
              یک وسیلهٔ چوبز از چه قدم‌هایی می‌گذرد؟
            </h2>
            <p className="mt-2 max-w-prose text-lead text-muted">{settings.org.description}</p>
            <ol className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-5">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <StepPicture index={index} />
                  <div className="mt-4">
                    <p className="text-sm font-bold text-muted tabular-nums">{toFaDigits(String(index + 1).padStart(2, "0"))}</p>
                    <h3 className="mt-1 text-lg leading-snug font-bold text-ink">{step.title}</h3>
                    <p className="text-sm text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <div className="mx-auto mt-16 max-w-narrow lg:mt-24">
          <Prose markdown={page.body} variant="page" slug={page.slug} glossaryLinks />
          <WorkshopLog entries={log} />
          <PageFaqs faqs={page.faqs} name="faq-workshop" className="mt-14" />

          <div className="mt-14 grid gap-8 sm:grid-cols-2 sm:items-start">
            <div className="flex flex-col gap-4">
              <LastUpdated date={page.updatedAt} />
              <RelatedLinks
                links={[
                  { label: "ایمنی و مواد", href: "/safety" },
                  { label: "گارانتی و خدمات پس از فروش", href: "/warranty" },
                  { label: "داستان چوبز", href: "/about" },
                  { label: "همهٔ محصولات", href: "/shop" },
                ]}
              />
            </div>
            <AskChoobz socials={settings.socials} />
          </div>
        </div>
      </div>
    </PageTurn>
  );
}
