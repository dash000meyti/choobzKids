# Choobz Kids: technical specification

Status: decided for Phase 1 (public front end: home, content hub, shop) with Phase 2 (admin/CMS) readiness built in.
Verified on 2026-10-16 against `next@16.4.2`, its bundled docs, the npm registry, and MDN browser-compat-data 8.1.6.
Companion documents: `docs/FONTS.md` (type system, verified), `docs/CONTENT-PLAN.md` (URLs, schema types, AEO/GEO rules), `docs/CONTENT-FORMAT.md`.

## How to read this document

Every claim has an evidence tag:

| Tag | Meaning |
|---|---|
| **[spike]** | Built and run in a throwaway app outside the repo: `next build` on macOS arm64 (Node 22.18.0) plus a `node:22-bookworm-slim` Docker image (linux/arm64, Node 22.23.3) run with a named volume and probed with `curl`. |
| **[docs]** | Read in the docs bundled inside `next@16.4.2` (`node_modules/next/dist/docs/`). These docs match the installed version. |
| **[src]** | Read in the compiled source of `next@16.4.2`. |
| **[npm]** | `npm view` on 2026-10-16. |
| **[bcd]** | `@mdn/browser-compat-data@8.1.6` (published 2026-10-15). |
| **[blog]** | nextjs.org release posts for 16.3 (2026-08-03) and 16.4 (2026-10-06). |

---

## 0. Decisions at a glance

| Area | Decision |
|---|---|
| Framework | `next@16.4.2`, App Router, Turbopack (the default for dev and build), `output: 'standalone'`. |
| Rendering model | `cacheComponents: true` + `partialPrefetching: true`. Data is read in `'use cache'` functions with `cacheLife('content')` and `cacheTag(...)`. Every public route sits under a `(site)` layout that exports **`ensureStatic = 'navigation'`**, so the whole public site is static HTML with on-demand revalidation. |
| DB at build | A **throwaway build-time SQLite DB** is created in the Docker builder stage (migrate + seed) so prerendering can run. It is not shipped. At container start a **postdeploy step revalidates the `site` tag**, so every build-time page is re-rendered from the real `/data/choobz.db`. **[spike]** |
| Revalidation | Phase 2 Server Actions call `updateTag()` (read-your-writes). Webhooks and scripts call `POST /api/revalidate`, which runs `revalidateTag(tag, { expire: 0 })`. |
| TypeScript | **6.0.3**. TypeScript 7 works for `next build`, but typescript-eslint (inside `eslint-config-next`) requires `typescript <6.1.0`. |
| Lint | **ESLint 9.39.5** + `eslint-config-next@16.4.2`. ESLint 10 runs, but three plugins' peer ranges stop at ESLint 9, so `npm ci` needs `--legacy-peer-deps`. |
| CSS | Tailwind **4.3.3** through **`@tailwindcss/turbopack@4.3.3`**. This is what `create-next-app@16.4.2` scaffolds for Turbopack. **[spike]** |
| Fonts | `next/font/local`: Estedad + Ario preloaded, Mikhak lazy (see `FONTS.md`). Never `next/font/google`. |
| Images | `next/image` + the built-in optimizer. Uploads are streamed by a `/media/[...path]` route handler from `UPLOAD_DIR` with immutable headers. AVIF+WebP. The optimizer cache lives **on the volume**. |
| OG images | **Not Satori/`next/og`**: it renders Persian with the wrong word order and breaks ZWNJ words **[spike]**. Use `opengraph-image.tsx` files that return a PNG drawn by **sharp (Pango + HarfBuzz)**, cached with `'use cache'`. |
| DB | `better-sqlite3@13.0.3` (prebuilt N-API binaries ship inside the npm tarball, so nothing is compiled or downloaded) + `drizzle-orm@0.45.4` / `drizzle-kit@0.31.11`. WAL mode. Migrations run at container start. |
| Docker | `node:22-bookworm-slim`, multi-stage, standalone output, non-root `node` user, one volume at `/data` (`choobz.db`, `uploads/`, `cache/images/`). **[spike]** |
| Motion | `motion@14.3.0` with `LazyMotion` + `motion/react-m` and **async-loaded features**: +15 KB gzip of initial JS instead of +29 KB **[spike]**. |
| Browser APIs | React 19.3 `<ViewTransition>` (stable, no flag). CSS scroll-driven animations as progressive enhancement: Chrome 115+ and Safari 26+ only; Firefox stable still lacks them **[bcd]**. |

---

## 1. Versions and toolchain

### 1.1 Version matrix [npm]

| Package | Pin | Notes |
|---|---|---|
| `next` | `16.4.2` | Latest stable. Peers: `react`/`react-dom` `^18.2 \|\| ^19`; optional `babel-plugin-react-compiler`, `sharp ^0.35.5` (optionalDependency). |
| `react`, `react-dom` | `19.3.1` | The App Router actually runs Next's **vendored** `react@19.3.0-canary-278794d7-20261002` **[src]**, which exports `ViewTransition` and `addTransitionType`. The npm `react` is still needed for types, tooling and client islands. Bump from the current `19.3.0`. |
| `typescript` | `6.0.3` | See §1.2. |
| `@types/react`, `@types/react-dom` | `19.3.0` | |
| `@types/node` | `22.20.5` | Match the Node 22 runtime, not `^20`, which `create-next-app` scaffolds. |
| `tailwindcss` | `4.3.3` | |
| `@tailwindcss/turbopack` | `4.3.3` | Official Tailwind Labs Turbopack loader. `create-next-app@16.4.2` picks it when the bundler is Turbopack and picks `@tailwindcss/postcss` otherwise **[src of create-next-app]**. A spike build produced a 7.2 KB CSS file with utilities and `animation-timeline` rules intact. `@tailwindcss/postcss@4.3.3` is the documented alternative **[docs]**. |
| `drizzle-orm` | `0.45.4` | Latest stable. `1.0.0-rc.4` exists: evaluate it for Phase 2, not now. Peer: `better-sqlite3 >=7`. |
| `drizzle-kit` | `0.31.11` | Dev only. Brings its own `esbuild` and `tsx`. |
| `better-sqlite3` | `13.0.3` | `engines.node >=22`. **No install script.** The tarball ships `prebuilds/{linux,linuxmusl}-{x64,arm64}.node`, `darwin-*`, `win32-*`, loaded by `lib/binding.js` (musl is detected via `process.report`). Works on Debian slim **and** Alpine without a compiler. |
| `@types/better-sqlite3` | `9.6.0` | |
| `sharp` | `0.35.5` | Add as an explicit dependency (we use it for OG images and uploads, and it pins the optimizer's version). Prebuilt for glibc ≥ 2.28 (Debian 12 has 2.36) and musl ≥ 1.2.5 (`node:22-alpine` has musl 1.2.6). |
| `motion` | `14.3.0` | Peers: `react ^18 \|\| ^19`. Entry points: `motion/react`, `motion/react-m`, `motion/react-mini`, `motion/react-client`. |
| `eslint` | `9.39.5` | See §1.3. |
| `eslint-config-next` | `16.4.2` | Flat config. Contains `typescript-eslint@^8.56`. |
| `babel-plugin-react-compiler` | `1.0.0` | Stable React Compiler (§3.4). |
| `tsx` | `4.23.15` | Runs dev scripts (`migrate`, `seed`) with the tsconfig `paths`. |
| `esbuild` | `0.28.2` | Bundles the runtime scripts into `.mjs` for the Docker runner (§8.3). |
| `schema-dts` | `2.1.0` | JSON-LD typing. |
| `server-only` | `0.0.1` | Guards DB and env modules. |
| `clsx` | `2.1.1` | |
| Node | 22.23.3 (`node:22-bookworm-slim`) | Next requires ≥ 20.9 **[docs]**. Node 22 is in maintenance LTS until 2027-04-30. Moving to `node:24-bookworm-slim` is a one-line change once tested. |

### 1.2 TypeScript 7? No: pin 6.0.3

Facts:
* `next build` already shells out to the project-local `tsc` CLI by default (`experimental.useTypeScriptCli`, default on). This exists exactly so that **TypeScript 7 works for build-time type checking** while TypeScript 7 has no JS compiler API **[docs: `config/typescript.md`, `useTypeScriptCli.md`]**. The 16.3 post says the same **[blog]**.
* Two things still need the JS API:
  1. `typescript-eslint@8.71.2`, the latest, declares the peer `typescript: ">=4.8.4 <6.1.0"` **[npm]**, and `eslint-config-next` depends on it.
  2. Next's IDE plugin (`"plugins": [{ "name": "next" }]` in tsconfig) is a TS language-service plugin.
* `typescript@7.0.2` exposes only `./unstable/*` API entry points **[npm]**.

Decision: **`typescript@6.0.3`**. Revisit when typescript-eslint publishes TS 7 support. `tsgo` (`@typescript/native-preview`) can still be added later as a fast CI-only type check.

TS 6.0 changed defaults that matter here (TypeScript 6.0 announcement):
* `types` now defaults to `[]`. **Set `"types": ["node"]` explicitly.** App code happens to get Node types through `next-env.d.ts`, but standalone runs of `tsc` on `scripts/` do not.
* `strict` defaults to `true`.
* `noUncheckedSideEffectImports` defaults to `true`. Next's types declare `*.css`.
* `baseUrl` and `moduleResolution: node` are deprecated. We use `paths` without `baseUrl` and `moduleResolution: bundler`.

### 1.3 ESLint 10? No: pin 9.39.5

`eslint-config-next@16.4.2` works functionally with ESLint 10.12. In the spike, `next/no-img-element`, `jsx-a11y/alt-text` and `@typescript-eslint/no-unused-vars` all fired. But the peer ranges stop at ESLint 9:
* `eslint-plugin-react@7.37.5`: `^9.7`
* `eslint-plugin-import@2.32.0`: `^9`
* `eslint-plugin-jsx-a11y@6.10.2`: `^9`

So `npm ls` reports them invalid and a clean `npm ci` needs `--legacy-peer-deps`. ESLint 9 satisfies everything. `next lint` no longer exists, and `next build` does not lint **[docs]**.

### 1.4 `package.json` (target)

```json
{
  "name": "choobz",
  "version": "0.1.0",
  "private": true,
  "engines": { "node": "22.x" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "next typegen && tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx scripts/migrate.ts",
    "db:seed": "tsx scripts/seed.ts",
    "db:reset": "rm -f data/choobz.db data/choobz.db-wal data/choobz.db-shm && npm run db:migrate && npm run db:seed",
    "build:scripts": "esbuild scripts/migrate.ts scripts/seed.ts scripts/postdeploy.ts scripts/backup.ts --bundle --platform=node --format=esm --target=node22 --outdir=.scripts --out-extension:.js=.mjs --external:better-sqlite3 --external:sharp --banner:js=\"import{createRequire}from'node:module';const require=createRequire(import.meta.url);\""
  },
  "dependencies": {
    "better-sqlite3": "13.0.3",
    "clsx": "2.1.1",
    "drizzle-orm": "0.45.4",
    "motion": "14.3.0",
    "next": "16.4.2",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "server-only": "0.0.1",
    "sharp": "0.35.5"
  },
  "devDependencies": {
    "@tailwindcss/turbopack": "4.3.3",
    "@types/better-sqlite3": "9.6.0",
    "@types/node": "22.20.5",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "babel-plugin-react-compiler": "1.0.0",
    "drizzle-kit": "0.31.11",
    "esbuild": "0.28.2",
    "eslint": "9.39.5",
    "eslint-config-next": "16.4.2",
    "schema-dts": "2.1.0",
    "tailwindcss": "4.3.3",
    "tsx": "4.23.15",
    "typescript": "6.0.3"
  }
}
```

Use exact pins and `npm ci` everywhere, because the build runs far from the registry. The current repo uses caret ranges (`^4`, `^5`, `^20`), so tighten them.

### 1.5 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "types": ["node"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules", ".scripts"]
}
```

`eslint.config.mjs` stays as it is (flat config: `eslint-config-next/core-web-vitals` + `/typescript` + `globalIgnores`). Add `.scripts/**` and `drizzle/**` to the ignores.

---

## 2. Rendering, caching and revalidation (the Next 16.4 model)

### 2.1 Mental model [docs]

* **Cache Components** (`cacheComponents: true`) makes data access **dynamic by default**. You opt in to caching with `'use cache'`, at file, component or function level.
  * A route's output is a **static shell**: static parts, cached parts and `<Suspense>` fallbacks. It is prerendered at build. Anything else streams at request time. This *is* Partial Prerendering (PPR). The old `experimental.ppr` flag and `experimental_ppr` segment export were removed in 16.0.
  * Next 16.4 recommends Cache Components for every app, and `create-next-app` enables it by default **[blog]**.
* **Partial Prefetching** (`partialPrefetching: true`, added in 16.3) is required alongside it. Leaving it unset logs a warning.
  * A default `<Link>` prefetches one reusable **App Shell per route**.
  * `<Link prefetch={true}>` prefetches the URL-specific static or cached content.
  * Both flags become the default in Next 17.
* **`ensureStatic`** (added in 16.4) is a segment export. `'navigation'` makes the **complete server-rendered route** static and **fails the build** if any request-time work sneaks in:
  * uncached DB reads
  * `cookies()`, `headers()` or `searchParams`
  * `connection()`
  * a `cacheLife` with `expire` < 5 min, `stale` < 30 s or `revalidate` 0

  Set on a layout, it covers every page below it **[docs: `route-segment-config/ensureStatic.md`]**. The 16.4 post recommends exactly this for ecommerce, marketing and blogs **[blog]**.
* **Synchronous `better-sqlite3` reads count as "predictable values"** **[docs: getting-started/caching]**. Without `'use cache'` they are simply baked into the prerender and **carry no cache tag**, so tag-based revalidation can't reach them. **Every DB read used for rendering goes through a `'use cache'` function with `cacheTag`.**
* `'use cache'` entries live in an in-memory LRU per server process (default handler; `cacheMaxMemorySize`, 50 MB). They are keyed by build ID plus function ID plus serialized arguments, so **nothing carries over to a new deploy** **[docs]**.
* `params`, `searchParams`, `cookies()`, `headers()` and `draftMode()` are **async only** in 16 **[docs: upgrade guide]**. `LayoutProps`, `PageProps` and `RouteContext` are global type helpers generated by `next dev`, `next build` or `next typegen`.

### 2.2 `next.config.ts` (complete)

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,          // stable Babel plugin, §3.4
  typedRoutes: true,            // stable, §3.3
  poweredByHeader: false,
  compress: false,              // Caddy (or nginx) compresses with zstd/gzip, §8.6. Set true if Next faces clients directly.

  cacheLife: {
    // Content edited via CMS: on-demand tags do the real work; time-based is a safety net.
    content: { stale: 300, revalidate: 60 * 60 * 24, expire: 60 * 60 * 24 * 365 },
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 160, 256, 320], // all < smallest deviceSize (docs rule)
    qualities: [60, 75, 90],                            // 16.x: anything else → closest value; direct q=80 → 400
    minimumCacheTTL: 60 * 60 * 24 * 31,                 // floor; /media sends 1y immutable, which wins
    maximumDiskCacheSize: 2_000_000_000,                // LRU-evicted, lives on the volume (§6.4)
    maximumResponseBody: 15_000_000,                    // source image cap (internal /media fetches too)
    localPatterns: [{ pathname: '/media/**', search: '' }],
    // Next auto-appends '/_next/static/media/**' and '/_next/static/immutable/media/**' [src: server/config.js]
  },

  turbopack: {
    rules: { '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' } },
  },

  experimental: {
    agentUpgrade: process.env.CI ? false : 'security', // no upgrade-reminder interrupts in CI/Docker builds
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            // Static-friendly CSP (no nonces; nonces force dynamic rendering and are incompatible with PPR [docs]).
            // Dev needs 'unsafe-eval' (React dev tooling), as in the docs' "Without Nonces" example.
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`,
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

Add `NEXT_TELEMETRY_DISABLED=1` in every environment. Telemetry is an outbound request to Vercel.

### 2.3 Cache tags

```ts
// src/lib/cache-tags.ts — one place for the tag taxonomy (Phase 2 CMS imports the same module)
export const tag = {
  site: 'site',                                   // everything rendered from the DB
  settings: 'settings',                           // header/footer/announcement bar
  products: 'products', product: (id: number) => `product:${id}`,
  categories: 'categories',
  reviews: 'reviews',
  posts: 'posts', post: (id: number) => `post:${id}`,
  topics: 'topics', authors: 'authors', glossary: 'glossary',
  faqs: 'faqs', pages: 'pages', community: 'community', media: 'media',
} as const
```

Rules:
* Tag by **id**, not slug, so a slug change can't orphan entries.
* Also tag the **collection**. Lists, the 404 for an unknown slug and the sitemap all carry the collection tag. Creating a product then means `revalidate('products')`, which also drops a cached 404 for that slug.
* Limits: tags ≤ 256 chars, ≤ 128 tags per `cacheTag()` call, case-sensitive **[docs]**.

### 2.4 Data access layer (`src/db/queries/*`)

```ts
// src/db/queries/shop.ts
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { categories, products } from '@/db/schema'
import { tag } from '@/lib/cache-tags'

export async function listShopSlugs(): Promise<string[]> {
  'use cache'
  cacheLife('content')
  cacheTag(tag.site, tag.products, tag.categories)
  const p = db.select({ slug: products.slug }).from(products).where(eq(products.status, 'published')).all()
  const c = db.select({ slug: categories.slug }).from(categories).all()
  return [...c, ...p].map((r) => r.slug)
}

/** /shop/[slug] resolves a category OR a product (slugs are unique across both; CMS enforces it). */
export async function getShopEntry(slug: string) {
  'use cache'
  cacheLife('content')
  cacheTag(tag.site, tag.products, tag.categories)
  const category = db.select().from(categories).where(eq(categories.slug, slug)).get()
  if (category) {
    const items = db.select().from(products)
      .where(and(eq(products.categoryId, category.id), eq(products.status, 'published')))
      .orderBy(asc(products.sortOrder)).all()
    return { kind: 'category' as const, category, items }
  }
  const product = db.select().from(products)
    .where(and(eq(products.slug, slug), eq(products.status, 'published'))).get()
  if (!product) return null
  cacheTag(tag.product(product.id))            // tags can be derived from the fetched data [docs]
  return { kind: 'product' as const, product }
}
```

Constraints [docs: `use-cache.md`]:
* Arguments and return values must be serializable. Drizzle rows are plain objects; `Date` (timestamp mode) and JSON columns are fine; class instances and `URL` are not.
* You cannot read `cookies()` or `headers()` inside.
* `React.cache` is isolated per `'use cache'` scope.
* `'use cache'` cannot sit directly in a Route Handler body. Put it in a helper like the ones above.

### 2.5 The static-site contract: `ensureStatic = 'navigation'`

```tsx
// src/app/(site)/layout.tsx
import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

