import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonAsButton } from "./Button";
import { IconButton } from "./IconButton";
import styles from "./Sheet.module.css";

/*
 * The shared sheet primitive (DESIGN.md §4.12): native <dialog>, bottom sheet on phones and a side
 * drawer on desktop. Zero JS: any button opens it with an invoker command —
 *
 *   <Button {...sheetInvokerProps("cart-sheet")}>سبد خرید</Button>
 *   <Sheet id="cart-sheet" title="سبد خرید">…</Sheet>
 *
 * Closing uses <form method="dialog">, which works even where invoker commands need the
 * InvokerPolyfill (layout). Esc and the backdrop (closedby="any") also close it.
 */

export type SheetCommand = "show-modal" | "close" | "request-close";

/** Spread onto any <button> (or Button/IconButton) to open or close the sheet `target`. */
export function sheetInvokerProps(target: string, command: SheetCommand = "show-modal") {
  return {
    commandfor: target,
    command,
    ...(command === "show-modal" ? { "aria-haspopup": "dialog" as const } : null),
  };
}

type SheetProps = {
  id: string;
  title: ReactNode;
  /** Keep the title as the dialog's name but hide it visually (custom headers). */
  hideTitle?: boolean;
  description?: ReactNode;
  /** Desktop drawer edge. Defaults to inline-end (left in RTL). */
  side?: "end" | "start";
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export function Sheet({
  id,
  title,
  hideTitle,
  description,
  side = "end",
  footer,
  closeLabel = "بستن",
  className,
  bodyClassName,
  children,
}: SheetProps) {
  const titleId = `${id}-title`;
  const descriptionId = description ? `${id}-description` : undefined;
  return (
    <dialog
      id={id}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      closedby="any"
      className={cn(styles.sheet, side === "start" && styles.start, className)}
    >
      <span className={styles.grabber} aria-hidden="true" />
      <header className="flex items-start justify-between gap-3 px-5 pt-3 pb-2 lg:pt-5">
        <div className={cn("flex min-w-0 flex-col gap-1", hideTitle && "sr-only")}>
          <h2 id={titleId} className="text-lg font-bold text-ink">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="text-sm text-muted">
              {description}
            </p>
          ) : null}
        </div>
        <form method="dialog" className="ms-auto">
          <IconButton icon="close" label={closeLabel} size="sm" type="submit" />
        </form>
      </header>
      <div className={cn(styles.body, "px-5 pb-6", bodyClassName)}>{children}</div>
      {footer ? <footer className={cn(styles.footer, "border-t border-line px-5 pt-4")}>{footer}</footer> : null}
    </dialog>
  );
}

/** A Button that closes the surrounding sheet, e.g. «ادامهٔ خرید». */
export function SheetClose({ children, ...button }: Omit<ButtonAsButton, "type">) {
  return (
    <form method="dialog" className="contents">
      <Button {...button} type="submit">
        {children}
      </Button>
    </form>
  );
}
