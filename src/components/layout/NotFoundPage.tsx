import Form from "next/form";
import Link from "@/components/ui/Link";
import { pill } from "@/components/studio/Actions";
import { Render } from "@/components/studio/Render";
import { Icon } from "@/components/ui/Icon";
import { listCategories } from "@/db/queries/catalog";
import { getMagHome } from "@/db/queries/mag";
import { MAX_QUERY_LENGTH } from "@/db/queries/search";

/*
 * The 404 content (DESIGN.md §8, §11.2 #13): the way out is search, the shop's categories, the
 * pillar guides and «برگردیم خونه؟». `page-404` is the hook other styles rely on. Rendered by
 * app/(site)/not-found.tsx (inside the site layout) and app/not-found.tsx (which adds the chrome).
 */

export async function NotFoundPage() {
  const [categories, mag] = await Promise.all([listCategories(), getMagHome()]);
  const stocked = categories.filter((category) => category.productCount > 0);
  return (
    <div className="page-404 mx-auto max-w-page px-gutter pb-section">
      <header className="mx-auto flex max-w-2xl flex-col items-center pt-12 text-center lg:pt-20">
        <div className="w-56 lg:w-72" aria-hidden="true">
          <Render productKey="duck-pull-toy" angle="hero" alt="" sizes="288px" box="4 / 3" priority />
        </div>
        <p className="eyebrow mt-6">خطای ۴۰۴</p>
        <h1 className="headline mt-1 text-3xl lg:text-[4rem]">این صفحه پیدا نشد</h1>
        <p className="mt-3 text-lead text-muted">نخ از دستمون در رفت! شاید آدرس عوض شده باشد؛ از این‌جا راه را پیدا کنیم.</p>

        <Form action="/search" prefetch={false} role="search" className="mt-8 flex w-full max-w-lg items-stretch gap-2">
          <label htmlFor="nf-q" className="sr-only">
            دنبال چی می‌گردی؟
          </label>
          <div className="relative min-w-0 flex-1">
            <Icon name="search" className="pointer-events-none absolute inset-y-0 start-4 my-auto size-5 text-muted" />
            <input
              id="nf-q"
              name="q"
              type="search"
              placeholder="دنبال چی می‌گردی؟"
              maxLength={MAX_QUERY_LENGTH}
              autoComplete="off"
              enterKeyHint="search"
              dir="rtl"
              className="h-12 w-full rounded-full bg-surface ps-12 pe-4 text-base text-ink placeholder:text-muted focus-visible:outline-3 focus-visible:outline-focus"
            />
          </div>
          <button type="submit" className={pill("primary", "lg")}>
            جستجو
          </button>
        </Form>

        <Link href="/" className={`${pill("ghost", "lg")} mt-5`}>
          برگردیم خونه؟
        </Link>
      </header>

      {/* Plain text links: this tree is part of every page's payload (it is the not-found boundary). */}
      <div className="mx-auto mt-16 grid max-w-3xl gap-10 sm:grid-cols-2">
        {stocked.length ? (
          <nav aria-labelledby="nf-shop">
            <h2 id="nf-shop" className="text-sm font-semibold text-muted">
              دسته‌های فروشگاه
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {stocked.map((category) => (
                <li key={category.slug}>
                  <Link href={`/shop/${category.slug}`} className="inline-flex h-10 items-center rounded-full bg-surface px-4 text-sm font-semibold text-ink hover:bg-line">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        {mag.pillars.length ? (
          <nav aria-labelledby="nf-guides">
            <h2 id="nf-guides" className="text-sm font-semibold text-muted">
              راهنماهای کامل
            </h2>
            <ul className="mt-3 flex flex-col">
              {mag.pillars.slice(0, 3).map((pillar) => (
                <li key={pillar.id} className="border-b border-line last:border-b-0">
                  <Link href={`/mag/${pillar.slug}`} className="link-arrow flex min-h-12 items-center text-sm">
                    {pillar.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
