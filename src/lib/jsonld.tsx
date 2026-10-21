import type {
  AggregateRating,
  Article,
  Brand,
  BreadcrumbList,
  Country,
  CreativeWork,
  DefinedTerm,
  DefinedTermSet,
  FAQPage,
  Graph,
  HowTo,
  IdReference,
  ImageObject,
  ItemList,
  MerchantReturnPolicy,
  Offer,
  OfferShippingDetails,
  OnlineStore,
  Organization,
  PeopleAudience,
  Person,
  Product,
  ProductGroup,
  PropertyValue,
  QuantitativeValue,
  Review,
  SearchAction,
  ShippingConditions,
  ShippingService,
  Thing,
  UnitPriceSpecification,
  VideoObject,
  WebPage,
  WebSite,
  WithActionConstraints,
  WithContext,
} from "schema-dts";
import type { SiteSettings } from "@/db/queries/settings";
import type { Dimensions, ProductSpec, Source } from "@/db/schema";
import { formatAgeRange, toFaDigits, tomanToRial } from "@/lib/format";
import { absoluteUrl, dateTehran, isoTehran, SITE } from "@/lib/seo";
import { illustrationUrl, mediaUrl, renderName } from "@/lib/utils";

/** A stable image URL for structured data: the studio render file itself, else the drawing. */
const pictureUrl = (key: string) => {
  const render = renderName(key, "assembled");
  return render ? `/renders/${render}.webp` : illustrationUrl(key, "assembled");
};

/*
 * schema.org JSON-LD (SEO.md §3). Every builder returns plain nodes with stable @ids (§3.1);
 * pages combine them with `graph(...)` and render ONE <JsonLd> in the server component.
 * The root layout already emits the site graph (OnlineStore with the shipping/return policies,
 * Brand, WebSite), so page graphs only reference those by @id.
 * Machine values: Latin digits, prices in IRR (Toman × 10), dates with +03:30.
 */

/* ------------------------------------------------------------------ */
/* Rendering                                                            */
/* ------------------------------------------------------------------ */

type NodeInput = Thing | readonly NodeInput[] | null | undefined | false;

/** `{"@context","@graph"}` from any mix of nodes, node arrays and skipped (falsy) entries. */
export function graph(...nodes: NodeInput[]): Graph {
  const flat: Thing[] = [];
  const walk = (n: NodeInput) => {
    if (!n) return;
    if (Array.isArray(n)) n.forEach(walk);
    else flat.push(n as Thing);
  };
  nodes.forEach(walk);
  return { "@context": "https://schema.org", "@graph": flat };
}

