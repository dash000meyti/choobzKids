import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ArticleCard, FORMAT_LABEL } from "@/components/mag/ArticleCard";
import { TermCard } from "@/components/mag/TermCard";
import { CategoryCubby } from "@/components/shop/CategoryCubby";
import { ProductCard } from "@/components/shop/ProductCard";
import { RoomCard } from "@/components/shop/RoomCard";
import { Kicker } from "@/components/ui/Kicker";
import { listCategories, listProductCards, type ProductCardData } from "@/db/queries/catalog";
import { listArticleCards, listRoomCards, listTermCards, type ArticleCardData, type PostFormat } from "@/db/queries/cards";
import { IS_PRODUCTION_CONTENT } from "@/lib/env";
import kit from "../kit.module.css";

/*
 * Dev-only showcase of every card (DESIGN.md §4.11) with real seed data, inside the real site
 * shell so quick-add, the cart hop and toasts work. 404s in production; never indexed.
 *
 * State demos (sale, out of stock, a format the seed has no post for…) are copies of real rows
 * with one field changed. Their ids are negated so each shared-element morph name
 * (`product-{id}`, `post-{id}`) stays unique on the page; their links still open the real pages.
 */

export const metadata: Metadata = {
  title: "کیت کارت‌ها",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

const PRODUCT_GRID = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4";

function Latin({ children }: { children: ReactNode }) {
  return (
    <bdi lang="en" dir="ltr" className="font-mono text-2xs text-muted">
      {children}
    </bdi>
  );
}

function Block({ title, name, note, children }: { title: string; name: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-line pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="flex flex-wrap items-baseline gap-x-3 text-xl font-bold text-ink">
          {title} <Latin>{name}</Latin>
        </h2>
        {note ? <p className="max-w-prose text-sm text-muted">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <div className="flex-1">{children}</div>
    </li>
  );
}

type ProductState = { label: string; product: ProductCardData; seasonal?: boolean; showCategory?: boolean };

/** A copy of a real row showing one state; `salt` keeps several copies of one row apart. */
function demoProduct(product: ProductCardData, salt: number, patch: Partial<ProductCardData>): ProductCardData {
  return { ...product, ...patch, id: -(product.id * 10 + salt) };
}

function demoPost(post: ArticleCardData, salt: number, patch: Partial<ArticleCardData>): ArticleCardData {
  return { ...post, ...patch, id: -(post.id * 10 + salt) };
}

export default async function KitCardsPage() {
  if (IS_PRODUCTION_CONTENT) notFound();

  const [products, categories, posts, rooms, terms] = await Promise.all([
    listProductCards(),
    listCategories(),
    listArticleCards(),
    listRoomCards(),
    listTermCards(),
  ]);

  const bySlug = (slug: string) => products.find((p) => p.slug === slug);
  const tower = bySlug("learning-tower");
  const shelf = bySlug("montessori-shelf");
  const stacker = bySlug("rainbow-stacker");
  const ladder = bySlug("swedish-ladder");
  const duck = bySlug("duck-pull-toy");

  const states: (ProductState | undefined)[] = [
    shelf && { label: "با نام دسته (جست‌وجو)", product: demoProduct(shelf, 1, {}), showCategory: true },
    stacker && { label: "پیشنهاد فصل (یلدا)", product: demoProduct(stacker, 1, {}), seasonal: true },
    shelf && { label: "تخفیف (قیمت قبلی + مهر تخفیف)", product: demoProduct(shelf, 2, { compareAtPrice: 7_500_000 }) },
    ladder && { label: "پیش‌سفارش", product: demoProduct(ladder, 1, { availability: "preorder" }) },
    tower && { label: "فعلاً تموم شده (بدون افزودن سریع)", product: demoProduct(tower, 1, { availability: "out_of_stock" }) },
    shelf && { label: "بدون طرح و عکس", product: demoProduct(shelf, 3, { illustration: null, image: null }) },
  ];
  const productStates = states.filter((state): state is ProductState => state !== undefined);

  // One card per format: a real post where the seed has that format, otherwise a copy of the first post.
  const formats = Object.keys(FORMAT_LABEL) as PostFormat[];
  const formatCards = posts.length
    ? formats.map((format, i) => {
        const real = posts.find((p) => p.format === format && !p.isPillar) ?? posts.find((p) => p.format === format);
        const base = posts[(i + 1) % posts.length];
        return { format, demo: !real, post: real ?? demoPost(base, i + 1, { format, isPillar: false }) };
      })
    : [];
  const featuredPost = posts.find((p) => p.featured) ?? posts[0];
  const withDrawing = terms.filter((t) => t.illustration).slice(0, 3);
  const withoutDrawing = terms.filter((t) => !t.illustration).slice(0, 3);

  return (
    <SiteShell>
      <div className="mx-auto flex max-w-page flex-col gap-10 px-gutter py-12">
        <header className="flex flex-col gap-2">
          <Kicker tone="muted">فقط برای توسعه</Kicker>
          <h1 className="font-display text-3xl">کیت کارت‌های چوبز</h1>
          <p className="max-w-prose text-muted">
            همهٔ کارت‌ها با دادهٔ واقعی سید: محصول، قفسهٔ دسته، اتاق آماده، مقاله و واژه. نسخه‌های «حالت» کپیِ یک ردیف
            واقعی با یک فیلدِ تغییرکرده‌اند.
          </p>
        </header>

        <Block
          title="کارت محصول"
          name="shop/ProductCard"
          note="چهار کارت اول پیش‌بارگذاری کامل دارند و کارت اول تصویر LCP است. محصولات چندمدلی با «+» برگهٔ انتخاب مدل را باز می‌کنند؛ اسباب‌بازی‌ها روی هاور بازی می‌کنند."
        >
          <ul className={PRODUCT_GRID}>
            {products.map((product, i) => (
              <li key={product.id}>
                <ProductCard product={product} prefetch={i < 4} priority={i === 0} />
              </li>
            ))}
          </ul>
        </Block>

        <Block title="کارت محصول · حالت‌ها" name="ProductCard states">
          <ul className={PRODUCT_GRID}>
            {productStates.map(({ label, product, seasonal, showCategory }) => (
              <Labelled key={product.id} label={label}>
                <ProductCard product={product} seasonalStamp={seasonal} showCategory={showCategory} />
              </Labelled>
            ))}
          </ul>
        </Block>

        <Block title="قفسهٔ دسته" name="shop/CategoryCubby" note="ردیف اول اندازهٔ قفسهٔ خانه (با افتادن روی اسکرول)، ردیف دوم نسخهٔ فشرده برای ریل دسته‌ها و جست‌وجو.">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryCubby category={category} />
              </li>
            ))}
          </ul>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:max-w-narrow">
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryCubby category={category} compact />
              </li>
            ))}
          </ul>
        </Block>

        <Block title="اتاق آماده" name="shop/RoomCard" note="جمع با قیمت فعلی تکه‌های پیش‌فرض؛ در ستون باریک صحنه بالای متن و در ستون پهن کنار آن.">
          <ul className="grid gap-4 md:grid-cols-2">
            {rooms.map((room) => (
              <li key={room.id}>
                <RoomCard room={room} />
              </li>
            ))}
          </ul>
          {rooms[0] ? (
            <div className="max-w-xs">
              <RoomCard room={rooms[0]} />
            </div>
          ) : null}
        </Block>

        <Block
          title="کارت مقاله"
          name="mag/ArticleCard"
          note="یک کارت برای هر قالب با گوشهٔ نوشت‌افزارِ خودش. قالب‌هایی که در سید پستی ندارند، کپیِ یک پست واقعی‌اند."
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {formatCards.map(({ format, demo, post }, i) => (
              <Labelled key={format} label={`${FORMAT_LABEL[format].label}${demo ? " (نمونهٔ قالب)" : ""}`}>
                <ArticleCard post={post} prefetch={i < 3} />
              </Labelled>
            ))}
          </ul>
          {featuredPost ? (
            <div className="flex max-w-4xl flex-col gap-2">
              <p className="text-xs font-semibold text-muted">اندازهٔ بزرگ (size=lg): در جای پهن، جلد کنار متن</p>
              <ArticleCard post={demoPost(featuredPost, 9, {})} size="lg" />
            </div>
          ) : null}
        </Block>

        <Block title="کارت واژه" name="mag/TermCard" note="با طرح وقتی واژه نام یکی از محصولات ماست؛ بقیه فقط متن.">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...withDrawing, ...withoutDrawing].map((term) => (
              <li key={term.id}>
                <TermCard term={term} />
              </li>
            ))}
          </ul>
        </Block>

        <Block title="روی توکن‌های «لالایی»" name="dark tokens">
          <div className={`${kit.panel} ${kit.dark}`} data-theme="dark">
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stacker ? (
                <li>
                  <ProductCard product={demoProduct(stacker, 8, {})} />
                </li>
              ) : null}
              {duck ? (
                <li>
                  <ProductCard product={demoProduct(duck, 8, {})} seasonalStamp />
                </li>
              ) : null}
              <li>
                {posts[0] ? <ArticleCard post={demoPost(posts[0], 8, {})} /> : null}
              </li>
              <li className="flex flex-col gap-4">
                {categories[0] ? <CategoryCubby category={categories[0]} compact /> : null}
                {withDrawing[0] ? <TermCard term={withDrawing[0]} /> : null}
              </li>
            </ul>
            {rooms[1] ? (
              <div className="mt-4 max-w-2xl">
                <RoomCard room={rooms[1]} />
              </div>
            ) : null}
          </div>
        </Block>
      </div>
    </SiteShell>
  );
}
