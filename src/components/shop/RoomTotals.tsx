"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CartItem } from "@/components/layout/cart/store";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { installmentPlan, type SnappPaySettings } from "@/components/ui/installments";
import { TabularNumber } from "@/components/ui/TabularNumber";
import { formatNumber, toFaDigits } from "@/lib/format";
import styles from "./RoomBuilder.module.css";

/*
 * RoomTotals (DESIGN.md §5.3, §10.2): the live half of the room panel. The server renders the
 * piece toggles disabled (they do nothing without JS) and this island enables them, follows their
 * changes, and keeps the summary («۵ تکه · جمع: …»), the installment line, the four wheels and
 * «همه را به سبد اضافه کن» in step with the pieces left in the room.
 *
 * The wheels are the server's <InstallmentWheels> passed in as a slot; their amounts are updated
 * through the hooks it exposes ([data-installment-amount], [data-wheel] + data-spin). Pieces
 * taken out of the room fade in the scene through `data-off` on `[data-scene-piece]`.
 */

export type RoomTotalsPiece = Omit<CartItem, "key" | "qty"> & { defaultOn: boolean };

type RoomTotalsProps = {
  /** Same key as the scene pieces' `data-room`. */
  roomKey: string;
  pieces: RoomTotalsPiece[];
  snapppay: SnappPaySettings;
  /** <InstallmentWheels> for the default total. */
  wheels: ReactNode;
  /** Links under the add-all button. */
  children?: ReactNode;
};

/** TabularNumber's markup, for amounts rewritten outside React (proportional «٬» inside tabular digits). */
function writeAmount(target: HTMLElement, value: number) {
  const number = document.createElement("span");
  number.className = "tabular-nums";
  formatNumber(value)
    .split("٬")
    .forEach((group, index) => {
      if (index > 0) {
        const separator = document.createElement("span");
        separator.className = "proportional-nums";
        separator.textContent = "٬";
        number.append(separator);
      }
      number.append(group);
    });
  target.setAttribute("value", String(value));
  target.replaceChildren(number);
}

function toCartItem(piece: RoomTotalsPiece): Omit<CartItem, "key" | "qty"> {
  const { productId, variantId, slug, name, variantName, priceToman, illustration, imagePath } = piece;
  return { productId, variantId, slug, name, variantName, priceToman, illustration, imagePath };
}

export function RoomTotals({ roomKey, pieces, snapppay, wheels, children }: RoomTotalsProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const wheelsRef = useRef<HTMLDivElement>(null);
  const [inRoom, setInRoom] = useState<ReadonlySet<number>>(
    () => new Set(pieces.filter((piece) => piece.defaultOn).map((piece) => piece.productId)),
  );
  const chosen = pieces.filter((piece) => inRoom.has(piece.productId));
  const total = chosen.reduce((sum, piece) => sum + piece.priceToman, 0);
  const plan = installmentPlan(total, snapppay);
  // The total the wheels currently show (the server rendered them for the default room).
  const shownTotal = useRef(total);

  // Enable the server-rendered toggles and follow them (also picks up a state the browser restored).
  useEffect(() => {
    const builder = barRef.current?.closest<HTMLElement>("[data-room-builder]");
    if (!builder) return;
    const toggles = [...builder.querySelectorAll<HTMLInputElement>("input[data-room-toggle]")];
    const read = () => setInRoom(new Set(toggles.filter((t) => t.checked).map((t) => Number(t.dataset.roomToggle))));
    for (const toggle of toggles) toggle.disabled = false;
    read();
    builder.addEventListener("change", read);
    return () => builder.removeEventListener("change", read);
  }, []);

  // Fade the pieces that left the room.
  useEffect(() => {
    const room = CSS.escape(roomKey);
    for (const piece of pieces) {
      for (const el of document.querySelectorAll<HTMLElement>(`[data-scene-piece="${piece.productId}"][data-room="${room}"]`)) {
        el.toggleAttribute("data-off", !inRoom.has(piece.productId));
      }
    }
  }, [inRoom, pieces, roomKey]);

  // Rewrite the wheels' amounts and give them their quarter turn.
  useEffect(() => {
    if (total === shownTotal.current || !plan) return;
    shownTotal.current = total;
    const board = wheelsRef.current;
    if (!board) return;
    for (const amount of board.querySelectorAll<HTMLElement>("[data-installment-amount]")) writeAmount(amount, plan.amount);
    for (const wheel of board.querySelectorAll<HTMLElement>("[data-wheel]")) {
      wheel.removeAttribute("data-spin");
      // Restart the animation when amounts change faster than it plays.
      void wheel.offsetWidth;
      wheel.setAttribute("data-spin", "");
      wheel.addEventListener("animationend", () => wheel.removeAttribute("data-spin"), { once: true });
    }
  }, [total, plan]);

  const count = toFaDigits(chosen.length);
  const items = chosen.map(toCartItem);

  return (
    <>
      {/* The strip that follows the thumb: count, total and the one-line installment offer. */}
      <div ref={barRef} className={styles.summary}>
        <p aria-live="polite" aria-atomic="true" className="flex flex-wrap items-baseline gap-x-2 text-base font-bold text-ink">
          {chosen.length ? (
            <>
              <span>{count} تکه</span>
              <span aria-hidden="true" className="font-normal text-muted">
                ·
              </span>
              <span>
                جمع: <TabularNumber value={total} /> تومان
              </span>
            </>
          ) : (
            <span>هنوز تکه‌ای توی اتاق نیست</span>
          )}
        </p>
        {plan ? (
          <p className="text-sm text-success">
            یا {toFaDigits(plan.count)} قسط {formatNumber(plan.amount)} تومانی، به تعداد {toFaDigits(plan.count)} چرخِ تاتی
          </p>
        ) : null}
      </div>
      <div ref={wheelsRef} hidden={!plan} className={styles.wheels}>
        {wheels}
        <p className="mt-2 text-2xs text-muted">طبق شرایط اسنپ‌پی</p>
      </div>
      <div className={styles.actions}>
        <AddToCartButton
          items={items}
          size="lg"
          label="همه را به سبد اضافه کن"
          toastLabel={`${count} وسیلهٔ اتاق به سبد اضافه شد`}
          disabled={!items.length}
          className="lg:w-auto"
        />
        {children}
      </div>
    </>
  );
}
