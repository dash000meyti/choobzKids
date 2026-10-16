# Choobz Kids — Concept 01: «گالری آرام» Quiet Luxury Gallery

> One day of light, in one quiet room, with a few honest wooden objects, presented with the care of a design museum and the warmth of an Iranian home.

Status: art direction + UX concept for Phase 1 (public front end). Stack: Next.js 16.4 (App Router), React 19.3, TypeScript, Tailwind CSS v4.3, SQLite with Drizzle (better-sqlite3), one Docker volume at `/data`. Everything is self-hosted, with zero foreign runtime requests.

Persian copy below is production-intent sample copy. Ages, prices, materials and testimonials are **placeholders for layout** and must be replaced with verified brand data before launch. Seed testimonials and UGC must never go live as if they were real.

---

## 1. Big idea and emotional promise

**The big idea:** Choobz is not a shop. It is a **sunlit gallery in an Iranian home**. The page is a cream plastered wall. Daylight falls through an **Orosi**, the Persian sash window with coloured glass from the houses of Kashan and Shiraz. Its light passes slowly across a few wooden objects, each shown like a museum piece on a plinth with a small printed placard. Scrolling the page is living through one day: the visit opens in *your* real time of day (morning gold, noon white, afternoon amber) and always ends at night in the footer, where a lamp is on and the wooden duck rolls home. The objects never shout. Light, space and type do the work. Behind the restraint there is a mother's warmth: pencil height-marks on a doorframe, a saffron highlighter stroke under one word, a tiny sprout drawn in a margin. **The emotional promise to the Iranian mother:** *"You are not buying more stuff. You are preparing a calm, beautiful world where your child grows by themselves, and that world deserves to be treated like art."* «شما وسیله نمی‌خرید؛ دنیایی آرام می‌سازید که کودکتان در آن، به سبکِ خودش قد می‌کشد.»

### Three signature moments (the screenshots people will share)

1. **«نور اُرُسی» Orosi Daylight (home hero).** Coloured window light (saffron, sage, lapis and pomegranate panes under an arched lattice) falls diagonally across a cream wall and over a large wooden Pikler arch on a plinth. The reference is the famous morning light of Nasir al-Mulk in Shiraz, the most photographed light in Iran, resting on a Montessori object. The light matches the visitor's real clock (six dayparts) and drifts as they scroll. It is a still image and costs about 20 KB.

2. **«خط قد» The Growth Line (home + shop + product page).** A wooden doorframe height ruler, the kind Iranian families mark in pencil with *«آیلین — ۲ سالگی»*, is the site's age navigator. Ages sit at their real WHO median heights. A small duck pull-toy climbs the ruler as you scroll. On each product page, a **scale figure** (a faceless, Waldorf-style child silhouette) stands next to the dimensioned drawing of the product at the true height for 1, 2, 3, 4 or 6 years. Parents finally *see* how tall a learning tower is next to their own child.

3. **«نمایشگاه شما» Your Child, Exhibited (UGC salon wall).** Customer photos hang salon-style on a gallery wall in thin birch frames, each with a printed museum label: *«اثر: آیلین، ۲ ساله · شیراز · با برج یادگیری»*. The child is the artwork. One frame is always empty: *«این قاب، منتظرِ شماست.»* Every mother wants her child on that wall, and she will screenshot it when it happens. In Phase 2 a 4:5 "exhibit card" is generated server-side for Instagram Stories.

### The rules we never break

- No auto-playing carousels, no entry pop-ups, no countdown timers, no stock photos, no rainbow "kiddy" primaries, no cartoon mascot on every section.
- One idea per screen. Every section has a single focal object, a single headline and a single action.
- Poetry in the display text, plain words in links. Every poetic label is paired with its plain, searchable name, e.g. «تالار حرکت» next to "آرک، مثلث و دیوار صعود".
- Light moves, objects settle, and text never travels more than 12px.
- Nothing bounces except toys. The playful spring is reserved for the duck cart.

---

## 2. Visual language

### 2.1 Palette: «رنگ‌های خانه»

Named after materials of a Persian home and workshop. Contrast ratios were computed with the WCAG 2.x relative-luminance formula.

| Token | Persian name | Hex | Role | Contrast notes |
|---|---|---|---|---|
| `--plaster` | گچ | `#F5EFE4` | Page background, the wall | Base surface |
| `--paper` | کاغذ | `#FBF8F3` | Raised surfaces, placards, drawers | Base surface |
| `--birch` | توس | `#EADBC4` | Niches, mats, plinths, light wood fill | Walnut text on it **11.27:1** (AAA) |
| `--beech` | راش | `#C79A6B` | Wood mid-tone, grain, ply-edge stripes | **Decorative only**: 2.22:1 on plaster, never text. Walnut on beech is 6.03:1 (badges OK) |
| `--walnut` | گردو | `#2A241E` | Primary text, primary buttons, line art | On plaster **13.40:1**, on paper **14.47:1** (AAA) |
| `--bark` | پوستِ درخت | `#5E544A` | Secondary text, captions, metadata | On plaster **6.45:1**, on paper 6.97:1, on birch 5.43:1 (AA at every size) |
| `--sage` | مریم‌گلی | `#C4D6C1` | Instagram-style speech bubbles, TL;DR card, active chips | Walnut text **10.03:1**; sage-ink text 4.87:1 (AA) |
| `--sage-ink` | برگ | `#3D5C46` | Links, focus accents, "in stock" | On plaster **6.51:1**, on paper 7.04:1 (AA, AAA for large) |
| `--saffron` | زعفران | `#EDBE4F` | Highlighter mark behind one word; Orosi light | **Background only**. Walnut on saffron 8.82:1 |
| `--anar` | انار | `#A3412B` | Rare accent: hearts, safety callouts, sale price | On plaster **5.48:1**, on paper 5.92:1; paper text on anar 5.92:1 (AA) |
| `--lapis` | لاجورد | `#8EA6CF` | Orosi glass light, night glow; decorative only | Never text on light |
| `--night` | شب | `#1E1A16` | Footer ("night"), dark theme base | Moon text on it 14.24:1 |
| `--hairline` | خط | `rgb(42 36 30 / .14)` | 1px rules, card borders | Not a text color |

**Dark theme «شبِ گالری»** (follows `prefers-color-scheme`, with a manual toggle stored per viewer): `--bg #1E1A16`, `--surface #27221D`, `--text #F1E8DA` (14.24:1 on bg, 12.98:1 on surface), `--text-2 #BDB09E` (8.12:1), `--link #A8C7AD` (9.42:1), `--saffron-night #E3B54A`. At night the gallery is lamp-lit: Orosi light becomes a single warm lamp pool, and the lapis panes read as moonlight.

Color is used sparingly. About 85% of any screen is plaster, paper and wood. Saffron appears at most once per viewport, as the highlighter, and anar at most once per page.

### 2.2 Textures

- **Paper grain:** one 128×128 tileable WebP of luminance noise (about 1.5 KB) on `body::after` at 3% opacity, `position: fixed`, `pointer-events: none`. It gives the "printed catalogue" feel and also stops banding in the large light gradients.
- **Wood grain (procedural, baked offline):** a Node script (`scripts/textures.ts`, using simplex noise and sharp) generates tileable birch and beech grain tiles (256×1024, AVIF, 3–6 KB each), used on niche backs and plinths. **No runtime `feTurbulence`.** It is CPU-heavy, repaints on scroll on low-end Android, and differs between browsers.
- **Ply edge «لبهٔ چندلا»:** the core brand motif. Real Choobz products show their stacked plywood layers on every CNC-cut edge. We draw this as **7 alternating 1px lines** (birch, beech, birch…), done in CSS with `repeating-linear-gradient` and no images. It appears as:
  - section dividers (a 7px "plank");
  - the reading-progress bar on articles;
  - the free-shipping progress in the cart;
  - the four installment notches;
  - the edge of every placard and button underline on hover.
- **Light textures:** the Orosi lattice shadow and coloured panes are **pre-baked, pre-blurred AVIF images with alpha**, about 720px wide and 12–20 KB, scaled up about 2.5× with CSS. Blurred images compress extremely well, the upscale is invisible, and there are no runtime filters or blend modes.

### 2.3 Shapes and radii (CNC language)

Nothing has a sharp corner, because the products have none.

| Token | Value | Use |
|---|---|---|
| `--r-xs` | 6px | Chips, inputs |
| `--r-cnc` | 14px | Cards, placards, buttons (matches the router-bit rounding on real edges) |
| `--r-lg` | 24px | Drawers, sheets, large media |
| `--r-arch` | `999px 999px var(--r-cnc) var(--r-cnc)` | **«طاقچه» niche**: a portrait box with a semicircular top. It is cheap (pure `border-radius`) and echoes both the Persian wall niche and the Pikler arch |
| `--r-pill` | 999px | Dock, speech bubbles |

The pointed Persian arch «طاق جناغی» is used only once, as the Orosi window silhouette in the hero light. It is a `clip-path: path()` baked into the light image.

**Shadows:** objects only get **contact shadows**: a soft elliptical `radial-gradient` "floor" under each object, darker under the feet and fading outward. UI never floats on large drop shadows. Elevation comes from paper over plaster plus a hairline, and drawers get a single soft shadow `0 -8px 40px rgb(42 36 30 / .10)`.

### 2.4 Grid and space

- Mobile: 4 columns, 20px gutters, 20px side margins (above the 16px minimum).
- Desktop: 12 columns, max content width 1320px, 24px gutters. Hero and exhibits are allowed to break the grid.
- Section rhythm: `padding-block: clamp(72px, 4rem + 8vw, 192px)`. Negative space is the luxury, so we are generous.
- Base unit 8px, vertical rhythm in multiples of 8.
- All spacing uses **logical properties** (`ms-*`, `pe-*`, `start-*`, `inline-size`) so RTL is native rather than mirrored afterwards. Tailwind v4's `rtl:` variant is reserved for the rare icon that must flip, such as arrows.

### 2.5 Iconography

A custom set of about 28 icons, drawn in the **same line language as the duck logo**: 24px grid, 1.5px stroke, round caps and joins, tiny rounded terminals. They ship as one inline `<svg>` sprite (`<symbol>` plus `<use>`), with no icon library at runtime.

