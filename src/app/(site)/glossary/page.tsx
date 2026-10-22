import type { Metadata } from "next";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { AlphabetRail } from "@/components/mag/AlphabetRail";
import { GlossaryIndex } from "@/components/mag/GlossaryIndex";
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
      <div className="frame-col frame-pad pt-6 pb-band lg:pt-10">
        <Breadcrumbs items={TRAIL} />

        <header className="mx-auto mt-8 flex max-w-[48rem] flex-col items-center gap-3 pb-6 text-center lg:mt-12">
          <p className="eyebrow">واژه‌نامهٔ چوبز</p>
          <h1 className="headline text-3xl lg:text-[4rem]">{TITLE}</h1>
          <p className="text-lead text-muted">
            {formatNumber(total)} اصطلاحی که در مجلهٔ چوبز و صفحه‌های محصول می‌بینید، هر کدام با تعریفی کوتاه و دقیق: از
            روش‌های مونته‌سوری، پیکلر و والدورف تا رشد حرکتی، بازی و ایمنی وسایل چوبی. روی هر واژه بزنید تا تعریف کامل،
            نام‌های دیگرش و راهنماهای مرتبط را ببینید.
          </p>
        </header>

        <AlphabetRail letters={letters} className="mt-6" />
        <GlossaryIndex groups={groups} className="mt-8" />
      </div>
      <JsonLd data={ld} />
    </PageTurn>
  );
}
