# Tactile Toy Box — جعبه‌ی اسباب‌بازی لمسی

**Art direction + UX concept for choobz.kids · Phase 1 (public front-end) · v1.1**

*v1.1 brings this concept into line with the project decisions made after v1: the font pairing in `docs/FONTS.md` (Estedad + Ario + Mikhak), the clusters, URLs and article blocks in `docs/CONTENT-PLAN.md`, and the tables already in `src/db/schema.ts`. Where this document and those files disagree, the files win.*

> **The website is a wooden toy.** Every surface is cut from birch ply. Every button sits on a laminated edge and presses down when you touch it. Every product has its own grain that no other product shares. The whole thing stays as calm, honest and fast as a Montessori shelf.

---

## 0. The concept on one page

**Material system (three materials only):**
- **Wood (چوب):** structure and everything you can touch.
- **Paper (کاغذ):** reading surfaces.
- **Felt (نمد):** voices, tips and testimonials.

These are the three Montessori/Waldorf materials, so the interface is built from the same things as the products.

**Three non-negotiable rules:**
1. **Raised means touchable. Recessed means container.** Anything that sits on a laminated ply edge is interactive. Trays, slots and grooves hold content and inputs. The material itself tells you what you can tap, with no exceptions anywhere on the site.
2. **Painted faces, raw edges.** Colour goes on faces. Edges always show the plywood layers, the way real painted birch ply does. This one detail is the brand's visual signature.
3. **Delight in the form, clarity in the words.** Labels stay plain («سبد خرید», «افزودن به سبد»). The joy comes from how things look, move and sound, never from clever wording that slows a purchase.

**Three signature moments:**
- **«برجت را بساز»:** a hero rainbow stacker you play with, then share as an Instagram-story postcard.
- **«توپ را دنبال کن»:** a wooden ball rolls down a Pikler ramp through the age guide as you scroll.
- **«اتاقش را بچین»:** a Montessori room builder with a live total and a SnappPay installment line.

**Tech posture:**
- React Server Components first.
- CSS does almost all the motion: scroll-driven animations and `linear()` spring curves.
- JS "engines" load lazily only when the user shows intent.
- Zero third-party runtime requests. Fonts, images and analytics are all self-hosted.
- Every upload and generated asset lives in `/data`.

---

## 1. Big idea & emotional promise

Every Choobz product promises that a child learns by touching, so the site should be touched, not just scrolled past. Tactile Toy Box makes choobz.kids feel like one wooden object. On desktop the home page is a Montessori sorting tray seen from above, and its compartments hold the categories, the age guide and the best-seller shelf. Headlines are CNC-cut ply letters. Buttons press down 4 mm on laminated edges and answer with a soft wooden *tock*. Light falls through an arched window, and it really moves with the time of day.

The typical visitor is a mother browsing one-handed at 23:40 with a sleeping toddler on her arm. The promise to her is: **«اینجا آرام است، اینجا صادق است، و هر چیزی که می‌بینی را می‌شود لمس کرد.»** The site is the opposite of the loud, plastic, discount-banner kids' e-commerce she is used to, and of daarakwood's white template. She is not "shopping". She is *building her child's world piece by piece*, which is exactly the sentence in Choobz's own bio: «کنار شما، برای ساختن دنیایی چوبی».

### The 3 signature moments (built to be screenshotted)

#### ① «برجت را بساز»: the Stacker Postcard (home hero)

**What she sees:**
- Seven plant-dyed rainbow-stacker arcs stand in a recessed wooden tray, under a light patch from an arched window.
- On load, the arcs drop into place one by one, each with a two-bounce "clack" settle.
- Ardi, the logo duck rebuilt as a real pull-toy, rolls in from the right. Its string draws the mustard underline under the word «چوبی».

**How she plays:**
- She can drag any arc.
- Arcs snap into **nest**, **tower**, **bridge** or **tunnel** slots.
- An arc flipped upside down and dropped on the floor **rocks** like Choobz's own rocker, with a damped oscillation of 3–4 swings before it rests.

**The share moment:**
- After her first move, a felt bubble offers: «قشنگ شد! کارت‌پستالش را بساز و استوری کن».
- One tap renders a 1080×1920 story card on `<canvas>`. It contains her arrangement on unique grain, Ardi, the Jalali date and `choobz.kids`.
- The card opens in the native share sheet (Web Share Level 2 with `files`), so it can go straight to an Instagram story or to Bale.

**Why it spreads:** every card is different, it carries the brand, and the moment is about the mother's creativity, not about our products.

**How it's built:**
- The stage is inline SVG and its intro is CSS-only.
- A 5–6 KB pointer-events drag engine with a tiny custom spring is imported on idle or on first `pointerdown`.
- The postcard module (~3–4 KB) loads only when tapped.

#### ② «توپ را دنبال کن»: the Pikler Ramp age journey (home)

**What she sees:**
- A long zig-zag Pikler ramp board, with side rails and ply edges, runs down the section.
- A wooden ball rolls down it **as she scrolls** and rotates correctly for its distance travelled.
- The ball pauses at five landings: «۰ تا ۶ ماه» → «۶ تا ۱۲ ماه» → «۱ تا ۲ سال» → «۲ تا ۳ سال» → «۳ تا ۶ سال». These are the same five age hubs as `/age/{range}` in the content plan.
- At each landing an age card lights up. Its felt tag fills with colour and a hand-drawn sprout grows.

**What each landing holds:**
- A real parent question as an H3, with a direct two-sentence answer.
- Two product chips for that age.

**How it ends:** the ball drops into a small toy box, which opens on «پیشنهادهای مخصوص سن کودکت».

**Why it spreads:** it turns the most common Persian search intent ("اسباب بازی مناسب ۱ سالگی") into something she plays through.

**How it's built:** zero JS. Scroll-driven CSS animations run on the compositor. The ramp path is baked into transform keyframes in container-query units (details in §8).

#### ③ «اتاقش را بچین»: the Montessori Room Builder (home + `/rooms/*`)

**What she sees:**
- A front-elevation illustration of a cream room with an arched window, a wood floor and five slots.
- Below it, a tray of raised ply tokens. Tapping one makes the piece *fly* into its slot, land with a clack and a three-particle sawdust puff.
- Presets: «اتاق ۱ سالگی»، «۲ تا ۳ سالگی»، «۳ تا ۶ سالگی»، «اتاق کوچک ۹ متری». The last one is drawn for a real 9 m² Iranian apartment bedroom, the angle the content plan picked to beat competitors.
- A live summary: «۵ تکه | جمع: ۱۸٬۷۰۰٬۰۰۰ تومان | یا ۴ قسط ۴٬۶۷۵٬۰۰۰ تومانی با اسنپ‌پی».
- Two actions: «همه را به سبد اضافه کن» and «عکس اتاق را ذخیره کن».

**Why it spreads:**
- Mothers planning a sismooni (سیسمونی) share room plans with their mothers, sisters and husbands.
- It also answers the real question ("how much does a full Montessori room cost?") and turns browsing into a bundle cart.

**How it's built:**
- A complete preset room is server-rendered, so crawlers and no-JS users see a real composed room.
- A 10–14 KB engine loads when the section is within 600 px of the viewport.
- Every preset has its own crawlable landing page, e.g. «چیدمان اتاق مونته‌سوری ۲ سالگی».

### Quiet delights (no single screenshot, but they make it unforgettable)

- **Wood fingerprint (اثر انگشت چوب).** Each product's grain is generated from its slug, so no two cards on the site share a grain. This is the literal answer to «تکرارنشدنی».
- **Daylight room.**
  - A 300-byte inline script reads the local hour before first paint and sets `data-daypart`.
  - Morning light enters from the right, evening light is warm and comes from the left, and at night a lamp glow appears.
  - The hero bubble greets her: «صبح بخیر! امروز چی می‌سازیم؟» or, at night, «خسته نباشی! کوچولو خوابید؟ آرام بگرد، صداها خاموش‌اند.»
- **Lullaby mode (حالت لالایی).** A full warm dark palette that follows the OS preference or a manual toggle. Wood looks lamp-lit and sound is forced off.
- **Ply letters.** The hero word «چوبی» and the category titles are rendered as CNC-cut plywood letters standing on the page, using stacked `text-shadow` laminations with no images. They "push in" when pressed.
- **«کش بیاد»: the pull-string word.**
  - Ardi's pull-string ends at one word set in Mikhak: «بکش» ("pull") in the hero bubble.
  - Tugging the string (drag, or tap) stretches the word's joins along Mikhak's live kashida axis (`KSHD` 100 → 200). When she lets go it springs back. The word does what it says.
  - The DOM text stays clean «بکش», with no kashida characters in it, so search and copy/paste are unaffected.
  - It is one short word inside a fixed-size box with `contain: layout`, because animating `font-variation-settings` re-lays out text on every frame (see `docs/FONTS.md` §7.4). It never runs on an INP-critical path, and reduced motion turns it off.
  - No other Iranian kids' brand does this. Live kashida axes are rare in Persian fonts.
- **Shape-sorter categories.** Every category has a shape (triangle, arch, hexagon…) and its piece drops into its hole as you scroll.
- **Bead-maze navigation.** The mobile tab bar's active indicator is a wooden bead that slides along a wavy wire to the new tab.
- **Abacus installments.** SnappPay's four installments are four rows of beads that slide across.
- **Alphabet-block glossary.** The Persian alphabet as wooden letter cubes, from «الف» to «ی».
- **Puzzle 404.** «این تکه گم شده!»: drag (or tap) the missing piece back into its hole to go home.
- **Synthesized wood sound.**
  - Sound is off by default: «اگر کوچولو بیدار است، صدای چوب را روشن کن.»
  - A WebAudio "tock" is synthesized in about 1 KB with no audio files.
  - Its pitch is randomized ±8%, so it never sounds identical twice.

---

## 2. Visual language

### 2.1 Palette: twelve tokens

Contrast is computed with the WCAG 2.x relative-luminance formula.
- **Canvas:** `birch`.
- **Text:** only `walnut`, `bark`, `anar`, `sage-ink` and `firouzeh` are approved as text colours on light surfaces.

| # | Token | Persian name | Hex | Role | Contrast notes |
|---|---|---|---|---|---|
| 1 | `--birch` | توس | `#F6EFE3` | Page canvas (warm cream, like their walls) | — |
| 2 | `--milk` | شیری | `#FFFCF6` | Raised faces of cards, drawer, article paper | walnut on milk **15.1:1** |
| 3 | `--ply` | رویه‌ی چندلا | `#E6D3B3` | Ply faces in illustrations, dividers, recessed trays | walnut **10.6:1**, bark **4.7:1** (AA) |
| 4 | `--beech` | راش | `#C69C6D` | Laminations, wood shadow, grain strokes | walnut **6.2:1**. Never used as text on birch (2.2:1) |
| 5 | `--walnut` | گردو | `#2E2219` | Primary ink: body and headings | on birch **13.5:1** (AAA) |
| 6 | `--bark` | پوست درخت | `#6B5646` | Secondary text, meta, captions, input borders | on birch **6.0:1**, on milk **6.7:1** (AA) |
| 7 | `--anar` | انار | `#A8402E` | Primary CTA face, prices on sale, safety callouts | milk text on anar **6.0:1**. Anar as text on birch **5.3:1** (AA) |
| 8 | `--saffron` | زعفران | `#E8A33D` | Badges, stacker arc, "new" tags | walnut on saffron **7.2:1**. Never used as text |
| 9 | `--mustard` | خردلی | `#F2C94C` | Highlighter swash behind words (Instagram signature) | walnut on mustard **9.7:1** |
| 10 | `--pistachio` | پسته‌ای | `#B5CC8E` | Success tints, age tag fills, stacker arc | walnut on pistachio **8.8:1** |
| 11 | `--sage` / `--sage-ink` | مریم‌گلی | `#CFE3D2` / `#3B6650` | Felt speech bubbles (their Instagram mint) / links and tip text | walnut on felt **11.5:1**. Sage-ink on felt **4.9:1**, on birch **5.7:1** |
| 12 | `--firouzeh` | فیروزه | `#2B7279` | Focus rings (3 px), active states, secondary links. A Persian-tile nod | on birch **4.9:1** (AA). As a focus ring vs birch it passes 3:1 |

**Rules for using colour:**
- **Proportions:** about 70% birch, milk and ply; about 20% wood tones and walnut ink; about 10% dyes. Keep **at most one loud dye per viewport**.
- **No white:** pure `#FFFFFF` and pure black are banned, so even "white" products are drawn in `milk`.
- **Dye set (illustration only):** the seven stacker arcs use a plant-dye sequence. Anar `#A8402E`, saffron `#E8A33D`, mustard `#F2C94C`, pistachio `#B5CC8E`, sage-mid `#7FA88E`, firouzeh-light `#4F9BA1`, nil (indigo) `#56608F`. All are slightly desaturated, like natural dyes on wood rather than plastic primaries.

**Lullaby (dark) palette.** It applies under `prefers-color-scheme: dark` or the manual toggle.

| Token | Hex | Notes |
|---|---|---|
| `--birch` → night walnut | `#1D1612` | Canvas |
| `--milk` → lamp-lit ply | `#2A201A` | Raised faces |
| `--walnut` → candle | `#F4EADB` | Text, about 15:1 |
| `--bark` → dusk | `#CDB9A1` | Secondary text, **9.4:1** |
| `--anar` → ember | `#E07A5F` | CTA face with walnut-night text, **6.0:1** |
| `--sage-ink` → moss | `#9CC7AE` | Links |
| `--beech` → night edge | `#7A5B40` | Laminations |

