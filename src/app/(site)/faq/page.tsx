import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { FaqDrawers } from "@/components/mag/AgeSection";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { PillChip } from "@/components/ui/PillChip";
import { getFaqPage } from "@/db/queries/faq";
import { getSettings } from "@/db/queries/settings";
import { breadcrumbNode, faqNode, graph, JsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /faq «سؤالات متداول» (DESIGN.md §8, SEO.md §1.6, §3.5.8, §8.10): five anchored sections
 * (#buying #shipping #installments #returns #safety) behind a sticky chip index, each a set of
 * cabinet-drawer <details> with the first question open and every answer in the server HTML.
 * The page node itself is the FAQPage, its Q&As verbatim from the drawers.
 */

const PATH = "/faq";
const TITLE = "سؤالات متداول خرید، ارسال و اقساط";
const DESCRIPTION =
  "پاسخ پرسش‌های پرتکرار دربارهٔ خرید از چوبز کیدز، زمان و هزینهٔ ارسال، خرید ۴ قسطی با اسنپ‌پی، بازگشت کالا و ایمنی و نگهداری وسایل چوبی کودک.";
const TRAIL = crumbTrail({ name: "سؤالات متداول", path: PATH });

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

export default async function FaqPage() {
  const [{ sections }, { socials }] = await Promise.all([getFaqPage(), getSettings()]);

  const ld = graph(
    faqNode(
      sections.flatMap((s) => s.faqs),
      PATH,
      { asPage: { name: TITLE, description: DESCRIPTION, breadcrumb: true } },
    ),
    breadcrumbNode(TRAIL),
  );

  return (
    <PageTurn>
      <div className="frame-col frame-pad pt-6 pb-band lg:pt-10">
        <Breadcrumbs items={TRAIL} />

        <header className="page-head mt-6 pb-10 lg:mt-8 lg:pb-14">
          <div className="flex flex-col gap-3">
            <p className="eyebrow">قبل از خرید، این‌ها رو بدون</p>
            <h1 className="headline text-3xl lg:text-[3.5rem]">سؤالات متداول</h1>
          </div>
          <p className="text-lead text-muted">
            پاسخ کوتاه و روشن پرسش‌هایی که مامان‌ها و باباها بیشتر از همه از ما می‌پرسند: خرید، ارسال، خرید قسطی، بازگشت
            کالا و ایمنی وسایل چوبز.
          </p>
        </header>

        {/* Frame system: a rule, then a framed sticky index beside the questions (wide screens). */}
        <div className="frame-rule-in pt-10 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 lg:pt-14">
          <nav aria-label="بخش‌های سؤالات متداول" className="hidden lg:block">
            <div className="frame-box sticky top-[calc(var(--spacing-header-lg)+1.5rem)] p-5">
              <p className="mb-3 text-sm font-bold text-muted">بخش‌ها</p>
              <ul className="flex flex-col">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="flex min-h-10 items-center text-sm text-ink hover:text-link">
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="min-w-0">
            {/* Phones: sticky chip index; plain anchors, so it works with no JS and keeps the URL shareable. */}
            <nav
              aria-label="بخش‌های سؤالات متداول"
              className="sticky top-header z-(--z-sticky) -mx-gutter bg-bg px-gutter lg:hidden"
            >
              <ul className="no-scrollbar flex gap-2 overflow-x-auto pt-2.5 pb-3.5">
                {sections.map((section) => (
                  <li key={section.id} className="shrink-0">
                    <PillChip href={`#${section.id}`} prefetch={false}>
                      {section.label}
                    </PillChip>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 flex max-w-[52rem] flex-col lg:mt-0">
              {sections.map((section, i) => (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-title`}
                  className={`scroll-mt-[calc(var(--spacing-header)+5rem)] lg:scroll-mt-[calc(var(--spacing-header-lg)+2rem)] ${i ? "rule-dash mt-12 pt-12" : ""}`}
                >
                  <h2 id={`${section.id}-title`} className="headline text-2xl lg:text-[2rem]">
                    {section.title}
                  </h2>
                  <FaqDrawers faqs={section.faqs} openFirst={i === 0} seed={`faq-${section.id}`} className="mt-5" />
                  {section.more ? (
                    <p className="mt-4 text-sm">
                      <Link href={section.more.href} className="link-arrow">
                        {section.more.label}
                      </Link>
                    </p>
                  ) : null}
                </section>
              ))}
            </div>

            <AskChoobz socials={socials} title="جواب سؤالت رو پیدا نکردی؟ از خودِ کارگاه بپرس" className="mt-14 max-w-[52rem]" />
          </div>
        </div>
      </div>
      <JsonLd data={ld} />
    </PageTurn>
  );
}
