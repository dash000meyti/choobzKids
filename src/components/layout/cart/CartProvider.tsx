"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Toaster } from "@/components/layout/Toaster";
import type { SiteSettings } from "@/db/queries/settings";
import type { CartDrawerProps } from "./CartDrawer";

/*
 * The site-wide cart island (DESIGN.md §4.7, §10.2): holds the few settings the cart UI needs,
 * mounts the page toast outlet, and loads the drawer's code only when it is first wanted (an
 * add-to-cart preloads it, the first open mounts it). The cart data itself lives in ./store.
 */

/** Plain strings and numbers from settings, passed down by SiteShell (never DB rows). */
export type CartConfig = {
  /** Free shipping from this subtotal (Toman) ⚑; null hides the meter. */
  freeShippingOverToman: number | null;
  snapppay: SiteSettings["snapppay"];
  enamad: SiteSettings["enamad"];
  /** Return window in days ⚑; null hides the trust line. */
  returnDays: number | null;
  bale: string | null;
  /** Instagram DM link (ig.me) or the profile. */
  instagram: string | null;
  /** Display phone (as written in settings) ⚑. */
  phone: string | null;
  /** Shown in the empty cart: «بریم یه چیزی بذاریم توش؟». */
  emptyLinks: { label: string; href: string }[];
};

const CartConfigContext = createContext<CartConfig | null>(null);

export function useCartConfig(): CartConfig {
  const config = use(CartConfigContext);
  if (!config) throw new Error("useCartConfig() must be used inside <CartProvider>");
  return config;
}

const OPEN_EVENT = "cz:cart-open";
let pendingOpen = false;
let drawerModule: Promise<typeof import("./CartDrawer")> | null = null;

/** Starts loading the drawer's code (call on first add so the drawer opens instantly). */
export function preloadCartDrawer() {
  drawerModule ??= import("./CartDrawer").catch((error) => {
    drawerModule = null;
    throw error;
  });
  return drawerModule;
}

/** Opens the cart drawer from anywhere on the client (buttons, toasts, other islands). */
export function openCart() {
  pendingOpen = true;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Read by the drawer when it mounts: was it mounted because someone asked to open it? */
export function takePendingOpen(): boolean {
  const pending = pendingOpen;
  pendingOpen = false;
  return pending;
}

export const CART_OPEN_EVENT = OPEN_EVENT;

export function CartProvider({ config, children }: { config: CartConfig; children: ReactNode }) {
  const router = useRouter();
  const [Drawer, setDrawer] = useState<ComponentType<CartDrawerProps> | null>(null);

  useEffect(() => {
    // The mounted drawer listens for the same event itself; this only covers the first open.
    const mount = () => {
      preloadCartDrawer().then(
        (module) => setDrawer(() => module.CartDrawer),
        () => {
          // The drawer's chunk did not load (offline, new deploy): the cart page shows the same cart.
          router.push("/cart");
        },
      );
    };
    window.addEventListener(OPEN_EVENT, mount);
    return () => window.removeEventListener(OPEN_EVENT, mount);
  }, [router]);

  return (
    <CartConfigContext value={config}>
      {children}
      <Toaster />
      {Drawer ? <Drawer config={config} /> : null}
    </CartConfigContext>
  );
}
