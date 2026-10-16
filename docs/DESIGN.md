# DESIGN.md — «سفر تاتی، از ورق تا خانه» (Tati's Journey: from the sheet to your home)

Status: **final design direction for Phase 1** (public front end). Locked on ۲۴ مهر ۱۴۰۵ (2026-10-16).
This is the single source of truth for visual design, UX, components and motion. Engineers build from it in parallel.

**Precedence (when documents disagree):**

| Topic | Owner document | This doc |
|---|---|---|
| URLs, metadata, JSON-LD, robots, crawl/facet policy, Torob, eNamad, SnappPay wording | `docs/SEO.md` | follows it; amendments listed in §0.3 |
| Rendering model, caching, Docker, versions, images pipeline | `docs/TECH.md` | follows it |
| Font files, loading, Persian typography rules | `docs/FONTS.md` | follows it; one deviation (§2.4) |
| Clusters, articles, glossary, personas, article blocks | `docs/CONTENT-PLAN.md`, `docs/CONTENT-FORMAT.md` | follows them |
| Everything visual, UX, component anatomy, motion, voice | **this document** | — |

Legend: ⚑ = a claim or number that the workshop / SnappPay / an expert must confirm before launch. It ships as a CMS-editable field and is never hard-coded as fact.

---

## 0. Executive decisions

### 0.1 The synthesis in one paragraph

