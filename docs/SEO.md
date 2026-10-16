# SEO · AEO · GEO specification for choobz.kids

Status: **decided for Phase 1** (public front end). Researched and verified on **2026-10-16 (۲۴ مهر ۱۴۰۵)** against the primary sources listed in §11.
Stack: Next.js 16.4.2 (App Router, Cache Components, `proxy.ts`), React 19.3, Tailwind CSS 4.3, SQLite + Drizzle (`/data/choobz.db`), uploads in `/data/uploads`, Docker standalone.
Audience: Iranian parents (mostly mothers aged 25–40) of children aged 0–6. About 80% of traffic is mobile. Persian RTL, prices in Toman.
Companion docs: `docs/CONTENT-PLAN.md` (clusters, articles, glossary, E-E-A-T personas), `docs/FONTS.md`, `docs/concepts/*`.

Legend: `[PLACEHOLDER]` marks a real Choobz fact we still need, such as a phone number or the eNamad ID. `[VERIFY]` marks something to re-check with the third party (Torob, SnappPay, eNamad, a lawyer) at integration time. **MUST**, **SHOULD** and **MAY** are used in the RFC 2119 sense.

> **This document supersedes two details in CONTENT-PLAN.md §0-2.**
> 1. Product detail pages live at **`/product/{slug}`**, not `/shop/{slug}`. The slugs themselves (`learning-tower`, `pikler-triangle`…) are unchanged. `/shop/{slug}` now means a **category**.
> 2. Age hubs are **three** indexable pages (`/age/0-12-months`, `/age/1-3-years`, `/age/3-6-years`). The plan's five finer ranges become anchored sections inside them (`#0-6-months`, `#6-12-months`, `#1-2-years`, `#2-3-years`). This avoids five thin pages.
> Everything else in CONTENT-PLAN.md §0-2 stands: `/mag`, `/mag/topic/{cluster}`, `/mag/{slug}`, `/glossary/{term}`, `/team/{slug}`, `/faq`, `/editorial-policy`.

---

## 0. Decisions at a glance

| Area | Decision | Why (one line) |
|---|---|---|
| Host | `https://choobz.kids` (apex, HTTPS). `www`, `http` and any `choobz.ir` defensive domain redirect with **one** 301 | One canonical host |
| Slugs | **English, lowercase ASCII, hyphenated, semantic** (`/product/pikler-triangle`). Established Finglish only where no English term exists (`sismooni`, `yalda`) | Short, unbreakable shares (Instagram, Bale, SMS); no ی/ک/ZWNJ duplicate URLs; LLMs know the English entity names (§1.1) |
| Trailing slash | **None.** `/shop/` redirects 301 to `/shop` in the same hop as the other normalisations (`skipTrailingSlashRedirect: true`, handled in `proxy.ts`) | Next.js default; one hop |
| Content hub | **«مجله چوبز» at `/mag`** | The established Persian name for a commerce content hub (مجله دیجی‌کالا، مجله باسلام). It fits stories as well as guides. «راهنما» reads like a help centre (§1.3) |
| Products / categories | `/product/{slug}` · `/shop/{category}` · `/shop` | Flat product URLs survive re-categorisation. Page types are separable in GSC by path |
| Facets | Client-side filtering of the server-rendered list. Query params are never linked with `<a>`, are canonical to the clean URL, and are `Disallow`ed in robots.txt | No crawl traps; pages stay statically prerendered |
| Pagination | Path based: `/mag/page/2`. Self-canonical, linked, **not** in the sitemap. Categories are not paginated (small catalogue) | `searchParams` would make the page dynamic under Cache Components |
| Language | `<html lang="fa-IR" dir="rtl">`, `og:locale=fa_IR`. **No hreflang yet**; the URL scheme leaves room for `/en/…` | Single language today |
| Digits | Persian digits in everything a human reads (title, description, H1, body, alt). **Latin digits** in everything a machine parses (JSON-LD, Torob meta and API, sitemaps, URLs, `datetime`) | Users type Persian digits; parsers expect ASCII |
| Currency | UI shows **Toman**. JSON-LD uses `priceCurrency: "IRR"` with **price × 10**. Torob meta and API use **Toman** (their spec). Never `IRT` | ISO 4217 has no Toman |
| JSON-LD | One `<script type="application/ld+json">` per page holding an `@graph`, server-rendered in the static shell, stable `@id`s (§3.1) | Linkable entities for Google, Bing and LLMs |
| Org type | `OnlineStore` (+ `ToyStore` node only if the workshop is open to visitors `[VERIFY]`) | Google's recommended e-commerce subtype |
| Shipping and returns markup | Defined **once** at organisation level (`hasShippingService`, `hasMerchantReturnPolicy`); offers reference them by `@id` only | Google's 2025–26 recommendation |
| FAQPage | Kept on `/faq`, products, articles and `/installments`, but **not** expected to produce Google rich results (removed on 2026-05-07) | Still parsed by Bing and LLMs; costs a few bytes |
| HowTo | Emitted only for `format = "howto"` posts, generated from the steps block | No Google rich result since 2023; useful semantics elsewhere |
| Speakable | **Not implemented** (Google: beta, English news only). Keep a `#tldr` hook | No Persian support |
| AI crawlers | **Allow all search, answer and training bots** (incl. GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot). Block only `Bytespider` | For a Persian brand, being in model training data and grounding indexes is a GEO asset (§5.1) |
| llms.txt | Yes: `/llms.txt` + `/llms-full.txt`, generated from the DB | Ignored by Google Search, but used by agents and audited by Lighthouse 13.3 "Agentic Browsing" |
| Markdown alternates | Yes: `/mag/{slug}.md`, `/glossary/{term}.md`, `/product/{slug}.md` with `X-Robots-Tag: noindex`. No `?format=md`. Content negotiation deferred | Cheap (bodies are already Markdown); clean input for agents; never competes with the HTML |
| Torob | Meta tags in `<head>` from day 1 (`product_id`, `product_name`, `product_price`, `product_old_price`, `availability`, `guarantee` + `og:image`). Product API v3 at `POST /torob_api/v3/products` in phase 1.5. Webhook in phase 2 | Small shops are crawled; the API makes sync reliable |
| Sitemaps | `/sitemap.xml` (index, rewritten to a route handler) → `pages`, `categories`, `products`, `mag`, `glossary` children with `<image:image>` | Per-type coverage in GSC |
| Feeds | `/mag/rss.xml` (RSS 2.0, full content, attribution footer) | Feed readers, Telegram/Bale RSS bots, AI aggregators |
| IndexNow | Yes (`api.indexnow.org`, key file at the web root) | Bing (which also feeds Copilot/DuckDuckGo), Yandex, Naver, Seznam, Yep, Amazon |
| CWV (p75, mobile) | LCP ≤ 2.0 s · INP ≤ 150 ms · CLS ≤ 0.05 (target 0.01) · TTFB ≤ 500 ms | Brief targets, measured with self-hosted RUM (§7.3) |

---

## 1. Information architecture and URL scheme

### 1.1 URL principles (normative)

1. **Canonical origin:** `https://choobz.kids`. The reverse proxy (Caddy, Nginx or ArvanCloud) does `http→https` and `www→apex`. Everything else is normalised in `src/proxy.ts`, so any malformed URL needs **at most one** redirect hop.
2. **Slugs:** `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 2–5 words, ≤ 60 characters. Use the internationally recognised English noun: `learning-tower`, `pikler-triangle`, `montessori-room-setup`. No stop words, years, prices, IDs or Persian characters. Use Finglish **only** for concepts with no English equivalent (`wooden-sismooni-checklist`, `yalda-gift-guide`).
3. **Slugs are immutable once published.** Phase 2 CMS: changing a slug **MUST** insert a `redirects` row (`old → new`, 301) in the same transaction. It must also rewrite older redirect rows that point at the old URL, so redirects never chain.
4. **No trailing slash, lowercase only, no double slashes.** A violating URL redirects 301 to the normalised form.
5. **Query parameters never create indexable content.** Allowed params: facets (`age`, `skill`, `price`, `sort`, `in_stock`), variant preselection (`color`, `size`, `material`), search (`q`) and tracking (`utm_*`). The canonical URL is always built from route params, never from `request.url`.
6. **Fragments** are only for in-page anchors (`#faq`, `#what-is-a-learning-tower`). They never change content.
7. **Heading anchors are ASCII and author-defined** (§4.4). Persian heading text would become percent-encoded IDs and break when a heading is edited.

**Why English slugs, given that Google says "use words in your audience's language"?** Google's URL-structure guide recommends audience-language words *and* percent-encoding for non-ASCII. We trade a small URL-keyword signal for larger practical gains:

* On mobile (80% of our traffic), Google shows the site name and breadcrumb, not the path. Persian relevance comes from the title, H1, body, anchor text and breadcrumb names, all of which stay Persian.
* A Persian slug percent-encodes to about 6× its length (`برج` → `%D8%A8%D8%B1%D8%AC`). Our biggest acquisition channel is the Instagram account (50.1K followers), plus Bale and SMS. Those links get copied, truncated and re-encoded, and ASCII survives every hop.
* Persian slugs create duplicate-URL classes: Arabic `ي/ك` vs Persian `ی/ک`, ZWNJ vs space vs nothing, Arabic vs Persian digits. ASCII removes the whole class.
* The products' entity names *are* English loan concepts (Montessori, Pikler, learning tower). LLMs and Wikidata index them by English labels. `pikler-triangle` reinforces the entity; `مثلث-پیکلر` does not.
* Torob's `page_url`, analytics regex segmentation, logs and CMS validation all stay simple.

**Mitigation:** breadcrumb names, titles, H1s and internal anchor text are always Persian. Persian "vanity" paths (for example a printed card that says `choobz.kids/برج`) are allowed as **redirect rows only**, keyed by a normalised decoded path (§7.4).

### 1.2 Route map

`(pages)/[page]` is a root-level dynamic segment served from the `pages` table. Static routes always take precedence. Unknown slugs fall through to the redirect lookup and then `notFound()`.

| Path | Persian name (nav / H1 seed) | Page type | Next.js file | Indexable | Sitemap child | Main schema |
|---|---|---|---|---|---|---|
| `/` | خانه | Home | `src/app/page.tsx` | ✓ | pages | `OnlineStore`, `WebSite`, `WebPage` |
| `/shop` | فروشگاه | All products | `src/app/shop/page.tsx` | ✓ | pages | `CollectionPage` + `ItemList` |
| `/shop/{category}` | e.g. «پیکلر و وسایل صعود» | Category | `src/app/shop/[category]/page.tsx` | ✓ | categories | `CollectionPage` + `ItemList` |
| `/product/{slug}` | e.g. «برج یادگیری» | Product detail page | `src/app/product/[slug]/page.tsx` | ✓ | products (+images) | `Product` or `ProductGroup` + `Offer` |
| `/product/{slug}?color=…` | — | Variant preselect | same page | canonical → product | — | (variant in the group) |
| `/mag` | مجله چوبز | Hub home | `src/app/mag/page.tsx` | ✓ | mag | `CollectionPage` + `ItemList` |
| `/mag/page/{n}` (n ≥ 2) | مجله چوبز — صفحهٔ n | Pagination | `src/app/mag/page/[n]/page.tsx` | ✓ self-canonical | — | `CollectionPage` |
| `/mag/topic/{topic}` | e.g. «مونته‌سوری در خانه» | Topic hub (cluster) | `src/app/mag/topic/[topic]/page.tsx` | ✓ | mag | `CollectionPage` + `ItemList` |
| `/mag/{slug}` | article title | Article (pillar or support) | `src/app/mag/[slug]/page.tsx` | ✓ | mag (+images, video) | `Article` (+`FAQPage`, `HowTo`, `VideoObject`) |
| `/mag/rss.xml` | — | RSS 2.0 | `src/app/mag/rss.xml/route.ts` | `X-Robots-Tag: noindex` | — | — |
| `/{mag,glossary,product}/{slug}.md` | — | Markdown alternate | rewrite → `src/app/md/[type]/[slug]/route.ts` | `X-Robots-Tag: noindex` | — | — |
| `/age` | سن به سن | Age index | `src/app/age/page.tsx` | ✓ | pages | `CollectionPage` |
| `/age/{range}` | «۰ تا ۱۲ ماه»، «۱ تا ۳ سال»، «۳ تا ۶ سال» | Age hub | `src/app/age/[range]/page.tsx` | ✓ | pages | `CollectionPage` + `ItemList` |
| `/glossary` | واژه‌نامه | Term set | `src/app/glossary/page.tsx` | ✓ | glossary | `DefinedTermSet` |
| `/glossary/{term}` | e.g. «مثلث پیکلر» | Term | `src/app/glossary/[term]/page.tsx` | ✓ | glossary | `DefinedTerm` |
| `/faq` | سؤالات متداول | FAQ | `src/app/faq/page.tsx` | ✓ | pages | `FAQPage` |
| `/about` | داستان چوبز | Brand story | `(pages)/[page]` | ✓ | pages | `AboutPage` |
| `/workshop` | کارگاه چوبز | Workshop | `src/app/workshop/page.tsx` | ✓ | pages | `WebPage` + `VideoObject` (+`ToyStore` if visitable) |
| `/team`, `/team/{slug}` | تیم و نویسندگان | Author or reviewer | `src/app/team/page.tsx`, `src/app/team/[slug]/page.tsx` | ✓ | pages | `ProfilePage` + `Person` |
| `/editorial-policy` | سیاست تحریریه و بازبینی | Policy | `(pages)/[page]` | ✓ | pages | `WebPage` |
| `/contact` | تماس با چوبز | Contact | `(pages)/[page]` | ✓ | pages | `ContactPage` |
| `/shipping` | ارسال و هزینهٔ ارسال | Trust | `(pages)/[page]` | ✓ | pages | `WebPage` + full `ShippingService` |
| `/returns` | بازگشت کالا | Trust | `(pages)/[page]` | ✓ | pages | `WebPage` + full `MerchantReturnPolicy` |
| `/warranty` | ضمانت و خدمات پس از فروش | Trust | `(pages)/[page]` | ✓ | pages | `WebPage` |
| `/safety` | ایمنی و متریال | Trust | `(pages)/[page]` | ✓ | pages | `WebPage` (`about` → toy safety, plywood) |
| `/installments` | خرید قسطی با اسنپ‌پی | Trust / commercial | `(pages)/[page]` | ✓ | pages | `WebPage` + `FAQPage` |
| `/trust` | اعتماد شما (نماد اعتماد، مجوزها) | Trust | `(pages)/[page]` | ✓ | pages | `WebPage` |
| `/reviews` | رضایت شما | Testimonials | `src/app/reviews/page.tsx` | ✓ | pages | `WebPage` (**no** `Review` markup: self-serving) |
| `/gallery` | عکس‌های شما (عکساتون) | Customer photos (UGC) | `src/app/gallery/page.tsx` | ✓ | pages (+images) | `CollectionPage` + `ImageObject` |
| `/privacy`, `/terms` | حریم خصوصی، قوانین و مقررات | Legal | `(pages)/[page]` | ✓ | pages | `WebPage` |
| `/search?q=` | جستجو | Internal search | `src/app/search/page.tsx` | `noindex, follow` + robots `Disallow` | — | — |
| `/cart`, `/checkout`, `/account/*` | — | Transactional | — | `noindex` + `Disallow` | — | — |
| `/torob_api/v3/products` | — | Torob product API | `src/app/torob_api/v3/products/route.ts` | `Disallow` | — | — |
| `/sitemap.xml` → `/sitemap-index.xml` | — | Sitemap index | `src/app/sitemap-index.xml/route.ts` + rewrite | — | — | — |
| `/sitemaps/{type}/sitemap.xml` | — | Child sitemaps | `src/app/sitemaps/{type}/sitemap.ts` | — | — | — |
| `/robots.txt`, `/llms.txt`, `/llms-full.txt`, `/{indexnow-key}.txt` | — | Machine files | `src/app/robots.ts`, `src/app/llms.txt/route.ts`, `src/app/llms-full.txt/route.ts`, `public/{key}.txt` | — | — | — |

**Reserved slugs.** Neither `pages.slug` nor any `/mag/{slug}` may use these: `shop product mag age glossary faq team workshop reviews gallery search cart checkout account api md media sitemaps torob_api page topic rss feed llms en`. Enforce this in seed validation and in the Phase 2 CMS.

### 1.3 Content hub: «مجله چوبز» at `/mag`

* **Name:** «مجله چوبز» (nav label «مجله»). The H1 on `/mag` is «مجله چوبز: بازی، رشد و اتاق کودک».
* **Why `/mag`:** Iranian shoppers already read "مجله" as a store's editorial arm (Digikala Mag, Basalam Mag), so it signals expertise without sounding like a sales funnel. Our content mixes pillar guides, comparisons, checklists, mothers' stories and gift guides; «راهنما» would undersell the stories and is easily confused with help pages (shipping, returns). `/mag` is short in shares and already fixed in CONTENT-PLAN.md.
* **Articles are flat:** `/mag/{slug}`. The cluster isn't in the URL, so articles can move between clusters without redirects. Cluster context comes from the breadcrumb, `isPartOf` and internal links.
* **Topic hubs** (`/mag/topic/{topic}`) are real landing pages: a 300–500-word intro, a link to the pillar, every supporting article, 3–6 products and 5–10 glossary terms. The nine clusters are `montessori`, `movement`, `learning-tower`, `nursery`, `play`, `art`, `reading`, `safety` and `gifts`.
* **Pillars** are ordinary articles with `isPillar = true`. A pillar and its hub link to each other above the fold.

### 1.4 Shop

| Path | Example | Notes |
|---|---|---|
| `/shop` | «فروشگاه وسایل چوبی کودک» | All published products, grouped by category. Intro copy (≤ 120 words) + the category grid |
| `/shop/{category}` | `/shop/pikler-climbing` | Proposed categories `[VERIFY against the real catalogue]`: `pikler-climbing` (پیکلر و صعود: triangle, arch/rocker, ramp, Swedish wall), `montessori-furniture` (برج یادگیری، قفسه، میز و صندلی، کتابخانه، رول نقاشی), `montessori-room-sets` (چیدمان کامل اتاق), `wooden-toys` (اسباب‌بازی چوبی) |
| `/product/{slug}` | `/product/learning-tower`, `/product/pikler-arch`, `/product/pikler-triangle`, `/product/swedish-wall`, `/product/front-facing-bookshelf`, `/product/wall-art-roll`, `/product/kids-table-chair`, `/product/montessori-shelf` | Slugs come from CONTENT-PLAN.md P1–P9. Variants live on **one** URL (§3.5.4) |

* A product's breadcrumb uses its **primary** category (`products.categoryId`): خانه › فروشگاه › {category} › {product}.
* Categories are **not paginated** while they hold ≤ 48 products. All cards are server-rendered and images below the fold are lazy. Past 48, use `/shop/{category}/page/{n}` with the same rules as §1.8.
* Discontinued products are handled per §7.4: 301 to the successor if there is one, otherwise keep the page as `Discontinued` with alternatives for 6 months, then 410.

### 1.5 Age hubs

| Path | H1 | In-page sections (ASCII anchors) | Lists |
|---|---|---|---|
| `/age` | «سن به سن: بازی و وسایل مناسب هر سن» | — | the 3 hubs + a ring-of-growth visual |
| `/age/0-12-months` | «بازی و وسایل مناسب نوزاد ۰ تا ۱۲ ماه» | `#0-6-months`, `#6-12-months` | products whose `[ageMinMonths, ageMaxMonths]` overlaps the range, plus articles and milestones |
| `/age/1-3-years` | «بازی و وسایل مناسب کودک ۱ تا ۳ سال (نوپا)» | `#1-2-years`, `#2-3-years` | same |
| `/age/3-6-years` | «بازی و وسایل مناسب کودک ۳ تا ۶ سال» | `#3-4-years`, `#4-6-years` | same |

The milestone text is YMYL. It **MUST** show a named reviewer (CONTENT-PLAN.md §4) and the medical disclaimer.

### 1.6 Glossary, FAQ, brand and trust pages

* **Glossary:** `/glossary` lists every term under Persian alphabetical headings with ASCII anchors (`#letter-alef`, `#letter-be`…). Each term has its own `/glossary/{term}` page: a quotable 1–2 sentence definition, up to 300 words, links to the pillar, related products and Wikidata `sameAs`.
* **FAQ:** `/faq` has sections خرید · ارسال · اقساط · بازگشت و ضمانت · ایمنی و نگهداری, anchored `#buying`, `#shipping`, `#installments`, `#returns`, `#safety`. Product- and article-level FAQs live on their own pages (`faqs.scope`). Don't duplicate the same Q&A across URLs.
* **Brand:** `/about` (story, founders, mission, Montessori/Waldorf inspiration), `/workshop` (process, machines, materials, video), `/team`, `/editorial-policy`.
* **Trust:** `/shipping`, `/returns`, `/warranty`, `/safety`, `/installments`, `/trust`. They are linked from the footer of every page **and** from the product page's trust strip, so policies are always one click away.

### 1.7 Breadcrumb trails

| Page | Visible trail (also `BreadcrumbList`) |
|---|---|
| Category | خانه › فروشگاه › {category} |
| Product | خانه › فروشگاه › {primary category} › {product} |
| Article | خانه › مجله › {topic} › {short title} |
| Topic hub | خانه › مجله › {topic} |
| Age hub | خانه › سن به سن › {range} |
| Glossary term | خانه › واژه‌نامه › {term} |
| Trust/brand page | خانه › {page} |
| Author | خانه › تیم چوبز › {name} |

Breadcrumbs render as `<nav aria-label="مسیر صفحه"><ol>` above the H1 on every page except home. (Google has shown breadcrumb rich results on desktop only since January 2025. We render them anyway for users and LLMs.)