**How Lullaby mode is wired:**
- The tokens are redefined under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`, so both the OS preference and the manual toggle work.
- Illustration SVGs switch to night variants, rendered by the same generator, through `<picture><source data-night media="(prefers-color-scheme: dark)">`.
- A media query can't see the manual toggle. So the 0.3 KB toggle script rewrites each `source[data-night]` `media` attribute to `all` or `not all`, and the browser swaps the image with no other JS.

### 2.2 Materials & textures

**① Birch ply (structure).** There are three parts.

*a. Faces:* flat `--ply`, `--milk` or a dye colour.

*b. Laminated edge (the signature):*
- A raised piece shows a 6 px "thickness" below its face.
- That thickness is a `repeating-linear-gradient` of alternating light and dark veneers, which reads like 5–7 visible ply layers.
- Pressing translates the face down 4 px while the edge shrinks to 2 px, so you physically see the piece being pushed.

```css
.ply {                         /* any raised, touchable piece */
  --edge: 6px;
  position: relative; isolation: isolate;
  border-radius: var(--r-card);
  background: var(--face, var(--milk));
  transition: translate 240ms var(--ease-settle);
}
.ply::before {                 /* the raw laminated edge */
  content: ""; position: absolute; inset: 0; z-index: -1;
  border-radius: inherit;
  translate: 0 var(--edge);
  background: repeating-linear-gradient(to bottom,
      #EBDDC2 0 1.5px, var(--beech) 1.5px 2.5px);
  box-shadow: 0 10px 18px -10px rgb(46 34 25 / .45);
  transition: translate 240ms var(--ease-settle);
}
.ply:active            { translate: 0 4px; transition-duration: 90ms; }
.ply:active::before    { translate: 0 calc(var(--edge) - 4px); transition-duration: 90ms; }
```

*c. Procedural grain (the "wood fingerprint"):*
- It is plain stroked SVG paths, generated **on the server** from a seeded PRNG.
- It is **not** `feTurbulence`. SVG filters repaint on scroll and are expensive on mid-range Mali/Adreno GPUs.
- Each grain is 14–22 gently wavy lines with 0–2 elliptical knots, drawn in `--beech` at 9–14% opacity. That is about 1–2 KB of path data.

```ts
// src/lib/grain.ts — deterministic, cached per product (≈1.5 KB output)
export function grain(seed: string, w = 400, h = 500) {
  const rnd = mulberry32(fnv1a(seed));
  const lines = 14 + Math.floor(rnd() * 9);
  const knotY = rnd() < .65 ? h * (.25 + rnd() * .5) : null;
  const d: string[] = [];
  for (let i = 0; i < lines; i++) {
    let x = (i + rnd() * .6) * (w / lines), y = -10;
    let p = `M${x.toFixed(1)} ${y}`;
    while (y < h + 10) {
      const bend = knotY && Math.abs(y - knotY) < 60 ? 14 * Math.sign(x - w / 2) : 0;
      const nx = x + (rnd() - .5) * 10 + bend, ny = y + 40 + rnd() * 30;
      p += ` Q${(x + nx) / 2 + (rnd() - .5) * 8} ${(y + ny) / 2} ${nx.toFixed(1)} ${ny.toFixed(1)}`;
      x = nx; y = ny;
    }
    d.push(p);
  }
  return { d, knotY };
}
```

**② Paper (reading).**
- Article bodies, the TL;DR card and long text sit on `--milk` paper.
- A self-hosted 160 px fibre-noise tile (WebP, about 2 KB) is laid over it at 3% opacity with `background-blend-mode: multiply`.
- There are no other bitmap textures anywhere.

**③ Felt (voices).**
- Speech bubbles, tips and testimonials use `--sage` felt, with mustard and anar variants.
- They reuse the same noise tile at 6%, plus a "stitch" made of `outline: 1.5px dashed color-mix(in oklab, var(--sage-ink) 35%, transparent); outline-offset: -6px`.
- The stitch makes them feel hand-sewn, like a Waldorf felt toy.
- Bubble tails are small SVG triangles. The tail sits on the inline-start side (right in RTL).

**Hand marks (from their Instagram):**
- **Mustard highlighter swash:** an SVG path behind one word per headline, at most.
- **Doodles:** a 14-glyph sprite of hand-drawn sprouts, hearts, sun rays and motion ticks, drawn with a 2 px round pen. These and the Mikhak accent face (§3.1) are the **only** non-geometric strokes in the system, so they always feel human.

### 2.3 Shapes, radii, cut-outs

**Radii are named after the CNC router bits** that actually cut Choobz products:

| Token | Value | Used for |
|---|---|---|
| `--r-chip` | 6 px | Chips, tags, tiny badges |
| `--r-key` | 10 px | Buttons, inputs, steppers |
| `--r-card` | 16 px | Product cards, inner panels |
| `--r-tray` | 28 px | Section trays, drawers, sheets |
| `--r-stage` | 44 px | Hero stage, room builder |

**Signature shapes:**
- **The arch (طاق).** The Pikler arch and the Persian architectural arch are the *same shape*, and that cultural bridge sits at the centre of the identity. Product images, article covers, author portraits and the hero window all live in arch frames. For a 4:5 frame: `border-radius: 50% 50% var(--r-card) var(--r-card) / 40% 40% var(--r-card) var(--r-card)`. This gives a true semicircle top with soft bottom corners.
- **The finger slot.** The rounded slot handle from the learning tower's side panels is cut into cards and drawers as a decorative grip: a `radial-gradient` mask, or `shape()` where supported.
- **The hexagon.** From the climbing-wall holds. Used for **age badges** («۱ تا ۴ سال»).
- **Dogbone joins.** Sections are "cut" from one continuous sheet. Where a tray meets the page it has concave inner fillets, the mark a CNC bit leaves in inside corners. This is done with `clip-path: shape(...)`, falling back to plain radii.

**Category shape-language.** Every category owns a shape and a dye. They are used together on its icon, filter chip, shape-sorter piece and page hero.

| Category | Persian | Shape | Dye |
|---|---|---|---|
| Learning tower | برج یادگیری | Tall rounded rectangle with finger slot | saffron |
| Pikler triangle + ramp | مثلث پیکلر و رمپ | Triangle | pistachio |
| Pikler arch / rocker | آرک و راکر | Half-ring arch | anar |
| Swedish wall / climbing | دیوار صعود و نردبان سوئدی | Hexagon | firouzeh |
| Front-facing bookshelf | کتابخانه | Rectangle with lip | sage |
| Wall paper-roll | رول نقاشی دیواری | Circle (the roll) | mustard |
| Table & chair | میز و صندلی | Square | beech |
| Montessori shelves & rooms | قفسه و اتاق مونته‌سوری | Wide 2:1 rectangle | nil |
| Wooden toys | اسباب‌بازی چوبی | Rainbow (stacked arcs, multi-dye) | rainbow |

### 2.4 Elevation: four physical levels (the core affordance rule)

| Level | Name | Look | Meaning |
|---|---|---|---|
| −1 | **Tray (سینی)** | `--ply` 40% tint, inner shadow `inset 0 10px 24px -14px rgb(46 34 25/.28)`, `--r-tray` | Container: sections, inputs, search field, filter grooves |
| 0 | **Surface** | Flat birch/milk | Text, reading |
| +1 | **Piece (قطعه)** | Laminated edge 6 px + soft contact shadow | Tappable: cards, buttons, chips, tokens |
| +2 | **Lifted** | Edge 6 px + shadow offset 18 px, blur 30 px, scale 1.03 | Being dragged or hovered, or a transition in flight |

**Inputs** are recessed grooves, like the slot in a shape sorter. The caret and focus ring are `--firouzeh`.

**Toggles** are a bead sliding in a groove.

**Radios** are pegs that drop into holes.

### 2.5 Iconography

**Construction:** a custom 24 px set built only from compass-and-ruler geometry (circles, arcs, straight lines), so it reads like toy pieces.
- 1.75 px `--walnut` stroke with round caps and joins.
- Corner radius 2 px.
- One inner "ply line" per icon at 40% opacity, a nod to the laminated edge.

**Key glyphs:**
- Cart = an **open toy box**.
- Search = a magnifier with a **wooden handle**.
- Menu = **three stacked blocks**.
- Account = Ardi's head.
- Sound = a **wood block with a mallet**.
- Installments = **four beads**.

**Delivery:** one inline `<svg>` sprite in the root layout (about 4 KB gz), referenced with `<use href="#i-cart">`.

**Direction:** icons that imply direction (arrows, chevrons, the progress "forward" arrow) get `.rtl-flip { scale: -1 1 }`.

### 2.6 Illustration system (we have no product photos yet, and that becomes an asset)

**Projection: "toy oblique".**
- The front face is drawn as its **true shape**, which is exactly the CNC cutting outline.
- Depth recedes at 30° toward the upper-left, at 0.45 scale.
- Light comes from the **upper right**, where the arched window is and where Persian reading starts. Shadows fall lower-left as soft multiply ellipses.

**Kit of parts:**
- `src/components/illustrations/` holds **pure TypeScript functions that return SVG strings**. They work in RSC, route handlers, canvas postcards and OG images.
- Primitives: `plyPanel`, `plyEdge(layers)`, `rung`, `arc`, `hexHold`, `fingerSlot`, `grain(seed)`, `contactShadow`.
- Products: `learningTower`, `piklerTriangle`, `piklerArch`, `swedishWall`, `bookshelf`, `paperRoll`, `tableChair`, `montessoriShelf`, `rainbowStacker`, `ardi`.
- Each takes `{ finish: 'natural'|'milk'|dyeName, view: 'front'|'oblique'|'side', theme: 'day'|'night', seed }`.

**Accuracy pipeline.**
- Ask the workshop for its **DXF cut files**.
- `scripts/dxf-to-outline.ts` turns the outlines into front-face paths, so every drawing is dimensionally truthful.
- The illustrations are literally drawn from the files that cut the real wood. No competitor can copy that.

**Edge honesty.** Every cut edge in an illustration shows 3–5 lamination lines. A 3-pixel detail does more for "this is real ply" than any copy.

**People: Waldorf-doll figures.**
- Mothers, fathers and children appear as **Waldorf dolls**: round heads, bell-shaped bodies and soft felt colours.
- Faces are two tiny dot eyes and rosy cheeks, with no mouth, which is the Waldorf tradition.
- Mothers can wear a softly drawn headscarf (روسری) as a natural, warm part of the figure.
- This is culturally right for Iran, on-concept, avoids the uncanny valley of stock-like illustrated faces, and keeps every scene calm.

**Mascot: Ardi (اردی).**
- The logo's duck pull-toy rebuilt as a real object: two-tone ply, four wheels and an anar-red string.
- The name comes from «اردک» (duck) and «اردیبهشت», the month of blossoming, which echoes the 🌱 growth theme in their bio.
- Ardi appears **at most once per page**: the hero, empty cart, 404, loading and order success. Never on PDPs, where commerce stays calm.

**Budgets:**
- 150 SVG nodes and 8 KB (about 2.5 KB gz) per product illustration.
- Coordinates rounded to one decimal place.
- No filters, no masks inside illustrations.

### 2.7 Photography art direction (Phase 2) and how both media coexist

**Brief:**
- Natural window light from frame-right, matching the illustration light.
- Cream and beige walls, wood floors, real homes.
- **Child's-eye camera height (60–80 cm).**
- Hands of mother and child *mid-action*: climbing, reaching, pouring.
- No flash, no cool white balance. A gentle warm grade (one shared LUT).
- At least one **macro of the laminated edge** per product.

**Shot list per product:**
- 4:5 hero on a seamless cream sweep, for cutouts.
- 3:2 lifestyle in a room.
- 1:1 detail.
- A 9:16 vertical clip for reels and the PDP.
- An alpha **cutout** so the product can stand on the "shelf" exactly where the illustration stood.

**Coexistence rule:** media is always **framed by a physical object**. Each media slot declares a frame:
- the arch window (`arch`)
- a ply mat with laminated edge (`mat`)
- a polaroid hung by a wooden clothespin (`pin`)
- a shelf cut-out (`shelf`)

Illustrations and photos drop into the same frames, so the composition never breaks. Each product carries media with roles `cutout | hero | lifestyle | detail | illustration`. A "shelf" context prefers a cutout and falls back to the illustration. A gallery prefers photos and keeps the illustration as the "drawing" slide, labelled «طرح دقیق از روی نقشه‌ی برش».

**Placeholders:** `media.dominantColor` and `media.blurDataUrl`, both generated at upload, are painted under every photo. Images fade in over 200 ms with **no layout shift**, because `width` and `height` are stored too.

### 2.8 Grid & spacing

- **Columns:** 4 on mobile (16 px gutter, **16 px side margins**), 8 on tablet (24 px), 12 on desktop (32 px). Max content width is 1320 px and articles cap at `65ch`.
- **Spacing:** a 4 px base scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- **Sections:** `padding-block: clamp(4rem, 2.5rem + 6vw, 8.5rem)`.
- **Desktop home:** a **bento "sorting tray"**. Compartments of different sizes sit on one ply board with 12 px "walls" between them. Mobile collapses the compartments into a vertical stack, so you are pulling trays out of a drawer one after another.
- **Logical properties only:** `ms-*`, `pe-*`, `start-*`, `text-start` in Tailwind v4, with no `left`/`right` in components.

### 2.9 Voice & microcopy

- **Bubbles talk.** Warm, mild colloquial imperatives: «بکش»، «بچین»، «ببین». This mirrors their Instagram voice.
- **Pages explain.** Warm standard written Persian («می‌توانید») for articles and PDP text. This is better for SEO and for quoting by AI engines.
- **Checkout is precise.** Formal «شما», short sentences, no jokes near money.
- **Spelling:** correct ZWNJ everywhere («اسباب‌بازی»، «می‌شود»). The Phase-2 CMS ships a normalizer that converts Arabic «ي/ك» to Persian «ی/ک» and fixes half-spaces.
- **Inclusive families:** «مامان‌ها و باباها». Fathers appear in illustrations too.

---

## 3. Typography

The pairing is the one decided and verified in `docs/FONTS.md`. Each font comes from its upstream file and is built into one combined fa+latin subset. All of them are OFL and self-hosted, with no Google Fonts at runtime.

### 3.1 Families

| Role | Family | Why it fits the toy box | Delivery |
|---|---|---|---|
| **Display** | **Ario**, style "Dots 1" (2.0.1, by Mohamad Darvishi) | Chunky, warm and Persian-native. Its merged "carved" dots look as if a CNC bit cut them out. It is built on Estedad's skeleton, so the two sit together like pieces of one set. Swash ک/گ (`ss02`) for hero lines. It is brand new, so almost nobody in Iran uses it yet | `next/font/local`, **19.0 KiB**, **preloaded** (the hero H1 is the home LCP) |
| **Body / UI** | **Estedad** variable (8.5, by Amin Abedi), with `ss01` round dots on | Very readable monoline Persian sans with complete coverage. **Its round dots look like wooden beads**, the same beads as the nav, the TOC and the abacus. Less overused than Vazirmatn | Full `wght` 100–900, **50.5 KiB**, **preloaded**. The range can't be limited because of the font's non-standard `avar` |
| **Accent** | **Mikhak** (3.4, by Amin Abedi), instanced to wght 600, with the **`KSHD` kashida axis kept at 100–200** | A friendly semi-handwritten face for felt bubbles, kraft price tags, kickers («از زبان شما») and the «کش بیاد» pull-string word (§1). It is real text, so it stays selectable and indexable, unlike lettering drawn as SVG | **26.3 KiB**, **not preloaded**, since it only appears in small accents |
| **Logotype** | Custom «چوبز» and CHOOBZ lettering | Four Persian glyphs drawn to match the geometric CHOOBZ wordmark's stroke and counters | Inline SVG, 0 font bytes |

**Budget:** **69.5 KiB** of critical font (Ario + Estedad) and 95.8 KiB in total. That is less than Vazirmatn alone from its official package (108 KiB).

**Loading** (`src/app/fonts.ts`, as specified in `docs/FONTS.md` §5.4):
- Each font is declared with `localFont({ …, display: 'swap', adjustFontFallback: false })` and gets a `--ff-*` variable. Tailwind's `--font-sans`, `--font-display` and `--font-hand` theme tokens point at those variables. The different prefix stops the tokens from referencing themselves.
- **Why `adjustFontFallback` is off:** Next computes `size-adjust` from Arial's metrics, and Arial has no Persian glyphs. Swap-time CLS is controlled instead by:
  - **explicit line-heights on every text style** (never `normal`)
  - preloading the two critical files, which arrive before first paint on 4G in most sessions
- If RUM still shows swap shift on Android, step two is a measured `@font-face { font-family: "Estedad Fallback"; src: local("Noto Sans Arabic UI"), local("Tahoma"); size-adjust: …; ascent-override: …; descent-override: …; }`.
- **`font-synthesis: none` site-wide.** Ario is one file with weight class 400 even though it looks black, so a stray `font-bold` would otherwise produce faux bold.
- **OpenType features go on elements, never in `@font-face`**, where Chromium ignores them. `font-feature-settings` does not merge, so each rule restates its whole list, for example `"ss01", "tnum"`.

**Fallback stack:** `var(--ff-body), system-ui, "Segoe UI", Tahoma, sans-serif`.

### 3.2 Fluid scale (360 px → 1440 px)

| Token | Family | Min → Max | `clamp()` | Line-height |
|---|---|---|---|---|
| `--fs-hero` | Ario | 40 → 88 px | `clamp(2.5rem, 1.5rem + 4.444vw, 5.5rem)` | 1.3 |
| `--fs-h1` | Ario | 32 → 60 px | `clamp(2rem, 1.417rem + 2.593vw, 3.75rem)` | 1.3 |
| `--fs-h2` | Ario | 26 → 44 px | `clamp(1.625rem, 1.25rem + 1.667vw, 2.75rem)` | 1.35 |
| `--fs-h3` | Estedad 700 | 20 → 28 px | `clamp(1.25rem, 1.083rem + 0.741vw, 1.75rem)` | 1.5 |
| `--fs-hand` | Mikhak 600 | 18 → 26 px | `clamp(1.125rem, 0.958rem + 0.741vw, 1.625rem)` | 1.55 |
| `--fs-lead` | Estedad 400 | 17 → 21 px | `clamp(1.0625rem, 0.979rem + 0.37vw, 1.3125rem)` | 1.8 |
| `--fs-body` | Estedad 400 | 16 → 18 px | `clamp(1rem, 0.958rem + 0.185vw, 1.125rem)` | 1.85 |
| `--fs-article` | Estedad 400 | 17 → 19 px | `clamp(1.0625rem, 1.021rem + 0.185vw, 1.1875rem)` | 1.9 |
| `--fs-small` | Estedad 500 | 14 px | `0.875rem` | 1.65 |
| `--fs-micro` | Estedad 500 | 13 px (floor) | `0.8125rem` | 1.6 |

**Line-height rules:**
- Headlines never go below 1.25. Below about 1.2, the dots of ک/گ/ی collide across lines.
- Body prose stays at 1.8–1.9.
- Text with harakat (اعراب), such as the read-aloud lines for children in articles, gets 2.0 or more.

**Weights:**
- **Ario** has one weight. Display hierarchy comes from size, ply-letter depth and colour, never from bold.
- **Estedad:**
  - body: 400
  - UI labels and buttons: 600
  - H3, prices and bold in body: 700
  - Weight is set with `font-weight`, never with `"wght"` inside `font-variation-settings`, which would break inheritance.
- **Mikhak:** 600 only. Its `KSHD` axis is the only `font-variation-settings` in the whole system.

### 3.3 Persian rules (enforced in base CSS and lint)

**Language and direction:**
- `<html lang="fa" dir="rtl">`. The `fa` tag maps to the OpenType FAR language system, which drives `locl` (some fonts only show the Persian ۴ under FAR). It also gives screen readers a Persian voice and tells answer engines the language.
- JSON-LD uses `inLanguage: "fa-IR"`.
- English islands are marked `<span lang="en" dir="ltr">`.
- Text aligns with `text-align: start`.

**Spacing and stretching:**
- **`letter-spacing: 0` always.** Tracking breaks cursive joins and disables ligatures in Chromium. Lint bans Tailwind `tracking-*` on Persian elements, and there is no `text-transform` either.
- **Stretch only with fonts.** Stretched Persian uses Mikhak's `KSHD` axis or Ario's swash.
- **Never type kashida (ـ) into content.** «چـوب» is not «چوب» for search, answer engines or copy/paste.

**Line-height:** always explicit (see §3.2), because Mac and Windows line boxes differ (Mikhak is 1.66 on one and 1.95 on the other). Never clip display text with `overflow: hidden` without padding-block.

**Line breaking and measure:**
- **No justification.** Chromium justifies Persian by widening spaces, not with kashida. Use `text-wrap: pretty` for paragraphs and `text-wrap: balance` for headings.
- Measure is 55–70 characters (`max-inline-size: 65ch`).

**Mixed direction and punctuation:**
- **Mixed-direction strings** go in `<bdi>`: SKUs, Latin names like "Pikler", URLs and model codes.
- Use «تا» instead of hyphens in ranges («۱ تا ۴ سال»). A hyphen between digits triggers bidi reordering surprises.
- Quotation marks are «گیومه». The question mark is «؟», the comma «،» and the semicolon «؛».
- Keep ZWNJ (نیم‌فاصله) in content («اسباب‌بازی‌ها»). All three fonts include a ZWNJ glyph.

**Direction-aware UI:**
- Progress bars, highlighter "painting", rolling balls and carousels all start from the **right**.
- "Forward" motion travels toward the **left**.

### 3.4 Numerals & formatting

**Persian digits (۰۱۲۳۴۵۶۷۸۹) everywhere in the visible UI**, including prices, ages, dates, counts and step numbers.
- They are **converted in code** with the helpers in `src/lib/format.ts`: `toFaDigits`, `formatToman`, `formatAgeRange` and `formatJalali`.
- Font features are not used for this. Code conversion works with every font, including Mikhak, which has no digit feature.

**Prices:**
- `formatToman(3980000)` gives «۳٬۹۸۰٬۰۰۰ تومان», with the Persian thousands separator «٬» (U+066C).
- Decimals use «٫» («۱٫۵ تا ۵ سال»).
- `installments(total)` rounds each SnappPay installment up to the nearest 1,000 Toman.

**Digit widths:**
- **Inline prices keep proportional digits.** With `tnum`, «۳٬۹۸۰٬۰۰۰» spreads too wide because the separators become tabular too (`docs/FONTS.md` §3.2).
- **Tabular digits** (`font-variant-numeric: tabular-nums`) are only for numbers that *change in place*: the abacus rows, the room-builder total, the cart total, quantity steppers and tables. Those always sit in fixed-width boxes, so nothing around them shifts.

**Dates:**
- Jalali, via `Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'long', timeZone: 'Asia/Tehran' })` («۲۴ مهر ۱۴۰۵»).
- A machine-readable `<time datetime="2026-10-16">` sits alongside.
- Node's built-in full ICU in the Docker image covers both.

**Latin digits only** in `tel:` links, URLs, SKUs, JSON-LD, feeds and `<data value>`.

**Structured data:** **Toman × 10 = IRR** (`tomanToRial`). Toman is not an ISO currency, so every JSON-LD `price` is in Rial with `priceCurrency: "IRR"`.

**Legacy HTML:** text that can't be normalized gets the font-feature fallback (`"ss01", "ss20"` on Estedad), scoped to one class, because it also converts the digits inside SKUs.

### 3.5 Ply letters (display effect)

For the hero word and category titles at 48 px or larger only, set in Ario. Following rule 2 (painted faces, raw edges), the face is **painted anar** and the laminations below it are raw birch ply:

```css
.ply-letters {
  font-family: var(--font-display);
  color: var(--anar);                 /* 5.3:1 on birch; 3.9:1 where it crosses the mustard swash */
  padding-block: .1em .25em;          /* room for the dots and the edge, never clipped */
  text-shadow:
    0 1px 0 #EBDDC2, 0 2px 0 var(--beech), 0 3px 0 #EBDDC2,
    0 4px 0 var(--beech), 0 5px 0 #EBDDC2,
    0 12px 18px rgb(46 34 25 / .30);
}
```

**Why it works:**
- Persian joins render perfectly because it is real text. It stays selectable and indexable, and it is part of the LCP.
- It uses 4 layers on mobile and 6 on desktop (3 in the low-power tier).
- **One swash per page:** in the hero line, the ک of «کشف» gets Ario's swash (`ss02`), and nowhere else does.

---

## 4. Home page blueprint (12 sections)

**Rendering:** the page is a static RSC shell. Tags are `home`, `products`, `posts` and `settings`. Phase-2 CMS publishes call `revalidateTag`/`updateTag`.

**Format of each section below:**
- Purpose
- Layout (mobile first, then desktop)
- Copy
- Interaction & motion
- Data

### S1 · Hero: "The Stacker Window" (signature ①)

**Purpose:** a breathtaking first impression and an instant brand read. The LCP is text.

**Mobile layout (360×740):**
- Slim top bar.
- The H1 block.
  - It has two parts: a small SEO line, then the 2-line display.
  - The display word «چوبی» is in ply letters, with a mustard swash under it.
- A 3-line sub.
- Two CTAs.
- The hero stage, a recessed `--r-stage` tray about 300 px tall. Its top 40% shows above the fold, which invites scrolling.
- Below the stage, a row of four felt trust chips that swipes horizontally.

**Desktop layout:** text in the right 5 columns (RTL start). The stage takes the left 7 columns, at 560 px tall. The stage also holds a small Pikler triangle and a shelf silhouette, so it reads as a room corner.

**Copy:**
- H1 (SEO line): «اسباب‌بازی و سیسمونی چوبی کودک»
- H1 (display): «دنیایی **چوبی**، برای بازی، کشف و رشد»
- Sub: «برج یادگیری، مثلث پیکلر، کتابخانه و اتاق مونته‌سوری؛ از چوب طبیعی، با لبه‌های گرد و پوشش ایمن، ساخته‌شده با دست در کارگاه خودمان.»
- CTAs: **«ورود به فروشگاه»** (anar ply button) · «اتاقش را بچین» (milk ply button, scrolls to S5)
- Stage bubble (Mikhak on sage felt): «کمان‌ها را بکش و برج خودت را بساز» (daypart variants as in §1). «بکش» ("pull") is the «کش بیاد» word: Ardi's string ends at it, and it stretches whenever she tugs the string or drags an arc. The type literally does what the verb says.
- Trust chips: «ساخت کارگاه خودمان» · «ارسال به سراسر ایران» · «۴ قسط با اسنپ‌پی» · «نماد اعتماد الکترونیکی»

**Interaction & motion (CSS-only intro):**
- Arcs drop with a 60 ms stagger on `--ease-clack`.
- Ardi rolls in from the right over 900 ms. Its wheels rotate in proportion to the distance travelled.
- The swash paints right-to-left with `clip-path: inset(0 0 0 100%) → inset(0)`.
- The window light patch is a `radial-gradient` positioned by `--sun-x`/`--sun-y` from the daypart script.
- An inline script picks one of three starting arrangements **by Jalali weekday**, before paint and at the same box size, so the hero isn't identical every day.

**Interaction & motion (after the engine loads):**
- Drag and snap.
- Flip-to-rock.
- An optional clack with an 8 ms vibration on Android.
- The postcard.

**Keyboard and WCAG 2.5.7 (single-pointer alternative to dragging):**
- Each arc is a focusable `button`.
- Space lifts the arc, arrows move it between slots, Enter places it.
- The «چیدن خودکار» button cycles the presets.

**Reduced motion:** everything renders already settled, and dragging still works without inertia.

**Data:** `settings.hero` (H1 lines, sub, CTAs, optional `spotlightProductId`, which shows a tiny chip «تازه از کارگاه: آرک پیکلر دوکاره») and `settings.trustPoints`.

### S2 · «هر تکه، یک دنیا»: the shape-sorter categories

**Purpose:** one-tap category navigation that is also a toy.

**Layout:**
- **Mobile:** a recessed ply board with 9 holes in a 3×3 grid. Each hole holds that category's shaped piece (see §2.3), with the category name below in 600-weight text and a mini illustration peeking out of the hole.
- **Desktop:** a wide 9-up board in one row. Each piece has a hover "lift" (+2 level).

**Copy:**
- H2: «هر تکه، یک دنیا»
- Sub: «دسته‌ها را مثل قطعه‌های جورچین بردار؛ هر شکل، یک جور بازی.»

**Interaction & motion:**
- On scroll-in (`animation-timeline: view()`), the pieces drop into their holes one after another. The 30 ms stagger is driven by `animation-range` offsets per piece, and the drop uses the clack easing.
- On tap, the piece pops up 10 px on a spring, then a view transition opens the category page, where the shape morphs into the category hero.

**Data:** `categories`: `name`, `slug`, `tagline`, `illustration`, `accent` (the dye), `sortOrder`, plus the new `shape` column (Appendix A). Product counts are computed in the query.

### S3 · «هر سن، یک بازی تازه»: the Pikler Ramp (signature ②)

**Purpose:** guided discovery by age, plus AEO answers in visible HTML.

**Layout:**
- **Mobile:** a tall section about 2.6 screens high. The ramp zig-zags down, with 5 landings on alternating sides; each age card sits opposite its landing.
- **Desktop:** the ramp runs left to right, descending in 3 switchbacks, with the cards in a row beneath each landing.

**Copy:**
- H2: «هر سن، یک بازی تازه»
- Sub: «توپ را دنبال کن؛ از اولین چنگ زدن تا اولین بالا رفتن.»
- Card example:
  - Hex badge: «۱ تا ۲ سال»
  - H3: «کودک ۱ تا ۲ ساله با چه چیزی بازی کند؟»
  - Answer: «مثلث پیکلر و آرک، تعادل و قدرت پاها را تمرین می‌دهند و اعتمادبه‌نفس حرکتی می‌سازند.»
  - Two product chips, then the link «همه‌ی بازی‌های ۱ تا ۲ سال».
- Other landings:
  - «۰ تا ۶ ماه | نگاه کردن و چنگ زدن»
  - «۶ تا ۱۲ ماه | غلت، سینه‌خیز، ایستادن»
  - «۲ تا ۳ سال | خودم انجامش می‌دم!»
  - «۳ تا ۶ سال | خلق کردن و قصه گفتن»
- End: «پیشنهادهای مخصوص سن کودکت»

**Interaction & motion:**
- The ball moves on the section's `view-timeline`. Its keyframes **hold** at each landing (for example, 18% → 22% stays put), so it rolls, pauses at each age, and rolls on.
- Each card's felt fill and sprout growth runs on that card's own `view()` timeline.
- With sound on, a 0.5 KB IntersectionObserver plays a soft "tock" at each landing.
- Without scroll-timeline support, or with reduced motion: the ball rests at the final box, and all cards are visible and already "lit".

**Data:**
- `age_ranges` (new table): `slug` (`0-6-months`, `6-12-months`, `1-2-years`, `2-3-years`, `3-6-years`), label, `minMonths`, `maxMonths`, `question`, `shortAnswer`.
- Top two products per range: `products` whose `ageMinMonths`–`ageMaxMonths` overlap the range, `featured` first, then by `sortOrder`.
- Each card links to its `/age/{range}` hub.

All answers are written or reviewed by the expert reviewer (§7). Gross-motor answers are YMYL and need the pediatric reviewer named in the content plan.

### S4 · «روی قفسه‌ی کارگاه»: the featured shelf

**Purpose:** best-sellers shown as objects, not as a generic grid.

**Layout:**
- **Mobile:** a horizontal scroll-snap carousel. It starts at the right, with peek padding of 16 px plus 12% of the next card. It is drawn as a long front-facing wall shelf with a ply lip, and products stand *on* the shelf.
- **Desktop:** two shelves stacked on a wall, 4 products each.

**Kraft price tags:** each product has a kraft tag (`#EADBC0`; walnut text **11.3:1**) hanging on a string. The name is set in Mikhak, then «۳٬۹۸۰٬۰۰۰ تومان» and «یا ۴ قسط ۹۹۵٬۰۰۰ تومانی» in Estedad.

