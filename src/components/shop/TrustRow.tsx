import Link from "@/components/ui/Link";
import type { SiteSettings } from "@/db/queries/settings";
import { EnamadBadge } from "@/components/ui/EnamadBadge";
import { Icon, type IconName } from "@/components/ui/Icon";
import { INSTALLMENTS_HREF } from "@/components/ui/installments";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * Trust row under the add-to-cart button (DESIGN.md §6.3 block 10, SEO.md §6.3): shipping,
 * the return window ⚑, SnappPay installments and the eNamad seal, each linking to its policy
 * page. Every claim comes from settings and disappears while its setting is empty; the eNamad
 * seal is lazy in a fixed box (no layout shift, the only third-party request).
 */

type TrustRowProps = {
  settings: Pick<SiteSettings, "returnPolicy" | "snapppay" | "enamad">;
  className?: string;
};

type TrustItem = { href: string; icon: IconName; label: string };

export function TrustRow({ settings, className }: TrustRowProps) {
  const items: TrustItem[] = [
    { href: "/shipping", icon: "truck", label: "ارسال به سراسر ایران" },
    ...(settings.returnPolicy?.days
      ? [{ href: "/returns", icon: "parcel" as const, label: `${toFaDigits(settings.returnPolicy.days)} روز ضمانت بازگشت` }]
      : []),
    ...(settings.snapppay?.enabled
      ? [{ href: INSTALLMENTS_HREF, icon: "wheels" as const, label: `${toFaDigits(settings.snapppay.count)} قسط با اسنپ‌پی` }]
      : []),
  ];

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <ul className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex min-h-11 items-center gap-2 rounded-bit-xs py-1 text-xs leading-snug font-semibold text-ink"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-success">
                <Icon name={item.icon} className="size-5" />
              </span>
              <span className="group-hover:underline group-hover:decoration-dotted group-hover:underline-offset-4">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <EnamadBadge enamad={settings.enamad} />
    </div>
  );
}
