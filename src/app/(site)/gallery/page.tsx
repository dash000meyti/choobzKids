import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/ui/Link";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { socialLinks } from "@/components/layout/socials";
import { pill } from "@/components/studio/Actions";
import { hasRender, Render } from "@/components/studio/Render";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { getGallery, type GalleryPhoto } from "@/db/queries/pages";
import { getSettings } from "@/db/queries/settings";
import { breadcrumbNode, graph, ids, JsonLd, ref, webPageNode } from "@/lib/jsonld";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import type { ImageObject } from "schema-dts";
import { mediaUrl } from "@/lib/utils";

/*
 * /gallery «عکس‌های شما» (DESIGN.md §8, SEO.md §1.2, §3.5.10): families' photos with the products,
 * each with a placard (child, city, product). Photos need consent (getGallery enforces it, and
 * drops seed samples in production). Drawn sample frames show the product's studio render and are
 * tagged «نمونه». The last frame invites the next photo. JSON-LD: CollectionPage + an ImageObject
 * per real photo. Until a real photo exists the page is noindex (and out of the sitemap).
 */

const PATH = "/gallery";
const TITLE = "عکس‌های شما";
const SEO_TITLE = "عکس‌های شما؛ وسایل چوبز در خانهٔ خانواده‌ها";
const DESCRIPTION =
  "عکس بچه‌ها با برج یادگیری، مثلث پیکلر و دیگر وسایل چوبی چوبز در خانه‌های خودشان؛ با اجازهٔ خانواده‌ها و همراه با نام وسیله و شهر.";

export async function generateMetadata(): Promise<Metadata> {
  const photos = await getGallery();
  return pageMetadata({
    title: SEO_TITLE,
    description: DESCRIPTION,
    path: PATH,
    noindex: !photos.some((p) => p.image && !p.isSample),
  });
}

function placard(photo: GalleryPhoto): string {
  return [photo.customerName, photo.city].filter(Boolean).join(" · ");
}

function Frame({ photo, priority }: { photo: GalleryPhoto; priority: boolean }) {
  const render = !photo.image && photo.illustration && hasRender(photo.illustration) ? photo.illustration : null;
  const who = placard(photo);
  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-surface">
      <div className="relative">
        {photo.image && photo.image.width && photo.image.height ? (
          <Image
            src={mediaUrl(photo.image.path)}
            width={photo.image.width}
            height={photo.image.height}
            alt={photo.image.alt}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            placeholder={photo.image.blurDataUrl ? "blur" : "empty"}
            blurDataURL={photo.image.blurDataUrl ?? undefined}
            style={photo.image.dominantColor ? { backgroundColor: photo.image.dominantColor } : undefined}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : render ? (
          <div className="px-[14%] pt-[10%] pb-[2%]">
            <Render productKey={render} alt={photo.product ? photo.product.name : ""} sizes="(min-width: 1024px) 24vw, 60vw" box="4 / 3" />
          </div>
        ) : null}
        {photo.isSample ? <SampleBadge className="absolute start-4 top-4" /> : null}
      </div>
      <figcaption className="flex flex-1 flex-col gap-1 p-6 pt-4">
        {photo.caption ? <p className="text-base leading-relaxed text-ink">{photo.caption}</p> : null}
        <p className="mt-auto pt-2 text-sm text-muted">
          {who ? <span className="font-semibold text-ink">{who}</span> : null}
          {who && photo.product ? " · " : null}
          {photo.product ? (
            <>
              با{" "}
              <Link href={`/product/${photo.product.slug}`} className="text-link hover:underline">
                {photo.product.name}
              </Link>
            </>
          ) : null}
        </p>
      </figcaption>
    </figure>
  );
}

export default async function GalleryPage() {
  const [photos, settings] = await Promise.all([getGallery(), getSettings()]);
  const trail = crumbTrail({ name: TITLE, path: PATH });
  const links = socialLinks(settings.socials);
  const send = settings.socials.bale ?? links.instagramDm;
  const hasSamples = photos.some((p) => p.isSample);
  const real = photos.filter((p) => p.image && !p.isSample);

  const images = real.map((p, i) => {
    const url = absoluteUrl(mediaUrl(p.image!.path));
    return {
      "@type": "ImageObject",
      "@id": `${absoluteUrl(PATH)}#photo-${i + 1}`,
      url,
      contentUrl: url,
      // Pixel sizes as plain numbers, as Google documents them (schema-dts only types Distance).
      ...((p.image!.width && p.image!.height ? { width: p.image!.width, height: p.image!.height } : {}) as object),
      caption: p.caption ?? p.image!.alt,
      ...(placard(p) ? { creditText: placard(p) } : {}),
      ...(p.product ? { about: ref(ids.product(p.product.slug)) } : {}),
      copyrightNotice: `© ${placard(p) || "خانوادهٔ صاحب عکس"}`,
    } as ImageObject & { "@id": string };
  });
  const jsonLd = graph(
    webPageNode({
      type: "CollectionPage",
      path: PATH,
      name: SEO_TITLE,
      description: DESCRIPTION,
      breadcrumb: true,
      ...(images.length ? { hasPart: images.map((img) => img["@id"]) } : {}),
    }),
    breadcrumbNode(trail),
    ...images,
  );

  return (
    <PageTurn>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={trail} />
        <header className="mx-auto mt-8 flex max-w-2xl flex-col items-center text-center lg:mt-12">
          <p className="eyebrow">از خونه‌های شما</p>
          <h1 className="headline mt-1 text-3xl lg:text-[4rem]">{TITLE}</h1>
          <p className="mt-3 text-lead text-muted">
            عکس بچه‌ها با وسایل چوبز رو با هشتگ #چوبز_کیدز یا توی کانال بله برامون بفرستید؛ شاید قاب بعدی مال شما باشه.
          </p>
          {hasSamples ? (
            <p className="mt-4 flex items-center gap-3 text-sm text-muted">
              <SampleBadge />
              این قاب‌ها نمونه‌اند و فقط در نسخهٔ آزمایشی سایت دیده می‌شوند.
            </p>
          ) : null}
        </header>

        <ul className={photos.length ? "mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "mx-auto mt-12 grid max-w-md"}>
          {photos.map((photo, i) => (
            <li key={photo.id}>
              <Frame photo={photo} priority={i === 0} />
            </li>
          ))}
          <li>
            <div className="flex h-full min-h-72 flex-col items-center justify-center gap-4 rounded-[1.75rem] p-8 text-center ring-1 ring-line ring-inset">
              <p className="text-xl font-extrabold text-ink">این قاب، منتظر شماست.</p>
              <p className="text-sm text-muted">با اجازهٔ خودتون و فقط با نام کوچک بچه و شهر منتشرش می‌کنیم.</p>
              {send ? (
                <a href={send} target="_blank" rel="noopener" className={pill("primary")}>
                  فرستادن عکس
                </a>
              ) : null}
            </div>
          </li>
        </ul>

        <nav aria-label="بیشتر از خانواده‌ها" className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-2">
          <Link href="/reviews" className="link-arrow text-base">
            رضایت شما
          </Link>
          <Link href="/shop" className="link-arrow text-base">
            همهٔ محصولات
          </Link>
        </nav>
      </div>
    </PageTurn>
  );
}
