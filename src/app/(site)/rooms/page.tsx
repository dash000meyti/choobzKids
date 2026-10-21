import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { RoomCard } from "@/components/shop/RoomCard";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { Kicker } from "@/components/ui/Kicker";
import { listRoomCards } from "@/db/queries/cards";
import { getSettings } from "@/db/queries/settings";
import { toFaDigits } from "@/lib/format";
import { breadcrumbNode, collectionNodes, graph, JsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /rooms (DESIGN.md §0.3 #5, §6.4): the shelf of ready-made Montessori rooms, one RoomCard per
 * preset in age order, then the 9 m² room. CollectionPage + url-only ItemList of the presets.
 */

const PATH = "/rooms";
const TITLE = "چیدمان آمادهٔ اتاق مونته‌سوری، سن به سن";
const DESCRIPTION =
  "شش چیدمان آماده برای اتاق کودک، از نوزادی تا ۶ سالگی و اتاق کوچک ۹ متری، با وسایل چوبی چوبز؛ قیمت کامل هر اتاق را ببینید و ۴ قسطی بخرید.";
const TRAIL = crumbTrail({ name: "اتاق‌ها", path: PATH });

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

export default async function RoomsPage() {
  const [rooms, settings] = await Promise.all([listRoomCards(), getSettings()]);
  const small = rooms.find((room) => room.variant === "small");

  const jsonLd = graph(
    collectionNodes({
      path: PATH,
      name: TITLE,
      description: DESCRIPTION,
      breadcrumb: true,
      items: rooms.map((room) => ({ path: `/rooms/${room.slug}`, name: room.name })),
      order: "ascending",
    }),
    breadcrumbNode(TRAIL),
  );

  const consult = settings.socials.bale ? "مشاورهٔ رایگانِ چیدمان در بله" : "برای چیدمان اتاق، از خودِ کارگاه بپرس";

  return (
    <PageTurn>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={TRAIL} />

        <header className="mt-6 flex max-w-3xl flex-col gap-3">
          <Kicker decorative>اتاقش رو بچین</Kicker>
          <h1 className="text-3xl text-ink">{TITLE}</h1>
          <div className="flex max-w-prose flex-col gap-3 text-lead text-muted">
            <p>
              هر سن، اتاق خودش را می‌خواهد. این‌جا {toFaDigits(rooms.length)} چیدمان آماده را می‌بینید که با وسایل چوبی
              چوبز کنار هم چیده شده‌اند: از قفسهٔ کوتاه و کتابخانهٔ روبه‌رو برای ماه‌های اول، تا مثلث پیکلر برای بالا
              رفتن، برج یادگیری برای کمک در آشپزخانه و دیوار صعود برای سال‌های پیش‌دبستانی.
            </p>
            <p>
              هر اتاق با اندازه‌های واقعی کشیده شده و قیمت کامل و قسط‌هایش کنارش آمده است. در صفحهٔ هر چیدمان می‌توانید
              تکه‌هایی را که لازم ندارید بردارید و بقیه را یک‌جا به سبد اضافه کنید.
              {small ? (
                <>
                  {" "}
                  اتاق کوچکی دارید؟{" "}
                  <Link href={`/rooms/${small.slug}`} transitionTypes={["nav-forward"]} className="link-mark text-ink">
                    {small.name}
                  </Link>{" "}
                  را ببینید.
                </>
              ) : null}
            </p>
          </div>
        </header>

        <h2 className="sr-only">چیدمان‌ها</h2>
        <ul role="list" className="mt-10 grid gap-5 md:grid-cols-2 lg:mt-14 lg:gap-6">
          {rooms.map((room) => (
            <li key={room.id}>
              <RoomCard room={room} />
            </li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col gap-8 lg:mt-20 lg:flex-row lg:items-start lg:justify-between">
          <p className="max-w-prose text-base text-muted">
            دنبال وسایلِ یک سن خاص هستید؟ بازی‌ها و وسایل هر دوره را در{" "}
            <Link href="/age" className="link-mark text-ink">
              سن به سن
            </Link>{" "}
            ببینید، یا همهٔ محصولات را در{" "}
            <Link href="/shop" className="link-mark text-ink">
              فروشگاه
            </Link>
            .
          </p>
          <AskChoobz socials={settings.socials} title={consult} className="lg:max-w-md" />
        </div>
      </div>
    </PageTurn>
  );
}