### 1.8 Pagination

* `/mag` shows page 1 (12 cards). `/mag/page/{n}` covers n ≥ 2. `/mag/page/1` redirects 301 to `/mag`. A page past the end returns 404.
* Every paginated page is self-canonical, indexable and `follow`. Its title gets the suffix « — صفحهٔ {n}». Pages link with plain `<a href>` for previous, next and page numbers (no `rel=prev/next`; Google ignores it).
* Paginated pages are left **out** of the sitemap. The articles they list are in it.
* Implement with `generateStaticParams` + `'use cache'` + `cacheTag('posts')`, not `searchParams`. Under Cache Components, `searchParams` is runtime data and would make the route dynamic.

### 1.9 Faceted navigation (filters and sort)

1. `/shop`, `/shop/{category}` and `/age/{range}` render the **full** list on the server.
2. The filter UI is a small client island using `<button>`s, never `<a href>`. It filters the list already in the DOM and mirrors state into the URL with `history.replaceState`, for example `?age=12-36&sort=price-asc`. On load it reads `location.search` and re-applies the filter. The server ignores these params, so the route stays prerendered.
3. The canonical URL is always the clean path. robots.txt disallows the facet params (§5.2) so they never consume crawl budget.
4. A facet that deserves to rank gets a **real path** with its own copy, never a parameter URL. Examples: `/age/1-3-years`, or a future curated collection like `/shop/montessori-furniture`.
5. Variant params (`color`, `size`, `material`) are **not** disallowed. Google must be able to fetch variant URLs (§3.5.4).

### 1.10 Keyword ownership: one query intent, one URL

Cannibalisation is the main risk when a product, a pillar, a hub and a glossary term all share a name. Every page in the seed **MUST** have a `primaryQuery` (Phase 2 column; seed constant for now), and two indexable URLs can't share one.

| Query (example) | Intent | Owner URL | Supporting (links in, different primary query) |
|---|---|---|---|
| «برج یادگیری»، «خرید برج یادگیری»، «قیمت برج یادگیری» | Commercial | `/product/learning-tower` | pillar, glossary |
| «برج یادگیری چیست»، «برج یادگیری از چند سالگی» | Informational | `/mag/learning-tower-guide` | product, hub |
| «برج یادگیری یعنی چه / Learning Tower» | Definition | `/glossary/learning-tower` (short, links to the pillar) | — |
| «آشپزی با کودک»، «مطالب برج یادگیری» | Collection | `/mag/topic/learning-tower` | — |
| «مثلث پیکلر»، «قیمت مثلث پیکلر» | Commercial | `/product/pikler-triangle` | `/mag/pikler-triangle-guide` |
| «وسایل پیکلر»، «وسایل صعود کودک» | Category | `/shop/pikler-climbing` | — |
| «وسایل مونته سوری»، «اسباب بازی مونته سوری» | Category | `/shop/montessori-furniture` (or `/shop` until it has ≥ 3 products) | `/mag/topic/montessori` |
| «خرید قسطی سیسمونی»، «خرید قسطی اسباب بازی» | Commercial | `/installments` | `/faq#installments` |
| «اسباب بازی کودک ۱ تا ۳ سال» | Commercial-informational | `/age/1-3-years` | — |

If GSC shows two of our URLs swapping on one query for more than 4 weeks, either merge them (301) or narrow the weaker page's title and H1 to its own intent. Never `noindex` a page just to "fix" cannibalisation without first trying to differentiate it.

---

## 2. Metadata

### 2.1 Global `<head>` (root layout)

```tsx
// src/app/layout.tsx (excerpt)
import type { Metadata, Viewport } from "next";
import { SITE } from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),                       // https://choobz.kids
  applicationName: "چوبز کیدز",
  robots: {
    index: true, follow: true,
    "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1,
  },
  alternates: { types: { "application/rss+xml": [{ url: "/mag/rss.xml", title: "مجله چوبز" }] } },
  verification: {
    google: process.env.GSC_VERIFICATION,                // fallback; the primary is the DNS TXT record (§6.6)
    yandex: process.env.YANDEX_VERIFICATION,
    other: { "msvalidate.01": process.env.BING_VERIFICATION ?? "" },
  },
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: { siteName: "چوبز کیدز", locale: "fa_IR", type: "website" },
  twitter: { card: "summary_large_image" },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }], apple: "/apple-icon.png" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1,                // never disable zoom
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F6EFE4" }, { media: "(prefers-color-scheme: dark)", color: "#2B2420" }], // [VERIFY palette]
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa-IR" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
```

* Remove the `next/font/google` Geist imports from the current scaffold. All fonts are self-hosted (`docs/FONTS.md`).
* The favicon is a square, a multiple of 48 px, and shows the duck-on-cart mark (Google shows it in mobile results). `manifest.webmanifest` uses `"lang": "fa-IR", "dir": "rtl"`.
* **Metadata MUST never depend on runtime data.** `generateMetadata` reads only route params and `'use cache'` DB queries. This keeps every tag in the prerendered `<head>`. Defence in depth: extend `htmlLimitedBots` so non-JS crawlers always get blocking metadata in `<head>`. Next's default list doesn't include AI crawlers, Telegram, Bale or Torob.

```ts
// next.config.ts (excerpt)
// Default copied from next@16.4.2 dist/shared/lib/router/utils/html-bots.js. Re-check on every Next upgrade.
const NEXT_DEFAULT_HTML_LIMITED_BOTS =
  "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight";
const EXTRA = "Googlebot|GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-User|Claude-SearchBot|PerplexityBot|Perplexity-User|CCBot|Amazonbot|DuckAssistBot|MistralAI-User|meta-external|TelegramBot|Bale|torob|emalls|crawler|spider|\\bbot\\b";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: "standalone",
  skipTrailingSlashRedirect: true,           // proxy.ts does slash + case + redirect table in ONE hop
  htmlLimitedBots: new RegExp(`${NEXT_DEFAULT_HTML_LIMITED_BOTS}|${EXTRA}`, "i"),
  async rewrites() {
    return { beforeFiles: [{ source: "/sitemap.xml", destination: "/sitemap-index.xml" }] };
  },
  // images.localPatterns for /media/** etc. per the performance spec
};
```

### 2.2 Length rules for Persian

Google truncates by pixel width, not by character count. Persian glyphs in Google's result fonts average roughly Latin width, so these limits work in practice. Count with `[...str].length`; a ZWNJ counts as one character.

| Field | Target | Hard max | Rule |
|---|---|---|---|
| `<title>` | 40–58 chars | 60 | The primary keyword in the first 30 characters. The brand suffix « \| چوبز کیدز» (12 chars) is **dropped** if it would push the title past 60. Google shows the site name separately anyway |
| `meta description` | 120–155 chars | 160 | It must stand on its own in its first 110 characters (mobile cut). Include one concrete fact (age, material, installments) and one CTA verb. Unique per URL |
| H1 | ≤ 70 chars | — | One per page. It may differ from `<title>`: the H1 is for readers, the title for the SERP |
| `og:title` | = title without the brand suffix | 90 | — |
| `og:description` | = meta description | 200 | — |
| Image `alt` | 60–125 chars | 150 | §7.2 |

**Persian punctuation in titles:** use ، ؛ ؟ «» and « | » (spaces around the pipe). No emoji, no ALL-CAPS Latin, no `!!`. Use correct ZWNJ (اسباب‌بازی، مونته‌سوری، می‌شود) and Persian ی/ک only. The helper in §6.5 normalises on save.

### 2.3 Templates per page type

`{…}` = DB field. `~` = drop when over the limit. Examples are character-counted.

| Page type | `<title>` pattern | Example (chars) | Description pattern |
|---|---|---|---|
| Home | `چوبز کیدز \| {brand promise}` | «چوبز کیدز \| اسباب‌بازی و وسایل چوبی مونته‌سوری کودک» (51) | «وسایل چوبی مونته‌سوری و پیکلر، ساخت کارگاه چوبز: برج یادگیری، مثلث پیکلر، کتابخانه و چیدمان اتاق کودک. ارسال به سراسر ایران و خرید ۴ قسطی با اسنپ‌پی.» (149) |
| `/shop` | `فروشگاه وسایل چوبی کودک؛ مونته‌سوری و پیکلر \| چوبز کیدز` | (55) | `{productCount} محصول چوبی برای کودک ۰ تا ۶ سال؛ … ارسال سراسری و خرید قسطی.` |
| Category | `{category.seoTitle ?? category.name + " چوبی کودک"} ~\| چوبز کیدز` | «پیکلر و وسایل صعود چوبی کودک \| چوبز کیدز» (40) | `{tagline}؛ {count} مدل برای {ageRange}، از {material}. ارسال به سراسر ایران، خرید قسطی.` e.g. «مثلث پیکلر، آرک و دیوار صعود چوبی برای کودکان ۶ ماه تا ۵ سال؛ ساخته‌شده از تخته چندلایی توس با لبه‌های گرد. ۷ مدل، ارسال به سراسر ایران، خرید قسطی.» (147) |
| Product | `{name} {qualifier}؛ قیمت و خرید ~\| چوبز کیدز` | «برج یادگیری مونته‌سوری چوبی؛ قیمت و خرید \| چوبز کیدز» (52) | `{summary first sentence} مناسب {age}، {material}. {price} تومان یا ۴ قسط با اسنپ‌پی.` e.g. «برج یادگیری چوبز کودک ۱٫۵ تا ۴ ساله را با امنیت کنار کابینت می‌آورد؛ سکوی ۳ ارتفاعی، چوب توس و روکش ایمن. ۶٬۹۰۰٬۰۰۰ تومان یا ۴ قسط با اسنپ‌پی.» (~150). Price is optional: omit it when prices change more than once a month |
| `/mag` | `مجله چوبز \| راهنمای بازی، رشد و اتاق کودک` | (41) | «راهنماهای مونته‌سوری، پیکلر، بازی آزاد و چیدمان اتاق کودک؛ نوشتهٔ کارشناسان و بازبینی‌شده، با تجربهٔ کارگاه چوبز.» |
| `/mag/page/n` | `مجله چوبز — صفحهٔ {n}` | — | the hub description + « (صفحهٔ {n})» |
| Topic hub | `{topic.name}: همهٔ راهنماها و مقاله‌ها ~\| مجله چوبز` | «مونته‌سوری در خانه: همهٔ راهنماها و مقاله‌ها \| مجله چوبز» (56) | `{tagline}. {n} مقاله دربارهٔ …` |
| Article | `{post.seoTitle ?? post.title} ~\| چوبز کیدز` (question form preferred) | «برج یادگیری چیست و از چند سالگی مناسب است؟ \| چوبز کیدز» (54) | `{excerpt}`: the direct answer in 1–2 sentences, plus a promise of what else the article covers |
| Age hub | `بازی و وسایل مناسب کودک {range} ~\| چوبز کیدز` | «بازی و وسایل مناسب کودک ۱ تا ۳ سال \| چوبز کیدز» (46) | «مهم‌ترین مهارت‌های رشد در {range}، بازی‌های پیشنهادی و وسایل چوبی مناسب این سن؛ بازبینی‌شده توسط {reviewer}.» |
| Glossary index | `واژه‌نامهٔ مونته‌سوری، پیکلر و بازی کودک \| چوبز کیدز` | — | «تعریف کوتاه و دقیق {n} اصطلاح …» |
| Glossary term | `{term} چیست؟ تعریف کوتاه و کاربرد \| واژه‌نامه چوبز` | «مثلث پیکلر چیست؟ تعریف کوتاه و کاربرد \| واژه‌نامه چوبز» (54) | `{definition}`, the quotable sentence verbatim (≤ 155 characters) |
| FAQ | `سؤالات متداول خرید، ارسال و اقساط \| چوبز کیدز` | (45) | — |
| About | `داستان چوبز کیدز؛ از کارگاه کوچک تا اتاق کودک شما` | (49) | — |
| Workshop | `کارگاه چوبز؛ ساخت وسایل چوبی کودک در {city}` | — | — |
| Shipping | `ارسال و هزینهٔ ارسال به سراسر ایران \| چوبز کیدز` | (47) | Real numbers: delivery days and free-shipping threshold |
| Returns | `بازگشت کالا و ضمانت ۷ روزه بازگشت \| چوبز کیدز` | (45) | — |
| Safety | `ایمنی و متریال: چوب، رنگ و استاندارد محصولات \| چوبز کیدز` | (56) | — |
| Installments | `خرید قسطی سیسمونی و وسایل چوبی کودک با اسنپ‌پی \| چوبز کیدز` | (58) | «پرداخت در ۴ قسط با اسنپ‌پی … [VERIFY terms]» |
| Author | `{name}، {jobTitle} \| چوبز کیدز` | — | the short bio (≈35 words) |
| Search | `جستجو برای «{q}» \| چوبز کیدز` + `noindex` | — | — |
| 404 | `صفحه پیدا نشد \| چوبز کیدز` (status 404) | — | — |

The DB `seoTitle` and `seoDescription` override the patterns. Phase 2 CMS shows a live character counter and SERP preview, and **warns** on duplicates. A CI check (§7.9) fails the build on duplicate titles or descriptions across sitemap URLs.

### 2.4 Canonical rules

* Every indexable page emits an absolute self-canonical, `alternates.canonical = SITE.url + path`, built from route params. `products.canonicalPath` and its equivalents override it (rare: consolidation only).
* Variant URLs (`?color=white`) canonicalise to the product URL. So do filter, sort, `utm_*`, `fbclid` and `gclid` URLs. These come out right automatically because the canonical never uses the query string.
* Paginated pages are self-canonical, never canonical to page 1.
* `.md` alternates, RSS, `llms*.txt` and the Torob API send `X-Robots-Tag: noindex` and no canonical.
* Don't combine `noindex` with a canonical to another URL. Pick one.

### 2.5 Open Graph and Twitter

| Tag | Value |
|---|---|
| `og:type` | `website` (home, listings, products, trust pages) · `article` (`/mag/{slug}`, glossary terms) · `profile` (`/team/{slug}`) |
| `og:url` | the canonical URL |
| `og:image` | **1200×630 JPEG, ≤ 300 KB, a real photo with no text overlay** (WhatsApp and Telegram reliability). Generated at upload into `/data/uploads/og/{entity}/{id}.jpg` with sharp: a smart crop of the hero image. Add `og:image:width`, `og:image:height` and `og:image:alt` (= the hero alt) |
| `article:*` | `published_time` and `modified_time` (ISO 8601, `+03:30`), `author` (the `/team/{slug}` URL), `section` (topic name), `tag` (up to 5) |
| `twitter:card` | `summary_large_image` |

Google uses `og:image` **and** schema.org `primaryImageOfPage` and the main entity's `image` when picking thumbnails (image SEO docs, March 2026). All three point at the same file.

We deliberately avoid text-on-image OG cards. Google advises against text in preferred images, and Satori-based `ImageResponse` doesn't shape Persian reliably. If a branded card is wanted later, render it with sharp + librsvg (Pango/HarfBuzz shaping) in the upload pipeline, never at request time.

### 2.6 hreflang readiness

* Today: **no hreflang tags.** A single-language site gains nothing from self-referencing hreflang.
* If an English or Dari site is added: use the `/en/...` subfolder on the same host, with reciprocal `alternates.languages` (`fa-IR`, `en`, `x-default` → fa-IR) in both `<head>` and the sitemap (`xhtml:link`). `buildMetadata()` already accepts a `languages` map. Keep slugs identical across languages so the mapping is trivial.

### 2.7 Digits, dates and currency

| Surface | Digits | Number format | Example |
|---|---|---|---|
| title, description, H1, body, alt, button text | Persian | `٬` thousands, `٫` decimal | «۶٬۹۰۰٬۰۰۰ تومان»، «۱٫۵ سال» |
| JSON-LD, Torob meta and API, sitemaps, RSS dates, URLs, `<time datetime>`, `<data value>` | Latin | no separators | `69000000`, `2026-10-16T10:00:00+03:30` |

* **Dates:** visible dates are Jalali (`formatJalali` → «۲۴ مهر ۱۴۰۵») inside `<time datetime="2026-10-16T10:00:00+03:30">`. All machine dates are ISO 8601 with **`+03:30`**: Iran abolished DST in 2022, so Asia/Tehran is a fixed offset.
* **Currency.** The DB stores Toman (`products.price`). Rules:
  * JSON-LD: `"price": toman × 10` as a **number**, `"priceCurrency": "IRR"` (ISO 4217). Never `"IRT"`, never Toman labelled as IRR.
  * Visible: Toman with Persian digits. Google requires the marked-up price to match a visible one, so also print the rial amount once on the product page. Put it in the specs table row «قیمت به ریال: ۶۹٬۰۰۰٬۰۰۰ ریال», or as a small line under the price.
  * Torob meta and API: **Toman** integers (their spec).
  * **Redenomination risk:** the 2025 law removing four zeros (new rial = 10,000 current rials; subunit «قِران») is in its preparation phase, with a planned dual-circulation period `[VERIFY: CBI timeline]`. Keep **every** conversion in `src/lib/format.ts` (`tomanToRial` → rename it `toSchemaPrice`). Track ISO 4217 amendment notices. If ISO assigns a new code, the change is one function and a cache purge.

### 2.8 Implementation helper

```ts
// src/lib/seo/metadata.ts
import type { Metadata } from "next";
import { SITE } from "./site";

const BRAND_SUFFIX = " | چوبز کیدز";
export function composeTitle(core: string, suffix = BRAND_SUFFIX, max = 60): string {
  return [...core + suffix].length <= max ? core + suffix : core;
}
export function clampFa(text: string, max = 155): string {
  const chars = [...text.replace(/\s+/g, " ").trim()];
  if (chars.length <= max) return chars.join("");
  const cut = chars.slice(0, max - 1).join("");
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

type Img = { url: string; width: number; height: number; alt: string };
export function buildMetadata(i: {
  title: string; description: string; path: string; image?: Img;
  type?: "website" | "article" | "profile"; noindex?: boolean; suffix?: string;
  publishedTime?: string; modifiedTime?: string; authorUrls?: string[]; section?: string; tags?: string[];
  markdownPath?: string; torob?: Record<string, string>;
}): Metadata {
  const title = composeTitle(i.title, i.suffix);
  const description = clampFa(i.description);
  const url = new URL(i.path, SITE.url).toString();
  return {
    title: { absolute: title },
    description,
    // Nested `alternates` and `openGraph` objects REPLACE the root layout's (Next.js merges metadata shallowly),
    // so site-wide values (RSS link, siteName, locale) are repeated here.
    alternates: {
      canonical: url,
      types: {
        "application/rss+xml": [{ url: "/mag/rss.xml", title: "مجله چوبز" }],
        ...(i.markdownPath ? { "text/markdown": i.markdownPath } : {}),
      },
    },
    robots: i.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      siteName: "چوبز کیدز", locale: "fa_IR",
      type: i.type ?? "website", url, title: i.title, description,
      images: i.image ? [{ url: i.image.url, width: i.image.width, height: i.image.height, alt: i.image.alt }] : undefined,
      ...(i.type === "article" ? { publishedTime: i.publishedTime, modifiedTime: i.modifiedTime, authors: i.authorUrls, section: i.section, tags: i.tags } : {}),
    },
    other: i.torob,                                    // Torob product meta (§6.1); name="…" tags
  };
}
```

Each `page.tsx` exports `generateMetadata` that calls a `'use cache'` query (tagged `product:{slug}`, `post:{slug}`…) and then `buildMetadata()`.

---

## 3. Structured data (JSON-LD)

### 3.1 Principles

1. **One `<script type="application/ld+json">` per page** containing `{"@context":"https://schema.org","@graph":[…]}`. Render it in the **server component** of `page.tsx`, inside the prerendered static shell. It must never sit inside a `Suspense` boundary that resolves at request time, and never in a client component. Serialise it with `JSON.stringify(data).replace(/</g, "\\u003c")` (Next.js JSON-LD guide). Type the nodes with `schema-dts` (already a dev dependency). Don't use `next/script`.
2. **Stable `@id`s** (absolute URL + fragment). Within one page each `@id` is defined once; other nodes reference it with `{"@id": …}`.

| Node | `@id` |
|---|---|
| Organization (`OnlineStore`) | `https://choobz.kids/#organization` |
| Brand | `https://choobz.kids/#brand` |
| Logo | `https://choobz.kids/#logo` |
| WebSite | `https://choobz.kids/#website` |
| Org shipping policy (`ShippingService`) | `https://choobz.kids/shipping#policy` |
| Org return policy | `https://choobz.kids/returns#policy` |
| Any page | `{canonical}#webpage` · `{canonical}#breadcrumb` · `{canonical}#primaryimage` |
| Product / ProductGroup | `https://choobz.kids/product/{slug}#product` (variant: `…/{slug}?color={c}#product`) |
| Article | `https://choobz.kids/mag/{slug}#article` |
| Person | `https://choobz.kids/team/{slug}#person` |
| Glossary | `https://choobz.kids/glossary#termset` · `https://choobz.kids/glossary/{slug}#term` |
| FAQ / video / how-to / list | `{canonical}#faq` · `{canonical}#video-{n}` · `{canonical}#howto` · `{canonical}#itemlist` |