export const ensureStatic = 'navigation' // every public route must be fully static; build fails otherwise

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  )
}
```

Behaviour verified in the spike. Both builds had cacheComponents + partialPrefetching and `/shop/[slug]` with `generateStaticParams` and `'use cache'` reads. One build had `ensureStatic = 'navigation'`, the other did not.

| Scenario | Without `ensureStatic` | With `ensureStatic = 'navigation'` |
|---|---|---|
| Known slug | `200`, `x-nextjs-cache: HIT`, `Cache-Control: s-maxage=86400, stale-while-revalidate=31449600` | same |
| **Unknown slug** (`notFound()`) | **`200` + `<meta name="robots" content="noindex">`** (a soft 404: the App Shell streams first, so the status is already committed). HTML-limited bots (Twitterbot) got `404`. | **`404`**, cached like a static page (also `s-maxage=86400`) |
| First request after `revalidateTag('products', { expire: 0 })` | `200` with `x-nextjs-postponed: 1` and **stale data** (the App Shell plus a resume from old prerender data). The second request was fresh. | **`x-nextjs-cache: MISS` with fresh data** (blocking regenerate), then `HIT` |
| A product inserted after build (slug not in `generateStaticParams`) | App Shell first, upgraded in the background (per the docs; not re-tested) | blocking render on the first request (`MISS`), then `HIT` |
| `<title>`, canonical and `og:*` placement | in `<head>` for prerendered URLs | in `<head>` (checked in the HTML file) |

So `ensureStatic = 'navigation'` gives us three things: real 404s, read-after-revalidate freshness, and metadata in `<head>` for every crawler. It costs one blocking render (about ms with SQLite) on the first hit after an invalidation.

Rules that follow:
1. In dynamic pages, **`await params` at the top of the page and call `notFound()` before any `<Suspense>`**. Do not add `loading.tsx` to detail routes (§4.11). (Layouts are different: pass the `params` promise down instead of awaiting it, per the docs.)
2. Never call `Math.random()`, `Date.now()` or `new Date()` while rendering. Cache Components flags them, and under `'navigation'` they fail the build. Render dates from DB fields only.
3. Interactive or personal UI (cart badge, wishlist) is a **client island** that reads `localStorage` after hydration. It never reads cookies on the server.
4. A future dynamic area (checkout, account) goes in a separate route group with its own layout and no `ensureStatic`. Keep a **single root layout**, because switching root layouts forces a full page reload.

### 2.6 Dynamic routes and `generateStaticParams` with Cache Components

* `generateStaticParams` **must return at least one params object** with Cache Components, or the build fails (`empty-generate-static-params`). With `ensureStatic = 'navigation'`, every object must contain **all** dynamic params **[docs]**. **Every dynamic route therefore needs at least one seeded row** in the build-time DB: products, categories, posts, topics, glossary terms, age ranges, team members, pages.
* `dynamicParams` is **not available** with Cache Components **[docs]**. Unlisted params are rendered on demand and stored in the ISR cache.
* `generateStaticParams` runs only at build. It is not called during ISR.

```tsx
// src/app/(site)/shop/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getShopEntry, listShopSlugs } from '@/db/queries/shop'
import { pageMetadata } from '@/lib/seo'
import { ProductView } from '@/components/shop/product-view'
import { CategoryView } from '@/components/shop/category-view'

export async function generateStaticParams() {
  return (await listShopSlugs()).map((slug) => ({ slug })) // ≥ 1 required
}

export async function generateMetadata({ params }: PageProps<'/shop/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const entry = await getShopEntry(slug)
  if (!entry) return { title: 'صفحه پیدا نشد', robots: { index: false, follow: true } }
  if (entry.kind === 'category') {
    const c = entry.category
    return pageMetadata({ title: c.seoTitle ?? c.name, description: c.seoDescription ?? c.tagline ?? '', path: c.canonicalPath ?? `/shop/${c.slug}`, noindex: c.noindex })
  }
  const p = entry.product
  return pageMetadata({ title: p.seoTitle ?? p.name, description: p.seoDescription ?? p.summary, path: p.canonicalPath ?? `/shop/${p.slug}`, noindex: p.noindex })
}

