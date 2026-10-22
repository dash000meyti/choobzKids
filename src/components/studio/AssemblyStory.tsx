import { AssemblyCanvas } from "./AssemblyCanvas";
import { Render } from "./Render";
import styles from "./AssemblyStory.module.css";

/*
 * «از ورق تخته، تا اتاق کودک»: the learning tower's real CNC-cut parts come together while the
 * four making steps scroll past — live 3D on desktop-class machines, a crossfade of the exploded
 * and assembled stills elsewhere. The assembled still is the poster and the no-JS frame.
 */

const STEPS = [
  { title: "تختهٔ چندلای توس.", body: "لایه‌های نازک توس، عمود بر هم پرس می‌شوند؛ محکم، سبک و بدون تاب برداشتن." },
  { title: "برش دقیق با CNC.", body: "هر قطعه از روی نقشهٔ خودش بریده می‌شود تا اتصال‌ها بی‌لق و دقیق در هم بنشینند." },
  { title: "لبه‌هایی که نوازش می‌کنند.", body: "همهٔ لبه‌ها گرد و سنباده‌خورده‌اند؛ جایی برای خراش دست‌های کوچک نمی‌ماند." },
  { title: "پرداخت پایه‌آب.", body: "روکش نهایی بی‌بوی تند است و رنگ طبیعی چوب را همان‌طور که هست نگه می‌دارد." },
];

const NUMBERS = ["۰۱", "۰۲", "۰۳", "۰۴"];

export function AssemblyStory() {
  return (
    <section aria-labelledby="assembly-title" className="theme-night">
      <div className="reveal mx-auto max-w-[61.25rem] px-gutter pt-section text-center">
        <p className="eyebrow">ساخت کارگاه چوبز</p>
        <h2 id="assembly-title" className="headline text-gradient-wood mt-2 text-[2.5rem] lg:text-[4.5rem]">
          از ورق تخته، تا اتاق کودک.
        </h2>
        <p className="mx-auto mt-4 max-w-[40rem] text-lead text-muted">
          هر وسیلهٔ چوبز در کارگاه خودمان بریده، سنباده و پرداخت می‌شود. همین قطعه‌ها را ببینید که کنار هم می‌نشینند.
        </p>
      </div>
      <div className={`${styles.section} mx-auto grid max-w-[75rem] gap-x-10 px-gutter pb-section lg:grid-cols-2`}>
        <div className={styles.stage}>
          <AssemblyCanvas
            productKey="learning-tower"
            exploded={
              <div className="w-[min(100%,30rem)]">
                <Render productKey="learning-tower" angle="hero-exploded" alt="" sizes="(min-width: 1024px) 480px, 88vw" />
              </div>
            }
          >
            <div className="w-[min(100%,30rem)]">
              <Render productKey="learning-tower" alt="برج یادگیری مونته‌سوری چوبز، مونتاژشده" sizes="(min-width: 1024px) 480px, 88vw" />
            </div>
          </AssemblyCanvas>
        </div>
        <ol className="relative">
          {STEPS.map((s, i) => (
            <li key={s.title} className={styles.step}>
              <div className="reveal max-w-[30rem]">
                <p className="text-eyebrow text-[1.0625rem] font-semibold tabular-nums" aria-hidden="true">
                  {NUMBERS[i]}
                </p>
                <h3 className="mt-3 font-display text-[1.875rem] leading-snug text-ink lg:text-[2.75rem]">{s.title}</h3>
                <p className="mt-4 text-base leading-8 text-muted lg:text-[1.1875rem] lg:leading-9">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
