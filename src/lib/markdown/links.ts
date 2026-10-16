/*
 * Internal link schemes (docs/CONTENT-FORMAT.md «Internal links»). Bodies never hard-code site
 * paths; `[متن](product:learning-tower)` is mapped here, so links survive route changes.
 * An optional `#anchor` (one of the target's heading ids) is kept: `post:x#ramp-safety`.
 */

export const LINK_SCHEMES = {
  product: (slug: string) => `/product/${slug}`,
  category: (slug: string) => `/shop/${slug}`,
  post: (slug: string) => `/mag/${slug}`,
  topic: (slug: string) => `/mag/topic/${slug}`,
  term: (slug: string) => `/glossary/${slug}`,
  page: (slug: string) => `/${slug}`,
} as const;

export type LinkScheme = keyof typeof LINK_SCHEMES;

export type SiteHref = { scheme: LinkScheme; slug: string; hash: string | null };

const SCHEME_NAMES = Object.keys(LINK_SCHEMES) as LinkScheme[];
const SITE_HREF = /^([a-z]+):([a-z0-9]+(?:-[a-z0-9]+)*)(?:#([a-z0-9]+(?:-[a-z0-9]+)*))?$/;
/** Hrefs that leave the site or stay on the page; passed through untouched. */
const PASS_THROUGH = /^(?:https?:\/\/|mailto:|tel:|#|\/(?!\/))/i;
const ANY_SCHEME = /^([a-z][a-z0-9+.-]*):/i;

export function isLinkScheme(value: string): value is LinkScheme {
  return (SCHEME_NAMES as string[]).includes(value);
}

/** `post:x#y` → `{ scheme: "post", slug: "x", hash: "y" }`; null for anything that is not a well-formed site scheme. */
export function parseSiteHref(href: string): SiteHref | null {
  const match = SITE_HREF.exec(href.trim());
  if (!match || !isLinkScheme(match[1])) return null;
  return { scheme: match[1], slug: match[2], hash: match[3] ?? null };
}

export function siteHrefToPath({ scheme, slug, hash }: SiteHref): string {
  return LINK_SCHEMES[scheme](slug) + (hash ? `#${hash}` : "");
}

/**
 * Resolves a body href to the URL the page links to: site schemes become site paths
 * (`product:learning-tower` → `/product/learning-tower`); everything else is returned unchanged.
 */
export function resolveHref(href: string): string {
  const site = parseSiteHref(href);
  return site ? siteHrefToPath(site) : href;
}

export type HrefKind = "site" | "pass" | "unknown-scheme" | "malformed-site" | "relative";

/** How the pipeline should treat an href (used for validation). */
export function classifyHref(href: string): HrefKind {
  const value = href.trim();
  if (parseSiteHref(value)) return "site";
  if (PASS_THROUGH.test(value)) return "pass";
  const scheme = ANY_SCHEME.exec(value)?.[1]?.toLowerCase();
  if (scheme && isLinkScheme(scheme)) return "malformed-site";
  if (scheme) return "unknown-scheme";
  return "relative";
}

/** Links that open a new tab: anything off-site. */
export function isExternalHref(href: string): boolean {
  return /^(?:https?:)?\/\//i.test(href);
}
