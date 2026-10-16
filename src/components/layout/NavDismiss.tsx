"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/*
 * The menu dialog, search dialog, mega menus and cart drawer stay mounted across client
 * navigations (they live in the persistent layout), so a link inside one would leave it open over
 * the next page. Anything marked [data-close-on-navigate] closes when a link or form inside it is
 * used, and again whenever the path changes. Renders nothing.
 */

const SCOPE = "[data-close-on-navigate]";

function dismiss(element: Element) {
  if (element instanceof HTMLDialogElement) {
    if (element.open) element.close();
  } else if (element instanceof HTMLElement && element.matches(":popover-open")) {
    element.hidePopover();
  }
}

export function NavDismiss() {
  const pathname = usePathname();

  useEffect(() => {
    document.querySelectorAll(SCOPE).forEach(dismiss);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // No defaultPrevented check: next/link prevents the default to navigate on the client.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank") return;
      const scope = link.closest(SCOPE);
      if (scope) dismiss(scope);
    };
    const onSubmit = (event: SubmitEvent) => {
      const scope = (event.target as Element | null)?.closest?.(SCOPE);
      // <form method="dialog"> closes its own dialog.
      if (scope && (event.target as HTMLFormElement).method !== "dialog") dismiss(scope);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  return null;
}
