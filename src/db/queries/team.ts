import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { getArticleCardsBySlugs, type ArticleCardData } from "@/db/queries/cards";
import type { CardImage } from "@/db/queries/catalog";
import { authors, glossaryTerms, media, posts } from "@/db/schema";
import { tag } from "@/lib/cache-tags";
import { entity } from "@/lib/jsonld";

/*
 * Team reads (DESIGN.md §7.6, SEO.md §3.5.12, §8.11). Placeholder people are never published:
 * they are filtered out here, so no page, card, count or param can reach them. Collective
 * authors («تحریریهٔ چوبز کیدز», «کارگاه چوبز») are real and published; their profile renders as
 * an Organization. Credentials and `knowsAbout` come only from the row, never invented.
 */

export type KnowsAbout = {
  label: string;
  /** Glossary page when the topic is one of our terms. */
  href: string | null;
};

export type TeamMember = {
  id: number;
  slug: string;
  name: string;
  role: string;
  jobTitle: string | null;
  bio: string;
  isOrganization: boolean;
  credentials: string[];
  sameAs: string[];
  /** Raw keys for JSON-LD (Wikidata QIDs or glossary slugs). */
  knowsAboutKeys: string[];
  /** The same topics with visible names; unknown keys are left out. */
  knowsAbout: KnowsAbout[];
  avatar: CardImage | null;
  /** Published posts written / reviewed. */
  authoredCount: number;
  reviewedCount: number;
  updatedAt: string;
};

export type TeamProfile = TeamMember & {
  /** Published posts by this author, newest first. */
  authored: ArticleCardData[];
  /** Published posts this person or team reviewed (and did not write), newest first. */
  reviewed: ArticleCardData[];
};

type AuthorRow = typeof authors.$inferSelect;

function loadPublishable(): AuthorRow[] {
  // People first, then the collective bylines; each group in the order they joined.
  return db
    .select()
    .from(authors)
    .where(eq(authors.isPlaceholder, false))
    .all()
    .sort((a, b) => Number(a.isOrganization) - Number(b.isOrganization) || a.id - b.id);
}

function loadAvatars(rows: AuthorRow[]): Map<number, CardImage> {
  const ids = rows.map((r) => r.avatarMediaId).filter((id): id is number => id != null);
  if (!ids.length) return new Map();
  return new Map(
    db
      .select()
      .from(media)
      .where(inArray(media.id, ids))
      .all()
      .map((m) => [
        m.id,
        { path: m.path, width: m.width, height: m.height, alt: m.alt, dominantColor: m.dominantColor, kind: m.kind },
      ]),
  );
}

/** Published posts (slug, author, reviewer), newest first. */
function loadBylines() {
  return db
    .select({ slug: posts.slug, authorId: posts.authorId, reviewerId: posts.reviewerId })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), desc(posts.id))
    .all();
}

function resolveKnowsAbout(keys: string[]): KnowsAbout[] {
  const slugs = keys.filter((k) => !/^Q\d+$/.test(k));
  const terms = new Map(
    slugs.length
      ? db
          .select({ slug: glossaryTerms.slug, term: glossaryTerms.term })
          .from(glossaryTerms)
          .where(inArray(glossaryTerms.slug, slugs))
          .all()
          .map((t) => [t.slug, t.term])
      : [],
  );
  return keys.flatMap((key): KnowsAbout[] => {
    const term = terms.get(key);
    if (term) return [{ label: term, href: `/glossary/${key}` }];
    const known: unknown = entity(key);
    const name = typeof known === "object" && known && "name" in known && typeof known.name === "string" ? known.name : null;
    // Unknown QIDs come back named by their id, and slugs as bare references: nothing a reader could use.
    return name && name !== key ? [{ label: name, href: null }] : [];
  });
}

function toMember(row: AuthorRow, avatars: Map<number, CardImage>, bylines: ReturnType<typeof loadBylines>): TeamMember {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    role: row.role,
    jobTitle: row.jobTitle,
    bio: row.bio,
    isOrganization: row.isOrganization,
    credentials: row.credentials,
    sameAs: row.sameAs,
    knowsAboutKeys: row.knowsAbout,
    knowsAbout: resolveKnowsAbout(row.knowsAbout),
    avatar: row.avatarMediaId != null ? (avatars.get(row.avatarMediaId) ?? null) : null,
    authoredCount: bylines.filter((p) => p.authorId === row.id).length,
    reviewedCount: bylines.filter((p) => p.reviewerId === row.id && p.authorId !== row.id).length,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Everyone who may appear on /team, people before collective bylines. */
export async function listTeamMembers(): Promise<TeamMember[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.authors, tag.posts, tag.media, tag.glossary);
  const rows = loadPublishable();
  const avatars = loadAvatars(rows);
  const bylines = loadBylines();
  return rows.map((row) => toMember(row, avatars, bylines));
}

/** Slugs of publishable profiles, for generateStaticParams. */
export async function listTeamSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.authors);
  return loadPublishable().map((a) => a.slug);
}

/** One profile with its writing and reviewing; null for unknown or placeholder slugs. */
export async function getTeamProfile(slug: string): Promise<TeamProfile | null> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.authors, tag.posts, tag.topics, tag.media, tag.glossary);

  const row = db
    .select()
    .from(authors)
    .where(and(eq(authors.slug, slug), eq(authors.isPlaceholder, false)))
    .get();
  if (!row) return null;

  const bylines = loadBylines();
  const member = toMember(row, loadAvatars([row]), bylines);
  const authoredSlugs = bylines.filter((p) => p.authorId === row.id).map((p) => p.slug);
  const reviewedSlugs = bylines.filter((p) => p.reviewerId === row.id && p.authorId !== row.id).map((p) => p.slug);
  const [authored, reviewed] = await Promise.all([
    getArticleCardsBySlugs(authoredSlugs),
    getArticleCardsBySlugs(reviewedSlugs),
  ]);
  return { ...member, authored, reviewed };
}
