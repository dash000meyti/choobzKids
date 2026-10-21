import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { crumbTrail } from "@/components/layout/Breadcrumbs";
import { socialLinks } from "@/components/layout/socials";
import { PolicyPage } from "@/components/mag/PolicyPage";
import { Button } from "@/components/ui/Button";
import { getPage } from "@/db/queries/pages";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import { toEnDigits, toFaDigits } from "@/lib/format";
import { breadcrumbNode, graph, ids, JsonLd, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /contact «تماس با چوبز» (DESIGN.md §8, SEO.md §8.12): the channels as buttons (Bale, Instagram DM,
 * a tel: call), then the NAP block — only the fields that exist in settings, formatted exactly as
 * in the footer and the OnlineStore JSON-LD (they must match the eNamad record ⚑). No form.
 */

const PATH = "/contact";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("contact");
  if (!page) return { title: "این صفحه پیدا نشد", robots: { index: false, follow: true } };
  return pageMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.excerpt ?? page.title,
    path: page.canonicalPath ?? PATH,
    modifiedTime: page.updatedAt,
    noindex: page.noindex,
  });
}

function Channels({ settings }: { settings: SiteSettings }) {
  const { org } = settings;
  const social = socialLinks(settings.socials);
  const phoneHref = org.phone ? `tel:${toEnDigits(org.phone).replace(/[^\d+]/g, "")}` : null;
  const place = [org.address, org.city].filter(Boolean).join("، ");
  const hasNap = Boolean(org.legalName || place || org.phone || org.email);
  if (!social.bale && !social.instagramDm && !phoneHref && !hasNap) return null;

  return (
    <section aria-labelledby="channels-title" className="flex flex-col gap-6">
      <h2 id="channels-title" className="headline text-2xl lg:text-[2.25rem]">
        از کجا با ما حرف بزنید؟
      </h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {social.instagramDm ? (
          <Button variant="primary" size="lg" href={social.instagramDm} target="_blank" rel="noopener" iconStart="instagram">
            دایرکت اینستاگرام
          </Button>
        ) : null}
        {social.bale ? (
          <Button variant="consult" size="lg" href={social.bale} target="_blank" rel="noopener" iconStart="bale">
            پرسیدن در بله
          </Button>
        ) : null}
        {phoneHref ? (
          <Button variant="secondary" size="lg" href={phoneHref} iconStart="phone">
            تماس تلفنی
          </Button>
        ) : null}
      </div>
      {settings.socials.instagramHandle ? (
        <p className="text-sm text-muted">
          صفحهٔ اینستاگرام چوبز:{" "}
          <bdi lang="en" dir="ltr" className="font-semibold text-ink">
            @{settings.socials.instagramHandle}
          </bdi>
        </p>
      ) : null}

      {hasNap ? (
        <address className="tray flex flex-col gap-1.5 p-5 text-base text-ink not-italic">
          {org.legalName ? <span className="font-bold">{org.legalName}</span> : null}
          {place ? <span>{place}</span> : null}
          {org.phone && phoneHref ? (
            <a href={phoneHref} className="link-mark self-start">
              <span dir="ltr">{toFaDigits(org.phone)}</span>
            </a>
          ) : null}
          {org.email ? (
            <a href={`mailto:${org.email}`} className="link-mark self-start">
              <bdi lang="en" dir="ltr">
                {org.email}
              </bdi>
            </a>
          ) : null}
        </address>
      ) : null}
    </section>
  );
}

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getPage("contact"), getSettings()]);
  if (!page) notFound();

  const trail = crumbTrail({ name: page.title, path: PATH });
  const jsonLd = graph(
    webPageNode({
      path: PATH,
      type: "ContactPage",
      name: page.seoTitle ?? page.title,
      description: page.seoDescription ?? page.excerpt,
      breadcrumb: true,
      mainEntity: ids.organization(),
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
        intro={page.excerpt}
        body={page.body}
        slug={page.slug}
        updatedAt={page.updatedAt}
        faqs={page.faqs}
        socials={settings.socials}
        ask={false}
      >
        <Channels settings={settings} />
      </PolicyPage>
    </>
  );
}