3. **Markup mirrors visible content.** Every price, rating, Q&A, date, author and step in JSON-LD **MUST** also appear as text on the page. This is Google policy, and LLMs cross-check it.
4. **Full organisation details live on `/` and `/about` only.** Every other page includes a *compact* Organization node (`@id`, `name`, `url`, `logo`, `sameAs`) so the page's graph stands on its own for parsers that read one page at a time.
5. **Machine values:** Latin digits, ISO 8601 dates with `+03:30`, absolute HTTPS URLs, schema.org enumeration URLs (`https://schema.org/InStock`), prices as numbers in IRR.
6. Don't overdo it. Google's 2026 AI-optimisation guide lists "overfocusing on structured data" as a myth. We mark up what Google, Bing and agents actually use, plus a few cheap entity links (`about`, `mentions`, `sameAs`) that disambiguate Persian text for LLMs.

Code layout: `src/lib/seo/ids.ts` (the `@id` builders), `src/lib/seo/jsonld.ts` (one node builder per type, e.g. `orgNode()`, `productNode()`, `articleNode()`) and `src/components/seo/JsonLd.tsx`:

```tsx
// src/components/seo/JsonLd.tsx (server component)
import type { Graph, Thing } from "schema-dts";
export function JsonLd({ nodes }: { nodes: Thing[] }) {
  const data: Graph = { "@context": "https://schema.org", "@graph": nodes as Graph["@graph"] };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
```

### 3.2 Entity registry (Wikidata, verified 2026-10-16)

Use these in `about`, `mentions`, `knowsAbout`, `topics.sameAs` and `glossary_terms.sameAs`. Prefer the Wikidata URL, `https://www.wikidata.org/wiki/Q…`; it's ASCII, stable and language-neutral. Add the English Wikipedia URL as a second `sameAs` where one exists. Don't put percent-encoded fa.wikipedia URLs in JSON-LD; link them visibly in the body instead.

| Entity | Wikidata | fa label / fawiki | enwiki |
|---|---|---|---|
| Montessori education (روش مونته‌سوری) | **Q190218** | روش مونته‌سوری | Montessori_education |
| Maria Montessori | **Q131117** | ماریا مونته‌سوری | Maria_Montessori |
| Montessori sensorial materials | **Q6905449** | — | Montessori_sensorial_materials |
| Emmi Pikler (Hungarian paediatrician) | **Q469559** | — | Emmi_Pikler |
| Pikler Institute (Lóczy, Budapest) | **Q2094807** | — | (dewiki) |
| Magda Gerber | **Q15046891** | — | Magda_Gerber |
| RIE (Resources for Infant Educarers) | **Q24534592** | — | Resources_for_Infant_Educarers |
| Waldorf education (آموزش والدورف) | **Q216690** | آموزش والدوروف | Waldorf_education |
| Rudolf Steiner | **Q78484** | رودلف اشتاینر | Rudolf_Steiner |
| Reggio Emilia approach (رویکرد رجیو) | **Q2137580** | رویکرد رجیو | Reggio_Emilia_approach |
| Free play (بازی آزاد) | **Q1454704** | — | Free_play |
| Child development (رشد کودک) | **Q407784** | رشد کودک | Child_development |
| Gross motor skill (مهارت حرکتی درشت) | **Q5610504** | — | Gross_motor_skill |
| Fine motor skill (مهارت حرکتی ظریف) | **Q46627** | — | Fine_motor_skill |
| Proprioception (حس عمقی) | **Q1129066** | حس عمقی | Proprioception |
| Vestibular system (سیستم دهلیزی) | **Q596832** | سیستم دهلیزی | Vestibular_system |
| Toddler (کودک نوپا) | **Q1340307** | کودک نوپا | Toddler |
| Infant (نوزاد) | **Q998** | نوزاد | Infant |
| Toy (اسباب‌بازی) | **Q11422** | اسباب‌بازی | Toy |
| Wooden toy | **Q16319458** | — | — |
| Toy safety | **Q7830552** | — | Toy_safety |
| Wall bars / Swedish ladder (نردبان سوئدی) | **Q1856307** | — | Wall_bars |
| Rocking chair (صندلی گهواره‌ای) | **Q14963** | صندلی گهواره‌ای | Rocking_chair |
| Bookcase (قفسه کتاب) | **Q215857** | قفسه کتابخانه | Bookcase |
| Baby furniture | **Q16836622** | — | Baby_furniture |
| Nursery room (اتاق کودک) | **Q1741939** | شیرخوارگاه | Nursery_(room) |
| Plywood (تخته چندلایی / سه‌لایی) | **Q219803** | تخته سه‌لایی | Plywood |
| Birch, *Betula* (توس) | **Q25243** | توس (درخت) | Birch |
| Beech, *Fagus* (راش) | **Q25403** | راش (درخت) | Beech |
| Linseed oil (روغن بزرک) | **Q818405** | روغن بزرک | Linseed_oil |
| Iran | **Q794** | ایران | Iran |
| Persian language | **Q9168** | فارسی | Persian_language |
| Instagram | **Q209330** | — | Instagram |

*Pikler triangle* and *learning tower* have **no Wikidata item**. Our `/glossary/{term}#term` DefinedTerm is their canonical entity, and articles reference it by `@id`. (Optional, off-site: someone neutral may create a Wikidata item for "Pikler triangle" with the Persian label «مثلث پیکلر», sourced from independent references. **Never** create a Wikidata item or Wikipedia article for Choobz itself; that's self-promotion and gets deleted.)

### 3.3 Which nodes go on which page

| Page | `@graph` nodes |
|---|---|
| `/` | `OnlineStore` (**full**, incl. policies), `Brand`, `WebSite` (+`SearchAction`), `WebPage`, `ImageObject` (#primaryimage). Optional: `ItemList` of featured categories |
| `/about` | `AboutPage` (`mainEntity` → org), `OnlineStore` (**full**), `BreadcrumbList` |
| `/workshop` | `WebPage`, compact org, `VideoObject`(s), `BreadcrumbList`. Add `ToyStore` (address, geo, opening hours, `parentOrganization`) **only if customers can visit** `[VERIFY]` |
| `/shop`, `/shop/{category}`, `/age/{range}`, `/mag`, `/mag/topic/{t}` | `CollectionPage`, `ItemList` (url-only `ListItem`s), `BreadcrumbList`, compact org, `WebSite`. A topic hub also gets `about` with Wikidata entities |
| `/product/{slug}` | `WebPage` (or `ItemPage`), `Product` **or** `ProductGroup` + variants, `BreadcrumbList`, compact org, `Brand`, `FAQPage` (if visible product FAQs), `VideoObject` (if any) |
| `/mag/{slug}` | `WebPage` (+`reviewedBy`, `lastReviewed`), `Article`, `Person` (author, reviewer: compact), `BreadcrumbList`, compact org, `ImageObject`. Plus `FAQPage`, `HowTo` (howto format), `VideoObject` and `ItemList` (list articles), each only if present on the page |
| `/glossary` | `CollectionPage`, `DefinedTermSet` (`hasDefinedTerm` = every term, name + url), `BreadcrumbList` |
| `/glossary/{term}` | `WebPage`, `DefinedTerm` (`mainEntity`), `BreadcrumbList` |
| `/faq` | `FAQPage` (it *is* the page node), `BreadcrumbList` |
| `/team/{slug}` | `ProfilePage` (`mainEntity` → full `Person`), `BreadcrumbList` |
| `/shipping` | `WebPage`, **full** `ShippingService` (`#policy`), `BreadcrumbList` |
| `/returns` | `WebPage`, **full** `MerchantReturnPolicy` (`#policy`), `BreadcrumbList` |
| `/contact` | `ContactPage`, compact org with `contactPoint` |
| `/gallery` | `CollectionPage`, `ImageObject`s (`creditText`, `caption`, `about` → product `@id`) |
| other trust, legal or policy pages | `WebPage`, `BreadcrumbList` |

### 3.4 Site-wide nodes: home page graph (complete example)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": "https://choobz.kids/#organization",
      "name": "چوبز کیدز",
      "alternateName": ["Choobz Kids", "چوبز", "Choobz"],
      "legalName": "[PLACEHOLDER: نام ثبتی شرکت]",
      "url": "https://choobz.kids",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://choobz.kids/#logo",
        "url": "https://choobz.kids/brand/choobz-logo-512.png",
        "contentUrl": "https://choobz.kids/brand/choobz-logo-512.png",
        "width": 512,
        "height": 512,
        "caption": "لوگوی چوبز کیدز: اردک چوبی روی گاری چرخ‌دار"
      },
      "image": { "@id": "https://choobz.kids/#logo" },
      "description": "چوبز کیدز سازندهٔ اسباب‌بازی و سیسمونی چوبی کودک با الهام از مونته‌سوری و والدورف است؛ همهٔ محصولات در کارگاه خود چوبز از تخته چندلایی توس ساخته می‌شوند.",
      "slogan": "کنار شما، برای ساختن دنیایی چوبی",
      "foundingDate": "[PLACEHOLDER: YYYY]",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "[PLACEHOLDER]",
        "addressLocality": "[PLACEHOLDER: شهر]",
        "addressRegion": "[PLACEHOLDER: استان]",
        "postalCode": "[PLACEHOLDER]",
        "addressCountry": "IR"
      },
      "telephone": "+98-21-0000-0000",
      "email": "support@choobz.kids",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "telephone": "+98-21-0000-0000",
          "email": "support@choobz.kids",
          "availableLanguage": ["fa"],
          "areaServed": "IR",
          "hoursAvailable": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["https://schema.org/Saturday", "https://schema.org/Sunday", "https://schema.org/Monday", "https://schema.org/Tuesday", "https://schema.org/Wednesday"],
            "opens": "09:00",
            "closes": "18:00"
          }
        },
        {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "name": "پشتیبانی در پیام‌رسان بله",
          "url": "https://ble.ir/[PLACEHOLDER]",
          "availableLanguage": ["fa"]
        }
      ],
      "sameAs": [
        "https://www.instagram.com/choobz.kids/",
        "https://ble.ir/[PLACEHOLDER]",
        "https://www.aparat.com/[PLACEHOLDER]",
        "https://torob.com/shop/[PLACEHOLDER]/"
      ],
      "areaServed": { "@type": "Country", "name": "ایران", "sameAs": "https://www.wikidata.org/wiki/Q794" },
      "knowsAbout": [
        { "@type": "Thing", "name": "روش مونته‌سوری", "sameAs": "https://www.wikidata.org/wiki/Q190218" },
        { "@type": "Thing", "name": "آموزش والدورف", "sameAs": "https://www.wikidata.org/wiki/Q216690" },
        { "@type": "Person", "name": "امی پیکلر", "sameAs": "https://www.wikidata.org/wiki/Q469559" },
        { "@type": "Thing", "name": "بازی آزاد", "sameAs": "https://www.wikidata.org/wiki/Q1454704" },
        { "@type": "Thing", "name": "اسباب‌بازی چوبی", "sameAs": "https://www.wikidata.org/wiki/Q16319458" },
        { "@type": "Thing", "name": "تخته چندلایی", "sameAs": "https://www.wikidata.org/wiki/Q219803" }
      ],
      "identifier": [
        { "@type": "PropertyValue", "propertyID": "IR-NationalID", "name": "شناسهٔ ملی", "value": "[PLACEHOLDER]" }
      ],
      "hasCertification": {
        "@type": "Certification",
        "name": "نماد اعتماد الکترونیکی (اینماد)",
        "issuedBy": { "@type": "Organization", "name": "مرکز توسعهٔ تجارت الکترونیکی", "url": "https://enamad.ir" },
        "certificationIdentification": "[PLACEHOLDER: eNamad id]",
        "url": "https://trustseal.enamad.ir/?id=[PLACEHOLDER]&Code=[PLACEHOLDER]"
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "@id": "https://choobz.kids/returns#policy",
        "applicableCountry": ["IR"],
        "returnPolicyCountry": "IR",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
        "itemDefectReturnFees": "https://schema.org/FreeReturn",
        "refundType": "https://schema.org/FullRefund",
        "itemCondition": "https://schema.org/NewCondition",
        "merchantReturnLink": "https://choobz.kids/returns"
      },
      "hasShippingService": {
        "@type": "ShippingService",
        "@id": "https://choobz.kids/shipping#policy",
        "name": "ارسال به سراسر ایران",
        "fulfillmentType": "https://schema.org/FulfillmentTypeDelivery",
        "handlingTime": {
          "@type": "ServicePeriod",
          "duration": { "@type": "QuantitativeValue", "minValue": 2, "maxValue": 7, "unitCode": "DAY" },
          "businessDays": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["https://schema.org/Saturday", "https://schema.org/Sunday", "https://schema.org/Monday", "https://schema.org/Tuesday", "https://schema.org/Wednesday"]
          },
          "cutoffTime": "12:00:00+03:30"
        },
        "shippingConditions": [
          {
            "@type": "ShippingConditions",
            "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "IR" },
            "orderValue": { "@type": "MonetaryAmount", "currency": "IRR", "minValue": 50000000 },
            "shippingRate": { "@type": "MonetaryAmount", "currency": "IRR", "value": 0 },
            "transitTime": { "@type": "ServicePeriod", "duration": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 5, "unitCode": "DAY" } }
          },
          {
            "@type": "ShippingConditions",
            "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "IR" },
            "orderValue": { "@type": "MonetaryAmount", "currency": "IRR", "maxValue": 49999990 },
            "shippingRate": { "@type": "MonetaryAmount", "currency": "IRR", "value": 1500000 },
            "transitTime": { "@type": "ServicePeriod", "duration": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 5, "unitCode": "DAY" } }
          }
        ]
      }
    },
    {
      "@type": "Brand",
      "@id": "https://choobz.kids/#brand",
      "name": "چوبز کیدز",
      "alternateName": "Choobz Kids",
      "logo": { "@id": "https://choobz.kids/#logo" },
      "url": "https://choobz.kids"
    },
    {
      "@type": "WebSite",
      "@id": "https://choobz.kids/#website",
      "url": "https://choobz.kids",
      "name": "چوبز کیدز",
      "alternateName": ["Choobz Kids", "چوبز", "choobz.kids"],
      "inLanguage": "fa-IR",
      "publisher": { "@id": "https://choobz.kids/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://choobz.kids/search?q={search_term_string}" },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "WebPage",
      "@id": "https://choobz.kids/#webpage",
      "url": "https://choobz.kids",
      "name": "چوبز کیدز | اسباب‌بازی و وسایل چوبی مونته‌سوری کودک",
      "isPartOf": { "@id": "https://choobz.kids/#website" },
      "about": { "@id": "https://choobz.kids/#organization" },
      "primaryImageOfPage": { "@id": "https://choobz.kids/#primaryimage" },
      "inLanguage": "fa-IR",
      "dateModified": "2026-10-16T10:00:00+03:30"
    },
    {
      "@type": "ImageObject",
      "@id": "https://choobz.kids/#primaryimage",
      "url": "https://choobz.kids/media/home/learning-tower-kitchen-mother-toddler-01.jpg",
      "contentUrl": "https://choobz.kids/media/home/learning-tower-kitchen-mother-toddler-01.jpg",
      "width": 1600,
      "height": 1067,
      "caption": "مادر و کودک نوپا کنار کابینت آشپزخانه روی برج یادگیری چوبی چوبز",
      "creditText": "چوبز کیدز",
      "copyrightNotice": "© چوبز کیدز"
    }
  ]
}
```

Notes:
* All numbers above are **examples**. The real values come from the `settings` table (§9).
* Return window: Iran's E-Commerce Law gives consumers a withdrawal right of **at least 7 working days**, and custom-made goods may be excluded. Name-engraved items are custom-made `[VERIFY with counsel]`. Set `merchantReturnDays` to the brand's published policy, which must be ≥ the legal minimum. If engraved items are excluded, say so on `/returns` and add a product-level `hasMerchantReturnPolicy` with `MerchantReturnNotPermitted` on those products.
* **Iranian working week:** Saturday to Wednesday, plus Thursday morning if the workshop ships then `[VERIFY]`.
* **`SearchAction`:** Google retired the sitelinks search box in November 2024. We keep the 6-line `SearchAction` because agents still read it. It costs nothing.
* **Google Merchant Center and Shopping free listings are not available to Iranian merchants.** The policy markup is still correct, is still read by Bing, LLMs and agents, and becomes useful the day availability changes.

### 3.5 Per-page examples

#### 3.5.1 BreadcrumbList (product)

```json
{
  "@type": "BreadcrumbList",
  "@id": "https://choobz.kids/product/learning-tower#breadcrumb",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "خانه", "item": "https://choobz.kids" },
    { "@type": "ListItem", "position": 2, "name": "فروشگاه", "item": "https://choobz.kids/shop" },
    { "@type": "ListItem", "position": 3, "name": "مبلمان مونته‌سوری", "item": "https://choobz.kids/shop/montessori-furniture" },
    { "@type": "ListItem", "position": 4, "name": "برج یادگیری مونته‌سوری" }
  ]
}
```

#### 3.5.2 Category: CollectionPage + ItemList

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://choobz.kids/shop/pikler-climbing#webpage",
      "url": "https://choobz.kids/shop/pikler-climbing",
      "name": "پیکلر و وسایل صعود چوبی کودک",
      "description": "مثلث پیکلر، آرک و دیوار صعود چوبی برای کودکان ۶ ماه تا ۵ سال؛ ساخته‌شده از تخته چندلایی توس با لبه‌های گرد.",
      "isPartOf": { "@id": "https://choobz.kids/#website" },
      "breadcrumb": { "@id": "https://choobz.kids/shop/pikler-climbing#breadcrumb" },
      "mainEntity": { "@id": "https://choobz.kids/shop/pikler-climbing#itemlist" },
      "about": [
        { "@type": "Person", "name": "امی پیکلر", "sameAs": "https://www.wikidata.org/wiki/Q469559" },
        { "@type": "Thing", "name": "مهارت حرکتی درشت", "sameAs": "https://www.wikidata.org/wiki/Q5610504" }
      ],
      "inLanguage": "fa-IR"
    },
    {
      "@type": "ItemList",
      "@id": "https://choobz.kids/shop/pikler-climbing#itemlist",
      "numberOfItems": 3,
      "itemListOrder": "https://schema.org/ItemListOrderAscending",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "url": "https://choobz.kids/product/pikler-triangle", "name": "مثلث پیکلر با رمپ و سرسره" },
        { "@type": "ListItem", "position": 2, "url": "https://choobz.kids/product/pikler-arch", "name": "آرک پیکلر و راکر" },
        { "@type": "ListItem", "position": 3, "url": "https://choobz.kids/product/swedish-wall", "name": "نردبان سوئدی و دیوار صعود" }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://choobz.kids/shop/pikler-climbing#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "خانه", "item": "https://choobz.kids" },
        { "@type": "ListItem", "position": 2, "name": "فروشگاه", "item": "https://choobz.kids/shop" },
        { "@type": "ListItem", "position": 3, "name": "پیکلر و وسایل صعود" }
      ]
    },
    { "@type": "OnlineStore", "@id": "https://choobz.kids/#organization", "name": "چوبز کیدز", "url": "https://choobz.kids", "logo": "https://choobz.kids/brand/choobz-logo-512.png", "sameAs": ["https://www.instagram.com/choobz.kids/"] }
  ]
}
```

Rules: `ListItem`s carry only `url` + `name`, the "summary page" pattern. Full `Product` markup appears **only** on the product's own page. **No `aggregateRating` on category pages**, since Google forbids ratings for a list of items.