/** Server-rendered `<script type="application/ld+json">`; `<` is escaped so content can't close the tag. */
export function JsonLd({ data }: { data: Graph | WithContext<Thing> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Stable @ids (SEO.md §3.1)                                             */
/* ------------------------------------------------------------------ */

function at(path: string, fragment: string): string {
  const url = new URL(absoluteUrl(path));
  url.hash = fragment;
  return url.toString();
}

export const ids = {
  organization: () => at("/", "organization"),
  brand: () => at("/", "brand"),
  logo: () => at("/", "logo"),
  website: () => at("/", "website"),
  shippingPolicy: () => at("/shipping", "policy"),
  returnPolicy: () => at("/returns", "policy"),
  webpage: (path: string) => at(path, "webpage"),
  breadcrumb: (path: string) => at(path, "breadcrumb"),
  primaryImage: (path: string) => at(path, "primaryimage"),
  itemList: (path: string) => at(path, "itemlist"),
  faq: (path: string) => at(path, "faq"),
  howto: (path: string) => at(path, "howto"),
  video: (path: string, n: number) => at(path, `video-${n}`),
  /** `query` selects a variant, e.g. "color=white" → …/product/x?color=white#product. */
  product: (slug: string, query?: string) => at(`/product/${slug}${query ? `?${query}` : ""}`, "product"),
  article: (slug: string) => at(`/mag/${slug}`, "article"),
  person: (slug: string) => at(`/team/${slug}`, "person"),
  termSet: () => at("/glossary", "termset"),
  term: (slug: string) => at(`/glossary/${slug}`, "term"),
} as const;

export const ref = (id: string): IdReference => ({ "@id": id });

/* ------------------------------------------------------------------ */
/* Shared value helpers                                                  */
/* ------------------------------------------------------------------ */

const INSTOCK = "https://schema.org/InStock" as const;
const AVAILABILITY = {
  in_stock: INSTOCK,
  out_of_stock: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
  // Google's list has no MadeToOrder; the lead time goes into the shipping details instead.
  made_to_order: INSTOCK,
} as const;

export type ProductAvailability = keyof typeof AVAILABILITY;

/** Months → years with at most one decimal (Google reads suggested ages in years). */
const years = (months: number) => Math.round((months / 12) * 10) / 10;

const days = (range: readonly [number, number]): QuantitativeValue => ({
  "@type": "QuantitativeValue",
  minValue: range[0],
  maxValue: range[1],
  unitCode: "DAY",
});

const irr = (toman: number) => ({ "@type": "MonetaryAmount" as const, currency: "IRR", value: tomanToRial(toman) });

const IRAN: Country = { "@type": "Country", name: "ایران", sameAs: "https://www.wikidata.org/wiki/Q794" };

const nonNull = (nodes: (Thing | null)[]): Thing[] => nodes.filter((n): n is Thing => n !== null);

const unique = <T,>(values: (T | null | undefined | false | "")[]): T[] =>
  [...new Set(values.filter((v): v is T => !!v))];

/** Inline Markdown → the plain text a reader sees (links, emphasis, code and list markers removed). */
function plainText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}(?:#{1,6}|>|[-*+]|\d+[.)])\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type LdImage = {
  /** Path relative to UPLOAD_DIR (a `media.path`). */
  path?: string | null;
  /** Site path or absolute URL, e.g. an `/illustrations/*.svg` drawing. Used when `path` is empty. */
  url?: string | null;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  caption?: string | null;
  credit?: string | null;
};

/** Pixel sizes as plain numbers, as Google documents them (schema-dts only types Distance strings). */
const pixels = (width?: number | null, height?: number | null): object => ({
  ...(width ? { width } : {}),
  ...(height ? { height } : {}),
});

const imageUrl = (img: LdImage) => absoluteUrl(img.path ? mediaUrl(img.path) : (img.url ?? "/"));

/** `{canonical}#primaryimage` ImageObject; it is also the page's `primaryImageOfPage`. */
export function imageNode(pagePath: string, img: LdImage): ImageObject {
  const url = imageUrl(img);
  const caption = img.caption || img.alt;
  return {
    "@type": "ImageObject",
    "@id": ids.primaryImage(pagePath),
    url,
    contentUrl: url,
    ...pixels(img.width, img.height),
    ...(caption ? { caption } : {}),
    creditText: img.credit || SITE.name,
    copyrightNotice: `© ${img.credit || SITE.name}`,
  };
}

/* ------------------------------------------------------------------ */
/* Entities (Wikidata register, SEO.md §3.2)                             */
/* ------------------------------------------------------------------ */

type KnownEntity = { name: string; type?: "Person" | "Organization" | "Country"; enwiki?: string };

const WIKIDATA: Record<string, KnownEntity> = {
  Q190218: { name: "روش مونته‌سوری", enwiki: "Montessori_education" },
  Q131117: { name: "ماریا مونته‌سوری", type: "Person", enwiki: "Maria_Montessori" },
  Q6905449: { name: "مواد حسی مونته‌سوری", enwiki: "Montessori_sensorial_materials" },
  Q469559: { name: "امی پیکلر", type: "Person", enwiki: "Emmi_Pikler" },
  Q2094807: { name: "مؤسسهٔ پیکلر", type: "Organization" },
  Q15046891: { name: "مگدا گربر", type: "Person", enwiki: "Magda_Gerber" },
  Q24534592: { name: "رای (RIE)", type: "Organization", enwiki: "Resources_for_Infant_Educarers" },
  Q216690: { name: "آموزش والدورف", enwiki: "Waldorf_education" },
  Q78484: { name: "رودلف اشتاینر", type: "Person", enwiki: "Rudolf_Steiner" },
  Q2137580: { name: "رویکرد رجیو", enwiki: "Reggio_Emilia_approach" },
  Q1454704: { name: "بازی آزاد", enwiki: "Free_play" },
  Q407784: { name: "رشد کودک", enwiki: "Child_development" },
  Q5610504: { name: "مهارت حرکتی درشت", enwiki: "Gross_motor_skill" },
  Q46627: { name: "مهارت حرکتی ظریف", enwiki: "Fine_motor_skill" },
  Q1129066: { name: "حس عمقی", enwiki: "Proprioception" },
  Q596832: { name: "سیستم دهلیزی", enwiki: "Vestibular_system" },
  Q1340307: { name: "کودک نوپا", enwiki: "Toddler" },
  Q998: { name: "نوزاد", enwiki: "Infant" },
  Q11422: { name: "اسباب‌بازی", enwiki: "Toy" },
  Q16319458: { name: "اسباب‌بازی چوبی" },
  Q7830552: { name: "ایمنی اسباب‌بازی", enwiki: "Toy_safety" },
  Q1856307: { name: "نردبان سوئدی", enwiki: "Wall_bars" },
  Q14963: { name: "صندلی گهواره‌ای", enwiki: "Rocking_chair" },
  Q215857: { name: "قفسهٔ کتاب", enwiki: "Bookcase" },
  Q16836622: { name: "مبلمان کودک", enwiki: "Baby_furniture" },
  Q1741939: { name: "اتاق کودک", enwiki: "Nursery_(room)" },
  Q219803: { name: "تخته چندلایی", enwiki: "Plywood" },
  Q25243: { name: "توس", enwiki: "Birch" },
  Q25403: { name: "راش", enwiki: "Beech" },
  Q818405: { name: "روغن بزرک", enwiki: "Linseed_oil" },
  Q794: { name: "ایران", type: "Country", enwiki: "Iran" },
  Q9168: { name: "زبان فارسی", enwiki: "Persian_language" },
};

const WIKIDATA_URL = /^https:\/\/www\.wikidata\.org\/wiki\/(Q\d+)$/;

/** Percent-encoded fa.wikipedia URLs stay out of JSON-LD; they are linked visibly instead (§3.2). */
export function sameAsUrls(urls: readonly string[]): string[] {
  return urls.filter((u) => /^https:\/\//.test(u) && !/^https:\/\/fa\.wikipedia\.org\//.test(u));
}

function knownEntity(qid: string, extraSameAs: string[] = []): Thing {
  const e = WIKIDATA[qid];
  const sameAs = unique([
    `https://www.wikidata.org/wiki/${qid}`,
    e?.enwiki ? `https://en.wikipedia.org/wiki/${e.enwiki}` : null,
    ...extraSameAs,
  ]);
  return { "@type": e?.type ?? "Thing", name: e?.name ?? qid, sameAs } as Thing;
}

/**
 * One entity reference from a Wikidata QID ("Q190218"), a Wikidata URL, or a glossary slug
 * ("pikler-triangle" → its DefinedTerm @id, the canonical entity when Wikidata has none).
 */
export function entity(key: string): Thing | IdReference {
  const qid = /^Q\d+$/.test(key) ? key : key.match(WIKIDATA_URL)?.[1];
  return qid ? knownEntity(qid) : ref(ids.term(key));
}

/**
 * Splits a `sameAs` list (topics, terms) into entities: each Wikidata URL starts a new entity and
 * the Wikipedia URLs after it attach to it. Unknown entities take `fallbackName` (first one) or
 * their English Wikipedia title.
 */
export function entitiesFromSameAs(urls: readonly string[], fallbackName: string): Thing[] {
  const groups: string[][] = [];
  for (const url of sameAsUrls(urls)) {
    if (WIKIDATA_URL.test(url) || !groups.length) groups.push([url]);
    else groups[groups.length - 1].push(url);
  }
  return groups.map((group, i) => {
    const qid = group[0].match(WIKIDATA_URL)?.[1];
    if (qid && WIKIDATA[qid]) return knownEntity(qid, group);
    const enTitle = group.find((u) => u.startsWith("https://en.wikipedia.org/wiki/"))?.split("/wiki/")[1];
    const name = i === 0 ? fallbackName : enTitle ? decodeURIComponent(enTitle).replace(/_/g, " ") : fallbackName;
    return { "@type": "Thing", name, sameAs: group } as Thing;
  });
}

/* ------------------------------------------------------------------ */
/* Organisation, brand, website (site graph, SEO.md §3.4)               */
/* ------------------------------------------------------------------ */

export function logoNode(): ImageObject {
  const url = absoluteUrl(SITE.logo.path);
  return {
    "@type": "ImageObject",
    "@id": ids.logo(),
    url,
    contentUrl: url,
    ...pixels(SITE.logo.width, SITE.logo.height),
    caption: SITE.logo.caption,
  };
}

/** Org-level return policy (`/returns#policy`), or null while the setting is unset. */
export function returnPolicyNode(settings: SiteSettings): MerchantReturnPolicy | null {
  const rp = settings.returnPolicy;
  if (!rp) return null;
  return {
    "@type": "MerchantReturnPolicy",
    "@id": ids.returnPolicy(),
    applicableCountry: "IR",
    returnPolicyCountry: "IR",
    ...(rp.days > 0
      ? { returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: rp.days }
      : { returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted" }),
    merchantReturnLink: absoluteUrl("/returns"),
  };
}

/** Org-level shipping service (`/shipping#policy`) with only the facts the settings hold. */
export function shippingServiceNode(settings: SiteSettings): ShippingService | null {
  const sp = settings.shippingPolicy;
  if (!sp) return null;
  const destination = { "@type": "DefinedRegion" as const, addressCountry: "IR" };
  const transitTime = sp.transitDays ? { "@type": "ServicePeriod" as const, duration: days(sp.transitDays) } : undefined;
  const condition = (extra: Partial<Exclude<ShippingConditions, string>>): ShippingConditions => ({
    "@type": "ShippingConditions",
    shippingDestination: destination,
    ...extra,
    ...(transitTime ? { transitTime } : {}),
  });

  const conditions: ShippingConditions[] = [];
  if (sp.freeOverToman != null) {
    conditions.push(
      condition({
        orderValue: { "@type": "MonetaryAmount", currency: "IRR", minValue: tomanToRial(sp.freeOverToman) },
        shippingRate: irr(0),
      }),
    );
    if (sp.rateToman != null) {
      conditions.push(
        condition({
          orderValue: { "@type": "MonetaryAmount", currency: "IRR", maxValue: tomanToRial(sp.freeOverToman) - 10 },
          shippingRate: irr(sp.rateToman),
        }),
      );
    }
  } else {
    conditions.push(condition(sp.rateToman != null ? { shippingRate: irr(sp.rateToman) } : {}));
  }

  return {
    "@type": "ShippingService",
    "@id": ids.shippingPolicy(),
    name: "ارسال به سراسر ایران",
    fulfillmentType: "https://schema.org/FulfillmentTypeDelivery",
    ...(sp.handlingDays ? { handlingTime: { "@type": "ServicePeriod", duration: days(sp.handlingDays) } } : {}),
    shippingConditions: conditions,
  };
}

const KNOWS_ABOUT = ["Q190218", "Q216690", "Q469559", "Q1454704", "Q16319458", "Q219803"];

/**
 * The store. Full by default (home, /about and the root layout's site graph), with the shipping
 * and return policies defined here once; `compact` is the five-field form of SEO.md §3.1.4.
 * Optional fields appear only when their setting is non-null.
 */
export function orgNode(settings: SiteSettings, opts: { compact?: boolean } = {}): OnlineStore {
  const { org, socials } = settings;
  const sameAs = unique([socials.instagram, socials.bale, socials.aparat]);
  const base = {
    "@type": "OnlineStore" as const,
    "@id": ids.organization(),
    name: settings.siteName || SITE.name,
    url: absoluteUrl("/"),
    ...(sameAs.length ? { sameAs } : {}),
  };
  if (opts.compact) return { ...base, logo: absoluteUrl(SITE.logo.path) };

  const contactPoints = [
    org.phone || org.email
      ? {
          "@type": "ContactPoint" as const,
          contactType: "customer support",
          ...(org.phone ? { telephone: org.phone } : {}),
          ...(org.email ? { email: org.email } : {}),
          availableLanguage: ["fa"],
          areaServed: "IR",
        }
      : null,
    socials.bale
      ? {
          "@type": "ContactPoint" as const,
          contactType: "customer support",
          name: "پشتیبانی در پیام‌رسان بله",
          url: socials.bale,
          availableLanguage: ["fa"],
        }
      : null,
  ].filter((c) => c !== null);
  const returnPolicy = returnPolicyNode(settings);
  const shipping = shippingServiceNode(settings);

  return {
    ...base,
    alternateName: unique([settings.siteNameEn, ...SITE.alternateNames]),
    ...(org.legalName ? { legalName: org.legalName } : {}),
    logo: logoNode(),
    image: ref(ids.logo()),
    description: org.description,
    ...(settings.tagline ? { slogan: settings.tagline } : {}),
    ...(org.foundingDate ? { foundingDate: org.foundingDate } : {}),
    ...(org.address || org.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(org.address ? { streetAddress: org.address } : {}),
            ...(org.city ? { addressLocality: org.city } : {}),
            addressCountry: "IR",
          },
        }
      : {}),
    ...(org.phone ? { telephone: org.phone } : {}),
    ...(org.email ? { email: org.email } : {}),
    ...(contactPoints.length ? { contactPoint: contactPoints } : {}),
    areaServed: IRAN,
    knowsAbout: KNOWS_ABOUT.map((q) => knownEntity(q)),
    ...(org.nationalId
      ? { identifier: { "@type": "PropertyValue", propertyID: "IR-NationalID", name: "شناسهٔ ملی", value: org.nationalId } }
      : {}),
    ...(settings.enamad
      ? {
          hasCertification: {
            "@type": "Certification",
            name: "نماد اعتماد الکترونیکی (اینماد)",
            issuedBy: { "@type": "Organization", name: "مرکز توسعهٔ تجارت الکترونیکی", url: "https://enamad.ir" },
            certificationIdentification: settings.enamad.id,
            url: settings.enamad.href,
          },
        }
      : {}),
    ...(returnPolicy ? { hasMerchantReturnPolicy: returnPolicy } : {}),
    ...(shipping ? { hasShippingService: shipping } : {}),
  };
}

export function brandNode(settings?: SiteSettings): Brand {
  return {
    "@type": "Brand",
    "@id": ids.brand(),
    name: settings?.siteName || SITE.name,
    alternateName: settings?.siteNameEn || SITE.alternateName,
    logo: ref(ids.logo()),
    url: absoluteUrl("/"),
  };
}

export function websiteNode(): WebSite {
  const search: WithActionConstraints<SearchAction> = {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  };
  return {
    "@type": "WebSite",
    "@id": ids.website(),
    url: absoluteUrl("/"),
    name: SITE.name,
    alternateName: unique([SITE.alternateName, "چوبز", new URL(SITE.url).host]),
    inLanguage: SITE.inLanguage,
    publisher: ref(ids.organization()),
    potentialAction: search,
  };
}

/** The site-wide graph the root layout renders on every page. */
export function siteNodes(settings: SiteSettings): Thing[] {
  return [orgNode(settings), brandNode(settings), websiteNode()];
}

/* ------------------------------------------------------------------ */
/* Page-level nodes                                                      */
/* ------------------------------------------------------------------ */

export type WebPageType =
  | "WebPage"
  | "ItemPage"
  | "CollectionPage"
  | "AboutPage"
  | "ContactPage"
  | "ProfilePage"
  | "FAQPage"
  | "SearchResultsPage";

export type AgeRange = { minMonths: number | null; maxMonths: number | null };

function peopleAudience(range: AgeRange | null | undefined, audienceType?: string): PeopleAudience | null {
  if (!range || (range.minMonths == null && range.maxMonths == null)) return null;
  return {
    "@type": "PeopleAudience",
    ...(audienceType ? { audienceType } : {}),
    ...(range.minMonths != null ? { suggestedMinAge: years(range.minMonths) } : {}),
    ...(range.maxMonths != null ? { suggestedMaxAge: years(range.maxMonths) } : {}),
  };
}

export type WebPageInput = {
  /** Canonical path, e.g. "/shop/climbing". */
  path: string;
  /** The `<title>` core (without the brand suffix). */
  name: string;
  type?: WebPageType;
  description?: string | null;
  /** Links `{canonical}#breadcrumb` (add `breadcrumbNode` to the same graph). */
  breadcrumb?: boolean;
  /** Links `{canonical}#primaryimage` (add `imageNode` to the same graph). */
  primaryImage?: boolean;
  /** An @id string, or an inline node (e.g. the Person on a ProfilePage). */
  mainEntity?: string | Thing | null;
  about?: Thing | IdReference | (Thing | IdReference)[] | null;
  hasPart?: string[];
  audience?: AgeRange | null;
  datePublished?: Date | string | null;
  dateModified?: Date | string | null;
  /** Reviewer (`reviewedBy` belongs to WebPage, never Article). */
  reviewedBy?: IdReference | Person | Organization | null;
  lastReviewed?: Date | string | null;
};

export function webPageNode(p: WebPageInput): WebPage {
  const audience = peopleAudience(p.audience);
  const node = {
    "@type": p.type ?? "WebPage",
    "@id": ids.webpage(p.path),
    url: absoluteUrl(p.path),
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    isPartOf: ref(ids.website()),
    ...(p.breadcrumb ? { breadcrumb: ref(ids.breadcrumb(p.path)) } : {}),
    ...(p.primaryImage ? { primaryImageOfPage: ref(ids.primaryImage(p.path)) } : {}),
    ...(p.mainEntity ? { mainEntity: typeof p.mainEntity === "string" ? ref(p.mainEntity) : p.mainEntity } : {}),
    ...(p.about ? { about: p.about } : {}),
    ...(p.hasPart?.length ? { hasPart: p.hasPart.map(ref) } : {}),
    ...(audience ? { audience } : {}),
    ...(p.reviewedBy ? { reviewedBy: p.reviewedBy } : {}),
    ...(p.lastReviewed ? { lastReviewed: dateTehran(p.lastReviewed) } : {}),
    inLanguage: SITE.inLanguage,
    ...(p.datePublished ? { datePublished: isoTehran(p.datePublished) } : {}),
    ...(p.dateModified ? { dateModified: isoTehran(p.dateModified) } : {}),
  };
  return node as WebPage;
}

export type BreadcrumbItem = { name: string; path: string };

/**
 * The visible trail, home first, current page last (its `path` sets the @id; its `item` is omitted
 * as in SEO.md §3.5.1). Names must match the rendered breadcrumb exactly.
 */
export function breadcrumbNode(items: readonly BreadcrumbItem[]): BreadcrumbList {
  const current = items[items.length - 1];
  return {
    "@type": "BreadcrumbList",
    "@id": ids.breadcrumb(current?.path ?? "/"),
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(i < items.length - 1 ? { item: absoluteUrl(it.path) } : {}),
    })),
  };
}

