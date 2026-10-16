import type { Metadata } from "next";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { CartPageClient } from "@/components/shop/CartPageClient";
import { pageMetadata, SITE } from "@/lib/seo";

/*
 * /cart (DESIGN.md §4.7, SEO.md §1.2): a static shell around the browser cart. Never indexed
 * (robots noindex, no canonical); the lines render on the client from localStorage.
 */

export const metadata: Metadata = pageMetadata({
  title: "سبد خرید",
  description: "وسایلی که در سبد خرید چوبز گذاشته‌اید، با جمع کل و امکان ثبت سفارش در بله.",
  path: "/cart",
  noindex: true,
});

const TRAIL = crumbTrail({ name: "سبد خرید", path: "/cart" });

export default function CartPage() {
  return (
    <PageTurn>
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={TRAIL} />
        <h1 className="mt-4 text-3xl text-ink">سبد خرید</h1>
        <CartPageClient siteUrl={SITE.url} />
      </div>
    </PageTurn>
  );
}
