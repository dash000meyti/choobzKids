"use client";

import { useEffect } from "react";

/*
 * Feature-detects invoker commands (`commandfor` / `command`) and `<dialog closedby>`, and loads
 * the small fallback in ./invokers only where one is missing (DESIGN.md §4.3, §10.2). Browsers
 * that support both download nothing more. Renders nothing.
 */
export function InvokerPolyfill() {
  useEffect(() => {
    const commands = !("commandForElement" in HTMLButtonElement.prototype);
    const closedBy = !("closedBy" in HTMLDialogElement.prototype);
    if (!commands && !closedBy) return;
    import("./invokers")
      .then(({ installInvokerFallbacks }) => installInvokerFallbacks({ commands, closedBy }))
      .catch(() => {
        // Chunk failed to load (offline); the dialogs stay closed and links on the page still work.
      });
  }, []);
  return null;
}
