import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { tag } from "@/lib/cache-tags";

/*
 * Site settings (key/value JSON rows). Any key may be null: production renders a section part
 * only when its setting is non-null (DESIGN.md Appendix A). ⚑ values come from the workshop.
 */

export type NavLink = { label: string; href: string; icon?: string };

export type SiteSettings = {
  siteName: string;
  siteNameEn: string;
  tagline: string | null;
  description: string | null;
  announcement: string | null;
  hero: {
    productSlug: string;
    nested: { slug: string; tag: string }[];
    ctaPrimary: NavLink;
    ctaSecondary: NavLink;
  } | null;
  season: "yalda" | "nowruz" | null;
  trust: NavLink[];
  tati_captions: string[];
  engraving: { enabled: boolean; priceToman: number; maxChars: number; productSlugs: string[] } | null;
  safety_points: { title: string; body: string; href: string }[];
  workshopSteps: { title: string; body: string }[];
  shopIntro: string | null;
  org: {
    legalName: string | null;
    foundingDate: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    nationalId: string | null;
    description: string;
  };
  socials: {
    instagram: string | null;
    instagramHandle: string | null;
    bale: string | null;
    aparat: string | null;
    followers: number | null;
    followersAsOf: string | null;
  };
  enamad: { id: string; code: string; imgSrc: string; href: string } | null;
  snapppay: { enabled: boolean; count: number; minToman: number | null; maxToman: number | null } | null;
  shippingPolicy: {
    freeOverToman: number | null;
    rateToman: number | null;
    handlingDays: [number, number] | null;
    transitDays: [number, number] | null;
  } | null;
  returnPolicy: { days: number; excludedTypes: string[] } | null;
};

const DEFAULTS: SiteSettings = {
  siteName: "چوبز کیدز",
  siteNameEn: "Choobz Kids",
  tagline: null,
  description: null,
  announcement: null,
  hero: null,
  season: null,
  trust: [],
  tati_captions: [],
  engraving: null,
  safety_points: [],
  workshopSteps: [],
  shopIntro: null,
  org: {
    legalName: null,
    foundingDate: null,
    city: null,
    address: null,
    phone: null,
    email: null,
    nationalId: null,
    description:
      "چوبز کیدز سازندهٔ اسباب‌بازی و سیسمونی چوبی کودک با الهام از مونته‌سوری و والدورف است؛ همهٔ محصولات در کارگاه خود چوبز از تخته چندلایی توس ساخته می‌شوند.",
  },
  socials: { instagram: null, instagramHandle: null, bale: null, aparat: null, followers: null, followersAsOf: null },
  enamad: null,
  snapppay: null,
  shippingPolicy: null,
  returnPolicy: null,
};

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.settings);
  const rows = db.select().from(settings).all();
  const merged: Record<string, unknown> = { ...DEFAULTS };
  for (const r of rows) {
    if (r.value === null || r.value === undefined) continue;
    const base = (DEFAULTS as Record<string, unknown>)[r.key];
    merged[r.key] =
      base && typeof base === "object" && !Array.isArray(base) && typeof r.value === "object" && !Array.isArray(r.value)
        ? { ...(base as object), ...(r.value as object) }
        : r.value;
  }
  return merged as SiteSettings;
}
