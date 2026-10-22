import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { ArticleCard } from "@/components/mag/ArticleCard";
import { AuthorPortrait } from "@/components/mag/AuthorCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getTeamProfile, listTeamSlugs, type TeamProfile } from "@/db/queries/team";
import { formatNumber } from "@/lib/format";
import { breadcrumbNode, graph, JsonLd, profileNodes } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /team/{slug} (DESIGN.md §7.6, SEO.md §3.5.12, §8.11): arch portrait, name, role, verifiable
 * credentials and topics, bio, profiles elsewhere, and everything this person or team wrote and
 * reviewed. JSON-LD: ProfilePage whose mainEntity is the full Person, or an Organization for a
 * collective byline («تحریریهٔ چوبز کیدز»). Placeholder people have no page at all.
 */

/*
 * `params` is awaited before any Suspense so an unknown or placeholder slug is a real 404
 * (TECH.md §2.5). Every publishable profile is prerendered by generateStaticParams; the dev-only
 * instant-shell validation (which assumes an unlisted param) is off here.
 */
export const instant = false;

export async function generateStaticParams() {
  const slugs = await listTeamSlugs();
  return slugs.map((slug) => ({ slug }));
}

const pathOf = (slug: string) => `/team/${slug}`;
const titleOf = (p: TeamProfile) => {
  const role = p.jobTitle || p.role;
  return role && role !== p.name ? `${p.name}، ${role}` : p.name;
};

/** The bio's opening sentences that fit a meta description (SEO.md §2.3: the short bio). */
function shortBio(bio: string): string {
  const sentences = bio.match(/[^.!؟?]+[.!؟?]+/g) ?? [bio];
  let text = "";
  for (const sentence of sentences) {
    const next = `${text} ${sentence.trim()}`.trim();
    if ([...next].length > 155) break;
    text = next;
  }
  return text || bio;
}

export async function generateMetadata({ params }: PageProps<"/team/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getTeamProfile(slug);
  if (!profile) return {};
  return pageMetadata({
    title: titleOf(profile),
    description: shortBio(profile.bio || `${profile.name}، ${profile.role}`),
    path: pathOf(profile.slug),
    type: "profile",
  });
}

const SITE_LABEL: Record<string, string> = {
  "instagram.com": "اینستاگرام",
  "www.instagram.com": "اینستاگرام",
  "linkedin.com": "لینکدین",
  "www.linkedin.com": "لینکدین",
  "aparat.com": "آپارات",
  "www.aparat.com": "آپارات",
};

function profileLink(url: string): { label: string; icon: "instagram" | "link" } {
  const host = new URL(url).hostname;
  return { label: SITE_LABEL[host] ?? host.replace(/^www\./, ""), icon: host.endsWith("instagram.com") ? "instagram" : "link" };
}

export default async function TeamProfilePage({ params }: PageProps<"/team/[slug]">) {
  const { slug } = await params;
  const profile = await getTeamProfile(slug);
  if (!profile) notFound();

  const path = pathOf(profile.slug);
  const trail = crumbTrail({ name: "تیم چوبز", path: "/team" }, { name: profile.name, path });
  const role = profile.jobTitle || profile.role;

  const ld = graph(
    profileNodes(
      {
        slug: profile.slug,
        name: profile.name,
        jobTitle: profile.jobTitle,
        role: profile.role,
        bio: profile.bio,
        knowsAbout: profile.knowsAboutKeys,
        credentials: profile.credentials,
        sameAs: profile.sameAs,
        isPlaceholder: false,
        isOrganization: profile.isOrganization,
        avatar: profile.avatar
          ? { path: profile.avatar.path, width: profile.avatar.width, height: profile.avatar.height, alt: profile.avatar.alt }
          : null,
      },
      { breadcrumb: true, dateModified: profile.updatedAt },
    ),
    breadcrumbNode(trail),
  );

  return (
    <PageTurn>
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={trail} />

        <header className="mt-6 grid max-w-narrow gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start lg:mt-8">
          <AuthorPortrait name={profile.name} slug={profile.slug} avatar={profile.avatar} size={112} priority />
          <div className="flex min-w-0 flex-col gap-3">
            <h1 className="text-3xl text-ink">{profile.name}</h1>
            {role && role !== profile.name ? <p className="text-lead text-muted">{role}</p> : null}

            {profile.credentials.length ? (
              <div>
                <h2 className="sr-only">مدرک‌ها و دوره‌ها</h2>
                <ul className="flex flex-wrap gap-2">
                  {profile.credentials.map((c) => (
                    <li key={c} className="rounded-bead bg-sunken px-3 py-1 text-xs font-semibold text-ink inset-shadow-tray">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {profile.knowsAbout.length ? (
              <p className="text-sm text-muted">
                دربارهٔ:{" "}
                {profile.knowsAbout.map((topic, i) => (
                  <span key={topic.label}>
                    {i > 0 ? "، " : null}
                    {topic.href ? (
                      <Link href={topic.href} className="link-mark text-ink">
                        {topic.label}
                      </Link>
                    ) : (
                      <span className="text-ink">{topic.label}</span>
                    )}
                  </span>
                ))}
              </p>
            ) : null}

            {profile.bio ? <p className="text-base text-ink">{profile.bio}</p> : null}

            {profile.sameAs.length ? (
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {profile.sameAs.map((url) => {
                  const link = profileLink(url);
                  return (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noopener me" className="inline-flex items-center gap-1.5 text-ink">
                        <Icon name={link.icon} className="size-4.5" />
                        <span className="link-mark">{link.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </header>

        {profile.authored.length ? (
          <PostShelf
            id="authored"
            title={`نوشته‌های ${profile.name}`}
            count={profile.authored.length}
            posts={profile.authored}
          />
        ) : null}

        {profile.reviewed.length ? (
          <PostShelf
            id="reviewed"
            title={`مطالبی که ${profile.name} بازبینی کرده`}
            count={profile.reviewed.length}
            posts={profile.reviewed}
          />
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

function PostShelf({ id, title, count, posts }: { id: string; title: string; count: number; posts: TeamProfile["authored"] }) {
  return (
    <section aria-labelledby={`${id}-title`} className="mt-section">
      <SectionHeader id={`${id}-title`} size="content" title={title} sub={`${formatNumber(count)} مطلب در مجلهٔ چوبز`} />
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <li key={post.id}>
            <ArticleCard post={post} prefetch={i < 3} />
          </li>
        ))}
      </ul>
    </section>
  );
}