export default async function ShopEntryPage({ params }: PageProps<'/shop/[slug]'>) {
  const { slug } = await params        // top-level await → real 404 status (verified)
  const entry = await getShopEntry(slug)
  if (!entry) notFound()               // before any <Suspense>
  return entry.kind === 'product' ? <ProductView product={entry.product} /> : <CategoryView {...entry} />
}
```

Use **Latin kebab-case slugs**, as `CONTENT-PLAN.md` already does. Next passes `params` **already URL-decoded** **[spike]**, so never call `decodeURIComponent` again: on a stray `%` it throws, and the request returns a 500.

### 2.7 PPR status and when to use `<Suspense>`

PPR is the default behaviour of Cache Components. Under `(site)` everything resolves at prerender time, so a page is effectively one static shell. Use `<Suspense>` only:
* for **client-only** islands that suspend in the browser (`use(io())`, `use(browser())` inside `<Suspense>` are allowed under `'navigation'` **[docs]**), and
* to split hydration units on long pages (selective hydration helps INP **[docs: streaming guide]**).

### 2.8 On-demand revalidation (Phase 2 ready)

**Inside the admin (Server Actions):** use read-your-writes.

```ts
'use server'
import { updateTag } from 'next/cache'
import { db } from '@/db/client'
import { products } from '@/db/schema'
import { tag } from '@/lib/cache-tags'
import { eq } from 'drizzle-orm'

export async function saveProduct(id: number, patch: Partial<typeof products.$inferInsert>) {
  // await requireAdmin()  ← always authorize inside the action, never rely on proxy.ts
  db.update(products).set({ ...patch, updatedAt: new Date() }).where(eq(products.id, id)).run()
  updateTag(tag.product(id))   // Server-Action-only; next read waits for fresh data
  updateTag(tag.products)      // lists, sitemap, 404s
}
```

**From scripts, webhooks or postdeploy:** use a Route Handler. `updateTag` is unavailable there **[docs]**.

```ts
// src/app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'
import { timingSafeEqual } from 'node:crypto'

function authorized(req: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return false
  const got = Buffer.from(req.headers.get('authorization') ?? '')
  const want = Buffer.from(`Bearer ${secret}`)
  return got.length === want.length && timingSafeEqual(got, want)
}

export async function POST(req: Request) {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { tags?: string[] }
  const tags = body.tags?.length ? body.tags : ['site']
  for (const t of tags) revalidateTag(t, { expire: 0 }) // 16.x: second arg required; {expire:0} = no stale serving
  return Response.json({ revalidated: tags })
}
```

Notes [docs]:
* `revalidateTag(tag)` with one argument is deprecated and is a TypeScript error.
* `'max'` means stale-while-revalidate (one stale response, then fresh). `{ expire: 0 }` means the next request blocks.
* Revalidation is lazy: pages regenerate as they are visited.
* A Server Action that calls revalidate/update clears the whole client router cache.

### 2.9 `better-sqlite3` at build time inside Docker

**Problem.** Prerendering executes our queries, so `next build` needs a migrated DB with at least one row per dynamic route (§2.6). The production DB lives on the `/data` volume, which **is not mounted during `docker build`**.

Options considered:

| Option | Verdict |
|---|---|
| A. Build-time DB: migrate + seed into `/tmp/build/choobz.db` in the builder stage; never shipped | **Chosen** [spike] |
| B. Download a prod DB snapshot into CI before building | Possible later; adds secrets and coupling |
| C. Make all reads request-time (`connection()`) | Loses static HTML, breaks `ensureStatic`; rejected |
| D. Placeholder params + mocked DB at build | Fragile; validation becomes meaningless; rejected |

**The redeploy gotcha.** Where things live:
* Prerendered and ISR pages are written to `.next/server/app/*` inside the container: `{html,rsc,meta,segments}` per route **[src: `file-system-cache.js`]**.
* The tag manifest is **in memory** **[docs: how-revalidation-works]**.

So a fresh container serves **build-time pages rendered from the seed DB**, even when `/data/choobz.db` has newer Phase 2 edits.

**Fix [spike].** After the server is healthy, the entrypoint runs `scripts/postdeploy` once, which POSTs `{"tags":["site"]}` to `/api/revalidate`. This works because every page and route tagged `site` (§2.3).
* Observed: `/` went `MISS` (fresh from the volume DB), then `HIT`.
* In Phase 1 the build DB and the runtime DB come from the same seed, so this is a no-op in practice. It becomes essential in Phase 2.

### 2.10 Where state lives

| What | Where | Survives restart? | Survives redeploy? |
|---|---|---|---|
| Source of truth (content, media metadata) | `/data/choobz.db` (+ `-wal`, `-shm`) | yes | yes |
| Uploaded files | `/data/uploads/**` | yes | yes |
| Optimized images (`/_next/image`) | `.next/cache/images` → symlink to **`/data/cache/images`** | yes | yes (safe, because media URLs are content-addressed and immutable) |
| Prerendered and ISR HTML/RSC | `/app/.next/server/app` (container layer) | `docker restart`: yes; recreate: **no** | **no** (rebuilt, then postdeploy revalidates) |
| Tag manifest (revalidation timestamps) | process memory | **no** | **no** |
| `'use cache'` entries | process memory LRU | **no** | **no** |
| Client router cache | browser memory, `stale` = 300 s (minimum 30 s) | n/a | n/a |

Do **not** put `.next/server/app` on the volume. It is build-specific.

### 2.11 Client navigation details

* With Cache Components, the router keeps recently visited routes mounted under React `<Activity mode="hidden">`. State is preserved and effects are cleaned up and re-run **[docs]**. Island code must not assume "unmount on navigate" (dialogs, timers, Motion loops).
* Prefetching happens only in production: on viewport entry, and again on hover if stale.
  * A default `<Link>` fetches the route's App Shell. Our App Shell is just the layout chrome, because the page awaits `params`.
  * Use **`<Link prefetch={true}>` on primary cards and CTAs**. The full static RSC is served from the ISR cache, so navigation is instant. Small prefetches are batched automatically (`prefetchInlining`, on by default **[docs]**).
* Speculation Rules are **not** used. App Router navigations are soft navigations, and Safari ships them only behind a flag (26.2) and Firefox only partially in preview **[bcd]**.

---

## 3. Routing and build

### 3.1 Route map

```
src/app/
  layout.tsx                    root: <html lang="fa" dir="rtl">, fonts, site-wide metadata, Organization/WebSite JSON-LD
  globals.css
  fonts.ts
  not-found.tsx                 static 404
  icon.svg  apple-icon.png  opengraph-image.png   (file-based metadata; static OG for home/default)
  manifest.ts  robots.ts  sitemap.ts
  llms.txt/route.ts  llms-full.txt/route.ts
  media/[...path]/route.ts      uploads from UPLOAD_DIR
  api/revalidate/route.ts       POST, bearer secret
  api/health/route.ts           GET, dynamic
  (site)/layout.tsx             ensureStatic = 'navigation'
  (site)/page.tsx               home
  (site)/shop/page.tsx
  (site)/shop/[slug]/page.tsx   product OR category  (+ opengraph-image.tsx)
  (site)/mag/page.tsx
  (site)/mag/[slug]/page.tsx    (+ opengraph-image.tsx)
  (site)/mag/topic/[topic]/page.tsx
  (site)/glossary/page.tsx  (site)/glossary/[term]/page.tsx
  (site)/age/[range]/page.tsx
  (site)/team/[slug]/page.tsx
  (site)/faq/page.tsx
  (site)/[page]/page.tsx        about, workshop, shipping, returns, warranty, safety, editorial-policy (pages table)
```

Static segments win over `[page]`, so `/shop` and `/mag` never hit it. Keep the `pages` slugs disjoint from top-level folders.

### 3.2 `proxy.ts` (the renamed `middleware.ts`)

Facts [docs]:
* In 16, the file is `proxy.ts` (in `src/`, next to `app/`) and the export is `proxy` (or a default export).
* It **always runs on Node.js**. A `runtime` export throws, and the edge runtime is not supported (keep `middleware.ts` if you need edge).
* `skipMiddlewareUrlNormalize` became `skipProxyUrlNormalize`.
* It runs after `next.config` headers and redirects and before filesystem routes.
* Without a matcher it runs on **every** request, including `/_next/static` and `/_next/image`.
* It is not for data fetching or authorization. Re-check auth inside each Server Action.

Use it for two things only: **CMS-managed 301s** (the `redirects` table) and **Arabic-to-Persian letter normalization** (ي→ی, ك→ک) in incoming URLs. Verified: `better-sqlite3` works inside the proxy (opened read-only); `/old-menuvila` returned 301 to `/shop/menuvila`, and `/mag/كتاب` returned 301 to `/mag/کتاب` **[spike]**.

```ts
// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server'
import Database from 'better-sqlite3'
import { DATABASE_PATH } from '@/lib/env'

type Rule = { to: string; code: 301 | 302 | 307 | 308 }
let cache: { at: number; map: Map<string, Rule> } | null = null

function redirectRules(): Map<string, Rule> {
  if (cache && Date.now() - cache.at < 30_000) return cache.map // CMS edits visible within 30 s
  const sqlite = new Database(DATABASE_PATH, { readonly: true, fileMustExist: true })
  try {
    const rows = sqlite.prepare('select from_path, to_path, status_code from redirects').all() as {
      from_path: string; to_path: string; status_code: Rule['code']
    }[]
    cache = { at: Date.now(), map: new Map(rows.map((r) => [r.from_path, { to: r.to_path, code: r.status_code }])) }
  } finally {
    sqlite.close()
  }
  return cache.map
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  let decoded: string
  try { decoded = decodeURIComponent(pathname) } catch { return NextResponse.next() }
  const normalized = decoded.replace(/ي/g, 'ی').replace(/ك/g, 'ک')
  if (normalized !== decoded) return NextResponse.redirect(new URL(encodeURI(normalized), req.url), 301)
  const hit = redirectRules().get(pathname)
  return hit ? NextResponse.redirect(new URL(hit.to, req.url), hit.code) : NextResponse.next()
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/|media/|api/|favicon.ico|icon|apple-icon|sitemap.xml|robots.txt|manifest.webmanifest|llms).*)',
      missing: [{ type: 'header', key: 'next-router-prefetch' }],
    },
  ],
}
```

Phase 1 can ship without `proxy.ts`. Add it when the `redirects` table is first used.

### 3.3 Typed routes

`typedRoutes: true` is stable (top-level, not `experimental`) and needs TypeScript **[docs]**. Template literals that match a dynamic pattern type-check, for example ``href={`/shop/${p.slug}`}`` **[spike]**. Route types are generated into `.next/types` by `next dev`, `next build` or `next typegen`. CI runs `npm run typecheck` (`next typegen && tsc --noEmit`).

### 3.4 React Compiler

* `reactCompiler: true` is **stable** since 16.0 and **off by default** **[docs]**. It requires `babel-plugin-react-compiler@1.0.0`. Next applies it only to files with JSX or hooks, via an SWC pre-filter. The spike built with it enabled.
* `experimental.turbopackRustReactCompiler` (16.3, improved in 16.4) runs a native Rust port with no Babel. It is **experimental**: keep it off for Phase 1 and try it in a branch later.
* Set `environment.enablePreserveExistingMemoizationGuarantees` explicitly only if we start relying on `useMemo` semantics. Defaults differ between implementations **[docs]**.

Payoff here is modest, because almost everything is a Server Component. It costs nothing at runtime.

### 3.5 Turbopack defaults [docs]

* `next dev` and `next build` both use Turbopack. `--turbopack` is gone. A custom `webpack()` config makes `next build` **fail**, unless you pass `--webpack`.
* The filesystem cache is on by default for dev and build. In Docker, mount `/app/.next/cache` as a BuildKit cache for faster rebuilds.
* `next dev` writes to `.next/dev`, so dev and build can run concurrently, with a lockfile.
* `next build` no longer prints "First Load JS" sizes. Use the Turbopack Bundle Analyzer (improved in 16.4) and Lighthouse **[blog]**.

### 3.6 Available but not used in Phase 1

| Feature | Status | Why not now |
|---|---|---|
| `experimental.inlineCss` | experimental | **Evaluate during the performance pass.** Our CSS is about 7–30 KB. Inlining removes one render-blocking request for first-time 4G visitors (most of our traffic comes from search and AI answers) but duplicates CSS in the RSC payload. Keep it only if Lighthouse and RUM LCP improve. |
| `experimental.sri` | experimental | Hash-based CSP; revisit with a strict CSP. |
| `experimental.useOffline` | experimental | Nice for flaky Iranian mobile networks; revisit after launch. |
| `'use cache: remote'` / custom `cacheHandlers` | stable API | Single instance; in-memory is right. |
| `deploymentId` | stable | Single instance; adds `?dpl=` to assets. Revisit if we run more than one replica. |
| `htmlLimitedBots` override | stable | Not needed, because static pages put metadata in `<head>` anyway (§4.11). |

---

## 4. SEO, AEO and GEO

### 4.1 Principles

1. **Every byte that matters is in the server HTML.** AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot) don't run JS, and `ensureStatic` guarantees static HTML.
2. **Answer-first content structure**: TL;DR box, one question per H2, sourced facts, entity consistency, E-E-A-T bylines. See `CONTENT-PLAN.md` §0-1. The data model already has `tldr`, `sources`, `reviewerId` and `faqs`.
3. **Machine-readable numbers stay Latin**: `<data value>`, `<time dateTime>` and JSON-LD prices in IRR (Toman × 10). Visible numbers are Persian. See `FONTS.md` §7.7 and `src/lib/format.ts`.
4. **One canonical URL per thing.** Lowercase Latin slugs, no trailing slash (Next default), and no query-string variants for indexable content.

### 4.2 Root layout metadata

```tsx
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { fontBody, fontDisplay, fontHand } from './fonts'
import { SITE_URL } from '@/lib/env'
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/jsonld'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'چوبز کیدز | وسایل چوبی مونته‌سوری و پیکلر', template: '%s | چوبز کیدز' },
  description: 'برج یادگیری، مثلث پیکلر و اسباب‌بازی چوبی ساخت کارگاه چوبز، همراه با راهنماهای تخصصی برای والدین.',
  applicationName: 'چوبز کیدز',
  openGraph: { type: 'website', locale: 'fa_IR', siteName: 'چوبز کیدز' },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  formatDetection: { telephone: false, email: false, address: false },
  // NO alternates.canonical here — see gotcha below.
}

export const viewport: Viewport = { themeColor: '#F6EFE3', colorScheme: 'light' }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fa" dir="rtl" className={`${fontBody.variable} ${fontDisplay.variable} ${fontHand.variable}`}>
      <body>
        <JsonLd data={{ '@context': 'https://schema.org', '@graph': [organizationJsonLd(), websiteJsonLd()] }} />
        {children}
      </body>
    </html>
  )
}
```

Gotchas [docs: metadata merging]:
* Metadata objects merge **shallowly**, root first. A canonical in the root layout would be **inherited by every page that forgets its own**, which collapses the site onto `/`. Canonical lives only in pages, through `pageMetadata()`.
* A page-level `openGraph` **replaces** the root's `openGraph` entirely. The helper therefore always repeats `siteName` and `locale`.
* File-based metadata (`opengraph-image.*`, `icon.*`) overrides the config objects.
* `metadataBase` resolves relative URLs. When `generateMetadata` uses `'use cache'`, return strings, not `URL` objects. URLs are not serializable.
* `SITE_URL` is read **at build** for prerendered pages. Pass it as a Docker build arg with the same value as at runtime (§8).

### 4.3 `src/lib/seo.ts`

```ts
import 'server-only'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/env'

export const SITE = { name: 'چوبز کیدز', alternateName: 'Choobz Kids', locale: 'fa_IR', inLanguage: 'fa-IR' } as const
export const absoluteUrl = (path = '/') => new URL(path, SITE_URL).toString()

type PageSeo = {
  title: string; description: string; path: string
  image?: { url: string; width: number; height: number; alt?: string }
  type?: 'website' | 'article'
  publishedTime?: string; modifiedTime?: string
  noindex?: boolean
}

export function pageMetadata(p: PageSeo): Metadata {
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: p.path },
    openGraph: {
      type: p.type ?? 'website',
      url: p.path,
      title: p.title,
      description: p.description,
      siteName: SITE.name,   // repeat: openGraph merge is shallow
      locale: SITE.locale,
      ...(p.image ? { images: [p.image] } : {}),
      ...(p.type === 'article' ? { publishedTime: p.publishedTime, modifiedTime: p.modifiedTime } : {}),
    },
    twitter: { card: 'summary_large_image', title: p.title, description: p.description },
    ...(p.noindex ? { robots: { index: false, follow: true } } : {}),
  }
}
```

### 4.4 Structured data (`src/lib/jsonld.tsx`)

Render it as a plain `<script type="application/ld+json">`, not `next/script`, and escape `<` **[docs: json-ld guide]**. Type it with `schema-dts`.

```tsx
import type { Graph, Thing, WithContext, Product, BreadcrumbList, Organization, WebSite } from 'schema-dts'
import { absoluteUrl, SITE } from '@/lib/seo'
import { tomanToRial } from '@/lib/format'

export function JsonLd({ data }: { data: Graph | WithContext<Thing> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

export const organizationJsonLd = (): Organization => ({
  '@type': 'Organization',
  '@id': absoluteUrl('/#org'),
  name: SITE.name,
  alternateName: SITE.alternateName,
  url: absoluteUrl('/'),
  logo: absoluteUrl('/icon.svg'),
  sameAs: [/* instagram, aparat, … from settings */],
})

