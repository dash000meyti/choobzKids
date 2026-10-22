import Link from "@/components/ui/Link";
import type { SiteSettings } from "@/db/queries/settings";
import { formatToman, installments, toFaDigits } from "@/lib/format";
import { pill } from "./Actions";
import { Render } from "./Render";

/* A full room in one purchase: the staged room set with its price and installments. */
export function RoomBanner({ fromToman, snapppay }: { fromToman: number | null; snapppay: SiteSettings["snapppay"] }) {
  return (
    <section aria-labelledby="room-title" className="frame-col frame-rule py-band">
      <div className="overflow-hidden bg-surface md:rounded-[2rem]">
        <div className="reveal px-6 pt-16 text-center">
          <p className="eyebrow">چیدمان کامل اتاق</p>
          <h2 id="room-title" className="headline mt-2 text-[2.25rem] lg:text-[3.5rem]">
            اتاق مونته‌سوری، یک‌جا.
          </h2>
          <p className="mx-auto mt-3 max-w-[36rem] text-lead text-muted">
            چیدمان‌های آماده برای هر سن؛ وسایلی که کنار هم کار می‌کنند و در یک سفارش به خانه‌تان می‌رسند.
          </p>
          {fromToman && (
            <p className="mt-2 text-sm">
              از {formatToman(fromToman)}
              {snapppay?.enabled && (
                <span className="text-muted">
                  {" "}
                  یا {toFaDigits(snapppay.count)} قسط {formatToman(installments(fromToman, snapppay.count), false)} تومانی
                </span>
              )}
            </p>
          )}
          <div className="mt-5 flex justify-center gap-6">
            <Link href="/rooms" className={pill("primary")}>
              دیدن چیدمان‌ها
            </Link>
          </div>
        </div>
        <div className="reveal-zoom mx-auto mt-10 max-w-[60rem] px-6 pb-12">
          <Render productKey="room-set" alt="چیدمان کامل اتاق مونته‌سوری چوبز" sizes="(min-width: 1024px) 960px, 100vw" />
        </div>
      </div>
    </section>
  );
}
