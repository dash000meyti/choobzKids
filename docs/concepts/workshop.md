# Living Workshop · کارگاه زنده

**Art direction and UX concept for choobz.kids, Phase 1 (public front-end)**
Concept date: ۲۴ مهر ۱۴۰۵ (2026-10-16) · Stack: Next.js 16.4 (App Router, Cache Components, Partial Prefetching) · React 19.3 · Tailwind CSS v4 · SQLite + Drizzle · a single Docker volume at `/data`

> **Thesis.** The website isn't a shop window in front of the workshop. It **is** the workshop. Every surface is a piece of birch plywood cut for this page. Every product drawing is made from Choobz's own CNC cut files. Every page gets put together in front of you by two hands: the **maker's hand**, which is precise, engraved and measured, and the **mother's hand**, which is warm and brings highlighter, doodles and mint speech bubbles.

| | |
|---|---|
| Concept | Living Workshop: the site works like a real plywood workshop |
| Motion grammar | **Cut → Lift → Place** (the way the products are actually made) |
| Two voices | Maker's hand (laser lines, dimensions, mono labels) + Mother's hand (mustard highlighter, sprouts, mint bubbles) |
| Signature moments | ① Flat-pack hero «از ورق تا بازی» · ② Tree-ring age finder «حلقه‌های رشد» · ③ Live laser name engraving «اسمش را روی چوب حک کن» |
| Technical stance | Server-rendered SVG + modern CSS (scroll-driven animations, `linear()` springs, Popover, `:has()`, `@starting-style`, View Transitions). About 10 KB (brotli) of island JS on the home page |
| Honesty rule | Nothing on the site pretends. Real cut files, real dimensions, real reviews, verified claims. Items marked ⚑ below must be confirmed with the workshop before launch |

---

## 1. Big idea and emotional promise

When an Iranian mother buys a learning tower, she's buying more than furniture. She's buying a promise: her child will stand at the counter next to her safely, climb without her worrying, and grow up with something honest in their hands. Kids' sites usually hide how things are made behind stock smiles. **Living Workshop puts the making on stage.** In her first two seconds she watches a sheet of birch become a learning tower. A minute later she sees the exact platform height drawn next to a peg-doll figure as tall as her 18-month-old. Then she types her daughter's name and watches a laser write it, right to left like a Persian hand, onto the top step. Every interaction makes the same quiet promise:

> «چیزی که برای کودکتان به خانه می‌برید، از دست کسی گذشته که به کودک شما فکر کرده است.»
> *What you bring home for your child has passed through hands that thought about your child.*

It rests on three proofs, and every page carries at least one of them:
1. **Honest material.** You see the cut file, the ply layers, the grain and the finish.
2. **Care.** Every edge is sanded, and the site shows it in motion. Every claim has a source.
3. **Growth.** Products grow with the child, so the whole site is organised by *rings of growth*.

**Why nobody can copy it.** The product drawings come from Choobz's own DXF cut files: the hero literally *is* their nesting layout. The motion grammar is their manufacturing process. The age system is a tree cross-section. The type system writes right to left with a laser. The cultural details belong to Iran: «شناسنامه» for every product, a warm low-light *night-feed mode* for 2 a.m. scrolling, and a گره‌چینی lattice window in the illustrated room. A competitor could copy the colours. They'd have no way to copy the cut files, the workshop or the story.

### Three signature moments (the screenshots people will share)

**① «از ورق تا بازی»: the flat-pack hero.**
The hero opens on one birch sheet with the CNC toolpaths lightly engraved on it. A glowing laser dot traces the last cut. The pieces lift out of the sheet and leave their silhouettes behind as holes. They rotate in mid-air, slot together into an isometric learning tower, and four dowels pop in with a snug spring. A peg-doll toddler hops onto the top step, and the Choobz duck rolls in on its pull-cart. The empty sheet stays behind as a ghost. *The screenshot:* the tower standing in front of the sheet it was cut from, which is beautiful negative space that says "real, made here".
*Built with:* one server-rendered inline SVG. Each part's CSS `transform` moves from its flat sheet matrix to its isometric matrix. Timing comes from `linear()` spring tokens and the laser uses SMIL `<animateMotion>`. **No JavaScript.**

**② «حلقه‌های رشد»: the tree-ring age finder.**
The visitor sees a cross-section of a birch log. Each growth ring is an age band (۰–۶ ماه … ۳–۶ سال). When she taps a ring it lights up like lamp-lit wood, the bark edge engraves «حلقهٔ سوم: ۱ تا ۲ سال», and that age's milestone, three products and one guide spill out like wood shavings. A button makes a story-sized card that reads «تارا در حلقهٔ سوم است: وقتِ بالا رفتن» with her ring and today's recommended play, ready to share on Instagram stories. *Why it spreads:* mothers love posting their child's stage, and this is the brand's own metaphor.
*Built with:* concentric `<label>` circles over native radio inputs, with `:has()` choosing the panel. **No JavaScript** for the finder. A 3 KB island, loaded on click, draws the share card on `<canvas>` and calls `navigator.share({ files })`.

**③ «اسمش را روی چوب حک کن»: live laser engraving.**
On the home page and on any engravable product, the mother types her child's name. An ember-bright laser head travels **right to left**, Persian writing direction, and engraves the name into the top step of the tower in the drawing. The strokes darken from amber to char and a thin wisp of smoke curls up. Then she can choose «حک اسم را به سفارشم اضافه کن» (an add-on) or «ذخیره برای استوری». *The screenshot:* her child's name burned into wood, two seconds after she typed it.
*Built with:* SVG `<text>` set in the display face. A clip mask sweeps inline-start to inline-end while `stroke-dashoffset` draws the letters. The ember is a radial gradient riding the edge of the mask. The island is about 4 KB and loads on first focus. Names are never sent to the server unless they're added to the cart.

Micro-moments that support the main three: the cart is **the duck's pull-cart**, and each item loads onto it as a wooden block. Buttons physically **press into the board**. The 404 page is «این قطعه از ورق افتاده!», a sheet with one missing piece. At the end of every page **the duck rolls home** into a little workshop door.

---

## 2. Visual language

### 2.1 The two-hands system
Every screen mixes both hands. The maker's hand provides the structure and the mother's hand provides the emotion. Neither one is ever used alone for long.

| | Maker's hand (دستِ سازنده) | Mother's hand (دستِ مادر) |
|---|---|---|
| Role | Truth, precision, trust | Warmth, empathy, encouragement |
| Marks | Laser-engraved lines, CNC toolpaths (dashed kerf), dimension arrows, part labels «قطعهٔ A», maker's stamp, dowels | Mustard highlighter behind words, hand-drawn sprouts and hearts, scribble circles, arrows, mint speech bubbles, kraft tags with twine |
| Type | Estedad (display), Vazir Code (spec labels) | Vazirmatn medium, plus custom-lettered SVG phrases |
| Colour | Burn, char, ply-edge, beech | Mint, sage, mustard, pomegranate |
| Voice | Short and factual: «۱۸ میلی‌متر، ۱۳ لایه، ۳ مرحله سمباده» ⚑ | Tender and colloquial: «عکساتون رو برامون بفرستید 🌱» |
| Where | Product data, specs, workshop, navigation, structure | Tips, testimonials, UGC, empty states, celebratory moments |

### 2.2 Palette: 12 tokens
Contrast ratios are calculated with WCAG 2.x relative luminance. *Shavings* is the default page background.

| Token | Persian name | Hex | Role | Contrast notes |
|---|---|---|---|---|
| `--color-shavings` | تراشه | `#FBF6EC` | Page background: warm paper-white, never pure white | Base |
| `--color-birch` | رویهٔ توس | `#F3E6CF` | Board surfaces, cards, sheets | Burn text on it **9.97:1** · char **13.58:1** |
| `--color-ply-edge` | لبهٔ لایه | `#E3C99D` | Ply-edge stripes, dividers, kerf lines, grain lines | Char on it **10.45:1** · burn **7.68:1** |
| `--color-beech` | عسلی راش | `#C98A47` | Wood mid-tones in drawings, icon fills, active-tab "burnt" fill | **Decorative only:** 2.70:1 on shavings. Never use it for text or as the only cue of a UI state. On walnut it reaches 5.21:1 |
| `--color-burn` | سوختگی لیزر | `#4B2E1D` | Body text, engraved line art | **11.42:1** on shavings (AAA) |
| `--color-char` | زغال | `#2A1A11` | Headings, primary button background | **15.54:1** on shavings · shavings on char 15.54:1 |
| `--color-mint` | حباب نعنایی | `#D4E8D8` | Speech bubbles, Montessori tip callouts | Burn on mint **9.56:1** |
| `--color-sage` | برگ مریم‌گلی | `#3C6A4F` | Sprouts, success, installment line, secondary links | **5.79:1** on shavings · **4.85:1** on mint (AA body) |
| `--color-mustard` | ماژیک زرد | `#F4C443` | Highlighter marks, "new" badges | Char on mustard **10.22:1** |
| `--color-anar` | اناری | `#B23A2C` | Hearts, sale price, safety callouts, cart badge | **5.52:1** on shavings · shavings on anar 5.52:1 (AA button text) |
| `--color-firooze` | فیروزه | `#17706F` | Inline links, focus ring, info. The one cool hue, a nod to Persian tiles | **5.44:1** on shavings |
| `--color-walnut` | میز گردو | `#33221A` | Footer, workshop section, cart header ("dark wood") | Birch on walnut **12.30:1** · mustard 9.26:1 · mint 11.80:1 |

Effect colour, not a token for text: **lamp** `#F7D9A6`. It's the warm light used for the cursor sheen, lit rings and dark-mode highlights (11.15:1 on walnut).

**Usage ratio (70/20/10).** About 70% of any viewport is calm *shavings/birch* space. About 20% is wood (beech, ply-edge, grain). About 10% is ink and accents. Waldorf accents (mint, sage, mustard, anar) appear **only** through the mother's hand and on peg-doll figures, so they keep feeling special.

