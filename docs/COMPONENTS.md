# Component & module inventory (shared layer)

Everything below already exists — **use it, don't rebuild it**. Read a file before using it (props types live there).
The list at the bottom is generated from the source exports; the notes here are the behaviours you must know.

## Must-know behaviours and contracts

**Shell & layout**
- `(site)/layout.tsx` already renders `SiteShell` (skip links, header with Tati thread, `<main id="main">`, night footer, mobile dock, CartProvider, Toaster, cart drawer). **Pages must NOT render their own `<main>`.** Wrap page content in `PageTurn` from `@/components/layout/PageTurn`.
- Breadcrumbs: `Breadcrumbs({ items })` with `crumbTrail(...items)` (home is prepended) — pass the same list to `breadcrumbNode()` from `@/lib/jsonld` so visible names and markup match. Every page except home shows them above the H1.
- Global classes other code relies on: home Cover root must have class **`cover`**, TheEnd root **`the-end`** (Tati rider hop/leave timelines); the 404 must render an element with class **`page-404`** (hides the rider).
- The product page buy bar root must carry **`data-buybar`** and the price block **`data-price-timeline`** (the dock hides/turns when a buy bar is present; `--price` view timeline drives the face swap).
- The header search field appears ≥ 1280px; below that the search icon opens the dialog.
- Toasts from inside a modal `<dialog>`: use `pushToastHost(name)` / `popToastHost(name)` + `<Toaster host="name" />`.

**Cart**
- `AddToCartButton({ items, size?: 'icon'|'sm'|'md'|'lg', label?, className?, toastLabel?, disabled? })` (client). `items` is one or many `Omit<CartItem,'key'|'qty'>` (`CartItem.priceToman` is per unit **including** add-ons). It hops a picture to `[data-cart-target]`. Inside a dialog marked `[data-close-dialog-on-add]` it should close the dialog after adding.
- Store: `useCart()` → `{ items, count, subtotal, status, ready, persistent }`; `addItems`, `setQty`, `removeItem`, `restoreItem`, `clearCart`. `openCart()` from CartProvider.

**UI primitives** (`@/components/ui/*`)
- `Icon` names are a strict union (`ICON_NAMES`, `isIconName()` guard for strings from data). `chevron-*`/`arrow-*` icons mirror themselves in RTL — **do not** add `rtl:-scale-x-100`.
- `Button` default variant is `secondary`; with `href` it renders `Link` (or `<a>` for external/`#`/`tel:`/`mailto:`). `buttonClasses()` styles other elements as buttons. `IconButton` requires `label`.
- Every installment component (`InstallmentBadge`, `InstallmentLine`, `InstallmentWheels`) requires `snapppay` (from `getSettings()`); renders nothing if null/disabled/out of range. `installmentPlan(price, snapppay)` is the shared calculator. Wheels expose `[data-wheel]`, `[data-installment-amount]` and `data-spin` (quarter turn) for RoomTotals.
- `Stage` = `{ kind:'illustration', illustration, view?, finish?, hoverView? } | { kind:'cutout'|'photo', src, width, height, dominantColor?, sizes? }` + `alt, slug, priority?, vtName?, children`.
- `Sheet({ id, title, … })` + `sheetInvokerProps(id)` (spread on any button to open) + `SheetClose`. Closing works without JS.
- `HexChip` is a radio (`name`,`value`) or a toggle button (`pressed`); `tint` = age stage key, accent key or `'wood'`.
- `Price({ price, compareAt?, from?, size?, showDiscount? })`, `StockBadge({ availability, leadTimeDays?, variant? })`, `AgeBadge({ min, max?, link? })`, `SampleBadge`, `StampBadge({ tone? })`, `KraftTag`, `Bubble({ as?, tail?, size? })`, `SectionHeader({ title, id?, as?, size?: 'home'|'content', kicker?, kickerTone?, kickerDoodle?, kickerDecorative?, swash?, plyType?, sub?, link?, align? })`, `Kicker`, `Mark({ paint? })`, `Kashida({ trigger?: 'view'|'hover'|'checked'|'manual'|'none', stretch? })`, `AskChoobz({ socials, compact?, title?, hours? })`, `EnamadBadge({ enamad, eager? })`, `InlineScript({ html })`, `IntentLink` (client), `TabularNumber` (keeps «٬» proportional inside tabular digits).

**Cards** (`@/components/shop/*`, `@/components/mag/*`; data in `@/db/queries/cards`)
- `ProductCard({ product, priority?, prefetch?, showCategory?, seasonalStamp? })` (async; reads settings; carries FilterBar `data-*` attributes; per-card variant sheet). **A product may appear only once per page** (`product-{id}` morph names must be unique); same for `post-{id}`.
- `CategoryCubby({ category, compact?, morph? })`, `RoomCard({ room })` (async), `ArticleCard({ post, size?: 'md'|'lg', prefetch? })`, `TermCard({ term })`.
- `@/db/queries/cards`: `listArticleCards({ topicSlug?, featured?, pillar?, ageMin?, ageMax?, offset?, limit? })` (newest first), `countArticleCards(q)`, `getArticleCardsBySlugs`, `listRoomCards()` (`RoomCardData` with pieces, `totalToman`, `installmentToman` over default-on pieces), `listTermCards()` (Persian alphabetical), `listVariantOptions()`.

