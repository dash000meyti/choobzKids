import type { ReactNode } from "react";
import { getNavData, type NavData } from "@/db/queries/nav";
import { BottomDock } from "./BottomDock";
import { CartProvider, type CartConfig } from "./cart/CartProvider";
import { HoverIntent } from "./HoverIntent";
import { InvokerPolyfill } from "./InvokerPolyfill";
import { MenuDialog } from "./MenuDialog";
import { NavDismiss } from "./NavDismiss";
import { SearchDialog } from "./SearchDialog";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SkipLinks } from "./SkipLinks";
import { socialLinks } from "./socials";

/*
 * The site chrome around every page (DESIGN.md §4): skip links, the sticky header with Tati's
 * thread, <main id="main">, the night footer, the phone dock, the «فهرست» and search dialogs, and
 * the cart island (provider, toasts, lazy drawer). Static: one cached nav read (getNavData) and
 * nothing request-time, so it is part of every prerendered page. Pages render their own content
 * only (wrapped in <PageTurn>), never a second <main>.
 */

function cartConfig(nav: NavData): CartConfig {
  const { settings } = nav;
  return {
    freeShippingOverToman: settings.shippingPolicy?.freeOverToman ?? null,
    snapppay: settings.snapppay,
    enamad: settings.enamad,
    returnDays: settings.returnPolicy?.days ?? null,
    bale: settings.socials.bale,
    instagram: socialLinks(settings.socials).instagramDm,
    phone: settings.org.phone,
    emptyLinks: nav.categories.slice(0, 3).map((c) => ({ label: c.name, href: `/shop/${c.slug}` })),
  };
}

export async function SiteShell({ children }: { children: ReactNode }) {
  const nav = await getNavData();
  return (
    <CartProvider config={cartConfig(nav)}>
      <SkipLinks />
      <SiteHeader nav={nav} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter nav={nav} />
      <BottomDock />
      <MenuDialog nav={nav} />
      <SearchDialog />
      <NavDismiss />
      <InvokerPolyfill />
      <HoverIntent />
    </CartProvider>
  );
}
