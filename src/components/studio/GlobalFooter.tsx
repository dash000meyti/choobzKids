import Link from "next/link";
import { EnamadBadge } from "@/components/ui/EnamadBadge";
import type { NavData } from "@/db/queries/nav";
import { toFaDigits } from "@/lib/format";

/*
 * Footer in the Studio style: a quiet grey band, fine print first (installments, prices),
 * dense link columns, then the legal line. The entity sentence doubles as the GEO summary.
 */
export function GlobalFooter({ nav }: { nav: NavData }) {
  const { settings } = nav;
  return (
    <footer className="bg-surface text-xs leading-6 text-muted">
      <div className="mx-auto max-w-[61.25rem] px-gutter pb-6 pt-10">
        <div className="space-y-2 border-b border-line pb-5">
          <p>{settings.org.description}</p>
          {settings.snapppay?.enabled && (
            <p>
              خرید قسطی با اسنپ‌پی در {toFaDigits(settings.snapppay.count)} قسط و طبق شرایط اسنپ‌پی انجام می‌شود.
              قیمت‌ها به تومان است. تصاویر محصولات از روی ابعاد واقعی ساخته شده‌اند.
            </p>
          )}
        </div>

        <nav aria-label="پیوندهای پانویس" className="grid grid-cols-2 gap-x-6 gap-y-6 py-6 md:grid-cols-4">
          {nav.footer.map((group) => (
            <div key={group.title}>
              <h2 className="mb-2 text-xs font-bold text-ink">{group.title}</h2>
              <ul className="space-y-1.5">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-ink hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-4 border-t border-line pt-5 md:flex-row md:items-center md:justify-between">
          <p>
            {`© ${toFaDigits(1405)} چوبز کیدز. همهٔ حقوق محفوظ است.`}
            {settings.socials.instagram && (
              <>
                {" · "}
                <a href={settings.socials.instagram} rel="noopener" className="hover:text-ink hover:underline">
                  اینستاگرام
                </a>
              </>
            )}
            {settings.socials.bale && (
              <>
                {" · "}
                <a href={settings.socials.bale} rel="noopener" className="hover:text-ink hover:underline">
                  کانال بله
                </a>
              </>
            )}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {nav.legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-ink hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <EnamadBadge enamad={settings.enamad} />
        </div>
      </div>
    </footer>
  );
}
