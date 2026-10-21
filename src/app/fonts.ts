import localFont from "next/font/local";

/*
 * Self-hosted Estedad (see docs/FONTS.md), built by scripts/fonts/build.sh.
 * The Studio direction sets everything in Estedad: 400–500 for text, 800–900 for headlines.
 * The variable uses the --ff-* prefix so it never collides with Tailwind's --font-* tokens.
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

export const fontVariables = fontBody.variable;
