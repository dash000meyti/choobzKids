import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { crumbTrail } from "@/components/layout/Breadcrumbs";
import {
  PolicyPage,
  returnFacts,
  shippingFacts,
  warrantyFact,
  type PolicyFact,
} from "@/components/mag/PolicyPage";
import { getPage, getWarrantyMonths, isGenericPageSlug, listPageSlugs, type PageData } from "@/db/queries/pages";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import { breadcrumbNode, entity, graph, ids, JsonLd, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /{page}: the CMS policy pages from the `pages` table — shipping, returns, warranty, safety,
 * privacy, terms, editorial-policy and any page added later (SEO.md §1.2, DESIGN.md §8).
 * Static segments win over this one; reserved slugs and pages with their own route
 * (about, workshop, contact, installments, trust) are 404s here, as is anything not published.
 */

/*
 * The page awaits `params` before any Suspense so an unknown slug is a real 404 (TECH.md §2.5).
 * Every published slug is prerendered by generateStaticParams, so navigations land on a complete
 * static page; the dev-only instant-shell validation (which assumes an unknown param) is off here.
 */
export const instant = false;

export async function generateStaticParams() {
  return (await listPageSlugs()).map((page) => ({ page }));
}

async function loadPage(slug: string): Promise<PageData | null> {
  return isGenericPageSlug(slug) ? getPage(slug) : null;
}

export async function generateMetadata({ params }: PageProps<"/[page]">): Promise<Metadata> {
  const { page: slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: "این صفحه پیدا نشد", robots: { index: false, follow: true } };
  return pageMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.excerpt ?? page.title,
    path: page.canonicalPath ?? `/${page.slug}`,
    modifiedTime: page.updatedAt,
    noindex: page.noindex,
  });
}

/** The key numbers each page quotes; only facts whose settings exist (⚑). */
function factsFor(slug: string, settings: SiteSettings, warranty: { min: number; max: number } | null): PolicyFact[] {
  switch (slug) {
    case "shipping":
      return shippingFacts(settings.shippingPolicy);
    case "returns":
      return returnFacts(settings.returnPolicy);
    case "warranty": {
      const fact = warrantyFact(warranty);
      return fact ? [fact, ...returnFacts(settings.returnPolicy).slice(0, 1)] : [];
    }
    default:
      return [];
  }
}

/** What the page is the canonical home of: the org-level policies are defined once, in the site graph. */
function pageEntity(slug: string, settings: SiteSettings) {
  if (slug === "shipping" && settings.shippingPolicy) return { mainEntity: ids.shippingPolicy() };
  if (slug === "returns" && settings.returnPolicy) return { mainEntity: ids.returnPolicy() };
  if (slug === "safety") return { about: [entity("Q7830552"), entity("Q219803"), entity("Q16319458")] };
  return {};
}

export default async function Page({ params }: PageProps<"/[page]">) {
  const { page: slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();

  const [settings, warranty] = await Promise.all([getSettings(), getWarrantyMonths()]);
  const path = `/${page.slug}`;
  const trail = crumbTrail({ name: page.title, path });
  const facts = factsFor(page.slug, settings, warranty);

  const jsonLd = graph(
    webPageNode({
      path,
      name: page.seoTitle ?? page.title,
      description: page.seoDescription ?? page.excerpt,
      breadcrumb: true,
      dateModified: page.updatedAt,
      ...pageEntity(page.slug, settings),
    }),
    breadcrumbNode(trail),
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <PolicyPage
        trail={trail}
        title={page.title}
        summary={{ text: page.excerpt, facts }}
        body={page.body}
        slug={page.slug}
        glossaryLinks={page.slug === "safety"}
        updatedAt={page.updatedAt}
        faqs={page.faqs}
        socials={settings.socials}
      />
    </>
  );
}