export const websiteJsonLd = (): WebSite => ({
  '@type': 'WebSite',
  '@id': absoluteUrl('/#website'),
  url: absoluteUrl('/'),
  name: SITE.name,
  inLanguage: SITE.inLanguage,
  publisher: { '@id': absoluteUrl('/#org') },
  // add potentialAction SearchAction only when a real /search exists
})

const AVAILABILITY = {
  in_stock: 'https://schema.org/InStock',
  out_of_stock: 'https://schema.org/OutOfStock',
  preorder: 'https://schema.org/PreOrder',
  made_to_order: 'https://schema.org/MadeToOrder',
} as const

export function productJsonLd(p: {
  slug: string; name: string; summary: string; sku: string | null; price: number
  availability: keyof typeof AVAILABILITY; images: string[]; material: string | null
  ageMinMonths: number | null; ageMaxMonths: number | null
}): WithContext<Product> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': absoluteUrl(`/shop/${p.slug}#product`),
    name: p.name,
    description: p.summary,
    ...(p.sku ? { sku: p.sku } : {}),
    image: p.images.map((u) => absoluteUrl(u)),
    brand: { '@type': 'Brand', name: SITE.alternateName },
    ...(p.material ? { material: p.material } : {}),
    ...(p.ageMinMonths != null
      ? { audience: { '@type': 'PeopleAudience', suggestedMinAge: p.ageMinMonths / 12, ...(p.ageMaxMonths != null ? { suggestedMaxAge: p.ageMaxMonths / 12 } : {}) } }
      : {}),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/shop/${p.slug}`),
      priceCurrency: 'IRR',               // Toman has no ISO code; store Toman, emit Rial
      price: tomanToRial(p.price),
      availability: AVAILABILITY[p.availability],
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': absoluteUrl('/#org') },
    },
  }
}

export const breadcrumbJsonLd = (items: { name: string; path: string }[]): WithContext<BreadcrumbList> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
})
```

Page types (from `CONTENT-PLAN.md` §0-1 and §0-2):

| Page | Nodes |
|---|---|
| Article | `@graph`: `WebPage` (`reviewedBy` and `lastReviewed` live on WebPage, not Article) + `BlogPosting` (`author` → `Person` `@id /team/{slug}#person`, `datePublished`, `dateModified`, `citation[]` from `sources`, `about` → `DefinedTerm`s) + `BreadcrumbList` + `FAQPage` when `faqs` exist |
| Topic hubs, `/mag`, age hubs | `CollectionPage` + `ItemList` |
| Glossary | `DefinedTermSet` / `DefinedTerm` (`sameAs` → Wikidata) |
| Team | `ProfilePage` + `Person` |
| `/faq` | `FAQPage` |

`HowTo` and `FAQPage` no longer earn Google rich results for most sites, but they still help answer engines. Keep them truthful and identical to the visible text.

### 4.5 `sitemap.ts`

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { getSitemapData } from '@/db/queries/sitemap' // 'use cache' + cacheLife('content') + cacheTag('site', …)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const d = await getSitemapData()
  return [
    { url: absoluteUrl('/'), lastModified: d.siteUpdatedAt },
    ...d.categories.map((c) => ({ url: absoluteUrl(`/shop/${c.slug}`), lastModified: c.updatedAt })),
    ...d.products.map((p) => ({
      url: absoluteUrl(`/shop/${p.slug}`),
      lastModified: p.updatedAt,
      images: p.imagePaths.map((src) => absoluteUrl(src)),   // original /media/... URLs → image sitemap
    })),
    ...d.posts.map((p) => ({ url: absoluteUrl(`/mag/${p.slug}`), lastModified: p.updatedAt, images: p.cover ? [absoluteUrl(p.cover)] : undefined })),
    ...d.topics.map((t) => ({ url: absoluteUrl(`/mag/topic/${t.slug}`), lastModified: t.updatedAt })),
    ...d.terms.map((t) => ({ url: absoluteUrl(`/glossary/${t.slug}`), lastModified: t.updatedAt })),
    ...d.pages.map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updatedAt })),
  ]
}
```

Behaviour:
* `sitemap.ts` is a special Route Handler, prerendered like a page. The spike's build table showed `○ /sitemap.xml 1d 1y`, and after revalidation it went `MISS` then fresh **[spike]**.
* **Never put `new Date()` in it.** The docs example does, but under Cache Components that is a request-time value, which stops prerendering. Use DB `updatedAt`.
* `changeFrequency` and `priority` are optional; Google ignores both. `lastModified` must be truthful.
* Phase 1 is a few hundred URLs, so **one `/sitemap.xml`**. Past about 10k URLs, split by section with nested `sitemap.ts` files (`/shop/sitemap.xml`, `/mag/sitemap.xml`) and list them all in `robots.sitemap` (it accepts an array).
* `generateSitemaps()` serves `/…/sitemap/[id].xml`, and `id` is **`Promise<string>`** in 16 **[docs]**. Next does **not** emit a sitemap index for it, so list each file in robots.

### 4.6 `robots.ts`

```ts
import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
```

* **Do not disallow `/_next/image`.** Google would stop fetching our image URLs.
* The `*` group allows the answer-engine crawlers by default: OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, Googlebot, Bingbot.
* Opting out of *training* (GPTBot, Google-Extended, CCBot, ClaudeBot) is a business decision. If we do it, add specific groups. A specific group **replaces** `*` for that agent, so repeat `disallow: ['/api/']` in it.
* Per-agent non-standard directives go in `other` (16.3+) **[docs]**.

### 4.7 `llms.txt` / `llms-full.txt`

`CONTENT-PLAN.md` asks for them: pillar pages, glossary and products, one line each.

```ts
// src/app/llms.txt/route.ts
import { buildLlmsTxt } from '@/db/queries/llms' // 'use cache' + cacheTag('site') → returns a Markdown string

