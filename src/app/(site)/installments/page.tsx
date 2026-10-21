import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { crumbTrail } from "@/components/layout/Breadcrumbs";
import { PolicyPage, type PolicyFact } from "@/components/mag/PolicyPage";
import { InstallmentCalculator, type InstallmentOption } from "@/components/shop/InstallmentCalculator";
import type { SnappPaySettings } from "@/components/ui/installments";
import { listVariantOptions } from "@/db/queries/cards";
import { listFeaturedProductCards } from "@/db/queries/catalog";
import { getPage } from "@/db/queries/pages";
import { getSettings } from "@/db/queries/settings";
import { formatToman, toFaDigits } from "@/lib/format";
import { breadcrumbNode, faqNode, graph, ids, JsonLd, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /installments «خرید قسطی با اسنپ‌پی» (DESIGN.md §8, SEO.md §1.2, §6.4): the calculator (product
 * chips with server-rendered wheels, plus a custom amount), three steps, the page body and its
 * FAQ with FAQPage markup. Owns the «خرید قسطی سیسمونی / اسباب‌بازی» queries (SEO.md §1.10).
 * Money voice throughout; every schedule claim defers to «طبق شرایط اسنپ‌پی».
 */

const PATH = "/installments";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("installments");
  if (!page) return { title: "این صفحه پیدا نشد", robots: { index: false, follow: true } };
  return pageMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.excerpt ?? page.title,
    path: page.canonicalPath ?? PATH,
    modifiedTime: page.updatedAt,
    noindex: page.noindex,
  });
}

const FIRST_SHARE: Record<number, string> = { 2: "نصف مبلغ", 3: "یک‌سوم مبلغ", 4: "یک‌چهارم مبلغ" };

function planFacts(snapppay: NonNullable<SnappPaySettings>): PolicyFact[] {
  const count = snapppay.count > 0 ? snapppay.count : 4;
  const facts: PolicyFact[] = [
    { label: "تعداد اقساط", value: `${toFaDigits(count)} قسط مساوی` },
    { label: "قسط اول", value: "هنگام خرید", note: FIRST_SHARE[count] },
    { label: "باقی اقساط", value: `${toFaDigits(count - 1)} قسط ماهانه`, note: "طبق شرایط اسنپ‌پی" },
  ];
  if (snapppay.minToman != null || snapppay.maxToman != null) {
    const range =
      snapppay.minToman != null && snapppay.maxToman != null
        ? `${formatToman(snapppay.minToman)} تا ${formatToman(snapppay.maxToman)}`
        : snapppay.minToman != null
          ? `از ${formatToman(snapppay.minToman)}`
          : `تا ${formatToman(snapppay.maxToman!)}`;
    facts.push({ label: "مبلغ سفارش قسطی", value: range });
  }
  return facts;
}

function Steps({ count }: { count: number }) {
  const steps = [
    { title: "محصول را به سبد خرید اضافه کنید", body: "یک وسیله، چند وسیله یا یک پک کامل اتاق." },
    { title: "اسنپ‌پی را انتخاب کنید", body: "در مرحلهٔ پرداخت، اسنپ‌پی را بزنید و با شمارهٔ موبایل وارد شوید." },
    {
      title: "قسط اول را بپردازید",
      body: `باقی مبلغ در ${toFaDigits(count - 1)} قسط ماهانه پرداخت می‌شود؛ طبق شرایط اسنپ‌پی.`,
    },
  ];
  return (
    <section aria-labelledby="steps-title">
      <h2 id="steps-title" className="headline text-2xl lg:text-[2.25rem]">
        خرید قسطی چطور انجام می‌شود؟
      </h2>
      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col rounded-[1.5rem] bg-surface p-6">
            <span aria-hidden="true" className="text-sm font-bold tabular-nums text-muted">
              {toFaDigits(String(index + 1).padStart(2, "0"))}
            </span>
            <h3 className="mt-6 text-lg leading-snug font-extrabold text-ink">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function InstallmentsPage() {
  const [page, settings, featured, variants] = await Promise.all([
    getPage("installments"),
    getSettings(),
    listFeaturedProductCards(8),
    listVariantOptions(),
  ]);
  if (!page) notFound();

  const snapppay = settings.snapppay?.enabled ? settings.snapppay : null;
  const count = snapppay && snapppay.count > 0 ? snapppay.count : 4;
  const trail = crumbTrail({ name: page.title, path: PATH });
  const options: InstallmentOption[] = featured.map((product) => ({
    slug: product.slug,
    name: product.name,
    price: product.price,
    from: new Set((variants[product.id] ?? []).map((v) => v.price)).size > 1,
  }));

  const jsonLd = graph(
    webPageNode({
      path: PATH,
      name: page.seoTitle ?? page.title,
      description: page.seoDescription ?? page.excerpt,
      breadcrumb: true,
      about: { "@id": ids.organization() },
      hasPart: page.faqs.length ? [ids.faq(PATH)] : undefined,
      dateModified: page.updatedAt,
    }),
    breadcrumbNode(trail),
    page.faqs.length ? faqNode(page.faqs, PATH) : null,
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <PolicyPage
        trail={trail}
        kicker={count === 4 ? "چهار چرخ، چهار قسط" : undefined}
        title={page.title}
        summary={{ text: page.excerpt, facts: snapppay ? planFacts(snapppay) : [] }}
        body={page.body}
        slug={page.slug}
        updatedAt={page.updatedAt}
        faqs={page.faqs}
        socials={settings.socials}
      >
        {snapppay ? <InstallmentCalculator options={options} snapppay={snapppay} /> : null}
        {snapppay ? <Steps count={count} /> : null}
      </PolicyPage>
    </>
  );
}