#### 3.5.3 Product (single offer): `/product/learning-tower`

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ItemPage",
      "@id": "https://choobz.kids/product/learning-tower#webpage",
      "url": "https://choobz.kids/product/learning-tower",
      "name": "برج یادگیری مونته‌سوری چوبی؛ قیمت و خرید",
      "isPartOf": { "@id": "https://choobz.kids/#website" },
      "breadcrumb": { "@id": "https://choobz.kids/product/learning-tower#breadcrumb" },
      "primaryImageOfPage": { "@id": "https://choobz.kids/product/learning-tower#primaryimage" },
      "mainEntity": { "@id": "https://choobz.kids/product/learning-tower#product" },
      "inLanguage": "fa-IR",
      "dateModified": "2026-10-16T10:00:00+03:30"
    },
    {
      "@type": "Product",
      "@id": "https://choobz.kids/product/learning-tower#product",
      "name": "برج یادگیری مونته‌سوری چوبز",
      "alternateName": ["Learning Tower", "برج آموزشی", "کیچن هلپر", "چهارپایهٔ آشپزخانهٔ کودک"],
      "description": "برج یادگیری چوبز سکویی ایمن با نردهٔ چهارطرفه است که کودک ۱٫۵ تا ۴ ساله را هم‌قد کابینت آشپزخانه می‌کند؛ ارتفاع سکو در ۳ سطح قابل تنظیم است و از تخته چندلایی توس با لبه‌های گرد ساخته شده است.",
      "url": "https://choobz.kids/product/learning-tower",
      "image": [
        { "@id": "https://choobz.kids/product/learning-tower#primaryimage" },
        "https://choobz.kids/media/products/learning-tower/learning-tower-kitchen-toddler-02.jpg",
        "https://choobz.kids/media/products/learning-tower/learning-tower-adjustable-platform-03.jpg"
      ],
      "sku": "CZ-P1-NAT",
      "mpn": "CZ-P1",
      "brand": { "@id": "https://choobz.kids/#brand" },
      "manufacturer": { "@id": "https://choobz.kids/#organization" },
      "category": "مبلمان کودک > برج یادگیری",
      "material": "تخته چندلایی توس (Birch plywood) با روکش شفاف ایمن کودک",
      "color": "چوب طبیعی",
      "countryOfOrigin": { "@type": "Country", "name": "ایران", "sameAs": "https://www.wikidata.org/wiki/Q794" },
      "width": { "@type": "QuantitativeValue", "value": 45, "unitCode": "CMT" },
      "depth": { "@type": "QuantitativeValue", "value": 50, "unitCode": "CMT" },
      "height": { "@type": "QuantitativeValue", "value": 90, "unitCode": "CMT" },
      "weight": { "@type": "QuantitativeValue", "value": 9.5, "unitCode": "KGM" },
      "audience": { "@type": "PeopleAudience", "suggestedMinAge": 1.5, "suggestedMaxAge": 4 },
      "additionalProperty": [
        { "@type": "PropertyValue", "name": "حداکثر وزن قابل تحمل", "value": 80, "unitCode": "KGM" },
        { "@type": "PropertyValue", "name": "تعداد ارتفاع‌های سکو", "value": 3 },
        { "@type": "PropertyValue", "name": "زمان آماده‌سازی", "value": "۳ تا ۷ روز کاری" }
      ],
      "isRelatedTo": [{ "@id": "https://choobz.kids/product/kids-table-chair#product" }],
      "subjectOf": [{ "@id": "https://choobz.kids/mag/learning-tower-guide#article" }],
      "offers": {
        "@type": "Offer",
        "url": "https://choobz.kids/product/learning-tower",
        "price": 69000000,
        "priceCurrency": "IRR",
        "priceValidUntil": "2026-11-15",
        "priceSpecification": [
          { "@type": "UnitPriceSpecification", "price": 69000000, "priceCurrency": "IRR" },
          { "@type": "UnitPriceSpecification", "priceType": "https://schema.org/StrikethroughPrice", "price": 75000000, "priceCurrency": "IRR" }
        ],
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": { "@id": "https://choobz.kids/#organization" },
        "shippingDetails": { "@type": "OfferShippingDetails", "hasShippingService": { "@id": "https://choobz.kids/shipping#policy" } },
        "hasMerchantReturnPolicy": { "@id": "https://choobz.kids/returns#policy" },
        "warranty": { "@type": "WarrantyPromise", "durationOfWarranty": { "@type": "QuantitativeValue", "value": 12, "unitCode": "MON" } },
        "acceptedPaymentMethod": {
          "@type": "LoanOrCredit",
          "name": "خرید ۴ قسطی با اسنپ‌پی",
          "loanTerm": { "@type": "QuantitativeValue", "value": 4, "unitCode": "MON" },
          "provider": { "@type": "Organization", "name": "اسنپ‌پی", "url": "https://snapppay.ir" }
        }
      }
    },
    {
      "@type": "ImageObject",
      "@id": "https://choobz.kids/product/learning-tower#primaryimage",
      "url": "https://choobz.kids/media/products/learning-tower/learning-tower-natural-birch-01.jpg",
      "contentUrl": "https://choobz.kids/media/products/learning-tower/learning-tower-natural-birch-01.jpg",
      "width": 1600,
      "height": 1600,
      "caption": "برج یادگیری چوبی چوبز از چوب توس طبیعی با سکوی قابل تنظیم"
    }
  ]
}
```

(Add the `BreadcrumbList` from §3.5.1, the compact org and the `Brand` node to the same graph.)

Field mapping from the DB:

| JSON-LD | Source | Rule |
|---|---|---|
| `price` | `variant.price ?? product.price` | **× 10** (Toman → IRR), a number, no separators |
| `priceSpecification[StrikethroughPrice]` | `compareAtPrice` | Only when `compareAtPrice > price`. The sale price has **no** `priceType` |
| `priceValidUntil` | `min(saleEndsAt, renderDate + 30 days)` | Product pages use `cacheLife('days')`, so the date rolls forward. A **past** date suppresses rich results |
| `availability` | `in_stock`→`InStock`, `out_of_stock`→`OutOfStock`, `preorder`→`PreOrder`, `made_to_order`→`InStock` | For `made_to_order`, also emit a product-level `OfferShippingDetails` with `deliveryTime.handlingTime` = `leadTimeDays`. An offer-level override must contain the **required** props: `shippingRate`, `shippingDestination` and `deliveryTime`. Google's list has no `MadeToOrder` value |
| `audience` | `ageMinMonths / 12`, `ageMaxMonths / 12` | Years, at most 1 decimal place. Use `suggestedMinAge`/`suggestedMaxAge` only (Google reads these in years) |
| `width/depth/height/weight` | `dimensions`, `weightKg` | `unitCode` `CMT` / `KGM` |
| `additionalProperty` | `maxLoadKg`, `specs[]` | The same rows as the visible «مشخصات» table |
| `warranty` | `warrantyMonths` | `MON` |
| `isRelatedTo` / `isAccessoryOrSparePartFor` | `product_relations.kind` (`related` / an accessory) | e.g. the ramp → the triangle |
| `subjectOf` | `post_products` (posts linking this product) | `@id` of each article |
| `aggregateRating`, `review` | approved `reviews` | Only when ≥ 3 approved reviews with text and an author name (§3.5.10) |
| `gtin*` | — | No GTIN exists. Leave it out; `brand` + `mpn` + `sku` suffice |

#### 3.5.4 ProductGroup with variants: `/product/pikler-triangle`

Use this when a product has `product_variants` rows. Map option keys to `variesBy` (`رنگ` → `https://schema.org/color`, `اندازه` → `size`, `جنس` → `material`). Use the single-page model: one canonical URL, and every variant preselectable with a query param that changes the visible image, price and availability. The variant switcher is a client island; on load it reads `?color=` and the visible state follows. Google renders JavaScript, and the JSON-LD (static) lists every variant.

```json
{
  "@type": "ProductGroup",
  "@id": "https://choobz.kids/product/pikler-triangle#product",
  "name": "مثلث پیکلر چوبز با رمپ و سرسره",
  "alternateName": ["Pikler Triangle", "نردبان مثلثی", "مثلث بیکلر"],
  "description": "مثلث پیکلر تاشوی چوبز همراه با رمپ دوطرفه (سرسره و صعود) برای کودکان ۶ ماه تا ۵ سال؛ تخته چندلایی توس، لبه‌های گرد و پله‌های ضدلغزش.",
  "url": "https://choobz.kids/product/pikler-triangle",
  "productGroupID": "CZ-P3",
  "variesBy": ["https://schema.org/color"],
  "brand": { "@id": "https://choobz.kids/#brand" },
  "manufacturer": { "@id": "https://choobz.kids/#organization" },
  "material": "تخته چندلایی توس (Birch plywood)",
  "audience": { "@type": "PeopleAudience", "suggestedMinAge": 0.5, "suggestedMaxAge": 5 },
  "subjectOf": [{ "@id": "https://choobz.kids/mag/pikler-triangle-guide#article" }],
  "hasVariant": [
    {
      "@type": "Product",
      "@id": "https://choobz.kids/product/pikler-triangle?color=natural#product",
      "sku": "CZ-P3-NAT",
      "name": "مثلث پیکلر چوبز با رمپ — چوب طبیعی",
      "color": "چوب طبیعی",
      "image": "https://choobz.kids/media/products/pikler-triangle/pikler-triangle-ramp-natural-01.jpg",
      "offers": {
        "@type": "Offer",
        "url": "https://choobz.kids/product/pikler-triangle?color=natural",
        "price": 115000000,
        "priceCurrency": "IRR",
        "priceValidUntil": "2026-11-15",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": { "@id": "https://choobz.kids/#organization" },
        "shippingDetails": { "@type": "OfferShippingDetails", "hasShippingService": { "@id": "https://choobz.kids/shipping#policy" } },
        "hasMerchantReturnPolicy": { "@id": "https://choobz.kids/returns#policy" }
      }
    },
    {
      "@type": "Product",
      "@id": "https://choobz.kids/product/pikler-triangle?color=white#product",
      "sku": "CZ-P3-WHT",
      "name": "مثلث پیکلر چوبز با رمپ — سفید",
      "color": "سفید",
      "image": "https://choobz.kids/media/products/pikler-triangle/pikler-triangle-ramp-white-01.jpg",
      "offers": {
        "@type": "Offer",
        "url": "https://choobz.kids/product/pikler-triangle?color=white",
        "price": 122000000,
        "priceCurrency": "IRR",
        "priceValidUntil": "2026-11-15",
        "availability": "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": { "@id": "https://choobz.kids/#organization" },
        "shippingDetails": { "@type": "OfferShippingDetails", "hasShippingService": { "@id": "https://choobz.kids/shipping#policy" } },
        "hasMerchantReturnPolicy": { "@id": "https://choobz.kids/returns#policy" }
      }
    }
  ]
}
```

Rules: each variant has a unique `sku`. `productGroupID` = `products.sku` without the suffix (or `CZ-P{id}`). The variant `name` is more specific than the group's. Bundles (room sets) are a plain `Product` with an `isRelatedTo` list of their components, not a `ProductGroup`.

#### 3.5.5 Article: `/mag/learning-tower-guide`

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://choobz.kids/mag/learning-tower-guide#webpage",
      "url": "https://choobz.kids/mag/learning-tower-guide",
      "name": "برج یادگیری چیست و از چند سالگی مناسب است؟",
      "isPartOf": { "@id": "https://choobz.kids/#website" },
      "breadcrumb": { "@id": "https://choobz.kids/mag/learning-tower-guide#breadcrumb" },
      "primaryImageOfPage": { "@id": "https://choobz.kids/mag/learning-tower-guide#primaryimage" },
      "reviewedBy": { "@id": "https://choobz.kids/team/pediatric-ot#person" },
      "lastReviewed": "2026-10-18",
      "inLanguage": "fa-IR",
      "datePublished": "2026-10-20T09:00:00+03:30",
      "dateModified": "2026-10-20T09:00:00+03:30"
    },
    {
      "@type": "Article",
      "@id": "https://choobz.kids/mag/learning-tower-guide#article",
      "headline": "برج یادگیری چیست و از چند سالگی مناسب است؟",
      "description": "برج یادگیری سکویی ایمن با نردهٔ چهارطرفه است که کودک نوپا را هم‌قد کابینت می‌کند تا در آشپزی و کارهای روزمره شریک شود؛ معمولاً از حدود ۱۸ ماهگی، وقتی کودک مطمئن می‌ایستد.",
      "image": [
        "https://choobz.kids/media/posts/learning-tower-guide/cover-16x9.jpg",
        "https://choobz.kids/media/posts/learning-tower-guide/cover-4x3.jpg",
        "https://choobz.kids/media/posts/learning-tower-guide/cover-1x1.jpg"
      ],
      "datePublished": "2026-10-20T09:00:00+03:30",
      "dateModified": "2026-10-20T09:00:00+03:30",
      "author": { "@id": "https://choobz.kids/team/montessori-guide#person" },
      "publisher": { "@id": "https://choobz.kids/#organization" },
      "mainEntityOfPage": { "@id": "https://choobz.kids/mag/learning-tower-guide#webpage" },
      "isPartOf": { "@id": "https://choobz.kids/mag/topic/learning-tower#webpage" },
      "inLanguage": "fa-IR",
      "articleSection": "برج یادگیری و آشپزخانهٔ کودک",
      "keywords": ["برج یادگیری", "کیچن هلپر", "برج آموزشی", "مونته‌سوری در آشپزخانه"],
      "wordCount": 2400,
      "timeRequired": "PT10M",
      "audience": { "@type": "PeopleAudience", "audienceType": "والدین کودکان ۱ تا ۴ سال" },
      "about": [
        { "@id": "https://choobz.kids/glossary/learning-tower#term" },
        { "@type": "Thing", "name": "روش مونته‌سوری", "sameAs": ["https://www.wikidata.org/wiki/Q190218", "https://en.wikipedia.org/wiki/Montessori_education"] }
      ],
      "mentions": [
        { "@id": "https://choobz.kids/product/learning-tower#product" },
        { "@type": "Person", "name": "ماریا مونته‌سوری", "sameAs": "https://www.wikidata.org/wiki/Q131117" },
        { "@type": "Thing", "name": "کودک نوپا", "sameAs": "https://www.wikidata.org/wiki/Q1340307" },
        { "@type": "Thing", "name": "مهارت حرکتی ظریف", "sameAs": "https://www.wikidata.org/wiki/Q46627" }
      ],
      "citation": [
        { "@type": "CreativeWork", "name": "[VERIFY: title of source 1]", "url": "https://example.org/source-1", "publisher": { "@type": "Organization", "name": "[VERIFY]" } }
      ]
    },
    {
      "@type": "Person",
      "@id": "https://choobz.kids/team/montessori-guide#person",
      "name": "[PLACEHOLDER: نام نویسنده]",
      "url": "https://choobz.kids/team/montessori-guide",
      "jobTitle": "کارشناس آموزش مونته‌سوری",
      "worksFor": { "@id": "https://choobz.kids/#organization" }
    },
    {
      "@type": "Person",
      "@id": "https://choobz.kids/team/pediatric-ot#person",
      "name": "[PLACEHOLDER: نام بازبین]",
      "url": "https://choobz.kids/team/pediatric-ot",
      "jobTitle": "کاردرمانگر کودک"
    },
    {
      "@type": "ImageObject",
      "@id": "https://choobz.kids/mag/learning-tower-guide#primaryimage",
      "url": "https://choobz.kids/media/posts/learning-tower-guide/cover-16x9.jpg",
      "width": 1600,
      "height": 900,
      "caption": "کودک ۲ ساله روی برج یادگیری کنار مادرش سبزی می‌شوید"
    }
  ]
}
```

Rules:
* **`reviewedBy` and `lastReviewed` belong to `WebPage`, not `Article`.** schema.org defines `reviewedBy` on `WebPage` only, and validators flag it on `Article`. The visible byline shows the same reviewer and date.
* `dateModified` = `posts.contentUpdatedAt` (a new column, §9), set **only** when the content changes substantively. A typo fix must not bump it. Faking freshness is a spam signal.
* `author` is always a `Person` with a `url` to `/team/{slug}`. Use the `Organization` "تحریریهٔ چوبز" only for genuinely collective pieces (CONTENT-PLAN.md §4). **Never invent experts or credentials.**
* `image`: ≥ 1200 px wide, three ratios (16:9, 4:3, 1:1) cropped at upload. `citation` is generated from `posts.sources`. `about` and `mentions` come from glossary terms and topic `sameAs`.
* Use `Article` for every `/mag` format. `BlogPosting` adds nothing for Google, and these are editorial guides, not diary posts.

#### 3.5.6 Topic hub and age hub

```json
{
  "@type": "CollectionPage",
  "@id": "https://choobz.kids/mag/topic/montessori#webpage",
  "url": "https://choobz.kids/mag/topic/montessori",
  "name": "مونته‌سوری در خانه: همهٔ راهنماها و مقاله‌ها",
  "isPartOf": { "@id": "https://choobz.kids/#website" },
  "about": { "@type": "Thing", "name": "روش مونته‌سوری", "sameAs": ["https://www.wikidata.org/wiki/Q190218", "https://en.wikipedia.org/wiki/Montessori_education"] },
  "hasPart": [{ "@id": "https://choobz.kids/mag/montessori-at-home-guide#article" }],
  "mainEntity": {
    "@type": "ItemList",
    "@id": "https://choobz.kids/mag/topic/montessori#itemlist",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "url": "https://choobz.kids/mag/montessori-at-home-guide", "name": "مونته‌سوری در خانه؛ راهنمای کامل" },
      { "@type": "ListItem", "position": 2, "url": "https://choobz.kids/mag/montessori-vs-waldorf-vs-pikler", "name": "مونته‌سوری، والدورف یا پیکلر؟" }
    ]
  },
  "inLanguage": "fa-IR"
}
```

The age hub is identical in shape. It adds `"audience": {"@type":"PeopleAudience","suggestedMinAge":1,"suggestedMaxAge":3}` and an `ItemList` that mixes articles and products, in visible order.

#### 3.5.7 Glossary: DefinedTermSet + DefinedTerm

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "DefinedTerm",
      "@id": "https://choobz.kids/glossary/pikler-triangle#term",
      "name": "مثلث پیکلر",
      "alternateName": ["Pikler Triangle", "پیکلر", "بیکلر", "نردبان مثلثی"],
      "description": "مثلث پیکلر یک سازهٔ صعود چوبی و تاشو به شکل مثلث است که بر اساس ایده‌های دکتر امی پیکلر طراحی شده و به کودک ۶ ماه تا ۴ سال اجازه می‌دهد با سرعت خودش بالا رفتن، تعادل و هماهنگی بدن را تمرین کند.",
      "termCode": "pikler-triangle",
      "url": "https://choobz.kids/glossary/pikler-triangle",
      "inDefinedTermSet": { "@id": "https://choobz.kids/glossary#termset" },
      "subjectOf": [{ "@id": "https://choobz.kids/mag/pikler-triangle-guide#article" }]
    },
    {
      "@type": "DefinedTermSet",
      "@id": "https://choobz.kids/glossary#termset",
      "name": "واژه‌نامهٔ چوبز: مونته‌سوری، پیکلر و بازی کودک",
      "url": "https://choobz.kids/glossary",
      "inLanguage": "fa-IR",
      "publisher": { "@id": "https://choobz.kids/#organization" }
    },
    {
      "@type": "WebPage",
      "@id": "https://choobz.kids/glossary/pikler-triangle#webpage",
      "url": "https://choobz.kids/glossary/pikler-triangle",
      "name": "مثلث پیکلر چیست؟ تعریف کوتاه و کاربرد",
      "mainEntity": { "@id": "https://choobz.kids/glossary/pikler-triangle#term" },
      "isPartOf": { "@id": "https://choobz.kids/#website" },
      "inLanguage": "fa-IR"
    }
  ]
}
```

For terms that have a Wikidata item, add `"sameAs": ["https://www.wikidata.org/wiki/Q…"]`. For example `/glossary/montessori` → Q190218 and `/glossary/proprioception` → Q1129066. On `/glossary`, the `DefinedTermSet` carries `hasDefinedTerm`: an array of `{ "@type": "DefinedTerm", "@id": …, "name": …, "url": … }` for every term.

#### 3.5.8 FAQPage

```json
{
  "@type": "FAQPage",
  "@id": "https://choobz.kids/product/learning-tower#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "برج یادگیری از چند سالگی مناسب است؟",
      "acceptedAnswer": { "@type": "Answer", "text": "از زمانی که کودک بدون کمک و مطمئن می‌ایستد؛ معمولاً حدود ۱۸ ماهگی. برج یادگیری چوبز تا حدود ۴ سالگی و ۸۰ کیلوگرم بار قابل استفاده است." }
    },
    {
      "@type": "Question",
      "name": "آیا می‌توانم برج یادگیری را قسطی بخرم؟",
      "acceptedAnswer": { "@type": "Answer", "text": "بله، با اسنپ‌پی می‌توانید مبلغ را در ۴ قسط بپردازید. جزئیات در صفحهٔ خرید قسطی آمده است." }
    }
  ]
}
```

**Status:** Google stopped showing FAQ rich results on **2026-05-07** and removed the documentation on 2026-06-15. We keep `FAQPage` because the visible FAQ section is valuable to readers and answer engines, and the markup is a clean, verbatim Q/A structure for Bing, LLM crawlers and agents. Rules: Q&A text is identical to the visible `<details>` content; there is at most one `FAQPage` per URL; there are no promotional-only questions; and a Q&A appears on only one URL.

#### 3.5.9 VideoObject (workshop or product video)

```json
{
  "@type": "VideoObject",
  "@id": "https://choobz.kids/workshop#video-1",
  "name": "ساخت مثلث پیکلر در کارگاه چوبز؛ از برش CNC تا سنباده‌کاری",
  "description": "ببینید یک مثلث پیکلر چوبز چطور از ورق تخته چندلایی توس برش می‌خورد، لبه‌هایش گرد و سنباده می‌شود و روکش ایمن می‌گیرد.",
  "thumbnailUrl": ["https://choobz.kids/media/videos/workshop-pikler-triangle-poster-16x9.jpg"],
  "uploadDate": "2026-10-10T12:00:00+03:30",
  "duration": "PT1M45S",
  "contentUrl": "https://choobz.kids/media/videos/workshop-pikler-triangle-720p.mp4",
  "embedUrl": "https://www.aparat.com/video/video/embed/videohash/[PLACEHOLDER]/vt/frame",
  "inLanguage": "fa-IR",
  "creator": { "@id": "https://choobz.kids/#organization" },
  "publisher": { "@id": "https://choobz.kids/#organization" },
  "transcript": "[متن کامل گفتار ویدیو، همان متنی که زیر ویدیو نمایش داده می‌شود]"
}
```

Videos under 2 minutes are **self-hosted** on the volume (`/media/videos/*.mp4` + poster) with `preload="none"`. That gives Google a crawlable `contentUrl` and needs no third-party runtime request. Longer videos go on Aparat (YouTube is filtered in Iran) behind a click-to-load facade: poster image + button, with the iframe injected only on click. `transcript` mirrors the visible transcript. Google only shows video features when the video is the page's main content, so a product page video is a bonus, not a target.

#### 3.5.10 Reviews and AggregateRating (only with real reviews)

```json
{
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": 4.8, "bestRating": 5, "worstRating": 1, "ratingCount": 23, "reviewCount": 19 },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "مریم ر." },
      "datePublished": "2026-09-02",
      "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5 },
      "reviewBody": "دخترم ۱۹ ماهه است و هر روز با برج یادگیری کنار من سالاد درست می‌کند؛ محکم است و لبه‌هایش کاملاً صاف."
    }
  ]
}
```

Rules:
* Use only `reviews.status = 'approved'` rows that have a body and an author name, collected on our site or in our order follow-up flow.
* Emit `aggregateRating` only when there are **≥ 3** approved reviews. Put at most 5 `review` items in JSON-LD; the HTML may show more.
* Ratings and review text must be visible on the product page.
* **Never** mark up Instagram DMs, comment screenshots or `/reviews` testimonials as `Review`. They're self-serving brand testimonials, Google ignores them for organisations, and the July 2026 guidelines target undisclosed incentivised reviews.
* If a review was incentivised (gift, discount), disclose it visibly. Exclude it from the aggregate if in doubt.