export type ListEntry = string | { path: string; name?: string | null };

/** URL-only ItemList (the "summary page" pattern): full markup lives on each item's own page. */
export function itemListNode(
  items: readonly ListEntry[],
  opts: { path?: string; order?: "ascending" | "descending" | "unordered" } = {},
): ItemList {
  const order = {
    ascending: "https://schema.org/ItemListOrderAscending",
    descending: "https://schema.org/ItemListOrderDescending",
    unordered: "https://schema.org/ItemListUnordered",
  } as const;
  return {
    "@type": "ItemList",
    ...(opts.path ? { "@id": ids.itemList(opts.path) } : {}),
    numberOfItems: items.length,
    ...(opts.order ? { itemListOrder: order[opts.order] } : {}),
    itemListElement: items.map((entry, i) => {
      const it = typeof entry === "string" ? { path: entry, name: null } : entry;
      return { "@type": "ListItem", position: i + 1, url: absoluteUrl(it.path), ...(it.name ? { name: it.name } : {}) };
    }),
  };
}

export type CollectionInput = Omit<WebPageInput, "type" | "mainEntity"> & {
  /** Visible order; products, articles or both (age hubs). */
  items: readonly ListEntry[];
  order?: "ascending" | "descending" | "unordered";
};

/** CollectionPage + its url-only ItemList (shop, categories, mag, topic and age hubs, rooms). No ratings. */
export function collectionNodes(c: CollectionInput): [WebPage, ItemList] {
  const { items, order, ...page } = c;
  return [
    webPageNode({ ...page, type: "CollectionPage", mainEntity: ids.itemList(c.path) }),
    itemListNode(items, { path: c.path, order }),
  ];
}

