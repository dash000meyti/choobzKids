"use client";

import { useId, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { formatNumber, formatToman, installments, toEnDigits } from "@/lib/format";

/*
 * The «مبلغ دلخواه» field of the installment calculator (DESIGN.md §8, §10.2): the only client
 * code on /installments. It reads the typed amount (Persian or Latin digits), and rewrites the
 * server-rendered wheels of its own panel through their island hooks — `[data-installment-amount]`
 * (value + tabular digits) and `[data-wheel]` (`data-spin`, the quarter-turn settle). No imports
 * beyond format.ts, so the island stays tiny. Until hydration the field is disabled: the wheels
 * below show the server's example amount, which stays true.
 */

type InstallmentAmountInputProps = {
  /** Toman, the amount the server rendered the wheels for. */
  defaultAmount: number;
  count: number;
  minToman: number | null;
  maxToman: number | null;
};

const noop = () => () => {};
const MAX_DIGITS = 11;

/** The same markup as <TabularNumber>: tabular digits with proportional «٬» separators. */
function writeTabular(target: Element, value: number) {
  const box = document.createElement("span");
  box.className = "tabular-nums";
  formatNumber(value)
    .split("٬")
    .forEach((group, index) => {
      if (index > 0) {
        const separator = document.createElement("span");
        separator.className = "proportional-nums";
        separator.textContent = "٬";
        box.append(separator);
      }
      box.append(group);
    });
  target.replaceChildren(box);
}

export function InstallmentAmountInput({ defaultAmount, count, minToman, maxToman }: InstallmentAmountInputProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const shown = useRef(installments(defaultAmount, count));
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [text, setText] = useState(() => formatNumber(defaultAmount));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  function showAmount(each: number) {
    const panel = input.current?.closest("[data-custom-panel]");
    if (!panel || each === shown.current) return;
    shown.current = each;
    panel.querySelectorAll("[data-installment-amount]").forEach((amount) => {
      amount.setAttribute("value", String(each));
      writeTabular(amount, each);
    });
    panel.querySelectorAll<HTMLElement>("[data-wheel]").forEach((wheel) => {
      if (wheel.hasAttribute("data-spin")) return;
      wheel.setAttribute("data-spin", "");
      wheel.addEventListener("animationend", () => wheel.removeAttribute("data-spin"), { once: true });
    });
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = toEnDigits(event.target.value).replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITS);
    const total = digits ? Number(digits) : 0;
    setText(digits ? formatNumber(total) : "");

    if (!total) {
      setError(null);
      setStatus("");
      return;
    }
    const problem =
      minToman != null && total < minToman
        ? `کمترین مبلغ خرید قسطی ${formatToman(minToman)} است.`
        : maxToman != null && total > maxToman
          ? `بیشترین مبلغ خرید قسطی ${formatToman(maxToman)} است.`
          : null;
    setError(problem);
    if (problem) {
      setStatus("");
      return;
    }
    const each = installments(total, count);
    showAmount(each);
    setStatus(`${formatNumber(count)} قسط ${formatNumber(each)} تومانی`);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        مبلغ خرید (تومان)
      </label>
      <input
        ref={input}
        id={id}
        type="text"
        inputMode="numeric"
        dir="ltr"
        autoComplete="off"
        enterKeyHint="done"
        value={text}
        onChange={onChange}
        disabled={!hydrated}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-12 w-full max-w-xs rounded-bit-sm border-[1.5px] border-line-strong bg-sunken px-3.5 text-end text-lg font-bold text-ink inset-shadow-tray transition-[border-color] duration-(--dur-quick) ease-wood placeholder:text-muted focus:border-focus disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger"
        placeholder="مثلاً ۸٬۰۰۰٬۰۰۰"
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