#### 3.5.11 HowTo (assembly or installation posts only)

```json
{
  "@type": "HowTo",
  "@id": "https://choobz.kids/mag/swedish-wall-installation#howto",
  "name": "نصب ایمن نردبان سوئدی کودک روی دیوار آپارتمان",
  "totalTime": "PT45M",
  "tool": [{ "@type": "HowToTool", "name": "دریل چکشی" }, { "@type": "HowToTool", "name": "تراز" }],
  "supply": [{ "@type": "HowToSupply", "name": "رول‌پلاک و پیچ ۸ میلی‌متری (همراه محصول)" }],
  "step": [
    { "@type": "HowToStep", "position": 1, "name": "پیدا کردن دیوار مناسب", "text": "دیوار باید آجری یا بتنی باشد؛ روی دیوار گچی یا پانل کناف نصب نکنید.", "url": "https://choobz.kids/mag/swedish-wall-installation#step-1" },
    { "@type": "HowToStep", "position": 2, "name": "علامت‌گذاری و تراز", "text": "محل سوراخ‌ها را با الگوی همراه محصول و تراز علامت بزنید.", "url": "https://choobz.kids/mag/swedish-wall-installation#step-2" }
  ]
}
```

**Status:** Google has shown no HowTo rich results since September 2023. We emit `HowTo` automatically from the steps block, and only for `format = "howto"` posts, because it costs nothing editorially and gives Bing and LLMs explicit step order. The visible `<ol>` with `id="step-n"` anchors is what actually matters.

#### 3.5.12 Author: ProfilePage + Person (full)

```json
{
  "@type": "ProfilePage",
  "@id": "https://choobz.kids/team/workshop-lead#webpage",
  "url": "https://choobz.kids/team/workshop-lead",
  "dateModified": "2026-10-16T10:00:00+03:30",
  "mainEntity": {
    "@type": "Person",
    "@id": "https://choobz.kids/team/workshop-lead#person",
    "name": "[PLACEHOLDER: نام]",
    "jobTitle": "طراح و مدیر کارگاه چوبز",
    "description": "[PLACEHOLDER: بیوی کوتاه ۳۵ کلمه‌ای طبق CONTENT-PLAN.md §4]",
    "image": "https://choobz.kids/media/team/workshop-lead.jpg",
    "worksFor": { "@id": "https://choobz.kids/#organization" },
    "knowsAbout": [
      { "@type": "Thing", "name": "تخته چندلایی", "sameAs": "https://www.wikidata.org/wiki/Q219803" },
      { "@type": "Thing", "name": "ایمنی اسباب‌بازی", "sameAs": "https://www.wikidata.org/wiki/Q7830552" }
    ],
    "hasCredential": [
      { "@type": "EducationalOccupationalCredential", "credentialCategory": "certificate", "name": "[PLACEHOLDER: دوره یا مدرک واقعی]", "recognizedBy": { "@type": "Organization", "name": "[PLACEHOLDER]" } }
    ],
    "sameAs": ["https://www.instagram.com/[PLACEHOLDER]/"]
  }
}
```

Placeholder people (`authors.isPlaceholder`, §9) **MUST NOT** be published. Until a real person signs off, the byline is «تحریریهٔ چوبز» (Organization) and the reviewer slot stays empty, as CONTENT-PLAN.md §4 requires.

### 3.6 Feature status (Google, October 2026)

| Markup | Google result today | Use? |
|---|---|---|
| Product snippet (price, availability, rating) | ✓ Search | ✓ |
| Merchant listings / Shopping free listings | Requires Merchant Center, which isn't available to Iranian merchants | Markup kept (future, Bing, agents) |
| Organization (logo, knowledge panel signals, policies) | ✓ | ✓ |
| Article | ✓ (Top stories / Discover eligibility, byline understanding) | ✓ |
| BreadcrumbList | ✓ desktop only (since 2025-01) | ✓ |
| Review snippet / AggregateRating | ✓ for products (not self-serving org reviews) | ✓ conditional |
| VideoObject | ✓ when the video is the main content | ✓ |
| ProfilePage | ✓ (profile and author understanding) | ✓ |
| ProductGroup (variants) | ✓ | ✓ |
| FAQPage | ✗ since 2026-05-07 | ✓ (other engines, §3.5.8) |
| HowTo | ✗ since 2023 | ✓ howto posts only |
| Sitelinks search box (SearchAction) | ✗ since 2024-11 | ✓ (6 lines, for agents) |
| Speakable | beta, English news only | ✗ |
| DefinedTerm / DefinedTermSet | no Google feature | ✓ (entity clarity for LLMs; cheap) |

### 3.7 Validation

* At build time: TypeScript types via `schema-dts`, plus a unit test per builder that snapshots the graph and asserts invariants: every `@id` reference resolves inside the graph or is in the org/policy allowlist, every price is an integer, every date ends in `+03:30`.
* Before launch, and after every template change: Google Rich Results Test on one URL per page type, plus the Schema.org validator (validator.schema.org). Note that `reviewedBy` must be on `WebPage` to validate cleanly.
* After launch: the GSC Enhancement reports (Products, Breadcrumbs, Videos, Review snippets).

---

## 4. AEO and GEO content patterns

### 4.1 One strategy for every engine

* **Google's position (AI optimisation guide, updated 2026-07-10):** AI Overviews and AI Mode run on core Search ranking. There are no extra technical requirements. What matters most is **non-commodity content** (first-hand perspective). Google says to skip llms.txt, "chunking", AI-specific rewrites, inauthentic mentions and structured-data overkill. Mass-producing pages for fan-out sub-queries is **scaled content abuse**.
* **ChatGPT search, Perplexity, Claude and Copilot** retrieve pages, then quote **passages**. They favour pages that are crawlable without JavaScript, state facts in self-contained sentences, name entities explicitly, show dates and authors, and cite sources.
* **Our synthesis:** write people-first pages with a clear, conventional editorial structure: answer first, question-led sections, real tables, sourced numbers, named experts, and data only Choobz has. That *is* what both camps reward. We never write a second "AI version" of a page, never split one topic across thin pages, and never hide text for machines.

### 4.2 What LLM crawlers can and cannot parse

| Crawler | Executes JS? | Implication |
|---|---|---|
| Googlebot (also feeds Gemini, AI Overviews, AI Mode) | Yes (deferred rendering) | It sees client-rendered content eventually, but slower and less reliably |
| Applebot | Yes | — |
| GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, CCBot, Meta, Bytespider | **No.** They fetch JS files but don't run them (Vercel/MERJ crawler study) | Anything not in the **initial HTML** doesn't exist for them |

Rules (normative):
1. **SSR or prerender everything that carries meaning**, inside the static shell: H1, summary, body, prices and availability, specs, FAQ answers, review text, author box, dates, breadcrumbs, TOC, image `alt` and `figcaption`, tables, JSON-LD and metadata.
2. **Accordions and tabs:** use native `<details>/<summary>`, or tabs whose panels are all in the DOM with `hidden="until-found"`. Never fetch panel content on click.
3. **Client islands are for behaviour only:** filters, variant switcher, cart, checklist ticks, lightbox, glossary bottom-sheet, video facade. Their *content* (for example the glossary definition) is either in the DOM already or one plain `<a href>` away.
4. **No meaningful text in images, canvas or SVG `<text>`.** Illustrations get `aria-hidden="true"`. Price tags, speech bubbles and highlighter marks are HTML text styled with CSS.
5. **Keep HTML small.** Googlebot reads the first **2 MB** of an HTML file, and LLM fetchers truncate far earlier. Target ≤ 150 KB uncompressed for articles, including the inline RSC payload, and put the answer-first summary in the **first 2 KB of main-content text**. Don't inline large JSON props into client components; pass IDs and render on the server.
6. **Real links:** every navigational element is an `<a href>` to a canonical URL. No `onClick` routers, no `#` hrefs.
7. **Streaming:** don't wrap primary content in `Suspense`. Only the cart badge and other personalisation may stream.

### 4.3 Article anatomy (extends CONTENT-PLAN.md §5)

```html
<article itemid="https://choobz.kids/mag/learning-tower-guide#article">
  <nav aria-label="مسیر صفحه"><ol>…</ol></nav>
  <header>
    <p class="eyebrow"><a href="/mag/topic/learning-tower">برج یادگیری و آشپزخانهٔ کودک</a> · <a href="/age/1-3-years">۱ تا ۳ سال</a></p>
    <h1>برج یادگیری چیست و از چند سالگی مناسب است؟</h1>
    <p class="byline">
      نوشتهٔ <a href="/team/montessori-guide" rel="author">[نام]</a>، کارشناس آموزش مونته‌سوری ·
      بازبینی علمی: <a href="/team/pediatric-ot">[نام]</a>، کاردرمانگر کودک (<time datetime="2026-10-18">۲۶ مهر ۱۴۰۵</time>) ·
      به‌روزرسانی: <time datetime="2026-10-20T09:00:00+03:30">۲۸ مهر ۱۴۰۵</time> · ۱۰ دقیقه مطالعه
    </p>
  </header>
  <figure><img … fetchpriority="high" alt="کودک ۲ ساله روی برج یادگیری کنار مادرش سبزی می‌شوید"><figcaption>…</figcaption></figure>

  <section id="tldr" aria-labelledby="tldr-h" class="tldr">
    <h2 id="tldr-h">خلاصه در یک نگاه</h2>
    <ul>
      <li><strong>برج یادگیری</strong> سکویی با نردهٔ چهارطرفه است که کودک نوپا را هم‌قد کابینت آشپزخانه می‌کند.</li>
      <li>بیشتر کودکان از حدود <strong>۱۸ ماهگی</strong>، وقتی بدون کمک می‌ایستند، آماده‌اند.</li>
      <li>ارتفاع مناسب سکو: کمر کودک هم‌سطح لبهٔ کابینت (حدود ۹۰ سانتی‌متر از زمین).</li>
    </ul>
  </section>

  <nav aria-label="فهرست مطالب" class="toc"><ol><li><a href="#what-is-a-learning-tower">…</a></li>…</ol></nav>

  <section id="what-is-a-learning-tower" aria-labelledby="what-is-a-learning-tower-h">
    <h2 id="what-is-a-learning-tower-h">برج یادگیری چیست؟</h2>
    <p><dfn>برج یادگیری</dfn> (Learning Tower) سکوی ایستادهٔ ایمن با نرده است که …</p> <!-- 40–60-word direct answer first -->
    …
  </section>
  …
  <section id="faq"><h2>سؤالات متداول</h2><details open><summary>…</summary><p>…</p></details>…</section>
  <section id="sources"><h2>منابع</h2><ol><li id="cite-1"><cite>…</cite> — <a href="…">…</a> (دسترسی: ۲۰ مهر ۱۴۰۵)</li></ol></section>
  <aside class="author-box">…</aside>
</article>
```

| Pattern | Rule | Why |
|---|---|---|
| «خلاصه در یک نگاه» | 3–5 bullets, each ≤ 30 words, each true on its own. The first bullet contains the defining sentence | Featured snippets and LLM quotes take the first clear statement |
| Question H2s | Use the query's phrasing («از چند سالگی؟»، «چطور انتخاب کنیم؟»، «بهتر است یا…؟»). The first paragraph answers it in **40–60 words**, then elaborates | Passage retrieval matches the question; Iranian users search in questions |
| Quotable definitions | Use the pattern «X (English) یک … است که …». Wrap the term in `<dfn>`. Use the same sentence in the glossary `definition` and the `DefinedTerm.description` | Entity grounding; consistent quoting |
| Key facts box | A `<dl>` of number + unit + one-line meaning + a citation link | LLMs prefer "number + source" sentences |
| Comparison tables | A real `<table>` with `<caption>`, `<th scope="col">` / `<th scope="row">`, at most 6 columns. Mark the Choobz column but stay fair (include competitor-type options, not brand names) | Tables are lifted verbatim by answer engines |
| Statistics with sources | Every number from outside Choobz has an inline footnote `<sup><a href="#cite-n">[۱]</a></sup>` → the §Sources list (organisation, title, URL, access date). Use primary sources (WHO, CDC, AAP, AMI, Pikler Institute) | E-E-A-T; GEO cite-ability |
| Original data | «دادهٔ چوبز» blocks: workshop load tests, measured platform heights, customer surveys (with *n*, date and method). Each gets its own heading anchor so it can be cited | The "non-commodity" content Google asks for. Unique and unclonable |
| Visible dates | Published, updated and reviewed dates are always visible near the H1, and they equal the JSON-LD values | Freshness trust |
| Author + reviewer | Byline at the top, full author box at the bottom, links to `/team/{slug}` and `/editorial-policy`. YMYL posts (health, development, safety) **require** a reviewer | E-E-A-T |
| Sections | Natural sections of 150–400 words, one question each. Self-contained enough to quote, but **no artificial micro-chunking** and no splitting a topic into thin URLs | Matches Google's "no chunking needed" without hurting passage retrieval |
| «از کارگاه چوبز» callout | First-hand experience written by the workshop lead, with a photo | Experience in E-E-A-T, plus brand mentions inside the answer passage |

### 4.4 Stable heading anchors

* Every H2 and H3 has an author-defined ASCII `id`. In Markdown: `## برج یادگیری چیست؟ {#what-is-a-learning-tower}`, parsed by a remark plugin. The id must not change when the heading text is edited. The CMS stores an `anchor` field per heading.
* The fallback, if the author left it blank, is `s-{n}` (the section index). The CI check warns, because such ids are unstable.
* The TOC, «قدم بعدی» links, internal deep links (`/mag/x#ramp-safety`) and the Markdown alternate all use the same ids.
* Every anchored section has `aria-labelledby` pointing at its heading.

### 4.5 Entity consistency (the "one name per thing" register)

| Entity | Canonical Persian | Latin | Variants to cover once naturally (FAQ, alt, H3, `alternateName`) |
|---|---|---|---|
| Brand | **چوبز کیدز** | Choobz Kids | چوبز، Choobz، choobz.kids |
| P1 | **برج یادگیری** | Learning Tower | برج آموزشی، کیچن هلپر، چهارپایهٔ آشپزخانهٔ کودک، برج مونته‌سوری |
| P2 | **آرک پیکلر** | Pikler Arch / Rocker | راکر پیکلر، آرک تعادلی، الاکلنگ مونته‌سوری |
| P3 | **مثلث پیکلر** | Pikler Triangle | پیکلر، بیکلر، نردبان مثلثی |
| P4 | **نردبان سوئدی** | Swedish wall bars | دیوار صعود، نردبان ژیمناستیک کودک، دیوار سنگ‌نوردی کودک |
| P5 | **کتابخانهٔ روبه‌رو** | Front-facing bookshelf | کتابخانهٔ دیواری کودک، قفسهٔ کتاب مونته‌سوری |
| P6 | **رول نقاشی دیواری** | Wall art paper roll | رول کاغذ نقاشی، استند نقاشی دیواری |
| P7 | **میز و صندلی کودک** | Kids table & chair | میز تحریر کودک، میز بازی |
| P8 | **قفسهٔ مونته‌سوری** | Montessori low shelf | قفسهٔ اسباب‌بازی، شلف مونته‌سوری |
| Method | **مونته‌سوری** | Montessori | مونته سوری، مونتسوری |
| Method | **والدورف** | Waldorf | والدروف |
| Person | **امی پیکلر** | Emmi Pikler | امی پیکلر (پزشک مجارستانی) |

The same names are used in: page titles, H1s, `Product.name` and `alternateName`, glossary `term` and `alternateName`, Torob `title`, Instagram captions and highlights, Bale channel posts, the Torob shop profile and the eNamad record. Keep the **NAP** (name, address, phone) byte-identical across the site footer, `/contact`, JSON-LD, the eNamad record, the Torob/Emalls profiles and Neshan/Balad map listings (Google Business Profile isn't available to Iranian businesses).

### 4.6 Internal linking (implementation)

* **Breadcrumbs** on every page (§1.7).
* **Pillar ↔ supporting articles**, both directions, plus «قدم بعدی در این مسیر» (next in cluster), per CONTENT-PLAN.md §0-2.
* **Article → products:** 1–3 `ProductEmbed` cards with a «چرا اینجا؟» sentence (server-rendered cards with an `<a href="/product/…">`). **Product → articles:** a «راهنمای انتخاب» block linking the pillar and 2 supporting posts, from `post_products` reversed.
* **Automatic glossary links:** the first mention of a term per article (matched on `normalizeFa` + `alternateName`) becomes `<a href="/glossary/{slug}" class="term">`. The link is server-rendered; the tooltip is an enhancement. At most 8 auto-links per article, never inside headings.
* **Age hubs** link to every product and article whose age range overlaps theirs. Product and article age badges link back to the hub.
* **Anchor text** is descriptive Persian («راهنمای کامل مثلث پیکلر»), never «اینجا» or «کلیک کنید». Use it consistently for the same target.
* **Footer:** trust pages, the main categories, «مجله», «واژه‌نامه», «سؤالات متداول», and contact (Instagram, Bale, phone).
* **Orphans are forbidden:** CI fails if a sitemap URL has no internal links pointing to it (§7.9).

### 4.7 Product page AEO block

Server-render a «در یک نگاه» `<dl>` directly under the price on every product page:

| Row | Source |
|---|---|
| مناسب برای سن | `ageMinMonths`–`ageMaxMonths` → `formatAgeRange` + a link to the age hub |
| ابعاد | `dimensions` (W×D×H cm) + key extras (ارتفاع سکو) |
| حداکثر وزن قابل تحمل | `maxLoadKg` |
| جنس و روکش | `material`, `finish` (link to `/safety`) |
| زمان آماده‌سازی و ارسال | `leadTimeDays` + shipping policy |
| ضمانت | `warrantyMonths` (link to `/warranty`) |
| پرداخت | price + «یا ۴ قسط … با اسنپ‌پی» (link to `/installments`) |
| ساخت | «ساخت کارگاه چوبز، [شهر]» (link to `/workshop`) |

Then, in this order: the summary (`products.summary`, the answer-first 1–2 sentences), «چرا این محصول؟» (highlights), the specs table (incl. «قیمت به ریال», §2.7), «در جعبه چه هست؟», safety notes, care notes, a comparison table versus the sibling products, the product FAQ (5 Q&As), reviews, related guides and related products.

### 4.8 GEO measurement

* **AI referrals:** a self-hosted analytics event on landing, classifying `document.referrer` and `utm_source` into `chatgpt.com` (ChatGPT appends `utm_source=chatgpt.com`), `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai` and `google.com` (AI Overviews/AI Mode can't be separated client-side; GSC counts them inside "Web").
* **Bot logs:** parse the reverse-proxy access logs nightly into daily counts per UA family (§5.1 tokens) and status code. Alert when an allowed AI bot's 4xx/5xx share exceeds 5%, or when Googlebot's requests drop more than 50% week over week. That second alert is often the first sign of an Iran connectivity or firewall problem (§5.3).
* **Prompt panel:** the 30 fixed prompts per month from CONTENT-PLAN.md §7, run in ChatGPT, Perplexity, Gemini and Copilot. Record mention, citation URL and position.
* **GSC:** the per-sitemap indexing report (§7.1), queries by cluster (regex on the `/mag/` path plus the topic map), and the Generative AI performance report where it's available for the property.

---

## 5. Crawler policy, llms.txt and Markdown alternates

### 5.1 Bot-by-bot decision

**Decision: allow every reputable search, answer, user-fetch and training bot. Block `Bytespider`.**

Why we also allow *training* crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, Meta-ExternalAgent):
1. Persian is badly under-represented in training corpora. An authoritative Persian corpus on Montessori, Pikler and wooden play, written in our voice and naming our products, raises the odds that models recommend «چوبز» even when they answer **without** browsing.
2. **Google-Extended also controls grounding in the Gemini apps and Vertex AI.** Blocking it would remove us from Gemini answers that cite the web. It doesn't affect Search or AI Overviews.
3. We sell products, not content. No paywall or licensing revenue is at stake.
4. OpenAI may serve both search and training with one crawl when both are allowed, which means less load.
5. It's reversible: `Disallow` affects future crawls within about 24 hours (OpenAI's figure).
The risk is unattributed reuse of our text. We mitigate it with content that's inseparable from the brand: workshop photos, our own measurements, «دادهٔ چوبز», and named experts.