export type FaqItem = { question: string; answer: string };

/**
 * FAQPage from the visible Q&As (answers may be Markdown; the text is the rendered text).
 * `asPage` makes it the page node itself, as on /faq.
 */
export function faqNode(
  faqs: readonly FaqItem[],
  pagePath: string,
  opts: { asPage?: { name: string; description?: string | null; breadcrumb?: boolean } } = {},
): FAQPage {
  const mainEntity = faqs.map((f) => ({
    "@type": "Question" as const,
    name: plainText(f.question),
    acceptedAnswer: { "@type": "Answer" as const, text: plainText(f.answer) },
  }));
  if (!opts.asPage) return { "@type": "FAQPage", "@id": ids.faq(pagePath), mainEntity };
  return {
    "@type": "FAQPage",
    "@id": ids.webpage(pagePath),
    url: absoluteUrl(pagePath),
    name: opts.asPage.name,
    ...(opts.asPage.description ? { description: opts.asPage.description } : {}),
    isPartOf: ref(ids.website()),
    ...(opts.asPage.breadcrumb ? { breadcrumb: ref(ids.breadcrumb(pagePath)) } : {}),
    inLanguage: SITE.inLanguage,
    mainEntity,
  };
}

export type HowToInput = {
  path: string;
  name: string;
  description?: string | null;
  /** Steps in visible order; their anchors are `#step-{n}` (1-based). */
  steps: readonly { name?: string | null; text: string }[];
  /** ISO 8601 duration, e.g. "PT45M". */
  totalTime?: string | null;
  tools?: string[];
  supplies?: string[];
};

