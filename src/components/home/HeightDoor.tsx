import { ViewTransition, type CSSProperties } from "react";
import { AgeRoomVT } from "@/components/home/AgeRoomVT";
import { DoorScene } from "@/components/home/DoorScene";
import { RoomBuilder } from "@/components/shop/RoomBuilder";
import { AskChoobz } from "@/components/ui/AskChoobz";
import { Button } from "@/components/ui/Button";
import { HexChip } from "@/components/ui/HexChip";
import { InlineScript } from "@/components/ui/InlineScript";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getAgeRooms, type AgeRoom } from "@/db/queries/rooms";
import { getSettings, type SiteSettings } from "@/db/queries/settings";
import { WHO_SOURCE } from "@/lib/ages";
import { cn } from "@/lib/utils";
import styles from "./HeightDoor.module.css";

/*
 * The height-mark door → room builder (DESIGN.md §1.3 (2), §5.3), `#height-door`.
 * Five age chips are one real radio group; `:has(:checked)` shows that stage's room in the scene,
 * its milestone and its editable panel, and grows the peg-doll child to the stage's median height.
 * All five rooms are in the server HTML, so the switch needs no JS. AgeRoomVT adds the morph and
 * `?age=`; RoomTotals (inside each panel) the live toggles, total and wheels. A tiny inline script
 * after the chips checks the radio named by `?age=` before first paint; the canonical stays `/`.
 *
 * Mobile: scene, chips in the thumb zone, milestone, panel. Desktop: an open-book spread with the
 * scene sticky on the right page and the panel on the left.
 */

const SECTION_ID = "height-door";
const TITLE_ID = "height-door-title";
const RADIO_NAME = "age";

/**
 * The room the door opens on. Keep in step with the `:has()`-less fallback in HeightDoor.module.css.
 * One to two years: the learning-tower age the cover introduces.
 */
const DEFAULT_STAGE = "1-2y";

/* Checks `#age-{value}` from `?age=` before first paint (DESIGN.md §5.3); ignores anything else. */
const AGE_SCRIPT =
  '!function(){try{var a=new URLSearchParams(location.search).get("age"),e=a&&document.getElementById("age-"+a);' +
  'e&&"radio"==e.type&&(e.checked=!0)}catch(e){}}()';

export async function HeightDoor() {
  const [{ rooms, smallRoom }, settings] = await Promise.all([getAgeRooms(), getSettings()]);
  if (!rooms.length) return null;
  const opening = rooms.find((stage) => stage.key === DEFAULT_STAGE) ?? rooms[0];

  // Each stage's median height, for the child's `--child-cm` once its chip is checked.
  const heights = Object.fromEntries(rooms.map((stage) => [`--cm-${stage.key}`, stage.medianCm])) as CSSProperties;

  return (
    <section id={SECTION_ID} aria-labelledby={TITLE_ID} className={styles.door} style={heights}>
      <div className="mx-auto max-w-wide px-gutter py-section">
        <SectionHeader
          id={TITLE_ID}
          title="بچه‌ت چند وقتشه؟ اتاقش رو با هم بچینیم"
          sub="سن رو انتخاب کن؛ اتاق خودش عوض می‌شه و وسایلی که برای همین روزهای رشدش ساخته شدن، سرِ جاشون می‌شینن."
        />

        <div className={styles.spread}>
          <div className={styles.scenePage}>
            <DoorScene rooms={rooms} childCm={opening.medianCm} />
          </div>

          <div className={styles.panelPage}>
            <fieldset className={styles.ages}>
              <legend className="mb-2 text-sm font-semibold text-muted">سن کودک</legend>
              <div className={cn("no-scrollbar", styles.chips)}>
                {rooms.map((stage) => (
                  <ViewTransition key={stage.key} name={`age-${stage.key}`} share="morph" default="none">
                    <HexChip
                      name={RADIO_NAME}
                      value={stage.key}
                      id={`age-${stage.key}`}
                      tint={stage.key}
                      defaultChecked={stage.key === opening.key}
                      className={styles.chip}
                    >
                      {stage.label}
                    </HexChip>
                  </ViewTransition>
                ))}
              </div>
            </fieldset>
            <InlineScript html={AGE_SCRIPT} />

            {rooms.map((stage) => (
              <StagePanel key={stage.key} stage={stage} snapppay={settings.snapppay} />
            ))}

            {/* Shared by every room, so it is rendered once. */}
            <div className="flex flex-col gap-3">
              {smallRoom ? (
                <Button variant="quiet" size="sm" href={`/rooms/${smallRoom.slug}`} transitionTypes={["nav-forward"]} className="self-start">
                  اتاق کوچکه؟ چیدمان ۹ متری ←
                </Button>
              ) : null}
              <AskChoobz
                socials={settings.socials}
                compact
                title={settings.socials.bale ? "مشاورهٔ رایگانِ چیدمان در بله" : "برای چیدمان اتاق، از خودِ کارگاه بپرس"}
              />
            </div>
          </div>
        </div>
      </div>
      <AgeRoomVT doorId={SECTION_ID} name={RADIO_NAME} />
    </section>
  );
}

function StagePanel({ stage, snapppay }: { stage: AgeRoom; snapppay: SiteSettings["snapppay"] }) {
  const links = (
    <ul role="list" className="flex flex-col">
      {stage.room ? (
        <li>
          <Button variant="quiet" size="sm" href={`/rooms/${stage.room.slug}`} transitionTypes={["nav-forward"]}>
            این چیدمان را ببین ←
          </Button>
        </li>
      ) : null}
      <li>
        <Button variant="quiet" size="sm" href={stage.hubHref} transitionTypes={["nav-forward"]}>
          همهٔ وسایل و راهنماهای {stage.hubLabel} ←
        </Button>
      </li>
    </ul>
  );

  return (
    <div data-room={stage.key} className={styles.stagePanel}>
      <div className={styles.milestone}>
        <p className="text-base text-ink">
          <span className="font-bold">{stage.hubLabel}: </span>
          {stage.milestone}
        </p>
        <p className="text-xs text-muted">
          خط قد: {stage.markLabel} (قد میانگین) · {WHO_SOURCE}
        </p>
      </div>
      {stage.room ? (
        <RoomBuilder room={stage.room} roomKey={stage.key} snapppay={snapppay}>
          {links}
        </RoomBuilder>
      ) : (
        links
      )}
    </div>
  );
}