| Token | Operator | Purpose | Honours robots.txt | Decision |
|---|---|---|---|---|
| `Googlebot` | Google | Search, Discover, **AI Overviews/AI Mode** | ✓ | Allow |
| `Googlebot-Image`, `Googlebot-Video` | Google | Images, video | ✓ | Allow |
| `Storebot-Google` | Google | Shopping surfaces | ✓ | Allow |
| `Google-Extended` | Google | *Control token*: Gemini training **and grounding** (Gemini apps, Vertex) | ✓ (token) | Allow |
| `GoogleOther` | Google | Generic R&D fetches | ✓ | Allow (default) |
| `Bingbot` | Microsoft | Bing, Copilot, DuckDuckGo and others built on Bing | ✓ | Allow |
| `OAI-SearchBot` | OpenAI | **ChatGPT search** index. Opted-out sites don't appear in ChatGPT search answers | ✓ | Allow |
| `ChatGPT-User` | OpenAI | User-initiated fetches | "may not apply" | Allow |
| `GPTBot` | OpenAI | Foundation-model training | ✓ | **Allow** (see above) |
| `Claude-SearchBot` | Anthropic | Claude search index | ✓ | Allow |
| `Claude-User` | Anthropic | User-initiated fetches | ✓ | Allow |
| `ClaudeBot` | Anthropic | Training | ✓ (+`Crawl-delay`) | **Allow** |
| `PerplexityBot` | Perplexity | Perplexity search index (not training) | ✓ | Allow |
| `Perplexity-User` | Perplexity | User-initiated fetches | generally ignores | Allow |
| `Applebot` | Apple | Siri, Spotlight, Safari; may train | ✓ | Allow |
| `Applebot-Extended` | Apple | *Control token*: Apple generative-AI training | ✓ (token) | **Allow** |
| `CCBot` | Common Crawl | Open web corpus used by many LLMs | ✓ | **Allow** |
| `Meta-ExternalAgent` | Meta | AI training and indexing | ✓ | Allow |
| `Amazonbot` | Amazon | Alexa and Amazon AI | ✓ | Allow |
| `DuckAssistBot` | DuckDuckGo | AI answers (not training) | ✓ | Allow |
| `MistralAI-User` | Mistral | Le Chat user fetches | ✓ | Allow |
| `YandexBot` | Yandex | Yandex Search | ✓ | Allow |
| Torob / Emalls crawlers | price comparison | product pages | UA unverified `[VERIFY in logs]` | Allow (falls under `*`) |
| `Bytespider` | ByteDance | Training for products with no Iranian user benefit; historically aggressive | partly | **Block** (robots + a reverse-proxy UA rule) |

### 5.2 `src/app/robots.ts` (and its exact output)

A crawler that matches a named group **ignores** the `*` group. So the allowed bots are listed explicitly *with the same rules*. Otherwise a named `Allow: /` group would silently re-open `/search` and the facet URLs to that bot.

