"use client";

import type { MouseEvent } from "react";
import { Button } from "@/components/ui/Button";
import { openCart, preloadCartDrawer } from "@/components/layout/cart/CartProvider";
import { addItems, MAX_LINE_QTY, type CartItem } from "@/components/layout/cart/store";
import { toast } from "@/components/layout/Toaster";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * «افزودن به سبد» (DESIGN.md §4.7 add-to-cart choreography, §4.8). Optimistic: the count updates
 * in the same click. Then the product's picture hops along a three-keyframe WAAPI arc into the
 * visible cart icon ([data-cart-target]), the cart wobbles, and a toast offers «دیدن سبد».
 * Reduced motion, «حرکت آرام» and the lite tier get the count and the toast only.
 *
 * The picture that hops is the first <img> inside the nearest `[data-cart-source]` (or the
 * nearest <article>); without one, a parcel hops from the button itself.
 */

type AddableItem = Omit<CartItem, "key" | "qty">;

export type AddToCartButtonProps = {
  /** One product, or several (a room). */
  items: AddableItem | AddableItem[];
  size?: "icon" | "sm" | "md" | "lg";
  /** Visible label (default «افزودن به سبد»); for `icon` it becomes the accessible name. */
  label?: string;
  /** Toast text, e.g. «۵ وسیلهٔ اتاق به سبد اضافه شد». */
  toastLabel?: string;
  disabled?: boolean;
  className?: string;
};

const HOP_MS = 800;
const WOBBLE_MS = 620;

function motionAllowed() {
  const root = document.documentElement;
  if (root.dataset.motion === "reduce" || "lite" in root.dataset) return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cssEasing(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function visibleCartTarget(): HTMLElement | null {
  const targets = document.querySelectorAll<HTMLElement>("[data-cart-target]");
  for (const target of targets) {
    // Both option spellings: the dock can be hidden by `visibility` (product pages) or `display`.
    const visible =
      typeof target.checkVisibility === "function"
        ? target.checkVisibility({ visibilityProperty: true, checkVisibilityCSS: true, opacityProperty: true, checkOpacity: true })
        : target.offsetParent !== null;
    if (visible) return target;
  }
  return null;
}

function ghostFrom(button: HTMLElement): { ghost: HTMLElement; from: DOMRect } {
  const scope = button.closest<HTMLElement>("[data-cart-source]") ?? button.closest<HTMLElement>("article");
  const picture = scope?.querySelector<HTMLImageElement>("img");
  if (picture && picture.getBoundingClientRect().width > 0) {
    const ghost = picture.cloneNode(false) as HTMLImageElement;
    ghost.removeAttribute("id");
    ghost.removeAttribute("loading");
    ghost.alt = "";
    ghost.style.objectFit = "contain";
    return { ghost, from: picture.getBoundingClientRect() };
  }
  const rect = button.getBoundingClientRect();
  const ghost = document.createElement("span");
  ghost.style.borderRadius = "4px";
  ghost.style.background = "var(--color-kraft)";
  ghost.style.boxShadow = "inset 0 0 0 1.5px var(--ink)";
  const edge = 22;
  return { ghost, from: new DOMRect(rect.left + rect.width / 2 - edge / 2, rect.top + rect.height / 2 - edge / 2, edge, edge) };
}

/** The picture hops into the cart, then the cart wobbles. Fire and forget. */
function hopIntoCart(button: HTMLElement) {
  const target = visibleCartTarget();
  if (!target) return;
  const { ghost, from } = ghostFrom(button);
  const to = target.getBoundingClientRect();

  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    zIndex: "var(--z-toast)",
    pointerEvents: "none",
    willChange: "transform, opacity",
  });
  ghost.setAttribute("aria-hidden", "true");
  document.body.append(ghost);

  const fromX = from.left + from.width / 2;
  const fromY = from.top + from.height / 2;
  const dx = to.left + to.width / 2 - fromX;
  const dy = to.top + to.height / 2 - fromY;
  // The arc's peak sits above both ends, like a toy tossed into the cart.
  const peakY = Math.min(fromY, to.top + to.height / 2) - 80 - fromY;
  const endScale = Math.min(1, 24 / Math.max(from.width, from.height, 1));

  let flight: Animation;
  try {
    flight = ghost.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1, easing: cssEasing("--ease-wood", "ease-out") },
        {
          transform: `translate(${dx * 0.55}px, ${peakY}px) scale(${(1 + endScale) / 2})`,
          opacity: 1,
          offset: 0.45,
          easing: cssEasing("--ease-hop", "ease-in"),
        },
        { transform: `translate(${dx}px, ${dy}px) scale(${endScale})`, opacity: 0.5 },
      ],
      { duration: HOP_MS, fill: "forwards" },
    );
  } catch {
    // An easing this browser cannot parse; skip the hop rather than the add.
    ghost.remove();
    return;
  }

  flight.finished
    .then(() => {
      try {
        target.animate([{ rotate: "-6deg" }, { rotate: "0deg" }], {
          duration: WOBBLE_MS,
          easing: cssEasing("--ease-wobble", "ease-out"),
        });
      } catch {
        // No wobble is fine.
      }
    })
    .catch(() => {})
    .finally(() => ghost.remove());
}

function defaultToast(list: AddableItem[]) {
  if (list.length === 1) return `${list[0].name} به سبد اضافه شد`;
  return `${toFaDigits(list.length)} وسیله به سبد اضافه شد`;
}

export function AddToCartButton({ items, size = "md", label, toastLabel, disabled, className }: AddToCartButtonProps) {
  const list = Array.isArray(items) ? items : [items];

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    if (disabled || !list.length) return;
    const added = addItems(list);
    void preloadCartDrawer().catch(() => {});

    if (added === 0) {
      toast(`از هر وسیله حداکثر ${toFaDigits(MAX_LINE_QTY)} عدد در سبد جا می‌شه.`, undefined, "info");
      return;
    }
    const inDrawer = button.closest("dialog[open]") !== null;
    if (!inDrawer && motionAllowed()) hopIntoCart(button);
    toast(toastLabel ?? defaultToast(list), inDrawer ? undefined : { label: "دیدن سبد", onClick: openCart });
  };

  if (size === "icon") {
    const name = label ?? (list.length === 1 ? `افزودن ${list[0].name} به سبد` : "افزودن به سبد");
    return (
      <Button
        variant="icon"
        size="md"
        iconStart="plus"
        aria-label={name}
        disabled={disabled}
        onClick={onClick}
        className={cn("relative z-10", className)}
      />
    );
  }

  return (
    <Button variant="primary" size={size} disabled={disabled} onClick={onClick} className={className}>
      {label ?? "افزودن به سبد"}
    </Button>
  );
}
