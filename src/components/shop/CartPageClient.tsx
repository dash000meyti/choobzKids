"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CartLine } from "@/components/layout/cart/CartLine";
import { useCartConfig } from "@/components/layout/cart/CartProvider";
import { CartSummary } from "@/components/layout/cart/CartSummary";
import { EmptyCart } from "@/components/layout/cart/EmptyCart";
import { FreeShippingMeter } from "@/components/layout/cart/FreeShippingMeter";
import { requestQuote } from "@/components/layout/cart/quote";
import { applyQuote, useCart, type CartItem, type LineStatus } from "@/components/layout/cart/store";
import { toast } from "@/components/layout/Toaster";
import { formatToman, toEnDigits, toFaDigits } from "@/lib/format";

/*
 * /cart, Phase 1 (DESIGN.md §4.7): rendered from the browser cart after hydration. Lines and the
 * summary with SnappPay's four-payment schedule, then «ثبت سفارش در بله»: it copies a plain-text
 * order to the clipboard and opens Bale (or Instagram DM when Bale is not set ⚑), where the
 * workshop confirms the order by hand. «تماس تلفنی» calls the shop when a phone is set.
 * Phase 2 replaces this with the real checkout and the SnappPay gateway.
 */

type CartPageClientProps = {
  /** Canonical origin, for product links inside the order text. */
  siteUrl: string;
};

function orderText(items: CartItem[], status: Record<string, LineStatus>, subtotal: number, siteUrl: string) {
  const lines = items.map((item, index) => {
    const unavailable = status[item.key]?.available === false;
    const title = [item.name, item.variantName].filter(Boolean).join(" — ");
    return [
      `${toFaDigits(index + 1)}. ${title}${unavailable ? " (فعلاً تموم شده)" : ""}`,
      item.addons?.engraving ? `   حک اسم: ${item.addons.engraving}` : null,
      `   ${toFaDigits(item.qty)} عدد × ${formatToman(item.priceToman)}`,
      `   ${siteUrl}/product/${item.slug}`,
    ]
      .filter(Boolean)
      .join("\n");
  });
  return ["سلام چوبز! می‌خوام این سفارش رو ثبت کنم:", "", ...lines, "", `جمع: ${formatToman(subtotal)}`].join("\n");
}

/** Copies through a temporary textarea, for browsers without the async clipboard. */
function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}

function Placeholder() {
  return (
    <p className="mt-8 min-h-48 text-base text-muted" aria-live="polite">
      سبدت رو از روی همین دستگاه می‌خونیم…
    </p>
  );
}

export function CartPageClient({ siteUrl }: CartPageClientProps) {
  const config = useCartConfig();
  const { items, count, subtotal, status, ready } = useCart();
  const quoted = useRef(false);

  const refresh = useEffectEvent((signal: AbortSignal) => {
    if (!items.length) return;
    requestQuote(items, signal).then(applyQuote, (error: unknown) => {
      if (!signal.aborted) console.warn("[cart] price refresh failed", error);
    });
  });

  // Prices and availability are refreshed once per visit, as soon as the cart is known.
  useEffect(() => {
    if (!ready || quoted.current) return;
    quoted.current = true;
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [ready]);

  if (!ready) return <Placeholder />;
  if (!items.length) return <EmptyCart links={config.emptyLinks} className="mt-6" />;

  const text = orderText(items, status, subtotal, siteUrl);
  const channel = config.bale
    ? { href: config.bale, label: "ثبت سفارش در بله", sent: "متن سفارش کپی شد؛ توی بله برامون بفرست" }
    : config.instagram
      ? {
          href: config.instagram,
          label: "ثبت سفارش در دایرکت اینستاگرام",
          sent: "متن سفارش کپی شد؛ توی دایرکت اینستاگرام برامون بفرست",
        }
      : null;
  const phoneHref = config.phone ? `tel:${toEnDigits(config.phone).replace(/[^\d+]/g, "")}` : null;

  // The link opens the chat in a new tab on its own; copying starts first, inside the same click.
  const copyOrder = () => {
    if (!channel) return;
    const failed = () => toast("کپی نشد؛ متن سفارش پایین همین صفحه هست.", undefined, "warning");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast(channel.sent),
        () => (legacyCopy(text) ? toast(channel.sent) : failed()),
      );
    } else if (legacyCopy(text)) {
      toast(channel.sent);
    } else {
      failed();
    }
  };

  return (
    <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
      <section aria-label="وسایل سبد" className="flex flex-col gap-4">
        <FreeShippingMeter subtotal={subtotal} freeOverToman={config.freeShippingOverToman} />
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <CartLine key={item.key} item={item} status={status[item.key]} />
          ))}
        </ul>
      </section>

      <aside className="flex flex-col gap-5 rounded-bit-lg bg-raised p-5 shadow-paper lg:sticky lg:top-[calc(var(--spacing-header-lg)+1.5rem)]">
        <CartSummary subtotal={subtotal} count={count} config={config} schedule />
        {channel ? (
          <a
            href={channel.href}
            target="_blank"
            rel="noopener"
            onClick={copyOrder}
            className={buttonClasses({ variant: "primary", size: "lg", block: true })}
          >
            <Icon name={config.bale ? "bale" : "instagram"} />
            {channel.label}
          </a>
        ) : null}
        {phoneHref ? (
          <a href={phoneHref} className={buttonClasses({ variant: "secondary", size: "md", block: true })}>
            <Icon name="phone" />
            تماس تلفنی
          </a>
        ) : null}
        <p className="text-xs text-muted">
          {channel
            ? "متن سفارش کپی می‌شه؛ کافیه توی گفت‌وگو بچسبونی و بفرستی. کارگاه موجودی، هزینهٔ ارسال و زمان تحویل رو همون‌جا تأیید می‌کنه."
            : "برای ثبت سفارش با ما تماس بگیر؛ کارگاه موجودی، هزینهٔ ارسال و زمان تحویل رو تأیید می‌کنه."}
        </p>
        <details className="group text-sm">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <Icon name="chevron-down" className="size-4 transition-transform group-open:rotate-180" />
            متن سفارش
          </summary>
          <textarea
            readOnly
            value={text}
            rows={Math.min(14, 4 + items.length * 4)}
            aria-label="متن سفارش برای کپی"
            className="mt-2 w-full resize-none rounded-bit-sm border-[1.5px] border-line-strong bg-sunken p-3 text-sm leading-relaxed text-ink inset-shadow-tray"
          />
        </details>
      </aside>
    </div>
  );
}
