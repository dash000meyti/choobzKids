"use client";

import Image from "next/image";
import Link from "@/components/ui/Link";
import { useEffect, useEffectEvent, useRef, useState, type PointerEvent } from "react";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { TabularNumber } from "@/components/ui/TabularNumber";
import { DrawingImg } from "@/components/layout/DrawingImg";
import { CartGlyph } from "@/components/layout/NavIcons";
import { popToastHost, pushToastHost, toast, Toaster } from "@/components/layout/Toaster";
import { toFaDigits } from "@/lib/format";
import { cn, mediaUrl } from "@/lib/utils";
import { CartLine } from "./CartLine";
import { CART_OPEN_EVENT, takePendingOpen, type CartConfig } from "./CartProvider";
import { FreeShippingMeter } from "./FreeShippingMeter";
import { CartSummary } from "./CartSummary";
import { EmptyCart } from "./EmptyCart";
import { requestQuote, type QuoteSuggestion } from "./quote";
import { applyQuote, useCart, type CartItem } from "./store";
import styles from "./CartDrawer.module.css";

/*
 * The cart drawer (DESIGN.md §4.7): a native modal <dialog>, a bottom sheet on phones (drag the
 * handle down 80px, or tap it, to close) and a 420px drawer from inline-end on desktop. Loaded on
 * first open or first add (CartProvider). Every open refreshes names, prices and availability
 * from /api/cart/quote; changed prices are called out on their line.
 */

export type CartDrawerProps = { config: CartConfig };

const TOAST_HOST = "cart";
/** Fired by the «دوباره» toast action after a failed price refresh. */
const RETRY_EVENT = "cz:cart-requote";
const CLOSE_DRAG_PX = 80;
const TAP_SLOP_PX = 6;

