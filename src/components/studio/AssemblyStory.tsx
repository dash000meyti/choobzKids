import { AssemblyCanvas } from "./AssemblyCanvas";
import { Render } from "./Render";
import styles from "./AssemblyStory.module.css";

/*
 * «از ورق تخته، تا اتاق کودک»: the learning tower's real CNC-cut parts fly together in 3D while
 * the four making steps scroll past. The assembled still is the poster and the no-JS frame.
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
      <div className="mx-auto max-w-[61.25rem] px-gutter pt-section text-center">
        <p className="eyebrow">ساخت کارگاه چوبز</p>
        <h2 id="assembly-title" className="headline mt-2 text-3xl lg:text-[4rem]">
          از ورق تخته، تا اتاق کودک.
        </h2>
        <p className="mx-auto mt-4 max-w-[40rem] text-lead text-muted">
          هر وسیلهٔ چوبز در کارگاه خودمان بریده، سنباده و پرداخت می‌شود. همین قطعه‌ها را ببینید که کنار هم می‌نشینند.
        </p>
      </div>
      <div className={`${styles.section} mx-auto grid max-w-[75rem] gap-x-10 px-gutter pb-section lg:grid-cols-2`}>
        <div className={styles.stage}>
          <AssemblyCanvas productKey="learning-tower">
            <div className="w-[min(100%,30rem)]">
              <Render productKey="learning-tower" alt="برج یادگیری مونته‌سوری چوبز، مونتاژشده" sizes="(min-width: 1024px) 480px, 88vw" />
            </div>
          </AssemblyCanvas>
        </div>
        <ol className="relative">
          {STEPS.map((s, i) => (
            <li key={s.title} className={styles.step}>
              <p className="text-lead lg:text-[1.75rem] lg:leading-normal">
                <span className="text-muted">{NUMBERS[i]} — </span>
                <strong className="font-extrabold text-ink">{s.title}</strong> <span className="text-muted">{s.body}</span>
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
