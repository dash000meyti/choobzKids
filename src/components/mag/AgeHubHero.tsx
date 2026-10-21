import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import { pegDollWidthCm, PegDoll } from "@/components/illustrations/PegDoll";
import { DOOR_MARKS, ROOM_VIEWBOX, RoomBackdrop } from "@/components/illustrations/RoomKit";
import { illustrationFrame, illustrationSize } from "@/components/illustrations/sizes";
import { isRoomSlot, placeOnStage, placePerson, ROOM_SLOTS } from "@/components/shop/room-slots";
import { Bubble } from "@/components/ui/Bubble";
import { AGE_TINT } from "@/components/ui/tints";
import type { AgeHubData, AgeIndexHub, AgeScene } from "@/db/queries/age";
import type { RoomPiece } from "@/db/queries/cards";
import { AGE_STAGES, WHO_SOURCE } from "@/lib/ages";
import { formatNumber } from "@/lib/format";
import { cn, illustrationUrl } from "@/lib/utils";
import styles from "./AgeHubHero.module.css";

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
  const story = AGE_STAGES.find((s) => s.key === hub.scene.stage.key)?.milestone;
  return (
    <header className={cn("grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-12", className)}>
      <div className="flex min-w-0 flex-col items-start gap-4">
        <ViewTransition name={`age-hub-${hub.slug}`} share="morph" default="none">
          <span className={cn(styles.hubHex, AGE_TINT[hub.tint])}>{hub.label}</span>
        </ViewTransition>
        <h1 className="text-3xl text-ink">{hub.h1}</h1>
        <p className="max-w-prose text-lead text-muted">
          نقاط عطف رشد، بازی‌های پیشنهادی در خانه، وسایل چوبی مناسب و چیدمان آمادهٔ اتاق برای هر بازهٔ این سن؛ از
          مهارت‌ها شروع کنید و تا اتاقش پیش بروید.
        </p>
        <nav aria-label="بازه‌های سنی این صفحه" className="mt-1">
          <ul className="flex flex-wrap gap-x-3 gap-y-4">
            {hub.sections.map((section) => {
              const face = <span className={cn(styles.face, AGE_TINT[section.stage?.key ?? hub.tint])}>{section.label}</span>;
              return (
                <li key={section.anchor}>
                  <a href={`#${section.anchor}`} className={styles.hex}>
                    {section.stage ? (
                      <ViewTransition name={`age-${section.stage.key}`} share="morph" default="none">
                        {face}
                      </ViewTransition>
                    ) : (
                      face
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <figure className="flex min-w-0 flex-col gap-1">
        {story ? (
          <Bubble size="sm" className="self-start font-accent text-lead">
            {story}
          </Bubble>
        ) : null}
        <DoorScene scene={hub.scene} />
        <figcaption className="mt-2 text-2xs text-muted">
          خط‌های قد روی چارچوب: میانگین قد کودکان در هر سن · {WHO_SOURCE}
        </figcaption>
      </figure>
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
