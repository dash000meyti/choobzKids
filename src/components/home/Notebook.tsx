import Link from "next/link";
import type { CSSProperties } from "react";
import { HexLink } from "@/components/layout/HexLink";
import { ArticleCard } from "@/components/mag/ArticleCard";
import { Bubble } from "@/components/ui/Bubble";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getNotebook } from "@/db/queries/home-story";
import { AGE_HUBS, AGE_STAGES, type AgeHubSlug, type AgeStageKey } from "@/lib/ages";
import styles from "./Notebook.module.css";

/*
 * Mothers' questions + the magazine (DESIGN.md §5.5), chapter two «کشف». Three mint bubbles ask
 * the questions mothers send every day; each opens on the post's answer-first line with a link
 * to the full answer. Beside them, a kraft notebook held shut by its elastic band carries the
 * pillar guide and the three newest posts, then the age strip into the age hubs.
 * These are teasers: no FAQPage here, the full answers carry their own markup.
 */

const TITLE_ID = "notebook-title";
const MAG_TITLE_ID = "notebook-mag-title";

/** Each hub chip wears the band colour of its youngest stage, as in the menus. */
const hubTint = (slug: AgeHubSlug): AgeStageKey => AGE_STAGES.find((s) => s.hub === slug)?.key ?? "0-6m";

export async function Notebook() {
  const { questions, pillar, latest } = await getNotebook();
  if (!questions.length && !pillar && !latest.length) return null;

  return (
    <section aria-labelledby={TITLE_ID} className="paper">
      <div className="mx-auto grid max-w-page gap-x-16 gap-y-14 px-gutter py-section lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-10">
          <SectionHeader
            id={TITLE_ID}
            kicker="فصل دوم · کشف"
            kickerDecorative
            swash
            title="سؤال‌هایی که مامان‌ها هر روز از ما می‌پرسن"
          />
          {questions.length ? (
            <ul role="list" className={styles.chat}>
              {questions.map((q, i) => (
                <li key={q.id} className={styles.turn} style={{ "--i": i } as CSSProperties}>
                  <Bubble size="md" className={styles.bubble}>
                    <details className={styles.details} open={i === 0}>
                      <summary className={styles.summary}>
                        <span>{q.question}</span>
                        <Icon name="sprout" className={styles.sprout} />
                      </summary>
                      <div className="flex flex-col gap-2 pt-2">
                        <p className="text-base text-ink">{q.answer}</p>
                        <Link
                          href={`/mag/${q.slug}`}
                          transitionTypes={["nav-forward"]}
                          className="link-mark self-start text-sm font-semibold text-ink"
                        >
                          جواب کامل در مجله ←
                        </Link>
                      </div>
                    </details>
                  </Bubble>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col gap-8 lg:pt-4">
          <section aria-labelledby={MAG_TITLE_ID} className={styles.notebook}>
            <span aria-hidden="true" className={styles.elastic} />
            <h3 id={MAG_TITLE_ID} className="font-display text-xl text-ink">
              تازه‌های مجله چوبز
            </h3>
            {pillar ? (
              // A plain block around the card: its h-full must not resolve against the cover.
              <div className="mt-4">
                <ArticleCard post={pillar} size="lg" prefetch />
              </div>
            ) : null}
            {latest.length ? (
              <ul role="list" className="mt-4 grid gap-4 sm:grid-cols-3">
                {latest.map((post) => (
                  <li key={post.id}>
                    <ArticleCard post={post} />
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <nav aria-label="سن به سن" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-sm font-semibold text-muted">سن به سن:</span>
              <ul role="list" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {AGE_HUBS.map((hub) => (
                  <li key={hub.slug}>
                    <HexLink href={`/age/${hub.slug}`} tint={hubTint(hub.slug)}>
                      {hub.label}
                    </HexLink>
                  </li>
                ))}
              </ul>
            </nav>
            <Button variant="quiet" size="sm" href="/mag">
              همهٔ مطالب مجله ←
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
