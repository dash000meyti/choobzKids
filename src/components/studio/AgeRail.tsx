import Link from "@/components/ui/Link";
import { AGE_HUBS } from "@/lib/ages";
import { Render } from "./Render";

/* «مناسب هر سن»: three large tiles into the age hubs, each fronted by its signature piece. */
const PIECES: Record<string, { key: string; line: string }> = {
  "0-12-months": { key: "montessori-shelf", line: "قفسهٔ کوتاه، کتاب‌های روبه‌رو و اولین تلاش‌ها برای ایستادن." },
  "1-3-years": { key: "learning-tower", line: "کمک در آشپزخانه، بالا رفتن و اولین انتخاب‌های مستقل." },
  "3-6-years": { key: "swedish-ladder", line: "صعود، تعادل و میزِ کارِ خودش." },
};

export function AgeRail() {
  return (
    <section aria-labelledby="age-title" className="frame-col frame-rule frame-pad py-band">
      <div>
        <div className="reveal text-center">
          <p className="eyebrow">مونته‌سوری، قدم‌به‌قدم</p>
          <h2 id="age-title" className="headline mt-2 text-[2.25rem] lg:text-[3.5rem]">
            برای هر سن، وسیلهٔ خودش.
          </h2>
        </div>
        <ul className="reveal cells mt-12 md:grid-cols-3">
          {AGE_HUBS.map((hub) => {
            const piece = PIECES[hub.slug];
            return (
              <li key={hub.slug}>
                <Link
                  href={`/age/${hub.slug}`}
                  className="cell-hover group flex h-full flex-col items-center px-6 pt-10 text-center"
                >
                  <h3 className="text-[1.75rem] font-bold">{hub.label}</h3>
                  <p className="mt-2 max-w-[18rem] text-sm text-muted">{piece.line}</p>
                  <span className="link-arrow mt-4 text-sm">وسایل این سن</span>
                  <div className="mt-2 w-full max-w-[15rem] transition-transform duration-500 group-hover:-translate-y-1">
                    <Render productKey={piece.key} alt="" sizes="(min-width: 768px) 240px, 60vw" box="1 / 1" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
