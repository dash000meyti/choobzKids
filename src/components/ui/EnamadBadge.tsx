import type { SiteSettings } from "@/db/queries/settings";
import { cn } from "@/lib/utils";

/*
 * eNamad trust seal (SEO.md §6.3), the only third-party request on the site. eNamad validates the
 * referrer, so it is a plain <img> (never next/image, never self-hosted) with
 * referrerPolicy="origin", inside a fixed 85 × 92 box so it cannot shift layout ⚑.
 * Lazy by default (footer); pass `eager` on /trust. Renders nothing while settings.enamad is null.
 */

type EnamadBadgeProps = {
  enamad: SiteSettings["enamad"];
  eager?: boolean;
  className?: string;
};

export function EnamadBadge({ enamad, eager, className }: EnamadBadgeProps) {
  if (!enamad) return null;
  return (
    <a
      href={enamad.href}
      target="_blank"
      // No `noreferrer`: eNamad checks the origin. noopener alone keeps window.opener closed.
      rel="noopener"
      referrerPolicy="origin"
      className={cn("inline-block h-[92px] w-[85px] shrink-0 overflow-hidden rounded-bit-xs", className)}
      aria-label="نماد اعتماد الکترونیکی چوبز (باز شدن در اینماد)"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- eNamad rejects proxied/optimised images */}
      <img
        src={enamad.imgSrc}
        alt=""
        width={85}
        height={92}
        referrerPolicy="origin"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="size-full object-contain"
      />
    </a>
  );
}
