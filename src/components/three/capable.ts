/*
 * Whether this device should run a live three.js scene on its own (no tap). three.js plus the
 * model is ~180 KB gzip and its first frame costs seconds of main thread on a mid-range phone, so
 * live 3D starts by itself only on desktop-class machines with motion allowed and data to spare.
 * Everyone else gets the studio stills (and can still opt in where a page offers a 3D button).
 */

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

export function motionAllowed(): boolean {
  const root = document.documentElement;
  return !(window.matchMedia("(prefers-reduced-motion: reduce)").matches || root.dataset.motion === "reduce" || "lite" in root.dataset);
}

export function dataAllowed(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  if (connection?.saveData) return false;
  // Only clearly slow links: Chrome's "3g" is an estimate that often misfires on fine connections.
  return !/(^|-)2g$/.test(connection?.effectiveType ?? "");
}

export function canAutoRunLive3D(): boolean {
  if (!motionAllowed() || !dataAllowed()) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (!window.matchMedia("(pointer: fine) and (hover: hover)").matches) return false;
  if ((nav.hardwareConcurrency ?? 4) < 6) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  return true;
}

/** Runs `fn` when the browser is idle (or soon, where requestIdleCallback is missing). */
export function whenIdle(fn: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(fn, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 200);
  return () => clearTimeout(id);
}

/** Yields to the browser (input + paint) before the next slice of work. */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}
