import Link from "next/link";
import { Wordmark } from "@/components/illustrations/Wordmark";
import { EnamadBadge } from "@/components/ui/EnamadBadge";
import { Icon } from "@/components/ui/Icon";
import type { NavData } from "@/db/queries/nav";
import type { SiteSettings } from "@/db/queries/settings";
import { toEnDigits, toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BackToTop } from "./BackToTop";
import { Endpapers } from "./Endpapers";
import { MotionToggle } from "./MotionToggle";
import { socialLinks } from "./socials";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./SiteFooter.module.css";

/*
 * The night footer (DESIGN.md §4.6): endpapers, then the night scene in fixed colours (it looks
 * the same in «لالایی»). The brand's entity sentence (= Organization.description), link columns,
 * contact details only where settings hold them (NAP must match JSON-LD and eNamad exactly ⚑),
 * the trust row, the two display toggles and the last line.
 */

/* Size is set per use: Tailwind cannot be relied on to pick the later of two font-size utilities. */
const LINK = "link-mark inline-flex min-h-11 items-center text-ink";

function Contact({ org, socials }: { org: SiteSettings["org"]; socials: ReturnType<typeof socialLinks> }) {
  const phoneHref = org.phone ? `tel:${toEnDigits(org.phone).replace(/[^\d+]/g, "")}` : null;
  const hasNap = org.city || org.address || org.phone || org.email;
  return (
    <div>
      <h2 className="mb-2 text-sm font-bold text-ink">تماس</h2>
      {hasNap ? (
        <address className="flex flex-col gap-1 text-sm text-ink not-italic">
          {org.legalName ? <span>{org.legalName}</span> : null}
          {org.address || org.city ? <span>{[org.address, org.city].filter(Boolean).join("، ")}</span> : null}
          {org.phone && phoneHref ? (
            <a href={phoneHref} className={cn(LINK, "text-sm")}>
              <span dir="ltr">{toFaDigits(org.phone)}</span>
            </a>
          ) : null}
          {org.email ? (
            <a href={`mailto:${org.email}`} className={cn(LINK, "text-sm")}>
              <bdi lang="en" dir="ltr">
                {org.email}
              </bdi>
            </a>
          ) : null}
        </address>
      ) : null}
      <ul className="flex flex-col">
        <li>
          <Link href="/contact" className={cn(LINK, "text-sm")}>
            تماس با ما
          </Link>
        </li>
        {socials.bale ? (
          <li>
            <a href={socials.bale} target="_blank" rel="noopener" className={cn(LINK, "gap-2 text-sm")}>
              <Icon name="bale" className="size-4" />
              کانال بله
            </a>
          </li>
        ) : null}
        {socials.instagram ? (
          <li>
            <a href={socials.instagram} target="_blank" rel="noopener" className={cn(LINK, "gap-2 text-sm")}>
              <Icon name="instagram" className="size-4" />
              اینستاگرام چوبز
            </a>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export function SiteFooter({ nav }: { nav: NavData }) {
  const { settings } = nav;
  const socials = socialLinks(settings.socials);
  const snapppay = settings.snapppay?.enabled ? settings.snapppay : null;

  return (
    <footer className={styles.footer}>
      <Endpapers />
      <div className={styles.body}>
        <div className="mx-auto flex max-w-page flex-col gap-10 px-gutter pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-10">
            <Link href="/" aria-label="چوبز کیدز، صفحهٔ اصلی" className="shrink-0 self-start rounded-bit-xs text-ink">
              <Wordmark className="h-9 w-[180px]" />
            </Link>
            {/* The GEO entity sentence: the same words as Organization.description and llms.txt. */}
            <p className="max-w-prose text-base text-ink">{settings.org.description}</p>
          </div>

          <nav aria-label="پیوندهای پایین صفحه" className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-5">
            {nav.footer
              .filter((group) => group.links.length)
              .map((group) => (
                <div key={group.title}>
                  <h2 className="mb-2 text-sm font-bold text-ink">{group.title}</h2>
                  <ul className="flex flex-col">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className={cn(LINK, "text-sm")}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            <Contact org={settings.org} socials={socials} />
          </nav>

          <div className="flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
            {settings.enamad || snapppay ? (
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-3" aria-label="نشان‌های اعتماد">
              {settings.enamad ? (
                <li>
                  <EnamadBadge enamad={settings.enamad} />
                </li>
              ) : null}
              {snapppay ? (
                <li>
                  <Link href="/installments" className={cn(LINK, "gap-2 text-sm font-semibold")}>
                    <Icon name="wheels" className="size-5" />
                    {toFaDigits(snapppay.count > 0 ? snapppay.count : 4)} قسط با اسنپ‌پی
                  </Link>
                </li>
              ) : null}
            </ul>
            ) : null}
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
              <ThemeToggle />
              <MotionToggle />
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs text-muted md:flex-row md:items-center md:justify-between">
            <p>© ۱۴۰۵ چوبز کیدز — با دست و دل، توی کارگاه خودمون ساخته شده.</p>
            <ul className="flex flex-wrap items-center gap-x-4">
              {nav.legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={cn(LINK, "text-xs")}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <BackToTop className={cn(LINK, "text-xs font-semibold")} />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
