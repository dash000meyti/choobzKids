import type { Metadata } from "next";
import { PageTurn } from "@/components/layout/PageTurn";
import { AgeRail } from "@/components/studio/AgeRail";
import { AssemblyStory } from "@/components/studio/AssemblyStory";
import { MagRow } from "@/components/studio/MagRow";
import { ProductTile } from "@/components/studio/ProductTile";
import { RoomBanner } from "@/components/studio/RoomBanner";
import { WhyChoobz } from "@/components/studio/WhyChoobz";
import { getProductCardsBySlugs } from "@/db/queries/catalog";
import { listArticleCards, listRoomCards } from "@/db/queries/cards";
import { getSettings } from "@/db/queries/settings";
import { graph, JsonLd, webPageNode } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

const TITLE = "چوبز کیدز | وسایل چوبی مونته‌سوری و پیکلر، ساخت کارگاه";
const DESCRIPTION =
  "برج یادگیری، مثلث و آرک پیکلر، نردبان سوئدی و اسباب‌بازی چوبی از تختهٔ چندلای توس، ساخت کارگاه چوبز؛ با ارسال به سراسر ایران و ۴ قسط با اسنپ‌پی.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/" });

/* Tile copy: one line each, in the brand's calm voice. */
const TILES: { slug: string; tagline: string; title?: string; angle?: "hero" | "front" | "side" | "low"; tone?: "light" | "night" }[] = [
  { slug: "pikler-arch", tagline: "پل امروز، گهوارهٔ فردا." },
  { slug: "swedish-ladder", tagline: "دیوار صعود، برای انرژیِ تمام‌نشدنی.", tone: "night" },
  { slug: "front-facing-bookshelf", tagline: "جلدها رو به کودک، انتخاب با خودش.", tone: "night" },
  { slug: "montessori-shelf", tagline: "هر اسباب‌بازی، سر جای خودش." },
  { slug: "wall-art-roll", tagline: "یک رول کاغذ، هزار نقاشی." },
  { slug: "duck-pull-toy", tagline: "اولین همراهِ قدم‌های اول.", tone: "night" },
];

export default async function HomePage() {
  const [settings, products, posts, rooms] = await Promise.all([
    getSettings(),
    getProductCardsBySlugs(["learning-tower", "pikler-triangle", ...TILES.map((t) => t.slug)]),
    listArticleCards({ featured: true, limit: 3 }),
    listRoomCards(),
  ]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const tower = bySlug.get("learning-tower");
  const triangle = bySlug.get("pikler-triangle");
  const roomFrom = rooms.length ? Math.min(...rooms.map((r) => r.totalToman)) : null;

  return (
    <PageTurn>
      <JsonLd data={graph(webPageNode({ path: "/", name: TITLE, description: DESCRIPTION }))} />
      <h1 className="sr-only">چوبز کیدز؛ اسباب‌بازی و وسایل چوبی مونته‌سوری، ساخت کارگاه چوبز</h1>

      <div className="flex flex-col gap-3 md:pb-3">
        {tower && (
          <ProductTile
            product={tower}
            size="hero"
            eyebrow="محبوب‌ترینِ چوبز"
            title="برج یادگیری"
            tagline="کنار شما، در قلب آشپزخانه."
            snapppay={settings.snapppay}
            priority
            entrance
          />
        )}
        {triangle && (
          <ProductTile
            product={triangle}
            size="hero"
            tone="night"
            title="مثلث پیکلر"
            tagline="اولین کوهِ زندگی‌اش."
            snapppay={settings.snapppay}
          />
        )}
        <div className="grid gap-3 md:grid-cols-2 md:px-3">
          {TILES.map((t) => {
            const product = bySlug.get(t.slug);
            return product ? (
              <ProductTile
                key={t.slug}
                product={product}
                tagline={t.tagline}
                title={t.title}
                angle={t.angle}
                tone={t.tone}
                snapppay={settings.snapppay}
              />
            ) : null;
          })}
        </div>
      </div>

      <AssemblyStory />
      <WhyChoobz />
      <AgeRail />
      <RoomBanner fromToman={roomFrom} snapppay={settings.snapppay} />
      <MagRow posts={posts} />
    </PageTurn>
  );
}