- The **cart icon is the duck pull-cart** from the logo. The count badge sits on the cart's back.
- Skill icons: hand (fine motor), foot (gross motor), balance beam, book, brush, little apron (practical life), speech bubble (language).
- Utility icons: ruler (age), kraft box (shipping), four dots on a plank (installments), seal (trust), Bale and Instagram as neutral outline glyphs with no brand colours.
- **Margin doodles:** the hand-drawn sprouts and hearts from Instagram return as pencil-weight doodles, at most one per section, in `--bark` at 60% opacity. They read like a mother's pencil notes in the margin of a museum catalogue.

### 2.6 Illustration style (Phase 1 has no product photos)

**"Architect's elevation, warmed by hand."** Each product is a precise, true-to-dimension drawing (front elevation or 30° axonometric) made from real measurements:

- **Line:** 1.25px `--walnut` line at the drawing scale, with slight stroke-width variation on silhouettes (outer 1.5, inner 1.0).
- **Fill:** flat `--wood-face` (birch) with **5–9 hand-placed grain strokes** per surface (not noise), `--wood-edge` (beech) on cut edges, and the **ply-edge stripes** on every visible edge. This is the detail that makes them unmistakably Choobz.
- **Light-reactive:** fills use CSS custom properties (`fill: var(--wood-face)`), so **illustrations warm with the daypart.** At dusk the birch shifts toward honey. A single highlight gradient follows the Orosi light angle (`--sun-angle`).
- **Contact shadow** under every object, plus an optional faint Orosi lattice shadow cast *across* the object in hero exhibits.
- **People:** children and mothers are **Waldorf-style faceless figures**, drawn as soft continuous lines with a round head and no facial features. This is a respectful nod to Waldorf dolls, and it avoids uncanny faces. Mothers in headscarves are drawn as gentle, dignified shapes, never caricatured.
- **System:** illustrations are built from a small kit of React Server Components (`<PlyEdge/>`, `<Rung/>`, `<HexHold/>`, `<Plinth/>`, `<ScaleChild age={24}/>`). Every product row in the DB has an `illustration_key` that maps to a component. They render on the server as inline SVG with zero JS, 3–8 KB each before compression, and are optimised with SVGO.

The design must work equally well with **illustration only**, **photo only**, or **both**. Every product "stage" is a fixed 4:5 niche with the same contact-shadow floor. A drawing or a cut-out photo on a seamless plaster background sits in it identically.

### 2.7 Photography art direction (for the CMS phase)

Written as a one-page brief for the workshop's photographer:

