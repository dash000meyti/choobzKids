import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { faqs, pages, type FaqScope } from "@/db/schema";
import { tag } from "@/lib/cache-tags";

/*
 * Site-level FAQs (SEO.md §1.6, DESIGN.md §8 /faq). The /faq page owns the general Q&As in five
 * anchored sections; age hubs own their own (`scope = 'age'`, `scopeKey` = hub slug). A Q&A lives
 * on exactly one URL, so nothing here is shared between the two.
 * Answers are Markdown-ready text: pages render them with Prose and `faqNode()` reads the same
 * text, so the FAQPage markup always mirrors what is visible.
 */

export type FaqEntry = {
  id: number;
  question: string;
  answer: string;
};

export type FaqSectionId = "buying" | "shipping" | "installments" | "returns" | "safety";

type FaqSectionSpec = {
  id: FaqSectionId;
  /** Chip label in the sticky index. */
  label: string;
  /** Section H2. */
  title: string;
  scope: Extract<FaqScope, "general" | "shipping">;
  scopeKey: string;
  /** The policy page that tells the whole story, shown under the section when it is published. */
  page?: { slug: string; label: string };
};

/** /faq sections in page order (SEO.md §1.6: خرید · ارسال · اقساط · بازگشت و ضمانت · ایمنی و نگهداری). */
export const FAQ_SECTIONS: readonly FaqSectionSpec[] = [
  { id: "buying", label: "خرید", title: "خرید از چوبز", scope: "general", scopeKey: "buying" },
  {
    id: "shipping",
    label: "ارسال",
    title: "ارسال و تحویل",
    scope: "shipping",
    scopeKey: "shipping",
    page: { slug: "shipping", label: "همه‌چیز دربارهٔ ارسال و تحویل" },
  },
  {
    id: "installments",
    label: "اقساط",
    title: "خرید قسطی با اسنپ‌پی",
    scope: "shipping",
    scopeKey: "installments",
    page: { slug: "installments", label: "راهنمای خرید قسطی با اسنپ‌پی" },
  },
  {
    id: "returns",
    label: "بازگشت و ضمانت",
    title: "بازگشت کالا و ضمانت",
    scope: "shipping",
    scopeKey: "returns",
    page: { slug: "returns", label: "شرایط کامل بازگشت کالا" },
  },
  {
    id: "safety",
    label: "ایمنی و نگهداری",
    title: "ایمنی و نگهداری",
    scope: "shipping",
    scopeKey: "safety",
    page: { slug: "safety", label: "ایمنی و مواد وسایل چوبز" },
  },
];

export type FaqSection = Omit<FaqSectionSpec, "scope" | "scopeKey" | "page"> & {
  faqs: FaqEntry[];
  /** Site path of the related policy page, null while it is unpublished. */
  more: { href: string; label: string } | null;
};

export type FaqPageData = {
  /** Sections that hold at least one Q&A, in page order. */
  sections: FaqSection[];
  /** Newest edit across the page's Q&As (ISO), for `dateModified`. */
  updatedAt: string | null;
};

type FaqRow = typeof faqs.$inferSelect;

function selectFaqs(where: SQL | undefined): FaqRow[] {
  return db.select().from(faqs).where(where).orderBy(asc(faqs.sortOrder), asc(faqs.id)).all();
}

const toEntry = (row: FaqRow): FaqEntry => ({ id: row.id, question: row.question, answer: row.answer });

/** Every /faq Q&A, grouped into the five anchored sections. */
export async function getFaqPage(): Promise<FaqPageData> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.faqs, tag.pages);

  const rows = selectFaqs(inArray(faqs.scope, ["general", "shipping"]));
  const published = new Set(
    db
      .select({ slug: pages.slug })
      .from(pages)
      .where(eq(pages.status, "published"))
      .all()
      .map((p) => p.slug),
  );

  const sections = FAQ_SECTIONS.map(({ scope, scopeKey, page, ...section }) => ({
    ...section,
    faqs: rows.filter((r) => r.scope === scope && r.scopeKey === scopeKey).map(toEntry),
    more: page && published.has(page.slug) ? { href: `/${page.slug}`, label: page.label } : null,
  })).filter((section) => section.faqs.length > 0);

  const newest = rows.reduce<Date | null>((max, r) => (!max || r.updatedAt > max ? r.updatedAt : max), null);
  return { sections, updatedAt: newest ? newest.toISOString() : null };
}

/**
 * Q&As attached to one non-numeric scope key, e.g. `('age', '1-3-years')`; a null key reads the
 * scope's unkeyed rows. In sort order.
 */
export async function listFaqs(scope: FaqScope, scopeKey: string | null): Promise<FaqEntry[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.faqs);
  const key = scopeKey === null ? isNull(faqs.scopeKey) : eq(faqs.scopeKey, scopeKey);
  return selectFaqs(and(eq(faqs.scope, scope), key)).map(toEntry);
}