/** HowTo for `format = "howto"` posts only, generated from the steps block (SEO.md §3.5.11). */
export function howToNode(h: HowToInput): HowTo {
  return {
    "@type": "HowTo",
    "@id": ids.howto(h.path),
    name: h.name,
    ...(h.description ? { description: h.description } : {}),
    ...(h.totalTime ? { totalTime: h.totalTime } : {}),
    ...(h.tools?.length ? { tool: h.tools.map((name) => ({ "@type": "HowToTool" as const, name })) } : {}),
    ...(h.supplies?.length ? { supply: h.supplies.map((name) => ({ "@type": "HowToSupply" as const, name })) } : {}),
    step: h.steps.map((s, i) => ({
      "@type": "HowToStep" as const,
      position: i + 1,
      ...(s.name ? { name: plainText(s.name) } : {}),
      text: plainText(s.text),
      url: `${absoluteUrl(h.path)}#step-${i + 1}`,
    })),
  };
}

export type VideoInput = {
  path: string;
  /** 1-based position on the page → `#video-{n}`. */
  index: number;
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: Date | string;
  /** ISO 8601 duration, e.g. "PT1M45S". */
  duration?: string | null;
  contentUrl?: string | null;
  embedUrl?: string | null;
  /** Mirrors the visible transcript. */
  transcript?: string | null;
};

export function videoNode(v: VideoInput): VideoObject {
  return {
    "@type": "VideoObject",
    "@id": ids.video(v.path, v.index),
    name: v.name,
    description: v.description,
    thumbnailUrl: [absoluteUrl(v.thumbnailUrl)],
    uploadDate: isoTehran(v.uploadDate),
    ...(v.duration ? { duration: v.duration } : {}),
    ...(v.contentUrl ? { contentUrl: absoluteUrl(v.contentUrl) } : {}),
    ...(v.embedUrl ? { embedUrl: v.embedUrl } : {}),
    inLanguage: SITE.inLanguage,
    creator: ref(ids.organization()),
    publisher: ref(ids.organization()),
    ...(v.transcript ? { transcript: v.transcript } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* Products (SEO.md §3.5.3–3.5.4, §3.5.10)                               */
/* ------------------------------------------------------------------ */

export type VariantLdInput = {
  id: number;
  name: string;
  sku: string | null;
  /** Toman; null = the product price. */
  price: number | null;
  /** e.g. { "رنگ": "طبیعی" } */
  options: Record<string, string>;
  /** Preselect query, e.g. "color=white". Falls back to `variant={id}`. */
  urlParam: string | null;
  image?: LdImage | null;
};

export type ProductLdInput = {
  id: number;
  slug: string;
  name: string;
  summary: string;
  sku: string | null;
  /** Toman. */
  price: number;
  compareAtPrice: number | null;
  availability: ProductAvailability;
  leadTimeDays: number | null;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  material: string | null;
  finish?: string | null;
  dimensions: Dimensions | null;
  weightKg: number | null;
  maxLoadKg: number | null;
  /** Rows of the visible «مشخصات» table. */
  specs: ProductSpec[];
  warrantyMonths: number | null;
  alternateNames: string[];
  illustration: string | null;
  updatedAt?: Date | string | null;
  category: { slug: string; name: string };
  /** Gallery in visible order; the first is the primary image. Empty → the manifest drawing. */
  images?: LdImage[];
  variants?: VariantLdInput[];
};

export type ReviewLdInput = {
  authorName: string;
  rating: number;
  body: string;
  createdAt: Date | string;
  status?: "pending" | "approved" | "rejected";
  isSample?: boolean;
};

export type ProductLdContext = {
  settings: SiteSettings;
  /** The page `<title>` core, e.g. «برج یادگیری مونته‌سوری چوبی؛ قیمت و خرید». */
  pageName?: string;
  /** Visible trail: خانه › فروشگاه › {category} › {product}. Adds BreadcrumbList. */
  breadcrumb?: BreadcrumbItem[];
  /** Visible product FAQs. Adds FAQPage. */
  faqs?: FaqItem[];
  /** Published related products (`product_relations`). */
  relatedSlugs?: string[];
  /** Products this one is an accessory for (e.g. the ramp → the triangle). */
  accessoryForSlugs?: string[];
  /** Published articles that feature this product (`post_products` reversed). */
  articleSlugs?: string[];
  /** Approved reviews; samples never become schema.org Review. */
  reviews?: ReviewLdInput[];
  /** "YYYY-MM-DD", in the future — see `getPriceValidUntil()` in `@/db/queries/seo`. */
  priceValidUntil?: string | null;
  dateModified?: Date | string | null;
};

const VARIES_BY: Record<string, { property: string; field: "color" | "size" | "material" | "pattern" }> = {
  رنگ: { property: "https://schema.org/color", field: "color" },
  اندازه: { property: "https://schema.org/size", field: "size" },
  سایز: { property: "https://schema.org/size", field: "size" },
  عرض: { property: "https://schema.org/size", field: "size" },
  جنس: { property: "https://schema.org/material", field: "material" },
  طرح: { property: "https://schema.org/pattern", field: "pattern" },
};

function eligibleForSnapppay(settings: SiteSettings, toman: number): boolean {
  const s = settings.snapppay;
  return !!s?.enabled && (s.minToman == null || toman >= s.minToman) && (s.maxToman == null || toman <= s.maxToman);
}

function shippingDetails(
  settings: SiteSettings,
  p: Pick<ProductLdInput, "availability" | "leadTimeDays">,
  toman: number,
): OfferShippingDetails | null {
  const sp = settings.shippingPolicy;
  if (!sp) return null;
  const base: OfferShippingDetails = { "@type": "OfferShippingDetails", hasShippingService: ref(ids.shippingPolicy()) };
  if (p.availability !== "made_to_order" || !p.leadTimeDays) return base;
  // An offer-level override must carry rate, destination and delivery time; without them keep the reference.
  const rate = sp.freeOverToman != null && toman >= sp.freeOverToman ? 0 : sp.rateToman;
  if (rate == null || !sp.transitDays) return base;
  return {
    ...base,
    shippingRate: irr(rate),
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "IR" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: days([p.leadTimeDays, p.leadTimeDays]),
      transitTime: days(sp.transitDays),
    },
  };
}

function offerNode(
  p: ProductLdInput,
  ctx: ProductLdContext,
  o: { url: string; toman: number; strikethrough: number | null },
): Offer {
  const { settings } = ctx;
  const price = tomanToRial(o.toman);
  const shipping = shippingDetails(settings, p, o.toman);
  const priceSpecification: UnitPriceSpecification[] | null =
    o.strikethrough && o.strikethrough > o.toman
      ? [
          { "@type": "UnitPriceSpecification", price, priceCurrency: "IRR" },
          {
            "@type": "UnitPriceSpecification",
            priceType: "https://schema.org/StrikethroughPrice",
            price: tomanToRial(o.strikethrough),
            priceCurrency: "IRR",
          },
        ]
      : null;
  const installments = settings.snapppay?.count ?? 4;
  return {
    "@type": "Offer",
    url: o.url,
    price,
    priceCurrency: "IRR",
    ...(ctx.priceValidUntil ? { priceValidUntil: ctx.priceValidUntil } : {}),
    ...(priceSpecification ? { priceSpecification } : {}),
    availability: AVAILABILITY[p.availability],
    itemCondition: "https://schema.org/NewCondition",
    seller: ref(ids.organization()),
    ...(shipping ? { shippingDetails: shipping } : {}),
    ...(settings.returnPolicy ? { hasMerchantReturnPolicy: ref(ids.returnPolicy()) } : {}),
    ...(p.warrantyMonths
      ? {
          warranty: {
            "@type": "WarrantyPromise",
            durationOfWarranty: { "@type": "QuantitativeValue", value: p.warrantyMonths, unitCode: "MON" },
          },
        }
      : {}),
    ...(eligibleForSnapppay(settings, o.toman)
      ? {
          acceptedPaymentMethod: {
            "@type": "LoanOrCredit",
            name: `خرید ${toFaDigits(installments)} قسطی با اسنپ‌پی`,
            provider: { "@type": "Organization", name: "اسنپ‌پی", url: "https://snapppay.ir" },
          },
        }
      : {}),
  };
}

/** Only approved, non-sample reviews with text and an author; a rating needs at least 3 (§3.5.10). */
function reviewFields(reviews: readonly ReviewLdInput[] | undefined): { aggregateRating?: AggregateRating; review?: Review[] } {
  const real = (reviews ?? []).filter(
    (r) => !r.isSample && (r.status ?? "approved") === "approved" && r.body.trim() && r.authorName.trim(),
  );
  if (real.length < 3) return {};
  const mean = real.reduce((sum, r) => sum + r.rating, 0) / real.length;
  return {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Math.round(mean * 10) / 10,
      bestRating: 5,
      worstRating: 1,
      ratingCount: real.length,
      reviewCount: real.length,
    },
    review: real.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      datePublished: dateTehran(r.createdAt),
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.body,
    })),
  };
}

