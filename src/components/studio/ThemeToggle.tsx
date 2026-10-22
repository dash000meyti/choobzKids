"use client";

import { useEffect, useSyncExternalStore } from "react";

/*
 * Light / dark switch in the global nav. The site is light by default (never follows the OS on
 * its own); the choice is kept in localStorage («cz.theme») and applied before first paint by
 * ThemeScript. The switch cross-fades the whole page with a view transition where supported.
 */

type Theme = "light" | "dark";

const META = { light: "#FFFFFF", dark: "#000000" } as const;

function apply(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META[theme]);
  try {
    localStorage.setItem("cz.theme", theme);
  } catch {}
}

/* The theme lives on <html data-theme>: read it from there, so every toggle stays in step. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const readTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const serverTheme = (): Theme => "light";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);
  useEffect(() => {
    // The pre-paint script may run before the theme-color tag exists; keep it in step.
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META[theme]);
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && "startViewTransition" in document) {
      document.documentElement.dataset.themeSwitch = "";
      const t = document.startViewTransition(() => apply(next));
      void t.finished.finally(() => delete document.documentElement.dataset.themeSwitch);
    } else apply(next);
  };

  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "حالت روشن" : "حالت تیره"}
      aria-pressed={dark}
      className={className}
    >
      <svg viewBox="0 0 24 24" className="size-[1.1rem]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