**Drawings & brand** (`@/components/illustrations/*`)
- `PartsRenderer({ manifestKey, view: 'assembled'|'exploded'|'ortho'|'flat', layered?, finish?, platformLevel?, pose?, className? })` inline SVG (theme variables kept). `layered` → `div[data-parts-stage]` with one `span[data-part]` per part carrying `--ex`, `--ey` (%) and `--i`; the caller's CSS does the explode (`translate: var(--ex) var(--ey)`), hides `[data-state="assembled"]` layers and shows `[data-state="exploded"]` ones (dowel lines) when exploded.
- Static files: `/illustrations/{key}-{assembled|exploded|ortho|flat}.svg` (+ `-white` for learning-tower and pikler-triangle, `pikler-arch-assembled-rocker.svg`). Use `illustrationUrl()` + `illustrationSize(key, view?, pose?)` for `<img width height>`. `orthoLabels(key)` → `{ key, label (Persian digits), name?, valueCm, axis, x, y }[]` (% of the ortho viewBox) for HTML dimension labels; `illustrationFrame()`, `orthoFrame()` (floor line + elevation extents for the peg-doll scale view), `illustrationSource()` (`measured`|`dxf` → stage caption «طرح از روی ابعاد واقعی» / «طرح دقیق از روی نقشهٔ برش»), `hasFinish()`. `getManifest(key)` — learning-tower has `anchors.engravePlate`.
- The coloured rainbow variant has no drawing yet: keep the natural drawing for it.
- Tati: `TatiPose({ pose, size?, scarf?, string?, className? })` (root is a `<span>`, always aria-hidden, wheels are `span.wheel.wheel--front|--back`); the cover should pass `string={false}` and draw its own string from `STRING_ANCHOR` (`tati/geometry`). `TatiRider()` is already in the header. On night scenes (TheEnd, footer) override `--ink`/`--wood` on a wrapper so Tati reads on dark.
- `Wordmark({ className?, withMark?, stacked? })` (currentColor; size with CSS). Lettering: `YekiBud`, `GhesseTamoom`, `NakhDarRaft` (aria-hidden; `LETTERING` has the plain text to render alongside). `YaldaScarf({ pose })`, `Pomegranate({ split? })`, `EndpaperPattern`.
- Rooms: `RoomBackdrop({ variant?: 'default'|'small', showKitchen?, doorMarks?, className? })` must fill a **4:3** box; `DOOR_MARKS` (label positions in %), `ROOM_VIEWBOX`, `ROOM_FLOOR_Y`. `placeOnStage(slot, widthCm, heightCm, { depthCm?, footCm? })` → `{ left, bottom, width, aspectRatio, zIndex }` where widthCm/heightCm are the **drawing's** size ÷ 10 (`illustrationSize(key,'assembled')`), depthCm the product depth, `footCm = (frame.height - originY) / 10` from `illustrationFrame()` (RoomCard uses exactly this — keep room scenes consistent). `placePerson(slot, heightCm, variant?)`, `wallLineTop(heightCm)` (70 cm eye line). `PegDoll({ heightCm, variant?, tint?, className?, style? })` scales from its feet with `--child-cm` on an ancestor.

**Content rendering** (`@/components/mag/Prose`, `@/lib/markdown`)
- `Prose({ markdown, variant?: 'article'|'product'|'page'|'compact', glossaryLinks?, slug?, excludeTerms?, className? })` async + cached. It sets no width — wrap article bodies in `max-w-prose`. Pass `slug` when a body can contain a checklist. Headings get the author `{#id}` anchors.
- `@/lib/markdown`: `resolveHref`, `extractHeadings(md)` (same ids as rendered, for the TOC), `extractSteps(md)` (for `howToNode`), `markdownToPlain`, `stripDirectives`, `lintMarkdown`.

**SEO** (`@/lib/seo`, `@/lib/jsonld`, `@/lib/torob`, `@/lib/og`)
- `pageMetadata({ title, description, path, image?, type?, publishedTime?, modifiedTime?, noindex?, other?, suffix?, markdownPath?, authors?, section?, tags? })` adds « | چوبز کیدز» when it fits; noindex pages get no canonical.
- The root layout already emits OnlineStore (with shipping/return policy), Brand and WebSite on every page — page graphs **reference them by `@id`** (`ids.*`, `ref()`), never re-emit. Builders: `webPageNode`, `breadcrumbNode`, `itemListNode`, `collectionNodes`, `productNodes(product, { settings, … })`, `articleNodes(post, { … })`, `faqNode(faqs, path)`, `howToNode`, `videoNode`, `definedTermNode`, `definedTermSetNode`, `profileNodes`, `graph(...)`, `JsonLd({ data })`.
- Variant URLs are `?variant={id}` when `urlParam` is empty (all seed rows) — the variant picker must preselect from `?variant=`.
- Product pages: `getPriceValidUntil()` from `@/db/queries/seo`; Torob tags: `pageMetadata({ other: torobMeta(product) })`. Glossary noindex gate: `isTermIndexable()` / `listIndexableTermSlugs()`.
- OG images: in `opengraph-image.tsx` export `alt`, `size`, `contentType` and `return ogResponse(title, kicker, tags)` (sharp + Pango, correct Persian).

**Data**
- `getSettings()`, `listProductCards()`, `getProductCardsBySlugs()`, `listFeaturedProductCards()`, `listCategories()` (catalog), `getNavData()` (nav), `listGlossaryLinkTerms()`, search in `@/db/queries/search` (request-time, not cached).
- `settings.age_hubs` holds the age-hub editorial: `{ slug, intro (md), sections: [{ anchor, milestone, tips[] }], sources[] }[]`. FAQs: scope `general` (scopeKey `buying`) / `shipping` (scopeKeys `shipping|installments|returns|safety`) / `age` (scopeKey hub slug) / `room` / `product` / `category` / `post` / `page`; `featured` marks the home six.
- Seed sample reviews are `isSample` — show only when `!IS_PRODUCTION_CONTENT`, with `SampleBadge`, never as `Review` markup.

## Generated export list

