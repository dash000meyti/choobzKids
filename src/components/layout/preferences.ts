import { useSyncExternalStore } from "react";

/*
 * The viewer's two display choices (DESIGN.md §9.3, §4.6): «حالت لالایی» (html[data-theme]) and
 * «حرکت آرام» (html[data-motion="reduce"]). The pre-paint ThemeScript applies the stored values
 * before first paint; these helpers read and change them after hydration, keep every toggle on
 * the page in step, and follow other tabs and OS changes. The server always renders the light,
 * motion-on default.
 */

const CHANGE_EVENT = "cz:preference";
const THEME_KEY = "cz.theme";
const MOTION_KEY = "cz.motion";

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");
const reduceQuery = () => window.matchMedia("(prefers-reduced-motion: reduce)");

function store(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Private mode: the choice holds for this page only.
  }
}

function onOtherTab(event: StorageEvent) {
  const root = document.documentElement;
  if (event.key === THEME_KEY) {
    if (event.newValue) root.dataset.theme = event.newValue;
    else delete root.dataset.theme;
  } else if (event.key === MOTION_KEY) {
    if (event.newValue) root.dataset.motion = event.newValue;
    else delete root.dataset.motion;
  }
}

function subscribe(listener: () => void) {
  const dark = darkQuery();
  const reduce = reduceQuery();
  const onStorage = (event: StorageEvent) => {
    onOtherTab(event);
    listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  dark.addEventListener("change", listener);
  reduce.addEventListener("change", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
    dark.removeEventListener("change", listener);
    reduce.removeEventListener("change", listener);
  };
}

function isDark(): boolean {
  const theme = document.documentElement.dataset.theme;
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return darkQuery().matches;
}

/** True while «حالت لالایی» is showing, whether chosen here or inherited from the OS. */
export function useLullaby(): boolean {
  return useSyncExternalStore(subscribe, isDark, () => false);
}

export function setLullaby(dark: boolean) {
  const value = dark ? "dark" : "light";
  document.documentElement.dataset.theme = value;
  store(THEME_KEY, value);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** `system` = the OS already asks for reduced motion, which the site always honours. */
export type CalmMotion = "on" | "off" | "system";

function calmMotion(): CalmMotion {
  if (reduceQuery().matches) return "system";
  return document.documentElement.dataset.motion === "reduce" ? "on" : "off";
}

export function useCalmMotion(): CalmMotion {
  return useSyncExternalStore(subscribe, calmMotion, () => "off");
}

export function setCalmMotion(on: boolean) {
  const root = document.documentElement;
  if (on) root.dataset.motion = "reduce";
  else delete root.dataset.motion;
  store(MOTION_KEY, on ? "reduce" : null);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