**Copy:**
- H2: «روی قفسه‌ی کارگاه»
- Sub: «محبوب‌ترین‌های این فصل؛ همان‌هایی که بیشتر از همه در عکس‌های شما دیده‌ایم.»

**Interaction & motion:**
- Tags swing once on view, a 4° damped CSS keyframe.
- **Each toy "plays its own way"** on hover or focus (desktop) and on first view (mobile):
  - the rocker rocks
  - the ramp's ball rolls
  - the paper roll unrolls 8 px
  - the tower's step lifts
- These are CSS keyframes inside each illustration, paused off-screen.
- The quick-add «+» piece flies the product into the header toy box via a view transition (see §5.3).

**Data:** `products` where `featured` and `status = 'published'`, ordered by `sortOrder`. Price is `products.price` (or the lowest variant price, shown as «از …»). Installments come from `installments()` and `settings.installments`.

### S5 · «اتاقش را بچین»: the Room Builder (signature ③)

**Purpose:** bundle conversion and a share moment. It also answers "how much is a Montessori room?"

**Layout:**
- **Mobile:**
  - The room at full bleed (aspect 4:3).
  - Preset tabs as wooden blocks.
  - The token tray as two scroll-snap rows.
  - A summary bar that is sticky *within the section*.
- **Desktop:** the room takes 8 columns. On the left, a 4-column vertical «فهرست قطعات» (cut list), styled like a CNC parts sheet with item, variant, price and a remove "×" piece.

