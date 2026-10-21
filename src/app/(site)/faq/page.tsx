import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { FaqDrawers } from "@/components/mag/AgeSection";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { Kicker } from "@/components/ui/Kicker";
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
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={TRAIL} />

        <div className="mx-auto max-w-narrow">
          <header className="mt-6 flex flex-col gap-3 lg:mt-8">
            <Kicker tone="success" doodle="sprout" decorative>
              قبل از خرید، این‌ها رو بدون
            </Kicker>
            <h1 className="text-3xl text-ink">سؤالات متداول</h1>
            <p className="text-lead text-muted">
              پاسخ کوتاه و روشن پرسش‌هایی که مامان‌ها و باباها بیشتر از همه از ما می‌پرسند: خرید، ارسال، خرید قسطی، بازگشت
              کالا و ایمنی وسایل چوبز.
            </p>
          </header>

          {/* Sticky chip index: plain anchors, so it works with no JS and keeps the URL shareable. */}
          <nav
            aria-label="بخش‌های سؤالات متداول"
            className="sticky top-header z-(--z-sticky) -mx-gutter mt-6 bg-bg px-gutter lg:top-header-lg"
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

          <div className="mt-6 flex flex-col gap-14">
            {sections.map((section, i) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="scroll-mt-[calc(var(--spacing-header)+5rem)] lg:scroll-mt-[calc(var(--spacing-header-lg)+5.5rem)]"
              >
                <h2 id={`${section.id}-title`} className="font-display text-xl text-ink">
                  {section.title}
                </h2>
                <FaqDrawers faqs={section.faqs} openFirst={i === 0} seed={`faq-${section.id}`} className="mt-5" />
                {section.more ? (
                  <p className="mt-4 text-sm">
                    <Link href={section.more.href} className="link-mark font-semibold text-ink">
                      {section.more.label} ←
                    </Link>
                  </p>
                ) : null}
              </section>
            ))}
          </div>

          <AskChoobz socials={socials} title="جواب سؤالت رو پیدا نکردی؟ از خودِ کارگاه بپرس" className="mt-14" />
        </div>
      </div>
      <JsonLd data={ld} />
    </PageTurn>
  );
}
