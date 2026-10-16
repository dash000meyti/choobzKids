import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, pages, posts, products, productVariants, roomPresetItems, roomPresets, topics } from "@/db/schema";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import { AGE_HUBS, AGE_STAGES, type AgeHubSlug, type AgeStageKey } from "@/lib/ages";
import { tag } from "@/lib/cache-tags";

/*
 * Everything the site chrome renders: header nav and mega menus, the «فهرست» dialog, the bottom
 * dock and the night footer (DESIGN.md §4.1–§4.6). One cached read per build/revalidation, shared
 * by every page, so the chrome never costs a request-time query.
 */

export type NavLinkItem = { label: string; href: string };

export type NavCategory = {
  slug: string;
  name: string;
  /** Manifest drawing key for the mini drawing (`/illustrations/{key}-assembled.svg`). */
  illustration: string | null;
  accent: string | null;
  productCount: number;
};

export type NavTopic = { slug: string; name: string; accent: string | null };

export type NavGuide = {
  slug: string;
  title: string;
  /** The title up to its first «:» (or through its first «؟»), for menus and the footer. */
  shortTitle: string;
};

export type NavRoom = {
  slug: string;
  name: string;
  ageStage: AgeStageKey | null;
  tagline: string | null;
  illustration: string | null;
  floorAreaM2: number | null;
  /** Pieces switched on by default in the room builder. */
  pieceCount: number;
  /** Toman, the default pieces at their listed prices. */
  totalToman: number;
};

export type NavAgeHub = {
  slug: AgeHubSlug;
  label: string;
  href: string;
  /** Age band colour of the hub's youngest stage, for hex chips. */
  tint: AgeStageKey;
  sections: NavLinkItem[];
};

export type NavAgeStage = { key: AgeStageKey; label: string; href: string; hub: AgeHubSlug };

export type FooterGroup = { title: string; links: NavLinkItem[] };

export type NavData = {
  categories: NavCategory[];
  topics: NavTopic[];
  pillarGuides: NavGuide[];
  rooms: NavRoom[];
  ageHubs: NavAgeHub[];
  /** The five home-door stages mapped onto hub anchors (DESIGN.md §0.3 #3). */
  ageStages: NavAgeStage[];
  /** «سؤال امروز» in the magazine menu: the newest published guide that asks a question. */
  question: NavLinkItem | null;
  /** Brand, policy and help links («کارگاه ما»، «ارسال و بازگشت کالا»…), only for pages that exist. */
  brandLinks: NavLinkItem[];
  footer: FooterGroup[];
  /** Bottom line of the footer: legal and trust pages. */
  legalLinks: NavLinkItem[];
  settings: SiteSettings;
};

const PILLAR_LIMIT = 3;

export function shortTitle(title: string): string {
  const question = title.indexOf("؟");
  const colon = title.indexOf(":");
  if (question !== -1 && (colon === -1 || question < colon)) return title.slice(0, question + 1).trim();
  if (colon !== -1) return title.slice(0, colon).trim();
  return title;
}

function isAgeStage(value: string | null): value is AgeStageKey {
  return value != null && AGE_STAGES.some((s) => s.key === value);
}

function loadCategories(): NavCategory[] {
  const counts = db
    .select({ categoryId: products.categoryId, n: count() })
    .from(products)
    .where(eq(products.status, "published"))
    .groupBy(products.categoryId)
    .all();
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      illustration: categories.illustration,
      accent: categories.accent,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id))
    .all()
    .map(({ id, ...c }) => ({ ...c, productCount: counts.find((x) => x.categoryId === id)?.n ?? 0 }))
    .filter((c) => c.productCount > 0);
}

function loadRooms(): NavRoom[] {
  const presets = db
    .select({
      id: roomPresets.id,
      slug: roomPresets.slug,
      name: roomPresets.name,
      ageStage: roomPresets.ageStage,
      tagline: roomPresets.tagline,
      illustration: roomPresets.illustration,
      floorAreaM2: roomPresets.floorAreaM2,
    })
    .from(roomPresets)
    .where(eq(roomPresets.status, "published"))
    .orderBy(asc(roomPresets.sortOrder), asc(roomPresets.id))
    .all();
  if (!presets.length) return [];

  // Default pieces of every preset, priced like the room builder: the variant's price, else the product's.
  const pieces = db
    .select({
      presetId: roomPresetItems.presetId,
      productPrice: products.price,
      variantPrice: productVariants.price,
    })
    .from(roomPresetItems)
    .innerJoin(products, eq(products.id, roomPresetItems.productId))
    .leftJoin(productVariants, eq(productVariants.id, roomPresetItems.variantId))
    .where(
      and(
        inArray(
          roomPresetItems.presetId,
          presets.map((p) => p.id),
        ),
        eq(roomPresetItems.defaultOn, true),
        eq(products.status, "published"),
      ),
    )
    .all();

  return presets.map(({ id, ageStage, ...preset }) => {
    const own = pieces.filter((p) => p.presetId === id);
    return {
      ...preset,
      ageStage: isAgeStage(ageStage) ? ageStage : null,
      pieceCount: own.length,
      totalToman: own.reduce((sum, p) => sum + (p.variantPrice ?? p.productPrice), 0),
    };
  });
}