**Copy:**
- H2: «اتاقش را بچین»
- Sub: «یک اتاق مونته‌سوری واقعی، تکه به تکه. ببین چه شکلی می‌شود و چقدر هزینه دارد.»
- Summary bar: «۵ تکه | جمع: ۱۸٬۷۰۰٬۰۰۰ تومان | یا ۴ قسط ۴٬۶۷۵٬۰۰۰ تومانی»
- Buttons: **«همه را به سبد اضافه کن»** · «عکس اتاق را ذخیره کن» · «این چیدمان را ببین» (link to `/rooms/{preset}`)

**Interaction & motion:**
- A tapped token flies to its slot along a spring path: stiffness 300, damping 20, mass 1.1. It lands with a squash of 3% scale, a clack and a 3-particle sawdust puff.
- Tapping a placed item opens a felt popover with alternatives (swap variant or remove).
- The total counts up with tabular digits, in a fixed-width counter.
- The server renders the «۲ تا ۳ سالگی» preset fully, so the engine only *activates* the existing nodes and there's no layout shift.

**Data:** the new `room_presets` and `room_preset_items` tables (productId, variantId, slot, order), the new `products.roomSlot` column and `settings.installments` (Appendix A).

### S6 · «الان ببر، در ۴ قسط بپرداز»: the SnappPay abacus

**Purpose:** remove price anxiety right after the room total.

**Layout:**
- A wooden abacus with 4 rows.
- **Mobile:** above the abacus, a recessed price field with chips «برج یادگیری»، «اتاق ۲ تا ۳ سالگی»، «مبلغ دلخواه».
- **Desktop:** the abacus on the left, an explanation and 3 steps on the right.

**Copy:**
- H2: «الان ببر، در ۴ قسط بپرداز»
- Sub: «خرید اقساطی با اسنپ‌پی. مهره‌ها را جابه‌جا کن تا قسط‌ها را ببینی.»
- Row labels: «قسط اول — هنگام خرید»، «قسط دوم»، «قسط سوم»، «قسط چهارم»
- Footnote: «شرایط، زمان‌بندی و کارمزد طبق قوانین اسنپ‌پی» **[verify with SnappPay before launch]**

**Interaction & motion:**
- When the price changes, beads slide right-to-left row by row (stagger 80 ms, bead spring stiffness 500, damping 30), and each row's amount counts up.
- A server-rendered `<table>` with the same numbers is always present: the accessible and no-JS truth.

**Data:** `settings.installments` (`provider: 'snapppay'`, `count: 4`, `minAmount`, `maxAmount`, `termsUrl`).

### S7 · «لایه‌به‌لایه، صادقانه»: materials & safety

**Purpose:** trust through honesty. This is the "why Choobz".

**Layout:**
- **Mobile:** a ply sheet drawn edge-on (5 layers). Scrolling separates the layers, and each label appears beside its layer.
- **Desktop:** the sheet is centred, with labels alternating left and right.

**Copy:**
- H2: «لایه‌به‌لایه، صادقانه»
- Sub: «تخته‌چندلا را باز کردیم تا ببینی درونش چیست.»
- Layers (every claim is **[verify]** with the workshop):
  - «پوشش: روغن و لاک پایه‌آب، ایمن برای کودک»
  - «رویه: چوب توس/راش طبیعی»
  - «مغز: لایه‌های چندلای مقاوم با چسب کم‌انتشار»
  - «لبه: گرد شده با فرز CNC و سنباده‌ی دستی»
  - «آزمون: تحمل وزن و پایداری پیش از ارسال»
- Closer: «همان‌قدر که از بیرون می‌بینی، از درون هم سالم.»

**Interaction & motion:** layer `translate` runs on a `view()` timeline over `animation-range: contain 10% contain 70%`, and the layers rejoin as you leave. Reduced motion shows the exploded state statically.

**Data:** `settings.materialLayers[]` (title, body, icon). Each layer links to the `materials` page (`pages` table).

### S8 · «از کارگاه ما تا اتاق او»: the workshop story

**Purpose:** human makers and craft, which also feeds E-E-A-T.

**Layout:**
- **Mobile:** a horizontal "conveyor" of 6 raised ply tokens numbered with Persian digits. Each token has an icon and two lines of text.
- **Desktop:** a long workbench illustration with the tools in sequence: pencil → CNC bit → sandpaper → oil can → box → delivery van.

**Copy:**
- H2: «از کارگاه ما تا اتاق او»
- Steps: «۱. طرح روی کاغذ» · «۲. برش با CNC» · «۳. سنباده با دست» · «۴. روغن طبیعی» · «۵. بسته‌بندی با حوصله» · «۶. رسیدن به خانه‌ی شما»
- Founder bubble: «هر تکه را طوری می‌سازیم که انگار برای بچه‌ی خودمان است.» — [نام بنیان‌گذار]

**Interaction & motion:**
- The tokens enter as a conveyor, a scroll-linked `translate` on desktop.
- The workshop video (Phase 2 upload) is a poster image plus click-to-play. **Never autoplay.**

**Data:** `settings.workshop` (steps, quote, `founderMediaId`, optional `videoMediaId`). The long story is the `workshop` row in `pages`.

### S9 · «اتاق‌های واقعی، بچه‌های واقعی»: voices & UGC

**Purpose:** social proof in their Instagram language (the «رضایت شما» and «عکساتون» highlights).

**Layout:**
- A **wooden clothesline** across the section. Customer photos hang in ply-mat polaroids from **wooden clothespins** (a Montessori fine-motor classic).
- **Mobile:** one swipeable line, with felt testimonial bubbles stacked below.
- **Desktop:** two lines, with bubbles hanging between the photos.
- A mustard highlight sits on the key phrase in each quote.

**Copy:**
- Kicker (Mikhak): «از زبان شما»
- H2: «اتاق‌های واقعی، بچه‌های واقعی»
- Sample bubble (**placeholder; ship real, permissioned quotes only**): «از وقتی برج یادگیری آمده، آشپزی شده بازی مشترک من و دخترم.» — مامانِ [نام]، [شهر]
- CTA: «عکس اتاقتان را با #چوبز_کیدز بفرستید»

**Interaction & motion:** photos sway once on entering view, a ±3° damped rotation around the pin.

**Data:**
- `reviews` where `featured` and `status = 'approved'`: `body`, `authorName`, `city`, `childAge`, `productId`, `verifiedPurchase`. The new `highlight` column holds the phrase that gets the mustard mark, and the new `consentAt` column records permission.
- `community_photos` (mediaId or `illustration`, caption, customerName, city, productId), plus the new `consentAt` and `faceBlurred` columns.

Ratings or Review schema are emitted **only** for real, verifiable reviews.

### S10 · «کتابخانه‌ی چوبز»: the content teaser

**Purpose:** pull visitors into the content hub (SEO/AEO).

**Layout:**
- A **front-facing bookshelf**, echoing their own product. Article "picture books" stand on it: illustrated covers with a spine in the cluster's dye and the Persian title. 4 books show on mobile in a swipeable row, 6 on desktop.
- Below the shelf, «پرسش‌های والدین»: three felt question bubbles, each with a one-line answer and a «بیشتر بخوانید» link.

**Copy:**
- H2: «کتابخانه‌ی چوبز»
- Sub: «راهنماهای کوتاه و دقیق برای پدر و مادرهای کنجکاو؛ از مونته‌سوری در خانه تا انتخاب اولین مثلث پیکلر.»
- Questions:
  - «برج یادگیری از چند سالگی مناسب است؟»
  - «مثلث پیکلر یا آرک؛ کدام اول؟»
  - «اتاق مونته‌سوری را با چه وسایلی شروع کنیم؟»

**Interaction & motion:** a book tilts 3° and slides 6 px out of the shelf on hover or focus. Tapping it morphs the cover into the article header (view transition).

**Data:** `posts` where `featured` (cover or `illustration`, topic, title, excerpt), and three `faqs` rows with `scope = 'page'` on the home page, each linked to the post that answers it in depth.

### S11 · «پرسش‌هایی که زیاد می‌شنویم»: FAQ drawers

**Purpose:** objection handling plus a `FAQPage` for answer engines.

**Layout:** a wooden chest of drawers. Each question is a `<details>` "drawer" with a round wooden knob. When open, the drawer slides out 8 px with a deeper shadow and the answer sits on paper inside.

**Copy:**
- H2: «پرسش‌هایی که زیاد می‌شنویم»
- Questions:
  - «محصولات چوبز از چه چوبی ساخته می‌شوند؟»
  - «رنگ و روغن محصولات برای کودک ایمن است؟»
  - «ارسال به شهرستان چقدر طول می‌کشد؟»
  - «خرید قسطی با اسنپ‌پی چطور است؟»
  - «اگر محصول آسیب‌دیده برسد چه می‌شود؟»
  - «امکان سفارش رنگ یا اندازه‌ی خاص هست؟»

**Interaction & motion:**
- Native `<details name="faq">` gives exclusive-open accordion behaviour with zero JS.
- Smooth height uses `interpolate-size: allow-keywords` with `::details-content` transitions. Older engines get an instant open.

**Data:** `faqs` with `scope = 'general'` or `'shipping'` (question, answer, sortOrder). These are the same rows as `/faq`, so the answers never drift apart.

### S12 · Community + the Toy Box footer

**Purpose:** community, trust and entity facts, plus the place where the ramp ball "lands".

**Layout:**
- A "community" compartment first.
  - 6 curated Instagram posts in arch frames. These are images uploaded through the CMS and linked out. **No Instagram embed**: it's a third-party request, it's slow, and it's filtered in Iran.
  - The follower count.
  - Two CTAs.
- Then the footer (§5.2).

**Copy:**
- H2: «خانواده‌ی ۵۰ هزار نفره‌ی چوبز»
- Sub: «ایده‌های بازی، پشت صحنه‌ی کارگاه و عکس‌های شما؛ هر روز در اینستاگرام و کانال بله.»
- Buttons: «اینستاگرام چوبز» · «کانال بله»

**Interaction & motion:** a small ball (the "end" of the S3 story) drops into the toy-box footer on its own `view()` timeline, with one clack if sound is on.

**Data:** `settings.social` (Instagram handle, follower count, Bale channel URL **[verify handle]**) and `settings.communityPosts[]` (mediaId, url, order).

---

## 5. Header, navigation, footer, cart, search, system states

### 5.1 Header & navigation

**Mobile top bar** (56 px, not sticky; it scrolls away to save screen):
- Ardi mark plus the «چوبز» logotype on the right.
- Search and the sound toggle on the left.

**Mobile bottom bar: "the bead maze".**
- 64 px plus `env(safe-area-inset-bottom)`, sticky, as a raised ply rail.
- Five tabs: «خانه» · «فروشگاه» · «کتابخانه» · «سبد» (toy-box icon with count) · «منو».
- The active indicator is a **wooden bead on a wavy wire**. On navigation it slides to the new tab, using one shared `view-transition-name: nav-bead` with no JS of its own.
- The cart badge reserves a fixed 20 px circle, so it causes no CLS.

**Menu sheet:**
- A tray that slides up.
- It holds categories (shape chips), «خرید بر اساس سن» (the age ruler) and links: «اتاق‌ساز»، «کارگاه ما»، «درباره‌ی ما»، «سؤالات متداول»، «پیگیری سفارش»، «تماس».
- It also has the social links (Instagram, Bale), plus toggles for **«صدای چوب»** and **«حالت لالایی»**.

**PDP exception:** the bottom bar **becomes the buy bar** (§6.3). It flips like a two-sided block with a 220 ms vertical view-transition slide, so two bars never stack.

**Desktop header** (72 px, sticky; it hides on scroll-down and shows on scroll-up):
- Logo on the right.
- Centre nav: «فروشگاه ▾» · «اتاق‌ساز» · «کتابخانه» · «کارگاه ما» · «درباره».
- On the left: a recessed search groove, the sound toggle and the toy-box cart.

**Mega menu: "the toy drawer".**
- «فروشگاه» opens a drawer that slides down from under the header, with a laminated bottom edge.
- It has three compartments:
  - the categories as shape tiles with mini illustrations
  - «بر اساس سن», a horizontal growth ruler from ۰ to ۶ years
  - a featured guide book, e.g. «راهنمای انتخاب برج یادگیری»
- It is built with the **Popover API** plus CSS anchor positioning (with a positioned fallback). There's a 120 ms hover-intent delay, Escape closes it, and focus returns to the trigger.

### 5.2 Footer: "the Toy Box"

The footer is a big open wooden toy box seen from the front, with finger-hole cut-outs in its front panel. Ardi parks beside it.

**Link groups** cut into the box: «فروشگاه» · «کتابخانه» (clusters, glossary, age hubs) · «پشتیبانی» (`/faq`, shipping, returns, installments, order tracking) · «چوبز» (about, workshop, materials, team, editorial policy, contact).

**Entity sentence** (visible, for GEO): «چوبز کیدز برندی ایرانی است که اسباب‌بازی و سیسمونی چوبی کودک، از برج یادگیری و مثلث پیکلر تا کتابخانه و قفسه‌ی مونته‌سوری، را در کارگاه خود در [شهر] طراحی و تولید می‌کند.»

**NAP:** address, phone (`tel:` with Latin digits) and response hours, marked up in `<address>`.

**Trust row:**
- The **eNamad** badge (a domestic domain), loaded lazily as a plain `<a><img loading="lazy">` in the footer only.
- The SnappPay badge.
- Social links (Instagram, Bale).

**Bottom line:** «© ۱۴۰۵ چوبز کیدز — کنار شما، برای ساختن دنیایی چوبی».

### 5.3 Cart drawer: "the toy box"

**Container:**
- A native `<dialog>` opened with `showModal()`.
- **Mobile:** a bottom sheet (drag handle, closes on swipe down or Escape).
- **Desktop:** a drawer from the left (inline-end), 420 px wide.

**Header:** «سبد خرید» with a little open-lid box illustration. The lid swings open on show over 300 ms.

**Add-to-cart flight:**
- `document.startViewTransition` (or React `<ViewTransition>`) morphs the product art into the header or bottom-bar toy box.
- The box lid bounces (clack), and the count bead pops on a spring.
- The fallback is a WAAPI FLIP, under 1 KB.

**Lines:**
- Each item is a raised ply token with its illustration or cutout, name, variant and price.
- The quantity stepper is two wooden keys (− / +) around a recessed number.
- Remove: the token tumbles out (4° rotation, 12 px drop, fade, 260 ms).

**Free-shipping progress:** a tiny ramp with a ball rolling toward a flag. Copy: «۳۵۰٬۰۰۰ تومان تا ارسال رایگان» **[threshold to verify]**.