**Night-feed mode «حالت شب».** Many mothers scroll at 2 a.m. while nursing, so the site gets a warm, low-blue dark theme rather than a cold grey one. It follows `prefers-color-scheme` and has a toggle in the footer, stored in a cookie so the server renders it with no flash.
`shavings → #17110C` · `birch → #241913` · `burn (text) → #F3E6CF` (15.2:1 on #17110C) · `char → #FBF6EC` · `ply-edge → #4A3426` · `walnut → #0F0B08` · lamp-glow surfaces stay warm. In the hero, the sheet is lit by a desk lamp instead of daylight.

### 2.3 Textures and materials (all cheap to render)
- **Wood grain («هر تخته، یکتا»).** A build script (`scripts/grain.ts`) generates 12 seeds × 2 cuts: *rotary-cut ply* (soft waves) and *flat-sawn* (cathedral arches). It uses simplex noise with a ring field, marching-squares contours, simplification and SVGO. Each SVG tile is 3–6 KB (gzip), sits in `/public/textures`, and is cached as immutable. Every `.board` picks `seed = hash(slug) % 12`, plus a 0°/180° rotation and an offset, so **no two product cards share a board**. Grain lines are `--color-ply-edge` at 35% opacity: present, never noisy. *Phase 2:* scan the workshop's real birch sheets on a flatbed scanner and swap in real AVIF tiles of about 15 KB. That's honesty applied to pixels.
- **Ply edge («لبهٔ لایه‌لایه»).** It's the signature surface treatment. Stacked 1px box-shadows in alternating birch and ply-edge tones make a CNC-cut plywood edge under every board. Pressing a board sinks it into its own edge:

```css
.board {
  position: relative;
  background: var(--color-birch) var(--grain, none) center / 520px;
  border-radius: var(--radius-bit);
  box-shadow:
    0 1px 0 var(--color-ply-edge), 0 2px 0 var(--color-birch),
    0 3px 0 var(--color-ply-edge), 0 4px 0 var(--color-birch),
    0 5px 0 color-mix(in oklab, var(--color-ply-edge), var(--color-burn) 22%),
    0 12px 20px -10px rgb(75 46 29 / .35);
  transition: translate 330ms var(--ease-spring-press), box-shadow 120ms;
}
.board:is(:active, [aria-pressed="true"]) {
  translate: 0 3px;
  box-shadow: 0 1px 0 var(--color-ply-edge), 0 2px 0 var(--color-birch),
              0 5px 10px -6px rgb(75 46 29 / .3);
}
```
- **Kerf line.** The separator between items is a 1px dashed line in ply-edge (6px dash, 4px gap). It's where the saw would go.
- **Laser char.** Engraved strokes use burn, with a 0.5px lighter offset stroke under them. That reads as a debossed cut with no filter needed.
- **Paper (mother's layer).** Articles and notes sit on a faint dotted notebook grid (`radial-gradient` 1px dots every 24px at 6% burn). TL;DR boxes are kraft tags.
- **Sawdust.** A 96px PNG noise tile (about 1.5 KB) at 3% multiply. It's used **only** on the hero sheet and the footer bench.
- **Lamp sheen («نور چراغ کارگاه»).** On desktop (`pointer: fine`), a warm radial gradient follows the cursor over the hovered board, set through `--mx`/`--my` from a single 0.5 KB listener, with `mix-blend-mode: soft-light`. It's raking light that reveals the grain. On mobile, the hero sheet's light sweeps across as you scroll, like sun crossing the workshop window, using the scroll timeline with no JS.
- **Banned:** runtime `feTurbulence` or SVG filters on large areas, full-page wood backgrounds, and photographic wood wallpapers.

### 2.4 Shapes, radii and joinery motifs
- **Router-bit radii.** CNC bits can't cut a sharp inside corner, so every radius on the site matches a bit: `--radius-bit-s: 6px` (chips, inputs), `--radius-bit: 14px` (cards), `--radius-bit-l: 24px` (sheets, drawers), `--radius-bit-xl: 36px` (hero sheet), and `--radius-dowel: 999px` (pills).
- **Dogbone reliefs.** These are the little circular notches CNC operators cut into inside corners. They appear on image windows in product cards and on cutouts in the hero sheet, done with an SVG mask. Few people will notice them consciously. Everyone will feel that the work is crafted.
- **Finger-joint seams («اتصال انگشتی»).** When the page changes material (shavings → walnut, for example), the two sections interlock with 20px box-joint teeth, made with a CSS `mask` on the top edge of the lower section. Teeth are 32px on mobile and 48px on desktop. There are **at most three per page**.
- **Dowels («میخ چوبی»).** Filter chips are horizontal dowels: a pill with top-light cylinder shading and end-grain rings drawn as radial gradients at both ends. A selected chip is "seated", which means darker, sunk 1px and with no outer edge. Important panels such as the price card get two small dowel-head dots at their corners as fasteners.
- **Pegboard.** Holes on an 8px grid give the footer's tool wall its texture.
- **Part labels.** Every home section opens with a mono part label, «قطعهٔ ۰۳ از ۱۲». The home page is a 12-part kit you assemble by scrolling, and the footer closes it with «مونتاژ کامل شد».

### 2.5 Iconography: «حکاکی»
- There are 30 custom icons on a 24px grid with a 1.75px stroke, round caps and joins, and 2px corner radii (router bits again). Each has two states: **line** (default) and **burnt** (beech fill with a burn stroke) for active or selected.
- Icons that point a direction (arrows, chevrons, "next") mirror in RTL through `.icon-dir { scale: -1 1 }` under `[dir=rtl]`. Clocks, play buttons and checkmarks never mirror.
- Brand-specific icons include duck-cart (cart), saw (workshop), tree-ring (age), sprout (Montessori), leaf-shield (safety), four-blocks (installments), ruler (dimensions), peg-doll (age suitability), letter-block «الف» (glossary), and the Bale and Instagram glyphs.
- They ship as one SVG sprite, `/icons.svg`, about 5 KB gzip, referenced with `<use href="/icons.svg#saw">`. It's cached separately and never repeated in HTML. No icon library is installed.

### 2.6 Illustration system (there are no product photos yet, and that's a strength)

**A. Products: the "Parts Manifest" pipeline (the core asset).**
Each product is described once, as a JSON manifest made from the workshop's real DXF cut files:

```jsonc
// src/components/illustrations/manifests/learning-tower.json
{ "sheet": { "w": 2440, "h": 1220, "thickness": 18 },
  "parts": [
    { "id": "A", "label": "پهلو", "outline": "M0 0 L620 0 … Z",        // from DXF, mm
      "sheet": { "x": 40, "y": 30, "rot": 0 },                          // nesting position
      "plane": "YZ", "origin": [0, 0, 0], "explode": [-80, 0, 0], "order": 1 },
    { "id": "D", "label": "سکو", "plane": "XY", "origin": [18, 0, 450], "explode": [0, 0, 60], "order": 4 }
  ],
  "dowels": [[18, 120, 450], …] }
```

A server component, `<PartsRenderer view="flat|assembled|exploded|ortho" />`, turns the manifest into static SVG. Any planar part's isometric projection is an **affine transform** of its true outline, so each part gets one `matrix()`:

`Iso(x,y,z) = ((x − y)·cos30°, (x + y)·sin30° − z)`. For a part lying in the plane (u, v) at origin o, the transform is `matrix(Iso(u).x, Iso(u).y, Iso(v).x, Iso(v).y, Iso(o).x, Iso(o).y)`.

The 18mm thickness is drawn as a second copy of the outline, offset by `Iso(n·t)` and filled with a ply-stripe `<pattern>` aligned to the iso axis. That's where the visible ply layers come from.

One manifest produces **five truthful views**: the flat cut sheet (hero), assembled (cards and PDP), exploded with dashed dowel lines and part labels (hover and PDP), orthographic with dimension lines (PDP "ابعاد"), and a scale view next to a peg doll. **The drawings can't misrepresent the product, because they *are* the product.** Look: birch face plus clipped grain, a burn outline at 1.5px with 0.75px detail lines, ply stripes on any edge facing the viewer, end-grain circles for dowels, and a soft contact shadow made as a plain ellipse, with no filters.

**B. People: Waldorf peg dolls «آدمک‌های چوبی».**
People are rounded cylinder bodies with a sphere head. There are no facial features beyond two optional rosy-cheek dots. They're painted in the Waldorf accents as if with plant-dyed paint. Mothers wear soft scarf shapes, some like a hijab and some not. Fathers and grandmothers appear too, and toddlers are smaller and rounder. The figures show how products are used (climbing the Pikler, standing on the tower), give **true scale**, and carry emotion with no stock faces. They're modest and inclusive, native to Waldorf pedagogy, and **only Choobz has them**.

**C. The mother's marks.**
A library of about 24 hand-drawn SVG strokes, each under 1 KB: sprout, heart, scribble circle, curved arrow, underline, star-burst, «!» and a "hug" bracket. They're drawn with a variable-width brush so they feel pressure-sensitive. They overlay both drawings and photos, for example a sprout pointing at the child's hands in a UGC photo.

**D. Scenes.**
Two isometric rooms are planned: a playroom and a kitchen corner. They have cream walls, a light wood floor, a simple gabbeh rug, a geranium in a terracotta pot, and **a window with a subtle گره‌چینی lattice**. Products sit on hotspots (see §4, part 06).

**How photos join later.**
Every media slot is a `<Plate>` component with `kind: "illustration" | "photo"`. It always renders the same ply-edged frame, dogbone window and badge positions, and it always reserves its aspect ratio. Photos come in through the CMS with `dominantColor` and `blurDataUrl`, both already in the `media` table. Drawings never go away. The exploded and dimension views stay drawn even after photos exist, so photos add warmth while drawings carry the truth.

### 2.7 Photography art direction (for Phase 2 shoots)
- **Light.** Soft side-light from a morning window. Raking light shows the grain. No flash. White balance around 5,200 K with a slight warm grade, lifted blacks (never pure black), true wood tones, and slightly muted greens. Use one shared Lightroom preset, «صبح چوبز».
- **Places.** Real Iranian homes with cream or beige walls, light wood floors or a calm gabbeh, and **no plastic clutter**. A geranium or a tea glass by the window is allowed as one cultural note per frame, never as a cliché collage.
- **People.** The child acts and the parent supports from the edge of the frame (Montessori: child-led). Show hands gripping rungs, bare feet on steps, and faces concentrating. Include mothers with and without hijab, fathers and grandparents. Get written consent for every child photo.
- **Formats.** Product shots are 4:5 on a seamless birch-cream sweep (`#F3E6CF`): one large softbox at 45° and one white bounce, with a consistent floor shadow so the catalogue reads as one series. Lifestyle shots are 4:5 and 3:2. Material macros are 1:1 (ply edge, rounded corner, dowel, engraving). The workshop series is 3:2 (sawdust in a light beam, the router bit, sanding hands).
- **UGC.** Customer photos always sit in a polaroid frame on the peg rail, which evens out mixed phone quality.

### 2.8 Restraint rules (how this avoids kitsch)
1. Wood is for **objects** (cards, buttons, frames, the sheet), **never for walls**. Page backgrounds stay shavings.
2. Only one signature motion per viewport.
3. No more than two mother's marks per viewport, and never on top of prices or legal text.
4. No more than three finger-joint seams per page.
5. Every drawing must be dimensionally true, which the manifest guarantees.
6. The squint test: blur the screenshot. If you can't find the primary action in one second, remove ornament.

---

## 3. Typography

### 3.1 Roles and families (all self-hosted woff2, open licences)
| Role | Family | Weights | Use |
|---|---|---|---|
| **Display** (maker's voice) | **Estedad** (OFL, variable). Geometric and sturdy, with the feel of CNC-cut letters | 700–900, instanced to that range | H1/H2, hero, prices on the PDP, stamps |
| **Body / UI** | **Vazirmatn** (OFL, variable). The most legible Persian screen face, with great hinting on mid-range Android | 400–700 | Paragraphs, UI, forms, cards |
| **Spec / label** | **Vazir Code** (OFL, monospaced Persian), subset to digits, «×»، «/»، «·» and about 40 Persian glyphs | 400 | Part labels «قطعهٔ ۰۳»، dimensions, SKU, batch numbers, the free-shipping tape measure |
| **Mother's handwriting** | No font file. Custom-lettered SVG phrases (about 20 short phrases, commissioned), with the real text in `aria-label` and visually-hidden spans | — | «عکساتون»، «آفرین کوچولو!»، empty-state notes |
| *Phase 2* | **Choobz Stencil**: a stencil cut of Estedad Black (OFL allows derivatives under a new name). Letters cut from plywood need **bridges** so their counters don't fall out. For signage words only | 900 | Large SVG signage words such as «کارگاه» in the workshop section (drawn by hand in Phase 1) |

The Latin wordmark "CHOOBZ" is always the SVG logo. Inline Latin text, for example "Pikler Triangle", uses each family's own Latin glyphs, wrapped in `<bdi>`.

### 3.2 Fluid scale (360 → 1440px viewport, ratio 1.20 → 1.30, body 17 → 18.5px)
| Token | Size (px) | `clamp()` | Use | Line-height |
|---|---|---|---|---|
| `--text-step--2` | 12.5 → 13 | `clamp(0.7812rem, 0.7708rem + 0.0463vw, 0.8125rem)` | Mono labels (Persian floor is 12px) | 1.5 |
| `--text-step--1` | 14.5 → 15.5 | `clamp(0.9062rem, 0.8854rem + 0.0926vw, 0.9688rem)` | Captions, meta, badges | 1.7 |
| `--text-step-0` | 17 → 18.5 | `clamp(1.062rem, 1.031rem + 0.1389vw, 1.156rem)` | Body | **1.9** |
| `--text-step-1` | 20.4 → 24.1 | `clamp(1.275rem, 1.199rem + 0.338vw, 1.503rem)` | Lead, H4, card titles | 1.7 |
| `--text-step-2` | 24.5 → 31.3 | `clamp(1.53rem, 1.389rem + 0.6282vw, 1.954rem)` | H3 | 1.5 |
| `--text-step-3` | 29.4 → 40.6 | `clamp(1.836rem, 1.601rem + 1.043vw, 2.54rem)` | H2 | 1.45 |
| `--text-step-4` | 35.3 → 52.8 | `clamp(2.203rem, 1.837rem + 1.628vw, 3.302rem)` | Section display | 1.35 |
| `--text-step-5` | 42.3 → 68.7 | `clamp(2.644rem, 2.094rem + 2.443vw, 4.293rem)` | Page H1 | 1.3 |
| `--text-hero` | 44 → 104 | `clamp(2.75rem, 1.5rem + 5.556vw, 6.5rem)` | Home hero only | 1.25 |

### 3.3 Persian-specific rules
- `<html lang="fa-IR" dir="rtl">`. Use only logical properties and utilities (`ms-*`, `pe-*`, `start-*`, `border-s`). An ESLint rule bans `ml-`/`mr-`/`left-`/`right-` in components.
- **No letter-spacing, ever.** Tracking breaks the joins between Persian letters, so `tracking-*` is lint-banned. The one exception is Latin mono inside `:lang(en)` (+0.04em).
- **No italics.** Persian has no italic convention. Emphasis comes from weight 700 or the mustard highlighter.
- **Line-height** never goes below 1.25, even on display text. The dots of ی، ج and پ and the tall strokes of ک، گ and ط collide below that. Body text is 1.9.
- **Measure.** About 36em (60–70 Persian characters). Set `text-align: start` and **never justify**, since browsers lack proper kashida justification and justified text gets ugly word gaps. Headings use `text-wrap: balance` and paragraphs use `text-wrap: pretty` where supported.
- **Underlines.** `text-underline-offset: .4em; text-decoration-thickness: 1.5px; text-decoration-skip-ink: none`. Skip-ink chops Persian baselines into fragments.
- **Text hygiene** at seed time now, and in the CMS later: normalise Arabic ي/ك to Persian ی/ک, enforce ZWNJ (نیم‌فاصله) in «می‌سازیم» and «اسباب‌بازی», convert Arabic-Indic digits (٤٥٦) to Persian (۴۵۶), and use «گیومه» instead of "quotes". The same normaliser runs on search queries.
- **Bidi.** SKUs, Latin names and phone numbers go in `<bdi>` or `dir="ltr"` spans. The duck's direction of travel follows the reading direction too: it rolls toward inline-start.

### 3.4 Numerals and units
- All user-facing digits are **Persian** (۰–۹) in the DOM. They're generated by `Intl.NumberFormat('fa-IR')` in `src/lib/format.ts` rather than by font digit substitution, so copy-paste, search and AI crawlers see the same digits users do. Machine output (JSON-LD, sitemaps, URLs, `datetime`) keeps Latin digits.
- Thousands separator «٬» (U+066C) and decimal separator «٫»: **«۴٬۸۵۰٬۰۰۰ تومان»**. Prices, installment blocks and spec tables use `font-variant-numeric: tabular-nums`.
- Dates are **Jalali**: `Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'long' })` gives «۲۴ مهر ۱۴۰۵», always wrapped in `<time datetime="2026-10-16">`.
- Dimensions are written in Vazir Code as «۶۰ × ۴۵ × ۹۰ سانتی‌متر», never with a Latin «cm» in Persian copy.
- Currency: the site shows **Toman**. schema.org needs ISO 4217, so it gets **IRR = Toman × 10**. That conversion is already noted in the schema.

---

## 4. Home page blueprint: a 12-part kit

The page reads like the instructions of a flat-pack kit. Each section opens with «قطعهٔ ۰X از ۱۲» and the footer says «مونتاژ کامل شد». Sections 05–12 use `content-visibility: auto` with `contain-intrinsic-size`, so low-end phones render only what's on screen.

**Meta.**
- Title: «چوبز کیدز | اسباب‌بازی و سیسمونی چوبی مونته‌سوری، ساخت کارگاه چوبز»
- Description: «برج یادگیری، مثلث پیکلر، نردبان سوئدی و کتابخانهٔ روبه‌روی چوبی؛ ساخت دست کارگاه چوبز با پوشش ایمن کودک. خرید ۴ قسطه با اسنپ‌پی و ارسال به سراسر ایران.»

### Part 01: Hero «از ورق تا بازی» (flat-pack)
- **Mobile layout (390 × 844).**
  - Header (56px).
  - A mono eyebrow.
  - The H1 over two display lines plus a smaller keyword line inside the same `<h1>`.
  - The sheet stage: an inline SVG at 1:1 (about 340px), on a birch sheet with a ply edge and dogbone corners.
  - A one-line lead and two CTAs side by side.
  - A trust row of three tiny engraved chips.
  - The bottom toolbar.
  The H1, the stage and the primary CTA are all above the fold.
- **Desktop.** On a 12-column grid, the text takes columns 1–5 on the start side (right). The stage takes columns 6–12: the sheet tilts slightly in perspective, standing on a workbench edge. The duck rolls in from inline-end.
- **Copy.**
  - Eyebrow: «قطعهٔ ۰۱ از ۱۲ · ورق بِرچ ۱۸ میلی‌متری»
  - H1: **«از یک ورق چوب، تا یک دنیا بازی.»** with a second line «اسباب‌بازی و سیسمونی چوبی مونته‌سوری، ساخت کارگاه چوبز»
  - Lead: «برج یادگیری، مثلث پیکلر، نردبان سوئدی و کتابخانهٔ روبه‌رو؛ بریده، سمباده‌خورده و امضاشده با دست‌های خودمان — برای بازی، کشف و رشد کودکان سرزمینمان.»
  - CTAs: **«ورود به فروشگاه»** (pressed-ply char button) · «ببینید چطور ساخته می‌شود» (ghost button that scrolls to part 05)
  - Trust chips: «خرید ۴ قسطه با اسنپ‌پی» · «۵۰ هزار همراه در اینستاگرام» · «نماد اعتماد الکترونیکی»
  - SVG `<title>`: «ورق چوب بِرچ که قطعه‌هایش جدا می‌شوند و برج یادگیری مونته‌سوری را می‌سازند»
- **Motion (CSS only; total about 2.6s; starts 400ms after first paint).**
  1. The sheet is visible at first paint: the full board with engraved toolpaths. The H1 is **never animated in**, because it's the LCP element.
  2. The mustard highlighter sweeps behind «یک دنیا بازی» from right to left (`background-size` on a span, 600ms).
  3. The laser dot traces the last outline (SMIL `<animateMotion>`, 900ms). The kerf line draws on behind it (`pathLength="1"`, `stroke-dashoffset` 1 → 0).
  4. Parts lift and fly: `@keyframes assemble { 0% { transform: var(--flat) } 22% { transform: var(--flat) translateY(-10px) scale(1.02) } 100% { transform: var(--iso) } }`, `--ease-spring-dowel`, staggered `calc(1100ms + var(--i) * 90ms)`. The ghost sheet (an evenodd path with holes) fades to 40%.
  5. Dowels pop with `scale` 0 → 1 on `--ease-spring-toss`. The peg doll drops onto the step on `--ease-spring-settle`. The duck rolls in: `translate` plus wheel `rotate`.
  6. **Scroll-scrub.** Between 0 and 50vh of scroll, the assembled tower *explodes* gently into its parts with labels, using the independent `translate` property so it composes with `transform`: `animation-timeline: scroll(root); animation-range: 0 50vh`. Scrolling back reassembles it.
  7. Desktop: the lamp sheen follows the cursor over the sheet.
  - **Fallbacks.** The default `.part { transform: var(--iso) }` is the assembled state. So with reduced motion, older browsers or a print stylesheet, the visitor gets a finished tower in front of its ghost sheet, with no laser or scrub. Firefox, which lacks scroll timelines, still plays the time-based assembly.
- **Data.** `settings.hero = { productSlug, manifest, ctaHref }`. The CMS can choose which product assembles, such as the Pikler triangle in spring or a wooden haft-sin tray for Nowruz campaigns. Trust chips come from `settings.trust`.

### Part 02: «حلقه‌های رشد» (tree-ring age finder)
- **Layout.** On mobile, a 320px end-grain disk sits partly off-canvas at inline-end, so it reads as the end of a log. Ring labels run along a radial engraved ruler. Below it is the result board: a milestone sentence, three mini product cards in a horizontal rail, and one guide link. On desktop, the disk (480px) is on the start side and the results are on the other.
- **Copy.**
  - Eyebrow: «قطعهٔ ۰۲ · حلقه‌های رشد»
  - H2: **«کوچولوی شما در کدام حلقه است؟»**
  - Sub: «درخت هر سال یک حلقه می‌سازد و کودک هر روز یک مهارت تازه. سن کوچولوتان را انتخاب کنید تا ببینید چه چیزهایی برای همین روزهایش ساخته‌ایم.»
  - Rings: «۰ تا ۶ ماه» · «۶ تا ۱۲ ماه» · «۱ تا ۲ سال» · «۲ تا ۳ سال» · «۳ تا ۶ سال»
  - Example result (1–2 years): **«حلقهٔ سوم: وقتِ ایستادن و «خودم انجامش می‌دم!»»**, «در این حلقه کودک می‌خواهد بالا برود، بایستد و در کارهای خانه سهم داشته باشد.» → «همهٔ بازی‌های ۱ تا ۲ سالگی» · guide «بازی مونته‌سوری در ۱ تا ۲ سالگی»
  - Share: «کارت حلقهٔ رشد کوچولوتان را بسازید»
- **Interaction.** Five native radio inputs. The rings are **concentric circular `<label>` elements stacked so that inner ones sit on top**, so a tap always selects the innermost ring under the finger. The SVG grain rings are drawn behind them with `pointer-events: none`. `.finder:has(#ring-3:checked) [data-band="12-24"] { display: grid }` reveals the panel, which enters through `@starting-style` (opacity and an 8px rise, 240ms settle). The chosen ring fills with lamp glow and its label is "engraved" with a dash draw. Arrow keys work natively. **Zero JS.** All five panels are rendered on the server (about 8 KB of HTML), and each ring also links to the indexable `/shop/age/[band]`.
- **Data.** Age bands are constants in `src/lib/ages.ts`. Products come from `products` with overlapping `ageMinMonths`/`ageMaxMonths`, featured first, three per band. The guide comes from `posts` filtered by age range. Milestone copy lives in `settings.ageBands` and can be edited in Phase 2.

### Part 03: «نقشهٔ برش» (categories as a cut sheet)
- **Layout.** One plywood sheet carries every category as a nested part silhouette: tower, arch, triangle, wall-bar hex panel, front-facing bookshelf, art roll, table and chair, low shelf, duck toy. Each has a dashed toolpath around it, its name engraved inside, and a count. On desktop the sheet is a true **2:1** rectangle (2440 × 1220). On mobile it becomes a two-column nesting, made with CSS grid areas and irregular part shapes, so it still reads as a cut sheet.
- **Copy.**
  - Eyebrow: «قطعهٔ ۰۳ · نقشهٔ برش»
  - H2: **«یک ورق، هزار بازی»**
  - Sub: «هرچه می‌سازیم از روی همین نقشه‌ها بریده می‌شود. از کدام شروع کنیم؟»
  - Sheet label in mono: «ورق بِرچ · ۲۴۴ × ۱۲۲ سانتی‌متر · نقشهٔ برش ۰۳»
  - Part label example: «برج یادگیری · ۴ مدل»
- **Interaction.** Hover or tap makes the part *pop out of the sheet*: −6px, its ply edge appears, and a dark hole silhouette stays behind. On `:active` the part sits back down. On focus-visible, the **laser outline** (firooze 2px dashed, with dash-offset marching if motion is allowed) traces the part. Each part is a plain `<a>` to `/shop/[category]`.
- **Data.** `categories` (name, slug, `illustration` → manifest silhouette, `accent`, product count).

### Part 04: «تازه از کارگاه رسیده‌اند» (featured rail)
- **Layout.** Product boards *lean on a wall ledge*, the front-facing bookshelf rail. On mobile, a scroll-snap rail shows 1.2 cards to hint at more. Desktop shows four cards with two engraved arrow buttons.
- **Copy.** H2 **«تازه از کارگاه رسیده‌اند»**, sub «هنوز بوی چوب تازه می‌دهند.», link «همهٔ محصولات».
- **Motion.** Cards slide in from inline-end with a stagger: `animation-timeline: view(); animation-range: entry 0% entry 70%`. Native swipe. Where supported, CSS carousel primitives (`::scroll-button()`, `::scroll-marker`) supply arrows and dots with no JS. Otherwise a 0.4 KB island calls `scrollBy`.
- **Data.** `products` where `featured` or `isNew`, `status = published`, up to 8, with the variant swatches and the first `productMedia` or the illustration key.

### Part 05: «کارگاه زنده» (the workshop story; material change to walnut, finger-joint seam)
- **Layout.** On mobile, a sticky stage holds the top 55% of the viewport while five step texts scroll past. On desktop, a pinned **horizontal workbench** turns vertical scroll into a 5-panel horizontal track (a tall wrapper with `view-timeline`, the track translated by the timeline, all CSS). The fallback is a vertical stack.
- **Copy.**
  - Eyebrow: «قطعهٔ ۰۵ · کارگاه زنده»
  - H2: **«کارگاه زنده»**
  - Sub: «هر تکه، پیش از آن‌که به خانهٔ شما برسد، از دست‌های ما می‌گذرد. این مسیر را با هم برویم.»
  - ۱. «ورق را انتخاب می‌کنیم»: «فقط بِرچ درجه‌یک؛ بی‌گره، بی‌ترک، با لایه‌های یکدست.» ⚑
  - ۲. «با دقت می‌بُریم»: «دستگاه CNC مسیر برش را تا دهم میلی‌متر دنبال می‌کند.» ⚑
  - ۳. «آن‌قدر سمباده می‌زنیم که…»: «…هیچ دست کوچکی لبهٔ تیزی پیدا نکند.»
  - ۴. «با پوشش ایمن می‌پوشانیم»: «پوششی مناسب اسباب‌بازی کودک، حتی اگر سر از دهان کوچولو درآورد.» ⚑ (name the certificate, for example EN 71-3, only if it's real)
  - ۵. «امضا می‌کنیم»: «مُهر کارگاه و شمارهٔ ساخت، روی هر محصول.»
- **Motion (scroll-scrubbed per step).** (1) The raw sheet's grain is revealed. (2) The router bit runs the toolpath (dash-offset tied to the step's view timeline). (3) Sanding: a jagged edge path morphs to a smooth one (CSS `d` interpolation where supported, crossfade elsewhere) while sawdust motes drift (6 CSS particles). (4) Oil: a sheen band sweeps across and the wood deepens one shade through overlay opacity. (5) The duck **brand stamp presses down** (`scale` 1.25 → 1 on the toss spring) and leaves the burnt mark «سری ۱۴۰۵-۰۷».
- **«حالا نوبت شماست» (signature ③ on the home page).** Straight after the stamp, the stage turns into the top step of a tower with an empty name plate: «حالا نوبت شماست: اسم کوچولوتان را بنویسید.» An input in the maker's style (a dowel-rounded field with a mono label «حک روی پلهٔ بالا») hydrates the `NameEngraver` island on first focus. Typing engraves the name right to left. Two buttons follow: «ذخیره برای استوری» and «سفارش با حک اسم» (links to the engravable products). With no JS, the field is a GET form that opens the PDP with `?engrave=` pre-filled.
- **The "living" strip.** «امروز در کارگاه: ۱۲ برج یادگیری زیر سمباده‌اند · زمان ساخت سفارش‌های امروز: ۷ روز کاری». It comes from a new `workshop_log` table. **It only shows if the latest entry is under 72 hours old**, so the site never makes a stale "live" claim. A link goes to `/workshop` for the full story, real photos and video in Phase 2.
- **Data.** Steps come from `settings.workshopSteps` (CMS-editable) and live entries from `workshop_log`.

### Part 06: «یک اتاق مونته‌سوری، از نزدیک» (shop the room)
- **Layout.** An isometric playroom (see 2.6 D) with dowel-head "+" hotspots on each product. On mobile the room is wider than the screen, so it pans horizontally with scroll-snap to three zones. A numbered list of the same hotspots sits underneath for accessibility and crawlable links. Scene tabs: «اتاق بازی» · «آشپزخانه» · «کنار تخت». They're radios plus `:has()`, with no JS.
- **Copy.** H2 **«یک اتاق مونته‌سوری، از نزدیک»**, sub «روی هر تکه بزنید تا ببینید چه کاری برای کوچولوتان می‌کند.» Example hotspot: «کتابخانهٔ روبه‌رو — جلد کتاب‌ها پیداست؛ پس انتخاب با خود کودک است.»
- **Interaction.** Each hotspot is a `<button popovertarget>` that opens a **native popover** mini card (name, one benefit, price, «دیدن محصول»). It's anchored to the hotspot with CSS anchor positioning where available, and falls back to a bottom-sheet card. When the scene enters view it *builds itself*: floor, then walls, then furniture drops in on the settle spring, then the peg dolls. Hovering a hotspot turns on the little lamp in the room.
- **Data.** New `scenes` and `scene_hotspots` tables (`xPct`, `yPct`, productId, label). In Phase 2 the same component accepts a **real room photo** as the background with the same hotspot coordinates. That's the bridge from drawings to photos.

### Part 07: «چرا چوب؟ چرا مونته‌سوری؟» (answer tags; an AEO block)
- **Layout.** Four to six **kraft tags hanging on twine** from a pegboard rail. Each has a question `<h3>`, a 40–60-word direct answer, and «بیشتر بخوانید» linking to the glossary or a guide. They stack on mobile and sit in three columns on desktop.
- **Copy (samples).**
  - **«مثلث پیکلر چیست؟»**: «مثلث پیکلر یک سازهٔ چوبی سه‌گوش برای بالا رفتن است که بر پایهٔ ایده‌های امی پیکلر، پزشک کودکان مجارستانی، دربارهٔ حرکت آزاد ساخته شده است. کودک از حدود ۸ ماهگی با آن چهاردست‌وپا می‌رود، می‌ایستد و بالا می‌رود؛ و تعادل و اعتمادبه‌نفس بدنی‌اش قوی‌تر می‌شود.» ⚑ age
  - **«چرا اسباب‌بازی چوبی؟»**: «چوب طبیعی وزن، بافت و دمای واقعی دارد و حواس کودک را بیشتر درگیر می‌کند؛ با پوشش ایمن، سال‌ها دوام می‌آورد و از کودکی به کودک بعدی می‌رسد.»
  - **«مونته‌سوری و والدورف چه فرقی دارند؟»** · **«برج یادگیری از چند سالگی مناسب است؟»**
- **Motion.** On entry, the tags swing from their twine hole (rotate −4° → 0 on the settle spring, `transform-origin: top center`). That plays once.
- **Data.** Definitions are pulled **from `glossaryTerms.definition`** and the other answers from `faqs` (scope `page`, home). The same fact is therefore written once and repeated identically everywhere, which keeps entities consistent for GEO. It's included in the home `FAQPage` JSON-LD because it's visible Q&A.

### Part 08: «بازی‌نامه» (magazine shelf)
- **Layout.** The site's front-facing bookshelf: articles stand **face-out as book covers**, each with an engraved cover drawing, title and format tag («راهنما»، «چک‌لیست»، «مقایسه»). On mobile, a featured pillar guide sits on top with one scrollable shelf below. On desktop, the featured guide is large on the start side with two shelves next to it.
- **Copy.** H2 **«بازی‌نامه»**, sub «راهنماهای علمی و مادرانه دربارهٔ بازی، رشد و خانهٔ مونته‌سوری؛ نوشتهٔ کارشناس‌ها، آزموده در خانه‌های واقعی.» Sample covers: «برج یادگیری از چند سالگی مناسب است؟» · «چیدمان اتاق مونته‌سوری در یک اتاق ۹ متری» · «پیکلر یا آرک؟ راهنمای انتخاب برای هر سن» · «۱۰ بازی آشپزخانه‌ای با برج یادگیری»
- **Motion.** Hover or press tips the book forward 6° from its base, as if you're pulling it off the shelf (perspective `rotateX`). On navigation the cover **morphs into the article hero** through a React `<ViewTransition name={"post-" + id}>`.
- **Data.** `posts` (featured plus latest, published) with `topics`, `format`, `readingMinutes`, `illustration`/`coverMediaId`.

### Part 09: «خانه‌های چوبی شما» (UGC «عکساتون»)
- **Layout.** A **Shaker peg rail** runs across the section. Customer photos hang from it as polaroids on twine, with mint speech bubbles («مامانِ آوا، شیراز — اولین صبحانه‌ای که خودش درست کرد!», a placeholder). On mobile it's a horizontal scroll with staggered heights. On desktop it's a wide rail with two rows.
- **Copy.** H2 **«خانه‌های چوبی شما»**, sub «عکس‌هایی که برایمان فرستادید؛ هر کدام یک دنیای کوچک.», CTA «عکس کوچولوتان را برایمان بفرستید» (linking to the Instagram DM and the Bale channel).
- **Motion.** On first entry the polaroids sway once like pendulums (toss spring, `transform-origin: top`).
- **Phase 1 with no photos.** `communityPhotos.illustration` already exists, so the slots show peg-doll scenes plus one empty frame that says «جای عکس شما». **Real photos only, with consent.** There's no Instagram embed, which would be heavy, foreign, and would track users.
- **Data.** `communityPhotos` joined to `media` and `products` (for «در این عکس: برج یادگیری»). Images come through `next/image` as AVIF/WebP with the dominant-colour background.

### Part 10: «از زبان مادرها» (testimonials «رضایت شما»)
- **Layout.** Paper notes **clipped with wooden clothespins** to a string, which is another thing Choobz makes. Each note has a quote in the mother's voice, a rating, «مامان رها · دختر ۲ ساله · تهران», and the product it's about. Above them sits the aggregate: «۴٫۹ از ۵ · بر اساس نظر خریداران تأییدشده», computed and shown only when there are enough real reviews.
- **Motion.** The notes flutter in with a −2° to 1° settle. It's static under reduced motion.
- **Data.** `reviews` where `featured` and `status = approved`, with `verifiedPurchase` badges. **Seed testimonials are clearly marked as placeholders.** They must be replaced with real, consented quotes from the «رضایت شما» highlight before launch.

### Part 11: «خیالتان از همه‌چیز راحت» (installments, trust, shipping)
- **Layout.** A large price-tag board shows the **SnappPay explainer as four equal wooden blocks** stacked like a block tower: «امروز» · «ماه دوم» · «ماه سوم» · «ماه چهارم» ⚑ (confirm the real schedule and fees with SnappPay's merchant terms). Next to it, a mini calculator lets the visitor pick one of three product chips (برج یادگیری، پیکلر، کتابخانه) and the blocks show «۱٬۲۱۲٬۵۰۰ تومان». It's radios plus `:has()`, with every amount rendered on the server and **no JS**. Below are four trust tiles: «ارسال امن به سراسر ایران» (with lead time), «ضمانت ساخت ۱۲ ماهه» ⚑, «پوشش ایمن کودک» ⚑, «پشتیبانی در بله». Then the official **eNamad** badge: a linked image, lazy-loaded, on an Iranian host. Its script isn't loaded.
- **Copy.** H2 **«خیالتان از همه‌چیز راحت»**, SnappPay line «همین امروز ببرید، در ۴ قسط بپردازید.»
- **Data.** `settings.payments` (snapppay enabled, installment count), `settings.shipping`, `settings.trust.enamad` (code and link), and example `products`.

### Part 12: «پرسش‌های پرتکرار شما» (FAQ drawers)
- **Layout.** An exclusive accordion built from `<details name="faq">` and styled as **cabinet drawers**: each `<summary>` is a drawer front with a round wooden knob, and opening it slides the drawer out. Where `interpolate-size: allow-keywords` and `::details-content` are supported, the height animates. Elsewhere it opens instantly.
- **Copy.** H2 **«پرسش‌های پرتکرار شما»**. Questions: «برج یادگیری برای چه سنی مناسب است؟» · «پوشش محصولات چوبز برای کودک ایمن است؟» · «امکان خرید قسطی دارید؟» · «ارسال به شهرستان‌ها چقدر طول می‌کشد؟» · «اگر محصول آسیب‌دیده برسد چه می‌شود؟» Link: «همهٔ پرسش‌ها».
- **Data.** `faqs` (scope `general`, the top 6). They feed `FAQPage` JSON-LD.

### Footer: «میز کار» (see §5)
The community call («به خانوادهٔ چوبز بپیوندید»: Instagram @choobz.kids and the Bale channel) sits on the bench edge. The duck rolls home, and the page closes with **«مونتاژ کامل شد. ممنون که تا اینجا با ما ساختید.»**

---

## 5. Header, navigation, footer, cart drawer

### 5.1 Mobile: the top bar plus the «جعبه‌ابزار» toolbar (about 80% of traffic)
- **Top bar (56px, sticky).** At the start side (right): the duck mark and the CHOOBZ wordmark. At the end side: search. As you scroll, the bar compresses from 56 to 48px and gains a ply-edge bottom: `animation-timeline: scroll(); animation-range: 0 80px`, with no JS.
- **Bottom toolbar (64px plus `env(safe-area-inset-bottom)`).** A ply strip with five engraved slots in thumb reach: «خانه» · «فروشگاه» · **the duck cart «سبد»** (center, raised, a dowel-round button) · «بازی‌نامه» · «منو». The active slot is *burnt* (beech fill) and pressed 2px into the strip. The cart badge isn't a number in a red dot. It shows **blocks stacked on the duck's cart** (1–4 blocks, then «+۵»), with the real count in `aria-label`. The toolbar hides on the PDP, where the buy bar replaces it, and in checkout.
- **Menu sheet.** A `<dialog>` bottom sheet opened with invoker commands (`commandfor`/`command="show-modal"`). A 1 KB polyfill loads only where they're unsupported. Contents: a search field, «خرید بر اساس سن» ring chips, categories with mini engravings, بازی‌نامه topics, links to کارگاه، دربارهٔ ما، تماس and پیگیری سفارش, and the Instagram and Bale links. It has a drag-handle look. Close by tapping the backdrop or pressing Esc.

### 5.2 Desktop: the rail header plus the "cut sheet" mega menu
- **Header (72px).** A thin ply rail with two dowel heads at its ends. Start: the logo. Center: «فروشگاه ▾» · «سن به سن ▾» · «بازی‌نامه» · «کارگاه» · «دربارهٔ ما». End: an expanding search field, account (Phase 2) and the duck cart.
- **Mega menu «نقشهٔ برش».** Uses the Popover API (`popover` plus `popovertarget`), anchored with CSS anchor positioning and falling back to fixed below the header. It opens as a wide plywood sheet, sliding 8px down and fading in over 160ms via `@starting-style`.
  - Column 1: category parts nested like the home cut sheet, in mini form.
  - Column 2: «سن به سن» ring chips.
  - Column 3: two best-seller mini boards.
  - Column 4: a featured buying guide.
  It's click to open, with hover intent (`interestfor`) as progressive enhancement. **Zero JS.**
- **Search.** A `<dialog>` with a GET form that works without JS (`/search?q=`, `noindex`). The JS enhancement does debounced queries against a route handler backed by **SQLite FTS5** (`products_fts`, `posts_fts`, `glossary_fts`), using the Persian normaliser (ی/ک, ZWNJ-insensitive, digits). Results are grouped as «محصولات» · «پاسخ‌ها» (glossary and FAQ snippets) · «بازی‌نامه».

### 5.3 Footer: «میز کار» (the workbench)
- A finger-joint seam leads into **walnut**.
- **Row 1: community.** H2 «به خانوادهٔ چوبز بپیوندید», «۵۰ هزار همراه در اینستاگرام کنار ما هستند.», with two big buttons engraved in lamp-light: «اینستاگرام @choobz.kids» and «کانال بله».
- **Row 2: the shadow board «تابلوی ابزار».** Links hang on a pegboard, each with a tool silhouette engraved behind it, the way a workshop marks where each tool belongs: فروشگاه، بازی‌نامه، واژه‌نامه، کارگاه، راهنمای خرید، ارسال و بازگشت، ضمانت، تماس، پیگیری سفارش. On mobile it's a two-column list with icons.
- **Row 3: contact and trust.** Phone in `dir="ltr"`, hours, address (if it's public), the eNamad badge (lazy), the SnappPay mark, and the «حالت شب» and «حرکت کمتر» toggles.
- **Row 4: the maker's mark.** A circular duck stamp, «ساخته‌شده با دست، در کارگاه چوبز» and «© ۱۴۰۵ چوبز کیدز».
- **The duck goes home.** As the footer's bottom comes into view, the duck pull-toy rolls from inline-end into a small workshop door, with its wheels turning (`animation-timeline: view()`). Under reduced motion it sits by the door.

### 5.4 Cart drawer: «گاری اردک»
- **Shape.** A `<dialog>` that slides from inline-end (the left in RTL) on desktop at 420px, and rises as a 92vh bottom sheet on mobile. The backdrop is char at 40%.
- **Header.** A walnut strip with the duck pull-cart drawing and a block for each item.
- **Add-to-cart choreography (about 700ms).** The product's thumbnail flies along a curved path from the button to the cart, using WAAPI through `motion/mini` (about 3 KB, loaded lazily on first add). A block drops onto the cart on the toss spring and the duck bobs. On the very first add only, three wood-shaving curls spring out. A polite `aria-live` region announces «برج یادگیری به سبد اضافه شد».
- **Lines.** Mini boards with the drawing or photo, name, variant «طبیعی · سه‌حالته», a dowel stepper (− / +), and the price. Remove is an engraved «×» with an undo toast «حذف شد · برگردون».
- **Free-shipping meter.** A **carpenter's tape measure** unrolls with ticks in Vazir Code: «۸۵۰ هزار تومان تا ارسال رایگان». When the threshold is met, the tape snaps shut with a satisfying *clack* (a settle spring with a 2% overshoot).
- **Summary.** Subtotal, «یا ۴ قسط … تومانی با اسنپ‌پی», one «کامل‌ترش کنید» bundle suggestion from `product_relations.kind = bundle`, and the primary **«ادامهٔ خرید»** button (checkout arrives in Phase 2).
- **Empty state.** «گاری اردک هنوز خالیه؛ بیاید یه چیزی بارش کنیم!», with three best-sellers.
- **Tech.** A cart id in an httpOnly cookie. Lines live in SQLite (new `carts` and `cart_items` tables) and change through Server Actions, with `useOptimistic` for instant UI. The badge is a small dynamic hole in `<Suspense>` inside an otherwise static shell.

---

## 6. Shop

### 6.1 URL and indexing rules
- `/shop` (all products), `/shop/[category]` (indexable category landing pages), `/shop/age/[band]` (indexable age landing pages such as «اسباب‌بازی چوبی ۱ تا ۲ سالگی»), and `/product/[slug]`.
- **Product and category slugs are short ASCII** (`/product/learning-tower`). They get shared in DMs, printed as QR codes on packaging, and need to stay stable. **Article and glossary slugs are Persian** (see §7), because they live on search matching.
- Filter query parameters render `noindex,follow` with a canonical pointing to the base page. Any filter combination that's worth ranking for gets promoted to a real landing route with its own intro copy.

### 6.2 Listing page
- **Header.** Breadcrumbs, then the H1 (for example «مثلث پیکلر») next to its engraved category part. Then an **answer-first intro** of 2–3 sentences covering what it is, for which age and why, taken from `categories.description`. Then the count in mono: «۱۲ محصول».
- **Filter bar (sticky under the header).** Dowel chips in one scrollable row:
  - **سن** as ring chips (۰–۶ ماه … ۳–۶ سال)
  - **دسته** on `/shop`
  - **مهارت** with tiny icons: حرکتی درشت · تعادل · استقلال و زندگی روزمره · خلاقیت · کتاب و زبان · حسی
  - Sort: پیشنهاد چوبز · جدیدترین · ارزان‌ترین · گران‌ترین
  - A «فیلترها» button opens a bottom-sheet `<dialog>` with everything plus a price range (two dowel-thumb inputs), availability («آمادهٔ ارسال» vs «ساخت سفارشی ۷ روزه») and finish.
  - Filtering is a **GET form with real links**, so it works with no JS and is crawlable. A 1.5 KB enhancement uses `router.replace` inside a transition, and the grid crossfades through a same-route `<ViewTransition>`.
- **Grid.** Two columns on mobile (12px gap), three on tablet, four on desktop (1280px max). **Every 8th slot is a "workshop note" answer tile**: a kraft card with «نکتهٔ کارگاه: پیکلر را از حدود ۸ ماهگی… — بیشتر بخوانید». It helps AEO and internal links, and gives the eye a rest.
- **Pagination.** A real `?page=2` link, enhanced into "load more".
- **Bottom of the category page.** A **buying guide** («راهنمای خرید مثلث پیکلر», pillar content), the category FAQ (`faqs` scope `category`, as `FAQPage`), related glossary chips, and `ItemList` JSON-LD.
- **Empty state.** «این ترکیب هنوز از ورق بیرون نیامده!» A peg doll shrugs, with a «پاک کردن فیلترها» link.

### 6.3 Product card: «تختهٔ محصول»
Card structure, top to bottom:

1. **Media window (4:5).** Dogbone corners, birch with the card's unique grain, and the **assembled** drawing (or a photo).
   - Top-start badge: tree-ring age «۱۸م+».
   - Top-end: a circular maker's stamp rotated −8°, reading «تازه از کارگاه», «پرفروش» or «ساخت سفارشی».
2. **Name** (Estedad 700, step-1).
3. **One-line benefit** (step −1, burn at 80%). For example: «همراه آشپزی و کشف».
4. **Finish swatches** shown as dowel ends: natural, white-wash, pastel.
5. **Price** «۴٬۸۵۰٬۰۰۰ تومان» in tabular numerals, plus the struck-through compare-at price.
6. **Installment line** in sage: «یا ۴ × ۱٬۲۱۲٬۵۰۰ تومان».
7. **Quick-add «+» dowel** (44px). It opens a quick sheet when variants are required.

Interaction:

- **Physicality.** The card has a four-stripe ply edge. `:active` presses it 2px into that edge. On `pointer: fine` hover it lifts 4px and **swaps to the exploded view** with a 250ms settle crossfade, so the parts separate and show how it's built. Photo cards crossfade to the second photo instead.
- **Accessibility.** The stretched-link pattern on the title keeps quick-add as a separate control. Drawings get `alt` text like «طرح برج یادگیری چوبی با نردهٔ چهارطرفه».
- **Performance.** Card drawings are **pre-rendered static SVG files** (`/illustrations/{key}-assembled.svg` and `-exploded.svg`) loaded through `<img loading="lazy" decoding="async" width height>`. That keeps a grid of 24 products from bloating the HTML, and the files are cached as immutable. Only the hero and the PDP inline the interactive SVG.
- **Continuity.** `<ViewTransition name={"product-" + id} share="morph">` on the media window morphs the card into the PDP gallery.

### 6.4 Product detail page: «میز مونتاژ»
**Mobile order:**
1. Breadcrumb (scrollable).
2. **«نمایشگر میز کار» (gallery).** A ply-framed 4:5 viewer with a segmented control: «نمای کامل» (iso) · «نمای انفجاری» (exploded, dashed dowel paths, part labels A–F in mono) · «ابعاد» (orthographic drawing with dimension lines) · «در خانه» (photos and UGC, when they exist). Swiping is native scroll-snap. Switching views **animates the parts between states** (CSS transitions on part transforms, settle spring), so the product comes apart in her hands. The tab indicator follows `scroll-target-group`/`::scroll-marker` where supported, or a 1 KB island elsewhere.
3. **Title block.** H1 «برج یادگیری مونته‌سوری چوبز», the subtitle, «★ ۴٫۹ (۸۷ نظر)» (real data only), and the age ring «مناسب ۱۸ ماه تا ۵ سال».
4. **Answer-first summary** (`products.summary`): «برج یادگیری چوبز یک سکوی ایستادن ایمن با نردهٔ چهارطرفه است که کودک ۱۸ ماه تا ۵ ساله را هم‌قد پیشخوان آشپزخانه می‌کند تا در کارهای روزمره کنار شما باشد. ارتفاع سکو در ۳ حالت تنظیم می‌شود.» ⚑
5. **Price** in display weight. The **four installment blocks** show each amount and when it's due. Availability: «ساخت سفارشی · آمادهٔ ارسال در ۷ روز کاری», with a tiny five-stage workshop progress drawing.
6. **Variants.** Finish swatches are **real veneer circles** (natural, white-wash, pastel panels). Then the height or size option. Add-on tags: «حک اسم کوچولو (+۲۹۰٬۰۰۰ تومان)» opens **the engraver inline, previewing the name on the top step inside the gallery** (signature moment ③ in context), plus «رمپ همراه» and «پنل تخته‌سیاه».
7. **Primary CTA.** A full-width pressed-ply char button «افزودن به سبد», plus «سؤالی دارید؟ در بله بپرسید».
8. **«در یک نگاه»: key facts.** A `<dl>` styled as a wood table: سن مناسب، حداکثر تحمل وزن، ابعاد، وزن، جنس، پوشش، حالت‌های ارتفاع، گارانتی، «ساخت ایران». These map to `additionalProperty` in the Product JSON-LD.
9. **«شناسنامهٔ این محصول».** A kraft «birth certificate», a deeply familiar Iranian document. Fields: «نام: برج یادگیری» · «محل تولد: کارگاه چوبز» · «جنس: بِرچ ۱۸ میلی‌متری» ⚑ · «پوشش: …» ⚑ · «لبه‌ها: گردشده با شعاع ۶ میلی‌متر» ⚑ · «شمارهٔ سری: حک‌شده زیر سکو». It carries the burnt duck stamp. *Phase 3 idea:* `/shenasnameh/[code]` lets owners look up when their piece was made.
10. **«کوچولوی شما چند ماهه است؟» scale comparison.** Age chips (۱۲ ماه · ۱۸ ماه · ۲ سال · ۳ سال · ۴ سال) set the peg doll's height **to true scale**, using median heights from the WHO growth standards, next to the orthographic tower. The panel then reads «در ۱۸ ماهگی، سکو را روی پلهٔ دوم بگذارید.» It's built with radios plus `:has()` setting `--child-h`, with **no JS**.
11. **«چرا برای کوچولوی شما خوب است؟».** Skill icons with short explanations that link to glossary terms.
12. **«چطور با آن بازی کنیم؟».** Three or four peg-doll vignettes, such as «کمک در شستن میوه» and «تماشای دم کردن چای».
13. **«ایمنی و مواد».** A safety-first callout (birch card with an anar ply edge): rounded edges, anti-tip, maximum load, finish certificate ⚑, and care notes (`safetyNotes`, `careNotes`).
14. **«نظر مادرها».** Reviews with child age, plus UGC polaroids.
15. **FAQ** (`faqs` scope `product`).
16. **«قبل از خرید بخوانید».** Posts linked through `post_products`.
17. **«کامل‌ترش کنید».** A rail of `product_relations` (bundle and related).

**Desktop.** Two columns. The gallery is sticky on the start side (right, 7 columns) and the buy column takes 5 columns with a sticky price and CTA. Long-form sections run full width below.

**Sticky buy bar (mobile).** It appears **only after the main CTA scrolls away**: a mini thumbnail, «۴٬۸۵۰٬۰۰۰ تومان · یا ۴ قسط», and «افزودن به سبد». Zero JS:

```css
.pdp      { timeline-scope: --buy; }
.main-cta { view-timeline: --buy block; }
.buy-bar  { animation: buybar-in linear both; animation-timeline: --buy;
            animation-range: exit 0% exit 100%; }
@keyframes buybar-in { from { translate: 0 110%; } to { translate: 0 0; } }
/* Fallback when scroll timelines are unsupported: a 300-byte IntersectionObserver toggles [data-show] */
```

**JSON-LD.** `Product` plus `Offer` (`priceCurrency: "IRR"`, price × 10, availability `InStock`/`PreOrder`/`MadeToOrder` mapped, `shippingDetails`, `hasMerchantReturnPolicy`), `brand`, `aggregateRating` and `review` only from real reviews, `BreadcrumbList` and `FAQPage`.

---

## 7. Content hub: «بازی‌نامه» (gorgeous, and engineered for SEO, AEO and GEO)

### 7.1 Hub page: `/mag`
- **Hero.** «بازی‌نامه» in display type, sub «راهنمای علمی و مادرانهٔ بازی، رشد و خانهٔ مونته‌سوری», and a big question box: «سؤالتان را بپرسید… مثلاً: برج یادگیری از چند سالگی؟». It searches posts, glossary and FAQ, and puts **short answers first**.
- **Ways in.**
  - **Topic shelves** are pillars on the front-facing bookshelf: مونته‌سوری در خانه · رشد حرکتی و پیکلر · چیدمان اتاق کودک · راهنمای خرید و مقایسه · والدورف و بازی آزاد · ایمنی و سلامت.
  - **Age rings «سن به سن»** link to `/mag/age/[band]`.
  - **Formats:** راهنما · چک‌لیست · مقایسه · داستان مادرها.
- **«پرسش‌های داغ مادرها».** Eight questions, each with a one-line answer and a link to the full piece. It's an answer-engine magnet.
- **Glossary teaser.** A row of **wooden alphabet blocks**.
- **Topic pages** `/mag/topic/[slug]`. Pillar intro (`topics.description`), the cluster list, topic FAQ, related products, and `about` with `sameAs` (Wikidata) in JSON-LD.
- **Author pages** `/mag/author/[slug]`. A `Person` with credentials and `sameAs`, plus every article they wrote or reviewed (E-E-A-T).

### 7.2 Article page: `/mag/[persian-slug]` («دفترچهٔ بازی»)
Example URL: `/mag/برج-یادگیری-از-چند-سالگی`. Persian slugs match Persian queries and display decoded in Google results.

1. **Header.** Breadcrumb · format chip «راهنما» · **H1 phrased as a question**: «برج یادگیری از چند سالگی مناسب است؟» · dek · meta row: author (photo or peg doll) with name and role, «بازبینی علمی: [نام، مربی مونته‌سوری]», «به‌روزرسانی: ۲۴ مهر ۱۴۰۵», «۷ دقیقه مطالعه». The hero drawing is a small inline engraved SVG, so the H1 stays the LCP element.
2. **TL;DR «خلاصه در ۳۰ ثانیه».** A **kraft tag hanging from twine** with a laser-engraved border, placed *before* the TOC. Line 1 is the bold direct answer (≤ 30 words): «پاسخ کوتاه: از وقتی کودک بدون کمک و با ثبات می‌ایستد — معمولاً حدود ۱۸ ماهگی — تا حدود ۵ سالگی.» ⚑ Then three to five bullets (`posts.tldr`). Its `id="tldr"` gives a stable anchor for citations.
3. **TOC «در این راهنما».**
   - Mobile: a collapsed `<details>` showing the chapter count, plus a **wooden reading ruler** under the header with a tick every 10%. It fills through `animation-timeline: scroll()`, with no JS.
   - Desktop: a sticky vertical ruler with tick marks in the inline-end margin. The current heading is highlighted with `scroll-target-group` and `:target-current` where supported, or a 0.6 KB IntersectionObserver elsewhere.
4. **Body.** Vazirmatn at 18.5px with a line-height of 1.9, a 36em measure, on a faint dotted-paper ground. **Every H2 is a question, followed immediately by a 1–2 sentence answer paragraph**, then the depth: lists, tables and figures. Every H2 has a stable Persian `id` and a «#» link to copy, which makes deep links and AI citations easy.
5. **Callouts** come from Markdown directives in the `posts.body` GFM, rendered on the server:
   - `:::montessori` «نکتهٔ مونته‌سوری»: a mint bubble with a sprout.
   - `:::safety` «ایمنی اول»: a birch card with an anar ply edge and a shield.
   - `:::mom` «از تجربهٔ مادرها»: a speech bubble quoting a real customer with name and city.
   - `:::workshop` «از کارگاه»: a maker's note with a mono label and a small dimension drawing.
   - `:::definition`: a glossary card that links to `/glossary/[slug]`.
6. **Product embeds.** `::product{slug="learning-tower"}` renders a horizontal board card (drawing, name, age, price, add-to-cart) labelled **«در این راهنما از این استفاده کردیم»**. The commercial intent is disclosed openly, which builds trust.
7. **Comparison tables** `:::compare`, for example «برج یادگیری یا صندلی بلند؟». Wood-edged, with engraved ✓/✗ icons, and `<th scope>` for accessibility.
8. **«عددهایی که باید بدانید».** A key-numbers box with three to five quotable facts. Each has a footnote to its source. This is GEO bait done honestly.
9. **«منابع».** A numbered source list from `posts.sources`, such as the Pikler Institute, AMI and WHO. In JSON-LD these become `citation`.
10. **«پرسش‌های بیشتر».** FAQ (`faqs` scope `post`) in the drawer style, plus `FAQPage`.
11. **Author box.** Photo, name, role, `credentials` chips, a short bio, «این مطلب را … بازبینی کرده است», and a link to «ما چطور می‌نویسیم» (the editorial policy page).
12. **Next.** «فصل بعد» for series, three related posts, and related products.
13. **Utilities.** Share via the Web Share API, copy link and a Bale share link. **A print stylesheet** turns checklists into printable sheets with tick boxes, because mothers print Montessori activity lists. «لینک این بخش» sits on every H2.

**JSON-LD.** `Article` (`BlogPosting` for stories) with `author` and `reviewedBy` as Persons on the `WebPage`, `datePublished`/`dateModified`, `about`/`mentions` (topic entities with Wikidata `sameAs`, and Products), `citation`, `BreadcrumbList` and `FAQPage`.

### 7.3 Glossary: `/glossary` and `/glossary/[persian-slug]` («واژه‌نامهٔ بازی و رشد»)
- **Index.** H1 «واژه‌نامهٔ بازی و رشد» and a short intro. A **sticky bar of wooden alphabet blocks**, «ا ب پ ت ث ج چ ح خ د ذ ر ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن و ه ی». Letters with no terms are shown as *unpainted* blocks. Terms are grouped by letter, and each entry shows the term, its original form in `<bdi>`, and a one-sentence definition.
- **Term page.** The H1 is «مثلث پیکلر (Pikler Triangle)». A **laser-engraved dictionary plate** holds the one-sentence definition (`glossaryTerms.definition`) and «نام‌های دیگر: پیکلر، مثلث صعود، مثلث بالارونده». Sections follow: «به زبان ساده» · «از چه سنی؟» · «در خانه چطور؟» · «اشتباهات رایج». After those come related terms as chips, related posts, related products and sources.
- **Inline use.** Inside articles, the first use of a glossary term gets a dotted underline. Tapping it opens a **native popover** with the definition. Zero JS.
- **JSON-LD.** `DefinedTermSet` on the index, and `DefinedTerm` on each term with `alternateName`, `inDefinedTermSet`, `sameAs` and `url`.

### 7.4 Intent map (avoids cannibalisation)
| Query intent | Example | Owner page |
|---|---|---|
| Definition («… چیست») | مثلث پیکلر چیست | `/glossary/مثلث-پیکلر` |
| How, when, which age | پیکلر از چند ماهگی | `/mag/...` guide |
| Compare or choose | پیکلر یا آرک | `/mag/...` comparison |
| Buy, price | خرید مثلث پیکلر چوبی / قیمت | `/shop/pikler` category |
| Specific product | مثلث پیکلر چوبز | `/product/pikler-triangle` |

These pages link to each other in a fixed pattern: the definition links to the guide and the category, the guide links to the products, and the product links back to the guide.

### 7.5 The SEO, AEO and GEO machinery (site-wide)
- **One source of facts.** Age ranges, loads, dimensions and finishes live once in the DB. They render identically on the PDP, in article embeds, the glossary, JSON-LD, `llms.txt` and the Markdown twins. LLMs reward entities that agree with themselves.
- **Entity graph.** An `Organization` and `OnlineStore` with name «چوبز کیدز» and `alternateName: ["Choobz Kids", "Choobz", "چوبز"]`, the logo, `sameAs` (Instagram, Bale), a `contactPoint`, and «ساخت ایران». The same name spelling is used everywhere.
- **Answer formatting rules** for writers, enforced later by CMS lint: question H2s, a 40–60-word answer first, lists of seven items or fewer, tables for comparisons, a visible updated date, named and credentialed authors, and real sources.
- **Original data, which is what generative engines cite.** An annual **«گزارش بازی خانه‌های ایرانی ۱۴۰۵»** built from Instagram polls of the 50K followers (aim for n ≥ 1,000; publish the method). It's paired with a canonical **«جدول سن و وسیلهٔ بازی چوبز»** reference table that other sites will link to.
- **Markdown twins.** `/mag/:slug.md` and `/glossary/:slug.md` are rewritten to a route handler that returns the clean Markdown with front-matter (title, author, reviewer, updated, tldr, sources). Each HTML page advertises its twin with `<link rel="alternate" type="text/markdown">`. Add **`/llms.txt`** (pillars, glossary, product fact sheets, policies) and `/llms-full.txt`.
- **Crawlers.** `robots.txt` allows search and AI crawlers (Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, GPTBot, PerplexityBot, ClaudeBot, Google-Extended). Allowing them is a business decision that fits the GEO goal. Disallow `/search`, `/cart` and filter parameters. Split sitemaps (products, categories, posts, glossary, pages) with `lastmod` from `updatedAt`, plus image entries. **IndexNow** pings on publish (Phase 2), since Bing feeds several AI answer engines. An RSS feed is at `/mag/rss.xml`.
- **Iranian ecosystem.** Provide a **Torob (ترب) and Emalls product feed** (`/feeds/torob`) for price-comparison traffic, which matters a lot for Iranian e-commerce. Use Bale share links. There's a single `fa-IR` locale, so no hreflang gymnastics are needed.
- **OG images.** Generate at publish time with **sharp and an SVG template (librsvg/Pango shapes Persian correctly)** and store them in `/data/uploads/og/`. Test `next/og` (Satori) for Persian joining before relying on it. Each card shows the product drawing on birch with the title in Estedad.
- **Core Web Vitals are part of SEO.** See §9.

---

## 8. Motion system: «چوب وزن دارد»

### 8.1 Principles
1. **Wood has weight.** Things accelerate gently and land snug, with a tiny overshoot like a dowel seating. Nothing is rubbery. *Toys are allowed to play*: the duck, dowels and polaroids may bounce.
2. **Cut → Lift → Place.** Every entrance follows three beats: an outline appears (laser or kerf), the element lifts (its shadow grows, scale 1.02), and it settles into place.
3. **The laser draws, the sander smooths.** Line art draws on with `stroke-dashoffset`. State changes soften through opacity and scale, never blur (which costs too much on mid-range Android).
4. **Reading direction is motion direction.** "Forward" travels toward inline-start, which is leftward in RTL. All offsets are multiplied by `--dir` (−1 in RTL), so new pages arrive from the left and the laser writes from right to left.
5. **One signature per viewport.** Everything else finishes within 240ms.
6. **Motion decorates and explains, and never gates.** Content is fully visible and usable with no animation. The LCP element is never animated. Only `transform`, `translate`, `scale` and `opacity` animate, which keeps it on the compositor. Layout properties never animate, apart from `interpolate-size` on `<details>`.

### 8.2 Tokens (Tailwind v4 `@theme`; springs exported from Motion's `spring({ stiffness, damping }).toString()` by a build script, then committed)
```css
@theme {
  --ease-wood-out:   cubic-bezier(.22, .8, .24, 1);   /* planing: decelerate */
  --ease-wood-inout: cubic-bezier(.65, 0, .35, 1);
  /* dowel: k=420 c=28 ζ=.68 · 5% overshoot · use 500ms */
  --ease-spring-dowel: linear(0, 0.030 2.5%, 0.114 5.2%, 0.231 8.0%, 0.593 15.8%, 0.792 21.0%, 0.929 26.2%, 1.011 31.8%, 1.044 36.5%, 1.053 42.0%, 1.002 69.2%, 1);
  /* settle: k=170 c=24 ζ=.92 · no overshoot · use 500ms */
  --ease-spring-settle: linear(0, 0.023 3.5%, 0.090 7.5%, 0.472 23.2%, 0.634 31.0%, 0.747 38.0%, 0.834 45.2%, 0.910 55.0%, 0.960 66.5%, 0.988 80.5%, 1);
  /* toss (toys only): k=260 c=13 ζ=.40 · 25% overshoot · use 950ms */
  --ease-spring-toss: linear(0, 0.043 2.0%, 0.156 4.0%, 0.315 6.0%, 0.807 11.5%, 0.942 13.2%, 1.039 14.8%, 1.178 17.8%, 1.243 20.8%, 1.249 23.0%, 1.229 25.2%, 1.003 36.2%, 0.961 39.5%, 0.940 42.8%, 0.942 47.5%, 0.998 58.2%, 1.014 64.5%, 0.997 85.5%, 1);
  /* press: k=700 c=45 ζ=.85 · use 330ms */
  --ease-spring-press: linear(0, 0.025 2.8%, 0.095 5.8%, 0.518 18.2%, 0.694 24.5%, 0.821 30.8%, 0.913 37.8%, 0.970 45.8%, 1.000 56.0%, 1);
}
:root { --dur-instant: 90ms; --dur-quick: 160ms; --dur-ui: 240ms; --dur-move: 420ms; --dir: -1; }
```

| Use | Duration | Easing |
|---|---|---|
| Button and board press | 90ms down / 330ms up | press |
| Hover, colour, focus | 160ms | wood-out |
| Popover, menu, sheet content | 240ms | settle (enter) / wood-out at 160ms (exit) |
| Cards entering, parts switching views | 420–500ms | settle / dowel |
| Toys: duck, dowel pop, polaroid sway | 950ms | toss |
| Signatures (hero, workshop, engraving) | 900–2,600ms, choreographed | dowel and settle staggered 90ms |

### 8.3 Scroll-driven inventory (CSS `@supports (animation-timeline: view())`, `@layer motion`)
Header compress · hero explode-scrub · featured cards entry · workshop steps (sticky on mobile, horizontal track on desktop) · room build · answer-tag swing · polaroid sway · reading ruler · TOC ruler · PDP buy bar · footer duck.
Everything is wrapped in `@media (prefers-reduced-motion: no-preference)`. Where scroll timelines are missing (Firefox today, older Safari), entry effects degrade to a static final state. One shared 0.8 KB IntersectionObserver fallback, loaded only when `!CSS.supports('animation-timeline: view()')`, adds a `data-inview` class for the few time-based entries that are worth keeping.

### 8.4 Page transitions (React 19.3 `<ViewTransition>`, which works in the App Router with no config)
- **Product card → PDP gallery.** A shared `name="product-{id}"` with `share="morph" default="none"`, 400ms on the settle spring. A *board sliding out of the rack*.
- **Book cover → article hero.** `name="post-{id}"`, the same morph.
- **Route changes: "sheet slide".** Tagged `addTransitionType('nav-forward' | 'nav-back')`. Forward: the old page drifts 24px toward inline-end and fades out (150ms). The new page arrives from inline-start over 240ms with a fade delayed until the old one has left. Back reverses it.
- **Within a route.** Shop filter and sort changes crossfade the grid. Article TOC jumps use smooth scroll only when motion is allowed.
- **Not view transitions:** drawers, sheets and popovers. They use `@starting-style` and `transition-behavior: allow-discrete` on `display`/`overlay`.
- Unsupported browsers simply navigate.

### 8.5 Reduced motion and «حرکت کمتر»
- `prefers-reduced-motion: reduce` turns off scroll-driven transforms and the laser, SMIL and duck rolls. The hero shows its final frame. View transitions become a 120ms crossfade (`::view-transition-group(*) { animation-duration: 120ms }`). Feedback is kept to colour and opacity at 120ms or less.
- A footer toggle, **«حرکت کمتر»**, sets a cookie so the server adds `data-motion="reduced"` to `<html>`. That's for vestibular comfort, low battery, or a mother who just wants calm.
- A **"lite" tier** activates when the Save-Data header is present (the server reads `Save-Data: on`) or when `navigator.deviceMemory ≤ 2`. It skips the grain-reveal masks, lamp sheen and sawdust, and keeps the signatures.

---

## 9. Performance plan

### 9.1 Budgets (Moto G Power or Galaxy A-series class on throttled 4G)
| Metric | Target |
|---|---|
| LCP (p75 mobile) | **< 1.8s** (brief: < 2.0s) |
| CLS | **< 0.02** |
| INP | **< 120ms** |
| Home HTML | ≤ 60 KB brotli (including the inline hero SVG at ≤ 14 KB) |
| CSS | ≤ 22 KB brotli, inlined (`experimental.inlineCss`; Tailwind keeps it small, and most visitors are first-time mobile) |
| JS first load | Framework and router, measured on the first build (expect about 85–100 KB br), **plus ≤ 15 KB of islands on home** |
| Fonts | 2 preloaded files ≤ 80 KB total, plus 1 optional mono file of about 12 KB |
| Third-party runtime requests | **0** (the eNamad badge image is lazy, sits below the fold, and is on an Iranian host) |

### 9.2 Rendering strategy (Cache Components and Partial Prefetching are already on in `next.config.ts`)
- Every public page is a **static shell plus cached data**. Query functions in `src/db/queries` use `'use cache'` with `cacheTag('product:<slug>' | 'products' | 'posts' | 'post:<slug>' | 'settings' | …)` and `cacheLife('max')`.
- Phase-2 admin writes call `updateTag()` (read-your-writes in Server Actions) or `revalidateTag()`. The existing `REVALIDATE_SECRET` endpoint covers seed scripts.
- **The DB lives in the volume, not the image.** `next build` in Docker has no `/data`. So `generateStaticParams` returns the known slugs only when a DB exists at build time. Otherwise routes render on their first request and stay cached. A post-deploy warm-up script requests the top 50 URLs.
- **Per-request holes** sit inside small `<Suspense>` boundaries with sized fallbacks (CLS 0): the cart badge (cookie), the shop grid when `searchParams` are present, and the search page.

| Route | Shell | LCP element |
|---|---|---|
| `/` | Static and cached | Hero **H1 text** (Estedad, preloaded). The inline SVG isn't an LCP candidate and never delays it |
| `/shop`, `/shop/[category]`, `/shop/age/[band]` | Static intro, cached grid (dynamic only with filters) | H1 or intro paragraph. The first two card images get `fetchpriority="high"` |
| `/product/[slug]` | Static and cached | Title or summary text while drawings are inline. When photos exist, the first gallery photo via `next/image` with `priority`, AVIF at about 828w and roughly 60 KB |
| `/mag`, `/mag/[slug]`, `/glossary/*` | Static and cached | H1 or the TL;DR tag text |
| `/search`, `/cart` | Dynamic, `noindex` | — |

### 9.3 Client islands (everything else is a Server Component)
| Island | Where | Loads | Cost (br, estimate) |
|---|---|---|---|
| `CartButton` + `CartProvider` (optimistic) | All pages | Eager | ~3 KB |
| `CartDrawer` content | All pages | On first open or first add | ~4 KB |
| `AddToCart` + fly (`motion/mini` WAAPI) | Cards, PDP | Button eager (0.8 KB); fly lazy on first add | ~0.8 + 3 KB |
| `VariantPicker` + installment recalculation | PDP | Eager on the PDP | ~3 KB |
| `NameEngraver` | Home part 05 («حالا نوبت شماست»), PDP add-on | On focus or click | ~4 KB |
| `RingShareCard` (canvas plus Web Share) | Home | On click | ~3 KB |
| `SearchDialog` (live results) | Header | On open (the GET form works without it) | ~4 KB |
| `FilterEnhancer` | Shop | `requestIdleCallback` | ~1.5 KB |
| `LampSheen` | Desktop (`pointer: fine`) only | Idle | ~0.5 KB |
| `GalleryTabs` (fallback for `::scroll-marker`) | PDP | Feature-detected | ~1 KB |
| `TocObserver` (fallback for `:target-current`) | Article, desktop | Feature-detected | ~0.6 KB |
| Polyfills (invoker commands, scroll-timeline IO fallback) | Where needed | Feature-detected | ~1–1.8 KB |

**Zero-JS features:** the hero assembly, ring finder, cut-sheet categories, rails, room hotspots and scenes, answer tags, FAQ drawers, mega menu, mobile menu, reading ruler, PDP buy bar, dimension scale comparison, gallery swipe and footer duck.
**Guard rails:**
- `motion/react` is restricted by ESLint `no-restricted-imports` to an allow-list of island files.
- No carousel or animation libraries.
- No icon packages.
- `@next/bundle-analyzer` runs in CI, with a size-limit check that fails the PR if home islands exceed 15 KB br.

### 9.4 Fonts
- Use `next/font/local` with **preload on two files only**: Estedad variable (instanced to `wght` 700–900) and Vazirmatn variable (400–700). Subset with `pyftsubset` to Arabic (U+0600–06FF), Arabic Presentation Forms (U+FB50–FDFF, U+FE70–FEFF), ZWNJ/ZWJ/bidi marks (U+200C–200F), Basic Latin, «»٬٫× and the Persian digits. Expect about 35–45 KB per file (verify on the first build).
- Vazir Code uses `font-display: optional` with no preload (labels only), so it never causes a swap shift.
- **CLS-safe fallback.** The next/font default fallback (Arial) has no Persian glyphs on Android, where text falls back to Noto Sans Arabic, and on Windows to Tahoma. So define custom `@font-face` fallbacks over `local("Noto Sans Arabic"), local("Tahoma"), local("Geeza Pro")` with measured `size-adjust`, `ascent-override` and `descent-override` tuned against Vazirmatn and Estedad. The hero H1 also reserves its height through fixed line-height and `text-wrap: balance`.
- Fonts are served from the app (`/_next/static/media`, immutable). No Google Fonts, ever.

### 9.5 Images and media (one volume)
- Phase 1 uses `next/image` with `images.localPatterns` for `/media/**`, which the existing route handler streams from `/data/uploads` with immutable caching. Formats are AVIF then WebP, with exact `sizes` attributes. `width`/`height` always come from the `media` row (CLS 0), and the dominant colour is used as the background.
- **Phase 2 upload pipeline.** Pre-generate the AVIF and WebP widths (320, 640, 960, 1280, 1920) into `/data/uploads/_v/<hash>/` at upload time with sharp, and point a custom `next/image` loader at them. After a container redeploy there's no cold optimiser cache, no runtime sharp CPU spike, and everything stays inside the single volume.
- Volume layout: `/data/choobz.db` (+ `-wal`, `-shm`) · `/data/uploads/{products,posts,ugc,pages}` · `/data/uploads/_v` (variants) · `/data/uploads/og` · `/data/backups`.
- Drawings: card SVGs are pre-rendered at build time from the manifests into `/public/illustrations` and SVGO'd. The hero and PDP inline only the parts they animate.

### 9.6 Delivery and monitoring
- Host the container **inside Iran**. An abroad host adds 100–200ms RTT and international-bandwidth throttling. Put Caddy or nginx in front for brotli, HTTP/2 and HTTP/3, and TLS. A domestic CDN, ArvanCloud for example, is optional for `/_next/static` and `/media`. Target TTFB under 200ms inside the country.
- SQLite runs in WAL mode (already configured) on a **local** volume, never on a network filesystem. Run one app replica, and a nightly `.backup` to `/data/backups` with an off-box copy (Litestream to an Iranian S3-compatible bucket is an option).
- **RUM.** `useReportWebVitals` sends a 10% sample to our own endpoint, stored in a `vitals` table, so we see real INP and LCP from Iranian devices. Analytics are self-hosted or server-side only. No foreign tags.

---

## 10. Risks and mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Kitsch or skeuomorphism overload.** Wood everywhere looks like a theme park | The restraint rules in §2.8 (wood on objects only, a 70/20/10 ratio, one signature per viewport, three joints per page) plus a weekly squint-test review of every page |
| 2 | **Low-end Android performance** (Galaxy A-series and Xiaomi dominate) | Compositor-only animation, no SVG filters, static `<img>` drawings in grids, `content-visibility` on below-fold sections, the lite tier for Save-Data and low memory, and testing on a real budget phone with 4G throttling before every release |
| 3 | **Browser support** for scroll timelines, anchor positioning, invoker commands and `:target-current` | Every effect has a complete static end state as its default. `@supports` gating, tiny feature-detected fallbacks, no feature on the critical path, and a Firefox plus older iOS QA pass |
| 4 | **No product photography.** Drawings could become a bottleneck | The parts-manifest pipeline makes one DXF give five views, so a product costs about one day once the renderer exists. Peg dolls and doodles are a fixed library from one illustrator. Photos slot into `<Plate>` and scene hotspots with no redesign |
| 5 | **Drawings that misrepresent products** and trigger returns | Geometry comes from the real cut files, the "ابعاد" view is mandatory, finishes are shown as real veneer swatches, and photos are added as they arrive |
| 6 | **Unverified claims** (certifications, SnappPay terms, «۵۰ هزار …», edge radius) | Every ⚑ item has to be confirmed by the workshop. Each claim is stored with its source in the CMS. Testimonials and UGC are real and consented only, and placeholders are visibly marked in the seed |
| 7 | **Persian rendering pitfalls** in SVG text, canvas, OG images, ZWNJ and Arabic characters | Keep real text in HTML. Test the engraver and share card in Safari, Chrome and Firefox. Pre-render OG images with sharp/Pango. Run the normaliser on seed data, the CMS and search |
| 8 | **Font weight and fallback CLS** | Two subset variable files, preloaded. Measured metric overrides for the Arabic-script fallbacks. Mono uses `optional`. A CLS check in CI with Lighthouse on key templates |
| 9 | **Cache coherence** with Cache Components and DB edits | All writes go through the app (Phase 2 admin) and call `updateTag`/`revalidateTag`. Seed and maintenance scripts hit the revalidate endpoint. Run the post-deploy warm-up |
| 10 | **SQLite in Docker**: single writer, WAL files, permissions, backups | One replica, WAL with `busy_timeout` (already configured), a local volume, `chown` in the entrypoint, nightly backups plus an off-box copy, and a restore drill |
| 11 | **Third-party and sanctions exposure** (payment SDKs, badges, maps, fonts) | No foreign runtime dependencies. Payment integrations stay on the server. Badges are lazy linked images. Everything is self-hosted and the site is hosted in Iran |
| 12 | **SEO cannibalisation** between the glossary, guides and categories | The intent map in §7.4, canonical rules, and a fixed internal-link pattern |
| 13 | **Thin or AI-mill content** hurting E-E-A-T and GEO | An editorial policy page, named expert authors and reviewers, sources on every article, original data (the annual report), and quality ahead of quantity: 10 excellent pillars before 100 posts |
| 14 | **Engraver misuse** (offensive text in shared images) | It's local-only rendering with a 14-character limit and nothing stored. If the add-on is ordered, the text gets manual review in the Phase-2 admin |
| 15 | **Motion sensitivity and accessibility** | `prefers-reduced-motion` plus the «حرکت کمتر» toggle. WCAG 2.2 AA contrast (§2.2). A 2px firooze focus ring offset by 2px. Tap targets of 44px or more. A Persian `<title>` on every meaningful SVG and `aria-hidden` on decorative ones. A «رفتن به محتوای اصلی» skip link. `aria-live` cart announcements |
| 16 | **Phase-1 scope creep** | The build order in Appendix C. The signatures ship in a "static first" form: the final frame works on day one and motion is layered on afterwards |

---

## Appendix A: Component map (`src/components/…`)
- **ui/**
  - Surfaces and controls: `Board`, `PlyButton`, `DowelChip`, `RingBadge`, `MakerStamp`, `KerfDivider`, `FingerJointSeam`
  - Mother's-hand marks: `Highlight` (mustard), `MintBubble`, `KraftTag`, `Doodle`
  - Commerce: `Price`, `InstallmentBlocks`
  - Plumbing: `Icon` (sprite), `Plate`, `Sheet` (dialog), `Pop` (popover)
- **illustrations/**: `PartsRenderer` (flat, assembled, exploded, ortho, scale), `manifests/*.json`, `PegDoll`, `TreeRings`, `RoomScene`, `GrainPattern`, `DuckCart`, `Laser`.
- **home/**: `HeroFlatPack`, `RingFinder`, `CutSheetCategories`, `FreshRail`, `LivingWorkshop`, `MontessoriRoom`, `AnswerTags`, `MagShelf`, `PegRailUGC`, `MotherNotes`, `PeaceOfMind`, `FaqDrawers`, `NameEngraver` (island), `RingShareCard` (island).
- **shop/**
  - Listing: `ProductCard`, `ProductGrid`, `FilterBar`, `FilterSheet`, `WorkshopNoteTile`
  - Product page: `WorkbenchViewer`, `VariantPicker` (island), `ScaleCompare`, `ShenasnamehCard`, `KeyFacts`, `BuyBar`
  - Cart: `CartDrawer` (island), `TapeMeasure`
- **mag/**: `ArticleHeader`, `TldrTag`, `TocRuler`, `ReadingRuler`, `Callout` (montessori, safety, mom, workshop, definition), `ProductEmbed`, `CompareTable`, `KeyNumbers`, `Sources`, `AuthorBox`, `AlphabetBlocks`, `TermPlate`, `GlossaryPopover`.
- **layout/**: `Header`, `MegaMenu`, `BottomToolbar`, `MenuSheet`, `SearchDialog`, `Footer` (workbench), `DuckGoesHome`, `MotionToggle`, `ThemeToggle`.

## Appendix B: Data model additions (building on the existing `src/db/schema.ts`)
The current schema already covers most of this concept:
- `illustration` keys on products, categories and posts
- `products.summary`, `posts.tldr`, `posts.sources` and `reviewerId` for AEO and GEO
- `glossaryTerms.definition`
- scoped `faqs`
- `communityPhotos.illustration` as a fallback
- `media.dominantColor` and `media.blurDataUrl`
- Toman prices with the IRR conversion

Additions for Phase 1 and Phase 2:
- `scenes` (slug, name, illustration | mediaId, sortOrder) and `scene_hotspots` (sceneId, productId, xPct, yPct, label, sortOrder). Shop-the-room, ready for photos.
- `workshop_log` (stage, body, count, createdAt). The «امروز در کارگاه» strip, shown only when it's fresh.
- `skills` (key, name, icon, description, glossarySlug). Gives labels to `products.skills` and links them to the glossary.
- `product_addons` (productId, key «engraving»|…, name, price, maxChars) or an `engravable` flag. Drives the engraver add-on.
- `glossaryTerms.alternateNames` (JSON). The «نام‌های دیگر» field and `alternateName`.
- `posts.seriesKey` and `seriesOrder`. Powers «فصل بعد».
- `carts` and `cart_items` (cookie cart id) for the drawer. Checkout and orders come in Phase 2.
- `vitals` (RUM sample) and FTS5 virtual tables `products_fts`, `posts_fts` and `glossary_fts`, kept in sync by triggers.
- Settings keys: `hero`, `trust`, `payments`, `shipping`, `ageBands`, `workshopSteps`, `announcement`, `socials`.
- **Seed (real, DB-backed):** 9 categories, about 18 products (placeholder prices marked), 2 scenes, 10 posts across 6 topics, about 25 glossary terms, about 20 FAQs, and 8 *placeholder* testimonials clearly marked as such.

## Appendix C: Phase-1 build order
1. Tokens (`@theme`), fonts with subsetting and metric overrides, the icon sprite, the grain generator, and primitives (`Board`, `PlyButton`, `DowelChip`, `KerfDivider`, `Plate`).
2. `PartsRenderer` plus the learning-tower manifest. Prove the five views, then the hero assembly.
3. Layout: header, toolbar, menu sheet, mega menu, footer and cart drawer.
4. Home parts 01–12, each shipping static first with motion layered on after.
5. Shop: the listing with filters, the card, and the PDP (gallery views, scale comparison, شناسنامه, buy bar).
6. بازی‌نامه: hub, article template with callouts and embeds, glossary, topic and author pages.
7. SEO plumbing: JSON-LD, sitemaps, robots, `llms.txt`, Markdown twins, OG pre-rendering, Torob feed.
8. A performance and accessibility pass on a budget Android phone over 4G, the reduced-motion audit, then launch QA of the ⚑ claims with the workshop.

> **Why this concept should win.** Most kids' brands *decorate* with wood. This one runs on the brand's own cut files. The first two seconds show how a Choobz piece is made, not just what it looks like. Then the site gets personal: the visitor finds her child's ring, sees her child's height next to the tower, and burns her child's name into it. It stays honest, fast and calm enough for a 2 a.m. scroll while nursing. That makes it **a brand nobody else can copy, because it's built from the workshop itself.**