export async function GET() {
  return new Response(await buildLlmsTxt(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
```

GET handlers follow the page prerender model under Cache Components, so this is static and tag-revalidated **[docs: route handlers]**.

### 4.8 `manifest.ts` and icons

```ts
import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'چوبز کیدز', short_name: 'چوبز', lang: 'fa-IR', dir: 'rtl',
    start_url: '/', display: 'standalone', background_color: '#F6EFE3', theme_color: '#F6EFE3',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
  }
}
```

Use the file conventions `app/icon.svg`, `app/apple-icon.png` and `app/favicon.ico`. They emit the right `<link>` tags automatically.

### 4.9 OG images with Persian text

**Finding [spike].** `next/og` (`@vercel/og@1.0.1` → Satori + Resvg, bundled in Next) renders Persian **incorrectly**:
* The word order of RTL runs is **reversed**, for example «چوبز چوبی بازی‌اسباب».
* ZWNJ words split the wrong way round, and spacing is erratic.
* Satori joins letters through opentype.js's Arabic contextual forms, but it has no HarfBuzz and no bidi algorithm.

Two Iran-relevant side effects **[src: `compiled/@vercel/og/index.node.js`]**:
* If any glyph is missing from the fonts you pass, it **fetches `fonts.googleapis.com` at runtime** (Noto Sans Arabic for `ar-AR`).
* Emoji are fetched from **`cdn.jsdelivr.net`** (twemoji by default).

**Decision.** Generate OG PNGs with **sharp's text input (libvips → Pango + HarfBuzz + FriBiDi)**. Verified in the Docker image:
* correct shaping, bidi, ZWNJ and mixed Persian/Latin text
* no network access

An `opengraph-image.tsx` default export may return any `Response` **[docs]**, so we keep the automatic `og:image`, `og:image:width`, `og:image:height`, `og:image:type` and `og:image:alt` tags. The spike's product pages emitted them, and the PNGs were prerendered at build (`● /shop/menuvila/opengraph-image 1d 1y`).

```ts
// src/lib/og.ts
import 'server-only'
import path from 'node:path'
import sharp from 'sharp'
import { cacheLife, cacheTag } from 'next/cache'

const FONT = path.join(process.cwd(), 'assets', 'og', 'Ario-Dots1.ttf') // TTF/OTF; traced into standalone (verified for assets/*.ttf)
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function renderOgPng(title: string, kicker: string, tags: string[]): Promise<Uint8Array> {
  'use cache'                    // sharp work is async → cache it so the route stays static
  cacheLife('content')
  cacheTag('og', ...tags)
  const text = await sharp({
    text: {
      text: `<span foreground="#5B3A1E">${esc(title)}</span>\n<span size="55%" foreground="#8A5A2B">${esc(kicker)}</span>`,
      font: 'Ario 64', fontfile: FONT, rgba: true, width: 1040, align: 'centre', wrap: 'word', dpi: 72,
    },
  }).png().toBuffer()
  const png = await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#F6EFE3' } })
    .composite([{ input: text, gravity: 'centre' } /* + brand SVG/illustration layers */])
    .png({ compressionLevel: 9 })
    .toBuffer()
  return new Uint8Array(png)     // TypedArrays are valid 'use cache' return values
}
```

```tsx
// src/app/(site)/shop/[slug]/opengraph-image.tsx
import { getShopEntry, listShopSlugs } from '@/db/queries/shop'
import { renderOgPng } from '@/lib/og'

export const alt = 'چوبز کیدز'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function generateStaticParams() {
  return (await listShopSlugs()).map((slug) => ({ slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params // params is a Promise in 16 (breaking change) [docs]
  const e = await getShopEntry(slug)
  const title = e?.kind === 'product' ? e.product.name : e?.kind === 'category' ? e.category.name : 'چوبز کیدز'
  const png = await renderOgPng(title, 'ساخت کارگاه چوبز — choobz.kids', ['site', 'products'])
  return new Response(png, { headers: { 'Content-Type': 'image/png' } })
}
```

Notes:
* Inside Docker, sharp prints `Fontconfig error: Cannot load default config file` (harmless). Silence it by shipping `assets/og/fonts.conf` and setting `FONTCONFIG_FILE` **[spike]**:
  ```xml
  <?xml version="1.0"?>
  <!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
  <fontconfig><dir>/app/assets/og</dir><cachedir>/tmp/fontconfig</cachedir></fontconfig>
  ```
* On **macOS** the prebuilt sharp ignored `fontfile` and used a system font. **Judge OG rendering inside the Linux container only.**
* The family in `font: '<Family> <size>'` must match the TTF's internal family name. Check it with fontTools or `fc-scan`. On a mismatch Pango **silently falls back** to another font. The spike's `'Vazirmatn Bold 64'` matched `Vazirmatn-Bold.ttf`; confirm Ario's exact name when the subset is built.
* Use **TTF** subsets for OG (see the `FONTS.md` build script). Pango/FreeType support for WOFF2 isn't guaranteed.
* The home page and generic pages use a designed static `app/opengraph-image.png` (1200×630, below 200 KB).

### 4.10 Answer-engine and bot specifics

* Next's **HTML-limited bot list** (they get blocking metadata in `<head>` and skip the static shell) includes the Google `*-Google` crawlers, Bingbot, Yandex, Applebot, facebookexternalhit, Twitterbot, Slackbot, WhatsApp and others. It **does not include GPTBot, ClaudeBot or PerplexityBot** **[src: `html-bots.js`]**. That doesn't matter for us: fully static pages carry metadata in `<head>` for everyone **[spike]**.
* Those HTML-limited bots get a **dynamic re-render** with Cache Components, so every data source the shell needs must exist at request time **[docs: streaming]**. It does: SQLite on the volume.

### 4.11 Status codes

* With streaming, the status is committed when the first Suspense fallback flushes. `notFound()` after that becomes `200` + `noindex` **[docs]**, which is what we observed without `ensureStatic` **[spike]**.
* Our rules (§2.5): top-level `await params`, `notFound()` before `<Suspense>`, no `loading.tsx` on detail routes, and `ensureStatic = 'navigation'`.
* Redirects for moved content are 301s from `proxy.ts` or `next.config` `redirects()`.

---

## 5. Fonts

The decision and its verification live in **`docs/FONTS.md`**: Estedad (body), Ario Dots 1 (display), Mikhak (accent). Implementation summary:

```ts
// src/app/fonts.ts
import localFont from 'next/font/local'

const fallback = ['system-ui', 'Segoe UI', 'Tahoma', 'sans-serif']

export const fontBody = localFont({
  src: [{ path: '../fonts/estedad/estedad-fa-wght.woff2', weight: '100 900', style: 'normal' }],
  variable: '--ff-body', display: 'swap', preload: true, fallback, adjustFontFallback: false,
})
export const fontDisplay = localFont({
  src: [{ path: '../fonts/ario/ario-dots1-fa.woff2', weight: '400', style: 'normal' }],
  variable: '--ff-display', display: 'swap', preload: true, fallback, adjustFontFallback: false,
})
export const fontHand = localFont({
  src: [{ path: '../fonts/mikhak/mikhak-fa-600-kshd.woff2', weight: '600', style: 'normal' }],
  variable: '--ff-hand', display: 'swap', preload: false, fallback, adjustFontFallback: false,
})
```

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme inline {
  --font-sans:    var(--ff-body), system-ui, "Segoe UI", Tahoma, sans-serif;
  --font-display: var(--ff-display), var(--ff-body), system-ui, sans-serif;
  --font-hand:    var(--ff-hand), var(--ff-body), system-ui, sans-serif;
}
html { font-family: var(--font-sans); font-synthesis: none; font-feature-settings: "ss01"; }
```

Facts [docs: `components/font.md`]:
* `next/font/local` self-hosts the files under `/_next/static/media/*` (hashed, `immutable`).
* `display` defaults to `'swap'`. `preload` defaults to `true` and applies to every file in that call.
* Preloads are route-scoped: a font in the root layout is preloaded on every route.
* `adjustFontFallback` takes `'Arial' | 'Times New Roman' | false`, default `'Arial'`. We turn it off because its metric override is computed from Latin Arial and is wrong for Persian. CLS is handled by explicit line-heights instead (`FONTS.md` §5.4).
* `variable` exposes a CSS variable. `declarations` adds `@font-face` descriptors (for example `unicode-range`). Weight ranges like `'100 900'` declare a variable font.
* The `--ff-*` prefix keeps the variables from colliding with Tailwind's `--font-*` tokens.

**Never `next/font/google`.** It downloads from Google **at build time**, which fails or hangs on builders in Iran, and the policy is no Google Fonts at all. The current `src/app/layout.tsx` (create-next-app Geist) must be replaced.

---

## 6. Images and media

### 6.1 Options compared

| | (a) Route handler + built-in optimizer | (b) Custom loader | (c) Pre-generated sharp variants at upload |
|---|---|---|---|
| How | `/media/[...path]` streams `UPLOAD_DIR` files; `next/image` → `/_next/image?url=/media/…` (allowed by `localPatterns`) | `images.loaderFile` returns your own URL per width | Upload writes `name-640.avif/webp`, …; `<picture>` or `getImageProps` |
| AVIF/WebP negotiation | **automatic** via `Accept` (`Vary: Accept`) | none unless your server does it | manual `<picture><source type>` |
| Runtime CPU | encode on first request per (url, w, q, format), then disk cache | depends | **zero** |
| Storage | originals + LRU cache (bounded) | — | originals × widths × formats |
| Complexity | lowest | needs another service: nothing to point at | upload pipeline + srcset logic |
| Verified | **yes [spike]** | n/a | n/a |

**Decision: (a)**, plus upload-time metadata borrowed from (c): width, height, dominant colour and a tiny blur thumbnail stored in `media`. Fall back to (c) for specific heavy assets only if the server CPU becomes a bottleneck.

Spike evidence:
* `GET /_next/image?url=%2Fmedia%2Fseed%2Fmenuvila.jpg&w=640&q=75` with `Accept: image/avif` → `200 image/avif`, `Cache-Control: public, max-age=31536000, must-revalidate`, `Vary: Accept`. The optimizer adopts the upstream `max-age` when it is larger than `minimumCacheTTL`.
* `q=80` → `400` (not in `qualities`). `url=/etc/passwd` → `400` (fails `localPatterns`).
* The optimizer fetches local URLs **in-process** through a mocked request (`fetchInternalImage`), so there is no network hop and no Local-IP restriction **[src]**.

### 6.2 `next/image` usage

```tsx
// LCP hero (exactly one per page)
<Image src={hero.url} alt={hero.alt} width={hero.width} height={hero.height}
  sizes="100vw" fetchPriority="high" loading="eager" quality={75}
  style={{ backgroundColor: hero.dominantColor ?? undefined }} />

// Product grid card
<Image src={m.url} alt={m.alt} width={m.width} height={m.height}
  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
  style={{ backgroundColor: m.dominantColor ?? undefined }} />
```

* `priority` is **deprecated** in 16. Use `preload`, or better `fetchPriority="high"` with `loading="eager"` as the docs advise, on a single LCP image **[docs]**.
* Always pass the real `width`/`height` (CLS ≈ 0) and a correct `sizes`.
* Placeholders:
  * Prefer `dominantColor` backgrounds, which cost 0 bytes.
  * Use `placeholder="blur"` + `blurDataURL` only on the hero: every blur data URL is inlined into HTML and RSC.
* Brand art and illustrations are inline SVG React components (`src/components/illustrations`), never `next/image`.
* Static design photos are **static imports**. They get hashed, immutable `/_next/static/media` URLs. Don't use `/public`, which is served with `max-age=0`.

### 6.3 `/media/[...path]` route handler (hardened)

Changes against the current `src/app/media/[...path]/route.ts`:
* **No second `decodeURIComponent`.** Params arrive decoded **[spike]**; decoding again throws on `%`.
* **`Range` support.** Safari will not play MP4 without `206` responses. The spike's handler returned `200` for `Range: bytes=0-99`.
* Traversal checks.
* SVG sandbox.

```ts
// src/app/media/[...path]/route.ts
import { createReadStream, type Stats } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { UPLOAD_DIR } from '@/lib/env'

const TYPES: Record<string, string> = {
  '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf',
}
const notFound = () => new Response('Not found', { status: 404 })
const body = (file: string, opts?: { start: number; end: number }) =>
  Readable.toWeb(createReadStream(file, opts)) as ReadableStream

export async function GET(req: Request, ctx: RouteContext<'/media/[...path]'>) {
  const { path: parts } = await ctx.params                  // already decoded by Next
  if (parts.some((p) => p === '..' || p.includes('\0'))) return notFound()
  const file = path.resolve(UPLOAD_DIR, ...parts)
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return notFound()
  const type = TYPES[path.extname(file).toLowerCase()]
  if (!type) return notFound()

  let s: Stats
  try { s = await stat(file) } catch { return notFound() }
  if (!s.isFile()) return notFound()

  const etag = `"${s.size.toString(36)}-${Math.floor(s.mtimeMs).toString(36)}"`
  const headers = new Headers({
    'Content-Type': type,
    'Cache-Control': 'public, max-age=31536000, immutable', // filenames are content-addressed
    ETag: etag,
    'Last-Modified': s.mtime.toUTCString(),
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
  })
  if (type === 'image/svg+xml') headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
  if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers })

  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '')
  if (m && (m[1] || m[2])) {
    const start = m[1] ? Number(m[1]) : Math.max(0, s.size - Number(m[2]))
    const end = m[1] && m[2] ? Math.min(Number(m[2]), s.size - 1) : s.size - 1
    if (start > end || start >= s.size) {
      headers.set('Content-Range', `bytes */${s.size}`)
      return new Response(null, { status: 416, headers })
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${s.size}`)
    headers.set('Content-Length', String(end - start + 1))
    return new Response(body(file, { start, end }), { status: 206, headers })
  }
  headers.set('Content-Length', String(s.size))
  return new Response(body(file), { headers })
}
```

Under Cache Components this handler is dynamic (it reads params and the request), which is correct. This exact handler was run in the spike **[spike]**:
* `Range: bytes=0-99` → `206` (100 bytes); `bytes=-10` → `206` with `Content-Range: bytes 15258-15267/15268`; an out-of-range request → `416`.
* `If-None-Match` → `304`. `HEAD` works automatically.
* `/_next/image` through it still returned AVIF.
* Traversal attempts (`..%2F..%2Fchoobz.db`, `%2e%2e/choobz.db`) → `404`.

### 6.4 Optimizer cache on the volume

The optimizer writes `<distDir>/cache/images` (`.next/cache/images`), with entry names like `<maxAge>.<expireAt>.<etag>.<upstreamEtag>.avif` **[src, spike]**.
* LRU-bounded by `maximumDiskCacheSize`. The default is 50% of free disk, checked at startup.
* It is **invalidated only by changing the URL**, or by deleting the directory **[docs]**.

**Put it on the volume** (`/data/cache/images`, through a symlink created in the image). AVIF encodes are expensive, the entries depend only on (url, width, quality, format) and not on the build, and our media URLs are immutable. Verified: after one request, the AVIF entry appeared in `/data/cache/images` **[spike]**.

### 6.5 `dangerouslyAllowSVG`

Keep it `false`, the default.
* SVGs from `/media` are served as-is with a sandbox CSP.
* `next/image` with an `.svg` `src` is automatically `unoptimized` **[docs]**.
* Phase 2 uploads should **reject SVG**, or sanitize it server-side. SVG can carry script.
* If SVG optimization is ever enabled, it also needs `contentDispositionType: 'attachment'` and a `contentSecurityPolicy` **[docs]**.

### 6.6 Upload pipeline (Phase 2 contract, defined now)

1. Accept JPEG, PNG, WebP or AVIF up to 15 MB (`maximumResponseBody`), plus MP4 (H.264) for video.
2. sharp:
   * `.rotate()` to apply EXIF, then strip metadata.
   * Cap the longest side at 2560 px.
   * Store a high-quality master (WebP q90, or the original JPEG q90).
   * Read `width`/`height`.
   * Compute `dominantColor` with `.stats().dominant`.
   * Generate `blurDataUrl` as a 16 px WebP data URL (about 200–400 B).
3. Store it under a **content-addressed** name: `uploads/{yyyy}/{mm}/{sha256-12}.webp`. Insert a `media` row. The existing schema already has `path`, `mime`, `width`, `height`, `sizeBytes`, `alt`, `dominantColor` and `blurDataUrl`.
4. Never overwrite a file. A replacement means a new file, which means a new URL, so the immutable caches stay correct.

---

## 7. Database: Drizzle + better-sqlite3

### 7.1 Client (`src/db/client.ts`; replaces `src/db/index.ts`)

```ts
import 'server-only'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { DATABASE_PATH } from '@/lib/env'
import * as schema from './schema'

export type DB = BetterSQLite3Database<typeof schema> & { $client: Database.Database }

function open(): DB {
  // Migrations create the file. Failing loudly beats silently creating an empty DB.
  const sqlite = new Database(DATABASE_PATH, { fileMustExist: true })
  sqlite.pragma('journal_mode = WAL')       // readers never block the single writer
  sqlite.pragma('synchronous = NORMAL')     // safe with WAL; may lose the last txn on power loss, never corrupts
  sqlite.pragma('busy_timeout = 5000')
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('cache_size = -16000')      // 16 MiB page cache
  sqlite.pragma('temp_store = MEMORY')
  return drizzle({ client: sqlite, schema, casing: 'snake_case' }) as DB
}

// One connection per process. globalThis survives dev HMR and is shared by every server bundle
// (RSC, route handlers, proxy) that imports this module.
const g = globalThis as unknown as { __choobzDb?: DB }
export const db: DB = g.__choobzDb ?? (g.__choobzDb = open())
```

```ts
// src/lib/env.ts
import 'server-only'
import path from 'node:path'

export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
// turbopackIgnore keeps the file tracer from treating runtime data paths as build inputs
export const DATABASE_PATH = path.resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH ?? 'data/choobz.db')
export const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? 'data/uploads')
```

* Keep `casing: 'snake_case'` identical in `drizzle.config.ts` and in `drizzle()`. The current repo already does this.
* `better-sqlite3` and `sharp` are on Next's built-in **`serverExternalPackages`** list **[docs]**. They are never bundled and need no config.
* Prerendering runs in parallel build workers ("Generating static pages using 9 workers") that each open the DB. With WAL and read-only access this is fine **[spike]**.

### 7.2 `drizzle.config.ts`

The existing file is correct: `dialect: 'sqlite'`, `schema: './src/db/schema.ts'`, `out: './drizzle'`, `casing: 'snake_case'`, `dbCredentials.url` from `DATABASE_PATH`, `strict` and `verbose`.

### 7.3 Migrations

* **Dev:** edit `schema.ts` → `npm run db:generate` (drizzle-kit writes `drizzle/NNNN_*.sql` + `meta/_journal.json`; **commit both**) → `npm run db:migrate`.
* **Never `drizzle-kit push`** against prod. drizzle-kit is a dev dependency and is not in the runtime image.
* **Container start:** the bundled `scripts/migrate.mjs` runs `migrate(db, { migrationsFolder: '/app/drizzle' })` before the server starts. It keeps a `__drizzle_migrations` table, so it is idempotent **[spike: `[migrate] ok /data/choobz.db`]**.

```ts
// scripts/migrate.ts  (dev: tsx; prod: esbuild → .scripts/migrate.mjs)
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import fs from 'node:fs'
import path from 'node:path'