**Totals:**
- The total is large and tabular.
- The SnappPay line reads «یا ۴ قسط … تومانی با اسنپ‌پی».
- Cross-sell: «با این‌ها بهتر بازی می‌کند». For example, a ramp is suggested with the Pikler triangle.

**CTA:** **«ادامه و ثبت سفارش»**. Phase 1 has a checkout stub; Phase 2 adds the real checkout.

**Empty state:** Ardi sits alone in the box: «جعبه هنوز خالی است. از قفسه یک تکه بردار.»

**State:**
- Phase 1: a client store (`useSyncExternalStore` over `localStorage`, wrapped in try/catch).
- Phase 2: a server cart behind the same interface.

### 5.4 Search

- A full-screen tray with a recessed groove input.
- Suggestion chips:
  - by age: «۱ سالگی»، «۲ سالگی»
  - by question: «برج یادگیری از چند سالگی؟»
  - recent searches
- Results are grouped as **Products · Guides · Glossary**.
- The backend is a route handler on **SQLite FTS5** (`unicode61 remove_diacritics 2`).
- Both index and query go through the same normalizer (`normalizeFa`, extended): «ي→ی، ك→ک», Persian and Latin digits unified, tatweel and diacritics stripped, and ZWNJ treated as a separator. So «اسباب بازی» matches «اسباب‌بازی», and «مونته سوری» matches «مونته‌سوری».
- Spelling variants from the content plan (پیکلر/بیکلر، مونته‌سوری/مونتسوری) are stored as synonyms on glossary terms and products.
- The search dialog chunk is about 4 KB, loaded on open.

### 5.5 System states

- **404 «این تکه گم شده!»:** a puzzle board with a missing piece. Dragging or tapping the piece into the hole navigates home.
- **Loading** (`loading.tsx`, rarely seen): Ardi rolls across a groove.
- **Errors:** a felt bubble with plain words and a retry button.
- **Order success (Phase 2):** blocks stack into the word «مرسی». Copy: «سفارشت رسید به کارگاه! از همین حالا ساختنش را شروع می‌کنیم.»

---

## 6. Shop

### 6.1 Listing (`/shop`, `/shop/{category}`)

Category slugs follow the content plan's product codes P1–P9: `/shop/learning-tower`, `/shop/pikler-arch`, `/shop/pikler-triangle`, `/shop/swedish-wall`, `/shop/front-facing-bookshelf`, `/shop/wall-art-roll`, `/shop/kids-table-chair`, `/shop/montessori-shelf` (with `/shop/room-sets`) and `/shop/wooden-toys`.

**Layout (mobile):**
- Breadcrumb.
- An H1 with the category's shape hero. Example: «برج یادگیری مونته‌سوری».
- A two-line intro answer. Example: «برج یادگیری سکویی چوبی و ایمن است که کودک ۱٫۵ تا ۵ ساله را هم‌قد کابینت آشپزخانه می‌کند…» A «بیشتر بخوانید» link jumps to the full buying guide further down.
- **A sticky chip rail** under the header: «همه»، then the category shape chips.
- A «فیلتر و ترتیب» piece opens the filter sheet.

**Filter sheet:**
- **Age ruler («سن کودک»):** a wooden growth ruler from ۰ to ۶ years with two bead handles. Values are stored in months. It snaps to 6-month marks and its labels are in Persian digits.
- **Skills («مهارت»), as felt tags:** «حرکتی درشت»، «حرکتی ظریف»، «تعادل و هماهنگی»، «استقلال و زندگی روزمره»، «خلاقیت و هنر»، «کتاب و زبان»، «بازی آزاد و تخیل». These map to the keys in `products.skills`.
- **Category** (shape chips).
- **Finish:** wooden swatch dots for natural, milk and dyes.
- **Price:** a range in a recessed groove.
- **«آماده‌ی ارسال»** toggle: a bead in a groove.
- **Sort:** «محبوب‌ترین»، «جدیدترین»، «ارزان‌ترین»، «گران‌ترین».

**Progressive enhancement:** the whole filter sheet is a real `<form method="get">`. It works with zero JS. The 4 KB enhancement adds instant updates via `router.replace` inside `startTransition`.

**Grid:**
- 2 columns on mobile, 3 on tablet, 4 on desktop.
- **Every 8th tile is editorial.** Either a guide book («نمی‌دانی کدام؟ راهنمای انتخاب مثلث پیکلر را بخوان») or a mother's quote bubble. Commerce and content interleave, which helps both conversion and topical authority.

**Pagination:** «بیشتر نشان بده» is a real link (`?page=2`, crawlable) that JS enhances into "append".

**Below the grid** (on category pages): a buying guide of 300–600 words, a comparison table, the category FAQ and links to the pillar article.

**Empty result:** a lonely block illustration, «هیچ تکه‌ای با این فیلترها پیدا نشد», and a reset button.

**SEO rules:**
- Category pages are indexable.
- Filter combinations get `noindex,follow` with a canonical to the base, **except** curated landings like `/age/1-2-years`, which have their own editorial (§7.1).

### 6.2 Product card

**Structure:** `<article>` → arch frame → H3 → benefit → price block → swatches → quick-add.
- The **whole card is one link**, with the quick-add a separate button above it in z-order, so there are no nested interactive elements.
- It is a +1 ply piece: milk face, laminated edge.

**Media:**
- An arch-framed illustration on `--milk`, over the product's **unique grain**.
- Later, a cutout or hero photo goes in the same frame, with a `dominantColor` placeholder.

**Badges:**
- An age hexagon at the top-start corner: «۱٫۵ تا ۵ سال».
- An optional saffron tag: «تازه از کارگاه» or «ساخت سفارشی».

**Text:**
- Title (H3, 600, 2 lines max): «برج یادگیری تاشو»
- Benefit (bark): «کودک، کنار شما در آشپزخانه»

**Price block:**
- «۳٬۹۸۰٬۰۰۰ تومان» in walnut, Estedad 700, with proportional digits (§3.4).
- «یا ۴ قسط ۹۹۵٬۰۰۰ تومانی» in sage-ink.
- When on sale, the old price is struck through in bark and the new price is in anar.

**Swatches:** up to 4 wooden dots (14 px with a ply ring), then «+۲».

**Quick-add:** a 44 px round anar ply piece with «+». If the product has variants, it opens a variant mini-sheet instead.

**Motion:**
- Press compresses the edge.
- The hover "toy plays" (§S4) runs on desktop.
- A view transition morphs the art into the PDP gallery.

**Data attributes:** the price is in `<data value="39800000">` (Rial) for machine readers.

### 6.3 Product detail page (`/product/{slug}`)

**Mobile order:**

1. **Breadcrumb**: «خانه › فروشگاه › برج یادگیری › برج یادگیری تاشو».
2. **Gallery in an arch frame**:
   - A CSS scroll-snap carousel with **bead dots**.
   - Illustration phase, 4 slides: oblique view · front with dimensions · side · "in a room" scene.
   - Photo phase: hero, lifestyle, detail, a vertical video (poster plus tap-to-play).
   - Pinch-zoom on photos.
   - The thumbnail sync is about 1.5 KB.
3. **Title block**:
   - H1, then a one-line promise, the age hexagon and the skills as felt chips.
   - Rating stars appear **only** with real reviews.
4. **Price**: «۳٬۹۸۰٬۰۰۰ تومان» with the SnappPay line, plus a mini **abacus** that taps open into a sheet.
5. **Variants**: finish and model as wooden toggle blocks (`product_variants.options`, with `swatch` for finishes). Unavailable options are drawn as "unpainted ply" with a strike. When a variant changes the price, the new price crossfades in over 150 ms in a box sized to the longest price, so nothing shifts.
6. **Availability, said honestly and charmingly**: «ساخته می‌شود برای شما — آماده‌ی ارسال در ۷ روز کاری» **[verify]**, plus a city selector for the delivery estimate. It is driven by `availability = 'made_to_order'` and `leadTimeDays`.
7. **Primary CTA**: **«افزودن به سبد»** (large anar piece) with a quantity stepper.
8. **«قدسنج — اندازه‌ی کودک شماست؟»**, a height-compare tool:
   - The product is drawn to scale next to a Waldorf-doll child.
   - The slider «سن کودک» runs from ۱ to ۶ years, using WHO median heights: ≈۷۵، ۸۷، ۹۶، ۱۰۳، ۱۱۰، ۱۱۶ سانتی‌متر. There's an optional «قد دقیق» input.
   - For the learning tower, a «ارتفاع کابینت» input defaults to ۹۰ سانتی‌متر.
   - Example result: «روی پله‌ی دوم، دست‌های کودک دقیقاً به لبه‌ی کابینت ۹۰ سانتی‌متری می‌رسد.»
   - The server renders the 2-year default, and the tool is about 2.5 KB.
9. **Dimensions drawing**:
   - A CNC-blueprint panel on kraft (`#EADBC0`) with walnut hairlines and dimension arrows labelled in Persian digits («۹۰ سانتی‌متر»).
   - It toggles «باز / تا شده» for foldables.
10. **«شناسنامه‌ی چوب»**, the product's "birth certificate":
    - It plays on the Iranian ID document, so it is instantly understood and warm.
    - A `<dl>` lists: «جنس»، «ضخامت»، «پوشش»، «تحمل وزن»، «ابعاد»، «وزن»، «سن مناسب»، «ساخت: کارگاه چوبز، [شهر]». These come from `material`, `finish`, `maxLoadKg`, `dimensions`, `weightKg`, the age columns and `specs`.
    - It is stamped with a round maker's mark.
    - The same facts feed the JSON-LD `additionalProperty`.
11. **«چطور با آن بازی کنیم؟»**:
    - 3–5 illustrated play ideas along an age progression. Example: «از ۱۰ ماهگی: سینه‌خیز روی رمپ · از ۲ سالگی: سرسره · از ۳ سالگی: تونل و خانه‌ی بازی».
    - This is excellent material for AEO.
12. **Safety callout (anar)**: «همیشه با نظارت بزرگسال؛ روی سطح صاف و بدون فرش لغزنده استفاده کنید.» (`safetyNotes`), plus the care instructions (`careNotes`) and the warranty (`warrantyMonths`).
13. **«در جعبه چه هست؟»**: the contents (`inTheBox`) and assembly (a PDF upload in Phase 2).
14. **Product FAQ** (drawers). Example: «از چند ماهگی می‌شود استفاده کرد؟»، «تا چند کیلو را تحمل می‌کند؟»
15. **Related guides** (books, from `post_products`) and **glossary terms** (alphabet blocks). Per the content plan's linking rule, there is always the cluster's «راهنمای انتخاب» pillar plus 2 related articles.
16. **«اتاق را کامل کن»**: room presets that include this product, plus the bundle price, and `product_relations` of kind `bundle`.
17. **Customer photos and reviews** for this product (real only).

**Sticky buy bar (mobile):**
- It replaces the bottom nav.
- Contents: price plus «۴ قسط ۹۹۵٬۰۰۰», the «افزودن به سبد» piece and the cart count.
- It appears once the main CTA scrolls out of view, using CSS only: `timeline-scope` plus `view-timeline` on the main CTA drives the bar's `translate`. The fallback is a 0.4 KB IntersectionObserver.

**Desktop layout:**
- A 2-column split: the gallery is sticky on the left (inline-end), 7 columns. Info sits on the right, 5 columns.
- Sections 8 to 17 continue full width below.

---

## 7. Content hub: «کتابخانه‌ی چوبز» (and the SEO/AEO/GEO machine)

### 7.1 Information architecture & URLs

The URL plan is the one in `docs/CONTENT-PLAN.md` §0-2. This concept adds the commerce and room pages to it.

| Route | Purpose | Schema |
|---|---|---|
| `/mag` | Hub: the bookshelf of 9 cluster guides, the parents' questions strip, the age navigator, latest articles and the glossary entry | `CollectionPage` + `ItemList` |
| `/mag/topic/{cluster}` | The 9 cluster hubs (`topics` table): `montessori`, `movement`, `learning-tower`, `nursery`, `play`, `art`, `reading`, `safety`, `gifts` | `CollectionPage`, `ItemList`, `BreadcrumbList` |
| `/mag/{slug}` | Every article, pillar or spoke, on a short flat URL (e.g. `/mag/pikler-triangle-guide`) | `Article`/`BlogPosting`, `FAQPage`, `BreadcrumbList`, `WebPage.reviewedBy` |
| `/glossary`, `/glossary/{term}` | «واژه‌نامه»: 46 terms, each with its own page | `DefinedTermSet` / `DefinedTerm` |
| `/age/{range}` | 5 age hubs (`0-6-months`, `6-12-months`, `1-2-years`, `2-3-years`, `3-6-years`): a guide plus products | `CollectionPage` + `ItemList` of `Product` |
| `/rooms/{preset}` | Room setups, e.g. «چیدمان اتاق مونته‌سوری ۲ تا ۳ سالگی» | `ItemList` + `Article` |
| `/team/{slug}` | Writers and expert reviewers | `ProfilePage` + `Person` |
| `/faq` | Buying, shipping, installment and safety questions | `FAQPage` |
| `/editorial-policy` | How articles are written, reviewed and updated | `WebPage` |
| `/about`, `/about/materials`, `/about/facts`, `/workshop` | The brand entity | `AboutPage`, `Organization` |

**The 9 clusters:**
- «مونته‌سوری در خانه»
- «پیکلر، حرکت آزاد و رشد حرکتی»
- «برج یادگیری و آشپزخانه‌ی کودک»
- «اتاق کودک و سیسمونی چوبی»
- «بازی آزاد، اسباب‌بازی چوبی و والدورف»
- «هنر و نقاشی کودک»
- «کتاب، زبان و کتابخانه‌ی کودک»
- «ایمنی، کیفیت چوب و کارگاه»
- «هدیه و مناسبت‌ها»

Each cluster owns one dye from the dye set (§2.1). The dye carries through its hub, its article badges and its book spines.

