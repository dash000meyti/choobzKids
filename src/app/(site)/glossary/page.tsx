import type { Metadata } from "next";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { AlphabetRail } from "@/components/mag/AlphabetRail";
import { GlossaryIndex } from "@/components/mag/GlossaryIndex";
import { Kicker } from "@/components/ui/Kicker";
import { getGlossaryIndex } from "@/db/queries/glossary";
import { formatNumber } from "@/lib/format";
import { breadcrumbNode, definedTermSetNode, graph, ids, JsonLd, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /glossary (DESIGN.md §7.4, SEO.md §1.6, §3.5.7, §8.9): every term under its Persian initial,
 * with a sticky alphabet rail. JSON-LD: CollectionPage → DefinedTermSet (hasDefinedTerm = every
 * term) + BreadcrumbList.
 */

const PATH = "/glossary";
const TITLE = "واژه‌نامهٔ مونته‌سوری، پیکلر و بازی کودک";
const TRAIL = crumbTrail({ name: "واژه‌نامه", path: PATH });

function description(total: number) {
  return `تعریف کوتاه و دقیق ${formatNumber(total)} اصطلاح مونته‌سوری، پیکلر، والدورف، رشد حرکتی و ایمنی وسایل چوبی کودک؛ با نام‌های دیگر هر واژه و راهنماهای مرتبط.`;
}

export async function generateMetadata(): Promise<Metadata> {
  const { total } = await getGlossaryIndex();
  return pageMetadata({ title: TITLE, description: description(total), path: PATH });
}

export default async function GlossaryPage() {
  const { letters, groups, total } = await getGlossaryIndex();
  const terms = groups.flatMap((g) => g.terms);

  const ld = graph(
    webPageNode({
      type: "CollectionPage",
      path: PATH,
      name: TITLE,
      description: description(total),
      breadcrumb: true,
      mainEntity: ids.termSet(),
    }),
    definedTermSetNode(terms.map((t) => ({ slug: t.slug, term: t.term }))),
    breadcrumbNode(TRAIL),
  );

  return (
    <PageTurn>
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={TRAIL} />

        <header className="mt-6 flex max-w-prose flex-col gap-3 lg:mt-8">
          <Kicker tone="success" doodle="sprout" decorative>
            از الف تا ی، به زبان ساده
          </Kicker>
          <h1 className="text-3xl text-ink">{TITLE}</h1>
          <p className="text-lead text-muted">
            {formatNumber(total)} اصطلاحی که در مجلهٔ چوبز و صفحه‌های محصول می‌بینید، هر کدام با تعریفی کوتاه و دقیق: از
            روش‌های مونته‌سوری، پیکلر و والدورف تا رشد حرکتی، بازی و ایمنی وسایل چوبی. روی هر واژه بزنید تا تعریف کامل،
            نام‌های دیگرش و راهنماهای مرتبط را ببینید.
          </p>
        </header>

        <AlphabetRail letters={letters} className="mt-6" />
        <GlossaryIndex groups={groups} className="mt-2" />
      </div>
      <JsonLd data={ld} />
    </PageTurn>
  );
}