function loadPillarGuides(): NavGuide[] {
  return db
    .select({ slug: posts.slug, title: posts.title })
    .from(posts)
    .where(and(eq(posts.status, "published"), eq(posts.isPillar, true)))
    .orderBy(desc(posts.featured), desc(posts.publishedAt), asc(posts.id))
    .limit(PILLAR_LIMIT)
    .all()
    .map((p) => ({ ...p, shortTitle: shortTitle(p.title) }));
}

function loadQuestion(): NavLinkItem | null {
  const newest = db
    .select({ slug: posts.slug, title: posts.title })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), desc(posts.id))
    .all()
    .find((p) => p.title.includes("؟"));
  return newest ? { label: shortTitle(newest.title), href: `/mag/${newest.slug}` } : null;
}

function publishedPageSlugs(): Set<string> {
  return new Set(
    db
      .select({ slug: pages.slug })
      .from(pages)
      .where(eq(pages.status, "published"))
      .all()
      .map((p) => p.slug),
  );
}

/** Links to CMS pages (`/{slug}`) render only when the page is published; route links always do. */
type ChromeLink = NavLinkItem & { page?: string };

function present(links: ChromeLink[], published: Set<string>): NavLinkItem[] {
  return links.filter((l) => !l.page || published.has(l.page)).map(({ label, href }) => ({ label, href }));
}

const BRAND_LINKS: ChromeLink[] = [
  { label: "کارگاه ما", href: "/workshop", page: "workshop" },
  { label: "داستان چوبز", href: "/about", page: "about" },
  { label: "خرید قسطی با اسنپ‌پی", href: "/installments", page: "installments" },
  { label: "ارسال و بازگشت کالا", href: "/shipping", page: "shipping" },
  { label: "سؤالات متداول", href: "/faq" },
  { label: "تماس با ما", href: "/contact", page: "contact" },
];

const BRAND_GROUP: ChromeLink[] = [
  { label: "کارگاه", href: "/workshop", page: "workshop" },
  { label: "داستان چوبز", href: "/about", page: "about" },
  { label: "تیم", href: "/team" },
  { label: "سیاست تحریریه", href: "/editorial-policy", page: "editorial-policy" },
];

const HELP_GROUP: ChromeLink[] = [
  { label: "ارسال", href: "/shipping", page: "shipping" },
  { label: "بازگشت کالا", href: "/returns", page: "returns" },
  { label: "ضمانت", href: "/warranty", page: "warranty" },
  { label: "ایمنی و متریال", href: "/safety", page: "safety" },
  { label: "خرید قسطی", href: "/installments", page: "installments" },
  { label: "سؤالات متداول", href: "/faq" },
];

const LEGAL_LINKS: ChromeLink[] = [
  { label: "اعتماد شما", href: "/trust", page: "trust" },
  { label: "حریم خصوصی", href: "/privacy", page: "privacy" },
  { label: "قوانین و مقررات", href: "/terms", page: "terms" },
];

function ageHubs(): NavAgeHub[] {
  return AGE_HUBS.map((hub) => ({
    slug: hub.slug,
    label: hub.label,
    href: `/age/${hub.slug}`,
    tint: AGE_STAGES.find((s) => s.hub === hub.slug)?.key ?? "0-6m",
    sections: hub.sections.map((s) => ({ label: s.label, href: `/age/${hub.slug}#${s.anchor}` })),
  }));
}

function ageStages(): NavAgeStage[] {
  return AGE_STAGES.map((s) => ({ key: s.key, label: s.label, href: `/age/${s.hub}#${s.hubAnchor}`, hub: s.hub }));
}

export async function getNavData(): Promise<NavData> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.settings, tag.categories, tag.products, tag.topics, tag.posts, tag.rooms, tag.pages);

  const settings = await getSettings();
  const published = publishedPageSlugs();
  const navCategories = loadCategories();
  const pillarGuides = loadPillarGuides();

  const footer: FooterGroup[] = [
    {
      title: "فروشگاه",
      links: [
        ...navCategories.map((c) => ({ label: c.name, href: `/shop/${c.slug}` })),
        { label: "همهٔ محصولات", href: "/shop" },
      ],
    },
    {
      title: "مجله",
      links: [
        ...pillarGuides.map((g) => ({ label: g.shortTitle, href: `/mag/${g.slug}` })),
        { label: "واژه‌نامه", href: "/glossary" },
        { label: "سن به سن", href: "/age" },
      ],
    },
    { title: "چوبز", links: present(BRAND_GROUP, published) },
    { title: "راهنمای خرید", links: present(HELP_GROUP, published) },
  ];

  return {
    categories: navCategories,
    topics: db
      .select({ slug: topics.slug, name: topics.name, accent: topics.accent })
      .from(topics)
      .orderBy(asc(topics.sortOrder), asc(topics.id))
      .all(),
    pillarGuides,
    rooms: loadRooms(),
    ageHubs: ageHubs(),
    ageStages: ageStages(),
    question: loadQuestion(),
    brandLinks: present(BRAND_LINKS, published),
    footer,
    legalLinks: present(LEGAL_LINKS, published),
    settings,
  };
}
