import Link from "@/components/ui/Link";
import { ViewTransition, type CSSProperties } from "react";
import { pegDollWidthCm, PegDoll } from "@/components/illustrations/PegDoll";
import { DOOR_MARKS, ROOM_VIEWBOX, RoomBackdrop } from "@/components/illustrations/RoomKit";
import { illustrationFrame, illustrationSize } from "@/components/illustrations/sizes";
import { isRoomSlot, placeOnStage, placePerson, ROOM_SLOTS } from "@/components/shop/room-slots";
import { AGE_TINT } from "@/components/ui/tints";
import type { AgeHubData, AgeIndexHub, AgeScene } from "@/db/queries/age";
import type { RoomPiece } from "@/db/queries/cards";
import { formatNumber } from "@/lib/format";
import { cn, illustrationUrl } from "@/lib/utils";
import styles from "./AgeHubHero.module.css";
import { Render } from "@/components/studio/Render";

/*
 * Age hub header (DESIGN.md §7.5): the hub's hexagon in its age tint, the plain keyword H1
 * (SEO.md §1.5), a line saying what the page holds, hex links to the anchored sub-ranges, and
 * the height-mark door fixed at the hub's stage — the home door (§5.3) without its radios.
 *
 * Morphs (§9.6): the hub hex is `age-hub-{slug}` (from the /age cards); each sub-range hex is
 * `age-{stage}` for the home chip that lands on it (/age/1-3-years#1-2-years …).
 */

type AgeHubHeroProps = {
  hub: Pick<AgeHubData, "slug" | "label" | "h1" | "tint" | "sections" | "scene" | "productCount">;
  className?: string;
};

