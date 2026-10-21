# DESIGN-STUDIO.md — the «Studio» direction (current)

Status: **current visual direction** (2026-10-21). It replaces the storybook look described in
`docs/DESIGN.md` §1–§5 and §9. DESIGN.md still documents the information architecture, content
blocks, copy rules, honesty rules and performance budgets, which carry over unchanged.

## Idea

A premium, quiet shop in the manner of apple.com: the products do the talking. Every product is
shown as a **studio render built from its real dimensions** (the parts manifests in
`src/components/illustrations/manifests`), lit like a product photo, on white, studio-grey or
black tiles. Big, heavy, tight Persian headlines; one line of copy; two actions. No ornament.

## Tokens (src/app/globals.css)

- Neutrals: page `#FFFFFF`, tiles `#F5F5F7`, ink `#1D1D1F`, secondary `#6E6E73`, hairline `#D2D2D7`.
- Night tiles/sections: `.theme-night` (black, `#F5F5F7` text, `#86868B` secondary).
- Links `--link` walnut `#8A5A2B`; eyebrow «جدید/محبوب» `--eyebrow` `#B64400`; installments `--success`.
- Type: **Estedad only** — 400–500 text, 800–900 headlines (`headline` utility), never tracked.
- Pills: primary = ink fill / white text; ghost = link-colour ring. `pill()` in `components/studio/Actions`.
- Radii: tiles 1.75rem, cards 1.5rem, buttons full pills. Shadows: none (renders carry their own).
- Dark mode follows the OS (or `html[data-theme]`); the old token names still exist and map here.

## Imagery pipeline

1. `/studio` (dev only) renders every manifest with three.js: birch veneer + ply-edge materials,
   studio lighting, contact shadow, ambient occlusion → `public/renders/raw/*.png`
   ("render all" button; angles hero, front, side, top, low, hero-exploded, hero-white).
2. `npx tsx scripts/renders/optimize.mts` trims and converts them to `public/renders/*.webp` and
   writes `src/components/studio/renders.json` (intrinsic sizes).
3. Pages use `<Render productKey angle box>` (next/image → AVIF/WebP). `illustrationUrl()` for
   assembled/exploded views also resolves to the renders, so older components follow.
4. Real photography later: upload to `/media` and the product media takes precedence.

## Live 3D

- `AssemblyCanvas` (home): the learning tower assembles itself as the section scrolls.
- `ProductViewer` (product page): drag to turn, exploded view, finish switch.
- three.js loads only when the section nears the viewport, never on reduced-motion/lite devices;
  the still render is always the poster and the no-JS frame.

## Page patterns

- **Global nav**: 48px glass bar, small links, search, bag; phones get a full-screen popover menu.
- **Home**: hero product tile → black tile → 2-up tile grid (grey/black checkerboard) → scroll
  story (3D assembly) → «چرا چوبز؟» → ages → full room → magazine.
- **Product page**: sticky local nav (name · sections · «خرید») → hero → summary statement →
  feature statements with alternate render angles → «از هر زاویه ببینید» 3D → dimensions drawing →
  buy section (variants, price, installments, add to bag, delivery/warranty/returns) → specs → box,
  safety, care → FAQ → guides → related.
- **Shop / category**: large headline + category strip with renders → product tiles + filters.
- **Footer**: quiet grey band, fine print first, dense link columns, legal line.
- **Content and policy pages** (glossary, FAQ, workshop, installments, policies, reviews, gallery,
  topic hubs, search): centred or start-aligned `headline` H1 with an `eyebrow` above; grey
  `bg-surface` cards (1.5–1.75rem radius) instead of paper, kraft or sticky-note surfaces; FAQ
  as a hairline accordion; chips are hairline pills that fill with ink when chosen.
- **404**: `app/(site)/not-found.tsx` (inside the site layout) and `app/global-not-found.tsx` (URLs
  that match no route, with its own chrome). Keep the shared `NotFoundPage` light: Next embeds the
  not-found tree in every page's RSC payload.

## Share cards (src/lib/og.ts)

White 1200×630 card: masthead, eyebrow-coloured kicker and Estedad Bold title at the inline start,
the page's product render on a grey tile at the inline end. Product, category, room and article
routes have their own `opengraph-image`; every other page restates the site card through
`pageMetadata()` (never pass an empty `openGraph.images` key: Next then drops file-based images).