const file = path.resolve(process.env.DATABASE_PATH ?? 'data/choobz.db')
fs.mkdirSync(path.dirname(file), { recursive: true })
const sqlite = new Database(file)
sqlite.pragma('journal_mode = WAL')
migrate(drizzle({ client: sqlite }), { migrationsFolder: process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), 'drizzle') })
sqlite.close()
console.log('[migrate] ok', file)
```

### 7.4 Seed

* **Data:** typed fixtures in `src/db/seed/*.ts`, built from `CONTENT-PLAN.md`: categories, products, posts, topics, glossary, authors, FAQs, pages and settings. Seed media lives in `seed/uploads/` and is committed.
* **Runner:** `scripts/seed.ts` runs through `tsx` in dev and is esbuild-bundled for the image.
* **Behaviour:**
  * **Seed-if-empty** by default; `--force` re-seeds.
  * Upserts are keyed by `slug`.
  * Every dynamic route gets at least one row (§2.6).
  * Seed media is copied into `UPLOAD_DIR` without overwriting.
  * Media dimensions and colours are computed with sharp.

```ts
// scripts/seed.ts (skeleton)
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sql } from 'drizzle-orm'
import fs from 'node:fs'
import path from 'node:path'
import * as schema from '../src/db/schema'          // OK: schema has no 'server-only'
import { seedData } from '../src/db/seed'           // pure data modules only

const file = path.resolve(process.env.DATABASE_PATH ?? 'data/choobz.db')
const db = drizzle({ client: new Database(file), schema, casing: 'snake_case' })
const force = process.argv.includes('--force')
const count = db.select({ n: sql<number>`count(*)` }).from(schema.products).get()?.n ?? 0

const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? 'data/uploads')
const seedMedia = path.resolve(process.env.SEED_MEDIA_DIR ?? 'seed/uploads')
if (fs.existsSync(seedMedia)) fs.cpSync(seedMedia, uploadDir, { recursive: true, force: false, errorOnExist: false })

if (count > 0 && !force) { console.log('[seed] skip, products:', count); process.exit(0) }
db.transaction((tx) => { seedData(tx) })          // inserts with onConflictDoUpdate on slug
console.log('[seed] done')
```

**Gotcha:** seed scripts must never import `src/db/client.ts`, `src/lib/env.ts` or anything else that imports **`server-only`**. That package throws outside the React server condition, which includes `tsx` and plain Node.

### 7.5 Standalone tracing of the native binary [spike]

* `output: 'standalone'` copies `node_modules/better-sqlite3` with **only the prebuilds matching the build machine's arch**:
  * linux/arm64 Docker build: `linux-arm64`, `linuxmusl-arm64`, `darwin-arm64` and `win32-arm64` `.node` files
  * macOS build: `darwin-arm64.node` only
* Sharp is traced the same way (`@img/sharp-linux-arm64`, `@img/sharp-libvips-linux-arm64`, …).

So **always run `next build` inside the Linux builder stage for the target arch**. For x64 servers, use `docker buildx build --platform linux/amd64`. Never copy a standalone folder built on a Mac into an image.

### 7.6 Operational rules

* WAL needs `choobz.db`, `-wal` and `-shm` on the **same local filesystem**. A Docker named volume or a local bind mount works. **Never NFS or SMB.**
* One writer: the Next process (and later the admin inside it). Migrations and the seed run before the server starts.
* **Backups:**
  * `node /app/scripts/backup.mjs` runs better-sqlite3 `db.backup('/data/backups/choobz-YYYYMMDD.db')` (or `VACUUM INTO`), on a daily host cron via `docker compose exec`.
  * Copy the backups off the server.
  * Never `cp` a live WAL database.
* Run `PRAGMA optimize` occasionally (for example from the backup script).

---

## 8. Docker and deployment

### 8.1 Base image: `node:22-bookworm-slim`

Both candidates work without compiling: better-sqlite3 has glibc and musl prebuilds, and sharp has glibc ≥ 2.28 and musl ≥ 1.2.5 prebuilds. Slim wins because:
* the full pipeline was verified on it: build, run, healthcheck, image optimizer, OG text rendering, revalidation;
* it has glibc 2.36 and Next's `-gnu` SWC binaries.

The one glibc caveat is sharp's memory fragmentation in long-running processes. sharp already limits its own concurrency on glibc. Set `MALLOC_ARENA_MAX=2` (or preload jemalloc) and watch RSS.

Observed sizes for linux/arm64: about 460 MB on disk, about 110 MB compressed. The idle container used about 78 MiB of RAM.

### 8.2 `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1.7
ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
# No lifecycle scripts needed: better-sqlite3 and sharp ship prebuilt binaries in their npm packages
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts --no-audit --no-fund

FROM base AS builder
ARG SITE_URL=https://choobz.kids
ENV SITE_URL=${SITE_URL} \
    CI=1 \
    DATABASE_PATH=/tmp/build/choobz.db \
    UPLOAD_DIR=/tmp/build/uploads
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Throwaway build-time DB so prerendering can run (§2.9). Not copied to the runner.
RUN npx tsx scripts/migrate.ts && npx tsx scripts/seed.ts
RUN --mount=type=cache,target=/app/.next/cache npm run build && npm run build:scripts

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/data/choobz.db \
    UPLOAD_DIR=/data/uploads \
    SEED_MEDIA_DIR=/app/seed/uploads \
    MIGRATIONS_DIR=/app/drizzle \
    FONTCONFIG_FILE=/app/assets/og/fonts.conf \
    MALLOC_ARENA_MAX=2
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/assets/og ./assets/og
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/.scripts ./scripts
COPY --from=builder --chown=node:node /app/seed ./seed
COPY --chmod=0755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN mkdir -p /data /app/.next/cache \
 && ln -s /data/cache/images /app/.next/cache/images \
 && chown -R node:node /data /app/.next/cache
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]
```

Notes:
* `.next/standalone` ships no `public/` or `.next/static`. They are copied explicitly, and `server.js` serves them **[docs]**.
* The `.mount=type=cache` on `/app/.next/cache` keeps Turbopack's filesystem cache between builds.
* Standalone includes only traced `node_modules`. **`drizzle-orm` is bundled into the server chunks, not copied.** That is why the runtime scripts are esbuild bundles (drizzle inlined, `better-sqlite3` and `sharp` external and resolved from the traced `node_modules`) **[spike]**.

### 8.3 Entrypoint and runtime scripts

```sh
#!/bin/sh
# docker/entrypoint.sh
set -eu
mkdir -p "$(dirname "$DATABASE_PATH")" "$UPLOAD_DIR" /data/cache/images /data/backups
node /app/scripts/migrate.mjs          # idempotent
node /app/scripts/seed.mjs             # seed-if-empty + copy seed media (no overwrite)
node /app/scripts/postdeploy.mjs &     # waits for /api/health, then revalidates tag 'site' (expire: 0)
exec "$@"                              # node server.js (PID 1 is tini via compose `init: true`)
```

```ts
// scripts/postdeploy.ts
const port = process.env.PORT ?? '3000'
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) break } catch {}
  await new Promise((r) => setTimeout(r, 500))
}
const res = await fetch(`http://127.0.0.1:${port}/api/revalidate`, {
  method: 'POST',
  headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET}`, 'content-type': 'application/json' },
  body: JSON.stringify({ tags: ['site'] }),
})
console.log('[postdeploy] revalidate', res.status)
// Optional: warm the top URLs from /sitemap.xml so first visitors never pay the blocking render.
export {}
```

```ts
// src/app/api/health/route.ts
import { connection } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/db/client'

export async function GET() {
  await connection()          // never prerender the health check
  db.get(sql`select 1`)
  return Response.json({ ok: true })
}
```

Observed in the spike: the container went `healthy`, and the logs read `[migrate] ok`, `[seed] inserted`, `Ready`, `[postdeploy] revalidate 200`.

### 8.4 `docker-compose.yml`

```yaml
services:
  web:
    image: ${REGISTRY:-local}/choobz-web:${TAG:-latest}
    build:
      context: .
      args:
        SITE_URL: ${SITE_URL:-https://choobz.kids}
    platform: linux/amd64            # match the server; standalone traces arch-specific binaries
    init: true
    restart: unless-stopped
    environment:
      SITE_URL: ${SITE_URL:-https://choobz.kids}   # must equal the build arg
      REVALIDATE_SECRET: ${REVALIDATE_SECRET:?set in .env}
    volumes:
      - choobz-data:/data
    expose: ["3000"]
    stop_grace_period: 20s
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports: ["80:80", "443:443", "443:443/udp"]
    volumes:
      - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on: [web]
volumes:
  choobz-data:
  caddy-data:
  caddy-config:
```

```
# deploy/Caddyfile
choobz.kids {
  encode zstd gzip
  reverse_proxy web:3000 {
    flush_interval -1        # never buffer: streaming must stay end-to-end [docs: self-hosting]
  }
}
www.choobz.kids {
  redir https://choobz.kids{uri} permanent
}
```

With nginx instead, set `proxy_buffering off` (or send `X-Accel-Buffering: no`) and forward `Accept` so AVIF/WebP negotiation works **[docs]**.

**CDN in front?** Cache only `/_next/static/*`, `/_next/image*` and `/media/*`. Do **not** cache HTML or RSC at the CDN unless it honours Next's `Vary` (`rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch`) and we wire CMS purges. Otherwise RSC payloads can be served as HTML, and edits never propagate.

### 8.5 Environment variables

| Var | When | Value | Notes |
|---|---|---|---|
| `SITE_URL` | **build + runtime** | `https://choobz.kids` | Baked into prerendered canonicals, OG tags and the sitemap. The two values must match. |
| `DATABASE_PATH` | runtime (build uses `/tmp/build/…`) | `/data/choobz.db` | |
| `UPLOAD_DIR` | runtime | `/data/uploads` | |
| `REVALIDATE_SECRET` | runtime | random 32+ bytes | `/api/revalidate` bearer. Never a build arg. |
| `PORT`, `HOSTNAME` | runtime | `3000`, `0.0.0.0` | Read by standalone `server.js`. |
| `NEXT_TELEMETRY_DISABLED` | build + runtime | `1` | |
| `FONTCONFIG_FILE` | runtime | `/app/assets/og/fonts.conf` | Silences the sharp/Pango warning. |
| `MALLOC_ARENA_MAX` | runtime | `2` | glibc fragmentation mitigation for sharp. |
| `SEED_MEDIA_DIR`, `MIGRATIONS_DIR` | runtime | `/app/seed/uploads`, `/app/drizzle` | Used by the scripts. |

There are no `NEXT_PUBLIC_*` variables in Phase 1. Anything `NEXT_PUBLIC_` is inlined at build.

### 8.6 Volume, permissions, platform, Iran logistics

* Named volume `choobz-data` holds `/data/{choobz.db*, uploads/, cache/images/, backups/}`.
  * Docker initializes a fresh named volume with the image's `/data` ownership (`node`, uid 1000) **[spike]**.
  * A **bind mount** must be `chown 1000:1000` on the host first, or migrations fail with `EACCES`.
* Containers run as the non-root `node` user. `.next/server/app` is writable by it, because ISR writes there.
* **Docker Hub and the npm registry are slow or blocked from Iran.** Two options:
  * Build in CI outside Iran, push to a registry the server can reach, and `docker compose pull`.
  * Configure a domestic registry mirror (for example ArvanCloud's) and an npm mirror on the build host.

  Either way the build needs **no runtime internet**: fonts are local, OG rendering is local, and there are no third-party scripts.
* `.dockerignore` must exclude `node_modules`, `.next`, `.scripts`, `data`, `*.db*`, `.env*` (except `.env.example`), `docs`, `.git` and `Dockerfile*`/`docker-compose*`. The current file covers most of these; add `.scripts` and `docs`.

---

## 9. Performance

### 9.1 Budgets (mobile, 4G, mid-range Android)

| Metric | Target | Main levers |
|---|---|---|
| LCP | < 2.0 s | Static HTML from the local ISR cache (TTFB is small; the server sits in Iran) + one AVIF hero with `fetchPriority="high"` + about 70 KB of preloaded critical fonts + small CSS (consider `inlineCss`) |
| CLS | ≈ 0 | Width/height on every image, explicit line-heights (`FONTS.md` §7.2), reserved island space, no late-injected banners |
| INP | < 150 ms | Few, small client islands; CSS animations; Suspense-split hydration on long pages; no main-thread work on scroll |
| JS (initial, gzip) | framework ≈ 144 KB + islands ≤ 40 KB | see §9.2 |

### 9.2 Measured JavaScript [spike, `next build` 16.4.2, Turbopack]

* **Framework floor.** A trivial page with `next/image` and no islands ships **≈ 144 KB gzip** of initial JS:
  * React DOM about 72 KB
  * Router and runtime about 46 KB
  * `next/image` client about 8.5 KB
  * Turbopack runtime about 4 KB

  This excludes the `noModule` polyfill chunk (39 KB) that modern browsers skip. This floor is not negotiable inside the App Router, so the islands have to be lean.
* **Motion.** `LazyMotion` + `m` with **sync** `domAnimation` adds **+28.7 KB gzip**. Importing from `motion/react` or from `framer-motion` makes no difference.
* With **async features**, the initial cost is **+15 KB gzip** (about 12 KB for the `m`/LazyMotion chunk), and the feature chunks (roughly 18–30 KB gzip) load after hydration. Use this pattern:

```tsx
// src/components/ui/motion-provider.tsx
'use client'
import { LazyMotion } from 'motion/react'

const loadFeatures = () => import('./motion-features').then((mod) => mod.default)

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={loadFeatures} strict>{children}</LazyMotion>
}
// Animated islands are client components that `import * as m from 'motion/react-m'` and render <m.div>.
// Don't re-export `m` from a 'use client' module for Server Components: RSC cannot "dot into" a client reference.
// Wrap only the subtrees that animate (or the root layout's body if most pages animate).
```

```ts
// src/components/ui/motion-features.ts
import { domAnimation } from 'motion/react' // use domMax only where layout/drag animations are needed
export default domAnimation
```

`strict` throws if someone imports the full `motion.*` component, which would pull everything back in. Prefer **CSS** (transitions, `@starting-style`, scroll-driven animations) for anything decorative, and save Motion for gesture- and physics-driven moments.

### 9.3 Rendering rules

* Server Components by default. `'use client'` only on leaves:
  * cart/wishlist badge (localStorage)
  * gallery/zoom
  * installment calculator
  * age filter UI
  * the Mikhak "stretch" toy
  * share button
* Heavy, below-the-fold islands load with `next/dynamic` **inside a client component** (`ssr: false` is not allowed in Server Components **[docs]**), triggered by visibility or interaction. Examples: a 3D/AR viewer, a lightbox, a room-planner.
* Never pass large DB objects to client components. Pass ids and display strings.
* There are no third-party scripts, analytics included, in Phase 1. If analytics is added later, it must be self-hosted and loaded `afterInteractive` from `instrumentation-client.ts`.
* `content-visibility: auto` with `contain-intrinsic-size` on long article sections and footers. Supported in Chrome 85, Firefox 125 and Safari 18 **[bcd]**.

### 9.4 View Transitions

* React 19.3 makes `<ViewTransition>` and `addTransitionType` **stable**. Next 16.4 ships it **with no flag**: there is no `experimental.viewTransition` in the 16.4 config schema **[src]**, and the docs say it works "with no configuration" **[docs: view-transitions guide]**.
* `<Link transitionTypes={['nav-forward']}>` and `router.push(url, { transitionTypes })` tag navigations.
* Browser support **[bcd]**:

| Feature | Chrome/Edge | Safari/iOS | Firefox |
|---|---|---|---|
| Same-document `startViewTransition` | 111 | 18 | 144 |
| Transition types (React `addTransitionType`) | 125 | 18.2 | 147 |
| `view-transition-class` | 125 | 18.2 | 144 |
| Cross-document `@view-transition` | 126 | 18.2 | — |

Usage rules:
* Shared-element morphs: product card image → product hero (`name` = `product-{id}`, `share="morph" default="none"`).
* Suspense reveals for client-only islands.
* `::view-transition { pointer-events: none }`.
* `prefers-reduced-motion` → zero durations.
* **RTL:** "forward" moves the other way. Drive the slide offsets from a `--dir` custom property (`-1` under `[dir=rtl]`), never hard-coded `translateX(-60px)`.
* Morphs only pair when the destination renders in the same commit, which means a prefetched page. That is another reason for `prefetch={true}` on product cards.

### 9.5 CSS scroll-driven animations (late-2026 matrix) [bcd 8.1.6]

| Feature | Chrome/Edge | Safari/iOS | Firefox |
|---|---|---|---|
| `animation-timeline: scroll()` / `view()`, `animation-range`, `scroll-timeline`, `view-timeline` | 115 | **26** | **Nightly only** (stable needs a pref; Android not at all) |

Pattern: progressive enhancement, with content fully visible without support.

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: reveal linear both;      /* shorthand first … */
      animation-timeline: view();         /* … then timeline: the shorthand resets it to auto */
      animation-range: entry 0% cover 30%;
    }
  }
}
@keyframes reveal { from { opacity: 0; translate: 0 2rem; } to { opacity: 1; translate: 0 0; } }
```

* **Never** put the hidden "from" state (`opacity: 0`) outside the `@supports` block. Firefox users would get invisible content.
* No JS polyfill. Firefox simply sees static content, and its share in Iran is small.
* Use only `opacity`/`transform`-family properties on scroll timelines. They are compositor-friendly, which keeps INP clean.
* Related, now broadly supported:
  * `@starting-style`: Chrome 117, Safari 17.5, Firefox 129
  * anchor positioning: Chrome 125, Safari 26, Firefox 147
  * `text-wrap: balance` everywhere. `pretty` is not in Firefox.

### 9.6 Caching headers (what the browser sees) [spike]

| Resource | Header |
|---|---|
| Prerendered HTML | `Cache-Control: s-maxage=86400, stale-while-revalidate=31449600` (from `cacheLife('content')`). Browsers revalidate; shared caches may hold it. See the CDN note in §8.4. |
| `/_next/static/*` | `public, max-age=31536000, immutable` (fixed by Next) |
| `/_next/image` | `public, max-age=31536000, must-revalidate` + `Vary: Accept` |
| `/media/*` | `public, max-age=31536000, immutable` + ETag |
| Dynamic routes (`/api/*`) | `private, no-cache, no-store, max-age=0, must-revalidate` |

---

## 10. Source layout

```
src/
  app/                       routes (§3.1)
  components/
    ui/                      primitives (Button, Price, Badge, motion-provider.tsx, motion-features.ts)
    layout/                  SiteHeader, SiteFooter, Breadcrumbs, AnnouncementBar
    home/                    hero, category rail, pillars, testimonials, workshop story
    shop/                    ProductView, CategoryView, Gallery (client), InstallmentCalc (client)
    mag/                     ArticleView, TldrBox, FaqBlock, SourcesList, AuthorCard, GlossaryLink
    illustrations/           inline SVG React components (keys referenced by DB `illustration` columns)
  db/
    schema.ts                (exists; Phase-2-ready: status, seo fields, media, redirects, settings)
    client.ts                (§7.1; replaces index.ts)
    queries/                 shop.ts, mag.ts, glossary.ts, pages.ts, settings.ts, sitemap.ts, llms.ts
    seed/                    pure data fixtures + seedData(tx)
  lib/
    env.ts                   SITE_URL, DATABASE_PATH, UPLOAD_DIR (server-only)
    cache-tags.ts            tag taxonomy (§2.3)
    seo.ts                   pageMetadata, absoluteUrl (§4.3)
    jsonld.tsx               JsonLd + builders (§4.4)
    og.ts                    sharp/Pango OG renderer (§4.9)
    format.ts                (exists) Persian digits, Toman, Jalali dates, normalizeFa
    utils.ts                 cn() (clsx), misc
  fonts/                     woff2 subsets + LICENSES (FONTS.md §5.2)
  proxy.ts                   (when redirects are needed, §3.2)
assets/og/                   TTF subsets + fonts.conf for OG rendering
seed/uploads/                committed seed media
scripts/                     migrate.ts, seed.ts, postdeploy.ts, backup.ts
drizzle/                     generated SQL migrations + meta (committed)
docker/entrypoint.sh
deploy/Caddyfile
```

`src/lib/paths.ts` (current) folds into `env.ts`. Keep its `mediaUrl()` helper there or in `utils.ts`.

---

## 11. Phase 2 readiness checklist

* [x] Schema carries `status`, `publishedAt`, SEO fields (`seoTitle`, `seoDescription`, `canonicalPath`, `noindex`), `media` metadata, `redirects` and `settings`. It already exists in `src/db/schema.ts`.
* [x] One tag taxonomy shared by readers (`cacheTag`) and writers (`updateTag` in actions, `revalidateTag` in `/api/revalidate`).
* [x] Content-addressed uploads with metadata extraction (§6.6). Uploads go straight to the volume; no rebuild is needed.
* [x] A redeploy re-renders from the volume DB (postdeploy).
* [ ] Admin lives in its own route group without `ensureStatic`, behind auth, `noindex` and excluded from the sitemap. Every Server Action re-checks auth (proxy is not a security boundary **[docs]**).
* [ ] Draft preview: `draftMode()` makes `'use cache'` re-execute per request without saving **[docs]**. Enable it from an authenticated route handler.
* [ ] CMS enforces: slug uniqueness across `products` and `categories` (one `/shop/[slug]` namespace), `normalizeFa()` on text and slugs, SVG rejection, and alt text required.
* [ ] Once there is more than one instance: a shared `cacheHandlers` / `cacheHandler` with `refreshTags`, plus `deploymentId` and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` **[docs: self-hosting]**.

---

## 12. Gotchas (all observed or documented)

1. **Soft 404s.** Under PPR, `notFound()` inside or after a Suspense boundary yields `200` + `noindex` for browsers and Googlebot. HTML-limited bots get a real 404. Fixed by `ensureStatic = 'navigation'` + top-level `await params` **[spike]**.
2. **Stale first response after invalidation** on param routes without `ensureStatic`, even with `{ expire: 0 }`. With `'navigation'` it is a blocking fresh render **[spike]**.
3. **A redeploy reverts to build-time content** (ISR files live in the container, tag state in memory), so run postdeploy `revalidateTag('site')` **[spike]**.
4. **Sync better-sqlite3 reads are baked into prerenders without tags.** Always wrap them in `'use cache'` + `cacheTag` **[docs]**.
5. **`generateStaticParams` must return at least one item** with Cache Components, so seed every dynamic route **[docs]**.
6. **`new Date()` / `Date.now()` / `Math.random()`** in render, `generateMetadata` or the sitemap stops prerendering, and under `ensureStatic` fails the build **[docs]**.
7. **A root-layout `alternates.canonical` is inherited by every page.** Set canonicals per page only **[docs: merging]**.
8. **A page-level `openGraph` replaces the root one wholesale** (shallow merge) **[docs]**.
9. **`SITE_URL` is a build-time input** for static pages. Build arg and runtime env must match.
10. **`next/og` breaks Persian** (word order, ZWNJ) and **fetches Google Fonts and jsDelivr at runtime** for missing glyphs and emoji. Use the sharp/Pango renderer **[spike, src]**.
11. **Standalone ships arch-specific native binaries.** Build in Docker for the server's platform **[spike]**.
12. **Runtime scripts can't `import 'drizzle-orm'` from the standalone `node_modules`** (it is bundled into chunks, not traced). Bundle the scripts with esbuild **[spike]**.
13. **`server-only` throws in tsx and Node scripts.** Seed and migrate must not import server modules.
14. **Params are already decoded.** A second `decodeURIComponent` turns `%` into a 500 **[spike]**.
15. **`/media` without `Range` breaks MP4 on Safari.** Implement `206` **[spike: route returned 200 for a range request]**.
16. **`images.qualities` defaults to `[75]`** in 16. Other `q` values coerce in `<Image>` and return `400` on direct requests **[docs, spike]**.
17. **`priority` is deprecated.** Use `preload`, or `fetchPriority="high"` + `loading="eager"` **[docs]**.
18. **TypeScript 7 passes `next build` but breaks typescript-eslint and the Next IDE plugin.** Pin 6.0.3. TS 6 defaults `types` to `[]`, so set `"types": ["node"]` **[npm, TS 6 notes]**.
19. **ESLint 10 needs `--legacy-peer-deps`** with `eslint-config-next@16.4.2`'s plugins. Pin ESLint 9 **[npm, spike]**.
20. **`revalidateTag(tag)` without a profile is deprecated** (TS error). `updateTag` works only in Server Actions **[docs]**.
21. **Proxy without a matcher runs on `/_next/static` and `/_next/image` too.** Proxy is always the Node runtime; no `runtime` export is allowed **[docs]**.
22. **The `animation` shorthand resets `animation-timeline`.** Declare the timeline after it. Firefox stable has no scroll-driven animations **[bcd]**.
23. **`next/font/google` downloads at build time.** It is banned here (Iran builds and policy).
24. **The optimizer cache can only be invalidated by a URL change** (or `rm`). Never overwrite an upload in place **[docs]**.
25. **Bind-mounted `/data` must be owned by uid 1000.** Never put SQLite WAL on NFS or SMB.
26. **Fontconfig warning from sharp in slim images.** Ship `fonts.conf` and set `FONTCONFIG_FILE` **[spike]**. On macOS sharp ignores `fontfile`, so check OG output in Linux.
27. **`experimental.agentUpgrade` reminders** (default `'security'`, 16.4) can pause `next dev` and `next build` when an agent or TTY is detected. Disable them in CI **[docs]**.
28. **`next build` imports every route module during "Collecting page data"**, dynamic ones included. A module-scope DB open (`fileMustExist: true`) therefore fails the build when the DB is missing (`Failed to collect configuration for /api/health: Cannot open database`). Keep the build-time DB step in the builder stage **[spike]**.

---

## 13. Sources

* Bundled docs in `next@16.4.2` `dist/docs/`, notably:
  * `01-app/02-guides/upgrading/version-16.md`
  * `01-app/01-getting-started/08-caching.md`
  * `01-app/02-guides/incremental-static-regeneration-cache-components.md`
  * `01-app/02-guides/how-revalidation-works.md`
  * `01-app/02-guides/self-hosting.md`
  * `01-app/02-guides/streaming.md`
  * `01-app/02-guides/view-transitions.md`
  * `01-app/02-guides/content-security-policy.md`
  * `03-api-reference/01-directives/use-cache.md`
  * `04-functions/{cacheLife,cacheTag,revalidateTag,updateTag,generate-static-params,generate-metadata,image-response,generate-sitemaps}.md`
  * `03-file-conventions/{proxy,route-segment-config/ensureStatic,route-segment-config/instant}.md`
  * `03-file-conventions/01-metadata/{sitemap,robots,opengraph-image}.md`
  * `02-components/{image,font}.md`
  * `05-config/01-next-config-js/{cacheComponents,partialPrefetching,reactCompiler,turbopackRustReactCompiler,useTypeScriptCli,typedRoutes,serverExternalPackages,output,inlineCss,htmlLimitedBots,agentUpgrade,compress}.md`
  * `05-config/02-typescript.md`
* Compiled source in `next@16.4.2`:
  * `dist/server/image-optimizer.js` (internal fetch, cache dir, headers)
  * `dist/server/lib/incremental-cache/file-system-cache.js` (ISR file paths)
  * `dist/server/config.js` (localPatterns defaults)
  * `dist/shared/lib/router/utils/html-bots.js`
  * `dist/compiled/@vercel/og/index.node.js` (Google Fonts and jsDelivr fetches)
  * `dist/compiled/react` (version `19.3.0-canary-278794d7-20261002`)
* Release posts: [Next.js 16.4](https://nextjs.org/blog/next-16-4) (2026-10-06) and [Next.js 16.3](https://nextjs.org/blog/next-16-3) (2026-08-03).
* [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/): changed defaults and deprecations.
* [sharp installation](https://sharp.pixelplumbing.com/install): prebuilt platforms, glibc allocator note, fontconfig.
* `@mdn/browser-compat-data@8.1.6` (npm, 2026-10-15) and the [MDN `animation-timeline` page](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline).
* npm registry metadata (`npm view`) for every package in §1.1, read on 2026-10-16.
* `create-next-app@16.4.2` compiled source (Tailwind loader selection).