function productFacts(p: ProductLdInput) {
  const size = (value: number, unitCode: "CMT" | "KGM"): QuantitativeValue => ({
    "@type": "QuantitativeValue",
    value,
    unitCode,
  });
  const properties: PropertyValue[] = [
    ...(p.maxLoadKg
      ? [{ "@type": "PropertyValue" as const, name: "حداکثر وزن قابل تحمل", value: p.maxLoadKg, unitCode: "KGM" }]
      : []),
    ...p.specs.map((s) => ({ "@type": "PropertyValue" as const, name: s.label, value: s.value })),
  ];
  const audience = peopleAudience({ minMonths: p.ageMinMonths, maxMonths: p.ageMaxMonths });
  return {
    brand: ref(ids.brand()),
    manufacturer: ref(ids.organization()),
    category: p.category.name,
    ...(p.material ? { material: p.material } : {}),
    countryOfOrigin: IRAN,
    ...(p.dimensions
      ? {
          width: size(p.dimensions.widthCm, "CMT"),
          depth: size(p.dimensions.depthCm, "CMT"),
          height: size(p.dimensions.heightCm, "CMT"),
        }
      : {}),
    ...(p.weightKg ? { weight: size(p.weightKg, "KGM") } : {}),
    ...(audience ? { audience } : {}),
    ...(properties.length ? { additionalProperty: properties } : {}),
  };
}

/**
 * Product page graph: ItemPage, Product (or ProductGroup + variants when the product has variant
 * rows), the primary ImageObject, plus BreadcrumbList and FAQPage when given. Room-set bundles stay
 * a plain Product whose components go in `relatedSlugs`.
 */