export function CartDrawer({ config }: CartDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController | null>(null);
  const drag = useRef<{ pointer: number; startY: number; dy: number } | null>(null);
  const dragged = useRef(false);
  const cart = useCart();
  const [suggestion, setSuggestion] = useState<QuoteSuggestion | null>(null);

  const refreshQuote = useEffectEvent(async () => {
    const items = cart.items;
    request.current?.abort();
    if (!items.length) return;
    const controller = new AbortController();
    request.current = controller;
    try {
      const quote = await requestQuote(items, controller.signal);
      applyQuote(quote);
      setSuggestion(quote.suggestion);
    } catch (error) {
      if (controller.signal.aborted || !dialogRef.current?.open) return;
      console.warn("[cart] price refresh failed", error);
      const retry = () => window.dispatchEvent(new Event(RETRY_EVENT));
      toast("اینترنت یه لحظه قطع شد. دوباره امتحان کن.", { label: "دوباره", onClick: retry }, "warning");
    }
  });

  const show = useEffectEvent(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    pushToastHost(TOAST_HOST);
    void refreshQuote();
  });

  useEffect(() => {
    if (takePendingOpen()) show();
    const onOpen = () => {
      takePendingOpen();
      show();
    };
    const onRetry = () => void refreshQuote();
    window.addEventListener(CART_OPEN_EVENT, onOpen);
    window.addEventListener(RETRY_EVENT, onRetry);
    return () => {
      window.removeEventListener(CART_OPEN_EVENT, onOpen);
      window.removeEventListener(RETRY_EVENT, onRetry);
    };
  }, []);

  const close = () => dialogRef.current?.close();

  const onClosed = () => {
    request.current?.abort();
    popToastHost(TOAST_HOST);
  };

  /* Bottom-sheet drag (phones only). The dialog follows the finger via `translate`; releasing
     past the threshold closes it, and clearing the inline value lets the CSS exit take over. */
  const onHandleDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!window.matchMedia("(max-width: 63.999rem)").matches) return;
    drag.current = { pointer: event.pointerId, startY: event.clientY, dy: 0 };
    dragged.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onHandleMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const dialog = dialogRef.current;
    if (!state || !dialog || state.pointer !== event.pointerId) return;
    state.dy = Math.max(0, event.clientY - state.startY);
    if (state.dy > TAP_SLOP_PX) dragged.current = true;
    dialog.style.transition = "none";
    dialog.style.translate = `0 ${state.dy}px`;
  };
  const onHandleUp = () => {
    const state = drag.current;
    const dialog = dialogRef.current;
    drag.current = null;
    if (!state || !dialog) return;
    dialog.style.transition = "";
    dialog.style.translate = "";
    if (state.dy >= CLOSE_DRAG_PX) close();
  };
  const onHandleClick = () => {
    // A tap closes; the click that ends a drag does not.
    if (!dragged.current) close();
    dragged.current = false;
  };

  const { items, count, subtotal, status } = cart;
  const shownSuggestion = suggestion && !items.some((i) => i.productId === suggestion.productId) ? suggestion : null;

  return (
    <dialog
      ref={dialogRef}
      id="cart-drawer"
      aria-labelledby="cart-drawer-title"
      closedby="any"
      data-close-on-navigate=""
      className={styles.drawer}
      onClose={onClosed}
      onClick={(event) => {
        // Light dismiss where `closedby` is not supported: the click landed on the backdrop.
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        aria-hidden="true"
        className={styles.handle}
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleUp}
        onClick={onHandleClick}
      >
        <span className={styles.grabber} />
      </div>

      <header className="flex items-center gap-3 px-5 pt-1 pb-3 lg:pt-5">
        <CartGlyph parcels={count} className="size-9 text-ink" />
        <div className="flex min-w-0 flex-col">
          <h2 id="cart-drawer-title" className="text-lg leading-tight font-bold text-ink">
            سبد خرید
          </h2>
          {count > 0 ? <p className="text-xs text-muted">{toFaDigits(count)} کالا</p> : null}
        </div>
        <IconButton icon="close" label="بستن سبد خرید" size="sm" onClick={close} className="ms-auto" />
      </header>

      <div className={cn(styles.body, "px-5")}>
        {items.length === 0 ? (
          <EmptyCart links={config.emptyLinks} />
        ) : (
          <>
            <FreeShippingMeter subtotal={subtotal} freeOverToman={config.freeShippingOverToman} className="pb-2" />
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <CartLine key={item.key} item={item} status={status[item.key]} />
              ))}
            </ul>
            {shownSuggestion ? <CrossSell suggestion={shownSuggestion} /> : null}
          </>
        )}
      </div>

      {items.length > 0 ? (
        <footer className={cn(styles.footer, "flex flex-col gap-4 border-t border-line px-5 pt-4")}>
          <CartSummary subtotal={subtotal} count={count} config={config} />
          <Button href="/cart" variant="secondary" size="md" block iconEnd="arrow-end">
            ادامهٔ خرید
          </Button>
        </footer>
      ) : null}

      <Toaster host={TOAST_HOST} />
    </dialog>
  );
}

function suggestionItem(s: QuoteSuggestion): Omit<CartItem, "key" | "qty"> {
  return {
    productId: s.productId,
    variantId: null,
    slug: s.slug,
    name: s.name,
    variantName: null,
    priceToman: s.priceToman,
    illustration: s.illustration,
    imagePath: s.imagePath,
  };
}

/* «کنارش خوب می‌شینه»: one bundle partner of something already in the cart. */
function CrossSell({ suggestion }: { suggestion: QuoteSuggestion }) {
  return (
    <section aria-labelledby="cart-cross-sell" className="mt-2 mb-4 rounded-bit tray p-3">
      <h3 id="cart-cross-sell" className="mb-2 text-sm font-bold text-ink">
        کنارش خوب می‌شینه
      </h3>
      <div className="flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-bit-sm bg-surface p-1">
          {suggestion.imagePath ? (
            <Image src={mediaUrl(suggestion.imagePath)} width={56} height={56} sizes="56px" alt="" className="size-full object-contain" />
          ) : suggestion.illustration ? (
            <DrawingImg illustration={suggestion.illustration} size={48} className="size-full" />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/product/${suggestion.slug}`} className="link-mark text-sm font-semibold text-ink">
            {suggestion.name}
          </Link>
          <p className="text-xs font-bold text-ink">
            <TabularNumber value={suggestion.priceToman} /> <span className="font-semibold">تومان</span>
          </p>
        </div>
        {suggestion.hasVariants ? (
          <Button href={`/product/${suggestion.slug}`} variant="quiet" size="sm">
            انتخاب مدل ←
          </Button>
        ) : (
          <AddToCartButton items={suggestionItem(suggestion)} size="icon" />
        )}
      </div>
    </section>
  );
}
