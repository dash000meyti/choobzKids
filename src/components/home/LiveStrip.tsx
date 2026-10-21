import { InlineScript } from "@/components/ui/InlineScript";
import type { WorkshopLive } from "@/db/queries/home-story";
import { cn } from "@/lib/utils";

/*
 * «امروز در کارگاه» (DESIGN.md §5.6): the workshop's newest log line, rendered only while it is
 * under 72 hours old. The prerendered page can outlive that, so the strip carries its expiry and
 * a tiny inline script right after it hides the strip once the instant has passed: a stale
 * "live" claim never shows. (React leaves `hidden` alone: the strip suppresses that one
 * attribute mismatch.)
 */

/* Hides the previous element when its data-expires is in the past. Constant, ≤ 150 bytes. */
const EXPIRE_SCRIPT =
  "(function(e){e=document.currentScript.previousElementSibling;if(e&&Date.parse(e.dataset.expires)<Date.now())e.hidden=true})()";

export function LiveStrip({ live, className }: { live: WorkshopLive; className?: string }) {
  return (
    <>
      <p
        data-expires={live.expiresAt}
        suppressHydrationWarning
        className={cn(
          "flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-bit border-[1.5px] border-dashed border-line-strong px-4 py-3 text-sm text-ink",
          className,
        )}
      >
        <span className="inline-flex items-center gap-2 font-bold">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-success" />
          <time dateTime={live.createdAt}>امروز در کارگاه:</time>
        </span>
        <span>{live.text}</span>
        {live.leadTime ? (
          <>
            <span aria-hidden="true" className="text-muted">
              ·
            </span>
            <span>زمان آماده‌سازی سفارش‌های امروز: {live.leadTime}</span>
          </>
        ) : null}
      </p>
      <InlineScript html={EXPIRE_SCRIPT} />
    </>
  );
}