export function productNodes(p: ProductLdInput, ctx: ProductLdContext): Thing[] {
  const path = `/product/${p.slug}`;
  const url = absoluteUrl(path);
  const gallery: LdImage[] = p.images?.length
    ? p.images
    : p.illustration
      ? [{ url: pictureUrl(p.illustration), alt: p.name }]
      : [];
  const [primary, ...more] = gallery;
  const image = primary ? [ref(ids.primaryImage(path)), ...more.map(imageUrl)] : undefined;

  const shared = {
    url,
    description: p.summary,
    ...(p.alternateNames.length ? { alternateName: p.alternateNames } : {}),
    ...(image ? { image } : {}),
    ...productFacts(p),
    ...(ctx.relatedSlugs?.length ? { isRelatedTo: ctx.relatedSlugs.map((s) => ref(ids.product(s))) } : {}),
    ...(ctx.accessoryForSlugs?.length
      ? { isAccessoryOrSparePartFor: ctx.accessoryForSlugs.map((s) => ref(ids.product(s))) }
      : {}),
    ...(ctx.articleSlugs?.length ? { subjectOf: ctx.articleSlugs.map((s) => ref(ids.article(s))) } : {}),
    ...reviewFields(ctx.reviews),
  };

  const variants = p.variants ?? [];
  let main: Product | ProductGroup;
  if (variants.length) {
    const optionKeys = unique(variants.flatMap((v) => Object.keys(v.options)));
    const variesBy = unique(optionKeys.map((k) => VARIES_BY[k]?.property));
    main = {
      "@type": "ProductGroup",
      "@id": ids.product(p.slug),
      name: p.name,
      ...shared,
      productGroupID: p.sku ?? `CHZ-${p.id}`,
      ...(variesBy.length ? { variesBy } : {}),
      hasVariant: variants.map((v): Product => {
        const query = v.urlParam ?? `variant=${v.id}`;
        const variantUrl = `${url}?${query}`;
        const toman = v.price ?? p.price;
        const fields = Object.fromEntries(
          Object.entries(v.options)
            .filter(([k]) => VARIES_BY[k])
            .map(([k, value]) => [VARIES_BY[k].field, value]),
        );
        return {
          "@type": "Product",
          "@id": ids.product(p.slug, query),
          name: `${p.name} — ${v.name}`,
          ...(v.sku ? { sku: v.sku } : {}),
          ...fields,
          ...(v.image ? { image: imageUrl(v.image) } : {}),
          offers: offerNode(p, ctx, {
            url: variantUrl,
            toman,
            // The struck-through price belongs to the base price only.
            strikethrough: toman === p.price ? p.compareAtPrice : null,
          }),
        };
      }),
    };
  } else {
    main = {
      "@type": "Product",
      "@id": ids.product(p.slug),
      name: p.name,
      ...shared,
      ...(p.sku ? { sku: p.sku, mpn: p.sku } : {}),
      offers: offerNode(p, ctx, { url, toman: p.price, strikethrough: p.compareAtPrice }),
    };
  }

  return nonNull([
    webPageNode({
      type: "ItemPage",
      path,
      name: ctx.pageName ?? p.name,
      breadcrumb: !!ctx.breadcrumb?.length,
      primaryImage: !!primary,
      mainEntity: ids.product(p.slug),
      dateModified: ctx.dateModified ?? p.updatedAt ?? null,
    }),
    main,
    primary ? imageNode(path, primary) : null,
    ctx.breadcrumb?.length ? breadcrumbNode(ctx.breadcrumb) : null,
    ctx.faqs?.length ? faqNode(ctx.faqs, path) : null,
  ]);
}

/* ------------------------------------------------------------------ */
/* People (SEO.md §3.5.5, §3.5.12)                                       */
/* ------------------------------------------------------------------ */

/** schema-dts' Person and Organization unions include bare strings; builders only return objects. */
type PersonNode = Exclude<Person, string>;
type AuthorNode = PersonNode | Exclude<Organization, string>;

export type AuthorLdInput = {
  slug: string;
  name: string;
  jobTitle?: string | null;
  role?: string | null;
  bio?: string | null;
  /** Wikidata QIDs or glossary slugs. */
  knowsAbout?: string[];
  credentials?: string[];
  sameAs?: string[];
  isPlaceholder: boolean;
  /** «تحریریهٔ چوبز»-style collective authors become an Organization. */
  isOrganization: boolean;
  avatar?: LdImage | null;
};

/**
 * Compact author/reviewer node for article graphs. Collective authors are an Organization that
 * belongs to the store; placeholder people return null (they are never published).
 */
export function personNode(a: AuthorLdInput, opts: { worksFor?: boolean } = {}): AuthorNode | null {
  if (a.isPlaceholder) return null;
  const url = absoluteUrl(`/team/${a.slug}`);
  if (a.isOrganization) {
    return { "@type": "Organization", name: a.name, url, parentOrganization: ref(ids.organization()) };
  }
  return {
    "@type": "Person",
    "@id": ids.person(a.slug),
    name: a.name,
    url,
    ...(a.jobTitle || a.role ? { jobTitle: a.jobTitle || a.role || undefined } : {}),
    ...(opts.worksFor === false ? {} : { worksFor: ref(ids.organization()) }),
  };
}

