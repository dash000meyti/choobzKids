import "server-only";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/env";

/*
 * Site identity, absolute URLs, machine dates and the per-page metadata helper (SEO.md §2).
 * Everything here returns plain strings so it can be used inside 'use cache' scopes.
 */

export const SITE = {
  /** Canonical origin without a trailing slash, e.g. "https://choobz.kids". */
  url: SITE_URL,
  name: "چوبز کیدز",
  alternateName: "Choobz Kids",
  alternateNames: ["Choobz Kids", "چوبز", "Choobz"],
  locale: "fa_IR",
  inLanguage: "fa-IR",
  /** Square brand mark for schema.org `logo` and the RSS image (≥ 112 px, crawlable PNG; scripts/brand/icons.ts). */
  logo: {
    path: "/icon-512.png",
    width: 512,
    height: 512,
    caption: "لوگوی چوبز کیدز: اردک چوبی روی گاری چرخ‌دار",
  },
  rss: { path: "/mag/rss.xml", title: "مجله چوبز" },
} as const;

export const BRAND_SUFFIX = ` | ${SITE.name}`;

/**
 * Absolute URL on the canonical origin. The home page is returned without a trailing slash
 * ("https://choobz.kids"), everything else exactly as given. Absolute inputs pass through.
 */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const url = new URL(path, `${SITE.url}/`);
  const href = url.toString();
  return url.pathname === "/" && !url.search && !url.hash ? href.slice(0, -1) : href;
}

/* ------------------------------------------------------------------ */
/* Machine dates: ISO 8601 with Tehran's fixed +03:30 offset (no DST)   */
/* ------------------------------------------------------------------ */

const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;

function shifted(value: Date | string | number): Date {
  return new Date(new Date(value).getTime() + TEHRAN_OFFSET_MS);
}

/** "2026-10-16T10:00:00+03:30" — JSON-LD, Torob, `article:*` meta. */
export function isoTehran(value: Date | string | number): string {
  return `${shifted(value).toISOString().slice(0, 19)}+03:30`;
}

/** "2026-10-16" in Tehran — schema.org Date values and llms.txt stamps. */
export function dateTehran(value: Date | string | number): string {
  return shifted(value).toISOString().slice(0, 10);
}

