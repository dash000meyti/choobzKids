import type { Metadata } from "next";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { AgeHubCard, DoorScene } from "@/components/mag/AgeHubHero";
import { Kicker } from "@/components/ui/Kicker";
import { getAgeIndex } from "@/db/queries/age";
import { WHO_SOURCE } from "@/lib/ages";
import { breadcrumbNode, collectionNodes, graph, JsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /age «سن به سن» (DESIGN.md §7.5, SEO.md §1.5): the three age hubs as large hex cards and the
 * height-mark door in its default stage. JSON-LD: CollectionPage + ItemList of the hubs.
 */

const PATH = "/age";
const TITLE = "سن به سن: بازی و وسایل مناسب هر سن";
const DESCRIPTION =
  "نقاط عطف رشد، بازی‌های پیشنهادی و وسایل چوبی مناسب کودک از نوزادی تا ۶ سالگی، در سه بازهٔ ۰ تا ۱۲ ماه، ۱ تا ۳ سال و ۳ تا ۶ سال؛ همراه با چیدمان آمادهٔ اتاق.";
const TRAIL = crumbTrail({ name: "سن به سن", path: PATH });

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

export default async function AgeIndexPage() {
  const { hubs, scene } = await getAgeIndex();

  const ld = graph(
    collectionNodes({
      path: PATH,
      name: TITLE,
      description: DESCRIPTION,
      breadcrumb: true,
      audience: { minMonths: 0, maxMonths: 72 },
      items: hubs.map((hub) => ({ path: `/age/${hub.slug}`, name: hub.h1 })),
      order: "ascending",
    }),
    breadcrumbNode(TRAIL),
  );

  return (
    <PageTurn>
      <div className="frame-col frame-pad pt-6 pb-band lg:pt-10">
        <Breadcrumbs items={TRAIL} />

        <header className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-12">
          <div className="flex min-w-0 flex-col gap-3">
            <Kicker tone="success" doodle="sprout" decorative>
              بچه‌ت چند وقتشه؟
            </Kicker>
            <h1 className="text-3xl text-ink">{TITLE}</h1>
            <p className="max-w-prose text-lead text-muted">
              هر سن، بازی و وسایل خودش را می‌خواهد. سن کودکتان را پیدا کنید تا ببینید در این ماه‌ها چه مهارت‌هایی پیدا
              می‌کند، در خانه با او چه بازی کنید و کدام وسیلهٔ چوبی برای همین روزهای رشدش ساخته شده است.
            </p>
          </div>
          <figure className="flex min-w-0 flex-col gap-2">
            <DoorScene scene={scene} />
            <figcaption className="text-2xs text-muted">
              خط‌های قد روی چارچوب: میانگین قد کودکان در هر سن · {WHO_SOURCE}
            </figcaption>
          </figure>
        </header>

        <section aria-label="سه بازهٔ سنی" className="frame-rule-in frame-band">
          <ul className="grid gap-6 md:grid-cols-3 md:gap-5">
            {hubs.map((hub) => (
              <li key={hub.slug} className="grid">
                <AgeHubCard hub={hub} />
              </li>
            ))}
          </ul>
        </section>
      </div>
      <JsonLd data={ld} />
    </PageTurn>
  );
}
