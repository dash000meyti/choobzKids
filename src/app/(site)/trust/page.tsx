import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { crumbTrail } from "@/components/layout/Breadcrumbs";
import { FactList, PolicyPage, type FactRow } from "@/components/mag/PolicyPage";
import { EnamadBadge } from "@/components/ui/EnamadBadge";
import { getPage } from "@/db/queries/pages";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import { toEnDigits, toFaDigits } from "@/lib/format";
import { breadcrumbNode, graph, ids, JsonLd, webPageNode } from "@/lib/jsonld";
import { pageMetadata, SITE } from "@/lib/seo";

/*
 * /trust «اعتماد شما» (DESIGN.md §8, SEO.md §6.3, §8.12): the eNamad seal large and eager (the one
 * page where it is not lazy), how to check it, and the business identifiers. Each identifier
 * shows only once its ⚑ setting exists, and must match the eNamad record and the JSON-LD exactly.
 */

const PATH = "/trust";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("trust");
  if (!page) return { title: "این صفحه پیدا نشد", robots: { index: false, follow: true } };
  return pageMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.excerpt ?? page.title,
    path: page.canonicalPath ?? PATH,
    modifiedTime: page.updatedAt,
    noindex: page.noindex,
  });
}

function identifiers(settings: SiteSettings): FactRow[] {
  const { org, socials, enamad } = settings;
  const place = [org.address, org.city].filter(Boolean).join("، ");
  const rows: (FactRow | null)[] = [
    {
      label: "نام تجاری",
      value: (
        <>
          {settings.siteName}{" "}
          <bdi lang="en" dir="ltr">
            ({settings.siteNameEn})
          </bdi>
        </>
      ),
    },
    {
      label: "نشانی سایت",
      value: (
        <bdi lang="en" dir="ltr">
          {new URL(SITE.url).host}
        </bdi>
      ),
    },
    org.legalName ? { label: "نام حقوقی", value: org.legalName } : null,
    org.nationalId ? { label: "شناسهٔ ملی", value: <span dir="ltr">{toFaDigits(org.nationalId)}</span> } : null,
    enamad ? { label: "شناسهٔ نماد اعتماد", value: <span dir="ltr">{toFaDigits(enamad.id)}</span> } : null,
    org.foundingDate ? { label: "سال شروع", value: toFaDigits(org.foundingDate) } : null,
    place ? { label: "نشانی", value: place } : null,
    org.phone
      ? {
          label: "تلفن",
          value: (
            <a href={`tel:${toEnDigits(org.phone).replace(/[^\d+]/g, "")}`} className="link-mark">
              <span dir="ltr">{toFaDigits(org.phone)}</span>
            </a>
          ),
        }
      : null,
    org.email
      ? {
          label: "ایمیل",
          value: (
            <a href={`mailto:${org.email}`} className="link-mark">
              <bdi lang="en" dir="ltr">
                {org.email}
              </bdi>
            </a>
          ),
        }
      : null,
    socials.instagram && socials.instagramHandle
      ? {
          label: "اینستاگرام",
          value: (
            <a href={socials.instagram} target="_blank" rel="noopener" className="link-mark">
              <bdi lang="en" dir="ltr">
                @{socials.instagramHandle}
              </bdi>
            </a>
          ),
        }
      : null,
  ];
  return rows.filter((row): row is FactRow => row !== null);
}

export default async function TrustPage() {
  const [page, settings] = await Promise.all([getPage("trust"), getSettings()]);
  if (!page) notFound();

  const trail = crumbTrail({ name: page.title, path: PATH });
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
    <>
      <JsonLd data={jsonLd} />
      <PolicyPage
        trail={trail}
        title={page.title}
        summary={{ text: page.excerpt }}
        body={page.body}
        slug={page.slug}
        updatedAt={page.updatedAt}
        faqs={page.faqs}
        socials={settings.socials}
      >
        {settings.enamad ? (
          <section aria-labelledby="enamad-title">
            <h2 id="enamad-title" className="headline text-2xl lg:text-[2.25rem]">
              نماد اعتماد الکترونیکی چوبز
            </h2>
            <div className="tray mt-4 flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:text-start">
              <EnamadBadge enamad={settings.enamad} eager className="h-[138px] w-[128px] bg-raised p-1.5 shadow-paper" />
              <p className="text-base text-ink">
                روی نماد کلیک کنید تا اطلاعات ثبت‌شدهٔ چوبز را در سایت اینماد ببینید؛ صفحهٔ آن باید از نشانی{" "}
                <bdi lang="en" dir="ltr">
                  trustseal.enamad.ir
                </bdi>{" "}
                باز شود.
              </p>
            </div>
          </section>
        ) : null}
        <section aria-labelledby="identifiers-title">
          <h2 id="identifiers-title" className="headline text-2xl lg:text-[2.25rem]">
            اطلاعات کسب‌وکار چوبز
          </h2>
          <p className="mt-1.5 text-sm text-muted">هر موردی که اینجا نیست، هنوز ثبت یا تأیید نهایی نشده است.</p>
          <FactList rows={identifiers(settings)} className="mt-3" />
        </section>
      </PolicyPage>
    </>
  );
}
