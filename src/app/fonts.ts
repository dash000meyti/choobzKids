import localFont from "next/font/local";

/*
 * Self-hosted Persian fonts (see docs/FONTS.md). Built by scripts/fonts/build.sh.
 * Variables use the --ff-* prefix so they never collide with Tailwind's --font-* tokens.
 * adjustFontFallback is off: Next derives it from Latin metrics, which is wrong for Persian.
 */

export const fontBody = localFont({
  src: [{ path: "../fonts/estedad/estedad-fa-wght.woff2", weight: "100 900", style: "normal" }],
  variable: "--ff-body",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Segoe UI", "Tahoma", "sans-serif"],
  adjustFontFallback: false,
});

export const fontDisplay = localFont({
  src: [{ path: "../fonts/ario/ario-dots1-fa.woff2", weight: "400", style: "normal" }],
  variable: "--ff-display",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Segoe UI", "Tahoma", "sans-serif"],
  adjustFontFallback: false,
});

export const fontHand = localFont({
  src: [{ path: "../fonts/mikhak/mikhak-fa-600-kshd.woff2", weight: "600", style: "normal" }],
  variable: "--ff-hand",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "Segoe UI", "Tahoma", "sans-serif"],
  adjustFontFallback: false,
});

export const fontVariables = `${fontBody.variable} ${fontDisplay.variable} ${fontHand.variable}`;