**Storybook is the spine, Workshop is the truth, Toybox is the conversion engine, Gallery is the light and the discipline.** The site is the journey of one wooden duck, **Tati** (تاتی, from the «تاتی تاتی» Iranian parents sing at a baby's first steps), from a sheet of birch plywood in the Choobz workshop to the visitor's home. The emotional layer (Tati, Orosi light, the mother's mint bubbles, mustard highlighter, pencil sprouts, the folk-tale opening and ending) sells the dream. The truth layer (dimensionally true drawings generated from the products' cut files, the «شناسنامه», prices, installments, specs) sells the product. The two layers never mix.

### 0.2 What we took from each concept, and what we cut

| From | Kept | Cut |
|---|---|---|
| Storybook (winner) | Tati and the name; Tati riding the header thread as global scroll progress; «یکی بود، یکی نبود…» opening and «…ولی اردکه به خونه‌تون رسید!» ending; chapters بازی / کشف / رشد; height-mark door «خط قد»; Mikhak kashida pull (4 places); ply type; two-layer headings; RTL page turn; four wheels = four installments; Lullaby dark mode; Yalda skin; fridge-door UGC | pop-up 5-layer landscape; day-cycle section tints and torn-paper seams; riso misregistration; 9 Tati poses (→ 4); section Tatis; wagon cards; name-on-Tati's-cart; 22:00 toast; menu-as-only-navigation |
| Workshop | Parts-manifest drawing engine (one manifest → five truthful views); exploded view; laser name engraving (paid add-on ⚑); «شناسنامهٔ این محصول»; «امروز در کارگاه» strip with 72-hour freshness; two-hands rule; one-signature-per-viewport rule; slug-seeded grain; ply-edge board surface | Vazirmatn, Vazir Code; mono part labels «قطعهٔ ۰X از ۱۲»; tree-ring finder; pinned horizontal workbench; finger-joint seams; pegboard / shadow-board footer; lamp-sheen cursor; SMIL laser in the hero; Persian slugs |
| Toybox | Room builder «اتاقش رو بچین» with live total, installment line, «همه را به سبد اضافه کن», `/rooms/{preset}` (incl. «اتاق کوچک ۹ متری»); raised = tappable / recessed = container law; «delight in the form, clarity in the words»; cabinet-height input; MadeToOrder honesty; myth/fact block; printable checklist; glossary noindex gate; RSC double-payload rule; Aparat facade | rainbow-stacker drag hero; shape sorter; abacus; bead-maze nav; WebAudio sound; haptics; puzzle 404; Ardi name; plant-dye rainbow palette; clothesline |
| Gallery | Orosi coloured-glass light (one pre-baked AVIF); restraint budget (75% neutral, one accent per viewport); museum-placard captions on UGC + the permanent empty frame «این قاب، منتظرِ شماست»; contextual dock (tab bar ↔ buy bar); «پرسش قبل از خرید در بله»; «کفِ لازم» footprint line; no site-wide Review markup; plaster-sweep photo brief | Markazi; museum vocabulary («اشیا»، «گالری»، «تالار»، «گاری» as a UI label); no-mascot rule; device-clock daypart theatre; H1 fade-in; separate Q&A pages |

### 0.3 Amendments and resolutions (other docs stay authoritative otherwise)

1. **Product URLs** are `/product/{slug}`; categories are `/shop/{category}` (SEO.md §0). TECH.md §2.6's `/shop/[slug]` example is superseded.
2. **Category slugs** are the seed slugs (`climbing`, `learning-towers`, `furniture`, `art`, `toys`, `room-sets`) until SEO.md §1.4's `[VERIFY]` taxonomy is final.
3. **Age:** the home door has **5 stages**, which map into SEO.md's **3 hubs** with anchors: `0-6m → /age/0-12-months#0-6-months`, `6-12m → /age/0-12-months#6-12-months`, `1-2y → /age/1-3-years#1-2-years`, `2-3y → /age/1-3-years#2-3-years`, `3-6y → /age/3-6-years`.
4. **Content hub name** is «مجله چوبز» at `/mag`, nav label «مجله» (SEO.md §1.3). Never «کتابخانه» (it collides with the bookshelf product) and never «بازی‌نامه» / «دفترچهٔ رشد» as a name. The *visual metaphor* is a notebook.
5. **New routes (amend SEO.md §1.2):** `/rooms` (CollectionPage) and `/rooms/{preset}` (CollectionPage + ItemList, indexable, own `primaryQuery`). Add `rooms` to the reserved-slug list and to the `pages` child sitemap.
6. **Cart is `localStorage`** in Phase 1 (TECH.md §2.5 rule 3). No server cart, no `cz_n` cookie, no `cookies()` anywhere public.
7. **Filters** are client-side `<button>`s over the full server-rendered list with `history.replaceState` (SEO.md §1.9). Category "filters" are real links to `/shop/{category}`.
8. **Home FAQ** is visible but emits **no** `FAQPage` (SEO.md §3.3; the canonical FAQPage lives on `/faq`).
9. **Seed page slug** `safety-materials` must become `safety` to match SEO.md's `/safety` (or a `redirects` row).
10. **JS budget:** SEO.md's "first-load JS ≤ 110 KB" is below the measured App Router floor (≈144 KB gz, TECH.md §9.2). CI tracks **our own** JS separately (§10).
11. **`CONTENT-FORMAT.md` additions:** `::product{slug="…" why="…"}` (optional «چرا اینجا؟» sentence) and a caption convention for tables (a paragraph starting «جدول:» directly above a GFM table becomes its `<caption>`).
12. **Schema deltas** for this design are in Appendix A (one migration, `0001_design.sql`), on top of SEO.md §9.
13. **Font tokens:** next/font variables stay `--ff-body`, `--ff-display`, `--ff-hand` (`src/app/fonts.ts`, FONTS.md §5.4). The Tailwind tokens are `--font-body`, `--font-display`, `--font-accent` (FONTS.md §5.5's `--font-hand` is renamed `--font-accent`), plus `--font-sans` = body. The §2.1 block compiles cleanly with Tailwind 4.3.3 (checked with `@tailwindcss/node`).

---

## 1. The direction

### 1.1 Name, big idea, promise

- **Name:** «سفر تاتی، از ورق تا خانه» (Tati's Journey: from the sheet to your home).
- **Big idea:** the website is a plywood picture book in three chapters taken from the brand bio (**بازی · کشف · رشد**). Its hero is the duck pull-toy from the logo. Tati waits at the foot of a learning tower that has just stood up out of its birch sheet, hops onto the header's red thread, and rides it as the visitor's progress through every page, until he reaches a lit little house at the end: «قصهٔ ما به سر رسید… ولی اردکه به خونه‌تون رسید!».
- **Emotional promise (the brand's own voice):**
  > «لازم نیست مامانِ کاملی باشی. فقط کافیه دنیای بچه‌ت رو آماده کنی؛ ما کنارتیم تا اون دنیا رو با هم، از چوب بسازیم.»
- **Tone:** calm, crafted, warm, honest. We sell readiness and joy, never anxiety. Adult-grade craft (natural birch, restraint, real dimensions) carries a child's story; never cartoon primaries.

### 1.2 Governing laws (every PR is reviewed against these)

1. **Two hands.** *Story layer* (Tati, Orosi light, lettering, peg-doll vignettes, mint bubbles, mustard swash, pencil marks) never carries a product fact. *Truth layer* (manifest drawings, dimensions, prices, installments, specs, شناسنامه, policies) never carries decoration other than at most one pencil sprout pointing at a feature, and never on a number.
2. **Raised = tappable, recessed = container, flat = reading.** Anything on a laminated ply edge (`shadow-ply`) can be pressed. Trays (`inset-shadow-tray`) hold inputs and groups. Text sits flat on paper. No exceptions.
3. **Restraint budget, per viewport:** ≤ 1 signature motion · ≤ 1 Tati (the thread rider counts) · ≤ 1 mustard swash · ≤ 2 mother's marks · ≤ 1 ply-type headline · about 75% neutral (shir / kahgel / takhte) · anar ≤ 10% of area (CTA, thread, sale).
4. **Delight in the form, clarity in the words.** Buttons, links, nav and labels use plain search words: «فروشگاه»، «سبد خرید»، «افزودن به سبد»، «مجله»، «سن به سن». Poetry lives in kickers and lettering only.
5. **Two-layer headings.** A decorative kicker (Mikhak, `aria-hidden` when purely decorative) for the eye, and a plain keyword H1/H2 for search and answer engines.
6. **Static-first.** Every scene's default CSS is its final, complete frame. Motion is layered on inside `@supports` + motion-allowed gates. Nothing is hidden waiting for JS.
7. **Honesty.** No fabricated reviews, stats, certificates or experts. Seed samples render only outside production and carry «نمونه». ⚑ claims are fields, not copy.

### 1.3 Signature moments (three + one global + the ending)

#### (G) Tati on the thread — «تاتی راه افتاد» (every page)

- **Behaviour.** The header's bottom border is Tati's red string (anar). A 40 px (mobile) / 48 px (desktop) Tati sits on it at the inline-start edge (right). As the page scrolls, he rolls toward inline-end (left) with his wheels turning at scroll speed, and the part of the string behind him is pulled taut (full opacity) while the part ahead stays slack (55% opacity). He is the reading-progress indicator on articles and the "you are here" on long pages. Scrolling back rolls him back. In the last 2% of a page (or as the home «TheEnd» enters) he fades out: he has arrived home.
- **Technique.** One fixed HTML element (`TatiThread`), zero JS. The rider container animates `translate` on `animation-timeline: scroll(root block)`; each wheel is a separate tiny `<svg>` inside an HTML `<span>` that animates `rotate` (HTML wrappers only, so it composites). The taut string is a second line animating `scale: 0 1 → 1 1` with `transform-origin: right`. Never animate transforms on SVG child elements. Code in §9.4.
- **Home only:** the rider is hidden until the cover scrolls out, then "hops" in (scene Tati lifts and fades as the rider drops onto the thread with the settle spring) using a named view timeline on the cover (`timeline-scope: --cover`).

#### (1) Cover — «یکی بود، یکی نبود…» (the tower stands up out of its sheet)

- **Behaviour.** A birch plywood sheet (rounded CNC corners, ply strata on its cut edges) leans against a kahgel wall. Engraved on it: the lettering «یکی بود، یکی نبود…», ghost holes where the learning tower's parts were cut, and the dashed toolpaths of other products nested on the same sheet (Pikler arch, Pikler triangle, duck pull-toy, front-facing bookshelf). In front of the sheet stands the **learning tower**, drawn from its manifest. On load its 6–8 parts drop into place one by one and seat with a small spring, like dowels. Orosi coloured-glass light (saffron, sage, lapis, soft pomegranate under an arched lattice) falls diagonally from the upper right across sheet and tower. Tati waits at the tower's foot, his string running off the inline-start edge as if a child's hand is just out of frame. Every nested outline is a real link («این برش، آرک پیکلره!»). Tapping Tati opens a mint bubble greeting and his Mikhak name tag does the kashida pull.
- **Technique.** Server component, zero JS. Sheet is one inline SVG (≤ 6 KB raw). Tower parts are separate small `<svg>`s in HTML wrappers animating `translate`/`opacity` (settle spring, 90 ms stagger, total ≤ 1.3 s, starts 250 ms after first paint). Orosi light is one `<img>` (AVIF, ≤ 14 KB mobile / ≤ 22 KB desktop, `fetchpriority="high"`, `alt=""`). Tati greeting = `<button popovertarget>` + `popover` (no JS). The H1 is static text, never animated. Reduced motion / lite tier: final standing frame.

#### (2) The height-mark door — «خط قد» → «اتاقش رو بچین»

- **Behaviour.** A wooden doorframe on a kahgel wall carries pencil height marks in Mikhak at WHO median heights ⚑ («۶ ماهگی · ۶۷ سانت», «۱ سالگی · ۷۵ سانت», «۲ سالگی · ۸۷ سانت», «۳ سالگی · ۹۶ سانت», «۶ سالگی · ۱۱۶ سانت»). The mother taps one of five hexagonal age chips in the thumb zone. A peg-doll child grows to that mark, the chosen pencil mark does the kashida pull, and **the Montessori room rebuilds itself** around the child (a Pikler triangle slides in at 6–12 months, the learning tower appears beside the kitchen counter seen through the doorway at 1–2 years, the climbing wall goes up at 3–6). Below the scene, the room becomes **editable**: each piece has a toggle, a sticky in-section summary reads «۵ تکه · جمع: ۳۵٬۰۰۰٬۰۰۰ تومان», **four cart wheels** show the four SnappPay installments, and «همه را به سبد اضافه کن» adds the room. Links: «این چیدمان را ببین ←» (`/rooms/{preset}`), «اتاق کوچکه؟ چیدمان ۹ متری ←», «همهٔ وسایل و راهنماهای ۱ تا ۲ سالگی ←» (age hub anchor). `?age=1-2y` makes the room shareable.
- **Technique.** Radios + `:has()` (zero JS for the switch; all five rooms server-rendered). `AgeRoomVT` (0.5 KB, loads near viewport) wraps the change in `document.startViewTransition`, adding `view-transition-name`s to room pieces only for the duration of the morph. `RoomTotals` (1.2 KB) enables the piece toggles and recomputes total + wheels. A 120-byte inline script checks the radio from `?age=` before first paint. The server never reads `searchParams`.

#### (3) «اسمش رو روی چوب حک کن» (laser engraving, right to left)

- **Behaviour.** In Chapter 3, after the workshop's five steps end with the duck stamp, the stage becomes the learning tower's top step with an empty name plate: «حالا نوبت شماست». The mother types her child's name. An ember-bright laser dot travels **right to left**, the Persian writing direction, and burns the name into the plate in Mikhak; short names stretch along Mikhak's kashida axis so every name fills the plate like a craftsman's lettering. The strokes cool from ember to char and a thin wisp of smoke rises. Two buttons follow: «ذخیره برای استوری» (a 1080×1920 card «تاتیِ آیلین، آمادهٔ اولین قدم‌ها» with @choobz.kids, shared through the native share sheet) and «سفارش با حک اسم» (the paid add-on ⚑). The page says: «این اسم فقط روی گوشی خودت می‌مونه.»
- **Technique.** Server shell + `EngraverIsland` (≈ 4 KB, imported on first focus/pointerenter of the input). Live preview is an SVG `<text>` with `font-variation-settings: "KSHD" n` chosen to fill the plate after `document.fonts.load('600 64px Mikhak')`. The burn is a clip sweep on an HTML wrapper plus an HTML ember dot translating along x (one-off, user-triggered). The story card (`StoryCard`, ≈ 3 KB + template, on tap) uses Canvas 2D with `direction = 'rtl'`; canvas cannot set variation axes, so the card uses Mikhak at its default width (documented limitation). With no JS the input is a GET form to `/product/learning-tower?engrave=…`.

#### The ending — «قصهٔ ما به سر رسید…»

Night falls at the bottom of the home page. Tati reaches a little house (a learning tower with a lit window), the thread ties in a bow at its door, paper stars come out, and the H2 «…ولی اردکه به خونه‌تون رسید!» lands with «رسید» doing the kashida pull. The page flows into the night footer. Primary CTA: «عضویت در کانال بله». Keep this line verbatim everywhere it is quoted.

### 1.4 Season: Yalda first

`settings.season = "yalda"` (≈ 9 weeks away) swaps ~3 KB of SVG props: Tati wears a knitted scarf, a pomegranate rests by the tower, a chip «کادوی شب یلدا ←» sits above the trust chips (→ `/mag/yalda-gift-guide`), and chosen products get the stamp «پیشنهاد یلدا». Nowruz (`"nowruz"`: sabzeh on the cart, goldfish-bowl prop) is Phase 1.5. No other skins in Phase 1.

---

## 2. Design tokens

### 2.1 `src/app/globals.css` (ready to paste; replaces the scaffold)

```css
/* ==================================================================
   choobz.kids — tokens & base. Tailwind CSS v4.3 (CSS-first config).
   Components use SEMANTIC utilities only (bg-bg, text-ink, bg-accent…).
   Raw palette utilities (bg-anar…) are allowed only in
   src/components/illustrations/** and ui/ primitives (CI grep check).
   ================================================================== */
@import "tailwindcss";

/* ---------- Variants ---------- */
/* «لالایی» dark: follows the OS unless the viewer chose; toggle writes html[data-theme] */
@custom-variant dark {
  @media (prefers-color-scheme: dark) {
    &:where(:root:not([data-theme="light"]), :root:not([data-theme="light"]) *) { @slot; }
  }
  &:where([data-theme="dark"], [data-theme="dark"] *) { @slot; }
}
/* Motion allowed: OS allows it, viewer did not pick «حرکت آرام», device is not in the lite tier */
@custom-variant motion-ok {
  @media (prefers-reduced-motion: no-preference) {
    &:where(:root:not([data-motion="reduce"]):not([data-lite]), :root:not([data-motion="reduce"]):not([data-lite]) *) { @slot; }
  }
}
@custom-variant lite (&:where([data-lite], [data-lite] *));

/* ---------- Raw palette & scales ----------
   `static` = always emit every variable to :root, because inline SVG, inline
   styles and the manifest renderer reference them where Tailwind cannot see. */
@theme static {
  --color-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
  --ease-*: initial;
  --animate-*: initial;
  --breakpoint-*: initial;
  --container-*: initial;

  /* Core palette — Persian-named (light, «روز») */
  --color-shir: #FBF6EC;           /* milk — page paper */
  --color-shir-raised: #FFFBF3;    /* fresh paper — cards, sheets, drawer faces */
  --color-kahgel: #F1E6D3;         /* straw plaster — walls, stages, alternate sections */
  --color-kahgel-sunken: #F4EBDC;  /* inputs, trays */
  --color-takhte: #E8D3AE;         /* birch face — wood surfaces */
  --color-takhte-light: #F0E0C2;   /* top faces, light ply stratum */
  --color-takhte-shade: #D9BE92;   /* side faces in drawings */
  --color-asal: #C8955A;           /* honey ply edge — DECORATIVE ONLY (2.47:1) */
  --color-ply-dark: #9C6B3A;       /* dark ply stratum, grain */
  --color-kraft: #E6CFA4;          /* kraft tags, شناسنامه paper */
  --color-gerdu: #33251B;          /* walnut — ink */
  --color-gerdu-narm: #6B5545;     /* soft walnut — secondary ink */
  --color-khat: #8A7666;           /* pencil line — input borders (4.01:1 on shir) */
  --color-anar: #B23A26;           /* pomegranate — CTA, Tati's thread, sale */
  --color-anar-deep: #8F2C1C;      /* pressed CTA */
  --color-zardchube: #F2B93B;      /* turmeric — highlighter, sun. NEVER text */
  --color-nana: #D7EBDA;           /* mint — speech bubbles, TL;DR */
  --color-pesteh: #3E6A4C;         /* pistachio-sage — in stock, installments, success */
  --color-firuzeh: #1F6E77;        /* turquoise — focus ring, info, blueprint lines */
  --color-lapis: #8EA6CF;          /* Orosi glass — DECORATIVE ONLY */
  --color-shab: #1B2040;           /* night — footer sky */
  --color-shab-raised: #262C55;
  --color-mahtab: #F5E8C6;         /* moonlight — text on night */
  --color-mahtab-narm: #B9A88A;
  --color-ember: #E5715A;          /* night CTA */

  /* Accent pairs — DB `categories.accent` / `topics.accent` keys. tint = background, ink = text/icon */
  --color-terracotta-tint: #F3D5C8; --color-terracotta-ink: #9A4428;
  --color-wood-tint: #EAD6B2;       --color-wood-ink: #7A5230;
  --color-sage-tint: #DCE7D6;       --color-sage-ink: #3E6A4C;
  --color-mustard-tint: #F7E2A6;    --color-mustard-ink: #735508;
  --color-sky-tint: #D6E7EE;        --color-sky-ink: #245F74;
  --color-plum-tint: #ECDCE6;       --color-plum-ink: #6E3A5E;
  --color-mint-tint: #D7EBDA;       --color-mint-ink: #2F6B53;
  --color-cream-tint: #F4EADB;      --color-cream-ink: #6B5545;

  /* Age bands (fixed colours; CONTENT-PLAN §5 #2). Text on them is always ink */
  --color-age-0-6m: #D7EBDA;
  --color-age-6-12m: #D6E7EE;
  --color-age-1-2y: #F7E2A6;
  --color-age-2-3y: #F3D5C8;
  --color-age-3-6y: #E1E6C2;

  /* Fluid type scale, 360 → 1440 px. Each step has a rem term (WCAG 1.4.4). */
  --text-2xs: clamp(0.75rem, 0.7396rem + 0.0463vw, 0.7813rem);   --text-2xs--line-height: 1.6;   /* 12 → 12.5  legal, micro (Persian floor 12px) */
  --text-xs: clamp(0.8438rem, 0.8333rem + 0.0463vw, 0.875rem);   --text-xs--line-height: 1.65;   /* 13.5 → 14  captions, meta, badges */
  --text-sm: clamp(0.9375rem, 0.9271rem + 0.0463vw, 0.9688rem);  --text-sm--line-height: 1.65;   /* 15 → 15.5  UI, card meta, buttons-sm */
  --text-base: clamp(1.0625rem, 1.0417rem + 0.0926vw, 1.125rem); --text-base--line-height: 1.85; /* 17 → 18    body */
  --text-lead: clamp(1.1875rem, 1.1458rem + 0.1852vw, 1.3125rem); --text-lead--line-height: 1.8; /* 19 → 21    lead, sub, article body */
  --text-lg: clamp(1.3125rem, 1.2292rem + 0.3704vw, 1.5625rem);  --text-lg--line-height: 1.5;    /* 21 → 25    H3, card titles (large) */
  --text-xl: clamp(1.5625rem, 1.3958rem + 0.7407vw, 2.0625rem);  --text-xl--line-height: 1.4;    /* 25 → 33    H2 (content pages) */
  --text-2xl: clamp(1.875rem, 1.5417rem + 1.4815vw, 2.875rem);   --text-2xl--line-height: 1.32;  /* 30 → 46    H2 (home, hubs) */
  --text-3xl: clamp(2.125rem, 1.5833rem + 2.4074vw, 3.75rem);    --text-3xl--line-height: 1.3;   /* 34 → 60    page H1 */
  --text-display: clamp(2.625rem, 1.5rem + 5vw, 6rem);           --text-display--line-height: 1.28; /* 42 → 96 hero display line */

  /* Spacing: 4 px base + named layout spacings */
  --spacing: 0.25rem;
  --spacing-gutter: clamp(1rem, 0.6667rem + 1.4815vw, 2rem);      /* 16 → 32 page side gutter */
  --spacing-section: clamp(4rem, 2.6667rem + 5.9259vw, 8rem);     /* 64 → 128 section padding-block */
  --spacing-tap: 2.75rem;          /* 44 px minimum target */
  --spacing-header: 3.5rem;        /* 56 mobile header */
  --spacing-header-lg: 4.5rem;     /* 72 desktop header */
  --spacing-dock: 4rem;            /* 64 mobile bottom dock (+ safe area) */

  /* CNC router-bit radii: nothing is sharp, because nothing in the workshop is */
  --radius-bit-xs: 0.375rem;       /* 6  chips, small inputs */
  --radius-bit-sm: 0.625rem;       /* 10 buttons, inputs */
  --radius-bit: 1rem;              /* 16 cards */
  --radius-bit-lg: 1.5rem;         /* 24 sheets, drawers, trays */
  --radius-bit-xl: 2.5rem;         /* 40 scenes, cover sheet */
  --radius-bead: 999px;            /* pills, beads */
  --radius-arch: 50% 50% 1rem 1rem / 40% 40% 1rem 1rem;  /* «طاق» frame for 4:5 stages */

  /* Easing. Springs are pre-computed CSS linear() — no spring runtime */
  --ease-wood: cubic-bezier(.2, .8, .2, 1);           /* default enter/exit */
  --ease-page: cubic-bezier(.65, 0, .35, 1);          /* page turn, scroll-scrubbed moves */
  --ease-exit: cubic-bezier(.4, 0, 1, 1);             /* short exits */
  /* settle: k260 c22 m1 · ~5% overshoot · use 620ms. Drops, room morph, cover parts */
  --ease-settle: linear(0, 0.149, 0.428, 0.694, 0.883, 0.995, 1.043, 1.052, 1.043, 1.028, 1.015, 1.005, 1, 0.998, 0.997, 0.998, 1);
  /* press: k700 c45 · no overshoot · use 330ms (release) */
  --ease-press: linear(0, 0.025 2.8%, 0.095 5.8%, 0.518 18.2%, 0.694 24.5%, 0.821 30.8%, 0.913 37.8%, 0.970 45.8%, 1 56%, 1);
  /* hop: k420 c16 · ~25% overshoot · use 800ms. TOYS ONLY: cart hop, badge bump */
  --ease-hop: linear(0, 0.387, 0.967, 1.249, 1.21, 1.053, 0.948, 0.935, 0.973, 1.008, 1.018, 1.011, 1, 0.995, 0.996, 0.999, 1);
  /* wobble: k300 c10 · ROTATION ONLY (±6°): cart icon wobble, Tati quack */
  --ease-wobble: linear(0, 0.646, 1.334, 1.266, 0.936, 0.86, 0.984, 1.058, 1.026, 0.982, 0.983, 1.002, 1.008, 1.002, 0.997, 0.998, 1);

  --animate-blink: tati-blink 7s steps(1, end) infinite;
  @keyframes tati-blink { 0%, 95%, 100% { scale: 1 1; } 96%, 98% { scale: 1 0.1; } }

  /* Breakpoints (mobile-first; < 40rem is the phone default) */
  --breakpoint-sm: 40rem;   /* 640  large phones landscape */
  --breakpoint-md: 48rem;   /* 768  tablet */
  --breakpoint-lg: 64rem;   /* 1024 desktop: dock → header nav, spreads */
  --breakpoint-xl: 80rem;   /* 1280 */
  --breakpoint-2xl: 90rem;  /* 1440 */

  /* Containers (max-w-* and @container sizes) */
  --container-prose: 38rem;   /* article measure ≈ 60–70 Persian chars */
  --container-narrow: 48rem;  /* policy pages, glossary term */
  --container-page: 80rem;    /* 1280 content max */
  --container-wide: 90rem;    /* 1440 spreads, hero */
}

/* ---------- Semantic layer (theme-switchable) ---------- */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-raised: var(--surface-raised);
  --color-sunken: var(--surface-sunken);
  --color-wood: var(--wood);
  --color-wood-top: var(--wood-top);
  --color-wood-side: var(--wood-side);
  --color-ink: var(--ink);
  --color-muted: var(--ink-muted);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-accent: var(--accent);
  --color-accent-press: var(--accent-press);
  --color-on-accent: var(--on-accent);
  --color-bubble: var(--bubble);
  --color-success: var(--success);
  --color-focus: var(--focus);
  --color-info: var(--info);
  --color-danger: var(--danger);
  --color-highlight: var(--highlight);
  --color-tag: var(--tag);
  --color-thread: var(--thread);

  /* Fonts: next/font exposes --ff-* (src/app/fonts.ts, FONTS.md §5.4); Tailwind tokens wrap them */
  --font-body: var(--ff-body), system-ui, "Segoe UI", Tahoma, sans-serif;
  --font-display: var(--ff-display), var(--ff-body), system-ui, "Segoe UI", Tahoma, sans-serif;
  --font-accent: var(--ff-hand), var(--ff-body), system-ui, "Segoe UI", Tahoma, sans-serif;
  --font-sans: var(--ff-body), system-ui, "Segoe UI", Tahoma, sans-serif;

  /* Soft, wood-like elevation. Ply strata = the laminated edge under a raised piece */
  --shadow-paper: 0 1px 0 rgb(var(--shadow-rgb) / .06), 0 10px 24px -14px rgb(var(--shadow-rgb) / .28);
  --shadow-ply: 0 1px 0 var(--ply-1), 0 2px 0 var(--ply-2), 0 3px 0 var(--ply-1), 0 4px 0 var(--ply-3), 0 10px 18px -10px rgb(var(--shadow-rgb) / .45);
  --shadow-ply-pressed: 0 1px 0 var(--ply-2), 0 2px 0 var(--ply-3), 0 4px 8px -6px rgb(var(--shadow-rgb) / .35);
  --shadow-ply-lifted: 0 1px 0 var(--ply-1), 0 2px 0 var(--ply-2), 0 3px 0 var(--ply-1), 0 4px 0 var(--ply-3), 0 18px 30px -12px rgb(var(--shadow-rgb) / .42);
  --shadow-sheet: 0 -8px 40px rgb(var(--shadow-rgb) / .14);
  --inset-shadow-tray: inset 0 2px 0 rgb(var(--shadow-rgb) / .05), inset 0 10px 22px -14px rgb(var(--shadow-rgb) / .30);
}

:root {
  color-scheme: light;
  --bg: var(--color-shir);
  --surface: var(--color-kahgel);
  --surface-raised: var(--color-shir-raised);
  --surface-sunken: var(--color-kahgel-sunken);
  --wood: var(--color-takhte);
  --wood-top: var(--color-takhte-light);
  --wood-side: var(--color-takhte-shade);
  --ply-1: var(--color-takhte-light);
  --ply-2: var(--color-asal);
  --ply-3: var(--color-ply-dark);
  --ink: var(--color-gerdu);
  --ink-muted: var(--color-gerdu-narm);
  --line: rgb(51 37 27 / .14);            /* hairlines — decorative, not a component boundary */
  --line-strong: var(--color-khat);       /* input/toggle boundaries (≥ 3:1) */
  --accent: var(--color-anar);
  --accent-press: var(--color-anar-deep);
  --on-accent: var(--color-shir-raised);
  --bubble: var(--color-nana);
  --success: var(--color-pesteh);
  --focus: var(--color-firuzeh);
  --info: var(--color-firuzeh);
  --danger: var(--color-anar);
  --highlight: rgb(242 185 59 / .55);     /* mustard swash (mother's hand) */
  --link-mark: rgb(242 185 59 / .38);     /* inline link band */
  --tag: var(--color-kraft);
  --thread: var(--color-anar);
  --shadow-rgb: 51 37 27;
  --paper-tile: url("/textures/paper.webp");

  /* Motion durations (used as duration-(--dur-quick) etc.) */
  --dur-press: 90ms;     /* block press, chip toggle */
  --dur-quick: 160ms;    /* hover, focus, colour */
  --dur-base: 240ms;     /* popovers, sheet content, tabs */
  --dur-gentle: 360ms;   /* card tricks, bubble pops, drawer */
  --dur-page: 420ms;     /* page turn (view transition) */
  --dur-scene: 620ms;    /* cover parts, room morph (= settle spring length) */
  --dur-toy: 800ms;      /* cart hop (= hop spring length) */
  --stagger: 90ms;

  /* z-index scale (dialogs and popovers use the top layer and ignore these) */
  --z-raised: 1;
  --z-sticky: 20;        /* filter rail, in-section summary bars */
  --z-header: 30;
  --z-thread: 31;        /* Tati rider sits on the header border */
  --z-dock: 40;          /* bottom dock / buy bar */
  --z-toast: 70;
  --z-skip: 90;

  /* RTL motion direction multiplier (forward = toward inline-end = left) */
  --dir: -1;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bg: #1C1612; --surface: #261E18; --surface-raised: #30261E; --surface-sunken: #17120E;
    --wood: #4A3A2A; --wood-top: #5A4733; --wood-side: #3A2D20;
    --ply-1: #5A4733; --ply-2: #7A5B40; --ply-3: #2A2018;
    --ink: #F5E8C6; --ink-muted: #C9B79C;
    --line: rgb(245 232 198 / .14); --line-strong: #8E7C68;
    --accent: #E5715A; --accent-press: #D2644E; --on-accent: #1C1612;
    --bubble: #22342A; --success: #8FC7A0; --focus: #7CC6CD; --info: #7CC6CD; --danger: #E5715A;
    --highlight: rgb(227 181 74 / .35); --link-mark: rgb(227 181 74 / .30);
    --tag: #3A2D20; --thread: #E5715A;
    --shadow-rgb: 0 0 0;
    --paper-tile: url("/textures/paper-night.webp");
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #1C1612; --surface: #261E18; --surface-raised: #30261E; --surface-sunken: #17120E;
  --wood: #4A3A2A; --wood-top: #5A4733; --wood-side: #3A2D20;
  --ply-1: #5A4733; --ply-2: #7A5B40; --ply-3: #2A2018;
  --ink: #F5E8C6; --ink-muted: #C9B79C;
  --line: rgb(245 232 198 / .14); --line-strong: #8E7C68;
  --accent: #E5715A; --accent-press: #D2644E; --on-accent: #1C1612;
  --bubble: #22342A; --success: #8FC7A0; --focus: #7CC6CD; --info: #7CC6CD; --danger: #E5715A;
  --highlight: rgb(227 181 74 / .35); --link-mark: rgb(227 181 74 / .30);
  --tag: #3A2D20; --thread: #E5715A;
  --shadow-rgb: 0 0 0;
  --paper-tile: url("/textures/paper-night.webp");
}

/* ---------- Base ---------- */
@layer base {
  html {
    font-family: var(--font-body);
    font-feature-settings: "ss01";            /* Estedad round dots = wooden beads */
    font-synthesis: none;                     /* Ario is one weight; never faux-bold */
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
    scroll-padding-block-start: calc(var(--spacing-header) + 1rem);
  }
  :where(:lang(fa), [dir="rtl"]) { letter-spacing: 0; }   /* never track Persian */
  body {
    background: var(--paper-tile) 0 0 / 160px repeat, var(--bg);
    color: var(--ink);
    font-size: var(--text-base);
    line-height: 1.85;
  }
  h1, h2, h3, h4 { text-wrap: balance; }
  p, li, dd, figcaption { text-wrap: pretty; }
  h1, .font-display { font-family: var(--font-display); font-weight: 400; font-feature-settings: normal; line-height: 1.3; }
  .swash { font-feature-settings: "ss02"; }                /* Ario swash ک/گ — hero + chapter lines only */
  .font-accent { line-height: 1.55; font-feature-settings: normal; }
  :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  ::selection { background: var(--highlight); color: var(--ink); }
  a { color: inherit; text-decoration: none; }
  [hidden] { display: none !important; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
  }
  :root[data-motion="reduce"] *, :root[data-motion="reduce"] *::before, :root[data-motion="reduce"] *::after {
    animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important;
  }
}

/* ---------- Signature utilities (each documented in §3–§4) ---------- */
@utility ply {               /* raised, tappable piece */
  background-color: var(--surface-raised);
  box-shadow: var(--shadow-ply);
  transition: translate var(--dur-press) var(--ease-press), box-shadow var(--dur-press) linear;
  &:active, &[aria-pressed="true"] { translate: 0 2px; box-shadow: var(--shadow-ply-pressed); }
}
@utility tray {              /* recessed container */
  background-color: var(--surface-sunken);
  box-shadow: var(--inset-shadow-tray);
  border-radius: var(--radius-bit-lg);
}
@utility ply-band {          /* a visible plywood edge: dividers, shelf lips, progress */
  background: repeating-linear-gradient(to bottom, var(--ply-1) 0 1.5px, var(--ply-2) 1.5px 2.5px, var(--ply-1) 2.5px 4px, var(--ply-3) 4px 5px);
}
@utility ply-type {          /* painted face, raw ply edge. ≥ 40px, once per viewport */
  font-family: var(--font-display);
  color: var(--accent);
  padding-block-end: .14em;
  text-shadow: 0 1px 0 var(--ply-1), 0 2px 0 var(--ply-2), 0 3px 0 var(--ply-1), 0 4px 0 var(--ply-3), 0 12px 20px rgb(var(--shadow-rgb) / .16);
}
@utility mark-swash {        /* mustard highlighter (mother's hand). Never on prices */
  background: linear-gradient(transparent 38%, var(--highlight) 38% 88%, transparent 88%) right / 100% 100% no-repeat;
  box-decoration-break: clone;
  border-radius: .3em .6em .4em .5em;
  padding-inline: .12em;
}
@utility link-mark {         /* inline prose links: shape, not colour, marks the link (1.4.1) */
  background: linear-gradient(transparent 62%, var(--link-mark) 62% 94%, transparent 94%) right / 100% 100% no-repeat;
  transition: background-size var(--dur-quick) var(--ease-wood);
  &:hover { background-image: linear-gradient(transparent 20%, var(--link-mark) 20% 94%, transparent 94%); }
}
@utility kashida {           /* Mikhak KSHD pull. DOM text stays clean (no ـ) */
  display: inline-block;
  contain: layout;
  font-family: var(--font-accent);
  font-variation-settings: "KSHD" var(--kshd, 120);
}
```

```css
/* Animated custom property for the kashida pull (put next to the utilities) */
@property --kshd { syntax: "<number>"; inherits: true; initial-value: 120; }
@keyframes kashida-pull { 0% { --kshd: 120; } 45% { --kshd: 200; } 100% { --kshd: 120; } }
```

### 2.2 Semantic alias table (what each token is for)

| Semantic utility | Light | Dark («لالایی») | Use |
|---|---|---|---|
| `bg-bg` | shir `#FBF6EC` | `#1C1612` | page |
| `bg-surface` | kahgel `#F1E6D3` | `#261E18` | alternate sections, stages, walls |
| `bg-raised` | `#FFFBF3` | `#30261E` | card faces, dialogs, drawer, toasts |
| `bg-sunken` | `#F4EBDC` | `#17120E` | inputs, trays, room piece list |
| `bg-wood` / `-top` / `-side` | takhte family | lamp-lit wood | bottom dock, wood buttons, shelf, drawings |
| `text-ink` | gerdu `#33251B` | mahtab `#F5E8C6` | all body text |
| `text-muted` | `#6B5545` | `#C9B79C` | meta, captions, secondary |
| `border-line` | gerdu 14% | mahtab 14% | hairlines (decorative only) |
| `border-line-strong` | khat `#8A7666` | `#8E7C68` | input, toggle, checkbox boundaries |
| `bg-accent` / `text-on-accent` | anar / `#FFFBF3` | ember / `#1C1612` | primary CTA |
| `bg-accent-press` | `#8F2C1C` | `#D2644E` | pressed primary |
| `bg-bubble` | nana | `#22342A` | mint bubbles, TL;DR, tips |
| `text-success` | pesteh | `#8FC7A0` | in stock, installment line |
| `outline-focus` | firuzeh | `#7CC6CD` | focus ring (3px, 2px offset) |
| `bg-highlight` | mustard 55% | mustard 35% | the one swash per viewport |
| `bg-tag` | kraft | `#3A2D20` | kraft tags, شناسنامه |
| `bg-thread` | anar | ember | Tati's string |

Fixed-scene tokens (footer night, illustrations) use the raw palette (`shab`, `mahtab`, `lapis`…) and do not switch.

### 2.3 Contrast verification (WCAG 2.x relative luminance, computed)

**Text pairs (≥ 4.5:1 required for body text; ✗ = forbidden pairing)**

| Text \ Background | shir | raised | kahgel | sunken | takhte | kraft | nana | highlight (55%) |
|---|---|---|---|---|---|---|---|---|
| gerdu (ink) | **13.72** | 14.32 | 11.96 | 12.50 | 10.10 | 9.73 | 11.81 | 10.35 |
| gerdu-narm (muted) | **6.48** | 6.76 | 5.65 | 5.90 | 4.77 | 4.59 | 5.58 | 4.89 |
| anar | **5.53** | 5.77 | 4.82 | — | ✗ 4.07 | ✗ 3.92 | 4.76 | ✗ 4.17 |
| pesteh | **5.78** | 6.04 | 5.04 | — | ✗ 4.26 | ✗ 4.10 | 4.98 | — |
| firuzeh | **5.48** | 5.72 | 4.78 | — | ✗ 4.04 | ✗ 3.89 | 4.72 | — |

**On-colour pairs:** `#FFFBF3` on anar **5.77** · on anar-deep **7.99** · on pesteh **6.04** · on firuzeh **5.72** · gerdu on zardchube **8.29** · gerdu on every age tint **≥ 10.67** · gerdu on every accent tint **≥ 10.39** · each accent *ink* on its own tint **4.69–6.56** and on shir **5.78–8.02** · gerdu on link-mark band **11.34**.

**Night & dark:** mahtab on shab **12.99** · mahtab on shab-raised **10.95** · mahtab-narm on shab **6.80** · mahtab on footer link band **6.59** · ember on shab **5.15** · dark ink on bg **14.70** / surface **13.46** / raised **12.13** / wood **8.93** / bubble **10.83** / tag **10.94** · dark muted on bg **9.15** · dark accent text on bg **5.83** · `#1C1612` on ember **5.83** / on pressed `#D2644E` **4.84** · dark success on bg **9.25** · dark link band ink **7.45**. ✗ ember text on dark wood (3.55).

**Non-text (≥ 3:1, WCAG 1.4.11):** focus ring firuzeh vs shir **5.48** (the 2px offset gap always shows the page colour, so the ring never sits against anar, 1.01) · dark focus vs bg **9.22** · input border khat vs shir **4.01** / sunken **3.65** · dark input border vs sunken **4.63** · thread anar vs shir **5.53** / kahgel **4.82** · selected chip pesteh vs unselected takhte **4.26** · **asal (2.47) and hairline (1.42) are decorative only, never a boundary.**

**Rules derived from the table:** only `ink`/`muted` text on takhte, kraft and highlight surfaces · coloured text (anar/pesteh/firuzeh) only on shir, raised, kahgel, nana · never anar text on the mustard swash · zardchube is never text · prices are always `ink` (sale price may be `anar` on shir/raised).

### 2.4 Typography roles (per FONTS.md; one deliberate deviation)

| Role | Face | Token / utility | Size & line-height | Where |
|---|---|---|---|---|
| Display | **Ario Dots1** (weight 400 only, preloaded) | `font-display` | `text-display` 1.28 · `text-3xl` 1.3 · `text-2xl` 1.32 | H1 everywhere; H2 on home, hubs, category, PDP section titles; big numerals |
| Body / UI | **Estedad** variable 100–900, `ss01` round dots (preloaded) | `font-body` (default) | body 1.85 · article 1.9 · UI 1.6 | everything else; article H2/H3 in Estedad 800/700 (long questions read better at 1 a.m.) |
| Accent | **Mikhak** 600, `KSHD` 100–200 (lazy) | `font-accent` | 1.55 | kickers, pencil marks, child names on placards, testimonial notes, Tati's tag, the 4 kashida pulls |
| Lettering | commissioned SVG (3 phrases) | — | — | «یکی بود، یکی نبود…»، «قصهٔ ما به سر رسید…»، «نخ از دستمون در رفت!» (404). `aria-hidden`, real text adjacent. Until delivered: Mikhak at `KSHD 160` |
| Latin | Estedad/Ario Latin; **CHOOBZ wordmark is inline SVG** | `lang="en" dir="ltr"` | — | brand names, SKUs (`<bdi>`) |

- **Deviation from FONTS.md §5.5:** Ario swash (`ss02`) is **not** site-wide. Apply `.swash` only to the cover display line, the three chapter H2s and TheEnd H2. Everything else in Ario uses `font-feature-settings: normal`.
- Weights: Estedad 400 body · 600 UI/buttons · 700 card titles, prices, bold · 800 article H2. Never `font-bold` on Ario. Never `"wght"` in `font-variation-settings`.
- **Never:** `tracking-*` on Persian, `italic`, `text-transform`, `text-justify`, typed kashida «ـ», Arabic ي/ك, Latin digits in visible text (convert with `src/lib/format.ts`). `tabular-nums` only in cart totals, steppers, installment wheels, room total and tables.
- Measure: prose `max-w-prose` (38rem). Headings `text-wrap: balance`, paragraphs `pretty`. Text aligns `start`.

### 2.5 Grid and layout

- **Phone (< 640):** 4 columns, 12 px column gap, `px-gutter` (16 px), no horizontal page scroll ever (tables scroll inside themselves or stack).
- **Tablet (≥ 768):** 8 columns, 20 px gap. **Desktop (≥ 1024):** 12 columns, 24 px gap, `max-w-page` (1280) centred; spreads up to `max-w-wide` (1440).
- **Sections:** `py-section`; alternate `bg-bg` / `bg-surface` (kahgel) sections — the contrast between them is a soft 1.15:1 by design (calm), separated by a 5px `ply-band` only where a "shelf" is meant.
- **Logical properties only** (`ps-*`, `me-*`, `start-*`, `inset-inline-*`, `border-s`). `rtl:`/`ltr:` variants only for icons that must mirror (arrows, chevrons, "back").
- **Desktop "open-book spread"** (cover and height door only): two pages with a soft centre gutter shadow (`linear-gradient` 24 px, ink 6%) and, on the cover only, a dashed anar binding stitch.

---

## 3. Texture & illustration system

### 3.1 Wood grain — build-time tiles, slug-seeded selection (no runtime filters)

- **Generator:** `scripts/textures/grain.ts` (tsx, run once, output committed) writes `public/textures/grain-00.svg … grain-11.svg`.
  - PRNG: `mulberry32(fnv1a("choobz-grain-" + i))`.
  - `viewBox="0 0 400 500"`, `preserveAspectRatio="none"`, no background (transparent).
  - 14–22 near-vertical wavy lines: each starts at `x = (n + rnd·0.6)·(400/lines)`, steps `dy = 40 + rnd·30`, `dx = (rnd − 0.5)·10`, quadratic segments `Q`; lines bend ±14 units within 60 units of a knot.
  - 0–2 knots (65% chance of one): 3–5 concentric ellipses, rx 6–14, ry 3–6.
  - Stroke `#3A2412`, `stroke-opacity` 0.10–0.16 per line, `stroke-width` 1–1.6, `fill="none"`, round caps. Coordinates rounded to 1 decimal, SVGO `precision: 1`.
  - Budget: ≤ 3 KB gzip per tile; cached `immutable`.
- **Selection:** `src/lib/grain.ts` → `grainFor(slug) = { index: h % 12, flip: (h >> 4) & 1, offset: ((h >> 5) % 4) * 25 }` with `h = fnv1a(slug)`. 12 tiles × 2 flips × 4 offsets = 96 boards, so no two adjacent cards share a board.
- **Application:** a `.grain` pseudo-element on wood faces: `background: var(--grain) var(--grain-x, 0%) 0 / 100% 100%`, `scale: var(--grain-flip, 1) 1`, `opacity: .9` light / `.6` dark. Long axis of the grain follows the object's long axis (rotate the pseudo-element 90° on horizontal planks).
- **Phase 2:** scan real birch sheets from the workshop → AVIF tiles of ~15 KB replace the generated set (same API).
- **Banned:** `feTurbulence`, SVG filters or `mix-blend-mode` on large/scrolling areas, photographic wood wallpapers, wood as a page background. Wood is for **objects**, never walls.

### 3.2 Ply-edge treatment (the brand's visual signature)

| Where | Technique |
|---|---|
| Raised pieces (buttons, cards, chips, dock, quick-add) | `shadow-ply` stacked 1px strata (ply-1 / ply-2 / ply-1 / ply-3) + soft contact shadow. Pressed: `translate: 0 2px` + `shadow-ply-pressed` (90 ms down, 330 ms release on `--ease-press`). The `ply` utility bundles a **raised-paper face** + edge + press for neutral pieces (cards); coloured pieces (primary button, selected chip) use `bg-*` + `shadow-ply` + `active:` utilities instead, so two background declarations never compete |
| Bands (shelf lips, section dividers, free-shipping meter track, stage floors) | `ply-band` utility (repeating gradient, 5 px) |
| Display type (≤ 1 per viewport, ≥ 40 px) | `ply-type`: painted face (anar / pesteh / ink) + raw strata in `text-shadow`; `padding-block-end: .14em` so strata never hit the next line's dots |
| Drawings (every visible cut edge) | SVG `<pattern id="ply">` of 3–5 alternating stripes (takhte-light / asal / ply-dark), aligned to the edge direction; drawn by `PartsRenderer` as the thickness band of each panel |
| Hex chips & stamps | an edge pseudo-element with the same `clip-path`, translated 3px down, filled `asal`; face on top |

### 3.3 Paper & overlays (performance-safe)

- `public/textures/paper.webp` and `paper-night.webp`: 160×160 px, grayscale speckle + short fibres, alpha 0–6% (dark tile: light specks), ≤ 2 KB each, generated by `scripts/textures/paper.ts` with sharp. Applied as the **first background layer of `body`** and of `bg-surface` sections — no fixed overlay, no blend mode, no extra compositor layer.
- **Notebook grids** (article stationery): CSS only — dots `radial-gradient(var(--line) 1px, transparent 1px) 0 0 / 24px 24px`, blueprint grid `linear-gradient` lines in firuzeh 12%.
- **Contact shadow** under every object: `radial-gradient(closest-side, rgb(var(--shadow-rgb) / .22), transparent)` on an ellipse pseudo-element (`.contact-shadow`), darker under the feet.

### 3.4 Orosi light (the one raster in the story layer)

- **Asset:** `public/light/orosi-morning.avif` (+ `.webp` fallback via `<picture>`), 720×540 RGBA (mobile variant 480×360). Four soft lozenges — zardchube, `#B9D3B5` sage, lapis, `#E59A84` soft pomegranate — under an arched گره‌چینی lattice silhouette, **pre-blurred** (Gaussian ≈ 18 px at source scale), maximum alpha 35%. Light direction: from the upper right (RTL start), matching every drawing. Budget **≤ 14 KB mobile / ≤ 22 KB desktop**.
- **Use:** cover only (+ optional mag hub masthead). Rendered `<img alt="" aria-hidden fetchpriority="high" decoding="async">`, absolutely positioned, CSS `scale: 2.2`, `opacity: .85`. Not inside the H1 box (it can tint, never reduce text contrast below 9:1).
- **Dark mode:** hidden; replaced by a lamp pool `radial-gradient(closest-side, rgb(255 196 120 / .20), transparent 70%)`.
- **Photo continuity (Phase 1.5 shoot):** a plywood Orosi gobo cut on Choobz's own CNC, placed in front of the window, so real photos carry the same light.
- No device-clock dayparts. The light is always "morning".

### 3.5 The mother's hand (marks sprite)

- `public/marks.svg`: 16 `<symbol>`s drawn with a 2 px round, slightly pressure-varied pen in ink: sprout, sprout-pair, heart, star, sparkle, scribble-circle, underline-scribble, curved arrow (rtl & ltr), motion ticks, «!», pencil check, little house, bow, raindrop, sun.
- Used via `<Doodle name="sprout" />` (`<svg aria-hidden><use href="/marks.svg#sprout"/></svg>`), 16–32 px, ink at 70% (muted in dark).
- **Rules:** ≤ 2 per viewport; never on prices, legal text, forms or the truth layer (one sprout may point at a feature in a drawing); never animated except the sprout "grow" on `<details>` open (scale-y 0 → 1, 240 ms).
- The **mustard swash** (`mark-swash`) is CSS, behind one word of one headline per viewport. It paints right-to-left on view (`background-size: 0 100% → 100% 100%`, origin right), once.

### 3.6 Tati — mascot specification

**Identity.** Tati is the logo's duck-on-a-pull-cart rebuilt as a real wooden object, faithful to the logo's line-drawing-with-grain style. Natural birch body; **colour only on the string (anar) and the four wheel hubs (anar)**. He always faces and travels toward inline-end (left). If the logo duck faces right, the journey Tati is a mirrored *drawing* (redrawn), never a flipped logo file.

**Construction (master artboard `viewBox="0 0 48 40"`, side view, 3/4 hint):**

| Part | Geometry | Fill / stroke |
|---|---|---|
| Body | plump teardrop, x 6–42, y 4–27; head circle r 7.5 at (34, 10) on the inline-end side; tail tip at (7, 13) | `var(--wood)` + 3 grain strokes (`--ply-2` 35%) along the body; belly highlight `var(--wood-top)` |
| Wing | one carved curve from (16, 17) to (27, 20), no fill change | stroke only |
| Beak | rounded wedge at (41, 11), 4.5 × 3 | `asal` |
| Eye | dot r 1.6 at (35, 9) + 0.6 shir catch-light | ink |
| Cart platform | rounded rect x 4–44, y 26–30, r 1.5 | `var(--wood)`; front edge shows 3 ply strata |
| Wheels (front pair, separate files) | circle r 6 at (14, 33) and (34, 33); hub r 2 | disc `var(--wood)`, ink stroke; hub anar; 4 short spoke ticks so rotation reads |
| Back wheels | hinted at (18, 32), (38, 32), r 6, 55% opacity, static, part of the body file | — |
| String | from the cart's front (44, 28) running off-canvas; small wooden bead at its end | anar 1.5 px |

- **Strokes:** ink, `vector-effect: non-scaling-stroke`, 1.5 px at ≤ 64 px wide, 2 px above. Round caps/joins.
- **Kit (for compositor-only motion):** `TatiBody.tsx` (pose body, static) + `TatiWheel.tsx` (one wheel; rendered twice in HTML `<span>` wrappers that rotate) + `TatiString` (CSS line in the rider; SVG in scenes). Fills through CSS variables so he is lamp-lit in dark mode.
- **Phase 1 poses (4):** `rolling` (thread rider; 4° forward lean) · `waiting` (cover; head up, string slack, blinks every 7 s with `animate-blink` on the eye wrapper) · `sleeping` (TheEnd/404-night variant; eye a closed curve, head tucked, three Z marks as SVG paths) · `slipped` (404; string end on the floor, head turned back). **Accessories:** Yalda scarf, Nowruz sabzeh tray (overlay SVGs, same artboard).
- **Sizes:** thread rider 40 px (mobile) / 48 px (desktop); cover 120–180 px; 404 160 px; TheEnd 96 px.
- **Never:** a mouth or teeth, arms, clothes (except seasonal accessories), recoloured body, rotation beyond ±8°, stretched proportions, Tati on product imagery or prices, more than one Tati per viewport, Tati in commerce UI (cart icon is only the cart).

### 3.7 Product drawings — the parts-manifest system (truth layer)

**One manifest per product → five truthful views.** Ask the workshop for DXF cut files now ⚑. Until they arrive, manifests are authored from the real dimensions in `products.dimensions` (`source: "measured"`); the label switches automatically.

```ts
// src/components/illustrations/manifests/learning-tower.ts (units: mm; world axes: x → right, y ↑ up, z → away from viewer)
export default {
  key: "learning-tower",
  source: "measured",            // "dxf" once cut files exist → label «طرح دقیق از روی نقشهٔ برش»; else «طرح از روی ابعاد واقعی»
  sheet: { w: 2440, h: 1220, t: 18 },                       // flat nesting view (cover, شناسنامه)
  parts: [
    { id: "side-r", kind: "panel", plane: "YZ", origin: [450, 0, 0], t: 18, outline: "M0 0 H450 V900 H0 Z …", holes: "…stadium hand-hole…", order: 1, sheetAt: { x: 40, y: 30, rot: 0 } },
    { id: "platform", kind: "panel", plane: "XZ", origin: [18, 380, 18], t: 18, outline: "…", order: 4 },
    { id: "rail-top", kind: "rod", from: [18, 820, 0], to: [432, 820, 0], d: 28, order: 6 },
    { id: "ramp", kind: "extrusion", plane: "XY", origin: [0, 0, 0], depth: 400, profile: "…", order: 2 }, // bent/curved parts
  ],
  exploded: { "side-r": [60, 0, 0], "platform": [0, 80, 0], "rail-top": [0, 60, 0] }, // world-mm offsets
  dims: ["widthCm", "depthCm", "heightCm", "extra.ارتفاع سکو (وسط)"],                 // which DB dimensions to annotate
  anchors: { engravePlate: [60, 860, 0, 330, 40], platformLevels: [300, 380, 460] },
} as const;
```

**Part kinds:** `panel` (planar outline + holes + thickness `t`), `extrusion` (profile in XY extruded along z — balance board, arch rails, rainbow arcs, duck body), `rod` (cylinder — rungs, dowels, rails, paper roll).

**Projection — cabinet oblique, α = 30°, k = 0.5** (front faces stay true CNC outlines; depth recedes toward the upper inline-end/left):

`S(x, y, z) = ( x − 0.433·z ,  −y − 0.25·z )` (SVG y grows downward).

A planar part with local axes (u, v) at origin o gets one static `matrix(a b c d e f)`: `(a, b) = S(u) − S(0)`, `(c, d) = S(v) − S(0)`, `(e, f) = S(o)`.
- `XY` (front-facing): `matrix(1 0 0 −1 e f)` · `YZ` (side panels): `(a,b) = (−0.433, −0.25)`, `(c,d) = (0, −1)` · `XZ` (horizontal): `(a,b) = (1, 0)`, `(c,d) = (−0.433, −0.25)`.
- Thickness: the outline is drawn a second time offset by `S(n · t)` and filled with the `ply` pattern; the visible band between the copies is the plywood edge.
- Painter's order by `order`, then by mean depth.

**The five views (all generated by `scripts/illustrations/build.ts` and the `PartsRenderer` server component):**

| View | Projection | Used in | Delivery |
|---|---|---|---|
| `flat` | true 2D outlines at `sheetAt` positions on the sheet | cover ghost holes & nested toolpaths, شناسنامه corner | inline (cover) / `<img>` |
| `assembled` | oblique | product cards, room scenes, cart thumbs, embeds | `<img src="/illustrations/{key}-assembled[-{finish}].svg">` |
| `exploded` | oblique + `exploded` offsets + dashed dowel lines | card hover (pointer devices), PDP «نمای انفجاری» | `<img>` (cards) / layered inline (PDP) |
| `ortho` | front + side elevations, dimension lines | PDP «ابعاد», scale tool | `<img>` + **HTML** dimension labels positioned from manifest coordinates (no meaningful SVG `<text>`) |
| `scale` | ortho front + peg-doll at WHO median height ⚑ | PDP «با قدِ بچه‌ت مقایسه کن» | layered HTML (doll scales by `--child-cm`) |

**Layered (animatable) render:** for the cover tower and PDP stage, `PartsRenderer layered` emits **one small `<svg>` per part** (same `viewBox`) stacked absolutely inside an HTML container. Explode = translate each part's HTML wrapper by `S(offset)` converted to % of the viewBox → compositor-only. Never animate SVG child transforms or `d`.

**Drawing style guide (for every illustrator and for the generator):**

| Aspect | Rule |
|---|---|
| Line | ink `#33251B`, `vector-effect: non-scaling-stroke`; silhouette 1.75 px, inner detail 1 px, ply stripes 0.75 px at card size (320 px wide) |
| Faces | front `var(--wood)` takhte · top `var(--wood-top)` · receding side `var(--wood-side)` (light from the upper right, so left/receding sides are in shade) |
| Grain | 3–7 hand-placed strokes per large face, `--ply-2` at 35%, along the long axis; never noise |
| Edges | every cut edge facing the viewer shows the 3–5-stripe ply band; all corners rounded ≥ 3 mm in model space (6 mm router bit); hand-holes are stadium cut-outs |
| Finishes | from `product_variants.swatch` / options: natural (default) · white `#F7F1E6` face with natural ply edges · painted variants use the accent *tints* on faces, ply edge always raw |
| Shadow | one contact-shadow ellipse (no filters, no gradients elsewhere) |
| Forbidden | gradients (except the contact shadow), drop-shadow filters, text in SVG, outlines on the contact shadow, perspective other than the oblique standard, exaggerated proportions |
| Files | `/public/illustrations/{key}-{view}[-{finish}].svg`; 1 unit = 1 mm before projection; coordinates to 1 decimal; ≤ 150 nodes, ≤ 8 KB raw; SVGO `precision: 1`; `aria-hidden` when inline, `alt` from DB when `<img>` |
| CI | every `products.illustration` / `categories.illustration` key must have a manifest and its built files |

**Per-product notes** (dimensions from `seed/content/products.json`, mm in manifests):

| Key | Product | Drawing notes |
|---|---|---|
| `learning-tower` | برج یادگیری (450 × 450 × 900) | 2 side panels with stadium hand-holes and 3 platform slots (300/380/460 ⚑), platform shown at the middle level by default (`platformLevel` prop), 2 front steps, rail 440 above the platform on 4 sides; `anchors.engravePlate` = top step front for the engraver; foldable variant shows the folded 160-deep state in the `scale` view |
| `pikler-triangle` | مثلث پیکلر با رمپ (700 × 750 × 850) | 2 A-frame sides, round rungs with 70 clear spacing; double-sided ramp 1000 × 400 leaning on rung 3 (slide face smooth, climbing face with cleats); folded state 120 deep for the 9 m² room |
| `pikler-arch` | آرک پیکلر (950 × 450 × 500) | 2 arch side panels as `extrusion` profiles (arc), rungs between; second pose `rocker` (flipped) for the room scene; cards: hover rocks ±4° about the floor point (HTML wrapper rotate) |
| `swedish-ladder` | نردبان سوئدی (800 × 2000 × 150) | 2 uprights, 12 rungs Ø30, wall brackets top/middle/bottom, wall line + floor line; optional `climbing-hex` panels attached in scenes; min ceiling 2400 note in `scale` view |
| `climbing-hex` | پنل‌های شش‌ضلعی (690 × 600 × 80, 3 panels) | hexagon panels with 5 holds each; holds as rounded wooden blobs (natural; painted variants use accent tints) |
| `balance-board` | تخته تعادل (800 × 180 × 300, t 15) | single `extrusion` of the arc profile, depth 300; ply laminations visible along the whole curved edge (the hero detail) |
| `front-facing-bookshelf` | کتابخانهٔ روبه‌رو (600 × 800 × 120) | wall-mounted back, 3 ledges 80 deep with front lips; books face-out as plain tinted rectangles (no titles, no text) |
| `wall-art-roll` | رول نقاشی دیواری (620 × 850 × 120) | wall panel, paper roll `rod` Ø80 at the top, paper hanging to a cutter bar, 80-deep tool ledge with 3 crayons |
| `kids-table-chair` | میز و صندلی (table 600 × 460 × 500; chair seat 260, back 520, width 300) | table + one chair, oblique; chair tucked 30% under the table in `assembled`, separated in `exploded` |
| `montessori-shelf` | قفسهٔ مونته‌سوری (900 × 500 × 300) | 2 open tiers 220 high; 4 toys placed (stacker, blocks basket, duck, a book) as simple shapes |
| `rainbow-stacker` | رنگین‌کمان چوبی (360 × 180 × 70, 12 arcs) | 12 nested arc `extrusion`s; natural finish alternates wood / wood-top / ply-2 tones; dyed variant uses muted tints, never saturated primaries |
| `duck-pull-toy` | اردک چرخ‌دار چوبی (200 × 160 × 110) | **the real product version of Tati**: same silhouette, product style (accurate proportions, ply edges, wheels as rods/discs, string) — Tati is its character, this is its truth |
| `wooden-blocks` | مکعب‌های ساختنی (32 pieces) | a small stack + a tray; unit 40 |
| `room-set` | پک اتاق مونته‌سوری | composed from the room scene kit (§3.8) at preset `toddler-2-3` |

### 3.8 People, rooms and icons

- **Peg dolls (Waldorf figures):** rounded bell body + sphere head, no facial features (optional cheek dots, anar 30%). Child height = WHO median for the age ⚑ (6 m 67 · 12 m 75 · 18 m 82 · 24 m 87 · 36 m 96 · 48 m 103 · 72 m 116 cm, labelled «میانگین»; source line «منبع: استانداردهای رشد کودک WHO»). Head ≈ 1/4.5 of height for toddlers. Bodies in accent tints (sage, terracotta, mustard, sky); mothers taller, with or without a soft scarf (hijab) shape; fathers and a grandmother exist in the kit. Stroke ink 1.25 px. Used in: scale tool, door scene, room scenes, «چطور باهاش بازی کنیم؟» vignettes, UGC placeholders.
- **Room scene kit** (`RoomKit.tsx`, inline, ≤ 4 KB): kahgel wall, wood-strip floor drawn in the same oblique, an arched window with a subtle گره‌چینی lattice, a doorframe with pencil marks, a glimpse of a kitchen counter (900 ⚑) through the doorway, one cultural note per scene (a geranium in a terracotta pot or a tea glass on the sill). Scene `viewBox` 3200 × 2400 mm; products placed as `<img>` at true relative scale using named slots (`src/components/shop/room-slots.ts`: `wall-start`, `wall-mid`, `wall-end`, `floor-start`, `floor-mid`, `floor-end`, `by-door`, `kitchen`). The 9 m² preset uses a 3000 × 3000 plan footprint inset.
- **Icons:** ~30 custom, 24 px grid, 1.75 px ink stroke, round caps/joins, 2 px corner radii, a slight carpentry-pencil wobble. Brand glyphs: cart = Tati's **cart** with stacked parcels (1–4, then «+۵»; no duck), shelf (shop), hex (age), notebook (mag), house, saw (workshop), four wheels (installments), ruler (dimensions), sprout (Montessori tip), shield-leaf (safety), stamp (made by Choobz), Bale and Instagram outline glyphs (no brand colours). Header/dock icons are inline (5 tiny SVGs in the layout); everything else uses `/icons.svg` sprite (`<use>`). Directional icons mirror with `rtl:-scale-x-100`; cart, clock, check, Tati never mirror.

### 3.9 Photography (Phase 1.5) and how photos join

- **Stage** (`ui/Stage.tsx`) is media-agnostic: a 4:5 arch frame (`rounded-arch`) on kahgel with the product's grain and a contact-shadow floor. `media.kind` decides the treatment: `illustration` (manifest SVG) · `cutout` (alpha AVIF on the stage with a real contact shadow; looks identical to the drawings) · `photo` (fills the arch with a 6 px shir paper frame).
- Grids prefer `cutout` → `illustration`; galleries prefer photos first and keep the drawings as truth slides (exploded, ابعاد).
- **Brief:** plaster sweep matching kahgel `#F1E6D3`; daylight from frame-right (upper right), 5000–5200 K, lifted blacks; camera at the child's eye line (70–90 cm); hands and feet in action, faces only with written consent; the CNC Orosi gobo for hero shots; per SKU: cutout 4:5, ply-edge macro 1:1, in use 4:5, scale with a child or a 1 m wooden ruler, folded/adjusted state. EXIF/GPS stripped on upload.

---

## 4. Global layout & components

### 4.1 Header

**Mobile (< 1024), `SiteHeader.tsx` (server):** 56 px, `position: sticky; top: 0; z-(--z-header)`.
- Start (right): CHOOBZ wordmark + duck mark (inline SVG, links to `/`, `aria-label="چوبز کیدز، صفحهٔ اصلی"`).
- End (left): search button (opens `SearchDialog`), «فهرست» menu button (opens `MenuDialog`). 44 px targets.
- Bottom edge: **the thread** (1.5 px `bg-thread` at 55%) + `TatiThread`.
- Scroll state (zero JS): a paper backing pseudo-element fades from 0 to 1 opacity over the first 80 px of scroll (`animation-timeline: scroll(root)`, `animation-range: 0 80px`). Height never animates.
- On the PDP and articles the header stays identical (the dock changes, not the header).

**Desktop (≥ 1024):** 72 px. Start: wordmark. Centre nav (plain words): «فروشگاه ▾» · «سن به سن ▾» · «اتاق‌ها» · «مجله ▾» · «کارگاه» · «خرید قسطی». End: search field (expanding `TextInput` in a tray, GET `/search`), theme toggle (moon, `ThemeToggle`), cart button (`CartButton`: Tati's cart icon + count, opens drawer).
- **Mega menus** (`MegaMenu.tsx`, Popover API, zero JS): `popover="auto"` panels fixed under the header, full container width, opening like a toy-box lid (`transform-origin: top`, `rotate: x -6deg → 0` + opacity, 240 ms via `@starting-style`). «فروشگاه»: 6 category cubbies with mini drawings + age hex column + one room card («اتاق ۲ تا ۳ سالگی، کامل · یا ۴ قسط»). «مجله»: 9 topics, 3 pillar guides, «سؤال امروز». `HoverIntent.tsx` (0.3 KB, `pointer: fine` only) opens on 120 ms hover; click/Enter always works; Esc closes; focus returns to the trigger.

### 4.2 Mobile bottom dock (contextual)

`BottomDock.tsx` (server markup; the cart tab badge is the client `CartButton`). 64 px + `env(safe-area-inset-bottom)`, `fixed inset-x-0 bottom-0 z-(--z-dock)`, a wood plank (`bg-wood` + grain, ply strata on its **top** edge), five tabs with icon + label (Estedad 600 `text-2xs`):

«خانه» · «فروشگاه» · «سن به سن» (→ `#height-door` on home, `/age` elsewhere) · «مجله» · «سبد» (Tati's cart with parcel stack; `aria-label="سبد خرید، ۳ کالا"`).

- Active tab: an anar bead (8 px) above the icon + label weight 700 + `aria-current="page"`. Not colour alone.
- **PDP:** the dock is a two-faced block. When the price block leaves the viewport (view timeline, §9.5), the tab face rotates away (`rotate: x 90deg`, backface hidden) and the **buy bar** face rotates in: stage thumb (40 px) · price · «یا ۴ قسط» (success) · «افزودن به سبد» (primary). Never two bars stacked. Fallback without scroll timelines: buy bar always shown on the PDP.
- **Articles:** the dock stays; a floating «فهرست مطالب» pill (raised, 44 px) appears above it at inline-end when the inline TOC is out of view; it opens the TOC sheet. A thin taut-string bar inside the pill shows progress (`scale` on the scroll timeline).
- `view-transition-name: dock` (animation none) so it never turns with the page.
- Body gets `padding-block-end: calc(var(--spacing-dock) + env(safe-area-inset-bottom))` below 1024 px.

### 4.3 Menu dialog («فهرست»)

`MenuDialog.tsx` (server markup, opened with invoker commands `commandfor`/`command="show-modal"`; `InvokerPolyfill.tsx` ≈ 0.8 KB loads only when `!('commandForElement' in HTMLButtonElement.prototype)`). Full-screen `<dialog>` styled as a storybook **contents page**:
- Search field at the top (GET `/search`).
- «فروشگاه»: categories with mini drawings and dotted leaders to the count («برج یادگیری ........ ۱ مدل»).
- «سن به سن»: three hex chips (hubs). «اتاق‌ها»: presets. «مجله»: 9 topics.
- Links: «کارگاه ما»، «داستان چوبز»، «خرید قسطی با اسنپ‌پی»، «ارسال و بازگشت کالا»، «سؤالات متداول»، «تماس با ما».
- Socials (Bale, Instagram), toggles «حالت لالایی» and «حرکت آرام».
- Enter/exit: slide up 24 px + fade, 240 ms, `@starting-style` + `transition-behavior: allow-discrete` on `display`/`overlay`. Esc and backdrop close.

### 4.4 Search

- **Dialog** (`SearchDialog.tsx`): GET form to `/search` (works without JS) with a recessed input «دنبال چی می‌گردی؟», popular chips («برج یادگیری»، «مثلث پیکلر»، «۱ سالگی»، «اتاق مونته‌سوری»), recent searches (localStorage, try/catch).
- **Suggest** (`SearchSuggest.tsx`, ≈ 3 KB, `import()` on first focus): `/api/suggest?q=` (FTS5, Persian normaliser), 150 ms debounce, results grouped «محصولات · راهنماها · واژه‌ها» as plain links, `role="listbox"` with arrow-key navigation.
- **Page** `/search` (dynamic, `noindex, follow`): same groups, server-rendered; zero results return 200 with «برای «{q}» چیزی پیدا نکردیم؛ شاید این‌ها به کارت بیاد:» + top categories + pillar guides.

### 4.5 Breadcrumbs — string and beads

`layout/Breadcrumbs.tsx` (server): `<nav aria-label="مسیر صفحه"><ol>` above the H1 on every page except home. Items in `text-xs`, links `text-ink` (`link-mark` on hover), separated by a 6 px wooden bead (asal with a ply-1 ring) sitting on a 1 px ink-20% string. Current item: `aria-current="page"`, `text-muted`, truncated at 22ch. Mobile: one line, horizontal scroll inside the nav with an end fade mask. The same data feeds `BreadcrumbList` (SEO.md §1.7). Breadcrumb/back links carry `transitionTypes={['nav-back']}`.

### 4.6 Footer — night endpapers

`SiteFooter.tsx` (server), fixed-scene colours (`bg-shab`, `text-mahtab`), never switches theme.
- **Top band:** 48 px endpaper strip on kahgel — a repeating 2 KB SVG pattern of tiny ply-cut toys (tower, triangle, duck, bead, sprout) — then the night sky with paper stars (CSS dots; 3 twinkle periods 4 s / 6.5 s / 9 s, opacity only, `motion-ok`) and a little learning-tower house with a lit window at inline-end.
- **Columns** (stack on mobile, 5 on desktop): «فروشگاه» (categories) · «مجله» (pillars, واژه‌نامه، سن به سن) · «چوبز» (کارگاه، داستان چوبز، تیم، سیاست تحریریه) · «راهنمای خرید» (ارسال، بازگشت کالا، ضمانت، ایمنی و متریال، خرید قسطی، سؤالات متداول) · «تماس» (`<address>`: phone `<span dir="ltr">` in Persian digits with a Latin `tel:`, hours, city — NAP byte-identical to JSON-LD and eNamad).
- **Entity sentence (GEO, visible):** «چوبز کیدز سازندهٔ اسباب‌بازی و سیسمونی چوبی کودک با الهام از مونته‌سوری و والدورف است؛ همهٔ محصولات در کارگاه خود چوبز از تخته چندلایی توس ساخته می‌شوند.» (= `Organization.description`, `llms.txt` blockquote).
- **Trust row:** eNamad (plain `<img referrerpolicy="origin" loading="lazy">` in a fixed 85 × 92 box ⚑), SnappPay mark (self-hosted SVG ⚑), Bale and Instagram links.
- **Toggles:** «حالت لالایی» (`ThemeToggle`), «حرکت آرام» (`MotionToggle`) — both write `localStorage` and `html[data-*]`.
- Links on night: mahtab text + a mustard band at 30% (6.59:1).
- Last line: «© ۱۴۰۵ چوبز کیدز — با دست و دل، توی کارگاه خودمون ساخته شده.» and «برگرد به صفحهٔ اول» (smooth scroll when motion is allowed; Tati rolls back for free).

### 4.7 Cart drawer and `/cart`

`CartDrawer.tsx` (client, content `import()`ed on first open or first add), inside `CartProvider` (client, global).
- **Container:** native `<dialog>` via `showModal()`. Mobile: bottom sheet, 92dvh, drag handle (tap the handle or swipe down ≥ 80 px to close — a 0.6 KB pointer handler, no library). Desktop: from inline-end (left), 420 px, full height. Enter/exit 240 ms `@starting-style`. Backdrop ink 40%.
- **Header:** H2 «سبد خرید» (plain words) + a small cart illustration with parcels = item count + close (44 px).
- **Free-shipping meter:** a string (thread) running to a little house at inline-end, with a wooden bead at `--p` (translate, composited). «فقط ۴۲۰٬۰۰۰ تومان تا ارسال رایگان» → «ارسال این سفارش رایگانه!». Hidden when `settings.shippingPolicy.freeOverToman` is null ⚑.
- **Lines** (`shop/CartLine.tsx`): 64 px stage thumb (assembled SVG), name (link), variant/add-on line («حک اسم: آیلین»), price (`tabular-nums`), stepper (two wooden keys around a recessed number, 44 px), remove «×» → undo toast.
- **Cross-sell:** «کنارش خوب می‌شینه» — one `product_relations.kind = 'bundle'` item.
- **Summary:** subtotal, «یا ۴ قسط ۲٬۴۵۰٬۰۰۰ تومانی با اسنپ‌پی» + 4 mini wheels, shipping note, **trust strip inside the drawer** (eNamad mini, «۷ روز ضمانت بازگشت» ⚑, «پشتیبانی در بله»).
- **CTA:** «ادامهٔ خرید» → `/cart`.
- **Empty:** «گاریِ تاتی خالیه! بریم یه چیزی بذاریم توش؟» + three category links. («گاری» appears only here as flavour; the UI label is always «سبد خرید».)
- **State:** `localStorage["cz.cart.v1"] = [{ productId, variantId, qty, addons: { engraving?: string }, snap: { slug, name, priceToman, illustration, mediaPath? }, addedAt }]` via `useSyncExternalStore`, synced across tabs with the `storage` event, wrapped in try/catch (private mode → in-memory + a one-time toast). On drawer open, `GET /api/cart/quote?ids=` (route handler, outside `(site)`) refreshes prices/availability; changed prices show «قیمت این وسیله عوض شده: …». Never trust client prices (Phase 2 checkout re-validates on the server).
- **Add-to-cart choreography** (`AddToCartButton.tsx`): optimistic count → the product thumb hops along a 3-keyframe WAAPI arc (`element.animate`, `--ease-hop`, 800 ms) into the cart icon → cart wobbles (`--ease-wobble`, rotate ±6°) and gains a parcel → toast «برج یادگیری به سبد اضافه شد · دیدن سبد» (`aria-live="polite"`). Reduced motion: count + toast only.
- **`/cart` (Phase 1 stub, `noindex`, client-rendered from the store):** line list + summary + «ثبت سفارش در بله» (copies a plain-text order summary to the clipboard, then opens the Bale link; toast «متن سفارش کپی شد؛ توی بله برامون بفرست») + «تماس تلفنی» (`tel:`). Phase 2 replaces this with the real checkout and the SnappPay gateway.

### 4.8 Buttons (`ui/Button.tsx`, server; `AddToCartButton` is the client variant)

Anatomy: `<button>`/`<a>` · optional leading icon · label (Estedad 600) · optional trailing icon. `inline-flex items-center justify-center gap-2 rounded-bit-sm select-none`.

| Variant | Face / text | Edge | Use |
|---|---|---|---|
| `primary` «بلوک چوبی» | `bg-accent text-on-accent` | `shadow-ply` → pressed | one per viewport: add to cart, «بریم فروشگاه», «همه را به سبد اضافه کن» |
| `secondary` | `bg-raised text-ink`, 1.5 px `border-line-strong` | `shadow-ply` | «برای سنِ بچه‌م چی خوبه؟», «ادامهٔ خرید» |
| `wood` | `bg-wood text-ink` + grain | `shadow-ply` | filters, «بیشتر نشونم بده», toggles |
| `quiet` | text-ink + `link-mark` | none (flat) | inline actions «همه ←», «پاک‌کردن فیلترها» |
| `consult` | `bg-raised text-success`, 1.5 px success border | `shadow-ply` | «سؤال داری؟ در بله بپرس» |
| `icon` | 44 px bead, `bg-raised` | `shadow-ply` | close, quick-add «+», stepper keys |

Sizes: `sm` 40 px tall (`text-sm`, hit area padded to 44), `md` 48 px (`text-base`), `lg` 56 px (PDP primary; full width on mobile).
States: hover (`hover:` only fires on hover-capable devices): face +4% lightness via `color-mix(in oklab, var(--accent), white 6%)` · active/pressed: `translate-y-[2px] shadow-ply-pressed` (90 ms) · focus-visible: 3 px focus outline, 2 px offset · disabled (`aria-disabled`): `bg-wood text-muted`, no strata, no press · loading (`aria-busy`): label kept, three beads pulse (static «…» under reduced motion).
Arrows in labels point left («←») = forward in RTL.

### 4.9 Inputs (`ui/Field.tsx`, `TextInput.tsx`, `Select.tsx`, `Checkbox.tsx`, `Radio.tsx`, `Toggle.tsx`, `Stepper.tsx`)

- **Field:** label above (Estedad 600 `text-sm`), optional hint (`text-xs text-muted`), error (`text-sm text-danger` + icon, `role="alert"`, linked via `aria-describedby`; never colour alone).
- **TextInput:** 48 px, `rounded-bit-sm`, `tray` (recessed) with 1.5 px `border-line-strong`, padding-inline 14 px, `text-base`, placeholder `text-muted`. Focus: border → focus colour + outline. `dir="rtl"` by default; phone/number fields `inputmode="numeric"` and accept Persian or Latin digits (normalised with `toEnDigits`).
- **Select:** native `<select>` styled as a wood block with a chevron; options native.
- **Checkbox:** a peg dropping into a hole (22 px recessed circle, checked = raised wooden peg + check glyph). **Radio:** same, round peg. **Toggle:** a wooden bead sliding in a 44 × 26 groove (`role="switch"`).
- **Stepper:** − / + wooden keys (44 px) around a recessed `tabular-nums` value; long-press repeat; `aria-label`s «کم کردن» / «اضافه کردن».

### 4.10 Chips, tags and badges

| Component | Anatomy | Notes |
|---|---|---|
| `HexChip` (age) | hexagon (`clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)`) face in the age tint, edge pseudo-element 3 px below; label `text-sm` 600 ink; min 56 × 44 | radio (door) or toggle (`aria-pressed`, filters); selected = seated (no edge) + a check bead |
| `PillChip` | bead-shaped (`rounded-bead`), `bg-wood`, `shadow-ply`, 40 px tall | filters, skills (with skill icon); selected: `bg-success text-on-accent` + check, seated |
| `RemovableChip` | pill + «×» (44 px hit) | applied filters, «پاک‌کردن همه» at the end |
| `AgeBadge` | small hex, age tint, «۱۸ ماه+» / «۱٫۵ تا ۵ سال» | links to the age hub when standalone |
| `StampBadge` | rubber stamp: 1.5 px accent border + inner dotted border, Estedad 700 `text-2xs`, `rotate(-6deg)` | «جدید»، «ساخت سفارشی»، «پیشنهاد یلدا». Max one per card |
| `InstallmentBadge` | four-wheel icon + «۴ قسط با اسنپ‌پی», `text-success` on `bg-bubble` | cards, PDP |
| `StockBadge` | dot + text: «موجود» (success) · «ساخت سفارشی · آماده در ۱۴ روز کاری» · «پیش‌سفارش» · «فعلاً تموم شده» (muted) | never colour alone |
| `SampleBadge` | «نمونه» kraft tag | only on seed sample content in non-production |

### 4.11 Cards

**ProductCard (`shop/ProductCard.tsx`, server)**

```
┌────────────────────────────┐  <article class="group relative ply rounded-bit p-3">
│ ⬡ ۱۸ ماه+        [جدید]   │  AgeBadge (top-start) · StampBadge (top-end, optional)
│   ╭──────────────────╮     │  Stage: aspect-[4/5] rounded-arch bg-surface + grain(slug)
│   │ assembled drawing│     │   <img assembled> ; <picture><source media="(hover:hover)" srcset=exploded> (hover swap)
│   │   (or cutout)    │     │
│   ╰──────────────────╯     │
│   ‿‿‿ contact shadow ‿‿‿   │
│ برج یادگیری مونته‌سوری      │  h3 text-base font-bold line-clamp-2 · stretched <a href="/product/…">
│ کنار شما در آشپزخانه         │  benefit text-sm text-muted (optional, products.subtitle)
│ ۹٬۸۰۰٬۰۰۰ تومان  ~~۱۰٬۵…~~  │  Price (ink, proportional digits) + <s> compare-at
│ یا ۴ قسط ۲٬۴۵۰٬۰۰۰ تومانی  │  InstallmentLine text-sm text-success
│ ● ● ○                 (+)  │  wood-chip swatches (≤ 4, then «+۲») · AddToCartButton icon 44px (z above the link)
└────────────────────────────┘
```
- Whole card is one link (stretched-link on the title); quick-add is a separate `<button>` (opens a variant mini-sheet when variants are required).
- `<ViewTransition name={`product-${id}`} share="morph" default="none">` around the Stage. First 4 cards per grid `<Link prefetch>`; the rest `IntentLink`.
- Price in `<data value="{toman}">`; machine price only in JSON-LD (×10 IRR).
- Hover (pointer devices): card lifts to `shadow-ply-lifted`, drawing crossfades to `exploded` (250 ms). Toys "play" instead: duck rolls 8 px, balance board rocks, arch rocks (HTML-wrapper transforms).

**ArticleCard (`mag/ArticleCard.tsx`):** raised paper card; arch-masked cover (illustration `<img>` or photo); **format stationery** as a corner device + format chip: `guide` kraft notebook (elastic band) · `article` ruled paper · `howto` blueprint grid · `comparison` graph paper · `checklist` pencil-ticked list · `story` photo-album corners. Title Estedad 700 `text-lg` (question form), 2-line excerpt, meta row (`text-xs text-muted`): topic · AgeBadge · «۷ دقیقه». `name={`post-${id}`}` morph into the article cover.

**CategoryCubby (`home/ToyShelf.tsx` + `shop/CategoryRail.tsx`):** a recessed cubby (`tray`, kahgel) with the category drawing standing inside on a ply-band shelf, and a **raised label plate** below (the tappable cue) with the name (Estedad 700 `text-sm`) and «۶ مدل». The whole cubby is the link. Morph name `category-${slug}`.

**RoomCard:** wide card with a mini room scene, preset name, «۵ تکه · ۳۵ میلیون تومان», InstallmentLine, «این چیدمان را ببین ←».

**TermCard:** tiny ply-cut illustration (if any), term (Ario `text-lg`), `<bdi lang="en">` original term, one-line definition.

### 4.12 Section header, kicker, CTA blocks, toasts, sheets

- **SectionHeader (`ui/SectionHeader.tsx`):** `kicker?` (Mikhak `text-lead`, accent or success colour, with an optional sprout `Doodle`; `aria-hidden` when it is purely decorative like «فصل یکم · بازی») · `title` (H2, Ario `text-2xl` on home/hubs, `text-xl` on content pages; `.swash` + `ply-type` only for chapter titles) · `sub?` (`text-lead text-muted max-w-prose`) · `link?` (quiet button at inline-end «همه ←»). Align start; centre only on TheEnd.
- **AskChoobz (`ui/AskChoobz.tsx`):** a mint bubble (tail at inline-start) with «سؤالی داری؟ قبل از خرید از خودِ کارگاه بپرس», two buttons «پرسیدن در بله» (consult) and «دایرکت اینستاگرام» (quiet), and response hours. Hidden parts when `settings.socials.bale` is null.
- **InstallmentCta:** four wheels + one sentence + «چطور کار می‌کنه؟ ←» `/installments`.
- **Toast (`ui/Toaster.tsx`, client, inside `CartProvider`):** a kraft note (raised, `shadow-paper`), icon + one line + optional action («برگردون»، «دیدن سبد»), `role="status"`, 4 s auto-dismiss (paused on hover/focus), max one visible, above the dock on mobile / bottom-start on desktop, `z-(--z-toast)`.
- **Sheet (`ui/Sheet.tsx`):** the shared `<dialog>` primitive (bottom sheet < 1024, side drawer ≥ 1024), invoker-command opened, `@starting-style` transitions, focus trap and Esc from `showModal()`.
- **Bubble (`ui/Bubble.tsx`):** mint speech bubble, `rounded-bit-lg`, tail SVG at inline-start, ink text; used for questions, TL;DR, tips, Tati's greeting.
- **KraftTag (`ui/KraftTag.tsx`):** kraft paper tag with a punched hole and a string, for شناسنامه headers and «ساخت سفارشی».

### 4.13 Price, installments, Stage

- **Price (`ui/Price.tsx`):** `formatToman()` («۹٬۸۰۰٬۰۰۰ تومان»), Estedad 700, proportional digits, wrapped in `<data value>`. Compare-at in `<s aria-label="قیمت قبلی">` muted + `discountPercent()` stamp «۷٪ تخفیف».
- **InstallmentLine:** «یا ۴ قسط {installments(price)} تومانی با اسنپ‌پی», `text-success`, links to `/installments`. Shown only when `settings.snapppay` says the price is eligible ⚑ (SEO.md §6.4); prefix «حدود» if rounding may differ ⚑.
- **InstallmentWheels (`ui/InstallmentWheels.tsx`, server):** four cart wheels (24–40 px) in a row, each with the amount under it (`tabular-nums`) and a label. Server labels are timeless: «امروز · ماه دوم · ماه سوم · ماه چهارم»; an inline script after the row swaps them to Jalali month names before paint (`Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long' })`) with `suppressHydrationWarning` (Next guide "preventing flash before hydration"). Fine print «مبلغ دقیق اقساط در اسنپ‌پی نمایش داده می‌شود · طبق شرایط اسنپ‌پی». The wheels spin a quarter turn and settle when the amount changes (room builder, calculators).
- **Stage (`ui/Stage.tsx`):** see §3.9. Props: `kind`, `src`, `alt`, `slug` (grain), `priority`, `vtName`.

---

## 5. Home page

Route `src/app/(site)/page.tsx` — static (`ensureStatic = 'navigation'` on the `(site)` layout), all data through `'use cache'` queries in `src/db/queries/home.ts` tagged per TECH.md §2.3. Sections below the fold get `content-visibility: auto; contain-intrinsic-size: auto 900px`. Two skip links at the top: «رفتن به محتوای اصلی» and «مستقیم به فروشگاه» (→ `/shop`).

| # | Section | Component | Chapter / time of day | Server / client |
|---|---|---|---|---|
| 1 | Cover «یکی بود، یکی نبود…» | `home/Cover.tsx` | dawn | server (CSS motion, popover) |
| 2 | Toy shelf (categories) | `home/ToyShelf.tsx` | فصل یکم · بازی | server |
| 3 | Height-mark door → room builder | `home/HeightDoor.tsx` | بازی | server + `AgeRoomVT`, `RoomTotals`, `AddToCartButton` |
| 4 | Workshop picks (featured) | `home/FeaturedShelf.tsx` | بازی | server + `AddToCartButton` |
| 5 | Mothers' questions + magazine | `home/Notebook.tsx` | فصل دوم · کشف | server |
| 6 | The workshop, sheet to room | `home/Workshop.tsx` | فصل سوم · رشد | server (CSS view timelines) |
| 7 | Name engraving | `home/NameEngraver.tsx` | رشد | server shell + `EngraverIsland` (lazy) |
| 8 | Fridge door (UGC + notes) | `home/FridgeDoor.tsx` | late afternoon | server |
| 9 | Ply layers + trust desk | `home/PlyLayers.tsx` | dusk | server |
| 10 | FAQ drawers | `home/FaqDrawers.tsx` | dusk | server |
| 11 | The End | `home/TheEnd.tsx` | night | server |

### 5.1 Cover — `Cover.tsx` (+ `CoverSheet.tsx`, `illustrations/tati/*`, `SeasonProps.tsx`)

- **Purpose:** in two seconds: "real wooden furniture for small children, made here, from real ply", and a story the visitor wants to follow. Pass the 5-second product test (the tower is visible above the fold).
- **Copy:**
  - Lettering (SVG, `aria-hidden`), engraved on the sheet: «یکی بود، یکی نبود…»
  - **H1:** `<h1><span class="block font-body text-sm font-semibold text-muted">اسباب‌بازی و وسایل چوبی مونته‌سوری، ساخت کارگاه چوبز</span><span class="block text-display swash">یه دنیای چوبی، برای بچه‌های سرزمینمون</span></h1>`
  - Sub: «برج یادگیری، مثلث پیکلر، دیوار صعود و کتابخانهٔ روبه‌رو؛ همه از تختهٔ توس، با دست و دل توی کارگاه خودمون ساخته می‌شن. الهام‌گرفته از مونته‌سوری و والدورف.»
  - CTAs: **«بریم فروشگاه»** (primary → `/shop`) · «برای سنِ بچه‌م چی خوبه؟» (secondary → `#height-door`)
  - Trust chips (flat text chips with icons, above the fold): «۴ قسط با اسنپ‌پی» (→ `/installments`) · «ارسال به سراسر ایران» (→ `/shipping`) · «نماد اعتماد الکترونیکی» (→ `/trust`) · «۵۰ هزار همراه در اینستاگرام» ⚑ (dated, from `settings.socials.followers`)
  - Scene caption (truth layer, under the scene): «در تصویر: برج یادگیری مونته‌سوری · از ۹٬۸۰۰٬۰۰۰ تومان ←» (→ PDP)
  - Sheet hotspot tags (desktop hover/focus mint bubble; mobile: engraved label always visible): «این برش، آرک پیکلره!» · «اینم مثلث پیکلر!» · «اردک چرخ‌دار هم از همین ورقه» · «کتابخانهٔ روبه‌رو اینجاست»
  - Tati greeting popover (one line from `settings.tati_captions`): «سلام! من تاتی‌ام. هرجا قدم برداری، دنبالت میام.» Name tag «تاتی» (kashida pull on open).
  - Yalda: chip «کادوی شب یلدا ←» above the trust chips.
- **Layout — mobile (390 × 844):** header 56 · **scene first**, full-bleed 4:3 (≈ 390 × 292): kahgel wall, sheet (92% width, `rounded-bit-xl`, ply edge at the bottom/inline-end), Orosi light falling from the upper right, tower standing in front at inline-end of centre, Tati at its foot (inline-start side), floor strip with contact shadows · then H1 (kicker line + 2 display lines ≈ 130 px), sub (3 lines), two equal CTAs side by side (48 px), trust chips row (scrolls horizontally inside its row). Everything through the CTAs fits above the 780 px line (844 − dock).
- **Layout — desktop (≥ 1024):** open-book spread, `max-w-wide`: right page (start) = H1, sub, CTAs, chips; left page = the scene (sheet bleeds off the inline-end edge); centre gutter shadow + dashed anar binding stitch. Light falls from the top-left corner of the left page across the scene.
- **Motion** (`motion-ok` + `@supports`; default = final frame):
  1. First paint: everything in place except tower parts (`opacity: 0; translate: 0 -28px` only inside the motion gate).
  2. Parts settle: `animation: part-settle var(--dur-scene) var(--ease-settle) both; animation-delay: calc(250ms + var(--i) * var(--stagger))` (6–8 parts, done by ≈ 1.3 s).
  3. Tati blinks (`animate-blink` on the eye wrapper).
  4. On scroll: the light layer drifts (`translate: -4% 6%`, `opacity .85 → .6`) on `view()` exit range — ambient only.
  5. Tati hop (cover exit 35–60%): scene Tati lifts 30 px and fades; the thread rider drops in (§9.4).
  6. Hotspot tag: mint bubble fades/rises 6 px on `:hover`/`:focus-visible` (`@starting-style`, 160 ms).
  Reduced motion / `data-lite`: static standing frame, no light drift; on home the rider stays hidden.
- **Data:** `getCover()` → `settings.hero` (`{ productSlug: "learning-tower", nested: [{ slug, label, tag }…], ctaPrimary, ctaSecondary }`), `settings.season`, `settings.trust`, `settings.tati_captions`, `settings.socials.followers`, and the hero product (`name`, `slug`, `price`) — tags `site`, `settings`, `product:{id}`.
- **Client vs server:** server only. No JS. Inline SVG budget ≤ 10 KB raw (sheet + tower parts + Tati).

### 5.2 Toy shelf — `ToyShelf.tsx`

- **Purpose:** one-tap category navigation, all visible at once (no hidden carousel).
- **Copy:** kicker «فصل یکم · بازی» (`aria-hidden`) · **H2** «قفسهٔ بازی؛ همهٔ وسایل چوبی، سرِ جای خودشون» (swash, ply-type) · sub «توی مونته‌سوری هر وسیله یه جای مشخص داره. قفسه رو بگرد و دنیای بازیِ بچه‌ت رو انتخاب کن.» · cubby labels = `categories.name` + count («برج یادگیری · ۱ مدل») · link «همهٔ محصولات ←» (`/shop`).
- **Layout:** one low Montessori shelf drawn in plywood (the product itself). Mobile: 2 × 3 grid of cubbies (all six categories visible), the ply-band shelf lip continuous under each row. Desktop: one row of 6 cubbies (3 × 2 at `md`), a pencil sprout on top of the shelf. `<nav aria-label="دسته‌بندی‌ها">` with descriptive links.
- **Motion:** as each cubby enters, its drawing drops 12 px into place with the settle spring and a 1° wobble (`animation-timeline: view(); animation-range: entry 10% cover 30%`). Press: the label plate presses 2 px.
- **Data:** `listShelfCategories()` → `categories` (`name`, `slug`, `illustration`, `accent`, `sortOrder`) + count of published products; links `/shop/{slug}`.
- **Client vs server:** server.

### 5.3 Height-mark door → room builder — `HeightDoor.tsx` (+ `DoorScene.tsx`, `AgeRoomVT.tsx`, shared `shop/RoomBuilder.tsx`, `shop/RoomTotals.tsx`)

- **Purpose:** answer the audience's number-one question («برای سنِ بچه‌م چی خوبه؟») and turn it into a priced room with installments. `id="height-door"`.
- **Copy:**
  - **H2** «بچه‌ت چند وقتشه؟ اتاقش رو با هم بچینیم»
  - Sub «سن رو انتخاب کن؛ اتاق خودش عوض می‌شه و وسایلی که برای همین روزهای رشدش ساخته شدن، سرِ جاشون می‌شینن.»
  - Chips (fieldset legend «سن کودک»): «۰ تا ۶ ماه» · «۶ تا ۱۲ ماه» · «۱ تا ۲ سال» · «۲ تا ۳ سال» · «۳ تا ۶ سال»
  - Door marks (Mikhak pencil, «میانگین» ⚑ WHO): «۶ ماهگی · ۶۷ سانت» · «۱ سالگی · ۷۵ سانت» · «۲ سالگی · ۸۷ سانت» · «۳ سالگی · ۹۶ سانت» · «۶ سالگی · ۱۱۶ سانت»
  - Milestones (reviewed by the named expert before launch ⚑):
    - ۰ تا ۶ ماه: «دنیا رو از پایین نگاه می‌کنه؛ قفسهٔ کوتاه، کتاب‌های روبه‌رو و چند اسباب‌بازیِ ساده کافیه.»
    - ۶ تا ۱۲ ماه: «وقتِ بالا کشیدن و ایستادنه؛ مثلث پیکلر بهترین رفیقشه.»
    - ۱ تا ۲ سال: «می‌خواد کمکت کنه! برج یادگیری می‌برتش کنار کابینت آشپزخونه.»
    - ۲ تا ۳ سال: «کتابش رو خودش انتخاب می‌کنه؛ کتابخانهٔ روبه‌رو جلدها رو نشونش می‌ده.»
    - ۳ تا ۶ سال: «انرژی‌ش تمومی نداره؛ دیوار صعود، میزِ خودش و رول نقاشیِ خودش.»
  - Room panel H3 = preset name («اتاقِ ۱ تا ۲ سالگی») · helper «تکه‌ها رو بردار یا نگه دار؛ جمع و قسط‌ها همین‌جا حساب می‌شه.» · summary «۵ تکه · جمع: ۳۵٬۰۰۰٬۰۰۰ تومان» · wheels line «یا ۴ قسط ۸٬۷۵۰٬۰۰۰ تومانی، به تعداد ۴ چرخِ تاتی» · fine print «طبق شرایط اسنپ‌پی»
  - Actions: **«همه را به سبد اضافه کن»** (primary) · «این چیدمان را ببین ←» (`/rooms/{preset}`) · «اتاق کوچکه؟ چیدمان ۹ متری ←» · «همهٔ وسایل و راهنماهای ۱ تا ۲ سالگی ←» (hub anchor) · `AskChoobz` compact: «مشاورهٔ رایگانِ چیدمان در بله»
- **Layout — mobile:** scene first (4:3, kahgel wall, doorframe at inline-start, peg doll by the frame, room to inline-end, kitchen counter through the doorway) → chip rail in the thumb zone (5 hex chips, horizontally scrollable if needed, 56 × 44 each) → milestone line → room panel: a `tray` with piece rows (thumb · name · price · toggle «توی اتاق») → summary bar `sticky bottom-[calc(var(--spacing-dock)+env(safe-area-inset-bottom))]` **within the section** (wood face, total `tabular-nums`, wheels) → actions. Not pinned, no scroll trap.
- **Layout — desktop:** open-book spread: right page = sticky door-and-room scene (section ≤ 140vh); left page = chips, milestone, room panel, summary, actions.
- **Motion:** chips are radios; `:has(#age-1-2y:checked) [data-stage~="1-2y"]` shows that room's layers (opacity/scale) and sets `--child-cm` on the peg doll (`scale` from the floor, composited). With `AgeRoomVT`: `document.startViewTransition({ update, types: ['room'] })` (function form fallback) — pieces present in both rooms morph position; new pieces rise from the floor on the settle spring; removed pieces sink and fade; the new pencil mark does the kashida pull (`kashida-pull`, 620 ms, `contain: layout`). The island sets `view-transition-name` on pieces only between `startViewTransition` and `finished`, so page navigations never snapshot them. Toggling a piece fades it in the scene (CSS `:has` on the checkbox) and `RoomTotals` recomputes total + wheels (wheels quarter-spin). Reduced motion: instant swap.
- **`?age=`:** `history.replaceState` on change; a 120-byte inline script after the fieldset checks the matching radio before first paint. `age` is a disallowed facet param (SEO.md §5.2); canonical stays `/`.
- **Accessibility:** scene `aria-hidden`; the server-rendered panel (milestone + piece list + totals) is the accessible content; chips are a real radio group with arrow keys; the summary has `aria-live="polite"`.
- **Data:** `getAgeRooms()` → `settings.age_stages` (5 entries: key, label, months, medianCm ⚑, mark, milestone, hubHref, roomPreset) + `room_presets` + `room_preset_items` + products (`name`, `slug`, `price`, `illustration`, `availability`); all five rooms pre-rendered (≈ 1.5 KB gz). Seed presets (prices from `products.json`, ⚑ confirm with the workshop):

| Preset slug | Name | Pieces | Total (Toman) |
|---|---|---|---|
| `first-months` | اتاقِ ۰ تا ۶ ماهگی | montessori-shelf, front-facing-bookshelf | ۱۰٬۸۰۰٬۰۰۰ |
| `crawl-and-climb` | اتاقِ ۶ تا ۱۲ ماهگی | pikler-triangle, montessori-shelf, front-facing-bookshelf | ۲۳٬۷۰۰٬۰۰۰ |
| `toddler-1-2` | اتاقِ ۱ تا ۲ سالگی | learning-tower, pikler-triangle, front-facing-bookshelf, duck-pull-toy, rainbow-stacker | ۳۰٬۶۰۰٬۰۰۰ |
| `toddler-2-3` | اتاقِ ۲ تا ۳ سالگی | learning-tower, pikler-arch, kids-table-chair, front-facing-bookshelf, wall-art-roll | ۳۵٬۰۰۰٬۰۰۰ |
| `preschool-3-6` | اتاقِ ۳ تا ۶ سالگی | swedish-ladder, climbing-hex-panels, kids-table-chair, wall-art-roll, balance-board | ۳۸٬۲۰۰٬۰۰۰ |
| `small-room-9m` | اتاق کوچک ۹ متری | pikler-triangle (folds to 12 cm), front-facing-bookshelf, wall-art-roll, montessori-shelf | ۲۸٬۳۰۰٬۰۰۰ |

- **Client vs server:** server markup; `AgeRoomVT` (0.5 KB, near viewport), `RoomTotals` (1.2 KB, near viewport; enables toggles that are `disabled` in SSR), `AddToCartButton` (add all).

### 5.4 Workshop picks — `FeaturedShelf.tsx`

- **Purpose:** a short, scannable set of best starting points.
- **Copy:** **H2** «پیشنهادهای کارگاه» · sub «اگه نمی‌دونی از کجا شروع کنی، از همین‌ها شروع کن.» · link «همهٔ محصولات ←». (Switch the H2 to «محبوب‌ترین‌های خونه‌ها» only when `featured` is driven by real sales/UGC data.)
- **Layout:** front-facing wall shelf: mobile 2-column grid of 6 ProductCards (3 rows), a `ply-band` shelf lip under each row; desktop 4 × 2. Seasonal picks carry «پیشنهاد یلدا».
- **Motion:** cards rise 8 px + fade on first view (stagger 40 ms, max 6; `view()`); hover per §4.11.
- **Data:** `listFeaturedProducts(8)` → `products` where `featured = 1 AND status = 'published'` order `sortOrder` (+ cheapest variant price, swatches, `installments()`).
- **Client vs server:** server + `AddToCartButton` leaves.

### 5.5 Mothers' questions + magazine — `Notebook.tsx`

- **Purpose:** AEO showcase and the path into «مجله چوبز».
- **Copy:** kicker «فصل دوم · کشف» · **H2** «سؤال‌هایی که مامان‌ها هر روز از ما می‌پرسن» (swash) · three mint bubbles: summary = the post's question title («برج یادگیری چیست و از چند سالگی مناسب است؟»، «مثلث پیکلر از چند ماهگی مناسب است؟»، «مونته‌سوری در خانه را از کجا شروع کنیم؟»), body = the post's first TL;DR bullet + «جواب کامل در مجله ←» · sub-block H3 «تازه‌های مجله چوبز» · one pillar (large ArticleCard) + 3 latest · age strip «سن به سن: ۰ تا ۱۲ ماه · ۱ تا ۳ سال · ۳ تا ۶ سال» · link «همهٔ مطالب مجله ←».
- **Layout:** mobile: bubbles stacked (staggered inline offsets like a conversation), then the pillar card, then 3 cards in a column, then the age strip as hex chips. Desktop: bubbles on the right page, notebook (kraft cover with elastic band holding the pillar + 3 cards) on the left.
- **Motion:** each bubble pops (scale .96 → 1, settle) on entry; `<details>` opens with `interpolate-size: allow-keywords` + `::details-content` where supported (instant elsewhere); the sprout marker grows.
- **Data:** `getNotebook()` → `posts` where `featured` (3, with `tldr[0]`), one `isPillar` post, latest 3 published, `topics`, `authors`; links `/mag/{slug}`, `/age/*`. **No FAQPage** here (teasers; canonical answers carry their own markup).
- **Client vs server:** server.

### 5.6 The workshop — `Workshop.tsx` (+ `LiveStrip.tsx`)

- **Purpose:** trust through process, and the brand's defining sentence on the home page (SEO.md §8.2).
- **Copy:** kicker «فصل سوم · رشد» · **H2** «از ورق تا اتاقِ بچه‌ت: یه سر به کارگاه چوبز بزن» (swash) · intro (= `Organization.description`): «چوبز کیدز سازندهٔ اسباب‌بازی و سیسمونی چوبی کودک با الهام از مونته‌سوری و والدورف است؛ همهٔ محصولات در کارگاه خود چوبز از تخته چندلایی توس ساخته می‌شوند.» · steps (H3 + one sentence each, ⚑ verify every claim):
  1. «انتخاب تختهٔ چندلایی توس» — «فقط ورق‌های یکدست، بی‌ترک و بی‌گره.»
  2. «برش دقیق با CNC» — «مسیر برش از روی نقشهٔ هر قطعه، تا دهم میلی‌متر.»
  3. «سنباده، تا نرمیِ دستِ بچه» — «هیچ لبه‌ای تیز نمی‌مونه.»
  4. «روکش ایمنِ پایه‌آب» — «مناسب وسایل کودک؛ حتی اگه سر از دهن کوچولو دربیاره.»
  5. «مُهر کارگاه و بسته‌بندی با حوصله» — «هر محصول با مُهر و شمارهٔ ساخت از کارگاه بیرون می‌ره.»
  Stamp (anar, −6°): «ساخت کارگاه چوبز · سری ۱۴۰۵-۰۷» ⚑ · optional founder quote ⚑ «هر وسیله رو اول برای بچه‌های خودمون ساختیم.» · live strip «امروز در کارگاه: ۱۲ برج یادگیری زیر سنباده‌اند · زمان آماده‌سازی سفارش‌های امروز: ۷ روز کاری» · link «داستان کامل کارگاه ←» (`/workshop`).
- **Layout:** a sticky stage (mobile: top, max 46svh; desktop: right page) while five step cards scroll past (vertical, never a horizontal pinned track; section ≤ 160vh on mobile). Under `data-lite`: no sticky, stage shown once in its final frame above the list.
- **Motion** (each step card has a `view-timeline`; `timeline-scope` on the section; all transforms on HTML wrappers): (1) a grain layer fades in · (2) toolpath revealed by a cover plate translating along x (wipe reveal, composited) · (3) jagged-edge layer crossfades to the smooth-edge layer + 6 sawdust motes (translate/opacity) · (4) a sheen band (`linear-gradient` div) translates across; a darker overlay's opacity deepens the wood one shade · (5) the duck stamp presses (`scale 1.25 → 1` + opacity) and the burnt batch mark appears. Fallback: final stamped frame.
- **Live strip rule:** render only if the newest `workshop_log` entry is < 72 h old at render time (`getWorkshopStory()` uses `cacheLife('hours')`), and emit `data-expires="{createdAt+72h ISO}"`; a 100-byte inline script removes the strip on the client once expired. Never a stale "live" claim.
- **Data:** `getWorkshopStory()` → `pages` slug `workshop` (the five steps are its H3s) or `settings.workshopSteps`, `workshop_log` (latest), `media` (Phase 2 photos/video).
- **Client vs server:** server + inline expiry script.

### 5.7 Name engraving — `NameEngraver.tsx` (+ `EngraverIsland.tsx`, `StoryCard.ts`)

- **Purpose:** the viral and revenue moment.
- **Copy:** kicker «حالا نوبت شماست» · **H2** «اسمش رو روی چوب حک کن» · sub «اسم کوچولوت رو بنویس و ببین لیزرِ کارگاه چطور، از راست به چپ، روی پلهٔ برج یادگیری حکش می‌کنه.» · label «اسم کوچولوت چیه؟» · placeholder «مثلاً آیلین» · error «اسم حداکثر ۱۴ حرف جا می‌شه.» · buttons «ذخیره برای استوری» (secondary) and «سفارش با حک اسم · ۲۹۰٬۰۰۰ تومان» ⚑ (primary) · note «این اسم فقط روی گوشی خودت می‌مونه.» · story card text «تاتیِ آیلین، آمادهٔ اولین قدم‌ها» + `@choobz.kids` + `choobz.kids`.
- **Layout:** mobile: the step plate (ortho front of the tower's top step from the manifest, birch with grain, 16:5) full width, input below in a tray, buttons stacked. Desktop: plate on the right page, form on the left.
- **Motion:** see §1.3 (3). Engraving takes 1.2–1.6 s, plays once per typed pause (600 ms debounce), never on every keystroke; reduced motion: the name appears charred instantly.
- **Data:** `settings.engraving` (`{ enabled, priceToman, maxChars: 14, productSlugs: ["learning-tower"] }` ⚑) and `product_addons`. If `enabled = false`, the order button is replaced by «حک اسم روی سفارش به‌زودی» (quiet).
- **No JS:** the input is `<form method="get" action="/product/learning-tower">` with `name="engrave"` (disallowed param; canonical clean).
- **Client vs server:** server shell; `EngraverIsland` on first focus/pointerenter; `StoryCard` on tap (`navigator.share({ files })`, fallback download link).

### 5.8 Fridge door — `FridgeDoor.tsx`

- **Purpose:** social proof in the brand's own Instagram language («عکساتون»، «رضایت شما»), without fake content.
- **Copy:** kicker «از خونه‌های شما» · **H2** «عکساتون، دلگرمیِ ما» · sub «عکس بچه‌ها با وسایل چوبز رو با هشتگ #چوبز_کیدز یا توی کانال بله برامون بفرستید؛ شاید قابِ بعدیِ این یخچال مال شما باشه.» · placard pattern «اثر: آیلین، ۲ ساله · شیراز · با برج یادگیری» (child's first name in Mikhak, rest Estedad; consent required) · empty frame «این قاب، منتظرِ شماست.» · note signature «سارا · اصفهان · مامانِ یه پسر ۲ ساله» · links «همهٔ عکس‌های شما ←» (`/gallery`), «رضایت شما ←» (`/reviews`).
- **Layout:** a cream fridge door (SVG panel) with fruit magnets (pomegranate, pistachio, quince) holding polaroids (6 px shir frame) and sticky-note testimonials (Mikhak body `text-lead`, Estedad signature). Mobile: one horizontal snap row of polaroids, then a stack of 3 notes. Desktop: collage on the right page, notes on the left. The empty frame is always the last polaroid.
- **Motion:** polaroids tilt ±3° (seeded by id on the server) and settle on entry; on hover/focus a polaroid straightens and lifts.
- **Data:** `getFridgeDoor()` → `community_photos` where `consentAt IS NOT NULL` (+ `media`, `productId`) and `reviews` where `featured AND status = 'approved' AND consentAt IS NOT NULL`. Production excludes `isSample`; non-production shows samples with «نمونه». Zero real photos → illustrated peg-doll frames labelled «جای عکس شما» + the empty frame (never invented families). **No Review markup** (SEO.md §3.5.10).
- **Client vs server:** server.

### 5.9 Ply layers + trust desk — `PlyLayers.tsx`

- **Purpose:** why wood, and every pre-purchase reassurance in one calm place (eNamad visible on home, SEO.md §8.2).
- **Copy:** kicker «چرا چوب؟» · **H2** «لایه به لایه، با خیال راحت» · sub «تخته‌چندلا رو باز کردیم تا ببینی درونش چیه؛ و هر چیزی که برای یه خریدِ مطمئن لازم داری، همین‌جاست.» · layers (each → a verified field or page ⚑): «لبه‌های گرد؛ بدون هیچ گوشهٔ تیز» · «روکش پایه‌آبِ مناسب کودک» · «بدون قطعهٔ ریزِ جداشدنی» · «محکم؛ تست‌شده با چند برابرِ وزن بچه» · «ساخت ایران؛ قابل تعمیر و ماندگار برای بچهٔ بعدی» · trust tiles: «ارسال به سراسر ایران · ۲ تا ۵ روز کاری» ⚑ · «۷ روز ضمانت بازگشت» ⚑ · «۴ قسط با اسنپ‌پی» · «نماد اعتماد الکترونیکی» (badge + «روی نماد بزنید تا اطلاعات ثبت‌شدهٔ چوبز رو ببینید») · AskChoobz compact.
- **Layout:** a giant plywood cross-section (5 HTML bands in the ply palette, each with its label at inline-start), then a 2 × 2 (mobile) / 4-across (desktop) grid of flat trust tiles.
- **Motion:** bands slide 8 px apart toward inline-start as the section passes (`animation-range: contain 10% contain 60%`), rejoin as it leaves; reduced motion: static exploded state.
- **Data:** `getTrustDesk()` → `settings.safety_points` (`[{ title, body, href }]`), `settings.shippingPolicy`, `settings.returnPolicy`, `settings.snapppay`, `settings.enamad`; links `/safety`, `/shipping`, `/returns`, `/installments`, `/trust`, `/mag/wooden-toy-safety-guide`.
- **Client vs server:** server (eNamad plain `<img loading="lazy">` in a fixed box).

### 5.10 FAQ drawers — `FaqDrawers.tsx`

- **Copy:** **H2** «پرسش‌های پرتکرار» · 6 questions from `faqs` (`scope IN ('general','shipping')`, `featured`) · link «همهٔ پرسش‌ها ←» (`/faq`).
- **Layout:** `<details name="faq">` exclusive accordion styled as cabinet drawers: each `<summary>` is a drawer front with a round wooden knob at inline-end; open = the drawer slides out 8 px with a deeper shadow, the answer on paper inside. First item open. Mobile full width, desktop two columns.
- **Motion:** height via `interpolate-size` + `::details-content` (progressive).
- **Data:** `listHomeFaqs(6)`. Visible only — **no FAQPage on home**.
- **Client vs server:** server.

### 5.11 The End — `TheEnd.tsx`

- **Copy:** lettering «قصهٔ ما به سر رسید…» (`aria-hidden`) · **H2** `…ولی اردکه به خونه‌تون <span class="kashida">رسید</span>!` (Ario + one Mikhak word; text content stays clean) · sub «به خانوادهٔ چوبز بپیوندید: قصه‌های تازه، پیشنهادهای ویژه قبل از همه، و عکس‌های شما.» · CTAs **«عضویت در کانال بله»** (primary) · «اینستاگرام ‎@choobz.kids‎» (secondary).
- **Layout:** the section background fades from `bg` to `shab` (gradient band 240 px), then night: the lit tower-house at centre, Tati (sleeping/arrived pose, 96 px) at its door, the thread ending in a bow, paper stars; centred text. Flows straight into the footer's endpaper band.
- **Motion:** stars twinkle (3 periods); as the house enters (`view()` entry 20–60%) the window light fades up and «رسید» does the kashida pull once; the header rider fades out on this section's view timeline (§9.4) so there is never a second Tati.
- **Data:** `settings.socials` (`bale`, `instagram`). CTAs hide individually when a URL is null. No embeds.
- **Client vs server:** server.

---

## 6. Shop

### 6.1 `/shop` — all products (`src/app/(site)/shop/page.tsx`)

- **Header «ویترین» (`shop/ShopWindow.tsx`):** kahgel arch "shop window" with breadcrumb, **H1** «فروشگاه وسایل چوبی کودک», count «۱۴ محصول», intro ≤ 120 words answering «چه وسایلی؟ برای چه سنی؟ از چه جنسی؟» (`pages` slug `shop` or `settings.shopIntro`).
- **Category rail (`shop/CategoryRail.tsx`):** six mini cubbies as real links to `/shop/{category}` (indexable pages; there is no category param).
- **Filter bar (`shop/FilterBar.tsx`, client, ≈ 3 KB, hydrates on idle; reserved height so no CLS):**
  - Mobile: sticky rail under the header: «فیلترها (۲)» (opens `Sheet`) + quick age `HexChip`s + sort.
  - Desktop: sticky sidebar at inline-start (right), 280 px.
  - Facets (SEO.md §1.9 param names, values in Latin): **سن** `age` (`0-6`, `6-12`, `12-24`, `24-36`, `36-72` months; multi) · **مهارت** `skill` (the 10 `SkillKey`s with icons and Persian labels: حرکتی درشت، حرکتی ظریف، تعادل، استقلال، زندگی روزمره، خلاقیت، زبان، تخیل، تمرکز، اعتمادبه‌نفس) · **قیمت** `price` presets («زیر ۳ میلیون» `0-3000000`, «۳ تا ۸ میلیون» `3000000-8000000`, «بالای ۸ میلیون» `8000000-`) · **«فقط آمادهٔ ارسال»** `in_stock=1` · **ترتیب** `sort` («پیشنهاد چوبز» default · «جدیدترین» `new` · «ارزان‌ترین» `price-asc` · «گران‌ترین» `price-desc`).
  - Mechanics: every card carries `data-age-min/max`, `data-skills`, `data-price`, `data-avail`, `data-order`, `data-published`. Filtering toggles `hidden` inside `startTransition`; sorting sets `style.order` (no DOM moves); empty category groups hide; result count «۱۲ محصول» is `aria-live`; state mirrors to the URL with `history.replaceState` and is re-applied on load. Buttons only, never `<a>` (SEO.md §1.9). When exactly one age is selected, a link appears: «راهنمای کامل ۱ تا ۳ سال ←» (hub).
  - Without JS: the bar's controls are `disabled`; the full list is visible.
- **Grid (`shop/ProductGrid.tsx`):** grouped by category (H2 per category name + «همه ←» link to the category page). 2 columns mobile (12 px gap), 3 at `md`, 4 at `xl`. **Every 8th slot** (default view only; hidden when filters are active) is an `EditorialInterlude` spanning 2 columns: a pillar guide or room card («راهنمای انتخاب برج یادگیری · ۵ دقیقه ←»).
- **Empty filter state:** an empty-cubby drawing + «با این فیلترها چیزی پیدا نکردیم.» + «پاک‌کردن فیلترها».
- **SEO:** `CollectionPage` + url-only `ItemList`, canonical `/shop`, not paginated (≤ 48 products).
- **LCP:** H1 text.

### 6.2 `/shop/{category}` (`src/app/(site)/shop/[category]/page.tsx`)

Same template, plus:
- H1 = `categories.seoTitle ?? name` (e.g. «بازی حرکتی و صعود»), `tagline` as the lead, the category drawing in the shop-window arch (`name={`category-${slug}`}` morph from the cubby).
- Intro = `categories.description` (Markdown, 120–250 words): first paragraph visible, the rest in `<details>` «بیشتر بخوانید» (in the DOM).
- **Pillar link above the grid:** «راهنمای انتخاب: … ←» (category ↔ pillar link both ways).
- Below the grid: buying-guide excerpt, category FAQ (`faqs` scope `category`, visible; markup per SEO.md, i.e. none), related glossary chips, `AskChoobz`.
- Empty category → `notFound()` (real 404).

### 6.3 Product detail page — `/product/{slug}` (`src/app/(site)/product/[slug]/page.tsx`)

**Mobile order (desktop: gallery sticky on the start/right side across 7 columns, info column 5 columns at inline-end; items 11 → 22 run full width below):**

1. **Breadcrumbs** — «خانه ● فروشگاه ● {category} ● {product}».
2. **Gallery «میز کار» (`shop/ProductGallery.tsx` + `ManifestStage.tsx`, `GallerySync.tsx`, `ZoomDialog.tsx`).** 4:5 Stage, CSS scroll-snap slides, no carousel library:
   - Slide 1: `ManifestStage` — the layered manifest render with a two-option toggle «نمای کامل / نمای انفجاری» (radios; parts translate apart on the settle spring, dashed dowel lines fade in; composited). Label at the stage foot: «طرح دقیق از روی نقشهٔ برش» (`source = "dxf"`) or «طرح از روی ابعاد واقعی».
   - Slide 2: «ابعاد» — ortho drawing on a blueprint grid (firuzeh lines on kahgel), HTML dimension labels in Persian digits.
   - Slide 3: «در خانه» — room vignette with a peg doll (or real photos/UGC when they exist).
   - Slides 4+: photos from `product_media`. **When a cutout or photo exists it becomes slide 1** (the LCP image) and the drawings become truth slides.
   - Tabs under the stage are anchor links (`#slide-n`) with `aria-current`; `GallerySync` (1 KB, idle) tracks the active slide. Tap on a photo opens `ZoomDialog` (2 KB, on tap, native pinch-zoom). `<ViewTransition name={`product-${id}`} share="morph" default="none">` on slide 1.
3. **Title block:** **H1** = canonical Persian product name («برج یادگیری مونته‌سوری»), `subtitle` as tagline, rating only with ≥ 3 approved real reviews, `AgeBadge` («۱٫۵ تا ۵ سال» → age hub), skill chips.
4. **Summary:** `products.summary` (answer-first, 1–2 sentences).
5. **Price block (`shop/PriceBlock.tsx`):** Price + compare-at + discount stamp; `InstallmentWheels`; fine print.
6. **«شناسنامهٔ این محصول» (`shop/Shenasnameh.tsx`)** — this *is* SEO.md §4.7's «در یک نگاه» `<dl>`, styled as a kraft birth certificate with a burnt duck stamp: مناسب برای سن (→ hub) · ابعاد (W × D × H + key extras) · حداکثر وزن قابل تحمل · جنس و روکش (→ `/safety`) · زمان آماده‌سازی و ارسال · ضمانت (→ `/warranty`) · پرداخت («یا ۴ قسط …» → `/installments`) · ساخت («کارگاه چوبز، [شهر]» ⚑ → `/workshop`) · optional «شمارهٔ سری: حک‌شده زیر سکو» ⚑. Compact two-column grid of icon + label + value (≈ 200 px tall on mobile). Flat paper (not tappable), so no ply edge.
7. **Variants (`shop/VariantPicker.tsx`):** wood-chip swatch radios (natural / white / painted, from `product_variants.swatch`), size pills. Price and availability swap with `:has()` between server-rendered values (a per-page inline `<style>` with one rule per variant); the inline stage recolours through CSS variables (`--wood` etc.). `?color=` preselects before paint (inline script) and is mirrored with `replaceState`; canonical stays clean.
8. **Add-ons:** «حک اسم کوچولو (+۲۹۰٬۰۰۰ تومان)» ⚑ toggle → opens the engraver inline on slide 1's top step (`EngraverIsland`, same component as home); `engrave` param prefills it. Accessories from `product_relations` (e.g. «+ رمپ»).
9. **Availability (`shop/AvailabilityLine.tsx`):** «موجود · ارسال ۲ تا ۵ روز کاری» ⚑ or «ساخته می‌شه برای شما — آماده در ۱۴ روز کاری» (`made_to_order`, `leadTimeDays`) or «پیش‌سفارش».
10. **CTAs:** **«افزودن به سبد»** (primary `lg`, full width) + «سؤال داری؟ قبل از خرید در بله بپرس» (consult). Then **TrustRow** (`shop/TrustRow.tsx`): «ارسال به سراسر ایران» · «۷ روز ضمانت بازگشت» ⚑ · «۴ قسط با اسنپ‌پی» · eNamad mini (lazy, fixed box) — each links to its policy page.
11. **«با قدِ بچه‌ت مقایسه کن» (`shop/ScaleCompare.tsx` + `HeightInputs.tsx`):** ortho front drawing + peg doll; age radios «۱ سال · ۷۵» «۱٫۵ سال · ۸۲» «۲ سال · ۸۷» «۳ سال · ۹۶» «۴ سال · ۱۰۳» (WHO ⚑, source line) set `--child-cm` via `:has()` (zero JS); default = the product's minimum age. `HeightInputs` (0.8 KB, on first focus) adds «قد بچهٔ خودم (سانتی‌متر)» and, for the learning tower, «ارتفاع کابینت شما» (default ۹۰). Result sentence (formula ⚑ to verify with the workshop and an OT): «برای قد ۸۷ سانت و کابینت ۹۰ سانتی، سکو رو روی پلهٔ وسط (۳۸ سانت) بذارید.» Values never leave the device. Then «کفِ لازم: ۴۵ × ۴۵ سانتی‌متر» (from `dimensions`, plus ramp length for the triangle).
12. **«چرا عاشقش می‌شن»:** `highlights` as three tiles with skill icons.
13. **«دربارهٔ این وسیله»:** `description` Markdown (Prose renderer, internal link schemes).
14. **«جنس و ایمنی» (`shop/MaterialSafety.tsx`):** ply-edge macro illustration with labelled layers (`material`, `finish`, `specs`), a sprout-check list (`maxLoadKg`, finish, no small parts ⚑), `safetyNotes` as a «نکتهٔ ایمنی» callout, `careNotes`, warranty line.
15. **«توی جعبه چی هست؟» (`shop/InTheBox.tsx`):** `inTheBox` list beside a small exploded image, «زمان نصب: حدود ۲۰ دقیقه» (`assemblyMinutes` ⚑), link to the howto guide when one exists.
16. **«مشخصات کامل» (`shop/SpecsTable.tsx`):** `specs` + dimensions + weight + **«قیمت به ریال: ۹۸٬۰۰۰٬۰۰۰ ریال»** (SEO.md §2.7) in a real `<table>`.
17. **«پرسش‌های این محصول» (`shop/ProductFaq.tsx`):** `faqs` scope `product`, `<details>`, first open, `FAQPage`.
18. **«نظر خانواده‌ها» (`shop/ReviewsList.tsx`):** approved reviews (child age, city, «خرید تأییدشده» stamp), consented UGC polaroids of this product; samples only outside production. AggregateRating only with ≥ 3 real reviews.
19. **«قبل از خرید بخوانید» (`shop/RelatedGuides.tsx`):** the category pillar + 2 posts (`post_products` reversed), ArticleCards.
20. **«اتاقش رو کامل کن» (`shop/CompleteTheRoom.tsx`):** room presets containing this product (RoomCard with total and installments) + `product_relations.kind = 'bundle'`.
21. **«شاید این‌ها هم» (`shop/RelatedProducts.tsx`):** `kind = 'related'` row.
22. **Buy bar (mobile, `shop/BuyBar.tsx`)** — the dock's second face (§4.2), driven by the price block's view timeline.

**Title template** per SEO.md §2.3 («{name} {qualifier}؛ قیمت و خرید | چوبز کیدز»); installments go in the meta description. **LCP:** H1 text while the stage is a drawing; the first cutout/photo (`next/image`, `fetchPriority="high"`, `loading="eager"`, AVIF ≤ 60 KB at 828w) once it exists.

### 6.4 Rooms — `/rooms`, `/rooms/{preset}` (`src/app/(site)/rooms/…`)

- `/rooms`: H1 «چیدمان آمادهٔ اتاق مونته‌سوری، سن به سن», intro, RoomCards for the six presets.
- `/rooms/{preset}`: breadcrumb (خانه › اتاق‌ها › {name}), **H1** e.g. «چیدمان اتاق مونته‌سوری ۲ تا ۳ سال؛ قیمت کامل و خرید قسطی», the room scene (`shop/RoomScene.tsx`) with the editable piece list, total, wheels and «همه را به سبد اضافه کن» (`shop/RoomBuilder.tsx` — the same component as the home door panel), 300–500 words of unique editorial (`room_presets.description`, Markdown), a dashed 70 cm «خط دید کودک» on the scene to teach the Montessori eye line, the 9 m² footprint plan on `small-room-9m`, room FAQ (`faqs` scope `room`), `AskChoobz` «مشاورهٔ رایگانِ چیدمان در بله». `CollectionPage` + url-only `ItemList`. Each preset has its own `primaryQuery` (no overlap with `/product/montessori-room-set` «پک اتاق مونته‌سوری» or `/mag/montessori-room-setup`, which is informational).

### 6.5 Cart

See §4.7 (drawer, store, `/cart` stub, `/api/cart/quote`).

---

## 7. Content hub — «مجله چوبز»

All components live in `src/components/mag/`. Bodies render from Markdown via `Prose.tsx` (remark + directives inside `'use cache'`, server-only, per CONTENT-FORMAT.md). Every page: one H1, breadcrumbs, author-defined ASCII heading anchors (SEO.md §4.4), all meaning in the initial HTML.

### 7.1 Hub — `/mag`

| Block | Component | Notes |
|---|---|---|
| Masthead | `MagHero.tsx` | H1 «مجله چوبز: بازی، رشد و اتاق کودک» on a kraft notebook cover with an elastic band and a pencil; sub; a big question box «سؤالت رو بپرس… مثلاً: برج یادگیری از چند سالگی؟» (GET `/search`) |
| «سؤال امروز» | `QuestionOfDay.tsx` | one large mint bubble (question + TL;DR[0] + link); rotated by day inside a `cacheLife('days')` query |
| Age tabs | `AgeTabs.tsx` | three hex tabs in the age tints sticking out of the notebook edge → `/age/*`; sticky rail on mobile |
| Pillar shelf | `PillarShelf.tsx` | nine pillar guides as notebooks on a shelf, each in its topic's accent tint, stamp «راهنمای کامل» |
| Topic rows | `TopicRow.tsx` | per topic: 3 ArticleCards + «همه ←» to `/mag/topic/{topic}` |
| Latest | `LatestList.tsx` | 12 cards, page 1; `/mag/page/{n}` plain prev/next links |
| Glossary teaser | `GlossaryTeaser.tsx` | «واژه‌نامه: از الف تا ی» alphabet strip + 6 TermCards |
| Experts | `ExpertsRow.tsx` | real authors/reviewers only; hidden while all are placeholders |

### 7.2 Topic hub — `/mag/topic/{topic}`

`TopicHero.tsx` (H1 `topics.name`, tagline, the topic accent as a soft band, the **pillar link above the fold**), intro Markdown (300–500 words), all cluster articles (ArticleCards), 3–6 products (ProductCards), 5–10 glossary TermCards, topic FAQ if present, `AskChoobz`.

### 7.3 Article — `/mag/{slug}`

**Layout:** mobile single column (`max-w-prose`, `text-lead`, line-height 1.9, shir paper with the format's stationery header band). Desktop three columns: TOC at inline-start (right, sticky), prose centre, a margin column at inline-end for marginalia («تجربهٔ یک مامان» callouts float there ≥ 1280 px) and glossary hover cards.

**Order (CONTENT-PLAN §5 + SEO.md §4.3):**

1. `Breadcrumbs` (خانه › مجله › {topic} › {short title}).
2. `ArticleHeader.tsx`: eyebrow (topic link · `AgeBadge` link) · **H1** (question form) · dek.
3. `Byline.tsx`: «نوشتهٔ [نام]، [نقش]» (→ `/team/{slug}`) · «بازبینی علمی: [نام] · [تاریخ]» (sage stamp; required for YMYL) · «به‌روزرسانی: ۲۸ مهر ۱۴۰۵» (`<time datetime="…+03:30">`) · «۷ دقیقه مطالعه». Placeholder people never render: byline «تحریریهٔ چوبز», reviewer slot empty.
4. `ArticleCover.tsx`: arch-masked figure with `figcaption`; illustration `<img>` or photo (`fetchPriority="high"` when it is above the fold).
5. `Tldr.tsx` «خلاصه در یک نگاه» (`id="tldr"`): mint bubble, 3–5 bullets from `posts.tldr`; the first bullet is visually prefixed «جواب کوتاه:» (the AEO target) and contains the defining sentence; key numbers get the mustard swash (the one per viewport).
6. `Toc.tsx` (server, when > 1,200 words): a vertical **string with beads** (one bead per H2, the current bead fills anar via `TocSpy.tsx`, 0.8 KB on idle, `aria-current`). Mobile: `<details>` «فهرست مطالب» under the TL;DR + the floating TOC pill (§4.2).
7. Body (`Prose.tsx`): **H2s are questions** (Estedad 800 `text-xl`, ASCII ids, a «#» copy-link on hover/focus), `h2 + p` styled as the 40–60-word answer paragraph (slightly larger, `text-lead`), H3s Estedad 700. Links use `link-mark`. Blocks:
   - `Callout.tsx` — `[!TIP]` «نکته» (bubble + sprout) · `[!NOTE]` «توضیح» (raised paper + info icon) · `[!WARNING]` «نکتهٔ ایمنی» (raised paper with a 4 px accent inline-start rule + triangle icon; never an anar fill) · `[!WORKSHOP]` «از کارگاه چوبز» (wood face with grain + stamp «تجربهٔ دست‌اول») · `[!EXPERT]` «نگاه متخصص» (avatar + name → `/team`, real people only) · `[!MYTH]` → `MythFact.tsx` (two faces «باور رایج / واقعیت», side by side on desktop, stacked with a hinge line on mobile; both always visible).
   - `PullQuote.tsx` — plain blockquote → Mikhak `text-lg` in a bubble with large «» marks, cited speaker.
   - `ProductEmbed.tsx` / `ProductRow.tsx` — `::product{slug why}` / `::products{slugs}`: horizontal raised card (mini Stage, name, age hex, price, installment line, «چرا اینجا؟» sentence, «دیدن محصول ←», quick add), label «در این راهنما از این استفاده کردیم». At most 3 per article, never in the first screen.
   - `CompareTable.tsx` — real `<table>` with `<caption>` (from «جدول:»), `<th scope>`; sticky first column ≥ 640 px; < 600 px rows become stacked cards (`data-label` per cell); a column whose header contains «چوبز» gets a soft mustard band. Never page-level horizontal scroll.
   - `Steps.tsx` — `:::steps` → `<ol>` of numbered wooden beads on a vertical string, `id="step-n"`, optional time/tools; `HowTo` only when `format = "howto"`.
   - `Checklist.tsx` + `ChecklistTicks.tsx` (1 KB, visible) — GFM task lists as a peg board: real checkboxes, ticks in `localStorage` (try/catch) keyed `cz.check.{slug}.{i}`, progress beads, «چاپ چک‌لیست» (print stylesheet), share via Web Share.
   - `InlineIllustration.tsx` — `::illustration{name caption}` → manifest `<img>` in a figure.
   - `GlossaryLink.tsx` — first mention (≤ 8 per article, never in headings) becomes `<a class="term" href="/glossary/{slug}">` with a dotted underline; on hover-capable devices a CSS-only hover/focus card (sibling element, anchor-positioned where supported) shows the definition; on touch, the tap simply navigates.
   - `AparatFacade.tsx` (0.3 KB) — poster + play key + transcript; the iframe loads only after a tap.
8. `MedicalNote.tsx` (YMYL only, above the FAQ): «این مطلب جایگزین مشاورهٔ پزشک نیست.»
9. `ArticleFaq.tsx` «پرسش‌های پرتکرار»: `<details>` (first open), `FAQPage`.
10. `Sources.tsx` «منابع»: numbered list `id="cite-n"` (organisation, title, link, access date in Jalali); in-text footnotes `<sup><a href="#cite-1">[۱]</a></sup>`.
11. `AuthorBox.tsx`: arch portrait, name, role, credentials chips, short bio, reviewer line, «ما چطور می‌نویسیم ←» (`/editorial-policy`).
12. «وسایلی که در این مطلب دیدید»: `post_products` mini grid (1–3).
13. `NextInPath.tsx` «قدم بعدی در این مسیر» (next post in the topic) + `RelatedPosts.tsx` (3 cards) + topic hub link.
14. `ShareRow.tsx`: «اشتراک‌گذاری» (`ShareButton`, Web Share API, 0.4 KB) + «کپی لینک» (toast «لینک کپی شد»). No third-party share scripts.
15. `AskChoobz` on commercial articles.
16. Closing line (Mikhak, `text-muted`): «قصهٔ این مطلب همین‌جا تموم شد؛ قصهٔ بچه‌ت تازه شروع شده.»

### 7.4 Glossary — `/glossary`, `/glossary/{term}`

- **Index (`GlossaryIndex.tsx`, `AlphabetRail.tsx`, `TermCard.tsx`):** H1 «واژه‌نامهٔ مونته‌سوری، پیکلر و بازی کودک», intro; sticky alphabet rail «ا ب پ ت ث ج چ ح خ د ذ ر ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن و ه ی» as small wooden letter blocks (letters without terms are unpainted and disabled); groups anchored `#letter-alef`, `#letter-be` …; TermCards (term, `<bdi lang="en">` original, one-line definition). Optionally grouped by the content plan's four shelves when sorted by topic.
- **Term (`TermHero.tsx`):** H1 «{term} چیست؟»; the first paragraph is `glossary_terms.definition` verbatim with `<dfn>`; «به آن … هم می‌گویند» (alternate names); body Markdown (≤ 300 words); pillar link; related products (cards); related posts; visible fa/en Wikipedia links.
- **Quality gate (new rule):** a term page is indexable only if it has its definition **and** (a body ≥ 150 words **or** ≥ 2 related posts/products); otherwise `robots: noindex, follow` and it is left out of the sitemap.

### 7.5 Age hubs — `/age`, `/age/{range}`

- `/age`: H1 «سن به سن: بازی و وسایل مناسب هر سن», the three hubs as large hex cards, plus the door scene in its default stage.
- `/age/{range}` (`AgeHubHero.tsx`, `MilestoneBlock.tsx`, `AgeSection.tsx`): **H1** per SEO.md §1.5 (e.g. «بازی و وسایل مناسب کودک ۱ تا ۳ سال (نوپا)»); the door scene **fixed** at the hub's stage (static, no radios, `aria-hidden`); milestone summary (YMYL: named reviewer + `MedicalNote`, sources); anchored sub-range sections `#1-2-years`, `#2-3-years`, each with its milestone paragraph, a ProductGrid of overlapping products, guides for that age, and the matching RoomCard; age FAQ (`faqs` scope `age`). `CollectionPage` + `audience` + `ItemList`. The chip morph `age-{key}` connects the home chip to the hub hex.

### 7.6 Team — `/team`, `/team/{slug}`, `/editorial-policy`

`AuthorCard.tsx` grid; profile page with arch portrait, role, verifiable credentials, `knowsAbout`, authored and reviewed articles. Placeholder people (`isPlaceholder`) are never published.

---

## 8. Other pages (brief specs)

| Route | Template & key blocks |
|---|---|
| `/about` «داستان چوبز» | Picture-book story in 3 spreads («یکی بود…» the beginning · the workshop · the community), founders photo slot ⚑, mission, Montessori/Waldorf/Pikler inspiration with glossary links, **«چوبز در یک نگاه»** fact sheet (`#facts`, short dated `<dl>` lines: what we make, city ⚑, founded ⚑, materials, shipping, warranty, returns, installments, contact), eNamad, full `OnlineStore` JSON-LD |
| `/workshop` «کارگاه چوبز» | the five steps with real photos later, materials & finishes (verified only), machines, safety tests ⚑, short self-hosted loop (`preload="none"`, poster, muted, played only when visible and Save-Data is off) + transcript, the last 10 `workshop_log` entries, visiting info only if open ⚑ |
| `/contact` | NAP block identical to JSON-LD/eNamad, `tel:` button, Bale and Instagram buttons, hours, Neshan/Balad link (no embed). No form in Phase 1 |
| `/faq` | sections `#buying #shipping #installments #returns #safety` with a sticky chip index, `<details>` drawers (first open), `FAQPage` |
| `/shipping`, `/returns`, `/warranty`, `/safety`, `/trust`, `/privacy`, `/terms` | `PolicyPage` template: breadcrumb, H1, a «خلاصه در یک نگاه» box with the key numbers (days, costs, windows), Markdown body (`max-w-narrow`), «آخرین به‌روزرسانی», related links, AskChoobz. `/trust`: large eNamad (eager), how to verify it, business identifiers ⚑ |
| `/installments` «خرید قسطی با اسنپ‌پی» | InstallmentWheels calculator (product chips + «مبلغ دلخواه» → radios with server-rendered amounts; custom amount via a 0.4 KB island), 3 steps, eligibility ⚑, FAQ + `FAQPage` |
| `/reviews` «رضایت شما» | sticky-note wall of approved testimonials (Mikhak notes), optional product chip filter (client), **no Review markup** |
| `/gallery` «عکس‌های شما» | fridge-door/salon wall of consented photos with placards, the empty frame CTA, `<dialog>` lightbox, `ImageObject` |
| `/search` | §4.4 |
| 404 (`not-found.tsx`, real 404) | H1 «این صفحه پیدا نشد», lettering «نخ از دستمون در رفت!», Tati `slipped` pose (the thread rider is hidden on this page), search box, top categories, three pillar guides, «برگردیم خونه؟» (primary → `/`) |

**Instagram highlight → URL map** (for bio links, highlight covers and Bale posts, UTM-tagged): اسنپ پی → `/installments` · کارگاه → `/workshop` · کانال بله → Bale · عکساتون → `/gallery` · کتابخانه → `/product/front-facing-bookshelf` · رول نقاشی دیواری → `/product/wall-art-roll` · اعتماد شما → `/trust` · برج یادگیری → `/product/learning-tower` · آرکوپیکلر → `/shop/climbing` · رضایت شما → `/reviews`.

---

## 9. Motion system — «چوب وزن دارد»

### 9.1 Principles

1. **Wood has weight.** Things drop, seat and settle with ≤ 5% overshoot (`--ease-settle`). Nothing floats or fades in weightlessly. Only toys (cart hop, duck, badge) may bounce (`--ease-hop`).
2. **Cut → lift → settle.** Entrances reveal an outline or a place first, lift, then seat.
3. **Paper turns, string connects.** Pages turn like a right-bound Persian book; movement between two places follows a path (thread, cart hop).
4. **Scroll is a pull, never a hijack.** Scroll-linked effects are scrubbed, never pinned horizontally; at most one sticky scene per page, ≤ 160vh on mobile.
5. **Calm by default.** ≤ 1 signature motion per viewport, ≤ 1 idle loop (Tati's blink; night stars in the footer).
6. **Compositor only.** Animate `transform`/`translate`/`rotate`/`scale`/`opacity` on **HTML** elements. Never SVG child transforms, `d`, `stroke-dashoffset` on scroll, layout properties, filters or blend modes. Exceptions (small, one-off, user-triggered): the kashida pull (`font-variation-settings` on a `contain: layout` box), the mustard swash (`background-size`), the engraver's clip sweep.
7. **Static-first and respectful.** Default CSS = final frame. Hidden "from" states exist only inside `@supports (animation-timeline: view())` + `motion-ok`. `prefers-reduced-motion`, «حرکت آرام» (`data-motion="reduce"`) and the lite tier (`data-lite`) all render final frames; view transitions become a 120 ms cross-fade.

### 9.2 Tokens

Durations: `--dur-press` 90 · `--dur-quick` 160 · `--dur-base` 240 · `--dur-gentle` 360 · `--dur-page` 420 · `--dur-scene` 620 · `--dur-toy` 800 ms · `--stagger` 90 ms. Easings: `--ease-wood`, `--ease-page`, `--ease-exit`, `--ease-settle`, `--ease-press`, `--ease-hop` (toys), `--ease-wobble` (rotation only). All defined in §2.1. Tailwind: `duration-(--dur-quick) ease-wood`.

| Interaction | Duration | Easing |
|---|---|---|
| Button/chip press down / release | 90 / 330 ms | linear / press |
| Hover, focus, colour | 160 ms | wood |
| Popover, menu, sheet content, tabs | 240 ms (exit 160) | wood / exit |
| Card hover swap, bubble pop, drawer | 360 ms | settle |
| Page turn | 420 ms | page |
| Cover parts, room morph, cubby drop | 620 ms | settle |
| Cart hop | 800 ms | hop |
| Cart wobble, Tati quack | 620 ms | wobble (rotate ±6°) |

### 9.3 Pre-paint head script (≤ 400 B, inline in the root layout, CSP-hashed)

```js
(function(){var d=document.documentElement;try{var s=localStorage,t=s.getItem("cz.theme"),m=s.getItem("cz.motion");if(t)d.dataset.theme=t;if(m)d.dataset.motion=m}catch(e){}
var n=navigator,c=n.connection;if((c&&c.saveData)||(n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=4))d.dataset.lite=""})();
```
`<html lang="fa-IR" dir="rtl" suppressHydrationWarning>`. No cookies, no server reads; the server always renders the light default.

### 9.4 Tati on the thread (zero JS)

```html
<!-- TatiThread.tsx (server). Markup: outer = ride (translate) + hop (transform/opacity); inner = fade-out; wheels = rotate -->
<div class="thread" aria-hidden="true"><span class="thread__taut"></span></div>
<div class="tati-rider" aria-hidden="true">
  <div class="tati-rider__body"><svg><!-- TatiBody pose="rolling" --></svg>
    <span class="wheel wheel--front"><svg><!-- TatiWheel --></svg></span>
    <span class="wheel wheel--back"><svg><!-- TatiWheel --></svg></span>
  </div>
</div>
```

```css
.thread { position: fixed; inset-inline: 0; inset-block-start: calc(var(--spacing-header) - 1.5px); height: 1.5px; z-index: var(--z-thread); background: color-mix(in oklab, var(--thread) 55%, transparent); pointer-events: none; }
.thread__taut { position: absolute; inset: 0; background: var(--thread); transform-origin: right; scale: 0 1; }
.tati-rider { position: fixed; z-index: var(--z-thread); inset-block-start: calc(var(--spacing-header) - 30px); inset-inline-start: var(--spacing-gutter); width: 40px; pointer-events: none; --ride: calc(-1 * (100vw - 40px - 2 * var(--spacing-gutter))); --turns: 10; view-transition-name: tati; }
.tati-rider .wheel { display: block; position: absolute; width: 25%; aspect-ratio: 1; }
@media (min-width: 64rem) { .thread, .tati-rider { inset-block-start: calc(var(--spacing-header-lg) - 34px); } .tati-rider { width: 48px; --turns: 36; } }

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: scroll()) {
    :root:not([data-motion="reduce"]) .tati-rider { animation: tati-ride linear both; animation-timeline: scroll(root block); }
    :root:not([data-motion="reduce"]) .tati-rider__body { animation: tati-home linear both; animation-timeline: scroll(root block); animation-range: 97% 100%; }
    :root:not([data-motion="reduce"]) .tati-rider .wheel { animation: tati-spin linear both; animation-timeline: scroll(root block); }
    :root:not([data-motion="reduce"]) .thread__taut { animation: thread-pull linear both; animation-timeline: scroll(root block); }
  }
}
@keyframes tati-ride { to { translate: var(--ride) 0; } }          /* RTL: toward inline-end (left) */
@keyframes tati-spin { to { rotate: calc(var(--turns) * -1turn); } } /* rolling left = counter-clockwise */
@keyframes thread-pull { to { scale: 1 1; } }
@keyframes tati-home { to { opacity: 0; } }                        /* he has arrived */

/* Home: hidden until the cover leaves (outer element); fades as TheEnd arrives (inner element).
   Each opacity animation lives on its own element, so they never fight over one property. */
body:has(.cover) { timeline-scope: --cover, --end; }
.cover { view-timeline: --cover block; }
.the-end { view-timeline: --end block; }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    :root:not([data-motion="reduce"]) body:has(.cover) .tati-rider {
      animation: tati-ride linear both, rider-hop linear both;
      animation-timeline: scroll(root block), --cover;
      animation-range: normal, exit 45% exit 70%;
    }
    :root:not([data-motion="reduce"]) body:has(.cover) .tati-rider__body {
      animation: rider-leave linear both;
      animation-timeline: --end;
      animation-range: entry 0% entry 40%;
    }
  }
}
@keyframes rider-hop { from { opacity: 0; transform: translateY(-16px); } }  /* transform composes with translate */
@keyframes rider-leave { to { opacity: 0; } }
/* No scroll timelines or reduced motion: the rider stays at the thread's start; on home it is hidden */
@supports not (animation-timeline: scroll()) { body:has(.cover) .tati-rider { display: none; } }
@media (prefers-reduced-motion: reduce) { body:has(.cover) .tati-rider { display: none; } }
:root[data-motion="reduce"] body:has(.cover) .tati-rider, body:has(.page-404) .tati-rider { display: none; }
```

### 9.5 Scroll-driven inventory (all gated; fallback = final state)

| Effect | Timeline / range | Animated property | Fallback |
|---|---|---|---|
| Tati ride, wheels, taut thread | `scroll(root block)` | translate, rotate, scale | rider at start |
| Header paper backing | `scroll(root)` 0–80 px | opacity | backing always on |
| Cover light drift | cover `view()` exit 0–60% | translate, opacity | static light |
| Cover Tati lift / rider hop | `--cover` exit 35–70% | transform, opacity | rider hidden on home |
| Cubby drops | each cubby `view()` entry 10% → cover 30% | translate, rotate | in place |
| Featured cards rise | `view()` entry 0–60% | translate, opacity | visible |
| Workshop steps (5) | each step card's named `view-timeline` via `timeline-scope` | translate, opacity, scale | stamped final frame |
| Ply layers separate | section `view()` contain 10–60% | translate | exploded static |
| Fridge polaroids settle | `view()` entry | rotate, translate | tilted static |
| PDP dock ↔ buy bar | price block `view-timeline: --price`, `exit 0% exit 100%` | rotate (x), opacity | buy bar always shown on PDP |
| Article TOC pill | inline TOC `view-timeline: --toc`, after exit | translate, opacity | pill always shown |
| TheEnd window light, rider leave | `--end` entry | opacity | lit |

Pattern (shorthand first, then the timeline — the shorthand resets `animation-timeline`, TECH.md gotcha 22):

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    :root:not([data-motion="reduce"]):not([data-lite]) .cubby__toy {
      animation: cubby-drop linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 30%;
    }
  }
}
@keyframes cubby-drop { from { translate: 0 -12px; rotate: 1deg; opacity: .001; } }
```

### 9.6 Page transitions — «ورق‌زدن» (React 19.3 `<ViewTransition>`, no config in Next 16.4)

```tsx
// src/components/layout/PageTurn.tsx — each page.tsx wraps its content (never the persistent layout)
import { ViewTransition } from "react";
export function PageTurn({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "turn-forward", "nav-back": "turn-back", default: "none" }}
      exit={{ "nav-forward": "turn-forward", "nav-back": "turn-back", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
// Deeper links: <Link href=… transitionTypes={["nav-forward"]}> · breadcrumbs/back: ["nav-back"]
```

```css
::view-transition { pointer-events: none; }
/* A Persian book is bound on the right: forward lifts the old page toward the spine (right) */
@media (prefers-reduced-motion: no-preference) {
  :root:not([data-motion="reduce"])::view-transition-old(.turn-forward) { animation: turn-away var(--dur-page) var(--ease-page) both; transform-origin: right center; }
  :root:not([data-motion="reduce"])::view-transition-new(.turn-forward) { animation: turn-reveal var(--dur-page) var(--ease-page) both; }
  :root:not([data-motion="reduce"])::view-transition-old(.turn-back) { animation: turn-reveal var(--dur-page) var(--ease-page) reverse both; }
  :root:not([data-motion="reduce"])::view-transition-new(.turn-back) { animation: turn-away var(--dur-page) var(--ease-page) reverse both; transform-origin: right center; }
  ::view-transition-group(.morph) { animation-duration: var(--dur-page); animation-timing-function: var(--ease-settle); }
}
@keyframes turn-away { to { transform: perspective(1400px) translateX(8%) rotateY(-12deg); opacity: 0; } }
@keyframes turn-reveal { from { transform: translateX(-3%); opacity: .5; } }
::view-transition-group(site-header), ::view-transition-group(tati), ::view-transition-group(dock) { animation: none; }
@media (prefers-reduced-motion: reduce) { ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation-duration: 120ms !important; } }
```

**Shared elements** (`share="morph" default="none"` on both ends): product card Stage → PDP slide 1 (`product-{id}`) · article card cover → article cover (`post-{id}`) · category cubby → category shop-window drawing (`category-{slug}`) · home age chip → age hub hex (`age-{key}`). A morph only pairs when the destination renders in the same commit: the first 4 cards in any grid use `<Link prefetch>`, the rest `IntentLink` (prefetch on pointer-enter/focus/touch-start). When no pair forms the page turn still plays.

**Same-document transitions:** the height door (`types: ['room']`), shop sort/filter (none — instant), drawers/sheets/popovers use `@starting-style` + `transition-behavior: allow-discrete`, not view transitions.

### 9.7 Micro-interactions catalogue

Wood-block press (2 px, strata reduce) · hex chip "click" like a bead (scale .96 → settle) · cart wobble + new parcel · price digits cross-fade (150 ms) on variant switch inside a box sized to the longest price · error shake 3 × ±4 px with `role="alert"` text · `<details>` sprout grows into a leaf on open · Tati greeting popover + name-tag kashida pull · TOC bead fill · free-shipping bead slides along the string.

---

## 10. Performance budget & rules

Targets (p75 mobile, Iranian 4G, measured with self-hosted RUM): **LCP ≤ 2.0 s · INP ≤ 150 ms · CLS ≈ 0.01 · TTFB ≤ 500 ms** (SEO.md §7.3). Lab: Lighthouse CI mobile slow-4G, Performance ≥ 90, SEO 100, A11y ≥ 95. Real-device pass on a Galaxy A-series and an iPhone 11 before launch.

### 10.1 Per-route budgets (transfer, brotli). Framework floor ≈ 144 KB gz is excluded and tracked separately

| Route | HTML (incl. RSC) | CSS (inlined) | **Our** JS eager | **Our** JS after all interactions | Inline SVG (raw) | LCP element |
|---|---|---|---|---|---|---|
| `/` | ≤ 50 KB | ≤ 25 KB | ≤ 4 KB | ≤ 16 KB | ≤ 16 KB | H1 display text (Ario, preloaded) or the Orosi light `<img>` (≤ 14 KB, `fetchpriority="high"`) — both by ≈ 1.2 s |
| `/shop`, `/shop/{c}`, `/age/{r}`, `/rooms/{p}` | ≤ 40 KB | ≤ 25 KB | ≤ 5 KB | ≤ 9 KB | ≤ 6 KB | H1 text (first card images `fetchpriority="high"` once photos exist) |
| `/product/{slug}` | ≤ 40 KB | ≤ 25 KB | ≤ 6 KB | ≤ 18 KB | ≤ 14 KB (layered stage) | H1 text (drawing stage) → first cutout/photo (AVIF ≤ 60 KB @ 828w) |
| `/mag/{slug}` | ≤ 40 KB (≤ 150 KB raw) | ≤ 25 KB | ≤ 3 KB | ≤ 6 KB | ≤ 2 KB | H1 text or cover image |
| `/mag`, `/glossary/*`, `/faq`, policies | ≤ 35 KB | ≤ 25 KB | ≤ 3 KB | ≤ 5 KB | ≤ 2 KB | H1 text |

DOM < 1,500 nodes on home; `content-visibility: auto` + `contain-intrinsic-size` on every below-fold home section and long article sections. CI fails on any budget regression (`size-limit` on our chunks, Lighthouse CI budgets, `seo:audit` HTML size).

### 10.2 Client islands (everything else is a Server Component)

| Island | Where | Why it must be client | Size (gz, est.) | Loads |
|---|---|---|---|---|
| Head pre-paint script (not React) | all | theme/motion/lite before paint | 0.4 KB | inline |
| `CartProvider` + `CartButton` + `Toaster` | all | localStorage cart, badge, toasts | 2.5 KB | eager |
| `CartDrawer` content | all | cart UI, quote fetch | 4 KB | first open / first add |
| `AddToCartButton` | cards, PDP, embeds, rooms | optimistic add + WAAPI hop | 0.6 KB | with provider |
| `IntentLink` | grids | prefetch on intent so morphs pair | 0.3 KB | eager (shared) |
| `SearchSuggest` | header | live suggestions | 3 KB | first focus |
| `InvokerPolyfill` | dialogs | only where `commandfor` is unsupported | 0.8 KB | feature-detected |
| `HoverIntent` | desktop mega menus | 120 ms hover open | 0.3 KB | idle, `pointer: fine` |
| `ThemeToggle`, `MotionToggle` | footer, menu | write localStorage + data-attrs | 0.4 KB | idle |
| `AgeRoomVT` | home, `/age` | `startViewTransition` + `replaceState` | 0.5 KB | near viewport |
| `RoomTotals` | home, `/rooms`, PDP | recompute totals/wheels on toggles | 1.2 KB | near viewport |
| `EngraverIsland` | home, PDP add-on | live engraving preview | 4 KB | first focus |
| `StoryCard` | home, PDP | canvas share card | 3 KB (+ template) | on tap |
| `FilterBar` | shop, category, age | DOM filtering, URL state | 3 KB | idle |
| `GallerySync` / `ZoomDialog` | PDP | active-slide tabs / pinch zoom | 1 KB / 2 KB | idle / on tap |
| `HeightInputs` | PDP | own height & cabinet inputs | 0.8 KB | first focus |
| `TocSpy`, `ChecklistTicks`, `ShareButton`, `AparatFacade` | articles | current section, ticks, Web Share, video | 0.8 / 1 / 0.4 / 0.3 KB | idle / visible / tap / tap |
| `WebVitals` | all | RUM beacon to `/api/rum` | 1 KB | idle |
| Inline mini-scripts (not React) | door `?age=`, variant `?color=`, Jalali wheel labels, live-strip expiry | pre-paint DOM fixes | ≤ 0.15 KB each | inline |

**Banned on public pages:** `motion/react` (and `LazyMotion`) — every animation here is CSS or plain WAAPI; carousel/animation libraries; icon packages; third-party scripts (analytics included). `motion/mini` is allowed only if a future gesture needs interruptible springs, lazily. Don't pass DB objects to client components — pass ids and display strings.

### 10.3 Images and SVG

- Uploads: `next/image` (AVIF/WebP, `qualities` [60, 75, 85]), always `width`/`height` or `aspect-ratio`, exact `sizes`, `media.dominantColor` as the placeholder background, `blurDataUrl` only for hero photos. LCP image: `fetchPriority="high"` + `loading="eager"` (never the deprecated `priority`); everything else lazy.
- **RSC double-payload rule:** inline SVG is sent twice (HTML + flight). Inline only the cover scene, the PDP layered stage, the door scene kit, Tati and header/dock icons. Every grid/embed/cart drawing is `<img src="/illustrations/…svg" width height loading="lazy" decoding="async">` (plain `<img>`, not the optimiser). Card hover views use `<picture><source media="(hover: hover)">` so phones never download them.
- eNamad: plain `<img referrerpolicy="origin">`, fixed box, lazy (eager only on `/trust`) — the only third-party request, below the fold.
- Orosi light: the only story-layer raster; ≤ 14 / 22 KB; preloaded via `fetchpriority`.
- Texture tiles (grain ×12, paper ×2, marks sprite, icons sprite): ≤ 45 KB total, `immutable`.

### 10.4 Fonts (FONTS.md §5 exactly)

`next/font/local` from `src/fonts/` (`src/app/fonts.ts` already exists): Estedad (50.5 KiB) + Ario (19.0 KiB) **preloaded**, Mikhak (26.3 KiB) **not preloaded**; `display: "swap"`, `adjustFontFallback: false`; CLS controlled by explicit line-heights on every text role. No Google Fonts, CDNs or GitHub at runtime. Mikhak-dependent effects (kashida pull) silently no-op until Mikhak arrives.

### 10.5 CSS

Tailwind v4 output ≤ 25 KB br, inlined (`experimental.inlineCss`, already on); if it grows past ~30 KB, turn inlining off. No CSS-in-JS. Per-page inline `<style>` only for variant price rules (≤ 4 rules).

---

## 11. Persian voice & tone

### 11.1 Three registers

| Register | Where | How it sounds |
|---|---|---|
| **صدای قصه** (story, colloquial, warm) | kickers, Tati, bubbles, home headlines, empty states, toasts | the brand's Instagram: «بچه‌ت»، «کوچولوت»، «بریم»، «می‌شن»؛ short, smiling, never cute-for-cute's-sake |
| **صدای راهنما** (guide, standard written Persian) | article body, PDP descriptions & specs, glossary, age milestones | «می‌توانید»، «است»؛ answer-first, quotable sentences, every outside number sourced |
| **صدای حساب** (money, precise, formal) | prices, installments, cart totals, policies, errors about payment | «شما»، exact numbers, no jokes near money, «طبق شرایط اسنپ‌پی» |

Rules: plain words on every control (§1.2 law 4); correct ZWNJ (اسباب‌بازی، می‌شود)؛ Persian ی/ک؛ «گیومه»؛ «تا» in ranges («۱ تا ۳ سال»), never a hyphen between digits; Persian digits in visible text; inclusive families («مامان‌ها و باباها» where it fits, mothers with and without hijab, grandparents); no guilt («اگه نخری عقب میفته»), no fake urgency, no unproven superlatives («بهترین/اولین در ایران»), no emoji in UI strings (sprouts and hearts are SVG marks).

### 11.2 Sample microcopy (20 strings)

| # | Context | String |
|---|---|---|
| 1 | Primary CTA | «افزودن به سبد» |
| 2 | Added toast | «برج یادگیری به سبد اضافه شد · دیدن سبد» |
| 3 | Add all (room) toast | «۵ وسیلهٔ اتاق به سبد اضافه شد» |
| 4 | Empty cart | «گاریِ تاتی خالیه! بریم یه چیزی بذاریم توش؟» |
| 5 | Remove + undo | «از سبد برداشته شد · برگردون» |
| 6 | Free shipping meter | «فقط ۴۲۰٬۰۰۰ تومان تا ارسال رایگان» → «ارسال این سفارش رایگانه!» |
| 7 | Price changed in cart | «قیمت این وسیله از وقتی گذاشتیش توی سبد عوض شده: ۹٬۸۰۰٬۰۰۰ تومان» |
| 8 | Installment line | «یا ۴ قسط ۲٬۴۵۰٬۰۰۰ تومانی با اسنپ‌پی» |
| 9 | Made to order | «ساخته می‌شه برای شما — آماده در ۱۴ روز کاری» |
| 10 | Out of stock | «فعلاً تموم شده · توی بله بپرس کی آماده می‌شه» |
| 11 | Empty filters | «با این فیلترها چیزی پیدا نکردیم. · پاک‌کردن فیلترها» |
| 12 | Search, no results | «برای «{q}» چیزی پیدا نکردیم؛ شاید این‌ها به کارت بیاد:» |
| 13 | 404 | «این صفحه پیدا نشد» + «نخ از دستمون در رفت! برگردیم خونه؟» |
| 14 | Network error | «اینترنت یه لحظه قطع شد. دوباره امتحان کن. · دوباره» |
| 15 | Storage blocked | «سبدت فقط تا بستن این صفحه می‌مونه؛ مرورگرت اجازهٔ ذخیره نمی‌ده.» |
| 16 | Engraver placeholder / privacy | «اسم کوچولوت چیه؟» · «این اسم فقط روی گوشی خودت می‌مونه.» |
| 17 | Engraver too long | «اسم حداکثر ۱۴ حرف جا می‌شه.» |
| 18 | Pre-purchase consult | «سؤال داری؟ قبل از خرید از خودِ کارگاه در بله بپرس» |
| 19 | Copy link | «لینک کپی شد» |
| 20 | UGC empty frame | «این قاب، منتظرِ شماست.» |
| — | Skip links | «رفتن به محتوای اصلی» · «مستقیم به فروشگاه» |
| — | Cart order stub | «متن سفارش کپی شد؛ توی بله برامون بفرست» |

---

## 12. DO / DON'T

**DO**
- Start every component from its **final static frame**; add motion inside `@supports` + `motion-ok`.
- Use semantic utilities (`bg-bg`, `text-ink`, `bg-accent`…) in components; raw palette only in illustrations and primitives.
- Put a laminated ply edge on everything tappable and a tray under everything that holds; keep reading surfaces flat.
- Keep one Tati, one signature motion, one mustard swash and one ply-type headline per viewport.
- Draw products only from manifests (true dimensions, true rung counts); label the source honestly.
- Write H2s as questions on content pages and answer them in the first 40–60 words.
- Render every price, spec, FAQ answer, milestone and review as server HTML text; keep JSON-LD consistent with it (IRR = Toman × 10).
- Use Persian digits in visible text (code conversion), `<data>`/`<time>` with Latin values for machines.
- Give every image dimensions; every illustration `aria-hidden` (inline) or Persian `alt` (`<img>`).
- Respect `prefers-reduced-motion`, «حرکت آرام», Save-Data and low-memory devices.
- Keep all assets self-hosted; the only third-party request is the lazy eNamad seal.
- Mark every unverified claim ⚑ in the data and hide it until the workshop confirms.

**DON'T**
- Don't bring back the cut list (§0.2): pop-up landscape, day-cycle tints, rainbow stacker hero, shape sorter, abacus, bead-maze nav, WebAudio, tree rings, part labels «قطعهٔ ۰X از ۱۲», pinned horizontal workbench, finger joints, pegboard, clothesline, museum vocabulary, Markazi, Vazirmatn, Vazir Code, device-clock dayparts, 22:00 toast.
- Don't use «گالری»، «شیء/اشیا»، «تالار»، «گاری» or «کتابخانه» (for the magazine) as UI labels.
- Don't animate SVG child transforms, `d`, scroll-linked `stroke-dashoffset`, layout properties, filters, `backdrop-filter` or blend modes; don't run `feTurbulence`.
- Don't animate the H1, and don't hide meaningful content behind JS, `Suspense` or click-to-load.
- Don't use letter-spacing, italics, `text-transform`, justify, typed kashida, Arabic ي/ك or faux bold on Persian.
- Don't put anar, pesteh or firuzeh text on takhte, kraft or the mustard swash; never zardchube text.
- Don't put mother's marks on prices, legal text, forms or product facts.
- Don't read `cookies()`, `headers()` or `searchParams` in public routes; don't call `new Date()` in render outside `'use cache'`.
- Don't ship fake reviews, invented experts, unconsented child photos or stats without a date and source; never mark testimonials as `Review`.
- Don't load Google Fonts, foreign CDNs, Instagram embeds, analytics SaaS, chat widgets or SnappPay scripts in the browser.
- Don't add autoplay carousels, entry pop-ups, countdown timers, or sound.
- Don't make Tati a sticker: no Tati on product imagery, in commerce UI or twice in a viewport.

---

## Appendix A — Data model & settings deltas (migration `0001_design.sql`, on top of SEO.md §9)

All nullable or defaulted, so the Phase 1 seed and the Phase 2 CMS stay compatible.

| Table | Add | Used by |
|---|---|---|
| `media` | `kind` (`illustration`·`cutout`·`photo`·`video`·`doc`), `credit`, `consentAt`, `focalX`, `focalY` | Stage treatment, UGC consent, crops |
| `products` | `assemblyMinutes` (int) | «زمان نصب» |
| `community_photos`, `reviews` | `consentAt` (timestamp) | nothing with a child renders without it |
| `faqs` | `featured` (bool), `scopeKey` (text); `scope` union gains `age`, `room` | home FAQ, age/room FAQs |
| new `product_addons` | `id, productId, key ('engraving'), name, priceToman, maxChars, status` | engraving add-on ⚑ |
| new `room_presets` | `id, slug, name, ageStage, tagline, description (md), floorAreaM2, illustration, sortOrder, status, …seo, …timestamps` | door rooms, `/rooms/{preset}` |
| new `room_preset_items` | `presetId, productId, variantId?, slot, defaultOn (bool), sortOrder` | room builder |
| new `workshop_log` | `id, stage, body, count, createdAt` | «امروز در کارگاه» (72 h rule) |

**`settings` keys used by this design** (JSON): `hero`, `season`, `trust`, `tati_captions`, `age_stages`, `engraving`, `safety_points`, `workshopSteps`, `shopIntro`, plus SEO.md's `org`, `socials` (incl. `followers`, `followersAsOf`), `enamad`, `snapppay`, `shippingPolicy`, `returnPolicy`. Production renders a section part only when its setting is non-null.

`posts` needs no new column for design: home teasers use `tldr[0]` as the short answer.

## Appendix B — Component & file map

```
src/app/(site)/page.tsx · shop/page.tsx · shop/[category]/page.tsx · product/[slug]/page.tsx · rooms/page.tsx · rooms/[preset]/page.tsx
src/app/(site)/mag/page.tsx · mag/[slug]/page.tsx · mag/topic/[topic]/page.tsx · mag/page/[n]/page.tsx · glossary/page.tsx · glossary/[term]/page.tsx
src/app/(site)/age/page.tsx · age/[range]/page.tsx · faq/page.tsx · workshop/page.tsx · team/… · reviews/page.tsx · gallery/page.tsx · cart/page.tsx · (pages)/[page]/page.tsx
src/app/search/page.tsx (dynamic) · api/suggest · api/cart/quote · api/rum · not-found.tsx

components/ui/        Button IconButton Icon Field TextInput Select Checkbox Radio Toggle Stepper HexChip PillChip RemovableChip
                      AgeBadge StampBadge InstallmentBadge StockBadge SampleBadge Price InstallmentLine InstallmentWheels Stage
                      SectionHeader Kicker Mark Doodle Kashida Bubble KraftTag Sheet Toaster(c) IntentLink(c) InlineScript EnamadBadge AskChoobz
components/layout/    SiteHeader HeaderNav MegaMenu HoverIntent(c) SearchDialog SearchSuggest(c) MenuDialog InvokerPolyfill(c) TatiThread
                      BottomDock CartProvider(c) CartButton(c) CartDrawer(c) FreeShippingMeter SiteFooter Endpapers ThemeScript
                      ThemeToggle(c) MotionToggle(c) SkipLinks Breadcrumbs PageTurn WebVitals(c)
components/home/      Cover CoverSheet SeasonProps ToyShelf HeightDoor DoorScene AgeRoomVT(c) FeaturedShelf Notebook Workshop LiveStrip
                      NameEngraver EngraverIsland(c) StoryCard(c, module) FridgeDoor PlyLayers FaqDrawers TheEnd
components/shop/      ShopWindow CategoryRail FilterBar(c) ProductGrid ProductCard EditorialInterlude AddToCartButton(c) ProductGallery
                      ManifestStage GallerySync(c) ZoomDialog(c) PriceBlock Shenasnameh VariantPicker AvailabilityLine TrustRow ScaleCompare
                      HeightInputs(c) MaterialSafety InTheBox SpecsTable ProductFaq ReviewsList RelatedGuides CompleteTheRoom RelatedProducts
                      BuyBar RoomBuilder RoomTotals(c) RoomScene RoomCard room-slots.ts CartLine CartSummary CartPageClient(c)
components/mag/       MagHero QuestionOfDay AgeTabs PillarShelf TopicRow ArticleCard LatestList GlossaryTeaser ExpertsRow TopicHero
                      ArticleHeader Byline ArticleCover Tldr Toc TocSpy(c) Prose Callout MythFact ProductEmbed ProductRow CompareTable Steps
                      PullQuote Checklist ChecklistTicks(c) InlineIllustration GlossaryLink MedicalNote ArticleFaq Sources AuthorBox AuthorCard
                      NextInPath RelatedPosts ShareRow ShareButton(c) AparatFacade(c) GlossaryIndex AlphabetRail TermCard TermHero
                      AgeHubHero MilestoneBlock AgeSection PolicyPage
components/illustrations/ tati/{TatiBody,TatiWheel,TatiRider,TatiPose}.tsx · manifests/*.ts · PartsRenderer.tsx · project.ts · PegDoll.tsx
                      RoomKit.tsx · lettering/{YekiBud,GhesseTamoom,NakhDarRaft}.tsx · Wordmark.tsx · EndpaperPattern.tsx · season/*
src/db/queries/       home.ts shop.ts product.ts rooms.ts mag.ts glossary.ts age.ts pages.ts settings.ts cart.ts   (all 'use cache' + cacheTag)
src/lib/              format.ts (exists) grain.ts ages.ts (stages, WHO medians ⚑) seo/* utils.ts
scripts/              textures/grain.ts · textures/paper.ts · illustrations/build.ts (manifests → public/illustrations/*.svg)
public/               textures/ (grain-00…11.svg, paper.webp, paper-night.webp) · light/orosi-morning.{avif,webp} · illustrations/ · marks.svg · icons.svg
```
(c) = client component; everything else is a Server Component.

## Appendix C — Build order (static-first)

1. `globals.css` tokens (§2.1), fonts wiring, base layer, `ply`/`tray`/`ply-band` utilities, texture scripts, icon & marks sprites.
2. `project.ts` + `PartsRenderer` + the learning-tower manifest; prove all five views; then the other 13 manifests and `scripts/illustrations/build.ts`.
3. Layout: header, thread (static), dock, menu, mega menu, footer, breadcrumbs, cart provider/drawer, toasts.
4. Home sections 1–11 in their final static frames, wired to seed data.
5. Shop listing + filters, ProductCard, PDP (manifest stage, شناسنامه, scale tool, buy bar), rooms pages.
6. Content: Prose + directives, article template, hub, topic, glossary (+ gate), age hubs, policy template, 404.
7. SEO plumbing per SEO.md (JSON-LD, sitemaps, robots, llms.txt, Markdown twins, Torob meta).
8. Motion layer: cover settle, Tati ride/hop, door morph, workshop steps, page turn & morphs.
9. Islands: room totals, engraver + story card, search suggest, gallery sync, height inputs.
10. Yalda skin; performance/a11y pass on a budget Android over 4G; ⚑ verification with the workshop.

**Commission one Iranian illustrator** for: the Tati sheet (4 poses + 2 accessories), the cover sheet composition, the three lettering phrases, the room scene kit, the peg-doll kit, the marks sprite, the endpaper pattern and the Yalda props. Every product drawing comes from the manifests.

## Appendix D — Open items (⚑) to verify before launch

DXF cut files (or measured manifests signed off) · platform heights and the scale-tool formula · WHO median table + reviewer for milestone copy · finish/coating, edge radius, load-test and small-parts claims · batch-number stamp «سری ۱۴۰۵-۰۷» · laser engraving feasibility, price and return-policy exclusion for engraved items · SnappPay eligible range, schedule wording, logo usage · shipping days, free-shipping threshold, return window · eNamad badge code and size · follower count with date · founder quote and photos · Bale channel URL · real reviews/UGC with consent · real authors and reviewers.
