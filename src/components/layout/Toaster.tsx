"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import styles from "./Toaster.module.css";

/*
 * Toasts (DESIGN.md §4.12): a kraft note with one line and an optional action («برگردون»،
 * «دیدن سبد»). One at a time; a new toast replaces the current one. 4 s, paused while hovered
 * or focused. Call `toast()` from any client code.
 *
 * A modal <dialog> makes the rest of the page inert, so a toast raised from inside the cart
 * drawer would be unreachable in the page outlet. Each <Toaster host="…"> is an outlet; the most
 * recently pushed host shows the toast (pushToastHost / popToastHost from the dialog that opens).
 */

export type ToastAction = { label: string; href?: string; onClick?: () => void };

type ToastData = { id: number; message: string; action?: ToastAction; icon: IconName };

type ToastState = { toast: ToastData | null; host: string };

const PAGE_HOST = "page";
const DURATION_MS = 4000;

let state: ToastState = { toast: null, host: PAGE_HOST };
let hosts: string[] = [PAGE_HOST];
let nextId = 1;
const listeners = new Set<() => void>();

function emit(next: Partial<ToastState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

export function toast(message: string, action?: ToastAction, icon: IconName = "check") {
  emit({ toast: { id: nextId++, message, action, icon } });
}

export function dismissToast(id?: number) {
  if (!state.toast || (id !== undefined && state.toast.id !== id)) return;
  emit({ toast: null });
}

/** Route toasts to the outlet named `host` until it is popped (e.g. while a modal is open). */
export function pushToastHost(host: string) {
  hosts = [...hosts.filter((h) => h !== host), host];
  emit({ host });
}

export function popToastHost(host: string) {
  hosts = hosts.filter((h) => h !== host);
  emit({ host: hosts[hosts.length - 1] ?? PAGE_HOST });
}

type ToasterProps = {
  /** Outlet name; the page outlet is the default. */
  host?: string;
  /** Positioning for an outlet inside a dialog (relative to the dialog, not the viewport). */
  className?: string;
};

export function Toaster({ host = PAGE_HOST, className }: ToasterProps) {
  const { toast: current, host: activeHost } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const visible = current && activeHost === host ? current : null;
  const timer = useRef<number | undefined>(undefined);

  const stop = () => window.clearTimeout(timer.current);
  const start = (id: number) => {
    stop();
    timer.current = window.setTimeout(() => dismissToast(id), DURATION_MS);
  };

  const visibleId = visible?.id;
  useEffect(() => {
    if (visibleId === undefined) return;
    timer.current = window.setTimeout(() => dismissToast(visibleId), DURATION_MS);
    return () => window.clearTimeout(timer.current);
  }, [visibleId]);

  return (
    // The live region stays mounted so screen readers announce each new message.
    <div role="status" aria-live="polite" aria-atomic="true" className={cn(styles.outlet, host !== PAGE_HOST && styles.inDialog, className)}>
      {visible ? (
        <div
          key={visible.id}
          className={cn(styles.note, "flex items-center gap-3 rounded-bit bg-tag px-4 py-3 text-sm text-ink shadow-paper")}
          onPointerEnter={stop}
          onPointerLeave={() => start(visible.id)}
          onFocus={stop}
          onBlur={() => start(visible.id)}
        >
          <Icon name={visible.icon} className="size-5 text-ink" />
          <p className="min-w-0 flex-1 font-semibold">{visible.message}</p>
          {visible.action ? <ToastActionButton toastId={visible.id} action={visible.action} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function ToastActionButton({ toastId, action }: { toastId: number; action: ToastAction }) {
  const classes =
    "link-mark -my-2 inline-flex min-h-11 shrink-0 items-center px-1 font-bold text-ink focus-visible:outline-offset-0";
  const run = () => {
    dismissToast(toastId);
    action.onClick?.();
  };
  if (action.href) {
    return (
      <Link href={action.href} className={classes} onClick={run}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} onClick={run}>
      {action.label}
    </button>
  );
}