- **`@/components/illustrations/EndpaperPattern`**: `ENDPAPER_TILE`; `EndpaperPattern`({ className }: { className?: string })
- **`@/components/illustrations/PartsRenderer`**: `PartsView` (type); `PartsRendererProps` (type); `PartsRenderer`({ manifestKey, view, layered = false, finish, platformLevel, pose, className, }: PartsRendererProps)
- **`@/components/illustrations/PegDoll`**: `PegDollVariant` (type); `PegDollTint` (type); `pegDollWidthCm`(variant: PegDollVariant, heightCm: number); `PegDoll`({ heightCm, variant = "child", tint, className, style }: PegDollProps)
- **`@/components/illustrations/RoomKit`**: `ROOM_VIEWBOX`; `ROOM_FLOOR_Y`; `OBLIQUE`; `ROOM_DOOR`; `DoorMark` (type); `DOOR_MARKS`; `RoomBackdrop`({ variant = "default", showKitchen = true, doorMarks = false, className }: RoomBackdropProps)
- **`@/components/illustrations/Wordmark`**: `Wordmark`({ className, withMark = true, stacked = false }: WordmarkProps)
- **`@/components/illustrations/project`**: `add3`; `sub3`; `scale3`; `dot3`; `cross3`; `len3`; `unit3`; `add2`; `sub2`; `scale2`; `dot2`; `cross2`; `len2`; `unit2`; `perp2`; `OBLIQUE_DX`; `OBLIQUE_DY`; `S`([x, y, z]: Vec3); `Projection` (type); `OBLIQUE`; `FRONT`; `SIDE`; `shifted`(p: Projection, shift: Vec2); `projectDir`(p: Projection, v: Vec3); `project`(p: Projection, v: Vec3); `PlaneAxes` (type); `planeAxes`(plane: Plane); `Affine` (type); `planeMatrix`(axes: Pick<PlaneAxes, "u" | "v">, origin: Vec3, proj: Projection = OBLIQUE); `applyAffine`(m: Affine, [x, y]: Vec2); `fmt`(n: number, digits = 1); `nums`(values: readonly number[], digits = 1); `roundedPolygon`(points: readonly Vec2[], radius: number | readonly number[] = 3); `rrect`(x: number, y: number, w: number, h: number, r = 3); `stadium`(from: Vec2, to: Vec2, width: number); `circle`(cx: number, cy: number, r: number); `archBand`(opts: { cx: number; cy: number; outer: number; inner: number; floor?: number; r?: number }); `SlatAxis` (type); `slatAxis`(foot: Vec2, top: Vec2, width: number, side: "left" | "right"); `slat`(foot: Vec2, top: Vec2, width: number, side: "left" | "right", footRadius = 4); `arcLine`(cx: number, cy: number, r: number, a0: number, a1: number); `grainLines`(lines: readonly (readonly [number, number, number, number, number?])[]); `joinPaths`(...paths: readonly (string | false | null | undefined)[]); `Polyline` (type); `samplePath`(d: string); `Box` (type); `emptyBox`(); `growBox`(box: Box, [x, y]: Vec2); `boxOf`(points: readonly Vec2[]); `unionBox`(a: Box, b: Box); `convexHull`(points: readonly Vec2[])
- **`@/components/illustrations/render`**: `FINISHES`; `finishVars`(finish?: string); `RenderOptions` (type); `OrthoLabel` (type); `OrthoFrame` (type); `Drawing` (type); `Layer` (type); `LayeredDrawing` (type); `renderDrawing`(m: Manifest, view: View, opts: RenderOptions = {}); `renderSvgFile`(m: Manifest, view: View, opts: Omit<RenderOptions, "palette" | "idPrefix"> = {}); `renderLayers`(m: Manifest, opts: RenderOptions = {}); `DRAWING_CLASS`
- **`@/components/illustrations/sizes`**: `IllustrationView` (type); `IllustrationFrame` (type); `OrthoLabel` (type); `OrthoFrame` (type); `illustrationFrame`(key: string, view: IllustrationView = "assembled", pose?: string); `illustrationSize`(key: string, view: IllustrationView = "assembled", pose?: string); `orthoLabels`(key: string); `orthoFrame`(key: string); `illustrationSource`(key: string); `hasFinish`(key: string, finish: string | null | undefined)
- **`@/components/illustrations/lettering/GhesseTamoom`**: `GhesseTamoom`({ className }: LetteringProps)
- **`@/components/illustrations/lettering/Lettering`**: `LETTERING`; `LetteringProps` (type); `Lettering`({ children, className }: { children: ReactNode; className?: string })
- **`@/components/illustrations/lettering/NakhDarRaft`**: `NakhDarRaft`({ className }: LetteringProps)
- **`@/components/illustrations/lettering/YekiBud`**: `YekiBud`({ className }: LetteringProps)
- **`@/components/illustrations/manifests/index`**: `manifests`; `ManifestKey` (type); `MANIFEST_KEYS`; `isManifestKey`(key: string); `getManifest`(key: string | null | undefined)
- **`@/components/illustrations/manifests/kids-table-chair`**: `tableChairShapes`
- **`@/components/illustrations/manifests/rainbow-stacker`**: `standingArc`(cx: number, outer: number, inner: number, r = 3); `arcSeam`(cx: number, r: number)
- **`@/components/illustrations/manifests/types`**: `Vec2` (type); `Vec3` (type); `View` (type); `Plane` (type); `Tone` (type); `Detail` (type); `PanelPart` (type); `ExtrusionPart` (type); `RodPart` (type); `CordPart` (type); `Part` (type); `DimKey` (type); `DimSpec` (type); `Dowel` (type); `Manifest` (type)
- **`@/components/illustrations/manifests/wooden-blocks`**: `blockShapes`
- **`@/components/illustrations/season/YaldaProps`**: `YaldaScarf`({ pose, className }: { pose: TatiPoseName; className?: string }); `Pomegranate`({ split = true, className }: { split?: boolean; className?: string })
- **`@/components/illustrations/tati/TatiBody`**: `INK_LINE`; `TatiBody`({ pose, string = true, className }: TatiBodyProps)
- **`@/components/illustrations/tati/TatiPose`**: `TatiPose`({ pose, size, scarf = false, string = true, className }: TatiPoseProps)
- **`@/components/illustrations/tati/TatiRider`**: `TatiRider`()
- **`@/components/illustrations/tati/TatiWheel`**: `TatiWheel`({ className }: { className?: string }); `TatiEye`({ className }: { className?: string })
- **`@/components/illustrations/tati/geometry`**: `TatiPoseName` (type); `Point` (type); `ARTBOARD`; `FLOOR_Y`; `HEAD_RADIUS`; `WHEELS`; `FAR_WHEELS`; `STRING_ANCHOR`; `PLATFORM`; `LEAN_PIVOT`; `POSES`; `rotatePoint`([x, y]: Point, deg: number, [px, py]: Point); `duckOutline`(head: Point); `BELLY_HIGHLIGHT`; `BODY_GRAIN`; `WING`; `BEAK`; `EYE_OFFSET`; `EYE_RADIUS`; `headPoint`(pose: PoseSpec, local: Point); `eyeCenter`(pose: TatiPoseName); `SLEEP_MARKS`; `artboardBox`(cx: number, cy: number, size: number)
- **`@/components/layout/BackToTop`** (client): `BackToTop`({ className }: { className?: string })
- **`@/components/layout/BottomDock`**: `BottomDock`()
- **`@/components/layout/Breadcrumbs`**: `HOME_CRUMB`; `crumbTrail`(...items: BreadcrumbItem[]); `Breadcrumbs`({ items, className }: BreadcrumbsProps)
- **`@/components/layout/DrawingImg`**: `DrawingImg`({ illustration, size, alt = "", className }: DrawingImgProps)
- **`@/components/layout/Endpapers`**: `Endpapers`()
- **`@/components/layout/HeaderNav`**: `HeaderNav`({ nav, className }: { nav: NavData; className?: string })
- **`@/components/layout/HexLink`**: `HexLink`({ href, tint, children, className }: HexLinkProps)
- **`@/components/layout/HoverIntent`** (client): `HoverIntent`()
- **`@/components/layout/InvokerPolyfill`** (client): `InvokerPolyfill`()
- **`@/components/layout/MegaMenu`**: `MegaTrigger`({ target, children }: { target: string; children: ReactNode }); `navItemClasses`; `MegaPanel`({ id, title, children }: { id: string; title: string; children: ReactNode }); `ShopPanel`({ nav }: { nav: NavData }); `AgePanel`({ nav }: { nav: NavData }); `MagPanel`({ nav }: { nav: NavData })
- **`@/components/layout/MenuDialog`**: `MENU_DIALOG_ID`; `MenuDialog`({ nav }: { nav: NavData })
- **`@/components/layout/MotionToggle`** (client): `MotionToggle`({ className }: { className?: string })
- **`@/components/layout/NavDismiss`** (client): `NavDismiss`()
- **`@/components/layout/NavIcons`**: `NavIconName` (type); `NavIcon`({ name, className }: { name: NavIconName; className?: string }); `CartGlyph`({ parcels, className }: { parcels: number; className?: string })
- **`@/components/layout/NavLink`** (client): `NavLink`({ href, match = "prefix", also, homeHref, ...props }: NavLinkProps)
- **`@/components/layout/PageTurn`**: `PageTurn`({ children }: { children: ReactNode })
- **`@/components/layout/SearchDialog`**: `SEARCH_DIALOG_ID`; `SearchDialog`()
- **`@/components/layout/SearchForm`**: `SearchForm`({ id, layout = "popup", autoFocus, className }: SearchFormProps)
- **`@/components/layout/SearchInput`** (client): `SEARCH_PLACEHOLDER`; `SearchInput`({ id, layout = "popup", autoFocus, className }: SearchInputProps)
- **`@/components/layout/SearchSuggest`** (client): `SearchSuggestProps` (type); `SearchSuggest`({ inputRef, listId, layout, initialQuery, initiallyOpen }: SearchSuggestProps)
- **`@/components/layout/SiteFooter`**: `SiteFooter`({ nav }: { nav: NavData })
- **`@/components/layout/SiteHeader`**: `SiteHeader`({ nav }: { nav: NavData })
- **`@/components/layout/SiteShell`**: `SiteShell`({ children }: { children: ReactNode })
- **`@/components/layout/SkipLinks`**: `SkipLinks`()
- **`@/components/layout/ThemeScript`**: `ThemeScript`()
- **`@/components/layout/ThemeToggle`** (client): `ThemeToggle`({ variant = "switch", className }: ThemeToggleProps)
- **`@/components/layout/Toaster`** (client): `ToastAction` (type); `toast`(message: string, action?: ToastAction, icon: IconName = "check"); `dismissToast`(id?: number); `pushToastHost`(host: string); `popToastHost`(host: string); `Toaster`({ host = PAGE_HOST, className }: ToasterProps)
- **`@/components/layout/invokers`**: `installInvokerFallbacks`({ commands, closedBy }: { commands: boolean; closedBy: boolean })
- **`@/components/layout/preferences`**: `useLullaby`(); `setLullaby`(dark: boolean); `CalmMotion` (type); `useCalmMotion`(); `setCalmMotion`(on: boolean)
- **`@/components/layout/socials`**: `SocialLinks` (type); `socialLinks`(socials: SiteSettings["socials"])
- **`@/components/layout/cart/CartButton`** (client): `cartLabel`(count: number); `CartButton`({ variant = "header", className }: CartButtonProps)
- **`@/components/layout/cart/CartDrawer`** (client): `CartDrawerProps` (type); `CartDrawer`({ config }: CartDrawerProps)
- **`@/components/layout/cart/CartLine`** (client): `CartLine`({ item, status, className }: CartLineProps)
- **`@/components/layout/cart/CartProvider`** (client): `CartConfig` (type); `useCartConfig`(); `preloadCartDrawer`(); `openCart`(); `takePendingOpen`(); `CART_OPEN_EVENT`; `CartProvider`({ config, children }: { config: CartConfig; children: ReactNode })
- **`@/components/layout/cart/CartSummary`**: `CartSummary`({ subtotal, count, config, schedule, className }: CartSummaryProps)
- **`@/components/layout/cart/EmptyCart`**: `EmptyCart`({ links, className }: { links: CartConfig["emptyLinks"]; className?: string })
- **`@/components/layout/cart/FreeShippingMeter`**: `FreeShippingMeter`({ subtotal, freeOverToman, className }: FreeShippingMeterProps)
- **`@/components/layout/cart/quote`**: `QuoteAvailability` (type); `QuoteLine` (type); `QuoteSuggestion` (type); `CartQuote` (type); `QUOTE_ENDPOINT`; `QUOTE_MAX_REFS`; `quoteRef`(productId: number, variantId: number | null); `requestQuote`( lines: readonly { productId: number; variantId: number | null }[], signal?: AbortSignal, )
- **`@/components/layout/cart/store`**: `CartAddons` (type); `CartItem` (type); `CartItemInput` (type); `LineStatus` (type); `CartState` (type); `CART_STORAGE_KEY`; `MAX_LINE_QTY`; `lineKey`(productId: number, variantId: number | null, addons?: CartAddons); `useCart`(); `getCart`(); `addItems`(input: CartItemInput | readonly CartItemInput[], opts: { qty?: number } = {}); `setQty`(key: string, qty: number); `RemovedLine` (type); `removeItem`(key: string); `restoreItem`({ item, index, addedAt: at }: RemovedLine); `clearCart`(); `applyQuote`(quote: CartQuote)
- **`@/components/mag/ArticleCard`**: `FORMAT_LABEL`; `ArticleCard`({ post, size = "md", prefetch, className }: ArticleCardProps)
- **`@/components/mag/Callout`**: `Callout`({ kind, title, children }: CalloutProps)
- **`@/components/mag/Checklist`**: `Checklist`({ slug, first, count, preticked = "", children }: ChecklistProps); `ChecklistItem`({ index, ticked, children }: { index: number; ticked?: boolean; children?: ReactNode })
- **`@/components/mag/ChecklistTicks`** (client): `ChecklistTicks`({ slug, first, count, preticked }: ChecklistTicksProps)
- **`@/components/mag/CompareTable`**: `CompareTable`({ label, labelledBy, children, className, ...rest }: CompareTableProps)
- **`@/components/mag/GlossaryLink`**: `GlossaryLink`({ href, term, definition, auto, children }: GlossaryLinkProps)
- **`@/components/mag/InlineIllustration`**: `InlineIllustration`({ name, caption, view = "assembled" }: InlineIllustrationProps)
- **`@/components/mag/MythFact`**: `MythFact`({ title, children }: { title?: string; children?: ReactNode }); `MythFace`({ side, children }: { side: MythSide; children?: ReactNode })
- **`@/components/mag/ProductEmbed`**: `embedStage`(product: ProductCardData, sizes: string); `EmbedQuickAdd`({ product, variants }: { product: ProductCardData; variants: VariantOption[] }); `pricesDiffer`; `ProductEmbed`({ slug, why }: ProductEmbedProps)
- **`@/components/mag/ProductRow`**: `ProductRow`({ slugs }: { slugs: string })
- **`@/components/mag/Prose`**: `ProseVariant` (type); `Prose`({ markdown, variant = "article", glossaryLinks = false, slug, excludeTerms, className }: ProseProps)
- **`@/components/mag/PullQuote`**: `PullQuote`({ cite, children }: { cite?: string; children?: ReactNode })
- **`@/components/mag/Steps`**: `Steps`({ children }: { count?: number; children?: ReactNode }); `Step`({ index, title, children }: { index: number; title?: string; children?: ReactNode })
- **`@/components/mag/TermCard`**: `TermCard`({ term, className }: TermCardProps)
- **`@/components/shop/AddToCartButton`** (client): `AddToCartButtonProps` (type); `AddToCartButton`({ items, size = "md", label, toastLabel, disabled, className }: AddToCartButtonProps)
- **`@/components/shop/CartPageClient`** (client): `CartPageClient`({ siteUrl }: CartPageClientProps)
- **`@/components/shop/CategoryCubby`**: `CategoryCubby`({ category, compact, morph = !compact, className }: CategoryCubbyProps)
- **`@/components/shop/ProductCard`**: `ProductCard`(props: ProductCardProps)
- **`@/components/shop/RoomCard`**: `RoomCard`({ room, className }: RoomCardProps)
- **`@/components/shop/room-slots`**: `RoomSlot` (type); `ROOM_SLOTS`; `isRoomSlot`(value: string); `StagePlacement` (type); `PlaceOptions` (type); `placeOnStage`(slot: RoomSlot, widthCm: number, heightCm: number, options: PlaceOptions = {}); `placePerson`(slot: RoomSlot, heightCm: number, variant: PegDollVariant = "child"); `wallLineTop`(heightCm: number)
- **`@/components/ui/AgeBadge`**: `ageBadgeLabel`(min: number | null | undefined, max?: number | null); `AgeBadge`({ min, max, link, className }: AgeBadgeProps)
- **`@/components/ui/AskChoobz`**: `AskChoobz`({ socials, compact, title, hours, className }: AskChoobzProps)
- **`@/components/ui/Bubble`**: `Bubble`({ children, as: Tag = "div", tail = "start", size = "md", className, ...rest }: BubbleProps)
- **`@/components/ui/Button`**: `ButtonVariant` (type); `ButtonSize` (type); `IconButtonTone` (type); `ButtonAsButton` (type); `ButtonAsLink` (type); `ButtonProps` (type); `buttonClasses`({ variant = "secondary", size = "md", tone = "raised", block, className, }: Pick<ButtonOwnProps, "variant" | "size" | "tone" | "block" | "className"> = {}); `Button`(props: ButtonProps)
- **`@/components/ui/Checkbox`**: `Checkbox`(props: PegChoiceProps)
- **`@/components/ui/Doodle`**: `DOODLE_VIEWBOX`; `DoodleName` (type); `DOODLE_NAMES`; `Doodle`({ name, className, tone = "ink" }: DoodleProps)
- **`@/components/ui/EnamadBadge`**: `EnamadBadge`({ enamad, eager, className }: EnamadBadgeProps)
- **`@/components/ui/Field`**: `FieldControlProps` (type); `fieldControlProps`(id: string, { hint, error, required }: { hint?: ReactNode; error?: ReactNode; required?: boolean }); `Field`({ id, label, hint, error, required, optional, className, children }: FieldProps)
- **`@/components/ui/HexChip`**: `HexTint` (type); `HexChipRadioProps` (type); `HexChipToggleProps` (type); `HexChipProps` (type); `HexChip`(props: HexChipProps)
- **`@/components/ui/Icon`**: `ICON_NAMES`; `IconName` (type); `isIconName`(value: string | null | undefined); `Icon`({ name, className, title }: IconProps)
- **`@/components/ui/IconButton`**: `IconButtonProps` (type); `IconButton`({ icon, label, ...rest }: IconButtonProps)
- **`@/components/ui/InlineScript`**: `InlineScript`({ html }: { html: string })
- **`@/components/ui/InstallmentBadge`**: `InstallmentBadge`({ price, snapppay, className, }: { price: number; snapppay: SnappPaySettings; className?: string; })
- **`@/components/ui/InstallmentLine`**: `InstallmentLine`({ price, snapppay, variant = "card", approximate, link = true, className, }: InstallmentLineProps)
- **`@/components/ui/InstallmentWheels`**: `InstallmentWheels`({ total, snapppay, wheelSize = 32, approximate, caption, finePrint = true, className, }: InstallmentWheelsProps)
- **`@/components/ui/IntentLink`** (client): `IntentLink`({ prefetch, onPointerEnter, onFocus, onTouchStart, ...props }: ComponentProps<typeof Link>)
- **`@/components/ui/Kashida`**: `KashidaTrigger` (type); `Kashida`({ children, trigger = "view", stretch, className }: KashidaProps)
- **`@/components/ui/Kicker`**: `Kicker`({ children, tone = "accent", doodle, decorative, as: Tag = "p", className }: KickerProps)
- **`@/components/ui/KraftTag`**: `KraftTag`({ children, size = "md", string = size === "md", as: Tag = "span", className }: KraftTagProps)
- **`@/components/ui/Mark`**: `Mark`({ children, paint = true, className }: { children: ReactNode; paint?: boolean; className?: string })
- **`@/components/ui/PegChoice`**: `PegChoiceProps` (type); `PegChoice`({ type, label, hint, className, ...input }: PegChoiceProps & { type: "checkbox" | "radio" })
- **`@/components/ui/PillChip`**: `PillChipButtonProps` (type); `PillChipLinkProps` (type); `PillChipProps` (type); `PillChip`(props: PillChipProps)
- **`@/components/ui/Price`**: `Price`({ price, compareAt, from, size = "md", showDiscount = true, className }: PriceProps)
- **`@/components/ui/Radio`**: `Radio`(props: PegChoiceProps)
- **`@/components/ui/RemovableChip`**: `RemovableChip`({ label, removeLabel, className, type = "button", ...button }: RemovableChipProps)
- **`@/components/ui/SampleBadge`**: `SampleBadge`({ className }: { className?: string })
- **`@/components/ui/SectionHeader`**: `SectionHeader`({ title, id, as: Heading = "h2", size = "home", kicker, kickerTone = "accent", kickerDoodle, kickerDecorative, swash, plyType, sub, link, align = "start", className, }: SectionHeaderProps)
- **`@/components/ui/Select`**: `Select`({ grainSeed = "select", wrapperClassName, className, children, ...select }: SelectProps)
- **`@/components/ui/Sheet`**: `SheetCommand` (type); `sheetInvokerProps`(target: string, command: SheetCommand = "show-modal"); `Sheet`({ id, title, hideTitle, description, side = "end", footer, closeLabel = "بستن", className, bodyClassName, children, }: SheetProps); `SheetClose`({ children, ...button }: Omit<ButtonAsButton, "type">)
- **`@/components/ui/Stage`**: `IllustrationView` (type); `StageProps` (type); `Stage`(props: StageProps)
- **`@/components/ui/StampBadge`**: `StampBadge`({ children, tone = "accent", className }: StampBadgeProps)
- **`@/components/ui/Stepper`**: `StepperProps` (type); `Stepper`({ value, min = 1, max = 99, label, name, size = "md", decrementProps, incrementProps, className, }: StepperProps)
- **`@/components/ui/StepperControl`** (client): `StepperControl`({ value, defaultValue = 1, onChange, min = 1, max = 99, ...rest }: StepperControlProps)
- **`@/components/ui/StockBadge`**: `Availability` (type); `stockLabel`(availability: Availability, leadTimeDays?: number | null, variant: "short" | "long" = "short"); `StockBadge`({ availability, leadTimeDays, variant = "short", className }: StockBadgeProps)
- **`@/components/ui/TabularNumber`**: `TabularNumber`({ value, className }: { value: number; className?: string })
- **`@/components/ui/TextInput`**: `inputClasses`; `TextInput`({ numeric, size = "md", className, type = "text", dir = "rtl", ...input }: TextInputProps)
- **`@/components/ui/Toggle`**: `Toggle`({ label, hint, labelFirst, className, ...input }: ToggleProps)
- **`@/components/ui/installments`**: `SnappPaySettings` (type); `InstallmentPlan` (type); `installmentPlan`(price: number, snapppay: SnappPaySettings); `INSTALLMENTS_HREF`
- **`@/components/ui/tints`**: `AGE_TINT`; `ACCENT_TINT`; `AccentKey` (type); `isAccentKey`(value: string | null | undefined); `ageStageFor`(months: number); `ageHubFor`(months: number)
- **`@/db/queries/cards`**: `PostFormat` (type); `ArticleCardData` (type); `ArticleCardQuery` (type); `listArticleCards`(query: ArticleCardQuery = {}); `countArticleCards`(query: Omit<ArticleCardQuery, "offset" | "limit"> = {}); `getArticleCardsBySlugs`(slugs: string[]); `VariantOption` (type); `listVariantOptions`(); `RoomPiece` (type); `RoomCardData` (type); `listRoomCards`(); `TermCardData` (type); `listTermCards`()
- **`@/db/queries/catalog`**: `CardImage` (type); `ProductCardData` (type); `listProductCards`(); `getProductCardsBySlugs`(slugs: string[]); `listFeaturedProductCards`(limit = 8); `CategorySummary` (type); `listCategories`()
- **`@/db/queries/glossary-links`**: `listGlossaryLinkTerms`()
- **`@/db/queries/nav`**: `NavLinkItem` (type); `NavCategory` (type); `NavTopic` (type); `NavGuide` (type); `NavRoom` (type); `NavAgeHub` (type); `NavAgeStage` (type); `FooterGroup` (type); `NavData` (type); `shortTitle`(title: string); `getNavData`()
- **`@/db/queries/search`**: `SearchHit` (type); `SearchGroups` (type); `SearchResults` (type); `SuggestResponse` (type); `MAX_QUERY_LENGTH`; `cleanQuery`(value: string | string[] | null | undefined); `buildMatch`(query: string); `search`(q: string, limit = 12); `listPillarGuideSlugs`(limit = 3)
- **`@/db/queries/seo`**: `TERM_MIN_BODY_WORDS`; `isTermIndexable`(t: { definition: string; body: string | null; relatedCount: number }); `listIndexableTermSlugs`(); `getPriceValidUntil`(); `SITEMAP_TYPES`; `SitemapType` (type); `SitemapEntry` (type); `getSitemapEntries`(type: SitemapType); `getSitemapIndex`(); `MARKDOWN_TYPES`; `MarkdownType` (type); `listMarkdownAlternates`(); `getMarkdownAlternate`(type: MarkdownType, slug: string); `getLlmsTxt`(); `getLlmsFullTxt`(); `getMagRssXml`(); `listTorobSources`()
- **`@/db/queries/settings`**: `NavLink` (type); `SiteSettings` (type); `getSettings`()
- **`@/lib/ages`**: `WHO_SOURCE`; `MEDIAN_HEIGHT_CM`; `AgeStageKey` (type); `AgeHubSlug` (type); `AgeStage` (type); `AGE_STAGES`; `AgeHub` (type); `AGE_HUBS`; `AGE_FACETS`; `overlapsAge`( product: { ageMinMonths: number | null; ageMaxMonths: number | null }, min: number, max: number, ); `SKILLS`
- **`@/lib/cache-tags`**: `tag`
- **`@/lib/env`**: `SITE_URL`; `UPLOAD_DIR`; `IS_PRODUCTION_CONTENT`
- **`@/lib/format`**: `toFaDigits`(input: string | number); `toEnDigits`(input: string); `formatNumber`(value: number); `formatToman`(value: number, withUnit = true); `tomanToRial`(value: number); `installments`(total: number, count = 4); `discountPercent`(price: number, compareAt?: number | null); `formatAgeMonths`(months: number); `formatAgeRange`(min?: number | null, max?: number | null); `formatJalali`(date: Date); `normalizeFa`(input: string); `readingMinutes`(markdown: string)
- **`@/lib/grain`**: `grainFor`(slug: string); `grainStyle`(slug: string)
- **`@/lib/jsonld`**: `graph`(...nodes: NodeInput[]); `JsonLd`({ data }: { data: Graph | WithContext<Thing> }); `ids`; `ref`; `ProductAvailability` (type); `LdImage` (type); `imageNode`(pagePath: string, img: LdImage); `sameAsUrls`(urls: readonly string[]); `entity`(key: string); `entitiesFromSameAs`(urls: readonly string[], fallbackName: string); `logoNode`(); `returnPolicyNode`(settings: SiteSettings); `shippingServiceNode`(settings: SiteSettings); `orgNode`(settings: SiteSettings, opts: { compact?: boolean } = {}); `brandNode`(settings?: SiteSettings); `websiteNode`(); `siteNodes`(settings: SiteSettings); `WebPageType` (type); `AgeRange` (type); `WebPageInput` (type); `webPageNode`(p: WebPageInput); `BreadcrumbItem` (type); `breadcrumbNode`(items: readonly BreadcrumbItem[]); `ListEntry` (type); `itemListNode`( items: readonly ListEntry[], opts: { path?: string; order?: "ascending" | "descending" | "unordered" } = {}, ); `CollectionInput` (type); `collectionNodes`(c: CollectionInput); `FaqItem` (type); `faqNode`( faqs: readonly FaqItem[], pagePath: string, opts: { asPage?: { name: string; description?: string | null; breadcrumb?: boolean } } = {}, ); `HowToInput` (type); `howToNode`(h: HowToInput); `VideoInput` (type); `videoNode`(v: VideoInput); `VariantLdInput` (type); `ProductLdInput` (type); `ReviewLdInput` (type); `ProductLdContext` (type); `productNodes`(p: ProductLdInput, ctx: ProductLdContext); `AuthorLdInput` (type); `personNode`(a: AuthorLdInput, opts: { worksFor?: boolean } = {}); `profileNodes`( a: AuthorLdInput, opts: { dateModified?: Date | string | null; breadcrumb?: boolean } = {}, ); `ArticleLdInput` (type); `ArticleLdContext` (type); `articleNodes`(post: ArticleLdInput, ctx: ArticleLdContext = {}); `TermLdInput` (type); `definedTermNode`(t: TermLdInput); `definedTermSetNode`(terms?: readonly { slug: string; term: string }[])
- **`@/lib/og`**: `OG_SIZE`; `renderOgPng`(title: string, kicker: string, tags: string[]); `ogResponse`(title: string, kicker: string, tags: string[]); `composeOgPng`(title: string, kicker: string)
- **`@/lib/seo`**: `SITE`; `BRAND_SUFFIX`; `absoluteUrl`(path = "/"); `isoTehran`(value: Date | string | number); `dateTehran`(value: Date | string | number); `rfc822Tehran`(value: Date | string | number); `composeTitle`(core: string, suffix: string | false = BRAND_SUFFIX, max = 60); `clampText`(text: string, max = 160); `PageSeoImage` (type); `PageSeo` (type); `pageMetadata`(p: PageSeo)
- **`@/lib/torob`**: `TorobPriceInput` (type); `torobMeta`(p: TorobPriceInput); `TorobApiSource` (type); `TorobApiProduct` (type); `torobProduct`(p: TorobApiSource); `verifyTorobToken`(token: string, host: string, nowSeconds: number)
- **`@/lib/utils`**: `cn`(...inputs: ClassValue[]); `mediaUrl`(relativePath: string); `illustrationUrl`(key: string, view: "assembled" | "exploded" | "ortho" | "flat" = "assembled", finish?: string); `fnv1a`(input: string)
- **`@/lib/markdown/elements`**: `EL`; `CalloutKind` (type); `CALLOUT_LABELS`; `CALLOUT_MARKERS`; `CALLOUT_ALIASES`; `MythSide` (type); `IllustrationView` (type); `ElementProps` (type); `ILLUSTRATION_KEYS`; `ILLUSTRATION_VIEWS`
- **`@/lib/markdown/issues`**: `report`(ctx: PipelineContext, level: IssueLevel, code: string, message: string, node?: Node); `sourceOf`(ctx: PipelineContext, node: Node)
- **`@/lib/markdown/links`**: `LINK_SCHEMES`; `LinkScheme` (type); `SiteHref` (type); `isLinkScheme`(value: string); `parseSiteHref`(href: string); `siteHrefToPath`({ scheme, slug, hash }: SiteHref); `resolveHref`(href: string); `HrefKind` (type); `classifyHref`(href: string); `isExternalHref`(href: string)
- **`@/lib/markdown/pipeline`**: `parseMarkdown`(markdown: string, options: CompileOptions = {}); `compileMarkdown`(markdown: string, options: CompileOptions = {}); `lintMarkdown`(markdown: string, options: CompileOptions = {})
- **`@/lib/markdown/text`**: `extractHeadings`(markdown: string); `extractSteps`(markdown: string); `markdownToPlain`(markdown: string); `StripOptions` (type); `stripDirectives`(markdown: string, options: StripOptions = {})
- **`@/lib/markdown/types`**: `IssueLevel` (type); `MarkdownIssue` (type); `GlossaryEntry` (type); `GlossaryOptions` (type); `CompileOptions` (type); `Heading` (type); `Step` (type); `PipelineContext` (type)
- **`@/lib/markdown/plugins/anchors`**: `headingId`(node: Heading); `remarkHeadingAnchors`
- **`@/lib/markdown/plugins/callouts`**: `remarkCallouts`
- **`@/lib/markdown/plugins/captions`**: `remarkTableCaptions`
- **`@/lib/markdown/plugins/checklists`**: `remarkChecklists`
- **`@/lib/markdown/plugins/content-checks`**: `remarkContentChecks`
- **`@/lib/markdown/plugins/directives`**: `remarkDirectiveBlocks`
- **`@/lib/markdown/plugins/glossary`**: `remarkGlossaryLinks`
- **`@/lib/markdown/plugins/links`**: `termLinkData`(entry: Pick<GlossaryEntry, "definition"> | undefined, slug: string, auto = false); `remarkSiteLinks`
- **`@/lib/markdown/plugins/rehype-prose`**: `rehypeProse`
- **`@/db/client`**: `db`
- **`@/db/migrate`**: `runMigrations`(db: DB)
- **`@/db/open`**: `DB` (type); `resolveDatabasePath`(); `openDatabase`( file = resolveDatabasePath(), { create = false, readonly = false }: { create?: boolean; readonly?: boolean } = {}, )
- **`@/db/schema`**: `PublishStatus` (type); `MediaKind` (type); `media`; `categories`; `Dimensions` (type); `ProductSpec` (type); `products`; `productVariants`; `productMedia`; `productRelations`; `reviews`; `authors`; `topics`; `Source` (type); `posts`; `postProducts`; `glossaryTerms`; `FaqScope` (type); `faqs`; `pages`; `communityPhotos`; `settings`; `redirects`; `productAddons`; `roomPresets`; `roomPresetItems`; `workshopLog`