- **Light:** daylight only. Morning, side-lit from a window. For hero shots, place a **plywood Orosi gobo** (a lattice cookie with coloured gels, cut on Choobz's own CNC) in front of the window, so real photos carry the same light as the site. Real-world and illustrated brand become one.
- **Wall:** paint or print a seamless sweep in **`#F5EFE4` plaster**. Product photos then blend into the page with no cut-out, so the object simply *sits on the wall*.
- **Camera height:** **at the child's eye line (70–95cm)**, not adult top-down. This is a Montessori principle and it makes the objects heroic.
- **Grade:** 5200K warm white balance, lifted shadows, natural wood never orange, skin true, low saturation, no HDR.
- **Composition:** 4:5 vertical (good for mobile and for Instagram reuse). Keep 40% negative space **on the side opposite the text**. In RTL layouts text sits on the right, so place objects on the left.
- **Shot list per product:**
  1. hero (object only, Orosi light);
  2. in use (child's hands or body, face optional);
  3. ply-edge macro;
  4. scale (with a child, consent required);
  5. dimensions flat-lay;
  6. room context.
- **People:** real families, mothers often in hijab, never posed "stock smiles". Show hands, feet and concentration. Get written consent for every child image. Use first name and age only. **EXIF/GPS is stripped on upload**, which sharp does by default unless metadata is explicitly kept.
- **Files:** export at 2400px on the long edge, sRGB. The CMS stores a focal point so crops never cut the action.

---

## 3. Typography

### 3.1 Roles

This concept keeps the project's verified body and accent faces from `docs/FONTS.md` (Estedad, Mikhak, already in `src/fonts/`). It swaps one thing: the display face. Ario, the default display pick there, is chunky and joyful, which suits a playful direction but is too loud for a quiet gallery. The Gallery needs stroke contrast and a calligraphic pulse, so it uses Markazi Text. Markazi was put through the same fontTools checks as the other candidates, and the results are given below.

| Role | Family | Why | Files (self-hosted woff2, one combined fa + Latin subset built with `pyftsubset`, all layout features kept) |
|---|---|---|---|
| **Display** | **Markazi Text** (OFL, by Borna Izadpanah), variable `wght` 400–700, used at 500/600 | A refined, Naskh-rooted face with real stroke contrast. At hero sizes it gives "Persian calligraphic elegance" without kitsch, and almost no Iranian commerce site uses it. **Verified:** shaping is correct (`init/medi/fina/rlig`, GPOS `mark/mkmk/kern`), and ۴ ۵ ۶ ۷ are distinct Persian glyphs, not Arabic or Urdu forms. **Gaps:** there is no ۀ, no ٪ and no ZWNJ glyph, and the natural line box is tight (hhea 1.20) | `markazi-hero.woff2`: **glyph subset of the hero strings only, about 6–9 KB, preloaded**. `markazi-fa.woff2`: the full Persian subset, **about 31 KB** (47 KB with Latin), not preloaded |
| **Body / UI** | **Estedad** variable 100–900 with `ss01` round dots (the decided body face) | Very readable monoline sans on cheap Android screens. The round dots echo wooden beads. It is far less common than Vazirmatn, and the display face carries the uniqueness anyway, so the body stays quiet and bulletproof | `estedad-fa-wght.woff2`, **50.5 KB**, preloaded |
| **Accent «مداد» (pencil)** | **Mikhak** at wght 600, **`KSHD` kashida axis kept** (the decided accent face) | The mother's pencil voice: the height marks on the doorframe, children's names on UGC placards, and guestbook entries. Because it is a *font*, not SVG paths, it can render **dynamic text from the DB** (every child's name). The kashida axis gives the signature "pencil stroke stretches" moment (§4.3) | `mikhak-fa-600-kshd.woff2`, **26.3 KB**, lazy (no preload) |
| **Signature «امضا»** | A hand-lettered Nastaliq «چوبز», **converted to an SVG path** | Calligraphic warmth without shipping a Nastaliq font. Free Nastaliq fonts are 150–230 KB and hint poorly | 0 KB of font; one 1–2 KB inline path. Ideally commissioned from an Iranian calligrapher |
| **Latin eyebrow** | Estedad Latin, uppercase, `letter-spacing: .14em` (only on `[lang=en]`) | Echoes the geometric "CHOOBZ" wordmark | Included in the body font |

**Covering Markazi's gaps:**
- **ۀ and ٪** fall back to Estedad through the `font-family` stack. Content normalisation also stores «خانهٔ» as ه plus the combining hamza U+0654 (which Markazi has), never as the precomposed ۀ U+06C0, so display text never falls back.
- **ZWNJ** renders correctly in browsers, because it is default-ignorable. The server-side OG renderer (HarfBuzz) treats it the same way. We still test it in CI (§7.5 item 9).
- **The tight line box** means display line-heights never go below 1.28 (§3.2).

*Upgrade path:* commission a custom "Choobz Display" cut from an Iranian type foundry in Phase 3. The token system makes the swap a one-line change.

### 3.2 Fluid scale (360px to 1440px viewport; `rem` = 16px)

| Token | Range | Value | Line-height | Use |
|---|---|---|---|---|
| `--fs-hero` | 44 → 152px | `clamp(2.75rem, 0.5rem + 10vw, 9.5rem)` | 1.28 | Home H1 only (Markazi 600) |
| `--fs-d1` | 36 → 96px | `clamp(2.25rem, 1rem + 5.556vw, 6rem)` | 1.32 | Section and exhibit titles (Markazi 500) |
| `--fs-d2` | 28 → 64px | `clamp(1.75rem, 1rem + 3.333vw, 4rem)` | 1.38 | Page H1s for shop and articles (Markazi 600) |
| `--fs-h3` | 22 → 36px | `clamp(1.375rem, 1.083rem + 1.296vw, 2.25rem)` | 1.5 | Article H2, card titles on desktop, glossary wall text (Markazi 500) |
| `--fs-lead` | 18 → 24px | `clamp(1.125rem, 1rem + 0.556vw, 1.5rem)` | 1.85 | Deks, hero sub, TL;DR (Estedad 400) |
| `--fs-body` | 16 → 18px | `clamp(1rem, 0.958rem + 0.185vw, 1.125rem)` | 1.9 | Body, article prose (Estedad 400) |
| `--fs-small` | 14 → 15px | `clamp(0.875rem, 0.854rem + 0.093vw, 0.9375rem)` | 1.65 | Captions, placards (Estedad 400/500) |
| `--fs-label` | 13px | `0.8125rem` | 1.6 | Placard meta, eyebrows (Estedad 500) |
| `--fs-pencil` | 18 → 26px | `clamp(1.125rem, 0.958rem + 0.741vw, 1.625rem)` | 1.55 | Mikhak pencil notes, child names, guestbook |

The rem term in each `clamp()` keeps the text responsive to browser zoom (WCAG 1.4.4).

### 3.3 Persian specifics

- `<html lang="fa-IR" dir="rtl">`, and `:lang(fa) { letter-spacing: 0 !important; }`. **Never track Persian text**, because letter-spacing breaks the joins. Optical tightening of display type uses `word-spacing: -0.02em` only.
- **No `text-align: justify`** (kashida and spacing behave inconsistently across engines). Text is aligned to the start side. `hyphens: none`.
- Headlines use `text-wrap: balance` and body uses `text-wrap: pretty`, both safe for Persian.
- **Line-height is generous** because Persian has tall ascenders (ط ک گ) and deep descenders (ی ج ع) with dots. Use 1.28–1.38 for Markazi display (never below 1.28, since its natural box is only 1.20) and 1.9 for Estedad body. Line-heights are always explicit, never `normal`: this removes Mac and Windows line-box drift and font-swap CLS. Headlines are never clipped with `overflow: hidden` or `background-clip: text` without padding.
- **Measure:** `max-inline-size: 36rem` for prose, about 60–72 Persian characters.
- **Numerals:** **Persian digits (۰۱۲۳۴۵۶۷۸۹) everywhere in the UI**, produced by `Intl.NumberFormat('fa-IR')`. The Arabic thousands separator «٬» gives «۶٬۸۰۰٬۰۰۰ تومان» and the decimal separator is «٫». Digits are converted in code (`src/lib/format.ts`), never through font features, so the conversion works with every face, Mikhak included. **`tabular-nums` only in spec tables, the cart quantity stepper and the installment schedule.** Inline prices stay proportional, because `tnum` also widens the «٬» separators and spreads a price apart (verified in `docs/FONTS.md` §3.2). Machine-readable values stay Latin: `<data value="6800000">`, JSON-LD, `tel:` links.
- **Dates:** Solar Hijri via `Intl.DateTimeFormat('fa-IR-u-ca-persian')` → «۲۴ مهر ۱۴۰۵». ISO dates go in `<time datetime>` and schema.
- **Bidi hygiene:** Latin words inside Persian (Pikler, Montessori) are wrapped in `<bdi lang="en">`. Dimensions are written in words to avoid bidi scrambling of "×": «عرض ۴۵ · عمق ۶۰ · ارتفاع ۹۰ سانتی‌متر».
- **Content normalisation:** at seed time, on CMS save and on search queries, Arabic ي/ك become Persian ی/ک, ZWNJ «نیم‌فاصله» is enforced through a small lint, and common variants map to one entity (مونتسوری / مونته سوری → «مونته‌سوری»). Wrong characters silently kill Persian SEO, so this matters.

---

## 4. Home page blueprint

The home page is **one day**. The hero opens at the visitor's real daypart. A fixed, `pointer-events: none` "sky" layer (`body::before`, opacity only) warms toward dusk as you scroll, using `animation-timeline: scroll(root)`, and the footer is night. Sections 1–12 follow in order.

```
MOBILE (390×844) — HERO                     DESKTOP (1440) — HERO
┌───────────────────────────┐              ┌──────────────────────────────────────────────┐
│ ☰  CHOOBZ 🦆        ⌕  🛒 │              │ CHOOBZ   گالری  سن‌ها  اتاق  دفتر رشد  کارگاه  ⌕ 🛒│
│ ·صبح بخیر·  eyebrow       │              │                                              │
│ دنیایی چوبی،              │              │   ░░▒▒ Orosi light ▒▒░░        دنیایی چوبی،    │
│ برای قد کشیدن             │              │   ░▒  ╭───────╮  ▒░          برای قد کشیدن   │
│ sub (bio line)            │              │      ╱ Pikler   ╲             (152px Markazi) │
│ [ورود به گالری] [چند سالگی؟] │            │     ╱   arch     ╲            sub · 2 CTAs   │
│ ░▒▓ light ▓▒░             │              │   ═══ plinth ═════  ▭ placard                 │
│    ╭──────╮  arch on       │              │                                              │
│   ╱        ╲ plinth        │              │  ─── ply-line ───  scroll ↓                   │
│ ══════════  ▭ placard      │              └──────────────────────────────────────────────┘
└───────────────────────────┘
```

### 1. Hero: «نور اُرُسی» Orosi Daylight

- **Layout:**
  - **Mobile:** eyebrow, then a 2-line H1 at about 46px, the sub line, and two CTAs. The lower 42% of the first viewport is the exhibit: a Pikler arch on a plinth, with a small paper placard pinned at its foot.
  - **Desktop:** an asymmetric 7/5 split. The H1 sits on the right (start) at up to 152px. The arch exhibit sits on the left. The Orosi light falls from the top-left (end side) across both, so a panel of saffron light lands on the word «چوبی».
- **Copy:**
  - Eyebrow (decorative, set through CSS `content` per daypart and therefore not indexed): «صبح بخیر» / «ظهر بخیر» / «عصر بخیر — وقتِ بازی» / «شب بخیر — وقتِ قصه».
  - **H1** (one element, two spans): `<span class="display">دنیایی چوبی،<br>برای قد کشیدن</span>` + `<span class="h1-sub">اسباب‌بازی و سیسمونی چوبی مونته‌سوری، ساختِ کارگاه چوبز</span>`. The poem is visible, and the keywords sit in the same H1.
  - Sub: «کنار شما، برای ساختن دنیایی چوبی؛ جایی برای بازی، کشف و رشدِ کودکانِ سرزمینمون.»
  - CTAs: **«ورود به گالری»** (to `/shop`) and the quiet link «کودک شما چند سالشه؟» (to the Growth Line anchor).
  - Placard: «آرک پیکلر · چوب توس، روغن طبیعی · از ۸ ماهگی» (from data).
- **Motion:**
  - An inline `<head>` script (about 350 bytes) sets `data-daypart` on `<html>` before first paint. It reads the device clock, so the Iranian diaspora gets *their* light. Each daypart sets `--sun-x`, `--sun-angle`, `--sun-warmth` and `--wall-tint`. **One** light image serves every daypart: the custom properties move, rotate and warm it (a tint gradient layered on top), so the server can preload a single known URL. There is no transition on load and no layout shift. The server-rendered default is `noon`, so the page is still correct without JS.
  - On scroll, the light layer translates about 10vh and skews 3°, like the sun moving, using a CSS `view()` timeline (transform only).
  - The H1 fades in once over 600ms (opacity only, so LCP is not delayed).
  - The placard "settles" in with the wood spring, 8px.
  - With reduced motion, everything is static at the current daypart.
- **Data:** `home_blocks.hero` (copy, CTA targets, featured `product_id` for the exhibit and placard), plus `products` (name, age range, material).

### 2. Manifesto: «سه باور» (Three Beliefs)

- **Layout:** a single centred statement at `--fs-d1`, with a **saffron highlighter stroke** under «فرصت». Below it are three columns (stacked on mobile), each with a small line icon, a title and one sentence. A ply-line divider sits above.
- **Copy:**
  - Statement: «ما اسباب‌بازی نمی‌سازیم؛ <mark>فرصت</mark> می‌سازیم.»
  - «حرکتِ آزاد — بدنِ کودک، اولین معلمِ اوست.»
  - «چوبِ صادق — گرم، بی‌پرده، ماندگار؛ لایه‌هایش را پنهان نمی‌کنیم.»
  - «رشد به سبکِ خودش — هر کودک، تقویمِ خودش را دارد.»
  - Footnote: «الهام‌گرفته از مونته‌سوری و والدورف»
- **Motion:** the highlighter "draws" from right to left (RTL) through `background-size` 0 → 100%, tied to `view()` with `animation-range: entry 20% cover 40%`. It happens once, and there is no other motion.
- **Data:** `home_blocks.manifesto`.

### 3. The Growth Line: «خط قد»

- **Layout:**
  - **Mobile:** a tall section (about 6 short "chapters"). A vertical doorframe ruler is `position: sticky` on the right edge (24px wide), with cm ticks and pencil marks at WHO median heights: ۶ ماه (~۶۷cm), ۹ ماه (~۷۱), ۱ سال (~۷۵), ۱۸ ماه (~۸۲), ۲ سال (~۸۷), ۳ سال (~۹۶), ۴ سال (~۱۰۳), ۶ سال (~۱۱۶). Each chapter has the age in display type, one milestone sentence, 2–3 mini product placards and a link.
  - **Desktop:** the ruler is a full doorframe drawn in the centre, with chapters alternating on both sides like pencil notes.
- **Copy:**
  - H2: «کودکِ شما الان چه قدی است؟»
  - Sub: «از اولین چهاردست‌وپا تا اولین نقاشی روی دیوار؛ هر قد، دنیای خودش را می‌خواهد.»
  - Chapters:
    - «۶ ماهگی — نشستن، چنگ زدن، کشف»
    - «۹ ماهگی — چهاردست‌وپا و اولین بالا رفتن‌ها»
    - «۱ سالگی — اولین قدم‌ها»
    - «۱۸ ماهگی — من هم کمک می‌کنم! (آشپزخانه)»
    - «۲ سالگی — خودم!»
    - «۳ سالگی — قصه، رنگ، کتاب»
    - «۴ تا ۶ سالگی — صعود، تعادل، شجاعت»
  - Link per chapter: «همهٔ اشیای ۱ تا ۲ سال ←».
  - Pencil marks are set in Mikhak, the pencil voice: «آیلین — ۲ سالگی».
- **Motion:**
  - Pencil tick marks draw with `stroke-dashoffset` on a `view()` timeline.
  - **The pencil note "stretches":** as each tick finishes, its Mikhak label animates `font-variation-settings: "KSHD" 100 → 160` once. The joins lengthen like a pencil dragged along the frame. The DOM text stays clean, with no typed kashida, so search and copy and paste are unaffected. The label is a fixed-size box with `contain: layout`, so the font-variation layout work stays local. It is skipped under reduced motion.
  - **The duck pull-toy climbs the ruler** with a `translateY` linked to the section's `view()` progress, and its wheels rotate. The duck is CSS-only.
- **Data:** `age_bands` (slug, label, min/max months, median height cm, milestone copy) joined to `products` where the product's age range overlaps the band. All links are real `<a href="/shop/age/1-2-years">` and crawlable.

### 4. Niches: «طاقچه‌ها» (Categories as wall niches)

- **Layout:** category tiles are **arched niches** («طاقچه», where Iranian homes kept precious things). Each niche has a birch-grain back, a product drawing, and the name below in display type with a count.
  - **Mobile:** a horizontal `scroll-snap` row with 1.3 niches visible and an RTL-native snap start.
  - **Desktop:** an "alcove wall" of 3 large and 4 small niches in an asymmetric 12-column composition.
- **Copy:**
  - H2: «هر شیء، جای خودش را دارد.»
  - Niches: «برج یادگیری» · «آرک و مثلث پیکلر» · «دیوار صعود» · «کتابخانه و قفسه» · «رول نقاشی دیواری» · «میز و صندلی» · «اسباب‌بازی چوبی».
- **Motion:** on hover or focus (desktop), a soft daylight sweep crosses the niche back (pseudo-element `translateX`, 900ms) and the object rises 4px while its contact shadow tightens. On mobile, nothing moves except the native snap.
- **Data:** `categories` (name, slug, `illustration_key`, `cover_media_id` for Phase 2, product count, sort order).

### 5. The Exhibit: «شیءِ این فصل»

- **Layout:** a cinematic, near-full-viewport exhibit of one hero product (e.g. the learning tower). There is a large drawing on a plinth, a museum placard, and **three annotation callouts** with hairline leader lines (desktop) or numbered dots plus a list (mobile). The "ply-cut" magnifier is a circular inset showing the stacked layers of the edge.
- **Copy:**
  - Eyebrow: «شیءِ این فصل — پاییز ۱۴۰۵»
  - H2: «برج یادگیری؛ قدِ کودک، هم‌قدِ میزِ آشپزخانه.»
  - Callouts (from data, to be verified): «سه ارتفاعِ قابلِ تنظیم» · «لبه‌های گردِ CNC» · «پوششِ روغنِ طبیعی».
  - Placard: «برج یادگیری · تخته چندلای توس · برای ۱۸ ماه تا ۶ سال».
  - Price line: «۶٬۸۰۰٬۰۰۰ تومان · یا ۴ قسطِ ۱٬۷۰۰٬۰۰۰ تومانی با اسنپ‌پی».
  - CTA: «دیدنِ شیء».
- **Motion:** the drawing's line work **draws itself once** (stroke-dashoffset, 1.6s, `--ease-quiet`) and then the wood fill fades in. Leader lines extend 200ms after. The magnifier's ply layers slide apart 2px each (an exploded view) on a `view()` timeline.
- **Data:** `products.featured_rank`, `product_highlights` (3 items with anchor coordinates in drawing space), and the price from `product_variants`.

### 6. The Prepared Room: «اتاقِ آماده»

- **Layout:** a front-elevation drawing of a whole Montessori room wall: low shelf, front-facing bookshelf, paper roll, table and chair, Pikler arch. On mobile the wall pans horizontally (`overflow-x: auto`, snap points per object). **Hotspots** (small saffron dots) open placards.
- **Copy:**
  - H2: «مونته‌سوری از خانه شروع می‌شود؛ از ارتفاعِ چشمِ کودک.»
  - Sub: «چیدمانِ کاملِ اتاق، اندازهٔ قدِ فرزندِ شما.»
  - CTA: «مشاورهٔ رایگانِ چیدمان در بله».
- **Motion and tech:** hotspots use the native **Popover API** (`popovertarget`) with **CSS anchor positioning** for the placard, so there is zero JS. The fallback is a popover centred at the bottom. A dashed eye-line («خط دید کودک») at 70cm runs across the wall to teach the principle.
- **Data:** `room_setups` (name, objects with x/y in elevation space, bundle price, `product_ids`).

### 7. From the Workshop: «از کارگاه»

- **Layout:** a horizontal process strip of five steps. Mobile uses snap scrolling and desktop shows a row of five, each a line drawing with a large Persian numeral and one sentence. In Phase 2, step 2 can hold a self-hosted 6-second workshop loop (poster-first, played only when visible, `muted playsinline`, about 400 KB AV1/H.264).
- **Copy:**
  - H2: «هر شیء، پیش از رسیدن به خانهٔ شما، از دستانِ ما گذشته است.»
  - Steps: «۱ طرح» · «۲ برش» · «۳ سنباده» · «۴ روغن» · «۵ بسته».
  - CTA: «سری به کارگاه بزنید» (to `/workshop`).
- **Motion:** the numerals cross-fade as each step snaps into place. On desktop, sawdust specks (a 6-dot SVG) drift on hover only.
- **Data:** `home_blocks.workshop` and `pages.workshop`.

### 8. New in the Gallery: «تازه‌های گالری»

- **Layout:** a 2-column product-card grid on mobile (6 cards) and 4 columns on desktop (8 cards). The 5th slot on mobile is an **editorial interjection** card: «آرک یا مثلث؟ راهنمای سه‌دقیقه‌ای» (internal link to the magazine).
- **Copy:** H2 «تازه‌های گالری» and link «همهٔ اشیا ←».
- **Motion:** cards fade and rise 8px in a stagger (40ms, max 6), only on first view, with a CSS `view()` timeline.
- **Data:** `products` ordered by `published_at`, with the primary image or illustration, age range, min price and finishes.

### 9. Your Exhibition: «نمایشگاه شما» (UGC salon wall)

- **Layout:** a salon-hang wall of 5–9 frames in mixed sizes (4:5, 1:1, 3:4) with thin birch frames and placards. Mobile uses a two-column masonry built with CSS columns, with no JS layout. One empty frame is the CTA. Tapping a frame opens a native `<dialog>` lightbox.
- **Copy:**
  - H2: «زیباترین اثرِ این گالری، کودکِ شماست.»
  - Placard sample: «اثر: آیلین، ۲ ساله · شیراز · با برج یادگیری». The child's name is in Mikhak, as if written by the parent, and the rest is in Estedad.
  - Empty frame: «این قاب، منتظرِ شماست — عکستان را با #چوبز_کیدز برایمان بفرستید.»
  - Links: «۵۰ هزار خانواده در اینستاگرام» · «کانال بله».
- **Phase 1 with no photos:** frames hold illustrated vignettes (faceless figures on the arch or at the tower), so the wall looks intentional, never like a missing feature.
- **Motion:** each frame tilts 0.4° and settles on entry (wood spring). A tiny brass "picture light" glow sits above each frame at dusk.
- **Data:** `ugc_posts` (media, child first name, age in months, city, `product_id`, `consent_at`, status, sort order).

### 10. Guestbook: «دفترِ یادبود» (Testimonials)

- **Layout:** an open guestbook spread. Each page is an entry in Mikhak, the pencil voice, at `--fs-pencil`, with a signature line and a small product thumbnail. Mobile shows one page per snap with "page" scroll-snap and peek. Desktop shows a two-page spread with 3 entries.
- **Copy:**
  - H2: «آنچه خانواده‌ها در دفترِ یادبود نوشته‌اند»
  - Entry sample (placeholder): «از وقتی آرک آمده، رادین صبح‌ها اول سراغِ آن می‌رود…»
  - Signature: «مادرِ رادین · اصفهان».
  - Link: «رضایتِ شما در اینستاگرام ←».
- **Motion:** none beyond scroll-snap. A paper-curl shadow on the page edge is static CSS.
- **Data:** `testimonials` (body, author label, city, `product_id`, source, verified flag).
- **SEO:** testimonials are **not** marked up as `Review` site-wide, because self-serving reviews violate Google's guidelines. Only product-level real reviews get `Review` and `AggregateRating`.

### 11. Visitor Information: «پیش از آمدن، بدانید» (Installments, shipping, trust)

- **Layout:** styled as a museum's visitor-info desk. There are four quiet tiles on paper:
  - **SnappPay installments** with a mini calculator showing 4 notches on a ply-line;
  - shipping («ارسال به سراسر ایران»);
  - warranty and support;
  - **eNamad**.
- **Copy:**
  - «پرداخت در ۴ قسط با اسنپ‌پی — مثلاً ۴ × ۱٬۷۰۰٬۰۰۰ تومان» (terms to be confirmed with the SnappPay contract);
  - «بسته‌بندیِ کارگاهی، ارسال به همهٔ استان‌ها»;
  - «پشتیبانی در بله و تلفن»;
  - «نماد اعتماد الکترونیکی».
- **Motion:** the four notches fill on view in sequence.
- **Data:** `settings` (installments enabled, provider, number of parts, shipping copy, support channels) and the eNamad code.
- **Tech:** the eNamad seal is a domestic (Iranian) request, lazy-loaded below the fold with `loading="lazy"` and `referrerpolicy="origin"` as eNamad requires.

### 12. From the Growth Notebook + FAQ: «از دفترِ رشد» / «پرسش‌های شما»

- **Layout:**
  - **Articles:** one large editorial card (display headline, illustration, dek) plus two text-only cards. Above them sits a row of **sage speech-bubble question chips** in Instagram's own visual language, each linking to a short answer page: «پیکلر از چند ماهگی؟» · «برج یادگیری امن است؟» · «اتاق مونته‌سوری با بودجهٔ کم؟».
  - **FAQ:** 5 native `<details>` items with zero JS. The first one is open.
- **Copy:**
  - H2: «راهنماهای کوتاه و دقیق، برای والدینی که می‌خواهند آرام‌تر انتخاب کنند.»
  - FAQ examples:
    - «آرک پیکلر از چند ماهگی مناسب است؟»
    - «چوب و رنگِ محصولاتِ چوبز چیست؟»
    - «امکان خریدِ قسطی وجود دارد؟»
    - «ارسال چند روز طول می‌کشد؟»
    - «اگر اندازه مناسبِ خانه‌ام نبود؟»
- **Motion:** `<details>` opens with `interpolate-size: allow-keywords` and `::details-content` height transition (progressive). Bubbles have no motion.
- **Data:** `articles` (featured), `questions` (Q&A pages) and `faqs` where `scope='home'`. Emits `FAQPage` JSON-LD for answer-engine comprehension. Google shows FAQ rich results only for authoritative gov and health sites, but the markup still feeds AEO and GEO.

Then **Footer = Night** (see §5).

---

## 5. Header, navigation, footer, cart

### 5.1 Header

- **Mobile top bar (56px):** the logo duck plus "CHOOBZ" on the right (start), and search and menu on the left. It is transparent over the hero, then becomes `--paper` with a hairline after 40px of scroll. This uses a CSS `scroll()` timeline animating background opacity, with 0 JS.
- **Mobile bottom dock «داک»** (a 64px pill, 12px from the bottom, `env(safe-area-inset-bottom)` aware): **گالری · بر اساس سن · دفترِ رشد · سبد (duck cart + count)**. It is solid paper with a hairline, and **no `backdrop-filter`**, which is expensive on low-end Android. It is a **contextual dock** that changes with the page:
  - home and shop: the 4 tabs;
  - **product page:** the dock morphs into the **sticky buy bar**;
  - **article:** the dock morphs into a **reading pill** («فهرست · ۴۰٪») that opens the TOC sheet.
  - The morph is a shared `view-transition-name: dock`.
- **Desktop header (72px):** the logo, then «گالری» · «بر اساس سن» · «اتاقِ مونته‌سوری» · «دفترِ رشد» · «کارگاه», then search and the duck cart.
- **Mega menu: «نقشهٔ گالری» (Gallery floor plan).** Opening «گالری» reveals a museum floor-plan line drawing with six "wings":
  - «تالارِ حرکت» (آرک، مثلث، رمپ، دیوار صعود)
  - «آشپزخانهٔ کوچک» (برج یادگیری)
  - «تالارِ کتاب و رنگ» (کتابخانه، رول نقاشی)
  - «نشستن و کار» (میز و صندلی، قفسه)
  - «تالارِ بازی» (اسباب‌بازی)
  - «اتاقِ آماده»

  Hovering a link highlights its room on the plan. The menu itself is a plain `<nav><ul>` of links (crawlable, keyboard-first). The plan is a decorative `aria-hidden` SVG synced with `:has(a:hover, a:focus-visible)`, and it opens on `:focus-within` plus hover intent, with 0 JS. On mobile, «گالری» opens the same plan as a full-height sheet (`<dialog>`).
- **Search:** the full-screen overlay is loaded on first focus or tap (about 4 KB). Results come from a server action over **SQLite FTS5** (unicode61 tokenizer with `remove_diacritics`, Persian-normalised index). The `/search` page is `noindex`.

### 5.2 Cart drawer: «گاریِ شما»

- **Container:** a native `<dialog>` opened with `showModal()`, which gives a real focus trap, Esc to close and top-layer rendering. It slides in from the **left** on desktop (the end side in RTL) and is a **bottom sheet** on mobile. Entry and exit are animated with `@starting-style` plus `transition-behavior: allow-discrete`, so no animation library is needed.
- **Feel:** kraft-paper header strip, items as mini placards (drawing thumb, name, finish, price, `±` stepper), and a **free-shipping ply-line** filling up: «تا ارسالِ رایگان ۴۸۰٬۰۰۰ تومان مانده». It also shows the SnappPay line «یا ۴ قسطِ ۲٬۱۰۰٬۰۰۰ تومانی» and the CTA «ادامهٔ خرید». Empty state: the duck with an empty cart and «گاری خالی است؛ بیایید پرش کنیم.»
- **Add-to-cart moment:** a mini line icon of the product arcs into the dock cart (WAAPI, `--spring-toy`, 500ms). The **duck's wheels turn half a revolution** and the count ticks up. An `aria-live="polite"` region announces «به گاری اضافه شد». With reduced motion, only the count changes and the announcement plays.
- **State (Phase 1):** a tiny external store (`useSyncExternalStore` plus `localStorage`, wrapped in try/catch), with space reserved for the badge so there is no CLS. Prices are always re-validated on the server at checkout. Phase 2 moves to a cookie cart ID plus an SQLite `carts` table.

### 5.3 Footer: «شب» (Night)

- **Visual:** the page reaches night. The background is `--night`, and a single warm lamp-pool gradient sits top-centre. The **duck pull-toy rolls across the top edge on its string** as the footer enters (a `view()` timeline driving `translateX` and wheel `rotate`).
- **Copy:** «شب بخیر. فردا، بازیِ بعدی.»
- **Columns:**
  - تالارها (categories);
  - بر اساس سن;
  - دفترِ رشد (pillars, glossary, questions);
  - چوبز (کارگاه، درباره، «چوبز در یک نگاه»، تماس);
  - راهنمای خرید (ارسال، بازگشت، اقساط، پرسش‌ها).
- **Contact block:** phone shown in Persian digits with a `tel:` link in Latin digits, address, hours, Bale, Instagram and WhatsApp. It uses consistent NAP for local SEO.
- **Seals:** eNamad (lazy) and SnappPay partner badge (self-hosted image).
- **Bottom line:** «ساخته‌شده با چوب و حوصله، در ایران · © ۱۴۰۵».

---

## 6. Shop

### 6.1 Routes and indexing

| Route | Indexed | Notes |
|---|---|---|
| `/shop` | yes | «گالریِ اسباب‌بازی و سیسمونی چوبی» |
| `/shop/[category]` | yes | e.g. `/shop/learning-tower` → H1 «برج یادگیری مونته‌سوری» |
| `/shop/age/[band]` | yes | e.g. `/shop/age/1-2-years` → «اسباب‌بازی چوبی برای کودک ۱ تا ۲ ساله» |
| `/product/[slug]` | yes | One canonical URL regardless of category |
| `?skill=`, `?sort=`, multi-filter combos | `noindex, follow` + canonical to the parent | Prevents facet explosion |

Slugs are short, stable Latin (`learning-tower-classic`), which share cleanly on Bale and WhatsApp without percent-encoding. Persian keywords live in the title, H1, breadcrumb and copy. A `redirects` table (ready for Phase 2) keeps old slugs alive with 301s.

### 6.2 Listing page

- **Header:** breadcrumb, then H1 in `--fs-d2`, then a 50–90 word intro paragraph written as a direct answer («برای کودکِ ۱ تا ۲ ساله، اشیایی را انتخاب کنید که…»), then «راهنمای کامل ←». The floor plan's wing for the current category is shown as a tiny inset drawing.
- **Filters (they work without JS):** a GET `<form>`. With JS, chips auto-submit and use `router.replace` with `scroll: false` (about 1.2 KB).
  - **Mobile:** a sticky chip row: «سن» · «تالار» · «مهارت» · «مرتب‌سازی». Each opens a bottom-sheet `<dialog>`:
    - **سن**: a mini Growth Line, a vertical ruler with tappable pencil marks (radio/checkbox inputs styled as marks);
    - **تالار**: small niche icons;
    - **مهارت**: «حرکتِ درشت» · «حرکتِ ظریف» · «تعادل» · «استقلال و زندگیِ عملی» · «خلاقیت و هنر» · «زبان و کتاب»;
    - **مرتب‌سازی**: «تازه‌ترین · محبوب‌ترین · قیمت».
  - Applied filters appear as removable sage chips, and the result count is announced in `aria-live`.
  - **Desktop:** a sticky sidebar on the start side (right) holds the ruler and the checkboxes.
- **Grid rhythm:** 2 columns on mobile and 3–4 on desktop. **Every 7th slot is an editorial interjection**, either an article teaser or a "compare" card («آرک یا مثلث؟»). This builds internal links, AEO entry points and pacing, as a gallery wall text breaks a run of objects.
- **Pagination:** real `?page=2` links, progressively enhanced into «نمایشِ اشیای بیشتر» (append via server component fetch). There is no infinite scroll, so the footer is always reachable.

### 6.3 Product card: «پلاکارد»

```
┌──────────────────┐
│   ╭──────────╮   │  ← 4:5 niche stage, birch-grain back (arched top)
│  ╱  drawing   ╲  │     drawing or photo + contact shadow
│ │   or photo   │ │
│ ════ floor ═════ │
├──────────────────┤
│ برج یادگیری       │  ← Markazi 20px
│ ۱۸ ماه تا ۶ سال    │  ← bark 14px
│ ۶٬۸۰۰٬۰۰۰ تومان    │  ← walnut 16px, proportional digits
│ یا ۴ × ۱٬۷۰۰٬۰۰۰   │  ← sage-ink 13px
│ ● ● ○  finishes   │
└──────────────────┘
```

- The whole card is one `<a>`, with a visible focus ring (2px walnut plus 2px paper offset).
- Badges are words on the placard («تازه» · «سفارشی»), never stickers on the image.
- Desktop hover shows the daylight sweep across the stage, the object rises 4px and the shadow tightens. Mobile has no hover state.
- Media: when a photo exists, `next/image` uses `sizes="(max-width: 768px) 50vw, 25vw"` with AVIF and a dominant-colour placeholder from the DB. The first 2 cards get `fetchPriority="high"` and the rest load lazily.
- Shared element: the stage has `view-transition-name: product-{id}` and morphs into the product-page stage.

### 6.4 Product detail page

Mobile order (the desktop version is a 7/5 split with a sticky placard column):

1. **Breadcrumb**, small.
2. **Stage gallery:** a 4:5 `scroll-snap` carousel with no autoplay. Slides:
   1. hero (photo or drawing in Orosi light);
   2. **dimension drawing** (architectural, with dimension lines and arrowheads, values in Persian digits);
   3. **scale figure**;
   4. ply-edge macro;
   5. in-use photos (when they exist).

   Indicators are ply-tabs. A 1 KB island syncs the tabs, and swiping works with no JS.
3. **Placard:**
   - H1 «برج یادگیری کلاسیک»;
   - tagline «قدِ کودک، هم‌قدِ میزِ آشپزخانه»;
   - age chip «۱۸ ماه تا ۶ سال»;
   - rating (only if real reviews exist);
   - **price** «۶٬۸۰۰٬۰۰۰ تومان»;
   - **SnappPay line** «۴ قسطِ ۱٬۷۰۰٬۰۰۰ تومانی، بدونِ کارمزد برای شما» (wording per the contract).
4. **Variants:** finishes as wood swatches («طبیعی» · «سفید» · «مریم‌گلی») and size if any. These are **radio inputs**. All variant prices and installment amounts are server-rendered, and the checked one is shown with `:has(input:checked)`, so there is **zero JS for variant switching**. `?variant=` keeps it shareable and drives the `Offer`.
5. **CTA:** **«افزودن به گاری»** (walnut button) plus the secondary «پرسش قبل از خرید در بله». For high-ticket items, Iranian buyers want to chat first, so this is a feature, not clutter.
6. **Trust strip:** «ارسال به سراسرِ ایران · ۴ قسط · پشتیبانی · نماد اعتماد».
7. **«چرا این شیء؟»** A 40–60 word answer-first paragraph, then 3 developmental benefits with skill icons.
8. **«اندازه‌ها و جایش در خانه»:**
   - the **scale-figure moment**: the dimension drawing next to a faceless child silhouette;
   - age chips «۱ · ۲ · ۳ · ۴ · ۶ سالگی» change `--child-h` through `:has(#age-24:checked) { --child-h: 87 }`, and the figure scales by `calc(var(--child-h) * var(--cm))` (0 JS);
   - the line «کفِ لازم: ۵۰ × ۶۰ سانتی‌متر»;
   - and a 1:1 printable floor-footprint PDF (Phase 2).
9. **«جنس و ایمنی»:**
   - an **exploded ply-cut** of the edge, where layers separate on a `view()` timeline and each is labelled (veneer, core layers, finish);
   - then a real `<table>`: wood, finish, max load, weight, assembly time, warranty, certificates (only verified claims).
10. **«سن و مراحلِ استفاده»:** a Growth Line strip showing the usable range and the modes over time. For the arch, for example: «۸ ماهگی: تاب‌خوردن · ۱۸ ماهگی: بالا رفتن · ۳ سالگی: پل و تونل».
11. **«نصب و نگهداری».**
12. **«از ما پرسیده‌اند»:** product FAQ in `<details>`.
13. **«دفترِ یادبودِ این شیء»:** reviews (only real ones; schema only then).
14. **«بخوانید»:** 2–3 related articles from `article_products`.
15. **«در همین تالار»:** related products.

**Sticky buy bar (mobile):** it shows the price, the installment line and «افزودن به گاری», and replaces the dock. It appears **only after the main CTA scrolls out of view**. This is done with zero JS: the CTA exposes a named `view-timeline` and `timeline-scope` on `<main>` lets the bar animate against it. Where unsupported, the bar is always visible, which is fine.

**Installment calculator:** the server computes `ceil(price / 4 / 1000) * 1000` per part, and the last part absorbs the rounding. It is shown as four notches on a ply-line labelled «امروز · ماهِ بعد · دو ماه بعد · سه ماه بعد» (schedule per the SnappPay terms), with 0 JS.

**Structured data:**
- `Product` with `brand`, `material`, `audience` (`PeopleAudience` with `suggestedMinAge` and `suggestedMaxAge`), `additionalProperty` (dimensions), `image` and `offers`.
- **`offers.priceCurrency: "IRR"` with `price = toman × 10`.** Toman is not an ISO currency, and getting this wrong breaks every price-aware engine.
- `availability`, `BreadcrumbList`, `FAQPage`.
- Price and availability `<meta>` tags for **Torob and Emalls**, Iran's price-comparison engines and a major shopping-discovery channel. A Torob product feed endpoint follows in Phase 2.

---

## 7. Content hub: «دفترِ رشد» (The Growth Notebook)

The magazine is the SEO, AEO and GEO engine, so it is designed as **the most beautiful parenting publication in Persian** and is also rigidly structured for machines.

### 7.1 Information architecture

| Route | Type | Purpose |
|---|---|---|
| `/mag` | Hub | Seasonal "issue" masthead |
| `/mag/topic/[pillar]` | Pillar | 6 clusters: «مونته‌سوری در خانه» · «رشدِ حرکتی» · «بازی بر اساسِ سن» · «چیدمانِ اتاقِ کودک» · «سیسمونیِ هوشمند» · «والدگریِ آرام» |
| `/mag/[slug]` | Article | Long-form guide, comparison or list (flat URL, stable even if the pillar changes) |
| `/mag/questions` + `/mag/questions/[slug]` | **Answer pages** | One question per page, 300–700 words, the main AEO weapon |
| `/mag/glossary` + `/mag/glossary/[term]` | Glossary | `DefinedTerm` pages |
| `/mag/author/[slug]` | Author | E-E-A-T: credentials, photo, `sameAs` |
| `/facts` | «چوبز در یک نگاه» | Machine-quotable brand fact sheet |

### 7.2 Hub page

- **Masthead:** «دفترِ رشد» in hero-size display type with an issue line «شمارهٔ پاییز ۱۴۰۵». A seasonal issue framing signals freshness, which suits Kinfolk and suits crawlers.
- **Cover story:** a full-width editorial with a large illustration, a headline in `--fs-d1` and a dek.
- **«پرسشِ این هفته»:** a sage speech-bubble card holding the answer's first sentence.
- **«سن‌به‌سن»:** a horizontal Growth Line rail («۰–۶ ماه · ۶–۱۲ · ۱–۲ سال · ۲–۳ · ۳–۶») linking to age guides.
- **Pillar rows:** each with a pillar guide card plus 3 text cards (title, dek, reading time «۷ دقیقه»).
- **«واژهٔ امروز»:** a glossary teaser shown as museum wall text.
- **Latest:** a simple list with dates in Solar Hijri.

### 7.3 Article page: the reading experience

```
breadcrumb · pillar eyebrow
H1 (question-form when it is a query) — Markazi --fs-d2
dek — --fs-lead, bark
by «نویسنده» · reviewed by «بازبین» · ۲۴ مهر ۱۴۰۵ (به‌روزرسانی) · ۷ دقیقه
┌ خلاصه در ۳۰ ثانیه ───────────────┐  ← sage placard, 3–5 bullets
└──────────────────────────────────┘
[cover illustration / photo, captioned]
۰۱  H2 as a question?
    First sentence = direct answer (≤ 50 words). Then depth.
    [نکتهٔ مونته‌سوری] [ایمنی] [از تجربهٔ مادرها] [عددِ کلیدی]
    [inline product placard]  [comparison <table>]
…
منابع (numbered, linked)   ·   author box   ·   پرسش‌های پرتکرار   ·   مقالهٔ بعدی (full-bleed)
```

- **Prose:** Estedad 18px/1.9 with a 36rem measure. H2s carry hanging Persian numerals «۰۱» in the margin (start side). Pull quotes are in Markazi at `--fs-h3` with a saffron highlighter on one phrase.
- **TOC:**
  - **Desktop:** a sticky column on the end side (left), with the active item marked by a ply-line tick. It uses CSS `scroll-target-group` / `:target-current` where supported, and otherwise a 0.8 KB IntersectionObserver island on idle.
  - **Mobile:** the dock becomes the **reading pill** («فهرست · ۴۰٪»), which opens a TOC sheet.
- **Reading progress:** a ply-line along the top edge, `scaleX` on `animation-timeline: scroll(root)`, with 0 JS.
- **Callouts** (each a distinct, consistent component, also used as semantic hooks):
  - «نکتهٔ مونته‌سوری» (sage);
  - «هشدارِ ایمنی» (anar hairline plus icon);
  - «از تجربهٔ مادرها» (paper quote with signature);
  - «عددِ کلیدی» (a big numeral plus its source).
- **Product embeds:** a server-rendered horizontal placard (drawing, name, age, price, «دیدن»). Each embed is also recorded in `article_products` for reverse "بخوانید" links.
- **Author box:**
  - photo, name, role, credentials (e.g. a Montessori-trained guide);
  - a **«بازبینی‌شده توسط»** line for health-adjacent topics (pediatric OT or physiotherapist);
  - link to the author page.
- **Sources «منابع»:** numbered and linked to primary sources (WHO, AAP, the Pikler-Lóczy foundation, AMI). Generative engines prefer and cite pages that cite.
- **FAQ:** 3–6 `<details>` items plus `FAQPage`.
- **Next article:** a full-bleed card at dusk-tinted light, ending the "day" of reading.

### 7.4 Glossary: «واژه‌نامهٔ رشد»

- **Index:** a catalogue-style page with a sticky **Persian alphabet rail** (آ ا ب پ ت ث ج چ ح خ د ذ ر ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن و ه ی; letters without terms are dimmed). Terms are cards showing the term in display type, the original name (`<bdi lang="en">Pikler triangle</bdi>`) and a one-line definition.
- **Term page:** **the definition is the hero**, set as museum wall text, one 25–40 word sentence in Markazi at `--fs-h3`. That is exactly the sentence an answer engine will quote. Sections:
  - «ریشهٔ واژه»;
  - «در عمل» (with a small drawing);
  - «اشتباهِ رایج»;
  - «واژه‌های مرتبط»;
  - «اشیای مرتبط»;
  - «بیشتر بخوانید».

  It emits `DefinedTerm` plus `DefinedTermSet` and `BreadcrumbList`.
- **Seed terms:**
  - مونته‌سوری · والدورف · پیکلر (Emmi Pikler) · مثلث پیکلر · آرک پیکلر · برج یادگیری;
  - محیطِ آماده‌شده · زندگیِ عملی · دورهٔ حساس · بازیِ پایان‌باز;
  - حرکتِ درشت · حرکتِ ظریف · حسِ عمقی · حسِ دهلیزی · کتابخانهٔ روبه‌رو · چرخشِ اسباب‌بازی.
- **Auto-linking:** the first occurrence of a glossary term in any article becomes a link with a dotted underline. It is computed at render time on the server.

### 7.5 The SEO / AEO / GEO layer (built into templates, so editors cannot forget it)

1. **Answer-first anatomy, enforced by the content model.** Every article and answer has `primary_question`, `short_answer` (≤ 50 words, rendered first and reused as the meta description and FAQ answer), `key_takeaways[3–5]`, `faq[]`, `sources[]`, `author_id`, `reviewer_id` and `updated_at`. H2s are phrased as real queries («پیکلر از چند ماهگی مناسب است؟»), and the first sentence under each H2 answers it.
2. **Entity consistency:** one canonical Persian name per entity, with `alternateName` variants (مونتسوری، مونته سوری) and the original Latin name. Articles declare `about` (glossary `DefinedTerm`s) and `mentions` (products).
3. **Schema per template:**
   - home: `Organization` (logo, `sameAs` Instagram/Bale, contactPoint) plus `WebSite` with `SearchAction`;
   - listing: `CollectionPage` plus `ItemList`;
   - product page: as in §6;
   - article: `Article` with `author` and `reviewedBy` `Person`, `citation`, `datePublished` and `dateModified`, plus `FAQPage`;
   - glossary: `DefinedTerm`;
   - every page: `BreadcrumbList`.
4. **Machine-friendly alternates:**
   - `/llms.txt` (brand summary plus key URLs) and `/llms-full.txt`;
   - a clean **Markdown alternate for every article** (`/mag/[slug].md`, advertised with `<link rel="alternate" type="text/markdown">`);
   - `/feed.xml`;
   - a segmented sitemap index (products, categories, articles, questions, glossary) with `lastmod` from DB `updated_at`.
5. **`/facts` page «چوبز در یک نگاه»:** founding year, workshop, materials, safety, shipping coverage, installments, warranty, contact. Each is a short, dated, verifiable statement. LLMs quote fact sheets.
6. **Crawler policy:** `robots.txt` allows Googlebot, Bingbot, **OAI-SearchBot, GPTBot, PerplexityBot, ClaudeBot and Google-Extended** (GEO needs to be readable). The `/search` page and cart are disallowed.
7. **Original data as a GEO moat:** an annual «گزارشِ بازیِ کودکِ ایرانی» built from Instagram polls of 50K followers, published with charts and a methodology section. Unique Persian data is what generative engines cite.
8. **Persian hygiene:** character normalisation, ZWNJ, Solar Hijri plus ISO dates, `lang="fa-IR"`, and a self-referencing canonical on every page.
9. **OG images:** generated server-side with **sharp/librsvg (HarfBuzz shaping)** using the self-hosted fonts registered with fontconfig in the Docker image. Satori/`next/og` has historically shaped Persian poorly. Images are cached in `/data/uploads/og/`.

---

## 8. Motion system: «آرام، سنگین، روشن» (Calm, weighty, luminous)

### 8.1 Principles

1. **Light moves slowly.** 1.2–2.4s, or tied to scroll, and never looped.
2. **Wood has weight.** Objects settle with a near-critically-damped spring and about 1.5% overshoot, and never bounce.
3. **UI answers instantly.** Taps and toggles respond in 120–200ms, because INP comes first.
4. **Toys are allowed to play.** The duck cart and add-to-cart get the one playful spring.
5. **Only transform and opacity animate**, plus `background-size` for the one highlighter stroke. No layout properties animate.
6. **Motion is enhancement.** Every animation is inside `@media (prefers-reduced-motion: no-preference)` and, for scroll timelines, `@supports (animation-timeline: view())`.

### 8.2 Tokens

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 120ms | Press states, chip toggles |
| `--dur-quick` | 200ms | Popovers, focus, tab switches |
| `--dur-calm` | 420ms | Drawers, sheets, card reveals |
| `--dur-slow` | 800ms | Placard settle, section reveals |
| `--dur-light` | 1600ms | Line-drawing, light sweeps |
| `--ease-quiet` | `cubic-bezier(.22,.61,.36,1)` | The default ease-out |
| `--ease-light` | `cubic-bezier(.45,0,.2,1)` | Symmetric, for light sweeps |
| `--ease-exit` | `cubic-bezier(.4,0,1,1)` | Exits (short) |
| `--spring-wood` (≈560ms) | `linear(0, 0.102, 0.307, 0.521, 0.7, 0.832, 0.919, 0.972, 1, 1.012, 1.015, 1.014, 1.011, 1.008, 1.005, 1.003, 1.001, 1)` | ζ=0.8, 1.5% overshoot: placards, cards, drawers |
| `--spring-toy` (≈600ms) | `linear(0, 0.107, 0.339, 0.592, 0.808, 0.961, 1.051, 1.09, 1.093, 1.077, 1.053, 1.03, 1.012, 1, 0.993, 0.991, 0.992, 0.994, 0.996, 0.998, 1)` | ζ=0.6, 9% overshoot: duck cart and fly-to-cart only |

The springs are precomputed into CSS `linear()` at build time, so they run in CSS and WAAPI with no runtime physics. Where JS motion is needed (fly-to-cart, drawer drag-to-dismiss), we use **Motion's mini `animate()`** (WAAPI-backed, about 2.5 KB) with the same spring parameters, lazy-loaded inside the island. `motion/react` is never bundled on public pages.

### 8.3 Scroll-driven inventory (all CSS, 0 JS)

- Hero light drift (`view()`)
- Day-arc sky warming (`scroll(root)`, opacity)
- Header paper fill (`scroll()`)
- Highlighter draw
- Growth-ruler pencil ticks and duck climb
- Ply-cut explode
- Card first-view reveal
- Reading progress
- Sticky buy bar (`timeline-scope`)
- Footer duck roll

They run in Chromium and Safari 26+. Elsewhere the content is static and already in its final state. **The final state is the default CSS**, so nothing is ever hidden waiting for JS.

### 8.4 Page transitions

These are same-document View Transitions using React 19.3's `<ViewTransition>`. In Next 16.4 they work in the App Router **with no configuration**, because route navigations are already transitions. Without browser support, navigation works normally and simply does not animate.

- **Default «ابرِ گذرا» (a passing cloud):** the old page dims to 0 in 160ms under a 4% warm overlay, as if a cloud passed the window. The new page fades in over 280ms.
- **Direction is RTL-aware.** Links declare intent with `<Link transitionTypes={['deeper']}>` (into a product or article) or `['shallower']` (breadcrumbs, back to a listing). `<ViewTransition enter={{ deeper: 'from-end', shallower: 'from-start', default: 'fade' }}>` maps the types to CSS classes. "Deeper" content arrives 12px **from the left (the end side in RTL)**, and "shallower" content arrives from the right.
- **Shared elements:**
  - product card stage → product-page stage;
  - niche → category header;
  - article card title → article H1;
  - dock ↔ buy bar ↔ reading pill.
- **Reduced motion:** `::view-transition-group(*) { animation-duration: 0s }`. The swap is instant and still smooth, with no flash.

---

## 9. Performance plan

**Targets** (Moto G-class device on 4G, first visit): LCP ≤ 1.6s on home, ≤ 2.0s everywhere; CLS ≤ 0.02; INP < 120ms; HTML ≤ 60 KB brotli; CSS ≤ 25 KB brotli; first-party island JS ≤ 15 KB gz eagerly loaded per page, on top of the fixed framework cost.

### 9.1 Rendering

- **Everything is a React Server Component by default.** Pages use Next 16 **Cache Components** (`cacheComponents: true`): query functions in `src/db/queries` are `"use cache"` with `cacheTag('product:{slug}')`, `cacheTag('category:{slug}')`, `cacheTag('home')` and similar, plus `cacheLife('hours')`.
- **Build-time vs. runtime DB.** With Cache Components, `generateStaticParams` must return **at least one param** (an empty array is a build error), so the build needs data. The Docker **builder stage** runs migrations and the seed into an ephemeral DB (`DATABASE_PATH=/tmp/build.db`) and prerenders every seeded product, category, article and term. The **runner stage** points at `/data/choobz.db` in the volume, and its entrypoint migrates it and seeds it once if empty. In Phase 1 both databases come from the same seed, so the prerendered HTML is identical.
  - New slugs added later render **blocking on first visit** (`params` awaited outside `<Suspense>`), so crawlers always get complete HTML rather than a fallback shell, and the result is then cached.
  - Phase 2 CMS writes call `revalidateTag()`, or `updateTag()` inside server actions for read-your-own-writes.
  - HTML responses carry `s-maxage` plus `stale-while-revalidate`, so a **domestic CDN** (e.g. ArvanCloud) can cache them at the edge in Iran.
- **The only dynamic hole is the cart badge**, rendered client-side into reserved space. No `proxy.ts` (formerly middleware) runs on public routes.
- **React Compiler** is enabled (stable in Next 16) to keep re-renders and INP minimal in the islands.
- **SQLite:** better-sqlite3 in WAL mode, read-mostly, with prepared statements in `src/db/queries`. Reads take microseconds, so cache misses stay cheap (TTFB about 80–200ms from an Iranian data centre).

### 9.2 Client islands and JS cost (gzipped estimates; verify with `next build` and the bundle analyzer)

| Island | Where | Strategy | Est. |
|---|---|---|---|
| Framework (React 19.3 + Next router) | all | fixed | ~95–110 KB (measured, not ours to shrink) |
| Daypart script (inline, not React) | all | `<head>`, CSP-hashed | 0.35 KB |
| `CartBadge` + store | all | hydrate | 1.5 KB |
| `CartDrawer` | all | `import()` on first open or idle | 5–7 KB (lazy) |
| `AddToCart` + fly-to-cart (Motion mini) | product page | hydrate; Motion loaded on first click | 1 KB + 2.5 KB lazy |
| `GalleryTabs` (sync dots) | product page | hydrate when visible | 1 KB |
| `FilterAutoSubmit` | shop | hydrate | 1.2 KB |
| `SearchOverlay` | header | `import()` on focus | 4 KB (lazy) |
| `TocSpy` (fallback only) | article | idle, if CSS scroll-markers are unsupported | 0.8 KB |
| `Dialog` invokers | UGC lightbox, sheets | native `command`/`commandfor`, 0.3 KB fallback | 0.3 KB |
| **Zero-JS by design** | — | variants (`:has`), installments, FAQ (`<details>`), room hotspots (Popover + anchor positioning), scale figure, buy bar, reading progress, carousels (scroll-snap), mega menu | 0 KB |

**Home page first-party eager JS ≈ 2 KB, and product page ≈ 5 KB.** Everything else is lazy.

### 9.3 LCP element per page

| Page | LCP element | How it stays fast |
|---|---|---|
| Home | **H1 text** (display font, hero glyph subset) | Text LCP; preloaded 6–9 KB subset; `font-display: swap` with a hand-measured Tahoma fallback (§9.4). The inline SVG arch is not an LCP candidate. Chrome *can* count a large `url()` background, so the Orosi light (one 12–20 KB AVIF) is preloaded with `fetchpriority="high"` and finishes with the H1 either way |
| Shop listing | H1 text, or the first card photo once photos exist | First 2 card images `fetchPriority="high"`; AVIF at the correct `sizes` |
| Product page | Stage: H1 text when the stage is an SVG drawing; **the first photo** when one exists | `<link rel="preload" as="image" imagesrcset>` for slide 1 only; 4:5 AVIF ≤ 70 KB at 828w; dominant-colour placeholder |
| Article | H1 text (the cover sits below the TL;DR on mobile) | Cover is lazy on mobile; ≤ 45 KB AVIF |
| Glossary term | Definition wall text | Pure text |

### 9.4 Fonts

- Fonts are self-hosted through `next/font/local` from `src/fonts/`. They are woff2 only, built from upstream files (not Fontsource splits, which strip stylistic sets) with `pyftsubset --layout-features='*'`, so Persian joining, marks and `ss01` survive (pipeline in `docs/FONTS.md` §5.3).
- **Only 2 files are preloaded:**
  - `markazi-hero.woff2`, about 6–9 KB: only the glyphs of the hero strings.
    - **Phase 1:** generated by `npm run fonts:hero` from the seeded hero copy.
    - **Phase 2:** the CMS regenerates it on publish with HarfBuzz's subsetter compiled to WASM (the `subset-font` package), writing a content-hashed file to `/data/uploads/fonts/`. That file is declared with a hand-written `@font-face` and `<link rel="preload">`, because `next/font/local` only handles files known at build time.
  - `estedad-fa-wght.woff2`, 50.5 KB.
- **Not preloaded:** the full `markazi-fa.woff2` (about 31 KB), which loads on first use below the hero, and Mikhak (26.3 KB).
- **Fallback metrics:** `next/font`'s automatic fallback only offers Arial or Times New Roman and measures Latin glyphs, so it is set to `adjustFontFallback: false`. We write our own fallback `@font-face` on `local("Tahoma")`, with `size-adjust`, `ascent-override` and `descent-override` measured against Persian specimen strings by a small script. Combined with explicit line-heights, the swap causes no measurable CLS. `font-synthesis: none` prevents faux bold.
- **Total:** about 117 KB, of which **about 58 KB is critical**. All files are cached as `immutable`.

### 9.5 Images and the `/data` volume

```
/data
├── choobz.db (+ -wal, -shm)
└── uploads/
    ├── originals/2026/10/{uuid}.jpg
    ├── derived/{uuid}/{360,540,720,960,1280,1600,2048}.{avif,webp}
    └── og/{type}-{id}-{hash}.png
```

- Derivatives are **pre-generated at upload time with sharp** (Phase 2). In Phase 1 the seed script generates them for any seed images. Each upload stores `width`, `height`, `dominant_color`, `focal_x/y` and `alt` (required) in a `media` table. The result is zero CLS, no runtime optimiser CPU and deterministic URLs.
- Files are served by a route handler `/media/[...key]` (streaming, ETag, `Cache-Control: public, max-age=31536000, immutable`). A custom `next/image` loader maps `src` plus width to the derived file.
- Product SVGs: above the fold they are inlined (RSC). Below the fold, repeated listing-grid drawings are `<img loading="lazy">` static SVG files, with dark-mode colours handled inside the SVG through `prefers-color-scheme`.
- **Uploaded SVGs (Phase 2) are sanitised or rasterised** (XSS risk).

### 9.6 CSS and third parties

- Tailwind v4 compiles to one stylesheet (about 18–25 KB brotli). Design tokens live in `@theme`, and dayparts are custom variants (`@custom-variant dusk (&:where([data-daypart=dusk], [data-daypart=dusk] *))`). We test `experimental.inlineCss` for first-visit LCP against cache benefit.
- **No third-party scripts:** no Google Fonts, no GA, no foreign CDNs, no Instagram embeds (Instagram is filtered in Iran and embeds are heavy).
- The only external requests are domestic: the lazy eNamad seal, and SnappPay at checkout only.
- Analytics: optional self-hosted Umami in the same compose stack (about 2 KB, deferred).
- **Budgets enforced in CI:** Lighthouse CI with throttled mobile, `next build` route-size diff, and Playwright visual and CLS checks.

---

## 10. Risks and mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Restraint reads as "empty" or "not for kids"** to mothers used to colourful Iranian shops | Warmth carries the minimalism: Instagram-native sage bubbles, the saffron highlighter, doodles, faceless children in every drawing, emotional copy, and the UGC wall with real families. Test the hero with 8–10 real followers (5-second test plus preference) before building further |
| 2 | **No product photos yet**, and drawings may feel less "real" when deciding a ۶-million-Toman purchase | Drawings are true-to-dimension and paired with the scale figure, which is *more* informative than photos. Workshop phone shots follow the §2.7 brief (plaster sweep, eye-line) within weeks. Each stage slot accepts a drawing or a photo with identical framing |
| 3 | **Light effects jank on low-end Android** | Pre-baked AVIF light; transform/opacity only; no `backdrop-filter`, blend modes or runtime filters. The inline script sets `data-lite` when `navigator.connection.saveData` is on or `deviceMemory ≤ 2`, which turns the light static and disables the sky layer |
| 4 | **Persian font CLS or FOUT** in the huge H1; **Markazi's gaps** (no ۀ, ٪ or ZWNJ glyph; tight 1.20 line box) | Preloaded hero glyph subset, metric-matched fallback, explicit line-heights of at least 1.28, and `text-wrap: balance`. Estedad covers ۀ and ٪ through the font stack. A CI specimen test renders every `home_blocks` headline in headless Chromium and fails on fallback glyphs inside display text. Tested on Samsung and Xiaomi default fonts and the iOS Geeza fallback |
| 5 | **Browser support** for scroll timelines, anchor positioning, `<ViewTransition>` and invokers | Strict progressive enhancement: the default CSS is the final state, and every feature is behind `@supports`. The site is fully usable in Firefox and older Safari |
| 6 | **Poetic labels hurt findability** («تالارِ حرکت», «طاقچه‌ها») | Poetry for display only. Every link, H1, title and breadcrumb uses plain search terms |
| 7 | **SEO pitfalls:** facet explosion, thin glossary pages, IRR/Toman mistakes, wrong ی/ک, AI-sounding articles | Indexing matrix (§6.1); minimum content rules for glossary pages (definition, «در عمل», related); IRR ×10 in schema; normalisation; named expert authors and reviewers with sources; original survey data |
| 8 | **Iran network realities:** foreign crawlers blocked during disruptions; foreign services unreachable | Host in an Iranian data centre with international transit, behind a domestic CDN that serves both sides; zero foreign runtime dependencies; monitor Googlebot and Bingbot reachability; sitemaps with honest `lastmod` so recovery is fast after outages |
| 9 | **Caching vs. a DB that only exists at runtime** (Docker volume); Cache Components rejects an empty `generateStaticParams` | The builder stage prerenders from an ephemeral seeded DB, and the runner uses `/data/choobz.db` (§9.1). Tags plus `cacheLife('hours')` reconcile the two after Phase 2 edits, and new slugs render blocking on first visit. Optionally put the Next cache on `/data/cache` so restarts stay warm |
| 10 | **SQLite in one volume:** single writer, backups | WAL mode, a single container (the right scale for this shop), `VACUUM INTO` nightly snapshots plus rsync of `/data/uploads` to domestic S3-compatible object storage. Phase 2 writes go through one server-action layer |
| 11 | **Fabricated trust content:** seed testimonials, UGC or claims going live | Seeds carry `is_placeholder=1`, and production queries filter them out. Material, safety and SnappPay terms are blocked from publishing without a `verified_at` field |
| 12 | **Children's privacy** in UGC | Written consent stored (`consent_at`); first name, age and city only; EXIF/GPS stripped; removal on request within 48h, and the policy is published |
| 13 | **Time-of-day light confuses or clashes with dark mode** | The clock only tints the hero light. `prefers-color-scheme` alone decides the palette, and a manual toggle is stored per viewer |

---

## Appendix A: Content model sketch (Drizzle, ready for the Phase 2 CMS)

`products` (slug, name, tagline, `short_answer`, description blocks JSON, `illustration_key`, `age_min_months`, `age_max_months`, `primary_category_id`, `featured_rank`, status, `published_at`, `updated_at`, `is_placeholder`) · `product_variants` (sku, finish, size, `price_toman`, `compare_at_toman`, stock, `is_default`) · `product_media` · `product_highlights` (label, x, y) · `product_specs` (key, value, unit, `verified_at`) · `categories` (slug, name, wing, `illustration_key`, `cover_media_id`, intro) · `age_bands` (slug, label, min/max months, `median_height_cm`, milestone) · `skills` + `product_skills` · `room_setups` + `room_items` · `articles` (type: guide | compare | list | answer, slug, `primary_question`, `short_answer`, `key_takeaways` JSON, body blocks JSON, `pillar_id`, `author_id`, `reviewer_id`, `published_at`, `updated_at`) · `article_products` · `pillars` · `authors` (credentials, `sameAs`) · `glossary_terms` (term, `alt_names` JSON, `latin_name`, definition, body) · `faqs` (scope: home | product | category | article, `ref_id`, q, a, sort) · `sources` · `testimonials` · `ugc_posts` (`consent_at`) · `media` (key, mime, w, h, `dominant_color`, focal, alt, credit) · `home_blocks` (key, JSON, sort, enabled) · `pages` · `settings` (key/value) · `redirects` · `search_index` (FTS5 virtual table).

Body content is stored as **typed JSON blocks** (paragraph, heading, callout, product-embed, table, figure, faq), not raw HTML or MDX. That way the TOC, TL;DR, FAQ schema, Markdown alternates, `llms-full.txt` and glossary auto-linking are all *derived*. The Phase 2 editor writes blocks, and the templates guarantee the structure.

## Appendix B: Why this concept wins

- **Rooted, not decorated.** Orosi light, the «طاقچه» niche and the doorframe height marks are three deeply Iranian domestic memories, made in a Scandinavian-museum language. No Iranian brand, and no global kids brand, has this.
- **The product's own truth is the motif.** The ply edge is the brand's real material signature, turned into the site's divider, progress bar and installment meter.
- **Beauty that sells.** The scale figure, Growth Line and installment notches each answer a buying question («چقدر بزرگ است؟», «برای سنِ بچهٔ من؟», «می‌توانم قسطی بخرم؟»).
- **Built for machines without looking like it.** Answer-first templates, glossary wall text, the facts page, Markdown alternates and IRR schema.
- **Fast because it is calm.** Text LCP, pre-baked light, CSS-only motion, about 2 KB of first-party JS on the home page.
