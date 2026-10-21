import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { getProductCardsBySlugs, listCategories, type CategorySummary } from "@/db/queries/catalog";
import { getSettings, type NavLink, type SiteSettings } from "@/db/queries/settings";
import { posts } from "@/db/schema";
import { tag } from "@/lib/cache-tags";

/*
 * Home page reads for the cover and the toy shelf (DESIGN.md §5.1, §5.2). Settings drive the
 * story layer (hero, season, trust chips, Tati's line); products drive the truth layer (the scene
 * caption's name and «از» price, the names behind the sheet's nested outlines).
 */

export type CoverProduct = {
  slug: string;
  name: string;
  /** Lowest price the customer can pay, Toman. */
  price: number;
  /** True when variants start at `price` (the caption says «از …»). */
  from: boolean;
};

export type CoverHotspot = {
  slug: string;
  /** The product's name, read after the tag by assistive tech. */
  name: string;
  /** Mint bubble / engraved label, e.g. «این برش، آرک پیکلره!». */
  tag: string;
};

export type CoverData = {
  /** The product standing in front of the sheet; null hides the scene caption. */
  hero: CoverProduct | null;
  /** Other products' toolpaths on the sheet; only published products appear. */
  nested: CoverHotspot[];
  ctaPrimary: NavLink;
  ctaSecondary: NavLink;
  season: SiteSettings["season"];
  trust: NavLink[];
  /** Tati's greeting (first of settings.tati_captions), or null. */
  tatiCaption: string | null;
  /** «۵۰ هزار همراه در اینستاگرام» ⚑ — shown only with a count and the date it was read. */
  followers: { count: number; asOf: string; href: string | null } | null;
  /** The Yalda chip's target, when the guide is published and the season is on. */
  yaldaGuide: string | null;
};

const CTA_PRIMARY: NavLink = { label: "بریم فروشگاه", href: "/shop" };
const CTA_SECONDARY: NavLink = { label: "برای سنِ بچه‌م چی خوبه؟", href: "#height-door" };
const YALDA_GUIDE_SLUG = "yalda-gift-guide";

export async function getCover(): Promise<CoverData> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.settings, tag.products, tag.posts);
  const settings = await getSettings();
  const hero = settings.hero;
  const slugs = hero ? [hero.productSlug, ...hero.nested.map((n) => n.slug)] : [];
  const cards = await getProductCardsBySlugs(slugs);
  for (const card of cards) cacheTag(tag.product(card.id));
  const card = (slug: string) => cards.find((c) => c.slug === slug);

  const heroCard = hero ? card(hero.productSlug) : undefined;
  const nested = (hero?.nested ?? []).flatMap((n) => {
    const c = card(n.slug);
    return c ? [{ slug: c.slug, name: c.name, tag: n.tag }] : [];
  });

  const { followers, followersAsOf, instagram } = settings.socials;
  const yaldaGuide =
    settings.season === "yalda" &&
    db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.slug, YALDA_GUIDE_SLUG), eq(posts.status, "published")))
      .get()
      ? `/mag/${YALDA_GUIDE_SLUG}`
      : null;

  return {
    hero: heroCard
      ? { slug: heroCard.slug, name: heroCard.name, price: heroCard.price, from: heroCard.variantCount > 1 }
      : null,
    nested,
    ctaPrimary: hero?.ctaPrimary ?? CTA_PRIMARY,
    ctaSecondary: hero?.ctaSecondary ?? CTA_SECONDARY,
    season: settings.season,
    trust: settings.trust,
    tatiCaption: settings.tati_captions[0] ?? null,
    followers: followers && followersAsOf ? { count: followers, asOf: followersAsOf, href: instagram } : null,
    yaldaGuide,
  };
}

export type ShelfData = {
  /** Every category in shelf order, with its published product count. */
  categories: CategorySummary[];
  /** All published products, for «همهٔ محصولات ←». */
  productCount: number;
};

export async function getShelf(): Promise<ShelfData> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.categories, tag.products);
  const categories = await listCategories();
  return { categories, productCount: categories.reduce((sum, c) => sum + c.productCount, 0) };
}
