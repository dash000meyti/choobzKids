import type { Metadata } from "next";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { AuthorCard } from "@/components/mag/AuthorCard";
import { Button } from "@/components/ui/Button";
import { listTeamMembers } from "@/db/queries/team";
import { breadcrumbNode, collectionNodes, graph, JsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /team «تیم و نویسندگان» (DESIGN.md §7.6, SEO.md §1.2, §8.11): everyone who writes, reviews or
 * builds for Choobz, as AuthorCards. Placeholder people never appear (the query drops them).
 * JSON-LD: CollectionPage + ItemList of the profile pages, BreadcrumbList.
 */

const PATH = "/team";
const TITLE = "تیم و نویسندگان چوبز؛ مجله و کارگاه چوبز کیدز";
const HEADING = "تیم و نویسندگان چوبز";
const DESCRIPTION =
  "چه کسانی مطالب مجلهٔ چوبز را می‌نویسند و بازبینی می‌کنند و وسایل چوبی کودک را در کارگاه می‌سازند؛ با نقش، زمینهٔ کار و مطالب هر کدام.";
const TRAIL = crumbTrail({ name: "تیم چوبز", path: PATH });

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

export default async function TeamPage() {
  const members = await listTeamMembers();

  const ld = graph(
    collectionNodes({
      path: PATH,
      name: HEADING,
      description: DESCRIPTION,
      breadcrumb: true,
      items: members.map((m) => ({ path: `/team/${m.slug}`, name: m.name })),
    }),
    breadcrumbNode(TRAIL),
  );

  return (
    <PageTurn>
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={TRAIL} />

        <header className="mt-6 flex max-w-prose flex-col gap-3 lg:mt-8">
          <h1 className="text-3xl text-ink">{HEADING}</h1>
          <p className="text-lead text-muted">
            مطالب مجله را تحریریهٔ چوبز می‌نویسد و هر عدد یا توصیهٔ سلامت را به منبعی معتبر ارجاع می‌دهد؛ تجربهٔ کار با چوب
            از خود کارگاه می‌آید. اینجا می‌بینید هر مطلب را چه کسی نوشته و چه کسی بازبینی کرده است.
          </p>
        </header>

        {members.length ? (
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {members.map((member) => (
              <li key={member.id}>
                <AuthorCard member={member} />
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-12">
          <Button href="/editorial-policy" variant="quiet" iconEnd="arrow-end">
            ما چطور می‌نویسیم و بازبینی می‌کنیم
          </Button>
        </p>
      </div>
      <JsonLd data={ld} />
    </PageTurn>
  );
}