```ts
// src/app/robots.ts
import type { MetadataRoute } from "next";

const FACETS = ["sort", "age", "skill", "price", "in_stock", "q"];
const DISALLOW = [
  "/api/", "/torob_api/", "/md/", "/search", "/cart", "/checkout", "/account",
  ...FACETS.flatMap((p) => [`/*?${p}=`, `/*&${p}=`]),   // exact param names; never "age=" as a substring of "page="
];
const ALLOWED = [
  "Googlebot", "Googlebot-Image", "Googlebot-Video", "Storebot-Google", "Google-Extended",
  "Bingbot", "OAI-SearchBot", "ChatGPT-User", "GPTBot",
  "Claude-SearchBot", "Claude-User", "ClaudeBot", "PerplexityBot", "Perplexity-User",
  "Applebot", "Applebot-Extended", "CCBot", "Meta-ExternalAgent", "Amazonbot",
  "DuckAssistBot", "MistralAI-User", "YandexBot", "*",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ALLOWED, allow: "/", disallow: DISALLOW, other: { "Content-Signal": "search=yes, ai-input=yes, ai-train=yes" } },
      { userAgent: "Bytespider", disallow: "/" },
    ],
    sitemap: "https://choobz.kids/sitemap.xml",
  };
}
```

The output for each allowed agent, and for `*`, is the same block:

```txt
User-Agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /torob_api/
Disallow: /md/
Disallow: /search
Disallow: /cart
Disallow: /checkout
Disallow: /account
Disallow: /*?sort=
Disallow: /*&sort=
Disallow: /*?age=
Disallow: /*&age=
Disallow: /*?skill=
Disallow: /*&skill=
Disallow: /*?price=
Disallow: /*&price=
Disallow: /*?in_stock=
Disallow: /*&in_stock=
Disallow: /*?q=
Disallow: /*&q=
Content-Signal: search=yes, ai-input=yes, ai-train=yes

User-Agent: Bytespider
Disallow: /

Sitemap: https://choobz.kids/sitemap.xml
```

Notes:
* `/_next/` and `/media/` are **not** blocked; Google needs JS, CSS and images to render. Variant params (`color`, `size`) aren't blocked either (§1.9). `.md` alternates aren't blocked, because `Claude-User` honours robots and they exist for agents; `X-Robots-Tag: noindex` keeps them out of indexes.
* `Content-Signal` is Cloudflare's non-standard content-signals line. Unknown lines are ignored by parsers that don't support them, and it documents our intent. Watch the IETF `aipref` vocabulary and adopt it when it's standardised.
* robots.txt must answer **200 in < 200 ms**. A persistent 5xx on robots.txt makes Google stop crawling the whole site.

### 5.3 Server, WAF and hosting reachability (Iran-specific, critical)

1. **Never enable "Iran-only access" (دسترسی فقط از ایران) or a foreign-IP block** on the host, the data-centre firewall or the CDN (ArvanCloud, Derak…). Googlebot, Bingbot and every AI crawler connect from outside Iran. Many Iranian hosts switch these blocks on during DDoS events or international-connectivity disruptions. A few days of 5xx or timeouts makes Google slow its crawling and start dropping URLs.
2. **Bot-protection and JS challenges** must exempt verified crawlers. Google, Bing, OpenAI (`openai.com/searchbot.json`, `gptbot.json`, `chatgpt-user.json`) and Perplexity (`perplexity.com/perplexitybot.json`, `perplexity-user.json`) publish their IP ranges. Anthropic doesn't, so never require an IP allow-list to pass. Challenge on behaviour (rate), not on UA alone.
3. **Hosting topology:** serve users from Iran (latency), but make sure the origin or CDN edge is reachable internationally. Monitor from **outside Iran**: an external uptime check every 5 minutes on `/robots.txt`, `/` and one product URL. Alert on 2 consecutive failures. Check GSC → Settings → Crawl stats → Host status weekly.
4. During a planned outage, return **503 + `Retry-After`**, never 200 with an error page or 404.

### 5.4 `/llms.txt`

Generated by `src/app/llms.txt/route.ts` from the DB (`'use cache'` + `cacheTag('llms')`, revalidated on publish). Headers: `Content-Type: text/plain; charset=utf-8`, `X-Robots-Tag: noindex`. It follows the llmstxt.org format: H1 → blockquote → free details (no headings) → H2 link lists → `## Optional`. Links point to the **HTML** URLs, so citations land on real pages; the Markdown pattern is stated once in the details.

```markdown
# چوبز کیدز (Choobz Kids)

> چوبز کیدز برند ایرانی سازندهٔ اسباب‌بازی، سیسمونی و مبلمان چوبی کودک ۰ تا ۶ سال با الهام از مونته‌سوری، پیکلر و والدورف است. همهٔ محصولات در کارگاه خود چوبز در [PLACEHOLDER: شهر] از تخته چندلایی توس ساخته و به سراسر ایران ارسال می‌شوند.

Choobz Kids (choobz.kids) is an Iranian maker of Montessori- and Pikler-inspired wooden furniture and toys for children aged 0–6: learning towers, Pikler triangles and arches, Swedish wall bars, front-facing bookshelves, wall art paper rolls, kids' tables and low shelves. The site is in Persian (fa-IR). Prices are shown in Toman; 1 Toman = 10 Iranian rials (IRR).

- زبان سایت: فارسی. قیمت‌ها به تومان نمایش داده می‌شوند (در دادهٔ ساخت‌یافته به ریال).
- پرداخت: آنلاین یا ۴ قسط با اسنپ‌پی. نماد اعتماد الکترونیکی: [PLACEHOLDER].
- نسخهٔ Markdown هر مقاله، اصطلاح و محصول با افزودن `.md` به انتهای نشانی در دسترس است (مثلاً https://choobz.kids/mag/learning-tower-guide.md). هنگام نقل، لطفاً به نشانی اصلی صفحه لینک دهید.
- آخرین به‌روزرسانی: 2026-10-16

## فروشگاه
- [برج یادگیری مونته‌سوری](https://choobz.kids/product/learning-tower): سکوی آشپزخانهٔ کودک ۱٫۵ تا ۴ سال، ۳ ارتفاع، تحمل ۸۰ کیلوگرم
- [مثلث پیکلر با رمپ](https://choobz.kids/product/pikler-triangle): سازهٔ صعود تاشو برای ۶ ماه تا ۵ سال، رمپ دوطرفه سرسره/صعود
- [آرک پیکلر و راکر](https://choobz.kids/product/pikler-arch): …
- [پیکلر و وسایل صعود (دسته)](https://choobz.kids/shop/pikler-climbing): همهٔ مدل‌ها و مقایسه

## راهنماهای اصلی (مجله چوبز)
- [برج یادگیری چیست و از چند سالگی مناسب است؟](https://choobz.kids/mag/learning-tower-guide): تعریف، سن مناسب، ایمنی، راهنمای خرید
- [مثلث پیکلر: راهنمای کامل](https://choobz.kids/mag/pikler-triangle-guide): …
- [مونته‌سوری، والدورف یا پیکلر؟](https://choobz.kids/mag/montessori-vs-waldorf-vs-pikler): جدول مقایسه

## سن به سن
- [۰ تا ۱۲ ماه](https://choobz.kids/age/0-12-months)
- [۱ تا ۳ سال](https://choobz.kids/age/1-3-years)
- [۳ تا ۶ سال](https://choobz.kids/age/3-6-years)

## واژه‌نامه
- [مثلث پیکلر](https://choobz.kids/glossary/pikler-triangle): سازهٔ صعود چوبی تاشو بر اساس ایده‌های امی پیکلر
- [واژه‌نامهٔ کامل](https://choobz.kids/glossary)

## خرید، ارسال و اعتماد
- [ارسال و هزینهٔ ارسال](https://choobz.kids/shipping): [PLACEHOLDER: زمان و هزینه]
- [بازگشت کالا](https://choobz.kids/returns): [PLACEHOLDER: مهلت]
- [ضمانت](https://choobz.kids/warranty)
- [ایمنی و متریال](https://choobz.kids/safety)
- [خرید قسطی با اسنپ‌پی](https://choobz.kids/installments)
- [سؤالات متداول](https://choobz.kids/faq)

## دربارهٔ چوبز
- [داستان چوبز](https://choobz.kids/about)
- [کارگاه چوبز](https://choobz.kids/workshop)
- [تیم و نویسندگان](https://choobz.kids/team)
- [سیاست تحریریه و بازبینی](https://choobz.kids/editorial-policy)
- [تماس](https://choobz.kids/contact): تلفن، بله، اینستاگرام @choobz.kids

## Optional
- [همهٔ مقاله‌های مجله](https://choobz.kids/mag)
- [متن کامل سایت برای مدل‌های زبانی](https://choobz.kids/llms-full.txt)
```

Content rules: list every product and category, every pillar, the 3 age hubs, at most 20 glossary terms (the rest via the glossary link) and every trust page. Each description line is ≤ 120 characters and factual. No marketing superlatives. It's regenerated on every publish.

### 5.5 `/llms-full.txt`

`src/app/llms-full.txt/route.ts` concatenates, in this order: the llms.txt header block; **policies** (shipping, returns, warranty, safety, installments: full Markdown); **products** (§5.6 product Markdown for each); **pillars** (full Markdown); **glossary** (term + definition only); and **about/workshop**. Each document starts with:

```markdown
---
# {title}
URL: https://choobz.kids/{path}
Updated: 2026-10-20
```

Keep it ≤ 1 MB, dropping supporting articles first if needed. Same headers as llms.txt, and `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.

### 5.6 Markdown alternates

**Decision:** serve `/mag/{slug}.md`, `/glossary/{term}.md` and `/product/{slug}.md`. **No** `?format=md`: it's non-standard, and query variants complicate caching and canonicalisation. **No `Accept: text/markdown` content negotiation in Phase 1.** It needs `Vary: Accept` on the HTML responses, which Iranian CDNs cache poorly. Revisit it when there's a CDN that supports `Vary` properly. (Cloudflare's "Markdown for Agents", launched February 2026, and Claude Code already send `Accept: text/markdown`.)

* **Routing:** `src/proxy.ts` rewrites `^/(mag|glossary|product)/([a-z0-9-]+)\.md$` → `/md/$1/$2`, which `src/app/md/[type]/[slug]/route.ts` serves.
* **Headers:** `Content-Type: text/markdown; charset=utf-8` · `X-Robots-Tag: noindex` · `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` · `Link: <https://choobz.kids/mag/{slug}>; rel="alternate"; type="text/html"`.
* **Discovery:** the HTML page emits `<link rel="alternate" type="text/markdown" href="/mag/{slug}.md">` via `alternates.types` (§2.8).
* **Body:** YAML front matter (`title`, `url`, `author`, `reviewed_by`, `published`, `updated`, `language: fa-IR`), then the H1, the «خلاصه در یک نگاه» bullets, the body (`posts.body` with headings keeping their `{#anchor}`s), the FAQ as `### Q` + answer, and «منابع» as a numbered list. Products add a facts table (§4.7 rows), the price in Toman **and** IRR with «(قیمت در تاریخ {date})», availability, and the canonical URL.
* Unknown slug → 404 (plain text). Draft → 404.

---

## 6. Iran-specific requirements

### 6.1 Torob (ترب)

Torob is the dominant Iranian price-comparison engine. Its seller docs say small shops are added automatically after registration (`torob.com/sell`) and their product pages crawled. The Product API v3 is for reliable sync. We do both: **meta tags now, API in phase 1.5, webhook in phase 2.**

**(a) Product page meta tags.** These are the de-facto tags Torob's crawler reads, used by many Iranian shops and confirmed in several open-source integrations. `[VERIFY the exact list with Torob support during onboarding.]` They must be in the server HTML `<head>`; JSON-LD does **not** replace them.

```html
<meta name="product_id" content="12">                 <!-- == Torob API page_unique; never changes -->
<meta name="product_name" content="برج یادگیری مونته‌سوری چوبز">
<meta name="product_price" content="6900000">         <!-- TOMAN, Latin digits, no separators -->
<meta name="product_old_price" content="7500000">     <!-- only when discounted -->
<meta name="availability" content="instock">          <!-- instock | outofstock -->
<meta name="guarantee" content="۱۲ ماه ضمانت کارگاه چوبز">
<meta property="og:image" content="https://choobz.kids/media/og/product/12.jpg">  <!-- from openGraph; ≥ 600×600 effective -->
```

```ts
// src/lib/seo/torob.ts
import type { InferSelectModel } from "drizzle-orm";
import type { products } from "@/db/schema";
import { toFaDigits } from "@/lib/format";
type Product = InferSelectModel<typeof products>;
export function torobMeta(p: Product): Record<string, string> {
  const available = p.availability !== "out_of_stock";
  const m: Record<string, string> = {
    product_id: String(p.id),
    product_name: p.name,
    product_price: String(available ? p.price : 0),          // mirrors the API rule "0 for unavailable" [VERIFY]
    availability: available ? "instock" : "outofstock",
  };
  if (available && p.compareAtPrice && p.compareAtPrice > p.price) m.product_old_price = String(p.compareAtPrice);
  if (p.warrantyMonths) m.guarantee = `${toFaDigits(p.warrantyMonths)} ماه ضمانت کارگاه چوبز`;
  return m;                                               // passed as buildMetadata({ torob })
}
```

Variants (Phase 1): send **one** Torob entry per product. Use the default variant's price, and `instock` if any variant is in stock. Phase 2: if variants have different prices, emit one Torob product per variant (`page_unique = "{productId}-{variantId}"`, `product_group_id = "{productId}"`, `page_url = /product/{slug}?color={c}`). The meta tags on that URL must then reflect the variant, which means `generateMetadata` reads `searchParams`. That's acceptable because Torob, as an HTML-limited bot, gets blocking metadata (§2.1).

**(b) Product API v3** (`src/app/torob_api/v3/products/route.ts`). Spec from `github.com/torob/Torob-Sync` (`product_api_v3.md`, `torob_api_token_guide.md`):

* `POST`, JSON body, exactly **one** of: `{"page_urls":[…]}` · `{"page_uniques":[…]}` · `{"page":n,"sort":"date_added_desc"|"date_updated_desc"}` · `{"sort":"product_id_desc"}` · `{"cursor":"…","sort":"product_id_desc"}`. Anything else → `400 {"error":"…"}`. **No defaults.**
* **Auth:** headers `X-Torob-Token` (a JWT) and `X-Torob-Token-Version: 1`. The JWT is **EdDSA (Ed25519)**. Verify the signature against Torob's public key (below), then check `exp` ≥ now ≥ `nbf` and `aud` === the request `Host` header (incl. port). Anything else → 401. The reverse proxy **must** forward the original `Host`, otherwise `aud` never matches. Keep the server clock on NTP.
* **Response:** `{"api_version":"torob_api_v3","current_page":n,"total":N,"max_pages":M,"next_cursor":null|"…","products":[…]}`. Exactly **100** products per page except the last. Unpublished or hidden products are excluded. A single-product lookup for a removed product returns `"products":[]`, `"total":0`.

| Torob field | Choobz source | Rule |
|---|---|---|
| `page_unique` (req) | `String(product.id)` (variant: `"{id}-{variantId}"`) | = the `product_id` meta. Constant forever (never the slug) |
| `page_url` (req) | `https://choobz.kids/product/{slug}` | Absolute canonical URL |
| `product_group_id` | `String(product.id)` | Only with variants |
| `title` (req) | `name` (+ « — » + variant name) | ≤ 500 chars |
| `subtitle` | `subtitle` | ≤ 500 |
| `current_price` (req) | Toman, `variant.price ?? price` | Integer; **0 when unavailable** |
| `old_price` | `compareAtPrice` | Only when > price |
| `availability` (req) | `in_stock`, `made_to_order` or `preorder` → `true`; `out_of_stock` → `false` | — |
| `category_name` | `category.name` | — |
| `image_links` (req) | original `/media/...` URLs, absolute, main image first | Each ≥ **900×900** recommended, **< 600×600 is dropped**. No thumbnails |
| `short_desc` | `summary` | ≤ 500 |
| `spec` (req) | `{ "جنس": material, "روکش": finish, "ابعاد": "۴۵ × ۵۰ × ۹۰ سانتی‌متر", "مناسب برای سن": "۱٫۵ تا ۴ سال", "حداکثر تحمل وزن": "۸۰ کیلوگرم", …specs }` | `{}` if empty |
| `guarantee` | `warrantyMonths` → «۱۲ ماه ضمانت کارگاه چوبز» | ≤ 200 |
| `date_added` (req) | `publishedAt` | ISO 8601 `+03:30` |
| `date_updated` | `updatedAt` | Required for `date_updated_desc` |

```ts
// Ed25519 JWT verification with node:crypto only (no dependency)
import { createPublicKey, verify } from "node:crypto";
const TOROB_KEY = createPublicKey(
  "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAt6Mu4T0pBORY11W+QeM35UsmLO3vsf+6yKpFDEImFk0=\n-----END PUBLIC KEY-----\n",
); // from torob_api_token_guide.md (2026-10). [VERIFY on integration day]

export function verifyTorobToken(token: string, host: string, now = Math.floor(Date.now() / 1000)): boolean {
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return false;
  try {
    if (JSON.parse(Buffer.from(h, "base64url").toString()).alg !== "EdDSA") return false;
    if (!verify(null, Buffer.from(`${h}.${p}`), TOROB_KEY, Buffer.from(s, "base64url"))) return false;
    const c = JSON.parse(Buffer.from(p, "base64url").toString());
    return c.aud === host && typeof c.exp === "number" && now <= c.exp && typeof c.nbf === "number" && now >= c.nbf;
  } catch { return false; }
}
```

**(c) Webhook (phase 2):** after a product's price, stock or content changes, debounce for 60 s, then `POST https://api.torob.com/update/webhook/v1/` with `Authorization: Bearer {TOROB_WEBHOOK_TOKEN}` (issued by Torob support) and body `{"items":[{"page_url":"…","page_unique":"…"}]}`. That's 1–100 items, same domain, ≤ 20 requests per minute. A 200 only means "queued".

**(d) Consistency rule:** the page's visible price, the Torob meta, the API and the JSON-LD (× 10) must agree at all times. All four come from the same `'use cache'` product query, tagged `product:{slug}`, and are invalidated together.

### 6.2 Emalls (ایمالز)

No public technical spec exists. Onboarding is through the Emalls panel: open a support ticket with the store name and domain. Emalls either crawls product pages or takes a feed/API link. Our server-rendered price, the Torob meta tags and the `Product` JSON-LD cover crawling. If Emalls asks for a feed, expose `GET /emalls/products.json`, which reuses the Torob serialiser (same fields, plain JSON, no JWT, unlisted path, `Disallow`ed). `[VERIFY the format with Emalls support.]` Once the Emalls store page exists, add it to `sameAs`.

### 6.3 eNamad (نماد اعتماد الکترونیکی)

* **The code is the one issued in the eNamad panel**, embedded unchanged. Its known shape:
  `<a referrerpolicy="origin" target="_blank" href="https://trustseal.enamad.ir/?id={ID}&Code={CODE}"><img referrerpolicy="origin" src="https://trustseal.enamad.ir/logo.aspx?id={ID}&Code={CODE}" alt="" style="cursor:pointer" code="{CODE}"></a>`
* **It's the only allowed third-party runtime request** at page load (Iranian host). eNamad validates the **referrer/origin**, so:
  * Use a plain `<img>`, **not** `next/image`. Proxying through `/_next/image` breaks the validation. Don't self-host the logo.
  * Keep `referrerpolicy="origin"`. **Never** add `rel="noreferrer"` or a site-wide `Referrer-Policy: no-referrer`. The site-wide `strict-origin-when-cross-origin` is fine.
  * Wrap it in a fixed-size box (`width`/`height`, e.g. 85×92 `[VERIFY]`) so it can't cause CLS. Add `loading="lazy"` in the footer and eager loading on `/trust`.
* **Placement:** the site-wide footer (small); `/trust` (large, with an explanation of what eNamad means and how to verify it: «روی نماد کلیک کنید تا اطلاعات ثبت‌شدهٔ چوبز را در سایت اینماد ببینید»); the product-page trust strip (next to «ارسال»، «بازگشت ۷ روزه»، «اسنپ‌پی»); and the checkout summary.
* **Data:** store `settings.enamad = { id, code }`. It's also emitted as `hasCertification` (§3.4). The NAP on the site must match the eNamad record exactly.
* `[VERIFY]` eNamad's domain-ownership verification for a `.kids` gTLD (WHOIS or DNS) before launch.

### 6.4 SnappPay (اسنپ‌پی) installment messaging

| Surface | Copy (Persian digits) | Notes |
|---|---|---|
| Product page, directly under the price | «یا ۴ قسط ماهانهٔ ۱٬۷۲۵٬۰۰۰ تومانی با اسنپ‌پی» + the small SnappPay logo + «چطور؟» link → `/installments` | **Text in HTML**, not an image badge. The amount is `installments(price)` from `src/lib/format.ts` |
| Product card | chip «۴ قسط با اسنپ‌پی» | — |
| Cart / checkout | the 4-row schedule (date + amount) before redirecting to the gateway | SnappPay requires showing the number of installments before checkout `[VERIFY]` |
| `/installments` | the explainer: steps, eligibility, the FAQ «آیا قسطی خرید سیسمونی ممکن است؟» | Owns the queries «خرید قسطی سیسمونی / اسباب بازی» (§1.10) |
| Meta descriptions (products, home, categories) | «… یا خرید ۴ قسطی با اسنپ‌پی» | — |
| JSON-LD | `Offer.acceptedPaymentMethod` → `LoanOrCredit` (§3.5.3) | — |

Rules:
* Show the installment line only when the price is within the merchant's SnappPay eligible range. Read eligibility **server-side**, from the merchant API's eligibility endpoint or contract limits in `settings.snapppay` `[VERIFY]`, and cache it. Never load SnappPay scripts or widgets in the browser.
* Use "بدون سود / بدون کارمزد / بدون پیش‌پرداخت" only if the contract says so `[VERIFY]`. If our rounding (`ceil` to 1,000 Toman) can differ from SnappPay's real schedule, prefix the amount with «حدود».
* The logo is a self-hosted SVG from SnappPay's merchant brand kit, used under its guidelines `[VERIFY]`.

### 6.5 Persian typography and normalisation for search and slugs

**Storage normalisation (seed + CMS on save):** `normalizeFa` in `src/lib/format.ts` must be extended to:

| Input | Output | Why |
|---|---|---|
| `ي` U+064A, `ى` U+0649 | `ی` U+06CC | Arabic keyboards and copied text |
| `ك` U+0643 | `ک` U+06A9 | — |
| Arabic-Indic digits `٠-٩` | Persian `۰-۹` (in prose) | Visual consistency; `٤٥٦` render differently |
| Tatweel `ـ` U+0640 | removed | It breaks word matching («مـونـتـه‌سـوری»). Use Mikhak's `KSHD` axis for visual kashida (FONTS.md) |
| Repeated ZWNJ, ZWNJ next to a space or punctuation | single / removed | — |
| Stray bidi controls U+200E/F, U+202A–E, U+2066–9 | removed (except inside `<bdi>`-wrapped LTR runs) | Invisible noise in titles and slugs |
| any | NFC | Canonical code points |

**Correct ZWNJ** in all canonical text: «اسباب‌بازی»، «مونته‌سوری»، «می‌شود»، «کتاب‌ها»، «بزرگ‌ترین». Users mostly type a space («اسباب بازی»). Google largely treats these as equivalent, and the spaced variant appears once naturally (an FAQ question or an alt text), never stuffed.

**Mixed direction:** wrap Latin runs as `<span lang="en" dir="ltr">Pikler</span>`, and wrap SKUs and model codes in `<bdi dir="ltr">CZ-P1</bdi>`. Measurements use Persian digits and Persian units («۴۵ سانتی‌متر»).

**Search key** (site search, redirect keys, de-duplication). It is never shown to users:

```ts
// src/lib/seo/normalize.ts
const FOLD: Record<string, string> = { "ي": "ی", "ى": "ی", "ئ": "ی", "ك": "ک", "ة": "ه", "ۀ": "ه", "ؤ": "و", "أ": "ا", "إ": "ا", "ٱ": "ا", "آ": "ا" };
export function searchKey(input: string, joinZwnj = false): string {
  return input
    .normalize("NFC")
    .replace(/[يىئكةۀؤأإٱآ]/g, (c) => FOLD[c])
    .replace(/[ً-ٰٟٔ]/g, "")              // harakat, superscript alef, hamza above
    .replace(/ـ/g, "")                                    // tatweel
    .replace(/[‎‏‪-‮⁦-⁩]/g, "")  // bidi controls
    .replace(/[‌‍]/g, joinZwnj ? "" : " ")           // ZWNJ → space (or joined variant)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
```

**SQLite FTS5 index** (phase 1 search): one table `search_index(type, ref_id, title, body, title_j, body_j)`, `tokenize = 'unicode61 remove_diacritics 2'`. `title`/`body` = `searchKey(x)` and `title_j`/`body_j` = `searchKey(x, true)`. A query matches either column set, with a prefix match on the last token. Add a small synonyms map, expanded at query time: «مونتسوری، مونته سوری» → مونته سوری · «بیکلر» → پیکلر · «کیچن هلپر، برج آموزشی» → برج یادگیری · «نردبان سوئدی، دیوار صعود» · «سیسمونی، سیسمونى». Zero-result queries are stored, aggregated with no PII, as a content-gap signal.

**Slugs:** ASCII only (§1.1), so no normalisation is needed. Persian vanity paths in `redirects.fromPath` are stored as `searchKey(decodeURIComponent(path))` and looked up the same way.

**Persian in machine files:** sitemaps contain only ASCII URLs (UTF-8, no BOM, XML-escaped `& < > ' "`). RSS and llms files are UTF-8 with Persian text written directly, not as numeric entities. Any non-ASCII URL that does appear (for example a fa.wikipedia link in an article body) must be percent-encoded per RFC 3986 in `href`.

### 6.6 Search engines in Iran and verification

* **Market share (StatCounter, mid-2026):** Google ≈ **99.3%**, Bing ≈ 0.5–1.5%, Yandex ≈ 0.04%. Mobile is ≈ 61% of national search traffic; ours is ≈ 80%. We optimise for Google. **Bing matters for GEO**, because its index powers Copilot and DuckDuckGo and feeds other assistants. Yandex costs nothing via IndexNow.
* **Google Search Console:** create a **Domain property** verified by a **DNS TXT** record, which covers http/https/www and any subdomain. The `google-site-verification` meta (env `GSC_VERIFICATION`) is a fallback. Submit `https://choobz.kids/sitemap.xml`. Enable email alerts.
* **Bing Webmaster Tools:** import the site from GSC. Fallback: the `msvalidate.01` meta (env). Submit the sitemap and turn on the IndexNow insights.
* **Yandex Webmaster:** optional. The `yandex-verification` meta (env) and IndexNow cover it.
* Some Google and Microsoft webmaster consoles restrict access from Iranian IP ranges. Decide up front which team member administers them, and keep at least two verified owners.

### 6.7 Domain, maps and video platforms

* `.kids` is a generic TLD with no geotargeting. Google infers Iran from the Persian language, Toman/IRR prices, the `addressCountry: IR` and the phone number. Comply with the `.kids` registry content policy (child-safe content). Defensively register **`choobz.ir`** (IRNIC) and 301 it to `https://choobz.kids`.
* If the workshop or showroom address is public, list it on **Neshan** and **Balad** with identical NAP and the site URL. Google Business Profile verification isn't available to Iranian businesses `[VERIFY]`.
* **Aparat** is the video channel (YouTube is filtered). Add it to `sameAs`, and use Persian titles and descriptions that link back to the matching article. Embeds go behind a click-to-load facade (§3.5.9).

---

## 7. Technical SEO

### 7.1 Sitemaps

```
/sitemap.xml  ──rewrite──▶ /sitemap-index.xml   (route handler: <sitemapindex>)
  ├─ /sitemaps/pages/sitemap.xml        home, /shop, /mag, /age*, /glossary, /faq, brand + trust + legal pages, /team/*
  ├─ /sitemaps/categories/sitemap.xml   /shop/{category}
  ├─ /sitemaps/products/sitemap.xml     /product/{slug}  + <image:image> (gallery originals)
  ├─ /sitemaps/mag/sitemap.xml          /mag/topic/*, /mag/{slug}  + <image:image> (+ <video:video> for self-hosted video)
  └─ /sitemaps/glossary/sitemap.xml     /glossary/{term}
```

* Children use Next's typed `sitemap.ts` convention (`src/app/sitemaps/{type}/sitemap.ts`, served at `/sitemaps/{type}/sitemap.xml`), which handles XML escaping and `images` and `videos` entries. The index is a route handler, because Next has no sitemap-index convention. A folder named `sitemap.xml` would collide with Next's metadata-route detection, hence the `/sitemap-index.xml` + rewrite (§2.1).
* **Include only** canonical, indexable, 200, published URLs. **Exclude** paginated pages, `?` URLs, `.md`, `/search`, redirects, `noindex`, drafts and placeholder authors.
* **`<lastmod>` is real:** product = `updatedAt`; category = `max(category.updatedAt, its products' updatedAt)`; article = `contentUpdatedAt` (§9); hubs = the max of their items. **No `changefreq` or `priority`** (Google ignores them).
* **Images:** list only images visible on that page, using the original `/media/...` URL (not `/_next/image?...`), at most 1,000 per URL. Image titles and captions in sitemaps are deprecated (2022); only `<image:loc>`.
* Cache with `'use cache'` + `cacheTag('sitemap')`, invalidated on any publish. The index `lastmod` for each child = the max `lastmod` inside it.
* Discovery: the `Sitemap:` line in robots.txt + GSC and Bing submission + IndexNow. Google no longer supports sitemap "ping".

```ts
// src/app/sitemap-index.xml/route.ts
import { SITE } from "@/lib/seo/site";
import { sitemapLastmods } from "@/db/queries/seo";   // 'use cache' + cacheTag('sitemap')
export async function GET() {
  const lm = await sitemapLastmods();                    // { pages: Date, categories: Date, products: Date, mag: Date, glossary: Date }
  const body = (Object.keys(lm) as (keyof typeof lm)[])
    .map((k) => `<sitemap><loc>${SITE.url}/sitemaps/${k}/sitemap.xml</loc><lastmod>${lm[k].toISOString()}</lastmod></sitemap>`)
    .join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

// src/app/sitemaps/products/sitemap.ts
import type { MetadataRoute } from "next";
import { listProductsForSitemap } from "@/db/queries/seo";
import { abs } from "@/lib/seo/site";
import { mediaUrl } from "@/lib/paths";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return (await listProductsForSitemap()).map((p) => ({
    url: abs(`/product/${p.slug}`),
    lastModified: p.updatedAt,
    images: p.imagePaths.map((path) => abs(mediaUrl(path))),
  }));
}
```

### 7.2 Image SEO

| Aspect | Rule |
|---|---|
| Filenames | `{entity-slug}-{visual-descriptor}-{nn}-{hash6}.{ext}`, English kebab case, e.g. `learning-tower-kitchen-toddler-02-a1b2c3.jpg`. Stored under `/data/uploads/{area}/{slug}/` (area = products, posts, team, gallery, home). **Immutable**: replacing an image creates a new filename, which matches the `immutable` cache in the media route |
| Alt text (Persian) | Pattern: «{نام محصول/موضوع} {ویژگی دیداری متمایز} — {صحنه یا کاربرد}{، سن کودک}». 60–125 characters. Describe what's visible, with the product's canonical name once. No «عکس/تصویر» prefix, no keyword lists. Decorative images (wood-grain dividers, sprouts) get `alt=""` + `aria-hidden` |
| Alt examples | «برج یادگیری چوبی چوبز از چوب توس طبیعی با سکوی سه‌ارتفاعی، نمای سه‌رخ» · «کودک ۲ ساله روی برج یادگیری چوبز کنار کابینت آشپزخانه به مادرش کمک می‌کند» · «لبهٔ گرد و لایه‌های تخته چندلایی توس در نردهٔ برج یادگیری» · «برش CNC قطعات مثلث پیکلر از ورق تخته چندلایی توس در کارگاه چوبز» · «مثلث پیکلر چوبز در اتاق کودک یکی از مشتریان در اصفهان» |
| Captions | `<figure><figcaption>` for editorial and UGC images. Captions are read by users and LLMs, while alt is for accessibility and image search |
| Dimensions | Every `<img>` has `width`/`height` (or a CSS `aspect-ratio`), giving CLS 0. Originals are ≥ 1600 px on the long edge for products and covers. Torob needs ≥ 900×900 |
| Formats | Serve AVIF/WebP to browsers. JSON-LD, sitemaps, og:image and Torob reference the **original JPEG/PNG** `/media/...` URL (stable, universally decodable). The performance spec decides whether variants are pre-generated at upload or optimised by `next/image` |
| LCP image | The hero or product main image: `priority` / `fetchPriority="high"`, never lazy, with correct `sizes`. Everything below the fold is `loading="lazy"` |
| Structured data | `primaryImageOfPage` + the main entity's `image` + og:image all point at the same image. `ImageObject` gets `creditText`, `copyrightNotice` and `creator` (Choobz, or the customer family with consent). No `license` until a licensing page exists |
| UGC (عکس‌های شما) | Publish only with recorded consent (`media.consent`, §9). Strip EXIF GPS on upload. The caption names the product and city, never a child's full name |
| Consistency | Reuse the same URL for the same image across pages (Google image SEO, May 2025). Don't re-upload duplicates |

### 7.3 Core Web Vitals and performance budget

| Metric (p75, mobile, field) | Target | Hard limit |
|---|---|---|
| LCP | ≤ 2.0 s on 4G | 2.5 s |
| INP | ≤ 150 ms | 200 ms |
| CLS | ≈ 0.01 | 0.05 |
| TTFB | ≤ 500 ms (prerendered, from Iran) | 800 ms |
| FCP | ≤ 1.3 s | 1.8 s |

| Budget (transfer size, brotli) | Product / article | Home |
|---|---|---|
| HTML (incl. inline RSC payload) | ≤ 40 KB | ≤ 50 KB |
| CSS | ≤ 25 KB | ≤ 25 KB |
| Fonts preloaded | ≤ 70 KB (Estedad + Ario, FONTS.md) | same |
| JS first load (framework + route) | ≤ 110 KB | ≤ 110 KB |
| Route-specific island JS | ≤ 25 KB | ≤ 15 KB |
| LCP image | ≤ 90 KB (AVIF, 828w) | ≤ 110 KB |
| Third-party requests at load | **0** (eNamad lazily in the footer; Aparat only on click) | 0 |

* **Field data:** CrUX coverage for Iranian users is thin, so **RUM is the source of truth**. A ~1 KB client component uses `useReportWebVitals` (`next/web-vitals`) → `navigator.sendBeacon("/api/rum", …)` → a SQLite table `rum_metrics` (metric, value, rating, route template, device class, `effectiveType`, date). No cookies, IP or PII. Phase 2 adds the p75 dashboard.
* **Lab:** Lighthouse CI (mobile, simulated slow 4G) on one URL per template per PR. Performance ≥ 90, SEO = 100, Accessibility ≥ 95, Best Practices ≥ 95.
* **INP hygiene:** islands only; filters use `startTransition`; no long tasks over 50 ms on interaction; no heavy hydration (most of the page is server components).
* **CLS hygiene:** fixed-size eNamad and SnappPay slots, font fallbacks with `size-adjust` (FONTS.md), no injected banners above content, and an `aspect-ratio` on every media box.

### 7.4 Status codes, redirects and `proxy.ts`

| Situation | Response |
|---|---|
| Live page | 200 |
| Non-canonical form (uppercase, trailing slash, `//`) | **301** to the normalised path, query preserved, one hop |
| Slug changed, merged page, legacy URL, Persian vanity path | **301** from the `redirects` table (always to the **final** URL; no chains) |
| Discontinued product, successor exists | 301 → the successor product (not the home page) |
| Discontinued product, no successor | Keep the page for 6 months: `availability: Discontinued`, a visible «دیگر تولید نمی‌شود» notice + 3 alternatives. Then **410** via a `redirects` row with `statusCode = 410` |
| Unknown URL, draft, out-of-range page | **404** via `notFound()`. `not-found.tsx` shows search, the top categories and popular guides. **Never a soft 404** (200 + "not found") |
| Maintenance | **503** + `Retry-After: 3600` |

Keep redirect rows **forever**. Internal links must point to final URLs, never to redirects (CI check).

```ts
// src/proxy.ts (Next 16 "proxy", Node.js runtime)
import { NextResponse, type NextRequest } from "next/server";
import { lookupRedirect } from "@/db/redirect-cache";   // better-sqlite3 prepared stmt + in-memory Map, refreshed every 60 s
import { searchKey } from "@/lib/seo/normalize";

const MD = /^\/(mag|glossary|product)\/([a-z0-9-]+)\.md$/;

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const md = pathname.match(MD);
  if (md) return NextResponse.rewrite(new URL(`/md/${md[1]}/${md[2]}`, req.url));

  let path = pathname.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (/[A-Z]/.test(path)) path = path.toLowerCase();

  let decoded = path;
  try { decoded = decodeURIComponent(path); } catch { /* malformed escape: fall through to 404 */ }
  const hit = lookupRedirect(path) ?? lookupRedirect(searchKey(decoded));
  if (hit?.statusCode === 410) {
    return new NextResponse("<!doctype html><html lang=\"fa-IR\" dir=\"rtl\"><title>این صفحه حذف شده است</title><p>این صفحه برای همیشه حذف شده است. <a href=\"/shop\">فروشگاه چوبز</a></p></html>",
      { status: 410, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } });
  }
  const target = hit?.toPath ?? (path !== pathname ? path : null);
  if (target) {
    const dest = new URL(target, req.url);
    dest.search = search;
    return NextResponse.redirect(dest, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|media/|api/|torob_api/|md/|\\.well-known/|favicon\\.ico|icon|apple-icon|manifest|robots\\.txt|sitemap|llms).*)"],
};
```

(`[VERIFY]` that better-sqlite3 resolves inside the Node-runtime proxy bundle. If it doesn't, have the proxy read a JSON snapshot of the `redirects` table written to `/data/redirects.json` on every change.)

### 7.5 Internal search (`/search`)

* `robots: { index: false, follow: true }` + robots.txt `Disallow: /search` and `/*?q=`. Never in the sitemap. Never linked with a query from crawlable pages, except the `SearchAction` template.
* Results are server-rendered (shareable), backed by FTS5 with Persian folding (§6.5). The title is «جستجو برای «{q}»». An empty query shows popular categories and guides.
* "No results" returns **200** (it's a valid search page) with suggestions and a `noindex` meta.

### 7.6 RSS feed (`/mag/rss.xml`)

* RSS 2.0 with `xmlns:content`, `xmlns:dc` and `xmlns:atom`. The channel has `title` «مجله چوبز», `link` `https://choobz.kids/mag`, `language` `fa-IR`, `atom:link rel="self"`, `lastBuildDate`, and an `image` (the logo).
* **The last 30 published posts.** Each `item`: `title`, `link` and `guid isPermaLink="true"` (the canonical URL), `pubDate` (RFC 822 with `+0330`), `dc:creator` (author name), `category` (topic name), `description` (excerpt), and `content:encoded` in CDATA: `<div dir="rtl" lang="fa-IR">` + TL;DR + the full body HTML + the footer «این مطلب نخستین بار در <a href="{url}">مجله چوبز</a> منتشر شد.». Add an `enclosure` for the cover JPEG (`length` + `type`).
* Headers: `Content-Type: application/rss+xml; charset=utf-8`, `X-Robots-Tag: noindex`, `Cache-Control: public, max-age=1800`. Discovery is via `alternates.types` in the root layout (§2.1). Per-topic feeds (`/mag/topic/{t}/rss.xml`) are optional, for phase 2.

### 7.7 IndexNow

* Generate a 32-character hex key, keep it in env `INDEXNOW_KEY`, and commit `public/{key}.txt` containing only the key (it's public by design and must sit at the root to cover every URL).
* **Submit** to `POST https://api.indexnow.org/indexnow` (shared with Bing, Yandex, Naver, Seznam, Yep, the Internet Archive and Amazon) with body `{"host":"choobz.kids","key":"…","keyLocation":"https://choobz.kids/{key}.txt","urlList":[…]}`. That's ≤ 10,000 URLs per request, with `Content-Type: application/json; charset=utf-8`. 200/202 = OK. On 429, back off exponentially.
* **When:** on publish, update or unpublish (send deleted URLs too, so engines re-fetch and see the 404/410), and on price or stock changes. Phase 1: `npm run seo:indexnow`, a tsx script that diffs each sitemap URL's `lastmod` against `settings.indexnow.lastRunAt`. Phase 2: queue on every admin mutation, debounced for 60 s. Never submit `noindex` or redirected URLs.
* Google doesn't use IndexNow. For Google, rely on sitemaps and internal links.

### 7.8 HTTP headers (set in `next.config.ts` `headers()` or at the route)

| Path | Header |
|---|---|
| all HTML | `Content-Type: text/html; charset=utf-8` · `Referrer-Policy: strict-origin-when-cross-origin` (eNamad-safe) · `X-Content-Type-Options: nosniff` · HSTS `max-age=31536000; includeSubDomains` (at the reverse proxy) |
| `.md`, `/llms*.txt`, `/mag/rss.xml`, `/torob_api/*`, `/emalls/*`, `/md/*` | `X-Robots-Tag: noindex` |
| `/search` | meta `noindex, follow` (meta, not header, so `follow` applies) |
| `/media/*` | `Cache-Control: public, max-age=31536000, immutable` (already in place). No `X-Robots-Tag` (images must be indexable) |
| sitemaps | `Content-Type: application/xml; charset=utf-8` |
| 410 / 503 | per §7.4 (`Retry-After` on 503) |

### 7.9 Automated SEO checks (CI, before every deploy)

`npm run seo:audit` (`scripts/seo-audit.ts`, run with tsx against `next start` on the production build) fetches every URL in every child sitemap, plus one 404 probe and one `.md` per type, and **fails** on:
1. a status other than 200; `<link rel=canonical>` ≠ the URL; any `noindex` on a sitemap URL;
2. not exactly one `<h1>`; `<html>` not `lang="fa-IR" dir="rtl"`;
3. a title outside 30–60 characters or duplicated across URLs; a description outside 110–160 characters or duplicated;
4. JSON-LD that doesn't parse, lacks an `@graph`, has a dangling `@id` reference (outside the org/policy allowlist), a non-integer price, a `priceCurrency` other than `IRR`, or a date without `+03:30`;
5. on product pages: missing Torob meta, or Torob `product_price × 10 ≠` the JSON-LD price, or ≠ the `/torob_api` response for that `page_unique`;
6. `<img>` without an `alt` attribute; meaningful images with an empty alt (heuristic: inside `main`, ≥ 200 px);
7. internal links that return 3xx/4xx; any sitemap URL with zero internal inlinks (an orphan);
8. Arabic `ي`/`ك` or tatweel in text nodes or titles; non-ASCII characters in any internal `href` path;
9. HTML over 150 KB uncompressed; any third-party request in the initial HTML other than `trustseal.enamad.ir`.

Warnings (non-blocking): headings without author-defined anchors, articles without `sources`, YMYL posts without a reviewer, `priceValidUntil` within 7 days.

---

## 8. Checklists per page type

Tick these in code review for the template, and in content review for each new instance.

### 8.1 All pages (baseline)
- [ ] `<html lang="fa-IR" dir="rtl">`; one `<h1>`; a breadcrumb (except home); a skip link
- [ ] The title follows §2.3, is 40–60 characters and unique. The description is 120–155 characters and unique. Persian digits and punctuation, correct ZWNJ, Persian ی/ک
- [ ] Absolute self-canonical with no query string; robots meta default (`max-image-preview:large`)
- [ ] OG/Twitter tags with a 1200×630 JPEG; `og:locale=fa_IR`
- [ ] One JSON-LD `@graph` in the static shell; `@id`s per §3.1; compact org node; `BreadcrumbList`
- [ ] All meaningful content is in the initial HTML (no `Suspense` around it, no client-only text)
- [ ] Every link is an `<a href>` to a final URL; footer trust links are present
- [ ] Images have width/height and Persian alt; the LCP image has `fetchPriority="high"`; nothing else above the fold is lazy
- [ ] No third-party requests at load (eNamad lazy only); CWV budget per §7.3

### 8.2 Home `/`
- [ ] H1 states what Choobz is in Persian («اسباب‌بازی و وسایل چوبی مونته‌سوری، ساخت کارگاه چوبز»)
- [ ] **Full** `OnlineStore` (+ return and shipping policies, `sameAs` Instagram/Bale/Aparat/Torob, `contactPoint`, eNamad `hasCertification`) + `WebSite` (`name`, `alternateName`, `SearchAction`) + `Brand`
- [ ] Links to every category, the 3 age hubs, the pillar guides, `/workshop`, `/reviews`, `/installments`
- [ ] Visible trust strip: eNamad, SnappPay «۴ قسط», shipping, the returns window
- [ ] A short "about" paragraph with the brand's defining sentence. It must match the llms.txt blockquote and `Organization.description`

### 8.3 Shop and category `/shop`, `/shop/{category}`
- [ ] Intro copy of 80–200 words answering «چه وسایلی؟ برای چه سنی؟ از چه جنسی؟». FAQ block (3–5 questions) at the bottom
- [ ] Every product card is server-rendered: name, price (Toman), installment chip, age badge, `<a href="/product/…">`
- [ ] `CollectionPage` + url-only `ItemList`; **no** `aggregateRating`
- [ ] Filters are `<button>`s, the URL state uses `replaceState`, canonical = clean, robots.txt disallows the facet params
- [ ] Empty category → 404, or hidden from navigation (never an empty 200)

### 8.4 Product `/product/{slug}`
- [ ] H1 = the canonical Persian product name; the title is «{name} …؛ قیمت و خرید | چوبز کیدز»
- [ ] The answer-first `summary` + the «در یک نگاه» `<dl>` (§4.7) above the fold
- [ ] Visible price in Toman, plus «قیمت به ریال» in the specs; strikethrough when discounted; the SnappPay line; availability and lead time; warranty; the returns window
- [ ] `Product` or `ProductGroup` (variants: unique SKU, `?color=` URLs that preselect the image, price and stock) + `Offer` (IRR × 10, `priceValidUntil` in the future, `availability`, `itemCondition`, `shippingDetails` → `#policy`, `hasMerchantReturnPolicy` → `#policy`, `seller`) + `audience` (years) + `material`, dimensions, `additionalProperty` + `subjectOf` (guides) + `isRelatedTo`
- [ ] `aggregateRating` only with ≥ 3 approved, visible reviews
- [ ] Torob meta tags (`product_id`, `product_name`, `product_price` in Toman, `product_old_price`, `availability`, `guarantee`) are in `<head>` and match the API
- [ ] Image gallery: ≥ 4 images (main on a plain background, in use, detail with the ply edge, scale with a child), originals ≥ 1600 px, Persian alt, all in the products sitemap
- [ ] Product FAQ (5 Q&As, visible `<details>`) + `FAQPage`; links to the pillar guide, 2 articles, glossary terms and the age hub
- [ ] `/product/{slug}.md` exists; `<link rel="alternate" type="text/markdown">`
- [ ] A `primaryQuery` is assigned, with no conflict in the §1.10 table

### 8.5 Mag home `/mag` and pagination
- [ ] H1 «مجله چوبز…»; pillars first, then the latest posts; links to the 9 topic hubs and the 3 age hubs
- [ ] `CollectionPage` + `ItemList`; RSS discovery link
- [ ] `/mag/page/{n}`: self-canonical, « — صفحهٔ n» in the title, plain prev/next links, not in the sitemap, 404 past the end

### 8.6 Topic hub `/mag/topic/{topic}`
- [ ] A 300–500-word intro with the topic's defining sentence; the pillar link above the fold; every article in the cluster; 3–6 products; 5–10 glossary terms
- [ ] `CollectionPage` with `about` → the Wikidata entity (§3.2) + `ItemList` + `hasPart` → the pillar

### 8.7 Article `/mag/{slug}`
- [ ] Question-form H1/title; «خلاصه در یک نگاه» (3–5 self-contained bullets) right after the hero
- [ ] Byline: author (`/team/…`), reviewer (required for YMYL), visible published, updated and reviewed dates (Jalali in `<time datetime>` ISO `+03:30`), reading time
- [ ] Question H2s with author-defined ASCII anchors; a 40–60-word answer first; a TOC when over 1,200 words
- [ ] Every external statistic is footnoted to the «منابع» list; at least one «دادهٔ چوبز» or «از کارگاه چوبز» first-hand block
- [ ] Real `<table>`s for comparisons; `<ol>` with `id="step-n"` for steps; `<details>` FAQ (5 Q&As)
- [ ] 1–3 product embeds; links to the pillar or its siblings, plus the next article in the cluster; glossary auto-links (≤ 8)
- [ ] JSON-LD: `WebPage` (+`reviewedBy`, `lastReviewed`) + `Article` (`headline`, 3 image ratios, `author` Person `@id`, `publisher`, dates, `about`/`mentions` with Wikidata, `citation`, `isPartOf` topic) + `FAQPage` / `HowTo` / `VideoObject` when present
- [ ] YMYL: the medical disclaimer is visible and the reviewer is a real person (never a placeholder)
- [ ] `dateModified` changes only on substantive edits; `/mag/{slug}.md` exists; IndexNow ping on publish

### 8.8 Age hub `/age/{range}`
- [ ] H1 with the range in Persian digits; anchored sub-range sections (`#1-2-years`…)
- [ ] Milestone summary reviewed by an expert, with sources; the products whose age range overlaps; related articles
- [ ] `CollectionPage` + `audience` (`PeopleAudience` min/max years) + `ItemList`

### 8.9 Glossary `/glossary`, `/glossary/{term}`
- [ ] Index: alphabetical sections with ASCII anchors; every term listed with its one-line definition; `DefinedTermSet` + `hasDefinedTerm`
- [ ] Term: H1 «{term} چیست؟»; the first paragraph is the quotable definition (identical to `DefinedTerm.description`); `alternateName` spelling variants visible («به آن … هم می‌گویند»); a link to the pillar; related products; `sameAs` Wikidata when it exists
- [ ] ≤ 300 words. If the term has a pillar, the term page's title stays definitional to avoid cannibalisation (§1.10)

### 8.10 FAQ `/faq`
- [ ] Sections with anchors; every answer complete and server-rendered in `<details>`; the first question open
- [ ] `FAQPage` mirrors the visible text verbatim; no Q&A duplicated from product or article pages

### 8.11 About, workshop and team
- [ ] `/about`: brand story, founders (real names and photos), the Montessori/Waldorf/Pikler inspiration with links to the glossary, the full `OnlineStore` JSON-LD, the eNamad badge
- [ ] `/workshop`: process photos and video (self-hosted short clip + transcript), materials and finishes, safety tests; `VideoObject`; `ToyStore` only if it's open to visitors
- [ ] `/team/{slug}`: `ProfilePage` + `Person` (`jobTitle`, `worksFor`, `knowsAbout`, real `hasCredential`, `sameAs`); a list of authored and reviewed articles; `isPlaceholder = false`
- [ ] `/editorial-policy`: who writes, who reviews, how sources are chosen, how corrections are made, the commercial disclosure

### 8.12 Contact and trust pages
- [ ] `/contact`: `ContactPage`; NAP identical to JSON-LD and eNamad; phone as `tel:`; Bale/Instagram links; hours
- [ ] `/shipping`: real delivery times and costs (they match the `ShippingService` JSON-LD); carriers; cities; made-to-order lead times
- [ ] `/returns`: the window (≥ the legal minimum), conditions, exclusions (engraved or custom items), process, who pays return shipping (matches `MerchantReturnPolicy`)
- [ ] `/warranty`, `/safety` (materials, finishes, edge treatment, load tests, standards. Only claim certifications you hold), `/installments` (+`FAQPage`), `/trust` (eNamad, eager)
- [ ] Every trust page is linked from the footer and from the product page's trust strip

### 8.13 Search, 404 and transactional pages
- [ ] `/search`: `noindex, follow`, `Disallow`ed, server-rendered results, zero-result logging
- [ ] 404: real 404 status; search box; top categories and guides; no redirect to home
- [ ] `/cart`, `/checkout`, `/account`: `noindex`, `Disallow`ed, never in the sitemap

### 8.14 Machine endpoints
- [ ] `/robots.txt` = §5.2 output; 200 in < 200 ms
- [ ] `/sitemap.xml` index + 5 children validate (sitemaps.org XSD); only canonical 200 URLs; real `lastmod`; images in products and mag
- [ ] `/llms.txt` follows llmstxt.org (H1, blockquote, H2 lists, `## Optional`); `/llms-full.txt` ≤ 1 MB; both `noindex`
- [ ] `/{mag|glossary|product}/{slug}.md` → `text/markdown`, `noindex`, front matter with the canonical URL
- [ ] `/mag/rss.xml` validates (W3C feed validator); full content + attribution
- [ ] `/{key}.txt` IndexNow key reachable; `/torob_api/v3/products` passes Torob's test calls (401 without a token, 400 on an empty body, 100 per page)

### 8.15 Launch checklist (one-off)
- [ ] GSC Domain property (DNS TXT), sitemap submitted, ≥ 2 owners
- [ ] Bing Webmaster (import from GSC), sitemap, IndexNow enabled; Yandex optional
- [ ] Torob seller registration (`torob.com/sell`), meta tags verified with Torob support, API v3 activation requested (phase 1.5)
- [ ] Emalls panel ticket (store name + domain)
- [ ] eNamad issued for `choobz.kids`, badge live in the footer and on `/trust`, NAP identical
- [ ] SnappPay eligibility limits and messaging approved, logo usage confirmed
- [ ] Hosting: no foreign-IP block, WAF exempts verified bots, external uptime monitor (§5.3)
- [ ] `choobz.ir` (+ `www`) 301 → `https://choobz.kids`
- [ ] Rich Results Test + Schema validator pass for one URL per template; `npm run seo:audit` is green
- [ ] Instagram bio link, highlights («اعتماد شما»، «اسنپ پی») and the Bale channel all point to canonical URLs (UTM-tagged)

---

## 9. Data-model deltas (phase 2 readiness)

These are changes to `src/db/schema.ts` that the spec above relies on. Phase 1 seeds fill them. Phase 2 CMS edits them.

| Table | Add / change | Used by |
|---|---|---|
| `posts` | `contentUpdatedAt` (timestamp: editorial "updated", distinct from row `updatedAt`) · `reviewedAt` (timestamp → `lastReviewed`) · `primaryQuery` (text) · `secondaryQueries` (json string[]) · `aboutEntities` (json: Wikidata QIDs or glossary slugs) · `faq` stays in `faqs` (`scope='post'`) | §3.5.5, §1.10, §7.1 |
| `products` | `primaryQuery` · `alternateNames` (json) · `gtin`/`mpn` (nullable) · `guaranteeText` (Torob `guarantee`) · `torobEnabled` (bool, default true) · `ogMediaId` · `discontinuedAt`, `successorProductId` | §3.5.3, §6.1, §7.4 |
| `product_variants` | stable `id` already exists (→ Torob `page_unique` suffix); `urlParam` (e.g. `color=white`) | §3.5.4 |
| `categories` | `primaryQuery`; nothing else (the `seo` fields exist) | §1.10 |
| `topics` | `pillarPostId` | §1.3, §3.5.6 |
| `glossary_terms` | `alternateNames` (json: spelling variants) · `pillarPostSlug` | §3.5.7, §4.6 |
| `authors` | `jobTitle` (split from `role`) · `knowsAbout` (json QIDs) · `credentials` → json `{name, issuer, url, year}[]` · `isPlaceholder` (bool, default **true** until verified) | §3.5.12 |
| `media` | `credit`, `consent` (bool + note), `ogPath` (1200×630 JPEG), `ratioVariants` (json: 16x9/4x3/1x1 paths) | §2.5, §7.2 |
| `redirects` | allow `statusCode` 410; `fromPath` stored normalised (lowercase or `searchKey` for Persian vanity paths); `note` | §7.4 |
| `settings` keys | `org` (legalName, address, phone, email, foundingDate, nationalId) · `socials` (instagram, bale, aparat, torob, emalls) · `enamad` {id, code} · `snapppay` {enabled, minToman, maxToman, count} · `shippingPolicy` {freeOverToman, rateToman, handlingDays[min,max], transitDays[min,max], cutoff} · `returnPolicy` {days, fees, excludedTypes} · `indexnow` {lastRunAt} | §3.4, §6, §7.7 |
| new `search_index` (FTS5) | see §6.5 | §7.5 |
| new `search_queries` | `keyNormalised`, `count`, `zeroResults`, `lastSeen` (no PII) | §6.5 |
| new `rum_metrics` | `metric`, `value`, `rating`, `route`, `device`, `effectiveType`, `day` | §7.3 |
| new `entities` (optional) | `qid`, `labelFa`, `labelEn`, `enwiki`, `fawiki`, `type`. The single source for §3.2 | §3.2, §4.5 |

---

## 10. Open items to verify before launch

1. **Torob:** the exact meta tag list and the out-of-stock `product_price` convention (0 vs real price); Product API v3 activation; the webhook token; the crawler user agent (check the logs).
2. **Emalls:** the integration format.
3. **eNamad:** domain verification for `.kids`; badge size; the exact code from the panel.
4. **SnappPay:** eligible amount range, installment schedule and wording (سود/کارمزد/پیش‌پرداخت), logo usage, and the required pre-checkout disclosure.
5. **Returns law:** the 7-working-day withdrawal right and the custom-goods exclusion, with counsel.
6. **Shipping:** real carriers, costs, free-shipping threshold and delivery days (to populate `ShippingService`).
7. **Workshop:** whether it's open to visitors (`ToyStore` + maps).
8. **Currency redenomination:** CBI timeline and any ISO 4217 change.
9. **Real people:** authors and reviewers with verifiable credentials and written consent (CONTENT-PLAN.md §4).
10. **Categories:** the final taxonomy and slugs (§1.4).
11. **Proxy and SQLite:** that better-sqlite3 loads inside `proxy.ts`, or else the JSON-snapshot fallback (§7.4).

---

## 11. Sources (accessed 2026-10-16)

**Google Search Central**
* AI features and your website — https://developers.google.com/search/docs/appearance/ai-features (updated 2025-12-10)
* Optimizing for generative AI features (myths: llms.txt, chunking, structured data) — https://developers.google.com/search/docs/fundamentals/ai-optimization-guide (updated 2026-07-10)
* Search documentation updates (FAQ rich results deprecated 2026-05-07, docs removed 2026-06-15; breadcrumbs desktop-only 2025-01; org-level shipping policy 2025-11; preferred image metadata 2026-03; Googlebot file-size limits 2026-02) — https://developers.google.com/search/updates
* Merchant listing structured data (Offer, price, `StrikethroughPrice`, `PeopleAudience` age groups, `OfferShippingDetails`, policy `@id` references) — https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
* Product variants (`ProductGroup`, `variesBy`, single-page vs multi-page) — https://developers.google.com/search/docs/appearance/structured-data/product-variants (updated 2026-09-08)
* Organization (`OnlineStore`, `hasMerchantReturnPolicy`, `hasShippingService`) — https://developers.google.com/search/docs/appearance/structured-data/organization (updated 2026-09-08)
* Shipping policy (`ShippingService`, `ShippingConditions`) — https://developers.google.com/search/docs/appearance/structured-data/shipping-policy
* Return policy (`MerchantReturnPolicy`) — https://developers.google.com/search/docs/appearance/structured-data/return-policy
* URL structure (non-ASCII percent-encoding, hyphens, case) — https://developers.google.com/search/docs/crawling-indexing/url-structure
* Robots meta tag (`max-snippet` applies to AI Overviews/AI Mode; body placement) — https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
* Google common crawlers (Google-Extended = Gemini training and grounding, not Search) — https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
* Image SEO best practices (preferred image: `primaryImageOfPage`, `mainEntity` image, `og:image`) — https://developers.google.com/search/docs/appearance/google-images
* Preferred sources — https://developers.google.com/search/docs/appearance/preferred-sources

**AI crawler operators**
* OpenAI crawlers (OAI-SearchBot, GPTBot, ChatGPT-User, OAI-AdsBot; IP JSON; ~24 h robots latency) — https://developers.openai.com/api/docs/bots
* Anthropic (ClaudeBot, Claude-User, Claude-SearchBot; robots.txt and Crawl-delay; no published IPs) — https://support.claude.com/en/articles/8896518
* Perplexity (PerplexityBot, Perplexity-User) — https://docs.perplexity.ai/guides/bots
* Apple (Applebot, Applebot-Extended) — https://support.apple.com/en-us/119829
* Vercel/MERJ, "The rise of the AI crawler" (AI crawlers don't execute JS) — https://vercel.com/blog/the-rise-of-the-ai-crawler
* Cloudflare, Markdown for Agents (Feb 2026) — https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/

**Standards and specs**
* llms.txt — https://llmstxt.org/
* IndexNow protocol and participating engines — https://www.indexnow.org/documentation · https://www.indexnow.org/searchengines.json
* schema.org: `hasShippingService` (domain Organization, OfferShippingDetails), `reviewedBy` (domain WebPage), `hasCertification`, `suggestedAge` — https://schema.org/
* Wikidata entity IDs (§3.2) — https://www.wikidata.org/ (queried via `wbsearchentities` / `wbgetentities`)
* Next.js 16.4.2 local docs: `node_modules/next/dist/docs/01-app/…` (JSON-LD guide, sitemap, generateSitemaps, robots, generate-metadata streaming, htmlLimitedBots, proxy, trailingSlash)

**Iran**
* Torob Product API v3, token guide (EdDSA JWT), product webhook — https://github.com/torob/Torob-Sync (`product_api_v3.md`, `torob_api_token_guide.md`, `product_webhook.md`)
* Torob seller registration — https://torob.com/sell/
* Torob product-page meta tags (community-confirmed implementations) — e.g. https://github.com/rashidhamedas-prog/Site-B2B (`torob-pdp-meta.ts`), https://github.com/mobinaghashahi/shop_Automobile_Parts
* Emalls store registration — https://emalls.ir/ShopRequest/ · https://www.portal.ir/help/sales-channels/emalls
* eNamad trust-seal embed (`trustseal.enamad.ir`, `referrerpolicy="origin"`) — embed pattern verified across public repos. Placement guides: https://www.rtl-theme.com/blog/enamad-code-in-wordpress/
* SnappPay merchant centre — https://academy.snapppay.ir/
* StatCounter, search engine market share Iran (2026) — https://gs.statcounter.com/search-engine-market-share/all/iran
* Currency redenomination law (four zeros, «قِران») — https://fa.wikipedia.org/wiki/قانون_اصلاح_نظام_پولی_و_بانکی_ایران · https://www.tehrantimes.com/news/518711/
