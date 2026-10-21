import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Breadcrumbs, crumbTrail } from "@/components/layout/Breadcrumbs";
import { PageTurn } from "@/components/layout/PageTurn";
import { Prose } from "@/components/mag/Prose";
import { RoomBuilder } from "@/components/shop/RoomBuilder";
import { EYE_LINE_CM, RoomScene } from "@/components/shop/RoomScene";
import { isRoomSlot, ROOM_SLOTS } from "@/components/shop/room-slots";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Kicker } from "@/components/ui/Kicker";
import { listRoomCards } from "@/db/queries/cards";
import { getRoomPreset, listRoomFaqs, listRoomPresets, type RoomFaq, type RoomFootprint, type RoomPresetPage } from "@/db/queries/rooms";
import { getSettings } from "@/db/queries/settings";
import { AGE_STAGES } from "@/lib/ages";
import { toFaDigits } from "@/lib/format";
import { breadcrumbNode, collectionNodes, faqNode, graph, JsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/*
 * /rooms/{preset} (DESIGN.md §6.4, §0.3 #5): one ready-made room. The scene at true scale with the
 * dashed 70 cm eye line, the same editable panel as the home door (toggles, total, wheels,
 * «همه را به سبد اضافه کن»), the preset's own editorial, the 9 m² floor plan on the small room,
 * the room FAQ (FAQPage) and «مشاورهٔ رایگانِ چیدمان». CollectionPage + url-only ItemList.
 */

/*
 * `params` is awaited before any Suspense so an unknown preset is a real 404 (TECH.md §2.5). Every
 * preset is prerendered by generateStaticParams, so navigations land on a complete static page;
 * the dev-only instant-shell validation (which assumes an unlisted param) is off here.
 */
export const instant = false;

export async function generateStaticParams() {
  return (await listRoomPresets()).map((room) => ({ preset: room.slug }));
}

const stageOf = (room: RoomPresetPage) => AGE_STAGES.find((stage) => stage.key === room.ageStage) ?? null;

/** «چیدمان اتاق مونته‌سوری ۲ تا ۳ سال؛ قیمت کامل و خرید قسطی» (DESIGN.md §6.4). */
function heading(room: RoomPresetPage): string {
  const stage = stageOf(room);
  return stage
    ? `چیدمان اتاق مونته‌سوری ${stage.label}؛ قیمت کامل و خرید قسطی`
    : `چیدمان ${room.name}؛ قیمت کامل و خرید قسطی`;
}

const pathOf = (room: RoomPresetPage) => room.canonicalPath ?? `/rooms/${room.slug}`;

function describe(room: RoomPresetPage): string {
  if (room.seoDescription?.trim()) return room.seoDescription.trim();
  const names = room.pieces.filter((piece) => piece.defaultOn).map((piece) => piece.name);
  return `${room.name} با ${names.join("، ")}؛ قیمت کامل اتاق را ببینید و با اسنپ‌پی ۴ قسطی بخرید.`;
}

export async function generateMetadata({ params }: PageProps<"/rooms/[preset]">): Promise<Metadata> {
  const { preset } = await params;
  const room = await getRoomPreset(preset);
  if (!room) return {};
  return pageMetadata({
    ownOgImage: true,
    title: room.seoTitle?.trim() || heading(room),
    description: describe(room),
    path: pathOf(room),
    noindex: room.noindex,
  });
}

export default async function RoomPresetPage({ params }: PageProps<"/rooms/[preset]">) {
  const { preset } = await params;
  const room = await getRoomPreset(preset);
  if (!room) notFound();

  const [settings, faqs, rooms] = await Promise.all([getSettings(), listRoomFaqs(room.id), listRoomCards()]);
  const path = pathOf(room);
  const stage = stageOf(room);
  const title = heading(room);
  const description = describe(room);
  const trail = crumbTrail({ name: "اتاق‌ها", path: "/rooms" }, { name: room.name, path });
  const others = rooms.filter((other) => other.slug !== room.slug);
  const small = room.variant === "small";

  const jsonLd = graph(
    collectionNodes({
      path,
      name: room.seoTitle?.trim() || title,
      description,
      breadcrumb: true,
      audience: stage ? { minMonths: stage.minMonths, maxMonths: stage.maxMonths } : null,
      dateModified: room.updatedAt,
      items: room.pieces.map((piece) => ({ path: `/product/${piece.slug}`, name: piece.name })),
      order: "unordered",
    }),
    breadcrumbNode(trail),
    faqs.length ? faqNode(faqs, path) : null,
  );

  const consult = settings.socials.bale ? "مشاورهٔ رایگانِ چیدمان در بله" : "برای چیدمان این اتاق، از خودِ کارگاه بپرس";

  return (
    <PageTurn>
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-page px-gutter pt-6 pb-section lg:pt-10">
        <Breadcrumbs items={trail} />

        <header className="mt-6 flex max-w-3xl flex-col gap-3">
          {room.tagline ? <Kicker decorative>{room.tagline}</Kicker> : null}
          <h1 className="text-3xl text-ink">{title}</h1>
          <p className="text-lead text-muted">
            {toFaDigits(room.pieceCount)} وسیلهٔ چوبی
            {stage ? `، برای ${stage.label}` : ""}
            {room.floorAreaM2 ? `، در اتاقی حدود ${toFaDigits(room.floorAreaM2)} متر مربع` : ""}. هر تکه را که لازم ندارید
            بردارید؛ جمع و قسط‌ها همین‌جا حساب می‌شود.
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
          <div className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--spacing-header-lg)+1.5rem)]">
            <figure className="flex flex-col gap-3">
              <RoomScene room={room} roomKey={room.slug} childCm={stage?.medianCm} eyeLine />
              <figcaption className="text-xs text-muted">
                خط‌چینِ آبی، خط دید کودک است: حدود {toFaDigits(EYE_LINE_CM)} سانتی‌متر از کف.
                {stage ? ` بچهٔ کنار در، قد میانگین ${toFaDigits(stage.medianCm)} سانت را دارد (WHO).` : ""} همهٔ وسایل
                از روی ابعاد واقعی و با مقیاس درست کنار هم کشیده شده‌اند.
              </figcaption>
            </figure>
            {small && room.floorAreaM2 ? <FootprintPlan footprints={room.footprints} areaM2={room.floorAreaM2} /> : null}
          </div>

          <section aria-labelledby="room-pieces">
            <RoomBuilder
              room={room}
              roomKey={room.slug}
              snapppay={settings.snapppay}
              heading={{ as: "h2", text: "وسایل این اتاق", id: "room-pieces" }}
            >
              <ul role="list" className="flex flex-col">
                {stage ? (
                  <li>
                    <Button variant="quiet" size="sm" href={`/age/${stage.hub}#${stage.hubAnchor}`}>
                      همهٔ وسایل و راهنماهای {stage.label}گی ←
                    </Button>
                  </li>
                ) : null}
                <li>
                  <Button variant="quiet" size="sm" href="/rooms" transitionTypes={["nav-back"]}>
                    همهٔ چیدمان‌های آماده ←
                  </Button>
                </li>
              </ul>
            </RoomBuilder>
          </section>
        </div>

        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-14">
            {room.description ? (
              <Prose markdown={room.description} variant="page" slug={`room-${room.slug}`} className="max-w-prose" />
            ) : null}
            {faqs.length ? <RoomFaqList faqs={faqs} /> : null}
          </div>
          <aside aria-label="مشاوره و چیدمان‌های دیگر" className="flex flex-col gap-8 self-start lg:sticky lg:top-[calc(var(--spacing-header-lg)+1.5rem)]">
            <AskChoobz socials={settings.socials} title={consult} />
            {others.length ? (
              <nav aria-labelledby="other-rooms">
                <h2 id="other-rooms" className="text-base font-bold text-ink">
                  چیدمان‌های دیگر
                </h2>
                <ul role="list" className="mt-2 flex flex-col">
                  {others.map((other) => (
                    <li key={other.id}>
                      <Link
                        href={`/rooms/${other.slug}`}
                        transitionTypes={["nav-forward"]}
                        className="link-mark inline-flex min-h-11 items-center text-sm text-ink"
                      >
                        {other.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </aside>
        </div>
      </div>
    </PageTurn>
  );
}

/* ------------------------------------------------------------------ */

/** «سؤال‌های این اتاق»: native drawers, the first one open; the same Q&As feed FAQPage verbatim. */
function RoomFaqList({ faqs }: { faqs: RoomFaq[] }) {
  return (
    <section aria-labelledby="room-faq" className="flex max-w-prose flex-col gap-4">
      <h2 id="room-faq" className="text-xl font-extrabold text-ink">
        سؤال‌های این اتاق
      </h2>
      <div className="flex flex-col gap-3">
        {faqs.map((faq, index) => (
          <details key={faq.id} open={index === 0} className="group rounded-bit-lg bg-raised shadow-paper">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-bit-lg px-4 py-3 text-base font-bold text-ink [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{faq.question}</span>
              <Icon name="plus" className="size-5 shrink-0 transition-transform duration-(--dur-base) ease-wood group-open:rotate-45" />
            </summary>
            <Prose markdown={faq.answer} variant="compact" className="px-4 pb-4" />
          </details>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const SCENE_WIDTH_MM = 3200;

/** Where a slot's piece stands in a square plan, in % (back wall at the top, physical left/right like the scene). */
function planBox(footprint: RoomFootprint, sideCm: number): CSSProperties | null {
  if (!isRoomSlot(footprint.slot)) return null;
  const slot = ROOM_SLOTS[footprint.slot];
  const sideMm = sideCm * 10;
  const width = footprint.widthCm * 10;
  const x = (slot.x / SCENE_WIDTH_MM) * sideMm;
  const left = slot.align === "left" ? x : slot.align === "center" ? x - width / 2 : x - width;
  const clamp = (value: number, size: number) => Math.min(Math.max(value, 0), sideMm - size);
  const pct = (value: number) => `${Math.round((value / sideMm) * 10000) / 100}%`;
  return {
    left: pct(clamp(left, width)),
    top: pct(Math.max(slot.back, 0)),
    width: pct(width),
    height: pct(footprint.depthCm * 10),
  };
}

/** Square metres to the nearest half, in Persian digits («۸»، «۷٫۵»). */
function squareMetres(m2: number): string {
  const half = Math.round(m2 * 2) / 2;
  return toFaDigits(Number.isInteger(half) ? String(half) : half.toFixed(1)).replace(".", "٫");
}

/** The 9 m² preset from above: every piece's real footprint on a 50 cm grid, and the floor left free. */
function FootprintPlan({ footprints, areaM2 }: { footprints: RoomFootprint[]; areaM2: number }) {
  const sideCm = Math.round(Math.sqrt(areaM2) * 100);
  const placed = footprints.flatMap((footprint) => {
    const box = planBox(footprint, sideCm);
    return box ? [{ footprint, box }] : [];
  });
  if (!placed.length) return null;
  const usedM2 = placed.reduce((sum, { footprint }) => sum + (footprint.widthCm * footprint.depthCm) / 10000, 0);
  const grid = `${(50 / sideCm) * 100}%`;
  const side = toFaDigits(String(sideCm / 100).replace(".", "٫"));

  return (
    <section aria-labelledby="room-plan" className="flex flex-col gap-3 rounded-bit-lg bg-raised p-4 shadow-paper">
      <h2 id="room-plan" className="text-base font-bold text-ink">
        نقشهٔ کف: {side} × {side} متر
      </h2>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-start">
        <div
          aria-hidden="true"
          className="relative aspect-square border-2 border-t-4 border-ink/70 bg-surface"
          style={{
            backgroundImage: "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
            backgroundSize: `${grid} ${grid}`,
          }}
        >
          {placed.map(({ footprint, box }, index) => (
            <span
              key={footprint.productId}
              className="absolute grid place-items-center rounded-[3px] border border-ink/60 bg-wood text-2xs font-bold text-ink"
              style={box}
            >
              {toFaDigits(index + 1)}
            </span>
          ))}
        </div>
        <ol role="list" className="flex flex-col gap-1.5 text-sm text-ink">
          {placed.map(({ footprint }, index) => (
            <li key={footprint.productId} className="flex gap-2">
              <span className="font-bold">{toFaDigits(index + 1)}</span>
              <span>
                {footprint.name}:{" "}
                <span className="text-muted">
                  {toFaDigits(footprint.widthCm)} × {toFaDigits(footprint.depthCm)} سانت
                  {footprint.foldedDepthCm ? `، جمع‌شده ${toFaDigits(footprint.foldedDepthCm)} سانت` : ""}
                </span>
              </span>
            </li>
          ))}
          <li className="mt-1 font-semibold text-success">
            حدود {squareMetres(areaM2 - usedM2)} متر مربع از {squareMetres(areaM2)} متر، کفِ آزاد برای بازی می‌ماند.
          </li>
        </ol>
      </div>
    </section>
  );
}