const RFC822_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RFC822_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Fri, 16 Oct 2026 10:00:00 +0330" — RSS `pubDate` / `lastBuildDate`. */
export function rfc822Tehran(value: Date | string | number): string {
  const d = shifted(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${RFC822_DAYS[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${RFC822_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0330`
  );
}

/* ------------------------------------------------------------------ */
/* Titles and descriptions (SEO.md §2.2)                                */
/* ------------------------------------------------------------------ */

const length = (s: string) => [...s].length;

/**
 * Adds the brand suffix when the result stays within `max` characters and the title carries no
 * suffix yet (DB `seoTitle`s often end in « | چوبز کیدز» or « | چوبز»; « | » is reserved for it).
 */
export function composeTitle(core: string, suffix: string | false = BRAND_SUFFIX, max = 60): string {
  const title = core.trim();
  if (!suffix || title.includes(" | ") || title.includes(SITE.name)) return title;
  return length(title + suffix) <= max ? title + suffix : title;
}

/** og:title is the title without a trailing brand suffix (« | چوبز کیدز», « | مجله چوبز»…). */
function stripSuffix(title: string): string {
  return title.replace(/ \| [^|]*چوبز[^|]*$/, "").trim();
}

/** Collapses whitespace and cuts at a word boundary with «…» past `max` (160 = the description hard max). */
export function clampText(text: string, max = 160): string {
  const chars = [...text.replace(/\s+/g, " ").trim()];
  if (chars.length <= max) return chars.join("");
  const cut = chars.slice(0, max - 1).join("");
  const space = cut.lastIndexOf(" ");
  return `${space > max / 2 ? cut.slice(0, space) : cut}…`;
}

/* ------------------------------------------------------------------ */
/* pageMetadata()                                                        */
/* ------------------------------------------------------------------ */

export type PageSeoImage = { url: string; width: number; height: number; alt?: string; type?: string };

export type PageSeo = {
  /** Core title without the brand suffix (the suffix is added when it fits). */
  title: string;
  description: string;
  /** Canonical path built from route params, never from the request URL. */
  path: string;
  /** 1200×630 JPEG for og:image. Omit to use the site card (or the segment's own, see below). */
  image?: PageSeoImage;
  /**
   * The route has its own `opengraph-image` file. Next only applies a file-based image when the
   * page's metadata has no `openGraph.images` key at all, so the key is then left out.
   */
  ownOgImage?: boolean;
  type?: "website" | "article" | "profile";
  publishedTime?: Date | string | null;
  modifiedTime?: Date | string | null;
  noindex?: boolean;
  /** Extra `<meta name>` tags, e.g. `torobMeta(product)`. */
  other?: Record<string, string>;
  /** Title suffix: defaults to « | چوبز کیدز»; e.g. « | مجله چوبز» on topic hubs, `false` for none. */
  suffix?: string | false;
  /** Markdown alternate (e.g. "/mag/learning-tower-guide.md") → `<link rel="alternate" type="text/markdown">`. */
  markdownPath?: string;
  /** `article:author` profile paths, e.g. ["/team/montessori-guide"]. */
  authors?: string[];
  /** `article:section` (topic name). */
  section?: string;
  /** `article:tag`, at most 5 are emitted. */
  tags?: string[];
};

/**
 * Per-page metadata. Nested `alternates`/`openGraph` objects REPLACE the root layout's (Next merges
 * metadata shallowly), so the RSS link, siteName and locale are repeated on every page.
 */
/** The site-wide card (app/opengraph-image.tsx). */
const SITE_OG_IMAGE = {
  url: absoluteUrl("/opengraph-image"),
  width: 1200,
  height: 630,
  alt: "چوبز کیدز: اسباب‌بازی و وسایل چوبی مونته‌سوری، ساخت کارگاه چوبز",
  type: "image/png",
};

export function pageMetadata(p: PageSeo): Metadata {
  const title = composeTitle(p.title, p.suffix);
  const ogTitle = stripSuffix(p.title.trim());
  const description = clampText(p.description);
  const url = absoluteUrl(p.path);
  const images = p.image
    ? [{ url: absoluteUrl(p.image.url), width: p.image.width, height: p.image.height, alt: p.image.alt, type: p.image.type }]
    : p.ownOgImage
      ? undefined
      : [SITE_OG_IMAGE];

  const types: Record<string, { url: string; title?: string }[]> = {
    "application/rss+xml": [{ url: SITE.rss.path, title: SITE.rss.title }],
  };
  if (p.markdownPath) types["text/markdown"] = [{ url: p.markdownPath }];

  // A page's openGraph replaces the root's, so the inherited site card has to be restated here.
  const common = { siteName: SITE.name, locale: SITE.locale, url, title: ogTitle, description, ...(images ? { images } : {}) };
  const openGraph: Metadata["openGraph"] =
    p.type === "article"
      ? {
          ...common,
          type: "article",
          publishedTime: p.publishedTime ? isoTehran(p.publishedTime) : undefined,
          modifiedTime: p.modifiedTime ? isoTehran(p.modifiedTime) : undefined,
          authors: p.authors?.map((a) => absoluteUrl(a)),
          section: p.section,
          tags: p.tags?.slice(0, 5),
        }
      : { ...common, type: p.type ?? "website" };

  return {
    title: { absolute: title },
    description,
    // A noindex page carries no canonical: never combine noindex with a canonical (SEO.md §2.4).
    alternates: { ...(p.noindex ? {} : { canonical: url }), types },
    openGraph,
    twitter: { card: "summary_large_image", title: ogTitle, description, ...(images ? { images: images.map((i) => i.url) } : {}) },
    ...(p.noindex ? { robots: { index: false, follow: true } } : {}),
    ...(p.other && Object.keys(p.other).length ? { other: p.other } : {}),
  };
}
