import localFont from "next/font/local";

/*
 * Self-hosted Vazirmatn (OFL, by Saber Rastikerdar), subset to Persian + basic Latin by
 * scripts/fonts/build.sh. One variable file covers every weight: 400 for text, 500–600 for UI,
 * 700–800 for headlines. The --ff-* prefix never collides with Tailwind's --font-* tokens.
 * adjustFontFallback is off: Next derives it from Latin metrics, which is wrong for Persian.
 */
export const fontBody = localFont({
  src: [{ path: "../fonts/vazirmatn/vazirmatn-fa-wght.woff2", weight: "100 900", style: "normal" }],
  variable: "--ff-body",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Segoe UI", "Tahoma", "sans-serif"],
  adjustFontFallback: false,
});

export const fontVariables = fontBody.variable;