**Slugs are short, stable ASCII**, as the content plan decided.
- **Why:** they survive being pasted into Bale, WhatsApp and Instagram DMs without becoming a wall of percent-encoding, and they never split on «ی/ي» variants.
- **Where the Persian goes:** the query sits in the places rankings actually read: title, H1, breadcrumb names, headings, alt text and anchor text.
- **URL hygiene:** `proxy.ts` (Next 16's replacement for middleware) handles trailing slashes, case and legacy paths. The existing `redirects` table keeps slug history for Phase 2 edits.

**Topical map:** 9 clusters and 64 articles (content plan §1). Example spokes for «پیکلر، حرکت آزاد و رشد حرکتی»:
- «مثلث پیکلر چیست و از چند ماهگی مناسب است؟»
- «مثلث پیکلر یا آرک؛ کدام اول؟»
- «۱۰ بازی با مثلث پیکلر در خانه»
- «ایمنی وسایل صعود کودک»
- «امی پیکلر که بود؟»
- «حرکت آزاد یعنی چه؟»

**Launch (wave 0):** 10 seed articles, 46 glossary pages, 9 cluster hubs, 5 age hubs, the team pages, the editorial policy and `llms.txt`.

**Linking rules** (content plan §0-2):
- Each pillar links to every spoke, and each spoke links back.
- Each spoke links to 2 siblings plus 1 article in another cluster.
- Each article links to 1–3 products.
- Each PDP links to its cluster's «راهنمای انتخاب» pillar, 2 related articles and its glossary terms.
- The first mention of each glossary term links automatically.

### 7.2 Hub page (`/mag`)

- **Top:** a front-facing bookshelf headed «شروع از اینجا». The 9 pillar guides stand on it as picture books, each spine in its cluster's dye.
- **Cluster tabs:** wooden blocks with a horizontal snap scroll on mobile.
- **«پرسش‌های والدین»:** a strip of 6 felt bubbles, each a question with a one-line answer. Tapping one expands it in place (`details`), and each links to the H2 anchor that answers it in full.
- **«برای کودک چندساله؟»:** the age ruler, linking to `/age/*`.
- **Latest:** a list of cards with cover, title, a 2-line excerpt, the reviewer's name and a Jalali date.
- **Glossary entry:** a row of 8 alphabet blocks («الف ب پ ت…») leading to `/glossary`.

### 7.3 Article page: the reading experience

**Order.** The order is the content plan's default article template, built from the toy-box materials:

1. **Breadcrumb.**
2. **Badges:** the cluster block, in its dye, and an age hexagon («۱ تا ۲ سال») linking to `/age/*`.
3. **H1**, phrased as the question people actually ask.
4. **Byline row:**
   - The author, with an arch avatar.
   - «بازبینی علمی: [نام، مدرک]» with a small sage stamp and the review date.
   - «به‌روزرسانی: ۲۴ مهر ۱۴۰۵» in `<time>`, and «۸ دقیقه مطالعه».
   - Until a real expert has signed off, the byline reads «تحریریه‌ی چوبز» and the reviewer slot stays empty. No credentials are ever invented.
5. **Cover in an arch:** an SVG `<img>` of about 8 KB, or a photo, with `fetchpriority="high"`. This is the LCP.
6. **«خلاصه در یک نگاه»:**
   - A stitched sage felt card with 3–5 standalone, quotable statements of 30 words or fewer each.
   - The first statement starts «پاسخ کوتاه:».
   - The card is marked as `speakable` (a `SpeakableSpecification` that points at its selector).
7. **Bead TOC**, on articles over 1,200 words.
8. **Body.**
9. **Closing blocks:** product embeds, «از کارگاه چوبز», the FAQ, sources, the author box, «قدم بعدی در این مسیر» and the «بپرس از چوبز» CTA.

**TOC: "bead string".**
- On mobile, a thin sticky string of beads sits under the top edge, one bead per H2.
- The beads fill as you read via a CSS `scroll()` timeline, with zero JS.
- Tapping the string opens the full TOC as a bottom sheet.
- About 0.8 KB of IntersectionObserver marks the current bead for screen readers (`aria-current`).
- On desktop, the TOC is a vertical "ruler" in the inline-end column (left), with the current section's tick in firouzeh.

**Body:**
- Milk paper, `--fs-article`, line-height 1.9, max `65ch`.
- **H2s are questions.** Each H2 opens with a 40–60-word direct answer, then the detail.
- **Every number carries its source:** a footnote to WHO, CDC, AAP or AMI, because LLMs cite "number + source" sentences.

**Blocks.** There is one block for every pattern in the content plan (§5), each made in toy-box materials:

| Block | Toy-box form | Markup / schema |
|---|---|---|
| «خلاصه در یک نگاه» | Stitched sage felt card | `<section aria-label>`, `speakable` |
| Age badge | Hexagon climbing-hold badge, one dye per age range | Links to `/age/*` |
| Callout «نکته» | Sage felt | `<aside role="note">` |
| Callout «هشدار ایمنی» | Ply card with an anar edge and a triangle icon | `<aside role="note">` |
| Callout «از کارگاه چوبز» | Ply face on the article's own grain, a «تجربه‌ی دست‌اول» stamp and a workshop photo | `<aside role="note">` |
| Callout «نظر کارشناس» | Milk paper with an arch avatar and name | `<aside>` with a link to the `Person` |
| «باور غلط / واقعیت» | A two-faced wooden block. Both faces are always visible: side by side on desktop, stacked with a hinge line on mobile. Nothing is hidden from crawlers | Two `<div>`s with headings |
| Checklist | A peg board. Ticking an item drops a peg into its hole with a clack, and progress beads count up. «چاپ / PDF» plus share to Bale, WhatsApp and Telegram as plain links | Real checkboxes in a `<ul>`, state in `localStorage` (try/catch), `ItemList`. About a 1 KB island |
| Product embed | An inline ply card (single, pair, or a «خرید از این عکس» slider) with art, price, installments, age badge, a «چرا اینجا؟» line and «افزودن به سبد» | `Product` + `Offer` in IRR |
| Comparison table | A real table with a sticky first column, and Choobz's column on a mustard swash. Under 600 px, rows become stacked ply cards. Never page-level horizontal scroll | `<table>`, `<caption>`, `scope` |
| Steps | Numbered beads on a string with Persian digits, a photo per step, the time and the tools | `<ol>`, `HowTo` (no rich result since 2023, but still parsed by LLMs) |
| Pull quote | A Mikhak quote in a sage bubble with large «» | `<blockquote cite>` |
| Gallery | A clothesline of pinned polaroids, with a swipe lightbox | `ImageObject`, credited with consent |
| FAQ | The chest of drawers, first drawer open | `<details>`, `FAQPage` |
| Key facts | Number blocks: a big Persian numeral cut as a ply block, a one-line explanation and a footnote link | Footnote to sources |
| Inline definition | A dotted underline that opens a native `popover` (a bottom sheet on mobile) | `DefinedTerm`, link to `/glossary/{term}` |
| Growth timeline | The vertical growth ruler. Each node is a milestone plus a suggested play | `<ol>` |
| Dimensions | The PDP's «قدسنج» and blueprint panel, reused | `<figure>` |
| Shop-the-room hotspots | Wooden pegs on the photo. Tapping one opens a bottom-sheet card. A text list of the same products sits below the photo | `<ul>` of links |
| Video | **Aparat** (YouTube is filtered in Iran) behind a click-to-load facade: a poster, a play key and the transcript in HTML. The iframe is the page's only third-party request, and only after a tap | `VideoObject` + transcript |
| «بپرس از چوبز» | A felt bubble with Bale and Instagram DM buttons and the response hours | — |
| Medical disclaimer | A small, calm note above the FAQ on YMYL articles: «این مطلب جایگزین مشاوره‌ی پزشک نیست» | — |
| «قدم بعدی در این مسیر» | The next book on the cluster's shelf, which morphs on tap, plus 3 related cards and the cluster hub link | — |
| Sources | A numbered list of organization, title, link and access date, with clickable in-text footnotes | `citation[]` |

**How blocks are stored:**
- Bodies stay **Markdown (GFM)**, as `src/db/schema.ts` decided.
- Blocks are written as directives:
  - containers: `:::tip`, `:::warning`, `:::workshop`, `:::expert{author=…}`, `:::myth`
  - leaves: `::product{slug=…}`, `::compare`, `::checklist`, `::steps`, `::facts`, `::timeline`, `::hotspots{media=…}`, `::video{aparat=…}`
  - glossary marks: `[[term]]`
- The server parses them (remark + remark-directive, inside a `"use cache"` function) into Server Components, so parsing costs zero client JS.
- The same AST renders the `.md` alternates and `llms-full.txt`.

**End of article:**
- **Author box:** an arch portrait, bio, credentials, `knowsAbout` and `sameAs`. Below it, the reviewer's box with the review date and a link to `/editorial-policy`.
- **Share row:** native share, copy link, Bale, WhatsApp and Telegram, all plain links with no SDKs.
- **«این مطلب مفید بود؟»** comes in Phase 2, stored in SQLite.

**Print stylesheet:** paper only. Checklists print as a sheet you can tick by hand.

**Semantic skeleton (AEO-ready):**
```html
<article>
  <header>
    <nav aria-label="مسیر">…</nav>
    <h1>…؟</h1>
    <p class="byline">… <time datetime="2026-10-16">۲۴ مهر ۱۴۰۵</time></p>
    <figure class="arch">…</figure>
    <section class="tldr" aria-label="خلاصه در یک نگاه"><ul>…</ul></section>
  </header>
  <nav aria-label="فهرست مطالب">…</nav>
  <section aria-labelledby="q-age"><h2 id="q-age">از چند ماهگی مناسب است؟</h2>
    <p><strong>پاسخ کوتاه:</strong> …<sup><a href="#src-1">۱</a></sup></p> …</section>
  <section aria-labelledby="faq">…<details name="faq">…</details></section>
  <footer>…author, reviewer, sources…</footer>
</article>
```

### 7.4 Glossary (`/glossary`)

**Index:**
- The Persian alphabet as **wooden letter cubes** (32 letters, «الف» to «ی»). Letters with no terms are drawn as unpainted ply and disabled. Tapping a cube jumps to its group.
- The 46 terms sit on four labelled shelves, the content plan's groups:
  - «رویکردها و مفاهیم تربیتی»
  - «رشد حرکتی و حسی»
  - «وسایل و محصولات»
  - «مواد، ایمنی و استاندارد»

**Each term card:**
- The term in Persian, with the Latin in `<bdi>`.
- A **bold one-sentence definition** that can be quoted alone, then a 2–4-sentence explanation, «مرتبط» links (articles and products) and «همچنین ببینید».
- Example: **«پیکلر (Pikler)»** — «رویکردی در مراقبت و تربیت کودک که امی پیکلر، پزشک اطفال مجارستانی، بنیان گذاشت و بر حرکت آزاد و بدون دخالت بزرگسال تأکید دارد.»

**Term pages:**
- Every term gets its own `/glossary/{term}` page with `DefinedTerm`, `inDefinedTermSet` and `sameAs` (Wikipedia/Wikidata where one exists), as the content plan requires.
- **Against thin pages:** a term page is indexable only once it has the definition, a body of 150 words or more and at least 2 related articles or products. Until then it renders `noindex,follow`.

### 7.5 SEO / AEO / GEO architecture (applies site-wide)

**Rendering & semantics:**
- Everything meaningful is in server-rendered HTML.
- Landmarks are used throughout, along with `<dl>` for specs, `<table>` for comparisons, `<time>`, `<address>` and `<figure>`.
- One H1 per page.
- Breadcrumbs are visible.

**JSON-LD:** one `@graph` per page with stable `@id`s: `https://choobz.kids/#org`, `#website`, `…/product/x#product`.
- **Organization:** `name: "چوبز کیدز"`, `alternateName: ["Choobz Kids","چوبز","choobz.kids"]`, logo, `sameAs` (Instagram, Bale, eNamad page), `address`, `contactPoint`, `foundingDate` **[verify]**.
- **WebSite:** with a `SearchAction` pointing at `/search?q=`.
- **Product, plus ProductGroup for variants** (`hasVariant`, `variesBy: color/size`):
  - `brand` and `manufacturer` are the Organization.
  - `material`.
  - `additionalProperty` (`PropertyValue` for max load, thickness and finish).
  - `width`/`height`/`depth` as `QuantitativeValue` with `unitCode: "CMT"`.
  - **`audience: PeopleAudience` with `suggestedMinAge`/`suggestedMaxAge`**, so age is machine-readable.
  - `subjectOf`, pointing to its guides.
- **Offer:**
  - `price` in **IRR (Toman×10)**, `priceCurrency: "IRR"`, `priceValidUntil`.
  - **`availability: https://schema.org/MadeToOrder`** for workshop-made items. It is honest and distinctive.
  - `shippingDetails` (`OfferShippingDetails`, destination IR, `handlingTime` and `transitTime`).
  - `hasMerchantReturnPolicy`.
- **Article:**
  - `author` (`Person` with `jobTitle`, `worksFor`, `knowsAbout`, `hasCredential` and `sameAs`, as in the content plan §4), `datePublished`, `dateModified` (honest; changes are shown in a visible «تاریخچه‌ی به‌روزرسانی»), `inLanguage: "fa-IR"`.
  - `about` (glossary `DefinedTerm`s and Wikidata entities), `mentions` (products), `citation[]`.
  - The `WebPage` carries `reviewedBy` (the expert).
- **FAQPage** on home, `/faq`, PDPs, categories and articles.
  - Google has limited FAQ rich results to authoritative government and health sites since 2023, so this markup is **for answer engines and parsers**, not for SERP stars.
  - The same text is visible on the page.
- **DefinedTermSet / DefinedTerm** for the glossary. **ItemList** on hubs, categories, age pages and room pages. **BreadcrumbList** everywhere.

**AEO writing system** (content plan §0-1, enforced by CMS validation in Phase 2):
- Question-phrased H1/H2.
- «خلاصه در یک نگاه» under the H1, then a 40–60-word answer first in every H2.
- Lists and tables over prose for facts.
- One fact per sentence for specs.
- Consistent numbers across PDP, article and schema.
- Every article has a summary, FAQ and sources. YMYL topics (growth, sleep, safety, health) also need an expert reviewer before publishing.
- Every keyword's spelling variants (مونته سوری / مونته‌سوری / مونتسوری) appear in subheadings, alt text or the FAQ.
- Pillars are re-reviewed every 6 months, and `dateModified` changes only when the content does.

**GEO (generative engines):**
- **`/llms.txt`** gives the brand definition, a fact sheet, key categories, the top 30 guides and contact details. **`/llms-full.txt`** gives the full markdown of pillar guides plus product specs.
- **Markdown alternates:** `/mag/{slug}.md` and `/product/{slug}.md` are rendered from the same Markdown AST, advertised with `<link rel="alternate" type="text/markdown">`.
- **`/about/facts`, «چوبز در یک نگاه»:** a terse fact sheet with founded date, location, the workshop, materials, product lines, shipping, installments and contact, plus the same entity sentence used in the footer. Consistent entity statements are what LLMs anchor on.
- **Original data:**
  - Workshop facts (load tests, real dimensions) and customer surveys, e.g. at what age families actually buy the learning tower **[placeholder until real data]**.
  - An annual «گزارش بازی کودکان ایرانی», built from Instagram polls of the 50K community.
  - Published with charts, a methodology and a dataset download.
  - Original statistics are the content most likely to be cited by ChatGPT, Perplexity and AI Overviews.
- **robots.txt:**
  - Allow GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-SearchBot, Applebot-Extended, Google-Extended and Bingbot. This is a business decision, made in favour of being cited.
  - Disallow `/api`, `/cart` and filter permutations.
- **Bing Webmaster plus IndexNow** pings on publish (server-side; this matters for ChatGPT search).

**Sitemaps:**
- A sitemap index splits into products, categories, articles, clusters, glossary, age, rooms and team.
- Each carries `lastmod` from `updatedAt`, plus image entries.
- There is an RSS feed at `/mag/feed.xml`.

**Iran-specific:**
- A **Torob** product feed endpoint (Phase 2; data model ready now). Torob is Iran's dominant shopping search engine.
- **Persian normalization** at index time, at query time and in URLs.

**OG images:**
- **Not** built with `next/og`/Satori, which doesn't reliably shape Persian joining and bidi.
- They are rendered with **sharp (libvips with Pango/HarfBuzz)** from SVG templates. Estedad and Ario are installed via fontconfig in the Docker image.
- The output is cached to `/data/cache/og/`.
- Every product, article and term gets an arch-framed card with ply edges.

**Metadata patterns:**
- **Home:**
  - Title: «چوبز کیدز | اسباب‌بازی و سیسمونی چوبی مونته‌سوری»
  - Description: «برج یادگیری، مثلث پیکلر، کتابخانه و اتاق مونته‌سوری؛ ساخته‌شده با چوب طبیعی در کارگاه چوبز. ارسال به سراسر ایران و خرید ۴ قسطی با اسنپ‌پی.»
- **PDP title:** «{نام محصول} | {مزیت کلیدی} — چوبز کیدز»
- **Article title:** «{پرسش}؟ | راهنمای چوبز»
- **Measurement** (content plan §7): Search Console by cluster, featured snippets and PAA, and a fixed set of 30 prompts checked monthly in ChatGPT, Perplexity and Gemini for brand mentions.

---

## 8. Motion system

### 8.1 Principles

1. **«وزن دارد»: wood has weight.** Nothing floats. Bigger pieces move slower: category pieces take 520 ms, chips 280 ms. There's no elastic wobble beyond what wood would do.
2. **«می‌نشیند»: toys settle.** Every animation ends at rest.
   - There are no infinite loops, except idle "toy plays", and those run once on view and then stop.
   - Everything pauses off-screen (`view()` timelines inherently, `animation-play-state` otherwise).
3. **«دست اول»: hand first.**
   - Motion answers touch; ambient motion is limited to **one element per viewport**.
   - There is no autoplay carousel and no parallax on body text.
4. **«آرام»: calm volume.** Overshoot stays at or below about 8%, rotation at or below 6°, and nothing flashes. Sound is off by default and haptics are 8 ms.
5. **«جهت دارد»: direction is cultural.** Painting, progress, rolling and "forward" flow right to left. A forward page transition behaves like turning a page in a Persian book: the new view enters from the inline-end side (left).

### 8.2 Tokens

| Token | Value | Use |
|---|---|---|
| `--dur-press` | 90 ms | Press down (edge compress) |
| `--dur-release` | 240 ms | Release back up (with `--ease-settle`) |
| `--dur-hover` | 180 ms | Lift to +2 |
| `--dur-chip` | 280 ms | Chips, toggles, bead moves |
| `--dur-reveal` | 520–700 ms | Section entrances (scroll-driven ranges preferred) |
| `--dur-drawer` | 380 ms | Sheets, drawers, mega-menu |
| `--dur-page` | 320 ms | View transitions |
| `--stagger` | 40–60 ms | Sequences (≤ 7 items, then group) |
| `--ease-wood` | `cubic-bezier(.22,.9,.25,1)` | Default decelerate |
| `--ease-calm` | `cubic-bezier(.65,0,.35,1)` | In-out for layer separation, scroll-linked moves |
| `--ease-settle` | `linear(0, .009, .035 2.1%, .141 4.4%, .281 6.7%, .723 12.9%, .938 16.7%, 1.017 19.4%, 1.077 22.8%, 1.088 26.3%, 1.083 29.7%, 1.04 37.4%, 1.019 41.5%, .997 50%, .992 56.6%, 1.001 75.8%, 1)` | Spring-like settle (about 8% overshoot), pure CSS |
| `--ease-clack` | `linear(0, .2 10%, .62 22%, 1 32%, .9 40%, 1 48%, .975 55%, 1 62%, 1)` | A drop with two dampened bounces (wood on wood) |

**JS springs** come from a custom `src/lib/spring.ts` (semi-implicit Euler, about 1 KB):

| Name | Stiffness / Damping / Mass | Use |
|---|---|---|
| `press` | 700 / 40 / 1 | Keys, tokens |
| `drag-release` | 260 / 24 / 1 | Stacker arcs snapping to a slot |
| `drop` | 300 / 20 / 1.1 | Room-builder placement |
| `rock` | 120 / 5 / 1 (rotational) | Rocker arcs (3–4 swings) |
| `bead` | 500 / 30 / 0.6 | Abacus, nav bead, cart count |
| `sheet` | 320 / 34 / 1 | Bottom sheets following the finger |
| `string` | 420 / 16 / 0.5 | The «کش بیاد» word: Mikhak `KSHD` 100 → 200 while pulled, then a springy return |

**Motion's `animate` (`motion/mini`)** is used only inside lazy engines that need sequencing. The full `motion/react` bundle isn't in Phase 1.

### 8.3 Scroll-driven recipes

**Gate:** everything sits behind `@supports (animation-timeline: view())` and `@media (prefers-reduced-motion: no-preference)`. Initial hidden states are declared **only inside those blocks**, so content is never invisible in unsupported browsers.

**The ramp ball:**
- **Path baking.** A build step samples the SVG ramp path into about 48 `translate` keyframes, plus `rotate` keyframes for rolling without slipping: `turns = pathLength / (π·d)`.
- **Hold segments** at the landings make the ball pause at each age.
- **Responsive units.** The keyframes are written in **container-query units** (`cqi`/`cqb`) on a `container-type: size` section, so they scale with the layout.
- **Compositor-only.** The whole thing stays on the compositor (transforms only). `offset-distance` isn't composited in every engine, which is why we bake the path instead.

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .ramp      { container-type: size; view-timeline: --ramp block; }
    .ramp-ball { animation: ramp-roll linear both; animation-timeline: --ramp;
                 animation-range: contain 0% contain 100%; }
    /* @keyframes ramp-roll { 0% { translate: 88cqi 2cqb; rotate: 0turn } … 20% { … } 24% { …hold… } … } — generated */
  }
}
```

**Reveals:** `animation-timeline: view(); animation-range: entry 10% cover 35%`. Translate is 16 px at most, opacity starts at 0.001, and the ease is `--ease-wood`.

**Highlighter swash:** `clip-path: inset(0 0 0 100%) → inset(0)` paints the swash right to left, on view.

**Reading beads:** `animation-timeline: scroll(root)` drives a `scale` on each bead's fill, segmented by `animation-range` per section.

**Sticky buy bar:** `timeline-scope: --cta` on `<main>` plus `view-timeline: --cta` on the main CTA. The bar animates `translate: 0 100% → 0` over `exit 0% exit 100%`.

### 8.4 Page transitions

- They use React 19.3's `<ViewTransition>`, which works in the App Router with no configuration (Next 16 docs, «View transitions»). Same-document view transitions ship in every current engine. Without support, navigation is simply instant.
- **Default:** «ورق زدن». Forward is a 24 px slide from inline-end plus a crossfade over 320 ms; back is the reverse.
  - The type is set on the link itself: `<Link transitionTypes={['nav-forward']}>` (Next 16.2+). Breadcrumbs and back links pass `'nav-back'`.
  - `<ViewTransition>` maps each type to a `view-transition-class`.
- **Card → PDP:** `view-transition-name: product-{id}` on the card's arch art and the PDP's first gallery frame. The `::view-transition-group` keyframe briefly lifts the art (scale 1.04 plus a growing shadow), so the toy "comes off the shelf toward you".
- **Book → article:** the cover morphs into the article header while the rest fades.
- **Shape → category:** the shape-sorter piece morphs into the category hero shape.
- **Tab bead:** the shared `nav-bead` name slides the bead along the wire.
- **Reduced motion:** `::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation-duration: 0s }`, plus a 120 ms crossfade on root only.

### 8.5 Reduced motion, low-power, sound

- **`prefers-reduced-motion: reduce`:**
  - Everything renders in its final state.
  - Drag still works, but releases snap with no inertia and no rocking.
  - Scroll-driven effects are disabled and view transitions become crossfades.
  - The «کش بیاد» word stays at `KSHD` 100. Pulling the string still works, but the word no longer stretches.
- **Low-power tier.** An inline check (`navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 2`, or a `Save-Data` header) sets `data-tier="calm"`. That disables idle toy plays, sawdust particles and the `KSHD` stretch, and limits ply-letter layers to 3.
- **Sound engine** (about 1.2 KB, loaded only after the user enables it):
  - **"Tock":** a 70 ms sine at 650–900 Hz with an exponential decay, plus a 25 ms noise burst through a band-pass at about 1.6 kHz.
  - **"Clack":** two tocks 40 ms apart.
  - **"Shhh"** (drawer): filtered noise sweeping 2→0.8 kHz over 300 ms.
  - Pitch is randomized ±8%. Master gain is 0.25.
  - The setting persists in `localStorage` (try/catch) and is forced off in Lullaby mode.

---

## 9. Performance plan

### 9.1 Rendering strategy (Next 16.4, App Router, `output: 'standalone'`)

**Config:**
- Already in `next.config.ts`: `cacheComponents: true` and `partialPrefetching: true`. Links prefetch only the static shell of each route, which is cheap on Iranian mobile data.
- To add: `output: 'standalone'`, `images.loaderFile` (§9.6), `experimental.inlineCss: true` (§9.3) and `reactCompiler: true` (with `babel-plugin-react-compiler`).

| Route | Mode | Cache tags | Dynamic parts |
|---|---|---|---|
| `/` | Static RSC shell, `"use cache"` + `cacheLife('days')` | `home`, `products`, `posts`, `settings` | Cart count (client), daypart (inline script) |
| `/shop`, `/shop/{category}` | Static shell; grid cached per **normalized filter key** in a `<Suspense>` hole | `products`, `category:{slug}` | Filters (searchParams) |
| `/product/{slug}` | Static per product, warmed after deploy | `product:{slug}` | Delivery estimate per city (client) |
| `/mag/**`, `/glossary/**`, `/age/*`, `/rooms/*`, `/team/*`, `/faq` | Static | `post:{slug}`, `topic:{slug}`, `term:{slug}`, `faqs`, `products` | None |
| `/search`, `/api/search` | Dynamic (SQLite FTS5, sub-millisecond queries) | — | — |
| `/illus/[key].svg`, `/og/[...].png` | Route handlers, immutable caching, persisted to `/data/cache` | — | — |

**SQLite in-process via better-sqlite3:**
- Queries take about 0.1–1 ms, so even uncached SSR has server time under 30 ms.
- `src/db/index.ts` already opens one connection per process with WAL, `synchronous = NORMAL`, foreign keys and `busy_timeout = 5000`, at `DATABASE_PATH` (`/data/choobz.db` in production).
- Pages render on demand at runtime and are cached; we don't prerender against a build-time DB that would differ from `/data/choobz.db`.
- A post-deploy warm-up script requests every sitemap URL once.

### 9.2 Client islands & JS budget

**Pattern: "SSR markup plus a lazy engine".**
- A tiny client *activator* (≤ 0.6 KB) attaches to server-rendered DOM and calls `import()` for the real engine only on idle, on visible or on first interaction.
- The engine **adopts** existing nodes rather than re-rendering them.
- Client components stay leaf-sized so hydration trees stay small.

| Island | Pages | Hydration trigger | JS (gz, est.) |
|---|---|---|---|
| Framework (React 19 + Next runtime) | All | — | ≈ 90–105 KB (baseline; measure in CI) |
| `CartStore` + `CartBadge` | All | Eager | ≈ 1.5 KB |
| `CartDrawer` (`<dialog>`) | All | First open | ≈ 5 KB |
| Daypart/tier/theme inline script | All | Inline in `<head>` | ≈ 0.3 KB |
| `SoundEngine` | All | When enabled | ≈ 1.2 KB |
| `StackerEngine` | Home | `requestIdleCallback` or first `pointerdown` | ≈ 5–6 KB |
| `PostcardMaker` | Home | On tap | ≈ 3–4 KB |
| Ramp ball | Home | None (CSS) | 0 KB (+0.5 KB landing "tock" when sound is on) |
| `RoomBuilder` | Home, `/rooms/*` | Within 600 px of viewport | ≈ 10–14 KB |
| `Abacus` | Home, PDP, cart | Visible | ≈ 1.5 KB |
| `SearchDialog` | All | On open | ≈ 4 KB |
| `FilterEnhancer` + `AgeRuler` | Shop | Visible (the form works without JS) | ≈ 4 KB |
| `GallerySync` | PDP | Visible | ≈ 1.5 KB |
| `HeightCompare` | PDP | Visible | ≈ 2.5 KB |
| Sticky buy bar | PDP | CSS; IO fallback | 0–0.4 KB |
| TOC current-bead | Articles | Idle | ≈ 0.8 KB |
| `Checklist` (peg board) | Articles | Visible | ≈ 1 KB |
| Aparat video facade | Articles | Tap (the iframe loads only then) | ≈ 0.3 KB |
| Pull-string word (`KSHD`) | Home | Inside `StackerEngine` | 0 KB extra |
| Glossary popovers, FAQ drawers, mega-menu | Various | Native `popover`/`<details>` | 0 KB |
| Web Vitals reporter → `/api/vitals` (SQLite) | All | Idle | ≈ 1 KB |

**Targets:**
- Home first-load JS: **≤ 110 KB gz** including the framework. Only about 2 KB of our own code is eager.
- PDP: **≤ 115 KB**.
- Article: **≤ 100 KB**, of which our own code is **≤ 5 KB**.
- The content plan asks for under 70 KB of client JS on articles. The App Router's framework baseline alone is larger than that, so we read the plan's figure as *our* JS on top of the framework, and hold ourselves to 5 KB, far below it. CI reports both numbers separately.

### 9.3 LCP element per page

| Page | LCP element | How it stays fast |
|---|---|---|
| Home | H1 display line (text, Ario) | Ario (19 KiB) and Estedad (50.5 KiB) preloaded. CSS inlined with `experimental.inlineCss`: Tailwind's atomic CSS is small and most visitors are first-time mobile visitors, so this removes a render-blocking request. Measure it against a ≤ 20 KB external sheet. **No raster above the fold.** The hero SVG is inline shapes, which aren't an LCP candidate |
| Shop listing | H1 now; first card image once photos exist | First 2 card images `fetchpriority="high"`, AVIF 360w ≈ 18 KB; the rest lazy |
| PDP | H1 now; first gallery image once photos exist (photo phase) | Preloaded via `priority`, `sizes="(max-width:768px) 100vw, 58vw"`, AVIF ≈ 40–60 KB, dominant-colour placeholder |
| Article | Cover SVG `<img>` (~8 KB) or H1 | Cover `fetchpriority="high"`, explicit width/height |
| Glossary, `/faq`, cluster hubs | H1 | Text only |

**Targets (p75, mid-range Android on 4G, measured with RUM):** LCP < 2.0 s, CLS < 0.02, INP < 150 ms, TTFB < 400 ms.

### 9.4 Fonts

- **Files:** three woff2 files, built reproducibly by `scripts/fonts/build.sh` (`docs/FONTS.md` §5.3) from upstream sources into `src/fonts/`.
- **Critical (preloaded):** Ario Dots1 (19.0 KiB) and Estedad VF (50.5 KiB), so 69.5 KiB in total.
- **Lazy:** Mikhak 600 + `KSHD` (26.3 KiB), not preloaded. It appears only in bubbles, tags and kickers, which have fixed sizes and explicit line-heights. A late swap there moves nothing.
- **Loading:** all three go through `next/font/local` with `display: 'swap'` and `adjustFontFallback: false` (§3.1). There is never a request to Google Fonts, a CDN or GitHub at runtime.

### 9.5 HTML, SVG & CSS weight

**The RSC double-payload trap.** Inline SVG in Server Components is sent **twice**: once in the HTML and once in the RSC flight payload.

**Rule:** only interactive or hero SVG is inline. Everything else ships as `<img src="/illus/{key}-{variant}-{view}.svg">`, which is:
- generated by the illustration functions
- immutable-cached and persisted under `/data/cache/illus`
- cached across pages
- outside the flight data entirely

Night variants are delivered through `<picture>` (§2.1).

**Budgets:**
- Home HTML ≤ 45 KB gz.
- Fewer than 1,500 DOM nodes.
- `content-visibility: auto; contain-intrinsic-size: auto 900px` on every below-fold section.

**CSS:**
- Tailwind v4 (CSS-first `@theme`), at about 15–20 KB gz.
- No CSS-in-JS.
- Animations use transform and opacity only, plus `clip-path` on small elements.

### 9.6 Media pipeline (one Docker volume)

```
/data                                         # the one Docker volume
├── choobz.db (+ -wal, -shm)                  # DATABASE_PATH
├── uploads/                                  # UPLOAD_DIR, served at /media/…
│   ├── {kind}/{slug}/{name}.{w}.avif|.webp   # 320, 480, 640, 828, 1080, 1440, 1920, written once
│   └── originals/{id}.{ext}                  # EXIF/GPS stripped, never served
└── cache/{illus,og}/                         # generated illustration SVGs and OG cards
```

**At upload (Phase 2):**
- sharp generates the AVIF and WebP widths.
- It strips EXIF and GPS. This matters for children's photos.
- It fills the existing `media` columns: `width`, `height`, `sizeBytes`, `dominantColor` and `blurDataUrl`.

**Serving:**
- **Loader:** `images.loaderFile` points `next/image` at the pre-generated variant, snapping `width` to the nearest generated size, so **no image optimizer burns CPU in the container at request time**.
  - The `images.localPatterns` route mentioned in the current media handler is the fallback, until variant generation exists.
- **Formats:** our `<Media>` component renders a `<picture>` with an AVIF source and a WebP `<img>`, through the same loader.
- **The existing handler** (`src/app/media/[...path]/route.ts`) already streams files with immutable `Cache-Control`, an ETag, path-traversal protection and a sandboxing CSP for SVG.
- **Optional Caddy:** a Caddy container in the same compose file can mount `/data/uploads` read-only and serve `/media/*` directly with HTTP/3 and brotli/zstd. The app works without it.

### 9.7 Iran infrastructure

- **Zero foreign runtime requests:**
  - no Google Fonts or Analytics
  - no Instagram embeds
  - no CDN-hosted scripts
- **One domestic exception, only on tap:** the Aparat video iframe. YouTube is filtered in Iran, so videos go on Aparat, and the iframe loads only after she taps play.
- **Analytics** is a self-hosted beacon (`navigator.sendBeacon('/api/e')`) into SQLite. Phase 2 adds dashboard charts.
- **Hosting:** host in Iran, behind a domestic CDN with international edge POPs (e.g. ArvanCloud).
  - Iranian mobile users get low TTFB.
  - **Googlebot and AI crawlers abroad can still fetch cached pages during international connectivity disruptions.**
- **`.kids` DNS:** serve it from the same provider's DNS, and monitor resolution inside Iran.
- **Lighthouse CI** runs on every PR with a `budgets.json` (JS, CSS, fonts, LCP). It's tested on real **Galaxy A14/A15 and Redmi Note 12** devices, the most common mid-range phones in Iran, plus one iPhone 11.

---

## 10. Risks & mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Playfulness hurts conversion or clarity.** | Commerce paths stay conventional: price, add-to-cart and checkout sit where she expects them. Play is never a gate: every toy has a plain path beside it. "Delight in the form, clarity in the words." Phase 2 A/B tests the hero and room builder against plain variants using self-hosted events. |
| 2 | **Jank on mid-range Android.** | Compositor-only animation. **No SVG filters.** Illustration node budgets. `content-visibility`. Off-screen pause. The `data-tier="calm"` low-power tier. Lazy engines. Real-device testing in CI. |
| 3 | **An illustration-only catalogue feels less trustworthy.** | Drawings come from the real DXF cut files, labelled «طرح دقیق از روی نقشه‌ی برش». Real customer photos go up early (with permission from the «عکساتون» highlight). Link to Instagram reels. Book a photo shoot in Phase 1.5. Frames are media-agnostic, so photos slot in without redesign. |
| 4 | **Persian rendering pitfalls** (fallback CLS, canvas shaping, OG images, bidi). | Explicit line-heights everywhere plus preloaded critical fonts, with a measured fallback face only if RUM shows shift. Digits converted in code, never by font features. No kashida characters in content. `document.fonts.load()` before drawing the postcard. OG images via sharp with Pango/HarfBuzz instead of Satori. `<bdi>` for mixed strings. «تا» in ranges. A visual regression suite on Android Chrome and iOS Safari. |
| 5 | **Uneven browser support** (scroll timelines, view transitions, `shape()`, anchor positioning). | `@supports` gates. Hidden states only inside supported blocks. Static fallbacks designed as first-class states, not afterthoughts. |
| 6 | **Accessibility of drag, motion and sound.** | WCAG 2.2 AA. A **2.5.7 single-pointer alternative** for every drag (tap-to-lift, tap-to-place, auto-arrange buttons). Full keyboard support. `aria-live` announcements (e.g. «کمان قرمز روی برج قرار گرفت»). 44 px targets. Reduced motion respected. Sound off by default. 3 px firouzeh focus rings. All decorative SVG `aria-hidden`. |
| 7 | **SEO: thin or doorway pages** (age, Q&A, room presets) or filter duplication. | Every landing ships unique editorial of 300+ words. Q&A answers live in articles, and the home and `/mag` question strips only link to them. Filter combinations are `noindex,follow` with canonicals. A glossary page stays `noindex` until it meets the bar in §7.4. |
| 8 | **Unverified claims** (safety, materials, SnappPay terms, return policy, testimonials, experts). | Every claim in this document marked **[verify]** is a CMS field with an "approved by" flag. No fake reviews, ratings or UGC, and no review schema without real reviews. No invented experts or credentials: articles carry «تحریریه‌ی چوبز» until a real reviewer signs off, and YMYL articles aren't published without one. |
| 9 | **Iran network realities** (international disruptions, crawler reach, `.kids` DNS, sanctions on foreign services). | Domestic hosting with an international-edge CDN. Everything self-hosted. No foreign SaaS in the critical path. Crawl stats monitored in Search Console and Bing Webmaster. |
| 10 | **SQLite and single-volume operations.** | WAL mode. A single writer (one app container). Migrations at boot (Drizzle). Nightly `sqlite3 .backup`, plus an upload rsync to domestic S3-compatible object storage. A documented restore drill. |
| 11 | **Children's privacy in UGC.** | `consentAt` plus a consent text version on every UGC row. An optional face-blur flag. EXIF/GPS stripped. A one-click takedown process. No child names without consent. |
| 12 | **Cultural fit.** | Waldorf-doll figures with an optional headscarf. Fathers included. Warm, respectful copy. No music, only wood sounds. Content reviewed by Iranian parents before launch. |
| 13 | **Phase-1 scope creep from signature moments.** | Build order: tokens and primitives → static pages (home without engines, shop, PDP, content) → SEO plumbing → signature engines in order of ROI (ramp is CSS, then stacker, then room builder). Each engine sits behind a feature flag in `settings`. |
| 14 | **Brand-new fonts** (Ario 2.0.1 shipped in 2026‑08). | Fonts are tokens, so swapping is one file. `docs/FONTS.md` §6 lists vetted alternatives: Arad, or Vazirmatn Round-Dots + Lalezar. The build script pins versions, and the visual regression suite covers the specimen strings (ZWNJ, ۴۵۶, prices). |

---

## Appendix A — Data model, ready for Phase 2 (Drizzle + better-sqlite3)

`src/db/schema.ts` already holds most of what this concept needs. That file is the source of truth. The conventions stay as they are:
- snake_case columns
- prices as integer Toman (×10 to IRR only in markup)
- Markdown (GFM) bodies
- `status` plus the `seo` column group on every public entity

**Already covered (no change):**

| Concept need | Existing table / column |
|---|---|
| Media frames and placeholders | `media` (`path` relative to `UPLOAD_DIR`, `width`, `height`, `dominantColor`, `blurDataUrl`, `alt`) |
| Category shape-sorter pieces | `categories` (`illustration`, `accent` = dye, `tagline`, `description`, `sortOrder`) |
| Product cards, PDP, «شناسنامه‌ی چوب» | `products` (`summary`, `ageMinMonths`, `ageMaxMonths`, `skills[]`, `material`, `finish`, `dimensions`, `weightKg`, `maxLoadKg`, `specs[]`, `inTheBox[]`, `safetyNotes`, `careNotes`, `warrantyMonths`, `illustration`, `featured`, `isNew`) |
| `MadeToOrder` availability | `products.availability = 'made_to_order'` and `leadTimeDays` |
| Variant blocks and swatches | `product_variants` (`options`, `swatch`, `price` nullable) |
| Cross-sell and «اتاق را کامل کن» | `product_relations` (`related`, `bundle`, `upsell`) |
| Testimonials and real reviews | `reviews` (`featured`, `verifiedPurchase`, `status`, `childAge`, `city`) |
| Clusters, articles, product embeds | `topics` (the 9 clusters), `posts` (`tldr[]`, `format`, `isPillar`, `reviewerId`, age columns, `sources[]`, `readingMinutes`), `post_products` |
| People (E-E-A-T) | `authors` (`role`, `credentials[]`, `sameAs[]`, `avatarMediaId`) |
| Glossary | `glossary_terms` (`term`, `originalTerm`, `definition`, `body`, related slugs, `sameAs`) |
| FAQ drawers everywhere | `faqs` (`scope`: general, shipping, product, category, post or page, plus `scopeId`) |
| About, workshop, materials, facts, editorial policy | `pages` |
| «عکساتون» clothesline | `community_photos` |
| Hero, trust chips, installments, social, material layers, workshop steps, feature flags | `settings` (key → JSON) |
| Slug history | `redirects` |

**Additions this concept needs** (one Drizzle migration):

**Catalogue:**
- `categories.shape`: an enum of `tower`, `triangle`, `arch`, `hex`, `lip-rect`, `circle`, `square`, `wide` and `rainbow` (§2.3).
- `products.roomSlot`: where the piece stands in the room builder.
- `products.playIdeas`: JSON of `{ fromMonths, text }`, for «چطور با آن بازی کنیم؟».
- `products.grainSeed`: an optional override. The grain is otherwise seeded from `slug`.

**Media:**
- `product_media.role`: `cutout`, `hero`, `lifestyle`, `detail`, `illustration` or `video`.
- `product_media.frame`: `arch`, `mat`, `pin` or `shelf`.
- `media.consentAt` and `media.faceBlurred`, plus `community_photos.consentAt`. These are mandatory for any photo of a child.

**Reviews:**
- `reviews.highlight`: the phrase that gets the mustard mark.
- `reviews.consentAt`.

**Posts:**
- `posts.reviewedAt`.
- `posts.primaryQuery` and `posts.secondaryQueries[]`.
- `posts.intent`: `info`, `comm`, `trans` or `nav`.
- `posts.changeLog[]`, shown on the page as «تاریخچه‌ی به‌روزرسانی».
- Extend `status` with `review`, to match the content plan's draft → review → published flow.

**People and glossary:**
- `authors.knowsAbout[]`, `authors.jobTitle` and `authors.isPlaceholder`. Placeholder people are never rendered in production.
- `glossary_terms.group` (the 4 shelves) and `glossary_terms.synonyms[]` (spelling variants for search).
- `glossary_terms` also gets the `seo` column group, for `noindex` until a term meets the bar.

**New tables:**
- `age_ranges`: `slug`, label, `minMonths`, `maxMonths`, `question`, `shortAnswer`, `sortOrder`. Drives the ramp and `/age/{range}`.
- `room_presets` (slug, name, ageRange, description, `seo`) and `room_preset_items` (presetId, productId, variantId, slot, sortOrder).
- `events` and `web_vitals`: self-hosted analytics beacons.

**Search:** FTS5 virtual tables (`search_products`, `search_posts`, `search_terms`). They are created in a raw SQL migration and kept in sync with triggers. The normalizer runs before indexing.

**Phase-1 seed** (a real DB, not mocks; follows the content plan's wave 0):
- **Catalogue:** 9 categories (P1–P9), about 24 products with variants, 5 age ranges, 4 room presets and the `settings` rows.
- **Content:** 9 topics, the 10 seed posts with their FAQs and sources, and all 46 glossary terms.
- **People:** «تحریریه‌ی چوبز» as the default author. Placeholder experts are flagged `isPlaceholder`.
- **Placeholders:** placeholder reviews and community photos are seeded with `status = 'pending'` or a placeholder flag, and never render in production builds.

## Appendix B — Component map (planned layout)

- `src/app/fonts.ts` and `src/fonts/{estedad,ario,mikhak}/`, as in `docs/FONTS.md` §5.2–5.4.
- `src/components/ui/`:
  - `Ply` (piece), `Tray`, `PlyButton`, `PlyChip`, `ArchFrame`, `FeltBubble`, `Highlight` (mustard swash), `HexBadge`, `BeadDots`, `Media` (picture + loader).
  - `Groove` (input), `BeadToggle`, `Stepper`, `Drawer` (details), `Sheet` (dialog), `Price`, `Installments`, `Abacus`, `AgeRuler`, `PersianDate`, `StretchWord` (Mikhak `KSHD`).
- `src/components/home/`: `StackerHero` (+ `stacker-engine`, `postcard`), `ShapeSorter`, `PiklerRamp`, `FeaturedShelf`, `RoomBuilder` (+ engine), `SnappAbacus`, `PlyLayers`, `WorkshopConveyor`, `Clothesline`, `LibraryShelf`, `FaqDrawers`, `Community`.
- `src/components/shop/`: `ProductCard`, `FilterSheet`, `ChipRail`, `Gallery`, `VariantBlocks`, `HeightCompare`, `DimensionDrawing`, `WoodPassport`, `PlayIdeas`, `BuyBar`, `CartDrawer`.
- `src/components/mag/`:
  - `BookCover`, `Tldr`, `BeadToc`, `Callout` (tip, warning, workshop, expert), `MythFact`, `Checklist`, `AgeTable`, `CompareTable`, `Steps`, `KeyFacts`, `Timeline`, `Hotspots`, `AparatFacade`.
  - `ProductEmbed`, `GlossaryMark`, `Sources`, `AuthorBox`, `NextInPath`, `AskChoobz`, `MedicalNote`, `AlphabetBlocks`.
  - `MarkdownRenderer` (remark + directives → RSC).
- `src/components/illustrations/`: pure SVG-string functions (`plyPanel`, `plyEdge`, `grain`, `learningTower`, `piklerTriangle`, `piklerArch`, `swedishWall`, `bookshelf`, `paperRoll`, `tableChair`, `montessoriShelf`, `rainbowStacker`, `ardi`, `waldorfFigure`, `room`).
- `src/components/layout/`: `TopBar`, `BeadNav`, `ToyDrawerMenu`, `SearchDialog`, `ToyBoxFooter`, `DaypartScript`, `SoundToggle`, `JsonLd`.
- `src/lib/`:
  - `format.ts` (exists): `toFaDigits`, `formatToman`, `tomanToRial`, `installments`, `formatAgeRange`, `formatJalali` and `normalizeFa`, which gets extended for search.
  - `paths.ts` (exists): `UPLOAD_DIR`, `mediaUrl`.
  - `seo.ts`: graph builders.
  - `image-loader.ts`, `grain.ts`, `spring.ts`, `sound.ts`, `utils.ts`.
- `src/db/`: `schema.ts` and `index.ts` (exist: WAL, `DATABASE_PATH`), plus `seed.ts` and `queries/*` (all wrapped in `"use cache"` with `cacheTag`).

> **The judges' one-liner:** where other kids' brands *show* toys on a website, Choobz's website **is** one. Painted faces, raw ply edges, a ball that rolls through every age, and a room she builds herself, all in about 2 KB of eager JavaScript.
