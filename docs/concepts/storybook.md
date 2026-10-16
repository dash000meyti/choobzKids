# سفر اردک چوبی · Duck's Journey Storybook

**Art direction and UX concept for choobz.kids, Phase 1 (public front-end)**
Stack assumed: Next.js 16.4.2 (App Router, `cacheComponents` + `partialPrefetching`, as already set in `next.config.ts`), React 19.3, TypeScript, Tailwind CSS v4.3, Drizzle + better-sqlite3, one Docker volume at `/data`.
Revision 2: reconciled with the decisions already in the repo. Fonts follow `docs/FONTS.md` (Estedad, Ario, Mikhak). Routes follow `docs/CONTENT-PLAN.md` (`/mag`, `/age/{range}`, `/glossary`, `/team`). Data references use the real tables in `src/db/schema.ts`, and the few columns this concept adds are listed in Appendix A. Framework claims were checked against the Next.js 16.4 docs bundled in `node_modules/next/dist/docs/`.

> You don't browse this website. You **pull it along**, the way a toddler pulls a wooden duck on a string.

### Concept at a glance

- **The mascot is Tati (تاتی).** Tati is the duck on the pull-cart from the logo. Iranian parents say «تاتی تاتی» when a baby takes its first steps, and a pull-toy is the classic first-steps companion. The name carries the emotional idea of the whole site.
- **The site is a pop-up storybook in three chapters, taken from the bio: بازی (play), کشف (discover), رشد (grow).** It opens with «یکی بود، یکی نبود…» and closes with a twist on the traditional Persian story ending. The home page also covers **one day in a child's life**: dawn, morning play, a noon of questions, an afternoon of growing, and night in the footer.
- **The look is the "Plywood Picture-Book".** It takes the flat, cut-paper style of golden-era Iranian picture books (the Kanoon era that today's mothers grew up with) and builds it from the brand's real material: birch plywood with visible layers on the edges and CNC-rounded corners. **The landscape is made of the products.** Hills are Pikler arches, mountains are Pikler triangles, houses are learning towers, and the road is the drawing-paper roll.
- **The type is part of the toy.** Estedad's round dots look like wooden beads on Tati's string. Ario's chunky letters take a painted face and a raw ply edge, so headlines look CNC-cut. Mikhak's live kashida axis lets a handwritten word **stretch like a pulled string**, while the DOM text stays clean.
- **Tech stance:** no WebGL, no Lottie, no carousel or animation libraries on the critical path. The site uses server-rendered inline SVG, CSS scroll-driven animations, React 19.3 `<ViewTransition>`, the Popover API with `<dialog>`, and springs written in CSS `linear()`. Our own client JS on the home page stays at or below about 15 KB gz.

---

## 1. Big idea and emotional promise

Every Iranian mother between 25 and 40 has two memories that Choobz's products connect. The first is the picture books of her own childhood: flat hand-cut shapes, grainy printed paper, a limited and warm palette. The second is the moment someone sang «تاتی تاتی» as she stood up for the first time. **Duck's Journey** puts those two memories together on one page. The website is a pop-up storybook built from birch plywood, and its hero is the little wooden duck from the logo. Tati rolls out of the book's first page and rides along a red thread at the top of the screen for the rest of the visit. He leads the visitor through *play, discover, grow* until he reaches the last page, where the thread is tied in a bow at the door of the visitor's own home. The tone is calm, confident, crafted, and never guilt-driven. Many parenting brands sell anxiety. Choobz sells **readiness and joy**. The promise, in the brand's own voice:

> «لازم نیست مامانِ کاملی باشی. فقط کافیه دنیای بچه‌ت رو آماده کنی؛ ما کنارتیم تا اون دنیا رو با هم، از چوب بسازیم.»
> *(You don't have to be a perfect mother. You only need to prepare your child's world. We're beside you to build it together, out of wood.)*

Montessori calls this the *prepared environment* (محیط آماده). Each page of the site is a prepared environment for the visitor too: calm, orderly, everything in its place.

### Three signature moments, built to be screenshotted and shared

**1. «تاتی راه افتاد» (Tati sets off): the Pull**
The site opens on a pop-up book. Five plywood layers fold up from the page on a spring: dawn sky, cypress hills that are actually Pikler arches, a learning-tower house with a lit window, a pomegranate tree, and the drawing-paper roll unrolling into a road. Tati waits at the start of the road. His string runs off the side of the screen, as if a child's hand is just out of frame. When the visitor scrolls, the wheels turn and the paper sun rises. Tati then **hops out of the book onto the header's bottom border**, which becomes his thread. From there he rides across the screen as the reading-progress indicator on every page of the site, with his wheels turning at scroll speed. When the visitor taps "back to top" («برگرد به صفحهٔ اول»), Tati rolls backwards.
*Build:* CSS `animation-timeline: scroll(root)` on one fixed element. It runs on the compositor, needs zero JS, and is about 2 KB of SVG.

**2. «خط قد» (the height-mark door): the Growing Room**
Iranian families pencil their children's heights on a doorframe. Our version is a doorframe drawn on a straw-plaster (کاهگل) wall with marks handwritten in Mikhak: «۶ ماهگی · ۶۷ سانت», «۱ سالگی · ۷۵ سانت». The visitor taps their child's age, using the same five age ranges as the `/age/{range}` hubs. A child silhouette grows to that mark and **the Montessori room rebuilds itself around them** with a View Transition morph. At 10 months a Pikler triangle slides in. At 18 months a learning tower appears beside the kitchen counter. At 3 years the climbing wall goes up. Each piece links to its product, and an "everything for this age" link opens the matching age hub (`/age/1-2-years`). Mothers screenshot the room for "my baby is 10 months, look what she needs" posts.
*Build:* radio inputs with CSS `:has()`, which works with zero JS. About 0.5 KB of JS wraps each change in `document.startViewTransition`.

**3. «اسمش روی گاری» (the name on the cart): personalisation that spreads**
«اسم کوچولوت چیه؟» The visitor types "آیلین" and it is **wood-burned (pyrography) onto Tati's cart** in real time, in Mikhak, with a soft scorched edge and the wood grain showing through. Short names are stretched with Mikhak's `KSHD` axis so that every name fills the cart side the way a craftsman would letter it: «آیلین» gets a long, proud join, and nobody types a single kashida. One button creates a 1080×1920 Instagram/Bale story card on the device: «تاتیِ آیلین، آماده‌ی اولین قدم‌ها» with the @choobz.kids handle. The name never leaves the phone, and the site says so: «این اسم فقط روی گوشی خودت می‌مونه.» If the workshop can laser-engrave, this becomes a real paid product option, «حکاکی اسم کودک», on towers and shelves.
*Build:* an SVG `<text>` live preview, plus a Canvas 2D export loaded only when the visitor taps. That is about 4 KB of JS and an 80 KB story template fetched on demand. The export first awaits `document.fonts.load('600 64px "Mikhak"')`, because Mikhak is not preloaded. The card is shared with `navigator.share({ files })`, and a download link is the fallback.

**Bonus, «حالت لالایی» (Lullaby mode).** Iranian mothers browse late, after the kids are asleep. After 22:00 Tehran time, or whenever the phone is in dark mode, the site offers: «بچه خوابید؟ چراغ‌ها رو کم کنیم؟» The storybook then turns to night: an indigo sky, twinkling paper stars, a sleeping Tati, and product "stages" lit by a warm lamp glow. Even the footer at the end of the home page is night in normal mode, so the day closes naturally.

---

## 2. Visual language

### 2.1 Palette: twelve tokens with Persian names

Each token is named after something an Iranian mother can picture. One name is a pun: **زردچوبه** (turmeric) literally means "yellow wood".

| Token | Persian / meaning | Hex | Role | Contrast (WCAG 2.x) |
|---|---|---|---|---|
| `shir` | شیر · milk | `#FBF6EC` | Page background ("paper") | base |
| `kahgel` | کاهگل · straw-mud plaster | `#EFE3CF` | Walls, product stages, alternating sections | gerdu text **11.65:1** |
| `takhte` | تخته · birch face | `#E6CFA6` | Wood surfaces, bottom bar, Tati's body | gerdu text **9.74:1** |
| `asal` | عسل · honey ply edge | `#C8955A` | Ply strata, grain, decorative strokes | **2.47:1 on shir: never use for text** |
| `gerdu` | گردو · walnut | `#33251B` | Primary text, icons | **13.72:1** on shir |
| `gerdu-narm` | گردوی نرم · soft walnut | `#6B5545` | Secondary text, meta, captions | 6.48:1 shir · 5.50 kahgel · 5.58 nana |
| `anar` | انار · pomegranate | `#B23A26` | Primary CTA, Tati's thread and wheels, sale | white on anar **5.96:1** · anar on shir 5.53:1 |
| `zardchube` | زردچوبه · turmeric | `#F2B93B` | Highlighter marks, badges, the sun | gerdu on it **8.29:1** · **never white text** |
| `nana` | نعنا · mint | `#D7EBDA` | Speech bubbles, answer boxes, "noon" sections | gerdu 11.81:1 · anar 4.76:1 |
| `pesteh` | پسته · deep pistachio-sage | `#3E6A4C` | Sprouts, "in stock", installment lines, secondary buttons | white on it 6.23:1 · on shir 5.78:1 · on nana 4.98:1 |
| `firuzeh` | فیروزه · Persian turquoise | `#1F6E77` | Focus ring, info callouts, blueprint lines | 5.48:1 on shir · white on it 5.91:1 |
| `shab` | شب · night indigo | `#1B2040` | Lullaby theme background, footer night | mahtab text 12.99:1 |

**Derived, not core:** the ply strata are `#E9D3AC` (light layer), `asal`, and `#9C6B3A` (dark layer). The paper shadow is `rgb(51 37 27 / .18)`.

**Lullaby (bedtime) overrides.** Text uses `mahtab` (moonlight) `#F5E8C6` (12.99:1 on shab). The raised surface is `#262C55`, and mahtab on it is 10.95:1. Secondary text is `#B9A88A` (6.8:1). The CTA lifts to `#E5715A`, with shab text on it at 5.15:1. Pistachio becomes `#8FC7A0` (8.17:1) and turquoise becomes `#6FC1C9` (7.65:1). The wood stays `takhte` (10.43:1 against shab), as if the room were lamp-lit.

**Rules**
- Body text only ever uses `gerdu` or `gerdu-narm` on light tokens, or `mahtab` on night tokens. Coloured text is reserved for sizes of 19px bold or larger.
- **Links take the brand's Instagram highlighter, not a thin underline.** They get `background: linear-gradient(transparent 60%, color-mix(in oklab, var(--zardchube) 60%, transparent) 0)`. A thin underline collides with the dots below Persian letters such as ب، پ، ی. The highlighter shape (not colour alone) marks a link, which satisfies 1.4.1.
- Focus is a 3px `firuzeh` outline with a 2px `shir` offset. It shows on every surface, including anar buttons.
- **Day-cycle backgrounds on the home page:** dawn is shir fading to sky `#D6E9EF`, morning is shir/kahgel, noon is a nana tint, afternoon is a takhte/zardchube wash, dusk is a peach `color-mix`, and night is shab. Sections join on soft paper-torn seams (SVG masks), not hard lines.

### 2.2 Textures: real material, generated once

- **Wood grain:** a 512×512 seamless tile generated at build time by a deterministic noise script (sharp plus simplex noise, stretched 1:12 to imitate birch). It ships as AVIF (about 7 KB) with a WebP fallback, is applied with `background-blend-mode: multiply` at 18–30% on wood surfaces (bottom bar, buttons, shelf, Tati), and its direction follows each object's long axis.
- **Paper fibre:** a 256×256 tile (about 4 KB) on `shir`, at 6% opacity. It removes the "digital white" without anyone noticing it.
- **Riso misregistration:** each illustration carries a second-colour outline shifted 1.5px, at 35% opacity with `mix-blend-mode: multiply`. This is the overprint charm of 1970s Persian picture books. It is drawn in SVG and costs nothing.
- **Pencil marks:** hand-drawn sprouts, hearts, stars, and scribble underlines, as on their Instagram. They are a sprite of about 30 tiny SVG symbols, used sparingly, never more than one cluster per viewport.
- **Why no live `feTurbulence` on big areas:** the browser re-rasterises it on scroll and resize, and Safari and low-end Android pay for that. Static tiles are cached forever and stay sharp.

### 2.3 Shape vocabulary: five shapes taken from the products

| Shape | Origin | Use |
|---|---|---|
| **طاق (arch)** | The Pikler arch, and also the Persian *taagh* of Iranian architecture | Image and illustration masks for product and article cards; the page-header "shop window" |
| **دستگیره (hand-hole stadium)** | The stadium cut-outs in their towers and triangles | Buttons, pills, small window cut-outs that peek into the next section |
| **شش‌ضلعی (hexagon)** | The hexagonal climbing-hold panels | Age badges («۸ ماه+»), skill badges, filter chips for age |
| **لبهٔ چندلایی (ply edge)** | The visible plywood layers on every cut edge | The "extrusion" under cards, buttons, display type, and illustration shapes: 3–4 stacked strata of 1px each |
| **نخ و مهره (string and bead)** | Tati's pull-string | Progress thread, breadcrumbs, TOC, dividers, free-shipping meter, price-tag strings |

**Radii (CNC radius rule: nothing is sharp, because nothing in their workshop is):**
`--r-bead: 999px` · `--r-chip: 10px` · `--r-block: 16px` (buttons are "wooden blocks") · `--r-card: 24px` · `--r-scene: 40px` · `--r-arch: 999px 999px 24px 24px`.

**Elevation is physical, not glassy.** The "Paper" level is `0 1px 0 rgb(51 37 27/.06), 0 10px 24px -14px rgb(51 37 27/.28)`. The "Block" level uses ply strata `0 2px 0 #E9D3AC, 0 3px 0 var(--asal), 0 4px 0 #9C6B3A`. When a block is pressed, it moves down 2px and loses two strata over 90ms, like pushing a wooden button into its frame. The site has no glassmorphism and no neon gradients.

### 2.4 Iconography

- There are about 40 custom icons on a 24px grid with a 1.75px stroke, round caps and joins, and slightly wobbly "carpentry pencil" curves. Each has an optional 1px ply shadow.
- Every icon is a server component that returns inline SVG and is tree-shaken. The site has no icon font and no icon library in the bundle.
- **The skill icon set is part of the brand:** حرکتی درشت (gross motor: a climbing figure), حرکتی ظریف (fine motor: a pinch), تعادل (balance: a rocker), خلاقیت (creativity: a crayon), استقلال (independence: a step stool), زبان و کتاب (language and books: an open book), بازی نمادین (pretend play: a teacup).
- Icons mirror for RTL only when they are directional (arrows, "back"). The cart, Tati, and the clock never mirror.

### 2.5 Illustration style: the "Plywood Picture-Book" (کتاب مصورِ چندلایی)

**Six rules**
1. **Flat cut shapes.** No outlines on the shapes themselves, no gradients except sky and lamp glow, and no 3D rendering.
2. **Every shape is cut from plywood.** Each one shows the ply edge on its lower and outer sides, and every corner is rounded.
3. **Each scene uses at most five tokens,** plus kahgel or shir paper.
4. **Overprint charm:** riso misregistration and a paper-grain multiply.
5. **Pencil life:** sprouts, hearts, and "motion marks" drawn in a gerdu pencil stroke.
6. **Persian, not touristic.** The motifs are cypress (سرو), pomegranate (انار), pistachio, a goldfish bowl at Nowruz, and Yalda watermelon. There are no national or political symbols and no "Persian rug" clichés.

**The world is the catalog.** Every scenic element is a product in disguise: Pikler-arch hills, Pikler-triangle mountains, learning-tower houses, hex-hold stepping stones, a bookshelf village with front-facing covers, and the art paper roll as the road. On desktop, each element shows a tiny hanging tag on hover, «این تپه، آرک پیکلره!», and links to the product. On mobile, tapping the element shows the tag. The visitor is browsing the shop without knowing it.

**Tati character sheet** (one master SVG with poses as `<symbol>`s)
- Proportions follow the logo: a plump duck body (takhte with grain), an anar beak band, a gerdu dot eye, and a pesteh cart with four anar wheels on birch hubs. Tati always faces the reading direction (left, toward inline-end). If the logo faces right, the journey Tati is a mirrored *drawing*, never a flipped logo file.
- Poses: rolling (default) · waiting (the hero) · sleeping (Lullaby, with «خُرّ و پُف» Zs) · reading glasses (the Growth Notebook hub) · pencil behind the ear (workshop and "from the workshop" callouts) · carrying a parcel (shipping and cart) · looking under the shelf (empty search) · string slipped (404) · bow tie (gift mode at Yalda and Nowruz).
- **Restraint rule:** at most one Tati per viewport. He's a guide, not a sticker.

**The cast of people:** mothers both with and without hijab, fathers, and a grandmother (مادربزرگ, central to Iranian families). Children have round heads and no detailed faces: a dot-and-curve expression only. This is warm, inclusive, timeless, and avoids the uncanny. Hands are drawn often, because their Instagram is full of hands.

**Seasonal skins (CMS-driven, Phase 2 ready).** The `settings` row with key `season` can be `default`, `yalda`, `nowruz`, `mehr` (back to school), or `chaharshanbe`. It swaps a handful of hero props. For Yalda (only about nine weeks from now), Tati wears a scarf, a pomegranate rolls beside him, there's a watermelon slice, and a «کادوی شب یلدا» gift-guide CTA appears. For Nowruz, there's a goldfish bowl on the cart, sabzeh sprouts, and a هفت‌سین on the shelf. Each skin is about 3 KB of extra SVG and is fully server-rendered.

**Product illustrations: a parametric system, because there are no photos yet**
- Each product type is a React server component in `src/components/illustrations/products/`. Examples: `<PiklerTriangle finish="natural" size="m" ramp="double" folded={false}/>`, `<LearningTower platformLevel={2}/>`, `<WallBars panels={["hex","hex","rope"]}/>`.
- Each product row already stores an `illustration` key (`products.illustration`, and the same column on `categories`, `topics`, `posts`, and `community_photos`). This concept adds one JSON column, `illustration_props`, for the drawing's parameters. A variant's finish comes from the existing `product_variants.options` (for example `{ "رنگ": "سفید" }`) and `swatch` columns, which map to fill tokens. **Switching variants swaps fills instantly with no image request.**
- Fills are CSS custom properties (`--face`, `--edge-1..3`, `--paint`). Grids and room scenes use a cached external sprite: `<svg><use href="/illustrations/products.svg#pikler-triangle"/></svg>`. Custom properties inherit into the `<use>` shadow tree, so the same cached sprite renders every finish. One request is reused across the whole site.
- **One drawing standard:** a storybook 3/4 front view, a 15° tilt, light from the upper right (the RTL start side), and a soft elliptical floor shadow. Products are drawn **accurately**, with the true number of rungs and true proportions from `width/depth/height_cm`, so the illustration never over-promises.

**Built to live with photos later: the Stage**
Every product visual, whether illustration or photo, sits on the same **Stage**: a 4:5 kahgel panel with an arch top, a floor-shadow ellipse, and a paper-grain overlay. A new `media.kind` column decides the treatment. A product with no `product_media` rows falls back to its `illustration` key, so the seed works on day one with zero photos:
- `illustration`: SVG on the stage.
- `cutout`: a background-removed photo (WebP/AVIF with alpha) placed on the stage with a real contact shadow. Grids look exactly like the illustrated version, only real.
- `photo`: a lifestyle photo fills the arch mask, with a 6px shir paper frame and a tiny tape corner.
Grids prefer `illustration` or `cutout` for consistency, and the lifestyle `photo` is the second slide or the hover image. The illustrated identity therefore never goes away. Real photos complete it.

### 2.6 Photography direction (for the CMS phase)

- **Light:** daylight at 4800–5200K from a window on the upper right, matching the illustrations. Never flash, never cool-blue.
- **Place:** real Iranian homes with cream or kahgel walls, Persian rugs at the edge of the frame (never centred), plants, natural wood floors. One clutter-free zone per shot, in the spirit of Montessori.
- **Height:** shoot at the child's eye level (70–90cm). The child's world is the subject.
- **Hands and feet storytelling:** a small hand on the tower rail, socks on a Pikler rung, a mother's hand (ring, sleeve, sometimes the edge of a hijab) steadying. Faces are optional and only appear with written consent. This also respects families' privacy preferences.
- **Product truth shots for every SKU:** (1) a cutout on seamless kahgel paper at 4:5, shadow kept; (2) a macro of the ply edge and rounded corner; (3) the product folded or adjusted; (4) a lifestyle shot in use; (5) a scale shot with a child, or a 1m wooden ruler if no child is in frame.
- **Grade:** lifted blacks, warm mids, and gently desaturated greens, so a photo never out-shouts the illustrated palette.
- **Pipeline:** upload to `UPLOAD_DIR/originals/` (`/data/uploads` in production, see `src/lib/paths.ts`). Sharp then generates AVIF and WebP at 320/480/640/960/1280/1600 widths and strips EXIF. It fills the existing `media.blurDataUrl` (a 16px LQIP under 300 bytes) and `media.dominantColor` columns. Everything is stored in the same volume and served by the existing `/media/[...path]` route with immutable caching.

---

## 3. Typography

### 3.1 Roles

The faces are the verified selection in `docs/FONTS.md`: all OFL, all self-hosted from `src/fonts/`, 95.8 KiB in total, of which 69.5 KiB is preloaded.

| Role | Typeface | Why it fits *this* concept | File / size |
|---|---|---|---|
| **Display** (hero line, chapter titles, big numbers) | **Ario, "Dots 1"** (v2.0.1) | Chunky and warm, with merged "carved" dots that already look hand-cut. With the ply-edge treatment the letters look **CNC-cut from painted plywood**, which ties straight to the Kanoon-era picture-book nostalgia. Its swash ک/گ (`ss02`) is saved for the hero line and chapter titles. It is new, so almost no Iranian site uses it yet. | `ario/ario-dots1-fa.woff2`, 19.0 KiB, preloaded |
| **Body and UI** | **Estedad** variable, `wght` 100–900, with `ss01` "Arabic Round Dots" on (v8.5) | A very readable monoline Persian sans built on the same skeleton as Ario, so the pair harmonises. **The round dots are wooden beads**: the bead motif of Tati's pull-string lives inside every paragraph. | `estedad/estedad-fa-wght.woff2`, 50.5 KiB, preloaded |
| **Accent / storyteller** (pencil marks on the door, sticky notes, price tags, marginalia, Tati's speech bubbles, the name on the cart) | **Mikhak** at wght 600, dot style 1, with the **`KSHD` kashida axis kept live (100–200)** | A friendly semi-handwritten face by Estedad's designer. Its kashida axis is our signature micro-interaction: a handwritten word **stretches like a string being pulled**, with clean DOM text. | `mikhak/mikhak-fa-600-kshd.woff2`, 26.3 KiB, **not** preloaded |
| **Lettering** (three phrases only) | **Hand-lettered SVG** (commissioned, loose brush Naskh with a Nastaliq flavour) | «یکی بود، یکی نبود…», «قصهٔ ما به سر رسید…», «شب‌بخیر». These are the storybook's opening, closing and bedtime lines, and they deserve a human hand. | 1.5–4 KB each, inline, `aria-hidden` with real text beside |
| Latin | none | Estedad and Ario include good Latin and 0–9. The **CHOOBZ wordmark is an inline SVG** (0 font bytes). | — |

**Rules carried over from `docs/FONTS.md`:** set `font-synthesis: none`, because Ario's single file is weight 400 but looks black, and `font-bold` would otherwise produce faux bold. Set features on elements, never in `@font-face`. Remember that `font-feature-settings` does not merge, so a child restates the parent's list (`"ss01", "tnum"`). Never put `"wght"` in `font-variation-settings` (use `font-weight`). On Mikhak, set only `"KSHD"`.

**Ply type (painted face, raw edge).** Ario display letters take a painted face in `anar`, `pesteh`, or `gerdu`, never a pale wood face, which would fail contrast. Under the face they show raw birch strata: `text-shadow: 0 1px 0 #E9D3AC, 0 2px 0 var(--asal), 0 3px 0 #E9D3AC, 0 4px 0 #9C6B3A, 0 12px 20px rgb(51 37 27/.16)`. This is exactly how their painted products look: a coloured face with a natural ply edge. Use it only at 40px and above, and only once per viewport. The strata sit below the baseline, so give the element `padding-block-end: .12em`, so the shadow never collides with the next line's dots.

**The kashida pull («کِش»).** Mikhak's `KSHD` axis rests at 120, stretches to 200, and springs back on the *settle* spring, in four places only: Tati's name tag when he is tapped, the pencil mark you just chose on the height door, the name on the cart, and the word «رسید» in the closing line as Tati arrives. Each is a short, fixed-size inline-block with `contain: layout`, because animating `font-variation-settings` re-lays-out the text on every frame. It never runs on an INP-critical path, and with reduced motion it stays at rest.

### 3.2 Fluid scale (360px → 1440px)

```css
--step--2: clamp(0.75rem, 0.7292rem + 0.0926vw, 0.8125rem);  /* 12→13   micro, legal */
--step--1: clamp(0.8438rem, 0.8229rem + 0.0926vw, 0.9063rem);/* 13.5→14.5 captions, meta */
--step-0:  clamp(1.0625rem, 1.0208rem + 0.1852vw, 1.1875rem);/* 17→19   body */
--step-1:  clamp(1.2188rem, 1.1458rem + 0.3241vw, 1.4375rem);/* 19.5→23 lead, card titles */
--step-2:  clamp(1.4375rem, 1.2917rem + 0.6481vw, 1.875rem); /* 23→30   H3 */
--step-3:  clamp(1.75rem, 1.5rem + 1.1111vw, 2.5rem);        /* 28→40   H2 (content) */
--step-4:  clamp(2.125rem, 1.6667rem + 2.037vw, 3.5rem);     /* 34→56   H2 (home chapters) */
--step-5:  clamp(2.625rem, 1.8333rem + 3.5185vw, 5rem);      /* 42→80   page H1 */
--step-6:  clamp(3.25rem, 2rem + 5.5556vw, 7rem);            /* 52→112  hero display line */
```
Each step has a rem term, so the scale still follows the user's zoom (WCAG 1.4.4).

### 3.3 Persian specifics (non-negotiable)

- `<html lang="fa" dir="rtl">` is mandatory (per `docs/FONTS.md` §7.1). It selects the Persian `locl` forms such as ۴ ۵ ۶, a Persian screen-reader voice, and the language signal that answer engines read. English islands get `<span lang="en" dir="ltr">`. Use **logical properties only** (`ps-*`, `me-*`, `start-*`, `inset-inline-*`, `border-s`). Stylelint bans `left` and `right` in component CSS.
- **No letter-spacing, ever,** because it breaks the joins. Stylelint bans `tracking-*` in fa contexts. Also no `text-transform`, and **no italics** (Persian has none). Emphasis comes from weight 700 or the zardchube highlighter.
- **Line height is always explicit, never `normal`:** body 1.85 (article 2.0), UI and cards 1.6, H2/H3 1.35, Ario display 1.25 (never below 1.2, or the dots of ک/گ/ی collide across lines), Mikhak notes 1.55, and kids' reading text with harakat ≥ 2.0. Persian needs room for the tall کـ/گـ and the dot clusters, and Mac and Windows line boxes differ (Mikhak is 1.66 vs 1.95), so explicit values remove both cross-platform drift and swap-time CLS. **Measure:** article columns are 36–38rem, about 60–70 Persian characters per line.
- `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs, which removes orphan words such as a lone «را». **Never `text-align: justify`**, because kashida stretching looks broken on mobile.
- **Text normalisation on write** (seed now, CMS later), extending the existing `normalizeFa()` in `src/lib/format.ts`: convert ي→ی and ك→ک, convert Arabic and Latin digits to Persian in prose, fold repeated ZWNJ (half-space) in words like «می‌شود»، «اسباب‌بازی»، «بچه‌ها», strip tatweel «ـ» (decorative stretch comes from Mikhak's axis, never from typed kashida), and convert straight quotes to «گیومه».
- **Punctuation:** use Persian «،» «؛» «؟» and «» guillemets.
- **Bidi:** wrap SKUs, Latin brand names, emails, and URLs in `<bdi>` or `dir="ltr"`. Phone numbers render in Persian digits inside an LTR span: «<span dir="ltr">۰۹۱۲ ۳۴۵ ۶۷۸۹</span>».

### 3.4 Numerals, money, dates

- **Persian digits everywhere a human reads, converted in code** (font-independent, so it also works in Mikhak, which has no digit feature). The helpers already exist in `src/lib/format.ts`: `toFaDigits()`, `formatNumber()` (Persian group separator «٬» U+066C), and `formatToman()` → «۳٬۴۵۰٬۰۰۰ تومان». Use `font-variant-numeric: tabular-nums` only in the cart, totals, steppers, and the installment wheels; it looks wrong on inline prices.
- **Toman in the UI, IRR in machine data.** Prices are stored as INTEGER Toman (`products.price`, `product_variants.price`). JSON-LD emits `priceCurrency: "IRR"` with `tomanToRial()` (× 10), because "Toman" is not an ISO currency. The visible price is wrapped as `<data value="3450000">۳٬۴۵۰٬۰۰۰ تومان</data>`. Feeds use Latin digits.
- **Installments** use the existing `installments(total, 4)`, which rounds each payment up to the nearest 1,000 Toman: ۳٬۴۵۰٬۰۰۰ becomes four wheels of «۸۶۳٬۰۰۰ تومان». The fine print says «مبلغ دقیق اقساط در اسنپ‌پی نمایش داده می‌شود».
- **Ages** use `formatAgeRange()`: (8, 48) → «۸ ماه تا ۴ سال».
- **Dates are Jalali:** `formatJalali()` gives «۲۴ مهر ۱۴۰۵» (Tehran time zone), always inside `<time datetime="2026-10-16">`. The copyright line reads «© ۱۴۰۵».

---

## 4. Home page blueprint: one day, three chapters

| # | Section | Time of day | Primary data |
|---|---|---|---|
| 1 | Cover: «یکی بود، یکی نبود…» | dawn | `settings`: `season`, `tati_captions` |
| 2 | Toy shelf (categories) | morning · Ch.1 بازی | `categories` (`illustration`, `accent`, `sortOrder`) with published product counts |
| 3 | The height-mark door (age finder) | morning | `products` by `ageMinMonths`/`ageMaxMonths`, `settings.age_stages` |
| 4 | The pull-train (featured) | morning | `products.featured`, `product_variants`, `installments()` |
| 5 | Mothers' questions (answer cards) | noon · Ch.2 کشف | `posts` (`featured`, `format='answer'`) and `quick_answer` |
| 6 | The Growth Notebook (magazine) | noon | `posts` (latest 3 + one `isPillar`), `authors`, `topics` |
| 7 | The workshop (from plank to room) | afternoon · Ch.3 رشد | `pages` (slug `workshop`), `media` |
| 8 | Why wood, layer by layer | afternoon | `settings.safety_points`, plus `products.material`/`finish`/`maxLoadKg` |
| 9 | The fridge door (UGC and reviews) | late afternoon | `community_photos` (consented), `reviews` (`featured`, `status='approved'`) |
| 10 | Four wheels, four installments, plus trust | dusk | `settings`: `installments`, `trust_badges`, `enamad` |
| 11 | FAQ | dusk | `faqs` (`scope='general'`, `featured`) |
| 12 | The End: «…اردکه به خونه‌تون رسید!» and community | night | `settings.socials` (Bale, Instagram) |

Global rules: **every section has a decorative kicker** (Mikhak, or one of the three hand-lettered phrases) **and a plain, keyword-bearing H2** in Ario. The poetry is for the eye and the H2 is for search and answer engines. Every section below the fold uses `content-visibility: auto; contain-intrinsic-size: auto 900px`. A skip link «رد شدن از قصه، مستقیم به فروشگاه» sits at the top for visitors on a mission.

### 4.1 Cover: «یکی بود، یکی نبود…»
- **Layout, mobile:** the top 45% is the dawn sky with text, and the bottom 55% is the pop-up scene. The lettered «یکی بود، یکی نبود…» floats at the top as an SVG. The H1 and sub sit below it, with two CTAs in the thumb zone. A proof strip sits under the CTAs. Height is `min(100svh, 780px)`.
- **Layout, desktop (≥1024):** an open-book **spread**. The right page (start) holds the text, and the left page holds the scene. A subtle centre gutter shadow and a sewn-binding stitch (a dashed anar line) run down the middle. The scene bleeds off the left edge.
- **Copy**
  - Lettering (aria-hidden): «یکی بود، یکی نبود…»
  - **H1:** `<span class="kicker">اسباب‌بازی و سیسمونی چوبی مونته‌سوری</span>` and `<span class="display">یه دنیای چوبی، برای بچه‌های سرزمینمون</span>`
  - Sub: «برج یادگیری، مثلث پیکلر، دیوار صعود و کلی بازیِ دیگه؛ همه با دست و دل، توی کارگاه خودمون ساخته می‌شن. الهام‌گرفته از مونته‌سوری و والدورف.»
  - CTAs: **«بریم فروشگاه»** (anar wood block) · «برای سنِ بچه‌م چی خوبه؟» (outline, scrolls to §3)
  - Proof strip: «۴ قسط با اسنپ‌پی · ارسال به همهٔ ایران · ۵۰ هزار همراه در اینستاگرام»
  - When the visitor taps Tati, his Mikhak name tag stretches (the kashida pull) and a mint bubble shows a rotating caption from `settings.tati_captions`, in their Instagram's voice: «سلام! من تاتی‌ام. هرجا قدم برداری، دنبالت میام.» / «دختر داشتن یعنی یه نفر همیشه کفش‌هات رو امتحان می‌کنه.»
- **Motion:** on first paint, the 5 layers stand up from flat (`rotateX(84deg)` → `0`, `transform-origin: bottom`) with a stagger of 0/70/140/210/280ms on the *settle* spring. **The H1 is never animated:** it is visible at first paint and is the LCP element. On scroll (`view()` timeline on the hero), the layers parallax at 0.1–0.4, the paper sun rises 40px, and Tati rolls and then hops to the header thread (see Appendix C). Tati blinks every 7s (pure CSS). With reduced motion, the scene is static and standing.
- **Data:** the season skin (`settings.season`) and `settings.tati_captions` (12 lines, server-picked, rotated on the client).
- **SEO:** the H1 carries the head term. The scene's product hotspots are real `<a>` links with Persian `aria-label`s («آرک پیکلر»), which gives internal links from the strongest page.

### 4.2 Chapter 1 · بازی: the toy shelf (categories)
- **Layout:** one long **low Montessori shelf** (the product itself) drawn in plywood, with each cubby holding a category illustration and label. Mobile is a horizontal scroll-snap shelf with 2.3 cubbies visible; the shelf's ply edge runs continuously and the end cubby shows the "full room setups". Desktop is a 2-row × 5-cubby shelf, centred, with a pencil sprout on top.
- **Copy:** kicker «فصل یکم · بازی» · **H2:** «قفسهٔ بازی؛ همهٔ وسایل چوبی، سرِ جای خودشون» · Sub: «توی مونته‌سوری هر وسیله یه جای مشخص داره. قفسه رو بگرد و دنیای بازیِ بچه‌ت رو انتخاب کن.»
  Cubbies: «برج یادگیری» «آرک و راکر پیکلر» «مثلث پیکلر و سرسره» «دیوار صعود و نردبان سوئدی» «کتابخانهٔ روبه‌رو» «رول نقاشی دیواری» «میز و صندلی» «قفسهٔ مونته‌سوری» «اسباب‌بازی چوبی» «چیدمان کامل اتاق»
- **Motion:** as each cubby enters the viewport, its object drops 12px into place with the *settle* spring and a 1° wobble (`animation-timeline: view(); animation-range: entry 10% cover 30%`). A tap presses the cubby 2px, like pushing a block.
- **Data:** `categories` (`name`, `slug`, `tagline`, `illustration`, `accent`, `sortOrder`) with a count of published products. Cubby links go to `/shop/{slug}` (for example `/shop/pikler-triangle`), as in the content plan.
- **SEO:** a `<nav aria-label="دسته‌بندی‌ها">` with descriptive link text, plus an `ItemList` JSON-LD of the categories.

### 4.3 The height-mark door (signature #2, the age finder)
- **Layout, mobile:** the scene comes first (4:5) and shows the kahgel wall, the doorframe with pencil marks, the room, and the child silhouette. Directly below it, in the thumb zone, is a horizontal rail of **hexagonal age chips**. Below that are a milestone line and a 3-item product mini-list, then the CTA. It is **not pinned on mobile**, so there's no scroll trap. **Desktop:** a spread with the sticky door-and-room scene on the right page and the chips, milestone, and product list on the left page (the section is at most 140vh).
- **Copy:** **H2:** «بچه‌ت چند وقتشه؟ اتاقش رو با هم بچینیم» · Sub: «سن رو انتخاب کن؛ اتاق خودش عوض می‌شه و وسایلی که برای این مرحله از رشد ساخته شدن، سرِ جاشون می‌شینن.»
  Chips (the same five ranges as the `/age/{range}` hubs in the content plan): «۰ تا ۶ ماه» «۶ تا ۱۲ ماه» «۱ تا ۲ سال» «۲ تا ۳ سال» «۳ تا ۶ سال»
  Door marks, in Mikhak pencil (WHO median heights, rounded, labelled «میانگین»): «۶ ماهگی · ۶۷ سانت» · «۱ سالگی · ۷۵ سانت» · «۲ سالگی · ۸۶ سانت» · «۳ سالگی · ۹۶ سانت» · «۶ سالگی · ۱۱۶ سانت»
  Milestones:
  - ۰ تا ۶ ماه: «دنیا رو از پایین نگاه می‌کنه؛ آینه، قفسهٔ کوتاه و چند اسباب‌بازیِ ساده کافیه.»
  - ۶ تا ۱۲ ماه: «وقتِ بالا کشیدن و ایستادنه؛ مثلث پیکلر بهترین رفیقشه.»
  - ۱ تا ۲ سال: «می‌خواد کمکت کنه! برج یادگیری می‌برتش کنار کابینت آشپزخونه.»
  - ۲ تا ۳ سال: «کتابش رو خودش انتخاب می‌کنه؛ کتابخانهٔ روبه‌رو جلدها رو نشونش می‌ده.»
  - ۳ تا ۶ سال: «انرژی‌ش تمومی نداره؛ دیوار صعود، میزِ خودش و رول نقاشیِ خودش.»
  CTA: «همهٔ وسایل و راهنماهای ۱ تا ۲ سالگی ←» (links to `/age/1-2-years`)
- **Motion:** the chips are radio inputs. CSS `:has(#age-1-2-years:checked)` reveals that age's product layers and scales the silhouette with `--h` set on the server. With JS, a 0.5 KB enhancer wraps the change in `document.startViewTransition`, so the room **morphs**: products carry a `view-transition-name`, slide in from the floor and settle, the pencil mark at the new height is "drawn" with `stroke-dashoffset`, and its Mikhak label does the kashida pull. The choice is reflected as `?age=` with `history.replaceState` so the room can be shared. The page stays fully static: the server never reads `searchParams` here, and a 100-byte inline script checks the right radio from `location.search` before first paint.
- **Data:** `settings.age_stages` (key, label, months range, median height, milestone copy; five entries, editable in Phase 2) and `products` matched by `ageMinMonths`/`ageMaxMonths` (3 per stage, pre-rendered for every stage, about 2 KB of HTML each).
- **SEO and AEO:** every stage's milestone and product list is server-rendered HTML, so crawlers see all five. Each stage links to its `/age/{range}` hub, which answers queries like "best wooden toys for 18 months" with products and guides together.

### 4.4 The pull-train (featured products)
- **Layout:** a horizontal scroll-snap row where **each product card is a wagon** on four little wheels. The wagons are linked by Tati's string, with Tati leading at the start. Mobile shows 1.4 cards. Desktop shows 4 cards with arrow "pull" buttons, which are real `<button>`s that call `scrollBy`.
- **Copy:** **H2:** «محبوب‌ترین‌های خونه‌ها» · Sub: «همون‌هایی که توی عکس‌هاتون بیشتر از همه دیدیم.»
- **Motion:** the wheels rotate with horizontal scroll (`animation-timeline: scroll(nearest inline)`), at zero JS. Cards lean 2° in the direction of travel at scroll velocity. This is an optional 0.6 KB enhancer; without it they stay upright.
- **Data:** `products` where `featured=1 AND status='published'`, ordered by `sortOrder`, with the price (or the cheapest `product_variants.price`), `formatAgeRange()`, and `installments()` computed on the server.
- **SEO:** an `ItemList` of `Product` URLs. Prices are in HTML text, not images.

### 4.5 Chapter 2 · کشف: mothers' questions (the AEO showcase)
- **Layout:** illustrated mothers' silhouettes, each with a **mint speech bubble** in their Instagram style holding a question. Tapping opens the answer inside the bubble with a native `<details>`, so the content is in the DOM and indexable. Mobile is a vertical stack of 4 bubbles. Desktop is a staggered "conversation" across the spread.
- **Copy:** kicker «فصل دوم · کشف» · **H2:** «سؤال‌هایی که مامان‌ها هر روز از ما می‌پرسن»
  - «مثلث پیکلر از چند ماهگی مناسبه؟» Answer: «معمولاً از حدود ۸ تا ۱۰ ماهگی، وقتی کودک چهاردست‌وپا می‌رود و خودش را بالا می‌کشد. با اضافه‌کردن رمپ و سرسره، تا حدود ۴ سالگی هم کاربرد دارد.» Link: «راهنمای کامل مثلث پیکلر»
  - «برج یادگیری با چهارپایهٔ معمولی چه فرقی دارد؟» Answer: «برج یادگیری دورتادور نرده دارد و ارتفاع سکویش قابل تنظیم است؛ بنابراین کودک بدون خطر افتادن، هم‌قدِ کابینت می‌ایستد و در کارهای روزمره مشارکت می‌کند.»
  - «مونته‌سوری و والدورف چه تفاوتی دارند؟» Answer: «مونته‌سوری بر استقلال و وسایل واقعی و هم‌اندازهٔ کودک تأکید دارد؛ والدورف بر تخیل، ریتم روزانه و مواد طبیعی. اسباب‌بازی‌های چوبیِ ساده در هر دو رویکرد جای ویژه‌ای دارند.»
  - CTA: «همهٔ پرسش‌ها در دفترچهٔ رشد»
- **Motion:** each bubble "pops" with a 4% overshoot when it enters. The answer opens by height using `interpolate-size: allow-keywords` where supported and opens instantly elsewhere.
- **Data:** `posts` where `featured=1` and `format='answer'` (a value this concept adds to the `format` union), using the new `quick_answer` column (40–60 words; it falls back to `excerpt`) and the canonical `/mag/{slug}` URL.
- **AEO/GEO:** these are self-contained, question-shaped, answer-first passages that link to the full canonical answer page. The home page *does not* emit FAQPage for these, because they are cross-linked teasers. The canonical article carries the markup.

### 4.6 The Growth Notebook (دفترچهٔ رشد, the magazine teaser)
- **Layout:** a kraft-paper notebook cover with an elastic band holds one **pillar guide** (a large arch card) and 3 recent articles (smaller arch cards with washi-tape corners). Coloured **index tabs** on the notebook's edge are the age stages, and each one links to its `/age/{range}` hub. The tab colours are the fixed age colours from the content plan's age badge.
- **Copy:** **H2:** «دفترچهٔ رشد؛ راهنمای بازی و رشد کودک، سن به سن» · Sub: «نوشته‌شده با همراهی مربی‌های مونته‌سوری و کاردرمانگرهای کودک.» (shown only once real reviewers exist)
- **Motion:** the notebook cover opens on entry with a 12° `rotateY` hinge from the binding side. The tabs slide out 6px on hover or focus.
- **Data:** `posts` (latest 3 published, plus one `isPillar=1` post), `authors` (avatar, name, role), `readingMinutes`, and age tags from `ageMinMonths`/`ageMaxMonths`.
- **SEO:** real `<article>` cards with `<time>` and the author name. This passes authority from the home page to the pillar pages.

### 4.7 Chapter 3 · رشد: the workshop, from plank to room
- **Layout:** a vertical "assembly line" of 5 steps. On mobile, each step is a full-width card with a sticky step number; on desktop, the steps alternate across the spread. One **birch plank illustration moves through every step**: it is chosen, CNC-cut (a dotted toolpath draws itself), sanded (dust motes), oiled (a sheen sweep), and boxed (twine bow). Real workshop photos and a 6-second muted loop replace or complement the drawings later.
- **Copy:** kicker «فصل سوم · رشد» · **H2:** «از تخته تا اتاقِ بچه‌ت: یه سر به کارگاه چوبز بزن»
  Steps: «۱. انتخاب تختهٔ چندلایی» · «۲. برش دقیق با CNC» · «۳. سنباده، تا نرمیِ دستِ بچه» · «۴. روغن و رنگِ ایمن برای کودک» · «۵. بسته‌بندی با حوصله و ارسال»
  Founder pull-quote (to be confirmed with the brand): «هر وسیله رو اول برای بچه‌های خودمون ساختیم.»
  Rubber stamp (anar, rotated −6°): «ساخت کارگاه چوبز»
- **Motion:** the CNC toolpath is a `stroke-dashoffset` driven by `view()`. A sheen gradient sweeps along the plank on step 4. The video, when present, uses `preload="none"`, starts via IntersectionObserver only when visible and when `Save-Data` is off, and shows a poster otherwise.
- **Data:** `pages` (slug `workshop`; its Markdown `body` carries the five steps as H3s) and `media` (photo or video kind), editable in Phase 2.
- **GEO:** concrete, quotable facts (city, process, materials) feed the `/about/facts` page and the Organization schema.

### 4.8 Why wood, layer by layer
- **Layout:** a giant **cross-section of plywood** spans the width. Each layer (strata in the ply palette) is labelled with one benefit. Scrolling reveals the layers one by one: «ورق به ورق، لایه به لایه».
- **Copy:** **H2:** «چرا چوب؟ چون بچه‌ها لمس می‌کنن، گاز می‌گیرن و باهاش بزرگ می‌شن»
  Layers: «لبه‌های گرد؛ بدون هیچ گوشهٔ تیز» · «رنگ و روغن پایهٔ آب، مناسب کودک» · «پیچ‌های پنهان؛ بدون قطعهٔ ریز و جداشدنی» · «ساختار محکم؛ تست‌شده با وزنِ چند برابرِ کودک» · «ساخت ایران؛ قابل تعمیر، ماندگار برای بچهٔ بعدی»
  (Each claim maps to a verifiable `settings.safety_points` entry or a product's `specs`, `material`, `finish`, or `maxLoadKg`. Nothing ships unverified.)
- **Motion:** each layer slides out 8px toward the reading direction as it enters, staggered.
- **Data:** `settings.safety_points`, with links to the safety guide `/mag/wooden-toy-safety-guide`.

### 4.9 The fridge door (UGC and testimonials)
- **Layout:** a cream fridge door drawn in SVG, with customer **photos as polaroids** held by fruit magnets (pomegranate, pistachio, quince) and children's crayon drawings. **Testimonials are sticky-note bubbles.** Mobile is a horizontal snap row of polaroids, then a stack of notes. Desktop is a collage on the right page with notes on the left.
- **Copy:** **H2:** «عکساتون، دلگرمیِ ما» · Sub: «عکس بچه‌ها با وسایل چوبز رو با هشتگ #چوبز_کیدز یا توی کانال بله برامون بفرستید؛ شاید عکس بعدیِ این یخچال مال شما باشه.» Notes are real customer quotes only, with first name, city, and child age: «سارا، اصفهان، مامانِ یه پسر ۲ ساله».
- **Motion:** polaroids tilt randomly by ±3° (seeded on the server so there's no hydration mismatch). On hover or focus a polaroid straightens and lifts.
- **Data:** `community_photos` (requires the new `consent_at` column; `media_id` or, in the seed, an `illustration` drawn as a crayon picture), `reviews` where `featured=1 AND status='approved'` (`authorName`, `city`, `childAge`), and the linked `productId` for a «دیدنِ محصول» link. Sticky notes are set in Mikhak.
- **Integrity:** no fabricated reviews, ever. The seed uses clearly fake "نمونه" entries **only in dev**, and production renders the section only when real rows exist. AggregateRating appears only with real reviews.

### 4.10 Four wheels, four installments, and trust
- **Layout:** Tati's cart is drawn large, and **each of the four wheels is an installment**, labelled «امروز» and the next three Jalali months, with amounts under each. A sample product price selector (3 price chips) recalculates the wheels. Beside it is a **shipping crate** with trust "stickers": the eNamad slot, the SnappPay mark, «ارسال امن به سراسر ایران», «ضمانت بازگشت کالا», «پشتیبانی واقعی، از خودِ کارگاه».
- **Copy:** **H2:** «۴ قسط، به تعداد ۴ چرخِ تاتی» · Sub: «با اسنپ‌پی همین امروز سفارش بدید و مبلغ رو در ۴ قسط پرداخت کنید.» Fine print: «طبق شرایط اسنپ‌پی».
- **Motion:** the wheels spin and settle when the price changes. It's CSS-only: the price chips are radios and each wheel has server-rendered values for each chip.
- **Data:** `settings.installments` (`{ provider:'snapppay', count:4, interval_days:30, first_at_checkout:true }`), `settings.trust_badges`, and `settings.enamad`. Wheel amounts come from `installments()` in `src/lib/format.ts`.
- **Note:** the eNamad seal must be the official `trustseal.enamad.ir` image and link with `referrerpolicy="origin"`, which eNamad checks. It's lazy-loaded, sits in a fixed-size slot so CLS is zero, and is placed here and in the footer only.

### 4.11 FAQ
- **Layout:** a dusk-tinted section with `<details>` rows. The marker is a sprout that grows into a leaf when open (CSS). Mobile is full width. Desktop is a 2-column spread.
- **Copy:** **H2:** «پرسش‌های پرتکرار» · «ارسال چند روز طول می‌کشد؟» «وسایل نیاز به نصب دارند؟» «خرید قسطی با اسنپ‌پی چطور است؟» «اگر بسته آسیب‌دیده برسد چه می‌شود؟» «رنگ‌ها برای کودک ایمن‌اند؟» «می‌شود حضوری از کارگاه خرید کرد؟»
- **Data:** `faqs` where `scope IN ('general','shipping')` and the new `featured` flag is set, ordered by `sortOrder`. The full list lives on `/faq`.
- **Schema:** `FAQPage` JSON-LD that mirrors the visible Q&A exactly. Google limits FAQ rich results to authoritative sites, but the markup still gives answer engines clean question/answer pairs.

### 4.12 The End: «قصهٔ ما به سر رسید…»
- **Layout:** night falls. Tati reaches a little house (a learning tower with a lit window), the thread is tied in a bow at the door, and paper stars come out. This flows straight into the footer endpapers.
- **Copy:** lettering «قصهٔ ما به سر رسید…» · **H2:** «…ولی اردکه به خونه‌تون رسید!». This twists the traditional ending «کلاغه به خونه‌ش نرسید», which every Iranian adult will recognise and smile at. Sub: «به خانوادهٔ چوبز بپیوندید: قصه‌های تازه، پیشنهادهای ویژه قبل از همه، و عکس‌های شما.» CTAs: **«عضویت در کانال بله»** (primary, domestic, works without a VPN) · «اینستاگرام ‎@choobz.kids‎».
- **Motion:** the stars twinkle with a CSS opacity loop at 3 different periods, and a single shooting star crosses once per visit. As the house enters, the Mikhak word «رسید» does the kashida pull, as if Tati's string were drawn tight at the door. The header Tati fades at 98% scroll progress, because "his" duck has arrived at the house.
- **Data:** `settings.socials`. Links only: no Instagram embeds, which are filtered and heavy in Iran.

---

## 5. Header, navigation, footer, cart drawer

### 5.1 Mobile (about 80% of traffic): top bar, thread, and bottom shelf
- **Top bar (56px):** the logo at the start (right), then the search icon, the Lullaby moon toggle, and «فهرست» (menu) at the end. The bar's **bottom border is Tati's thread**. The bar hides on scroll-down and returns on scroll-up through a 0.4 KB passive-listener script, but **the thread and Tati stay visible** as a 3px progress line, fixed.
- **Bottom bar (64px + `env(safe-area-inset-bottom)`):** a **plywood plank** with ply edge and grain, holding «خانه» «فروشگاه» «سن‌یاب» (the height door, or `/age` when not on home) «دفترچه» «سبد». The active item has a tiny Tati parked above it, positioned with CSS anchor positioning where supported and a plain pesteh underline elsewhere. The cart icon is Tati's cart, with **stacked parcels equal to the item count** (1–4 boxes, then «+۵»).
- **The menu is the book's table of contents.** «فهرست» opens a full-screen `<dialog>` styled as a storybook contents page, with chapter numbers, dotted leaders, and page-number-like counts: «فصل یکم: بازی ........ فروشگاه»، «فصل دوم: کشف ........ دفترچهٔ رشد»، «فصل سوم: رشد ........ کارگاه ما»، then «اقساط»، «ارسال و بازگشت»، «تماس با ما». Search sits at the top of the dialog.
- On the **product page, the bottom bar becomes the sticky buy bar** (§6.3), so there are never two stacked bars.

### 5.2 Desktop: header and "toy-box lid" mega menus
- **Header (72px):** the logo at the start. Nav: «فروشگاه ▾» «سن‌یاب» «دفترچهٔ رشد ▾» «کارگاه ما» «۴ قسط». At the end: an expanding search field «دنبال چی می‌گردی؟», the moon toggle, and the cart.
- **Mega menu as a toy-box lid.** The panel opens like the lid of a wooden toy box, with a hinge from its top edge, a ply edge, and a shadow under the lid. For «فروشگاه» it holds an illustrated category cubby grid, an age column of hex chips, and one bundle card («اتاق مونته‌سوری کامل، از صفر»). For «دفترچهٔ رشد» it holds age tabs, 3 pillar guides, and «سؤال امروز». It is built with the **Popover API** (`popovertarget`, `:popover-open`, `@starting-style`) at zero JS. A 0.3 KB hover-intent script opens it on 120ms hover for pointer devices.
- **Breadcrumbs are string and beads:** «خانه ● فروشگاه ● مثلث پیکلر», with `BreadcrumbList` JSON-LD.

### 5.3 Search
- `/search?q=` is a **server-rendered** results page backed by SQLite **FTS5** (`unicode61 remove_diacritics 2`). Queries are normalised exactly like content (ی/ک, ZWNJ → space for indexing). Results are grouped into «محصولات»، «راهنماها»، «واژه‌ها». It works with JS off.
- An enhancer (about 3 KB, loaded on focus) adds suggest-as-you-type from `/api/suggest`, debounced at 120ms.
- Empty state: Tati looks under the shelf. «چیزی پیدا نکردیم! شاید این‌ها به کارت بیاد:» followed by popular categories.

### 5.4 Cart drawer: «گاریِ تاتی» (Tati's cart)
- A `<dialog>` slides in from the inline-end edge (left in RTL) with `@starting-style` and `transition-behavior: allow-discrete`, so it needs no library. It is a **wooden tray**: items sit like toys with tiny stages, and quantity steppers are wooden beads.
- The header illustration shows Tati pulling the cart with the item count as stacked parcels. A **free-shipping meter is the string**: «فقط ۴۲۰٬۰۰۰ تومان تا ارسال رایگان», with a bead sliding toward a little house.
- Below the subtotal: «یا ۴ قسطِ ۱٬۲۳۸٬۰۰۰ تومانی با اسنپ‌پی». Cross-sell: «کنارش خوب می‌شینه» (`product_relations.kind='bundle'`). The CTA is an anar wood block, «ادامهٔ خرید و پرداخت».
- **Add to cart is a `<form action={serverAction}>`, so it works with no JS.** The cart lives in new `carts`/`cart_items` tables keyed by an httpOnly cookie, ready for Phase 2 checkout. The action also sets a tiny readable cookie, `cz_n`, that holds only the item count. The header badge reads it on the client, so **no public page ever reads `cookies()` on the server** and every page can stay fully static (§9.1). The drawer's contents are fetched only when it opens. With JS, `useOptimistic` updates the count instantly (good for INP) and the **product thumbnail hops along a curved `offset-path` into the cart icon** (the *hop* spring). The cart then wobbles and gains a parcel. A muted-by-default "toc" wood sound (2 KB) is opt-in.
- Empty state: «گاریِ تاتی خالیه! بریم یه چیزی بذاریم توش؟» with three category links.

### 5.5 Footer: the endpapers
- **Endpapers:** a repeating pattern of tiny ply-cut toys (tower, triangle, duck, bead, sprout) on kahgel, like the inside cover of a hardback storybook. It is a 2 KB SVG pattern. In night mode it sits under the night scene from §4.12, with a sleeping Tati.
- Columns: «فروشگاه» (categories) · «دفترچهٔ رشد» (pillars, glossary) · «چوبز» (کارگاه، داستان ما، چوبز در یک نگاه) · «راهنمای خرید» (ارسال، بازگشت کالا، خرید قسطی، راهنمای نصب) · «تماس» (phone in Persian digits, address, hours: consistent NAP for local SEO and `LocalBusiness` if a workshop or showroom accepts visitors).
- The trust row has the eNamad slot (lazy, fixed size), SnappPay, and Bale and Instagram links (self-hosted icons).
- The last line: «© ۱۴۰۵ چوبز کیدز — با دست و دل، توی کارگاه خودمون ساخته شده.» A «برگرد به صفحهٔ اول» link (smooth scroll) makes Tati roll backwards along the thread, which is free because he is scroll-driven.
- A "calm motion" toggle «حرکت‌ها رو آروم کن» sets `data-motion="reduce"`. It is stored in localStorage and read by a 150-byte inline head script before first paint.

---

## 6. Shop

### 6.1 Listing pages: the shop window (ویترین)
- **Header:** an arch-shaped kahgel "shop window" holding the **H1** («فروشگاه اسباب‌بازی و سیسمونی چوبی», or the category name such as «مثلث پیکلر و سرسره»), the result count («۱۸ محصول»), and a 60–120-word unique intro. A «بیشتر بخوانید» link expands a 300-word buying primer with `<details>`; the text is in the DOM for SEO.
- **Sticky filter rail** (under the header, which hides on scroll):
  [«فیلترها (۲)»] opens a bottom sheet, followed by age hex chips **۰–۶ ماه · ۶–۱۲ ماه · ۱–۲ سال · ۲–۳ سال · ۳–۶ سال**, then category pills, then the sort control («محبوب‌ترین»، «جدیدترین»، «ارزان‌ترین»، «گران‌ترین»).
- **Bottom sheet** (`<dialog>`, swipe handle): «سن کودک» (multi hex chips) · «دسته» · «مهارت» (skill icons: حرکتی درشت، حرکتی ظریف، تعادل، خلاقیت، استقلال، زبان و کتاب، بازی نمادین) · «رنگ و پرداخت» (wood-chip swatches: طبیعی، سفید، رنگی) · «قیمت» (presets: «زیر ۲ میلیون»، «۲ تا ۵ میلیون»، «بالای ۵ میلیون». Presets beat sliders for speed, accessibility, and zero JS) · «فقط موجودها» toggle. The apply button reads «نمایش ۱۲ محصول».
- **No-JS first:** filters are a GET `<form>` and links, so they work and are crawlable. A 2 KB enhancer adds live counts and `router.replace` inside `startTransition` (soft navigation, no full reload).
- **Indexing rules:** `/shop`, `/shop/[category]`, and the `/age/[range]` hubs are **indexable static landing pages**. An age filter inside the shop links to the age hub instead of creating a duplicate page. Every other parameter combination gets `noindex,follow` and a canonical to its base. Pagination uses real `?page=2` links; «بیشتر نشونم بده» is the JS enhancement.
- **Grid:** 2 columns on mobile (12px gap), 3 on tablet, 4 on desktop. **Every 8th slot is an editorial "interlude"** spanning 2 columns: a guide («راهنمای انتخاب برج یادگیری · ۵ دقیقه») or a room bundle. This weaves content into commerce for internal linking, AEO, and conversion.
- **Age hubs** (`/age/1-2-years`, one per range in the content plan: `0-6-months`, `6-12-months`, `1-2-years`, `2-3-years`, `3-6-years`): the H1 is «اسباب‌بازی، وسایل و راهنمای رشد کودک ۱ تا ۲ سال». Each hub is one `CollectionPage` that merges commerce and content. It reuses the **height-mark door scene** fixed at that age, then gives a milestone paragraph, the product grid, the guides for that age (`posts` by age range), the glossary terms, and the age FAQ. One scene component serves two jobs, and one strong page per age replaces a thin shop page plus a thin magazine page.
- **Empty state:** Tati looking under the shelf. «با این فیلترها چیزی پیدا نکردیم.» and «پاک‌کردن فیلترها».

### 6.2 Product card
```
┌─────────────────────────┐
│ ⬡ ۸ ماه+          🎀    │  ← age hex (start) · bookmark ribbon (end; wishlist, Phase 2)
│   ╭───────────────╮     │
│   │  arch Stage   │  ＋ │  ← kahgel 4:5 stage; quick-add wood block (server-action form)
│   │  (SVG / photo)│     │
│   ╰───────────────╯     │
│   ‿‿ floor shadow ‿‿     │
│ مثلث پیکلر تاشو با رمپ   │  ← step-0 / 700, 2 lines max
│ ◔ ◑ ◕  (skill icons)    │
│  ⊙─┐                    │
│    ╰[ ۳٬۴۵۰٬۰۰۰ تومان ] │  ← price on a hanging wooden tag (string + punched hole)
│ یا ۴ قسطِ ۸۶۳٬۰۰۰ تومانی │  ← pesteh, step--1
│ ● ● ●  (wood-chip swatches)
└─────────────────────────┘
```
- The whole card is one link. Quick-add is a separate `<button>` in a `<form>`, with a 44px target.
- **On hover (`pointer: fine`), the illustration plays its trick** with the 400ms *settle* spring: the triangle unfolds, the tower platform rises a step, the arch rocks once, the bookshelf's covers flip forward. For photos, the image cross-fades to the lifestyle shot.
- Optional stamps (rubber-stamp style, −6°): «جدید» · «ساخت کارگاه» · «پیشنهاد یلدا».
- The stage is wrapped in React's `<ViewTransition name={"product-" + id} share="morph" default="none">` and **morphs into the PDP gallery** on navigation (see §8.3 for when the pair forms).
- The price tag and the hand-written stamps are Mikhak, and the title is Estedad 700.

### 6.3 Product detail page (PDP)
**Layout:** on mobile the sections stack in the order below. On desktop it's an **open-book spread**: the right page (start) holds a sticky gallery, and the left page holds the info column.

1. **Breadcrumb** (beads).
2. **Gallery:** the arch Stage with CSS scroll-snap slides and no carousel JS. Slides: illustration or cutout, then «توی اتاق» (the product placed in a room scene), then «ابعاد» (blueprint), then «جزئیات» (ply-edge macro), then lifestyle photos when available. Thumbnails and dots are anchor links (`#slide-3`), and a 1 KB enhancer syncs the active dot. Tapping opens a full-screen `<dialog>` with native pinch-zoom.
3. **Title block:** **H1** «مثلث پیکلر تاشو با رمپ دوطرفه» and a tagline «اولین کوهِ بچه‌ت، که توی اتاق جا می‌شه». The rating appears only if real reviews exist. Age hex «۸ ماه تا ۴ سال». Skill chips.
4. **Price and installments:** «۳٬۴۵۰٬۰۰۰ تومان» (struck-through `compareAtPrice` and `discountPercent()` when present), then **four wheels** under it, each a small wheel with spokes labelled «امروز / آبان / آذر / دی» and «۸۶۳٬۰۰۰ تومان». The Jalali months are computed on the server at build or revalidate time; the month labels are revalidated daily so they never go stale. Fine print: «طبق شرایط اسنپ‌پی». Availability follows `products.availability`: «موجود», «ساخت سفارشی · آماده در ۷ روز کاری» (from `leadTimeDays`), or «پیش‌سفارش».
5. **Variants:** **wood-chip swatches** for finish (طبیعی، سفید، پاستیلی, from `product_variants.swatch`), size pills, and add-ons as toggles («+ رمپ سرسره‌ای»). Variants are radios rendered from `product_variants.options`. The illustration recolours instantly through CSS variables, the price swaps through CSS `:has()` between server-rendered values, and `?variant=` is reflected for sharing (canonical stays on the base URL).
6. **CTAs:** **«افزودن به سبد»** (anar wood block, full width) and «خرید قسطی با اسنپ‌پی» (outline).
7. **Micro-trust row:** «ارسال ۳ تا ۵ روز کاری» · «ضمانت بازگشت» · «مشاوره رایگان در بله». All values come from settings.
8. **«چرا عاشقش می‌شن»:** three benefit tiles, each with a mini illustration.
9. **«با این وسیله چطور رشد می‌کنه»:** the **age ruler**. A horizontal (RTL) 0–6 year ruler with milestone ticks (نشستن، چهاردست‌وپا، ایستادن، قدمِ اول (Tati sits here), بالا رفتن، دویدن) and the product's range highlighted as a zardchube band: «از ۸ ماهگی (وقتی خودش رو بالا می‌کشه) تا ۴ سالگی».
10. **«ابعاد و اندازه»:** a **parametric blueprint**. Firuzeh lines on kahgel paper, dimension lines generated from `products.dimensions` (`widthCm`, `heightCm`, `depthCm`, plus `extra` such as «ارتفاع سکو») with Persian-digit labels in Mikhak, and `weightKg`. **A child silhouette at the median height for the product's minimum age** gives scale: «قدِ میانگینِ کودک ۱۰ ماهه: ۷۳ سانت». An input, «با قدِ بچهٔ خودم مقایسه کن» (cm, stays on the device), resizes the silhouette (0.6 KB).
11. **«جنس و ایمنی»:** a ply-edge macro illustration with labelled layers (number of plies, wood type, finish, edge radius, from `material`, `finish`, and `specs`) and a **sprout-check list**: «تحمل وزن تا ۵۰ کیلوگرم» (`maxLoadKg`), «رنگ پایهٔ آب», «بدون قطعهٔ ریز». A safety callout renders `safetyNotes`, a care note renders `careNotes`, and the warranty line renders `warrantyMonths`.
12. **«توی جعبه چی هست؟»:** an exploded-view SVG beside the `inTheBox` list, «زمان نصب: حدود ۲۰ دقیقه», and an assembly PDF (from the volume) linking to its assembly guide, a `posts` row with `format='howto'` at `/mag/{slug}` that carries HowTo markup.
13. **«توی خونه‌های شما»:** consented UGC polaroids of this product.
14. **«نظر خانواده‌ها»:** real `reviews` only (`status='approved'`, with a «خرید تأییدشده» stamp when `verifiedPurchase`), plus a «سؤال دارید؟» Bale CTA.
15. **«پرسش‌های این محصول»:** `faqs` with `scope='product'` and `scopeId` = the product, in `<details>`, emitted as FAQPage.
16. **«بیشتر بخوانید»:** the category's pillar guide plus two related posts (`post_products`), as notebook cards, following the content plan's linking rule.
17. **«اتاقش رو کامل کن»:** `product_relations` with `kind='bundle'`, shown as a mini room scene with hotspots. `kind='related'` feeds a plain «شاید این‌ها هم» row, and `kind='upsell'` feeds the size or add-on nudge.

**Sticky buy bar (mobile).** Once the main CTA leaves the viewport, a plywood plank slides up from the bottom (replacing the tab bar). It shows a tiny stage thumbnail, the price, «۴ قسط» in pesteh, and an **«افزودن به سبد»** wood block. It is driven by a **CSS view-timeline on the main CTA** at zero JS (Appendix C). Without support it is simply always visible.

**Structured data:** `ProductGroup` (`variesBy`: finish and size) with a `hasVariant` → `Product`/`Offer` for each variant (`price` in IRR, `availability`, `itemCondition`, `shippingDetails` → `OfferShippingDetails`, `hasMerchantReturnPolicy`). Also `brand`, `material`, `audience` → `PeopleAudience` (`suggestedMinAge`/`suggestedMaxAge`), `BreadcrumbList`, and `FAQPage`. `AggregateRating` and `Review` appear only with real reviews. The `og:image` is a per-product card (see §9.6).

**Title template:** «مثلث پیکلر تاشو با رمپ | خرید قسطی با اسنپ‌پی | چوبز کیدز». The meta description is human-written in the CMS, with fallback generation from the tagline, age, and price.

---

## 7. Content hub: «دفترچهٔ رشد» (the Growth Notebook)

### 7.1 Information architecture built for topical authority
This follows `docs/CONTENT-PLAN.md`: 9 topic clusters, 64 planned articles, 46 glossary terms, and 10 seed articles for launch.
- **Pillars (`posts.isPillar`, one per cluster):** for example `/mag/learning-tower-guide`, `/mag/pikler-triangle-guide`, `/mag/montessori-at-home-guide`, `/mag/montessori-room-setup`, `/mag/wooden-toy-safety-guide`, `/mag/child-drawing-stages`, `/mag/birthday-gift-guide-by-age`. **Each category page and its pillar link to each other.**
- **Clusters** are `topics` rows at `/mag/topic/{cluster}`: `montessori`, `movement`, `learning-tower`, `nursery`, `play`, `art`, `reading`, `safety`, `gifts`. **Age** is a cross-cutting axis served by the `/age/{range}` hubs, which list guides and products together.
- **Article formats** (`posts.format`, existing union plus two additions):
  - `guide`: a pillar, 2,000–3,500 words.
  - `article`: a supporting article.
  - `answer` *(added)*: one question answered fully, 400–900 words, built for AEO.
  - `comparison`: «مونته‌سوری، والدورف یا پیکلر؟», with tables.
  - `howto`: assembly and DIY setups, with HowTo markup.
  - `checklist`: «لیست سیسمونی هوشمند», with printable tick boxes.
  - `story`: a family story with photos.
  - `report` *(added)*: original data (see GEO below).
- Each format has its own **notebook stationery**: a guide is a kraft notebook, an answer is a mint speech bubble, a comparison is graph paper, a howto is a blueprint, a checklist is a pencil-ticked shopping list, a story is a photo album page, and a report is a rubber-stamped dossier. The stationery appears on cards and in the article hero, so a mother can tell what she is about to read at a glance.

### 7.2 Hub page
- The **H1** «دفترچهٔ رشد: راهنمای بازی، مونته‌سوری و چیدمان اتاق کودک» sits on a kraft notebook cover with an elastic band and a pencil.
- **«سؤال امروز»:** one large mint answer card (quick answer and link), rotated daily at build or revalidate time.
- **Age index tabs** stick out of the notebook edge in the five fixed age colours. They link to the `/age/{range}` hubs and become a sticky rail on mobile.
- **Topic shelves:** horizontal rows of arch cards per topic, each with a «همه» link.
- **Pillar guides:** big cards with a «راهنمای کامل» stamp.
- **Glossary teaser:** «واژه‌نامه: از الف تا ی», showing an alphabet strip with 6 illustrated terms.
- **Experts row:** authors and reviewers with their credentials (E-E-A-T).
- Schema: `CollectionPage` + `ItemList` + `BreadcrumbList`.

### 7.3 Article page: a reading experience for mothers at 1am
**Layout:** on mobile, a single column (36rem), 19px body, line-height 2.0, shir paper. On desktop, three columns: the **TOC on the start side** (sticky), the text in the centre, and **marginalia on the end side**, which holds hand-written side notes in Mikhak for "تجربهٔ یک مامان" and glossary popovers.

Order:
1. **Hero:** an arch-masked illustration or photo with the category kicker.
2. **H1** «مثلث پیکلر چیست و از چند ماهگی مناسب است؟». The dek is one sentence. The **meta row** shows the author avatar and name, «بازبینی علمی: [name، کاردرمانگر کودک]», «به‌روزرسانی: ۲۴ مهر ۱۴۰۵», «۷ دقیقه مطالعه», and age tags.
3. **«جواب کوتاه»:** a mint bubble with a thinking Tati holding **one 40–60-word direct answer paragraph**, with the entity in bold. This is the featured-snippet and AI-Overview target.
4. **«خلاصه در یک نگاه»:** a TL;DR of 3–5 bullets from `posts.tldr`, with zardchube highlights on key numbers.
5. **TOC (string with beads):** each H2 is a bead on a vertical string, and the current bead fills anar. This uses IntersectionObserver (0.8 KB). On mobile it's a `<details>` «فهرست مطالب» under the TL;DR.
6. **Body:** **H2s are phrased as questions** («از چند ماهگی می‌شود استفاده کرد؟»). **Every section starts with a 1–2 sentence answer** and then goes deeper, so each section is self-contained for LLM chunking.
7. **Rich blocks** (typed CMS blocks):
   - **Callouts**, four kinds: «نکتهٔ مونته‌سوری» (nana and a sprout) · «حواستون باشه» (anar left rule and a safety icon) · «از زبان یک مامان» (a zardchube speech bubble, which becomes marginalia on desktop) · «از کارگاه» (a wood-grain card with pencil-behind-ear Tati).
   - **«نکته‌های کلیدی» key-facts table:** attribute and value rows («سن مناسب»، «مهارت‌ها»، «فضای لازم»، «ایمنی»).
   - **Comparison tables** with `<caption>` and `<th scope>`, scrolling horizontally on mobile with a shadow cue.
   - **Steps** (HowTo) as numbered beads with mini illustrations.
   - **Product embed:** a "toy card" (mini stage, name, age hex, price, «ببینید»), at most 2 per article and never in the first screen. They are in-content, honest, and useful.
   - **Glossary auto-links:** the first occurrence of a term gets a dotted underline. On desktop it shows a hover card through the Popover API and anchor positioning; elsewhere it's a plain link.
   - **Age chart:** an inline mini age ruler.
8. **«پرسش‌های پرتکرار»:** 4–8 questions in `<details>`, emitted as FAQPage.
9. **«منابع»:** numbered sources from `posts.sources` (WHO, AAP, Montessori and Pikler institutes, peer-reviewed papers) with outbound links. The `citation` property is in the JSON-LD.
10. **Author and reviewer box:** `authors` via `authorId` and `reviewerId`, with a photo, `credentials`, a link to `/team/{slug}` (a `ProfilePage`), and a one-line «چطور این مطلب را نوشتیم؟» linking to the editorial policy. Articles the content plan marks as needing a doctor's or specialist's review show the reviewer prominently and are not published without one.
11. **«وسایلی که در این مطلب دیدید»:** a product mini-grid from `post_products` (one to three products, per the content plan's linking rule).
12. **Related articles** (same cluster), then share: Bale, WhatsApp, Telegram, and copy link, using URL schemes and the Web Share API with **no third-party share scripts**.
13. **The ending line:** «قصهٔ این مطلب همین‌جا تموم شد؛ قصهٔ بچه‌ت تازه شروع شده.»

**Reading progress** is the global Tati thread. **Lullaby mode** turns the page into a dim reading lamp: shab background, mahtab text, and images at 92% brightness.

**Schema per article:** `Article` (`headline`, `datePublished`, `dateModified`, `author` → `Person` with `hasCredential` and `sameAs`, `publisher` → `Organization`, `about`/`mentions` → glossary `DefinedTerm` URLs and `Product` URLs, `citation`), `WebPage.reviewedBy`, `BreadcrumbList`, `FAQPage`, `HowTo` where applicable, and `ItemList` for listicles.

### 7.4 Glossary: «واژه‌نامهٔ رشد و بازی», a picture dictionary
- **Index** (`/glossary`): a sticky **alphabet rail «الف ب پ ت … ی»** with jump links. Under it is a grid of **picture-dictionary cards**: a tiny ply-cut illustration, the Persian term, the English term (`<bdi lang="en">Pikler triangle</bdi>`), and a one-line definition. It is gorgeous to scroll and perfect for crawlers.
- **Term page** (`/glossary/pikler-triangle`):
  - **H1** «مثلث پیکلر چیست؟»
  - First sentence, from `glossary_terms.definition`: «<dfn>مثلث پیکلر</dfn> (Pikler triangle) یک سازهٔ چوبیِ تاشو برای بالا رفتن است که…» The English form comes from `originalTerm`.
  - Sections, from the optional Markdown `body`: «به زبان ساده» (for a tired parent) · «از چند سالگی؟» · «چه مهارتی را تقویت می‌کند؟» · «واژه‌های مرتبط» · «محصولات مرتبط» (`relatedProductSlugs`) · «مقاله‌های مرتبط» (`relatedPostSlugs`)
  - Schema: `DefinedTerm` in a `DefinedTermSet`, with `alternateName` holding the English and colloquial names and `sameAs` holding the Wikidata or Wikipedia URLs from `glossary_terms.sameAs`.
- Seed terms: the content plan's 46 terms in four groups (approaches, motor and sensory development, products, materials and safety), for example مثلث پیکلر، آرک پیکلر، برج یادگیری، مونته‌سوری، والدورف، امی پیکلر، محیط آماده، بازیِ باز (open-ended play)، حرکات درشت، حرکات ظریف، زمانِ روی شکم (tummy time)، چرخش اسباب‌بازی (toy rotation)، نردبان سوئدی، کتابخانهٔ روبه‌رو، سیسمونی.

### 7.5 SEO, AEO, and GEO machinery (site-wide)
- **Rendering:** every word is server-rendered HTML, with zero content behind JS. The pages use semantic landmarks (`header`, `nav`, `main`, `article`, `aside`, `footer`) and a single H1.
- **Entity consistency:** the name is always «چوبز کیدز (Choobz Kids)». `Organization`/`Brand` JSON-LD carries `alternateName: ["چوبز", "Choobz", "choobz.kids"]`, `logo`, and `sameAs: [Instagram, Bale]`. A Wikidata item can follow in a later phase.
- **The `/about/facts` page, «چوبز در یک نگاه»:** a plain, dated fact sheet that answer engines can quote verbatim. It covers what Choobz makes, the city, the year it started, the materials and finishes, shipping times, the warranty and return policy, the installment partner, and contact details, written as short Q&A lines.
- **Bilingual entity anchoring:** on first mention, write «مثلث پیکلر (Pikler triangle)». LLMs bridge to their English knowledge, which helps cross-lingual retrieval in ChatGPT, Gemini, and Perplexity.
- **Information gain wins GEO.** Publish **original data** nobody else has, such as «گزارش چوبز: ۱٬۲۰۰ مادر دربارهٔ زمان بازیِ آزاد» from Instagram polls with 50K followers, or workshop measurements («میانگین ارتفاع کابینت آشپزخانه‌های ایرانی ۹۰ سانت است؛ برای همین سکوی برج سه ارتفاع دارد»). Generative engines cite primary sources.
- **Freshness:** `dateModified` is shown visibly. A pillar refresh cadence (quarterly) is set as a CMS reminder for Phase 2.
- **Machine endpoints:**
  - `/sitemap.xml` is a sitemap index (`generateSitemaps`) split into products, categories, articles, glossary, and pages, with `lastmod` taken from the DB.
  - `/feed.xml` is an Atom feed of the notebook.
  - `/llms.txt` and `/llms-full.txt` are generated from the DB: the brand summary, key pages, product one-liners with age, price, and URL, the pillars, the glossary, and the policies.
  - `robots.txt` allows `Googlebot`, `Bingbot`, `OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, and `Applebot-Extended`. This is a business decision, and the recommendation is to allow them for GEO. It disallows `/cart`, `/search`, and parameterised facets.
  - **IndexNow** is pinged on publish (Phase 2). Bing's index feeds ChatGPT search.
- **Iran-specific:** a **Torob/Emalls-compatible product feed** (`/feeds/torob.json`, Phase 2; the schema already has `sku`, `stock`, `availability`, `price`, `compareAtPrice`, and `product_media`). Iranian shoppers price-compare on Torob, so it's an SEO channel in its own right.
- **Slugs:** short Latin slugs (`/product/pikler-triangle-ramp`, `/mag/pikler-triangle-guide`). Persian slugs turn into long `%D9%85…` strings in Bale, Telegram, and WhatsApp shares and break link previews. Breadcrumb schema gives Persian labels in the SERP anyway. Any slug change writes a `redirects` row with a 301 (the table already exists; `proxy.ts` looks up a cached map of it).
- **Per-row SEO overrides** use the shared columns every publishable table already has: `seoTitle`, `seoDescription`, `canonicalPath`, and `noindex`.

---

## 8. Motion system: "wood has weight"

### 8.1 Principles
1. **«چوب وزن دارد», wood has weight.** Things roll, tip, drop, and settle with a small overshoot (5% or less). Nothing floats or fades in weightlessly.
2. **«کاغذ تا می‌خورد», paper folds.** Scenes reveal by **hinging** (pop-up `rotateX`/`rotateY` from an edge), never by generic slide-ups.
3. **«نخ وصل می‌کند», the string connects.** Movement between two places follows a path (`offset-path`): cart hops, the thread, TOC beads.
4. **The scroll is a pull, never a hijack.** Scroll-linked effects are *scrubbed*, never scroll-jacked. There is at most one sticky scene per page, at most 140vh, and none on mobile.
5. **Calm by default.** At most 2 moving things per viewport and 1 idle loop (Tati's blink), and nothing loops without the visitor's action except stars at night.
6. **Respect.** `prefers-reduced-motion: reduce`, `data-motion="reduce"`, or low-end hardware (an inline 150-byte check of `deviceMemory ≤ 2 || hardwareConcurrency ≤ 4` sets `data-lite`) puts every scene in its **final state**, removes parallax, and turns view transitions into a 120ms cross-fade.

### 8.2 Tokens
| Token | Value | Use |
|---|---|---|
| `--dur-press` | 90ms | Block press, chip toggle |
| `--dur-quick` | 160ms | Hover, focus, small colour changes |
| `--dur-base` | 240ms | Popovers, drawer content |
| `--dur-gentle` | 360ms | Card tricks, bubble pops |
| `--dur-page` | 420ms | Page turn (view transition) |
| `--dur-scene` | 620ms | Pop-up layers, room morph (the spring's natural length) |
| `--ease-out-wood` | `cubic-bezier(.2,.8,.2,1)` | Default exits and entries |
| `--ease-page` | `cubic-bezier(.65,0,.35,1)` | Page turns |
| `--spring-settle` | `linear(0, 0.149, 0.428, 0.694, 0.883, 0.995, 1.043, 1.052, 1.043, 1.028, 1.015, 1.005, 1, 0.998, 0.997, 0.998, 1)` · 620ms | Stiffness 260 / damping 22 / mass 1 (5.3% overshoot): drops, pop-ups, room morph |
| `--spring-hop` | `linear(0, 0.387, 0.967, 1.249, 1.21, 1.053, 0.948, 0.935, 0.973, 1.008, 1.018, 1.011, 1, 0.995, 0.996, 0.999, 1)` · 800ms | Stiffness 420 / damping 16: add-to-cart hop (scale), badge bump |
| `--spring-wobble` | `linear(0, 0.646, 1.334, 1.266, 0.936, 0.86, 0.984, 1.058, 1.026, 0.982, 0.983, 1.002, 1.008, 1.002, 0.997, 0.998, 1)` · 1280ms | Stiffness 300 / damping 10: rotation only (Tati's quack, cart wobble, ±6°) |

The springs are **computed at build time** (a tiny script outputs CSS `linear()` strings) and run as pure CSS, so there's no spring runtime. **Motion (motion.dev)** is allowed only through `motion/mini`'s `animate()` (about 2.5 KB) in the two places that need interruptible gesture springs: the gallery dialog's drag-to-dismiss and the cart hop's mid-flight retargeting. Neither is on the critical path. The full `motion/react` bundle is not used.

### 8.3 Page transitions: «ورق‌زدن» (turning the page)
- **No flag is needed.** In Next 16.4 the App Router works with React 19.3's `<ViewTransition>` with no configuration, and route navigations are transitions, so they animate on their own. Without browser support, navigation is instant and still fast.
- **Direction is mirrored for a Persian book.** A Persian book is bound on the right, so you turn a page by lifting the left-hand page over to the right. Forward navigation therefore moves the old page **toward inline-start (right)** with a `rotateY` hinge on the spine and a soft page-shade gradient, and the new page is revealed from **inline-end (left)**. The Next.js guide's LTR recipe ("forward slides left") is wrong for us, so our `nav-forward`/`nav-back` keyframes are written in RTL from the start. It takes 420ms with `--ease-page`.
- **Wiring, as the 16.4 guide prescribes:** "deeper" links carry `transitionTypes={['nav-forward']}` and breadcrumb or back links carry `['nav-back']`. Each `page.tsx` (not the layout, which persists) wraps its content in `<ViewTransition enter={{ 'nav-forward':'turn-forward', 'nav-back':'turn-back', default:'none' }} exit={{ 'nav-forward':'turn-forward', 'nav-back':'turn-back', default:'none' }}>`. `default: 'none'` keeps browser back, `router.refresh()`, and Suspense reveals from playing a page turn.
- **Shared elements** (`share="morph"` with `default="none"` on both ends, so named elements don't cross-fade on unrelated transitions): the product card stage becomes the PDP gallery stage (`product-{id}`), the article card arch becomes the article hero, the category cubby becomes the category shop-window illustration, and the age chip becomes the age hub's hex.
- **When the morph pair forms.** A morph plays only if the destination renders in the same commit as the navigation. With `partialPrefetching: true`, a default `<Link>` prefetches only the route's App Shell, and `params`-dependent content such as the PDP gallery resolves after the click. So the first four cards in any grid (and the pull-train) use `<Link prefetch={true}>`, and the other cards switch to `prefetch={true}` on pointer-enter, focus, or touch-start (a 0.3 KB `IntentLink`, the guide's hover-triggered pattern). We don't prefetch every card in the viewport, because each one would cost a server request on 4G. When no pair forms, the page turn still plays and nothing breaks.
- **The header and Tati never turn with the page.** They get their own `view-transition-name`s (`site-header`, `tati`) with the animation set to `none`, so they stay put as the visitor's anchor. Tati simply keeps riding his thread, which makes the visit feel continuous.
- With reduced motion, a 120ms opacity cross-fade replaces everything and no shared morphs run.

### 8.4 Micro-interactions catalog
- **Wood-block buttons** press down 2px and lose strata (90ms).
- **Hex chips** "click" like beads (scale .96, then the settle spring).
- **Bookmark ribbon** (wishlist) drops down 8px with the hop spring, and a sprout grows from it into a heart (their Instagram motif).
- **Cart icon** wobbles and gains a parcel.
- **Tati tap:** a quack wobble, the kashida pull on his Mikhak name tag (`KSHD` 120 → 200 → 120 on the *settle* spring, `contain: layout`), then a caption bubble.
- **Price change** on variant switch: the digits roll vertically, a CSS counter animation of 240ms on `tabular-nums`.
- **Error shake** is a 3-step wobble ±4px with `role="alert"` text, never colour alone.

---

## 9. Performance plan

**Targets (p75, mobile, Iranian 4G):** LCP < 1.8s · CLS < 0.02 · INP < 120ms · TTFB < 200ms (static HTML from an Iran-hosted origin).

### 9.1 Rendering model (Next.js 16.4: `cacheComponents` + `partialPrefetching`, already on in `next.config.ts`)

**The rule: every public page is fully static, and the build enforces it.** No public route reads `cookies()`, `headers()`, or `searchParams` on the server. The cart count comes from the readable `cz_n` cookie on the client (§5.4), and the height door reads `?age=` on the client (§4.3). Content routes export **`ensureStatic = 'navigation'`**, so a later change that adds request-time rendering (an uncached DB call, `cookies()`, a `cacheLife` under five minutes) fails `next dev` and `next build` instead of quietly slowing TTFB. It is set on a `(static)` route-group layout and on `app/page.tsx`, never on the root layout, because a child can't weaken a parent's level and `/search`, `/cart`, and the filtered shop need to stay looser. Dynamic segments export `generateStaticParams()`. A product the CMS adds after the build is generated on its first request and then served static.

| Route | Rendering | Revalidation tags | LCP element |
|---|---|---|---|
| `/` | Static, `"use cache"` + `cacheLife('days')`; `ensureStatic='navigation'` | `home`, `products`, `posts`, `settings` | **The H1 display text** (Ario, preloaded, server-rendered, never animated) |
| `/shop`, `/shop/[category]` | Static (`generateStaticParams`). Filtered views render the grid inside `<Suspense>` from a cached query keyed by the params; this route uses `ensureStatic='shell'` | `products`, `categories` | **H1 text** in the shop window |
| `/age/[range]` (5 hubs) | Static; `'navigation'` | `products`, `posts`, `settings` | H1 text |
| `/product/[slug]` | Static per product, including stock and availability, which are revalidated by tag when they change; `'navigation'` | `product:{id}` | **First gallery image** when it's a photo (`loading="eager"` + `fetchPriority="high"`; `priority` is deprecated in 16, and `preload` is avoided because the LCP image differs by viewport; AVIF of about 35–45 KB at 640w); **H1 text** when it's an illustration (inline SVG is not an LCP candidate, so the text wins) |
| `/mag`, `/mag/[slug]`, `/mag/topic/[cluster]` | Static; `'navigation'` | `post:{id}`, `topics` | **H1 text** (the hero illustration is inline SVG; a hero photo gets `fetchPriority="high"`) |
| `/glossary`, `/glossary/[term]`, `/team/[slug]`, `/faq` | Static; `'navigation'` | `glossary`, `authors`, `faqs` | H1 text |
| `/search`, `/cart` | Dynamic (server-rendered, `noindex`) | n/a | Results heading |
| `/media/[...path]` | The existing route handler, streaming from `UPLOAD_DIR` with ETag and immutable caching | n/a | n/a |

- **Invalidation (Phase 2 ready):** a CMS save calls `updateTag('product:12')` inside the server action, which gives read-your-writes for the editor. Background jobs, such as a stock change from an order webhook, call `revalidateTag('product:12', 'max')`. The two-argument form is required in 16.x; the one-argument form is deprecated.
- **SQLite (better-sqlite3)** is synchronous and very fast. `src/db/index.ts` already sets `journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout=5000`, `foreign_keys=ON`, and a 16 MB page cache. Reads happen at build and revalidate time, so the DB is almost never on the request path.
- **Images bypass the on-demand optimiser.** Variants are pre-generated at upload (seed script now, CMS later) beside the original as `{name}-{w}.{avif,webp}`, so no new column is needed. `next/image` uses a **custom loader** (`src/lib/media-loader.ts`) that maps a requested width to the nearest pre-built file under `/media/`, so there's no CPU spike under traffic and no optimiser cache to persist. (The comment in the media route mentions `images.localPatterns`; the loader replaces that.) Every `<img>` has width and height (or `aspect-ratio`) and `media.dominantColor` as its placeholder background, with `blurDataUrl` for hero photos.

### 9.2 Client islands (our code, gzipped estimates)
| Island | Where | Cost | Loads |
|---|---|---|---|
| `ThreadHeader` (hide-on-scroll; Tati is pure CSS) | global | 0.4 KB | Immediately (tiny) |
| `CartButton` + `CartDrawer` (reads the `cz_n` count cookie, `useOptimistic`, server action, `<dialog>`) | global | about 3.5 KB | Immediately; drawer content fetched on open |
| `IntentLink` (switches `prefetch` to `true` on pointer-enter, focus, or touch-start) | grids | 0.3 KB | Immediately (shared) |
| `AgeRoomVT` (wraps radio changes in `startViewTransition`, `replaceState`) | home, age pages | 0.5 KB | On visible (`IntersectionObserver` + dynamic import) |
| `NameOnCart` (SVG live preview + canvas export + Web Share) | home §1 sheet | about 4 KB (+ 80 KB template on tap) | **On interaction only** |
| `TrainLean` (velocity tilt) | home §4 | 0.6 KB | On visible; skipped on `data-lite` |
| `FilterEnhancer` (live counts, soft nav) | shop | about 2 KB | On idle |
| `GallerySync` + `ZoomDialog` (`motion/mini` for drag-dismiss) | PDP | 1 KB + 3 KB | Sync on idle, zoom on tap |
| `HeightCompare` | PDP | 0.6 KB | On interaction |
| `TocBeads` (IntersectionObserver) | article | 0.8 KB | On idle |
| `SearchSuggest` | global | about 3 KB | On search focus |
| `LullabyToast` (Tehran-time check, theme switch) | global | 0.5 KB | On idle |

**Home page, our JS ≈ 9–10 KB gz at load** (about 15 KB with everything interacted with). The framework runtime (React 19 and the Next router, about 90–110 KB gz) is shared, async, and immutable-cached after the first visit. **Budgets are enforced in CI** with `size-limit` on our chunks and Lighthouse CI (Moto G Power profile, 4× CPU throttle) failing the build on regressions. The React Compiler is on, so we don't hand-memoise.

### 9.3 HTML, CSS, and SVG budgets
- **Home HTML is at most 70 KB gz,** including about 12 KB gz for the hero SVG. The SVG is SVGO-optimised (precision 1, integer viewBoxes) and repeated shapes use `<symbol>`/`<use>`. Below-the-fold scenes are inline but skipped by `content-visibility: auto`. Product drawings in grids use one cached external sprite (`/illustrations/products.svg`, about 25 KB gz, `Cache-Control: immutable`), recoloured through inherited custom properties.
- **CSS is at most 22 KB gz** (Tailwind v4 output plus tokens). It is **inlined into the HTML** with `experimental.inlineCss` to remove the render-blocking request on the first visit, which is when LCP matters most. The 16.4 docs note the trade-offs: the flag is global and experimental, returning visitors re-download the CSS with each HTML document, and client navigations to prerendered pages fall back to `<link>` tags. This is worth it while the CSS stays this small, and the CI budget keeps it small. If the CSS grows past about 30 KB gz, we turn the flag off.
- Texture tiles total about 11 KB and the hand-lettered phrases are inline.
- **Animate only `transform` and `opacity`** (and `offset-distance`), so scroll-driven animations run on the compositor. Each hero layer is an HTML wrapper `<div>` around its SVG, and the wrapper is what gets transformed (never SVG attributes). `will-change` is used only on the 5 hero layers and Tati.

### 9.4 Font loading
Font loading follows `docs/FONTS.md` §5 exactly:
- Fonts are self-hosted through `next/font/local` from `src/fonts/` (`src/app/fonts.ts`), which gives hashed, immutable files from `/_next/static/media`. **No Google Fonts and no foreign CDN.** The template's `next/font/google` Geist import in `layout.tsx` is removed on day one.
- **Subsets** are built once with `pyftsubset` (with `--layout-features='*'`, so `ss01`, `ss02`, `tnum`, and the `KSHD` axis survive) and committed with their licences and `PROVENANCE.md`. They cover Persian letters, ZWNJ/ZWJ/LRM/RLM, Persian digits, «٬ ٫ ، ؛ ؟ « » ٪ ﷼», the harakat, and Basic Latin.
- **Estedad (50.5 KiB) and Ario (19.0 KiB) are preloaded** with `display: 'swap'`. About 70 KiB arrives before first paint on Iranian 4G. **Mikhak (26.3 KiB) is not preloaded,** because it only appears in accents below the hero or after an interaction. If Tati's name tag shows on the cover before Mikhak arrives, it renders in Estedad, and the swap is invisible at that size.
- `adjustFontFallback: false`, because Next computes `size-adjust` from Latin metrics, which is wrong for Persian. **CLS is controlled by explicit line-heights** on every text role (§3.3) and by the preload. The fallback stack is `system-ui, "Segoe UI", Tahoma, sans-serif`.
- The next/font variables use the `--ff-*` prefix (`--ff-body`, `--ff-display`, `--ff-hand`), so they never collide with Tailwind's `--font-*` theme tokens.
- The LCP H1 is Ario text. If the font is late, the H1 paints in the fallback and swaps without moving, so LCP is never blocked on a font.

### 9.5 Network and Iran-specific delivery
- **Host inside Iran** (a Tehran data centre) and optionally put a domestic CDN (ArvanCloud) in front. Brotli and HTTP/3 come from the reverse proxy (Caddy or nginx) in the same `docker-compose`.
- **Zero third-party requests at load.** The only exception is the lazy eNamad seal. Analytics is self-hosted Umami in the same compose stack, at about 2 KB, deferred and first-party. Web-vitals RUM goes through `useReportWebVitals` to `/api/vitals` and into a SQLite `vitals` table, which the Phase 2 dashboard charts. Chat widgets, if they're ever added, load on the visitor's interaction.
- **This stack survives international internet disruptions.** With domestic hosting and no foreign dependencies, the site keeps working on the national network. See Risk 9 about the `.kids` DNS.
- `Save-Data` and `navigator.connection.saveData` turn off the workshop video, lower photo quality by one step, and skip UGC images until they're tapped.

### 9.6 OG and share images (for Bale, Telegram, WhatsApp, and Instagram link stickers)
Per-product and per-article 1200×630 cards are drawn in the ply-cut frame with Tati, with the title in Ario. **They are generated with sharp and librsvg (Pango/HarfBuzz shaping, with the same three font files installed in the image through fontconfig) at build or publish time** and stored in `/data/uploads/og/` as `media` rows. `next/og`/satori is avoided for these because its Arabic-script shaping and bidi are unreliable for Persian.

### 9.7 Docker and the volume
- `output: 'standalone'`, a multi-stage build, a non-root user, and `VOLUME /data`.
- Inside the volume: `/data/choobz.db` (+ `-wal`/`-shm`), `/data/uploads/{originals,…variants,og,docs}`, and `/data/backups/`.
- Environment: `DATABASE_PATH=/data/choobz.db` (read by `src/db/index.ts` and `drizzle.config.ts`) and `UPLOAD_DIR=/data/uploads` (read by `src/lib/paths.ts`). Both default to `./data/` locally, which `.dockerignore` already excludes.
- Drizzle migrations from `drizzle/` (starting with `0000_init.sql`) run programmatically at boot (`migrate()` before `server.js`), and the seed is idempotent (`npm run db:seed`). The columns this concept adds (Appendix A) ship as one migration, `0001_storybook.sql`.
- Nightly `sqlite3 .backup` goes to `/data/backups`. Litestream to S3-compatible **domestic** object storage (such as Arvan) is optional.

---

## 10. Risks and mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Illustration volume.** About 10 product families, about 9 Tati poses, 5 age rooms, and seasonal skins is a lot of art. | A **parametric illustration kit**: a ply-edge primitive (`<Ply d=… depth={3}/>`), token fills, and a shared product sprite. Product SVGs derive from real dimensions. Phase 1 ships 9 families, 1 hero scene, and 5 room states. **Commission one Iranian illustrator** to set the master style (authenticity and no generic AI look); the developers then extend the kit. |
| 2 | **Illustrations alone don't convert.** Buyers want photos of the real thing. | The Stage system accepts `cutout`/`photo` from day one. **A one-day product shoot** (cutouts plus ply-edge macros) is the top Phase 2 content task. Meanwhile, customer polaroids and the Instagram highlight content bridge the gap, and every illustration is dimensionally accurate. |
| 3 | **Whimsy fatigue, or "too childish" for adult buyers.** | The rules: one Tati per viewport, at most 2 moving things, and calm copy addressed to *parents*. The palette is adult and crafted, with no primary colours or cartoons. A skip link goes straight to the shop. There's no scroll-jacking and no pinned scenes on mobile. |
| 4 | **Uneven browser support** (scroll-driven animations, view transitions, anchor positioning, `interpolate-size`) and **older iPhones and budget Androids common in Iran.** | Every effect is wrapped in `@supports` and progressive. The **baseline is a complete, beautiful, static storybook.** Test on a Galaxy A-series class device and on iOS 16–17 Safari with 4× CPU throttling. `data-lite` drops parallax on weak hardware. |
| 5 | **Persian typography pitfalls** (ZWNJ, Arabic ي/ك, digit mixing, broken joins from letter-spacing, typed kashida, faux bold on Ario). | A normalisation pipeline on every write (`normalizeFa()` extended), stylelint bans (`tracking-*`, `left/right`, `italic`, `"wght"` in `font-variation-settings`), `font-synthesis: none`, a visual regression suite (Playwright screenshots in RTL), and copy review by a native editor. |
| 6 | **Poetic copy diluting SEO.** | **Two-layer headings:** the decorative kicker is lettered and `aria-hidden`, and the H1/H2 are plain and keyword-bearing. Each category and age page has a factual intro, and answer-first paragraphs appear everywhere. |
| 7 | **HTML bloat from inline SVG.** | Hard budgets in CI (home ≤ 70 KB gz), a cached external sprite for repeated products, `content-visibility`, and SVGO with precision 1. |
| 8 | **Third parties that Iran needs** (eNamad, SnappPay, later payment gateways) hurting performance or CLS. | Fixed-size slots, lazy loading, and `referrerpolicy="origin"` for eNamad. SnappPay logic stays server-side and its logos are self-hosted. Nothing third-party runs before LCP. |
| 9 | **The `.kids` TLD depends on a foreign registry**, so DNS can fail during disruptions. eNamad and local trust signals favour `.ir`. | **Also register `choobz.ir` (or `choobzkids.ir`)** pointing to the same container. Pick one canonical host after an eNamad and SEO decision (recommendation: keep `choobz.kids` as the brand canonical and `.ir` as an equivalent host with 301s) and keep a domestic DNS secondary. Decide this before launch, because changing canonicals later costs rankings. |
| 10 | **Persian shaping in generated images** (OG cards, story cards). | Server-side sharp and librsvg (HarfBuzz) for OG. The client-side story card uses Canvas 2D with `ctx.direction='rtl'` after `document.fonts.load()`. Both are tested with long names and ZWNJ. |
| 11 | **Privacy and consent for children's photos and names.** | `community_photos` and `reviews` gain a `consent_at` column, rows without it never render, and faces only appear with written consent. The Name-on-Cart name never leaves the device. No child data goes in URLs or analytics. |
| 12 | **Fabricated trust** (fake reviews, unverified safety claims, made-up stats) would damage trust and break Google policies. | Seed placeholders render only in dev. AggregateRating needs real reviews. Every safety and material claim is a DB field the brand verifies («تأیید شده توسط کارگاه» checklist in Phase 2). Stats (followers, families) are real and dated. |
| 13 | **Experimental or fast-moving framework features** (`inlineCss` is experimental; `partialPrefetching` and `ensureStatic` are new in 16.x and will become defaults in the next major; `<ViewTransition>` behaves differently in Safari). | Each is isolated behind a single wrapper module or config line with a no-op fallback, so a version bump never breaks the build. Before using any of them we read the bundled guide in `node_modules/next/dist/docs/`, as `AGENTS.md` requires. |
| 14 | **SQLite contention** later, when the CMS writes during traffic. | WAL mode, short transactions, revalidation by tags (reads come from cache), a single writer process (the app container), and backups. |
| 15 | **Shared-element morphs silently not forming** under Partial Prefetching (the destination's `params` content isn't ready in the same commit). | The first row of each grid uses `prefetch={true}`, and the rest use intent prefetch through `IntentLink`. The page turn is the designed fallback, so a missing morph never looks broken. A Playwright check asserts that the card→PDP morph runs on a warm cache. |
| 16 | **Ario is very new** (v2.0.1, August 2026), so hinting or shaping bugs may surface on old Android WebViews. | `docs/FONTS.md` verified it in Chromium. Add one real-device pass (Galaxy A-series, Chrome and Samsung Internet). The display role is a single token, so swapping to Lalezar (the verified alternative) is a one-line change. |

---

## Appendix A: Data model (Phase 1 seeded, Phase 2 CMS-ready)

**The schema already exists** in `src/db/schema.ts` (with migration `drizzle/0000_init.sql`), and this concept builds on it rather than replacing it. Every table has `createdAt`/`updatedAt`. Publishable tables share the SEO block (`seoTitle`, `seoDescription`, `canonicalPath`, `noindex`) and a `status` (draft/published/archived). Prices are integer Toman. Long bodies are Markdown (GFM), so they stay portable between editors.

**How each storybook surface maps to the existing tables**

| Surface | Existing table and columns |
|---|---|
| Toy shelf cubbies, shop windows | `categories` (`name`, `tagline`, `description`, `illustration`, `accent`, `coverMediaId`, `sortOrder`) |
| Product card, PDP, blueprint, safety | `products` (`summary`, `price`, `compareAtPrice`, `availability`, `leadTimeDays`, `ageMinMonths`/`ageMaxMonths`, `skills`, `material`, `finish`, `dimensions`, `weightKg`, `maxLoadKg`, `highlights`, `specs`, `inTheBox`, `safetyNotes`, `careNotes`, `warrantyMonths`, `illustration`, `featured`, `isNew`) |
| Wood-chip swatches, variant prices | `product_variants` (`options`, `swatch`, `price`, `stock`) |
| Gallery and Stage | `product_media` → `media` (`path`, `alt`, `width`, `height`, `dominantColor`, `blurDataUrl`) |
| «اتاقش رو کامل کن», «شاید این‌ها هم» | `product_relations` (`kind`: `bundle`, `related`, `upsell`) |
| Sticky-note testimonials, PDP reviews | `reviews` (`featured`, `status`, `verifiedPurchase`, `childAge`, `city`) |
| Fridge-door polaroids | `community_photos` (`mediaId` or `illustration`, `customerName`, `city`, `productId`) |
| Growth Notebook, answer bubbles, TL;DR | `posts` (`format`, `isPillar`, `tldr`, `excerpt`, `sources`, `authorId`, `reviewerId`, `ageMinMonths`/`ageMaxMonths`, `readingMinutes`, `featured`) + `post_products` + `topics` |
| Author and reviewer box, `/team` | `authors` (`role`, `credentials`, `sameAs`, `avatarMediaId`) |
| Picture dictionary | `glossary_terms` (`term`, `originalTerm`, `definition`, `body`, `relatedPostSlugs`, `relatedProductSlugs`, `sameAs`) |
| FAQ rows everywhere | `faqs` (`scope`: general, shipping, product, category, post, page + `scopeId`) |
| Workshop, about, facts, policies | `pages` |
| Season skin, Tati captions, age stages, installments, trust, socials, NAP | `settings` (key → JSON): `season`, `tati_captions`, `age_stages`, `installments`, `free_shipping_toman`, `trust_badges`, `enamad`, `safety_points`, `socials`, `nap` |
| 301s after slug changes | `redirects` |

**Additions this concept needs** (one migration, `0001_storybook.sql`; all nullable or defaulted, so the Phase 1 seed and the Phase 2 CMS stay compatible):

| Table | Add | Why |
|---|---|---|
| `media` | `kind` (`illustration` \| `cutout` \| `photo` \| `video` \| `doc`), `credit`, `focal_x`, `focal_y` | The Stage treatment (§2.5) and art-directed crops |
| `products` | `illustration_props` JSON, `assembly_minutes` | Parametric drawings, and the «زمان نصب» line |
| `posts` | `quick_answer` TEXT, and `answer` + `report` in the `format` union | The «جواب کوتاه» bubble (the AEO target) and original-data posts |
| `faqs` | `featured` BOOLEAN | Which questions appear on the home page |
| `community_photos`, `reviews` | `consent_at` TIMESTAMP | Nothing with a child in it renders without recorded consent |
| new | `carts`, `cart_items` (cookie id → product, variant, qty) | The no-JS cart; becomes `orders` in Phase 2 |
| new | `search_index` (FTS5 virtual table, `unicode61 remove_diacritics 2`, kept in sync by triggers) | `/search` |
| new | `vitals` (route, metric, value, rating, at) | RUM for the Phase 2 dashboard |

**Body content stays Markdown,** as the schema intends. Rich blocks are written as GFM directives, for example `:::callout{kind="montessori"}`, `:::product{slug="pikler-triangle-ramp"}`, `:::keyfacts`, `:::steps`, and `:::agechart{min=8 max=48}`. One remark/rehype pipeline renders them to React server components, and **the same parsed tree generates the JSON-LD** (FAQ, HowTo steps, `mentions`), so the visible content and the schema can't drift apart. The Phase 2 CMS edits Markdown with a block toolbar that inserts these directives.

## Appendix B: Routes and source layout

```
src/app/
  layout.tsx                 html lang="fa" dir="rtl" · fonts.ts variables · theme/motion inline script · Thread + Tati
  fonts.ts                   next/font/local: Estedad, Ario (preload) · Mikhak (no preload)
  page.tsx                   home (12 sections) · ensureStatic = 'navigation'
  (static)/layout.tsx        ensureStatic = 'navigation' for everything below
  (static)/age/[range]/page.tsx              5 hubs: products + guides + FAQ
  (static)/product/[slug]/page.tsx           (+ variant radios, sticky buy bar)
  (static)/mag/page.tsx · mag/[slug]/page.tsx · mag/topic/[cluster]/page.tsx
  (static)/glossary/page.tsx · glossary/[term]/page.tsx · team/[slug]/page.tsx · faq/page.tsx
  (static)/workshop/page.tsx · about/page.tsx · about/facts/page.tsx · installments/page.tsx
  shop/page.tsx · shop/[category]/page.tsx    ensureStatic = 'shell' (filters read searchParams)
  search/page.tsx · cart/page.tsx · not-found.tsx («نخ از دستمون در رفت!»)
  media/[...path]/route.ts (exists) · api/suggest/route.ts · api/vitals/route.ts
  sitemap.ts · robots.ts · manifest.ts · llms.txt/route.ts · feed.xml/route.ts
src/proxy.ts                 301s from the cached `redirects` map
src/fonts/                   estedad/ · ario/ · mikhak/ · LICENSES/ · PROVENANCE.md (see docs/FONTS.md)
src/components/
  ui/            Button(WoodBlock) · HexChip · Stage · PriceTag · InstallmentWheels · Callout · Bubble · Dialog · Thread · IntentLink · Kashida
  layout/        Header · BottomShelf · ContentsMenu · MegaLid · CartDrawer · Footer(Endpapers) · Breadcrumbs(Beads)
  home/          Cover · ToyShelf · HeightDoor · PullTrain · MomQuestions · Notebook · Workshop · WoodLayers · FridgeDoor · FourWheels · Faq · TheEnd
  shop/          ProductCard · FilterRail · FilterSheet · Gallery · VariantPicker · AgeRuler · Blueprint · BuyBar
  mag/           ArticleHero · QuickAnswer · Tldr · TocBeads · KeyFacts · ProductEmbed · AuthorBox · Sources · GlossaryCard · Markdown(directives)
  illustrations/ Tati · Ply · scenes/* · products/* · lettering/* · icons/*
src/db/          schema.ts (exists) · index.ts (exists: WAL pragmas, one connection) · seed/*.ts · queries/*.ts (all "use cache" + cacheTag)
src/lib/         format.ts (exists: toFaDigits, formatToman, tomanToRial, installments, formatAgeRange, formatJalali, normalizeFa)
                 paths.ts (exists: UPLOAD_DIR, mediaUrl) · seo/{jsonld.ts, metadata.ts} · media-loader.ts · springs.ts
```

## Appendix C: Implementation snippets

**Tokens (Tailwind v4)**
```css
@import "tailwindcss";
@custom-variant shab (&:where([data-theme="shab"], [data-theme="shab"] *));
@theme {
  --color-shir:#FBF6EC; --color-kahgel:#EFE3CF; --color-takhte:#E6CFA6; --color-asal:#C8955A;
  --color-gerdu:#33251B; --color-gerdu-narm:#6B5545; --color-anar:#B23A26; --color-zardchube:#F2B93B;
  --color-nana:#D7EBDA; --color-pesteh:#3E6A4C; --color-firuzeh:#1F6E77; --color-shab:#1B2040;
  --radius-block:1rem; --radius-card:1.5rem; --radius-scene:2.5rem;
  --ease-settle:linear(0,.149,.428,.694,.883,.995,1.043,1.052,1.043,1.028,1.015,1.005,1,.998,.997,.998,1);
}
/* fonts: next/font exposes --ff-*; Tailwind tokens wrap them (docs/FONTS.md §5.5) */
@theme inline {
  --font-sans:    var(--ff-body), system-ui, "Segoe UI", Tahoma, sans-serif;
  --font-display: var(--ff-display), var(--ff-body), system-ui, sans-serif;
  --font-hand:    var(--ff-hand), var(--ff-body), system-ui, sans-serif;
}
/* semantic layer: components use --bg/--fg/--surface, never raw hex */
:root{ --bg:var(--color-shir); --fg:var(--color-gerdu); --surface:var(--color-kahgel); --cta:var(--color-anar); --on-cta:#fff; }
@media (prefers-color-scheme: dark){ :root:not([data-theme="roz"]){ --bg:#1B2040; --fg:#F5E8C6; --surface:#262C55; --cta:#E5715A; --on-cta:#1B2040; } }
:root[data-theme="shab"]{ --bg:#1B2040; --fg:#F5E8C6; --surface:#262C55; --cta:#E5715A; --on-cta:#1B2040; }
html{ font-family:var(--font-sans); font-synthesis:none; font-feature-settings:"ss01"; } /* Estedad round dots = beads */
:where(:lang(fa),[dir="rtl"]){ letter-spacing:0; }
body{ background:var(--bg); color:var(--fg); line-height:1.85; }
.font-display{ font-weight:400; line-height:1.25; font-feature-settings:"ss02"; } /* Ario swash ک/گ */
.font-hand{ line-height:1.55; }
```

**Ply type (painted face, raw edge)**
```css
.ply-type{ font-family:var(--font-display); color:var(--color-anar); line-height:1.25; padding-block-end:.12em;
  text-shadow:0 1px 0 #E9D3AC,0 2px 0 var(--color-asal),0 3px 0 #E9D3AC,0 4px 0 #9C6B3A,0 12px 20px rgb(51 37 27/.16); }
```

**The kashida pull (Mikhak `KSHD` axis; DOM text stays «تاتی», never «تـــاتی»)**
```css
@property --kshd{ syntax:"<number>"; inherits:true; initial-value:120; }
.kashida{ display:inline-block; contain:layout; font-family:var(--font-hand);
  font-variation-settings:"KSHD" var(--kshd); }               /* only KSHD here; weight stays in font-weight */
@media (prefers-reduced-motion:no-preference){
  :root:not([data-motion="reduce"]) .kashida.is-pulled{ animation:pull 620ms var(--ease-settle); }
}
@keyframes pull{ 0%{ --kshd:120 } 45%{ --kshd:200 } 100%{ --kshd:120 } }
```

**Tati on the thread (zero JS, compositor-driven)**
```css
.tati-rider{ position:fixed; inset-block-start:calc(var(--header-h) - 22px); inset-inline-start:8px; width:40px; }
@media (prefers-reduced-motion:no-preference){
  @supports (animation-timeline: scroll()){
    :root:not([data-motion="reduce"]) .tati-rider{ animation:ride linear both; animation-timeline:scroll(root block); }
    :root:not([data-motion="reduce"]) .tati-rider .wheel{ animation:spin linear both; animation-timeline:scroll(root block); transform-box:fill-box; transform-origin:center; }
  }
}
@keyframes ride{ to{ translate:calc(-100vw + 56px) 0; } }   /* RTL: travels toward inline-end (left) */
@keyframes spin{ to{ rotate:-2880deg; } }                    /* rolling left = counter-clockwise */
```

**Mobile sticky buy bar driven by the main CTA's visibility (zero JS)**
```css
.buy-bar{ position:fixed; inset-inline:0; inset-block-end:0; }      /* fallback: always visible */
@supports (animation-timeline: view()){
  body{ timeline-scope:--buy; }
  .pdp-cta{ view-timeline:--buy block; }
  .buy-bar{ animation:bar-in linear both; animation-timeline:--buy; animation-range:exit 0% exit 100%; }
}
@keyframes bar-in{ from{ translate:0 110%; } to{ translate:0 0; } }
```

**Height-mark door: CSS-first, View Transition enhanced**
```tsx
// server: <input type="radio" name="age" id="age-1-2-years" value="1-2-years" className="sr-only peer" /> <label htmlFor="age-1-2-years">۱ تا ۲ سال</label>
// css:    .door:has(#age-1-2-years:checked) [data-stage~="1-2-years"]{ opacity:1; scale:1; }
// client (0.5 KB):
"use client";
import { useEffect } from "react";
export function AgeRoomVT() {
  useEffect(() => {
    const el = document.getElementById("height-door");
    const onClick = (e: MouseEvent) => {
      const label = (e.target as HTMLElement).closest("label[for^='age-']");
      if (!label || !document.startViewTransition) return;
      e.preventDefault();
      const input = document.getElementById(label.getAttribute("for")!) as HTMLInputElement;
      document.startViewTransition(() => { input.checked = true; history.replaceState(null, "", `?age=${input.value}#height-door`); });
    };
    el?.addEventListener("click", onClick);
    return () => el?.removeEventListener("click", onClick);
  }, []);
  return null;
}
```

**Money, installments, and dates (the helpers already in `src/lib/format.ts`)**
```tsx
import { formatToman, tomanToRial, installments, formatJalali } from "@/lib/format";

<data value={price}>{formatToman(price)}</data>                     // ۳٬۴۵۰٬۰۰۰ تومان
<span className="tabular-nums">{formatToman(installments(price))}</span>  // ۸۶۳٬۰۰۰ تومان (rounded up to 1,000)
<time dateTime={d.toISOString().slice(0, 10)}>{formatJalali(d)}</time>   // ۲۴ مهر ۱۴۰۵
offers: { "@type": "Offer", price: String(tomanToRial(price)), priceCurrency: "IRR" }  // JSON-LD
```

**Page turn, mirrored for a Persian book (forward = the old page lifts toward the right)**
```css
::view-transition-old(.turn-forward){ animation:turn-out 420ms var(--ease-page) both; transform-origin:right center; }
::view-transition-new(.turn-forward){ animation:reveal-in 420ms var(--ease-page) both; }
/* .turn-back plays the same pair in reverse: the page comes back from the right */
@keyframes turn-out{ to{ translate:12% 0; rotate:y 8deg; opacity:.2; } }      /* toward inline-start (right) */
@keyframes reveal-in{ from{ translate:-4% 0; opacity:.6; } }                   /* revealed from inline-end (left) */
::view-transition-group(site-header), ::view-transition-group(tati){ animation:none; }
```

---

**In one sentence for the judges:** Duck's Journey turns the brand's own logo, material, and Instagram voice into a pop-up plywood storybook. A toddler's pull-toy becomes the site's navigation, its progress bar, and its story. It is built so that the most emotional website in its category is also one of the fastest: every scene is server-rendered SVG and CSS, and the home page loads about 10 KB of our own JavaScript.