/** `/team/{slug}`: ProfilePage whose mainEntity is the full Person (or the collective Organization). */
export function profileNodes(
  a: AuthorLdInput,
  opts: { dateModified?: Date | string | null; breadcrumb?: boolean } = {},
): Thing[] {
  if (a.isPlaceholder) return [];
  const path = `/team/${a.slug}`;
  const sameAs = sameAsUrls(a.sameAs ?? []);
  const knowsAbout = (a.knowsAbout ?? []).map(entity);
  const common = {
    name: a.name,
    url: absoluteUrl(path),
    ...(a.bio ? { description: a.bio } : {}),
    ...(a.avatar ? { image: imageUrl(a.avatar) } : {}),
    ...(knowsAbout.length ? { knowsAbout } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
  const mainEntity: AuthorNode = a.isOrganization
    ? { "@type": "Organization", ...common, parentOrganization: ref(ids.organization()) }
    : {
        "@type": "Person",
        "@id": ids.person(a.slug),
        ...common,
        ...(a.jobTitle || a.role ? { jobTitle: a.jobTitle || a.role || undefined } : {}),
        worksFor: ref(ids.organization()),
        ...(a.credentials?.length
          ? {
              hasCredential: a.credentials.map((name) => ({
                "@type": "EducationalOccupationalCredential" as const,
                name,
              })),
            }
          : {}),
      };
  return [
    webPageNode({
      type: "ProfilePage",
      path,
      name: a.name,
      breadcrumb: opts.breadcrumb,
      mainEntity,
      dateModified: opts.dateModified,
    }),
  ];
}

/* ------------------------------------------------------------------ */
/* Articles (SEO.md §3.5.5)                                              */
/* ------------------------------------------------------------------ */

export type ArticleLdInput = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | string | null;
  /** Editorial «به‌روزرسانی» date; falls back to `publishedAt`. */
  contentUpdatedAt?: Date | string | null;
  reviewedAt?: Date | string | null;
  readingMinutes?: number | null;
  wordCount?: number | null;
  sources?: Source[];
  primaryQuery?: string | null;
  secondaryQueries?: string[];
  /** Wikidata QIDs or glossary slugs → `about`. */
  aboutEntities?: string[];
  ageMinMonths?: number | null;
  ageMaxMonths?: number | null;
  illustration?: string | null;
};

export type ArticleLdContext = {
  /** The `<title>` core (question form). Defaults to the title. */
  pageName?: string;
  author?: AuthorLdInput | null;
  reviewer?: AuthorLdInput | null;
  topic?: { slug: string; name: string } | null;
  /** Cover crops, widest first (16:9, 4:3, 1:1). Empty → the post's drawing. */
  images?: LdImage[];
  /** Products featured in the article (`post_products`) → `mentions`. */
  productSlugs?: string[];
  breadcrumb?: BreadcrumbItem[];
  faqs?: FaqItem[];
  /** Steps of a `howto` post, in visible order → HowTo. */
  steps?: HowToInput["steps"];
};

/**
 * Article graph: WebPage (reviewer + lastReviewed), Article, compact author/reviewer, primary
 * image, and BreadcrumbList / FAQPage / HowTo when present on the page.
 */
export function articleNodes(post: ArticleLdInput, ctx: ArticleLdContext = {}): Thing[] {
  const path = `/mag/${post.slug}`;
  const author = ctx.author ? personNode(ctx.author) : null;
  const reviewer = ctx.reviewer ? personNode(ctx.reviewer, { worksFor: false }) : null;
  const modified = post.contentUpdatedAt ?? post.publishedAt;
  const gallery: LdImage[] = ctx.images?.length
    ? ctx.images
    : post.illustration
      ? [{ url: pictureUrl(post.illustration), alt: post.title }]
      : [];
  const asRef = (n: AuthorNode) => ("@id" in n && n["@id"] ? ref(n["@id"]) : n);
  const ageRange = formatAgeRange(post.ageMinMonths, post.ageMaxMonths);
  const audience = peopleAudience(
    { minMonths: post.ageMinMonths ?? null, maxMonths: post.ageMaxMonths ?? null },
    ageRange ? `والدین کودکان ${ageRange}` : undefined,
  );
  const keywords = unique([post.primaryQuery, ...(post.secondaryQueries ?? [])]);
  const citation: CreativeWork[] = (post.sources ?? []).map((s) => ({
    "@type": "CreativeWork",
    name: s.title,
    url: s.url,
    ...(s.publisher ? { publisher: { "@type": "Organization", name: s.publisher } } : {}),
  }));

  const article: Article = {
    "@type": "Article",
    "@id": ids.article(post.slug),
    headline: post.title,
    description: post.excerpt,
    ...(gallery.length ? { image: gallery.map(imageUrl) } : {}),
    ...(post.publishedAt ? { datePublished: isoTehran(post.publishedAt) } : {}),
    ...(modified ? { dateModified: isoTehran(modified) } : {}),
    // Without a publishable author the store itself is the author («تحریریهٔ چوبز»).
    author: author ? asRef(author) : ref(ids.organization()),
    publisher: ref(ids.organization()),
    mainEntityOfPage: ref(ids.webpage(path)),
    ...(ctx.topic ? { isPartOf: ref(ids.webpage(`/mag/topic/${ctx.topic.slug}`)), articleSection: ctx.topic.name } : {}),
    inLanguage: SITE.inLanguage,
    ...(keywords.length ? { keywords } : {}),
    ...(post.wordCount ? { wordCount: post.wordCount } : {}),
    ...(post.readingMinutes ? { timeRequired: `PT${post.readingMinutes}M` } : {}),
    ...(audience ? { audience } : {}),
    ...(post.aboutEntities?.length ? { about: post.aboutEntities.map(entity) } : {}),
    ...(ctx.productSlugs?.length ? { mentions: ctx.productSlugs.map((s) => ref(ids.product(s))) } : {}),
    ...(citation.length ? { citation } : {}),
  };

  return nonNull([
    webPageNode({
      path,
      name: ctx.pageName ?? post.title,
      breadcrumb: !!ctx.breadcrumb?.length,
      primaryImage: gallery.length > 0,
      reviewedBy: reviewer ? asRef(reviewer) : null,
      lastReviewed: reviewer ? post.reviewedAt : null,
      datePublished: post.publishedAt,
      dateModified: modified,
    }),
    article,
    author && "@id" in author ? author : null,
    reviewer && "@id" in reviewer ? reviewer : null,
    gallery[0] ? imageNode(path, gallery[0]) : null,
    ctx.breadcrumb?.length ? breadcrumbNode(ctx.breadcrumb) : null,
    ctx.faqs?.length ? faqNode(ctx.faqs, path) : null,
    ctx.steps?.length ? howToNode({ path, name: post.title, description: post.excerpt, steps: ctx.steps }) : null,
  ]);
}

/* ------------------------------------------------------------------ */
/* Glossary (SEO.md §3.5.7)                                              */
/* ------------------------------------------------------------------ */

export type TermLdInput = {
  slug: string;
  term: string;
  originalTerm?: string | null;
  /** The quotable definition, identical to the page's first paragraph. */
  definition: string;
  alternateNames?: string[];
  sameAs?: string[];
  /** Published posts only (pillar first). */
  postSlugs?: string[];
};

export function definedTermNode(t: TermLdInput): DefinedTerm {
  const alternateName = unique([t.originalTerm, ...(t.alternateNames ?? [])]);
  const sameAs = sameAsUrls(t.sameAs ?? []);
  return {
    "@type": "DefinedTerm",
    "@id": ids.term(t.slug),
    name: t.term,
    ...(alternateName.length ? { alternateName } : {}),
    description: plainText(t.definition),
    termCode: t.slug,
    url: absoluteUrl(`/glossary/${t.slug}`),
    inDefinedTermSet: ref(ids.termSet()),
    ...(sameAs.length ? { sameAs } : {}),
    ...(t.postSlugs?.length ? { subjectOf: t.postSlugs.map((s) => ref(ids.article(s))) } : {}),
  };
}

/** The glossary set; pass `terms` on /glossary to list every term (`hasDefinedTerm`). */
export function definedTermSetNode(terms?: readonly { slug: string; term: string }[]): DefinedTermSet {
  return {
    "@type": "DefinedTermSet",
    "@id": ids.termSet(),
    name: "واژه‌نامهٔ چوبز: مونته‌سوری، پیکلر و بازی کودک",
    url: absoluteUrl("/glossary"),
    inLanguage: SITE.inLanguage,
    publisher: ref(ids.organization()),
    ...(terms?.length
      ? {
          hasDefinedTerm: terms.map((t) => ({
            "@type": "DefinedTerm" as const,
            "@id": ids.term(t.slug),
            name: t.term,
            url: absoluteUrl(`/glossary/${t.slug}`),
          })),
        }
      : {}),
  };
}
