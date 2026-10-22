import type { CSSProperties } from "react";
import { getManifest } from "@/components/illustrations/manifests";
import { Wordmark } from "@/components/illustrations/Wordmark";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StampBadge } from "@/components/ui/StampBadge";
import { getWorkshopStory } from "@/db/queries/home-story";
import { toFaDigits } from "@/lib/format";
import { grainStyle } from "@/lib/grain";
import { cn } from "@/lib/utils";
import { LiveStrip } from "./LiveStrip";
import styles from "./Workshop.module.css";

/*
 * The workshop, sheet to room (DESIGN.md §5.6), chapter three «رشد». The brand's defining
 * sentence, then the five steps scroll past a sticky stage where one real part, the learning
 * tower's side panel from its manifest, goes through them: the birch grain comes up, the CNC
 * gantry sweeps the toolpath in, the rough cut sands smooth, the finish deepens the wood and the
 * workshop's mark is pressed in. Each step card owns a view timeline; the stage layers listen
 * through `timeline-scope`, and only HTML wrappers move. Without scroll timelines, with reduced
 * motion or on the lite tier the stage is the finished, stamped frame and nothing sticks.
 */

const TITLE_ID = "workshop-title";

/* The stage in millimetres: the panel (900 × 450, lying on its side) on a sheet, on the bench. */
const STAGE = { w: 1100, h: 650 } as const;
const PANEL = { x: 100, y: 100, w: 900, h: 450 } as const;
/* Manifest frame (u = depth 0–450, v = height 0–900) → stage: the panel lies with its height along x. */
const PANEL_ON_STAGE = `matrix(0 1 1 0 ${PANEL.x} ${PANEL.y})`;
/* The same, normalised to the part's own box for an objectBoundingBox clip. */
const PANEL_IN_BOX = `matrix(0 ${1 / PANEL.h} ${1 / PANEL.w} 0 0 0)`;

const pct = (n: number, of: number) => `${(n / of) * 100}%`;

/* Sawdust motes along the cut edge, in % of the stage (fixed: never random in render). */
const MOTES = [
  [14, 20],
  [31, 84],
  [52, 16],
  [67, 86],
  [83, 22],
  [91, 70],
] as const;

function panelPath(): string | null {
  const side = getManifest("learning-tower")?.parts.find((p) => p.id === "side-l");
  if (!side || side.kind !== "panel") return null;
  return `${side.outline}${side.holes ?? ""}`;
}

function WorkshopStage() {
  const d = panelPath();
  const viewBox = `0 0 ${STAGE.w} ${STAGE.h}`;
  // Physical left/top on purpose: they map the drawing's coordinates, which never mirror.
  const partBox: CSSProperties = {
    left: pct(PANEL.x, STAGE.w),
    top: pct(PANEL.y, STAGE.h),
    width: pct(PANEL.w, STAGE.w),
    height: pct(PANEL.h, STAGE.h),
  };

  return (
    <div aria-hidden="true" className={styles.stage} style={{ aspectRatio: `${STAGE.w} / ${STAGE.h}` }}>
      {d ? (
        <svg width="0" height="0" className="absolute" focusable="false">
          <defs>
            <path id="ws-panel" d={d} />
            <clipPath id="ws-clip" clipPathUnits="objectBoundingBox">
              <use href="#ws-panel" transform={PANEL_IN_BOX} clipRule="evenodd" />
            </clipPath>
          </defs>
        </svg>
      ) : null}

      {/* 1 · the birch sheet; its grain comes up first */}
      <div className={styles.sheet}>
        <div className={cn("grain", styles.sheetGrain)} style={grainStyle("workshop-sheet") as CSSProperties} />
      </div>

      {/* 4 · the part's face: the finish deepens it one shade, a sheen crosses it */}
      <div className={styles.part} style={{ ...partBox, clipPath: "url(#ws-clip)" }}>
        <div className={styles.finish} />
        <div className={styles.sheen} />
      </div>

      {d ? (
        <>
          {/* 2 · the CNC gantry sweeps right to left, revealing the toolpath and the rough cut */}
          <div className={styles.cut}>
            <div className={styles.cutInner}>
              <div className={styles.rough}>
                <svg viewBox={viewBox} className="size-full" focusable="false">
                  <use href="#ws-panel" transform={PANEL_ON_STAGE} className={styles.jagged} />
                  <use href="#ws-panel" transform={PANEL_ON_STAGE} className={styles.toolpath} />
                </svg>
              </div>
            </div>
            <span className={styles.gantry}>
              <span className={styles.spindle} />
            </span>
          </div>

          {/* 3 · sanded: the clean edge replaces the rough one, and the dust falls */}
          <div className={styles.smooth}>
            <svg viewBox={viewBox} className="size-full" focusable="false">
              <use href="#ws-panel" transform={PANEL_ON_STAGE} className={styles.edge} />
            </svg>
          </div>
          {MOTES.map(([x, y], i) => (
            <span
              key={i}
              className={styles.mote}
              style={{ left: `${x}%`, top: `${y}%`, "--m": i } as CSSProperties}
            />
          ))}
        </>
      ) : null}

      {/* 5 · the workshop's mark, burnt into the face, and the stamp */}
      <div className={styles.brand} style={partBox}>
        <span className={styles.press}>
          <Wordmark stacked className={styles.wordmark} />
        </span>
      </div>
      <span className={cn(styles.press, styles.stamp)}>
        <StampBadge>ساخت کارگاه چوبز</StampBadge>
      </span>
    </div>
  );
}

export async function Workshop() {
  const { intro, steps, live } = await getWorkshopStory();

  return (
    <section aria-labelledby={TITLE_ID} className={styles.section}>
      <div className="frame-col frame-pad py-band">
        <SectionHeader
          id={TITLE_ID}
          kicker="فصل سوم · رشد"
          kickerDecorative
          swash
          title="از ورق تا اتاقِ بچه‌ت: یه سر به کارگاه چوبز بزن"
          sub={intro}
        />

        <div className={styles.track}>
          <div className={styles.stageSlot}>
            <WorkshopStage />
          </div>
          {steps.length ? (
            <ol role="list" className={styles.steps}>
              {steps.map((step, i) => (
                <li key={step.title} className={styles.step}>
                  <span aria-hidden="true" className={styles.number}>
                    {toFaDigits(i + 1)}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-ink">{step.title}</h3>
                    <p className="text-base text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        <div className={styles.footer}>
          {live ? <LiveStrip live={live} /> : null}
          <Button variant="quiet" size="sm" href="/workshop">
            داستان کامل کارگاه ←
          </Button>
        </div>
      </div>
    </section>
  );
}