export function AgeHubHero({ hub, className }: AgeHubHeroProps) {
  const pieces = (hub.scene.room?.pieces ?? []).filter((p) => p.defaultOn).slice(0, 4);
  return (
    <header className={cn("text-center", className)}>
      <ViewTransition name={`age-hub-${hub.slug}`} share="morph" default="none">
        <p className="eyebrow">{hub.label}</p>
      </ViewTransition>
      <h1 className="headline mx-auto mt-2 max-w-[48rem] text-3xl lg:text-[4rem]">{hub.h1}</h1>
      <p className="mx-auto mt-4 max-w-[40rem] text-lead text-muted">
        نقاط عطف رشد، بازی‌های پیشنهادی در خانه، وسایل چوبی مناسب و چیدمان آمادهٔ اتاق برای هر بازهٔ این سن.
      </p>
      <nav aria-label="بازه‌های سنی این صفحه" className="mt-6">
        <ul className="flex flex-wrap justify-center gap-2">
          {hub.sections.map((section) => (
            <li key={section.anchor}>
              <a href={`#${section.anchor}`} className="inline-flex h-10 items-center rounded-full bg-surface px-5 text-sm font-semibold text-ink hover:bg-sunken">
                {section.stage ? (
                  <ViewTransition name={`age-${section.stage.key}`} share="morph" default="none">
                    <span>{section.label}</span>
                  </ViewTransition>
                ) : (
                  section.label
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {pieces.length ? (
        <div aria-hidden="true" className="mx-auto mt-10 flex max-w-[56rem] items-end justify-center gap-3 rounded-[2rem] bg-surface px-6 pb-6 pt-10">
          {pieces.map((piece) => (
            <div key={piece.productId} className="min-w-0 flex-1">
              <Render productKey={piece.illustration ?? piece.slug} alt="" sizes="(min-width: 1024px) 200px, 22vw" box="3 / 4" />
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* The height-mark door, fixed at one stage                            */
/* ------------------------------------------------------------------ */

const pct = (value: number, of: number) => `${Math.round((value / of) * 10000) / 100}%`;

type DoorSceneProps = {
  scene: AgeScene;
  className?: string;
};

/**
 * The home door scene at one stage (static, aria-hidden): the RoomKit room with its pencil marks,
 * the stage's room preset standing in place at true scale, and a peg-doll child grown to the
 * stage's WHO median height ⚑ beside the frame, its own mark labelled in pencil.
 */
export function DoorScene({ scene, className }: DoorSceneProps) {
  const { stage, room } = scene;
  const pieces = room?.pieces.filter((p) => p.defaultOn) ?? [];
  const kitchen = pieces.some((p) => p.slot === "kitchen");
  const mark = DOOR_MARKS.find((m) => m.key === stage.key);
  // The label sits on the wall just clear of the child's shoulder, level with the mark.
  const childHalfMm = (pegDollWidthCm("child", stage.medianCm) * 10) / 2;
  const labelRight = pct(ROOM_VIEWBOX.w - (ROOM_SLOTS["by-door"].x - childHalfMm - 60), ROOM_VIEWBOX.w);

  return (
    <div aria-hidden="true" className={cn(styles.scene, className)}>
      <RoomBackdrop showKitchen={kitchen} doorMarks className={styles.backdrop} />
      {pieces.map((piece) => (
        <PlacedPiece key={piece.productId} piece={piece} />
      ))}
      <PegDoll heightCm={stage.medianCm} className={styles.child} style={placePerson("by-door", stage.medianCm)} />
      {mark ? (
        <>
          <span
            className={styles.tick}
            style={{ top: mark.top, left: mark.tickLeft, right: `calc(100% - ${mark.tickRight})` } as CSSProperties}
          />
          <span className={styles.markLabel} style={{ top: mark.top, right: labelRight }}>
            {stage.markLabel}
          </span>
        </>
      ) : null}
    </div>
  );
}

/* Placed exactly as RoomCard and the room builder place a piece (shop/room-slots). */
function PlacedPiece({ piece }: { piece: RoomPiece }) {
  if (!piece.illustration || !isRoomSlot(piece.slot)) return null;
  const { width, height } = illustrationSize(piece.illustration, "assembled");
  const frame = illustrationFrame(piece.illustration, "assembled");
  const placement = placeOnStage(piece.slot, frame.width / 10, frame.height / 10, {
    depthCm: piece.depthCm ?? undefined,
    footCm: (frame.height - frame.originY) / 10,
  });
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static manifest SVG (DESIGN.md §10.3)
    <img
      src={illustrationUrl(piece.illustration, "assembled")}
      width={width}
      height={height}
      alt=""
      decoding="async"
      className={styles.piece}
      style={placement}
    />
  );
}

/* ------------------------------------------------------------------ */
/* /age: one large hex card per hub                                    */
/* ------------------------------------------------------------------ */

type AgeHubCardProps = {
  hub: AgeIndexHub;
  className?: string;
};

/**
 * A hub on /age (DESIGN.md §7.5): a large hexagon in the hub's age tint standing on a ply edge.
 * The title is a stretched link to the hub; the sub-range links sit above it and jump straight
 * to their section. The range label morphs into the hub page's hex (`age-hub-{slug}`).
 */
export function AgeHubCard({ hub, className }: AgeHubCardProps) {
  const titleId = `hub-${hub.slug}`;
  return (
    <article aria-labelledby={titleId} className={cn(styles.hubCard, className)}>
      <div className={cn(styles.hubFace, AGE_TINT[hub.tint])}>
        <ViewTransition name={`age-hub-${hub.slug}`} share="morph" default="none">
          <span className="self-start font-display text-2xl">{hub.label}</span>
        </ViewTransition>
        <h2 id={titleId} className="text-lg leading-snug font-bold">
          <Link href={`/age/${hub.slug}`} prefetch transitionTypes={["nav-forward"]} className={styles.hubLink}>
            {hub.h1}
          </Link>
        </h2>
        {hub.summary ? <p className="line-clamp-4 text-sm">{hub.summary}</p> : null}
        <p className="text-xs font-semibold">
          {formatNumber(hub.productCount)} وسیله · {formatNumber(hub.postCount)} راهنما
        </p>
        <ul className="relative z-1 mt-auto flex flex-wrap gap-2 pt-2">
          {hub.sections.map((section) => (
            <li key={section.anchor}>
              <Link href={`/age/${hub.slug}#${section.anchor}`} className={styles.hubSection}>
                {section.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
