import "server-only";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import sharp, { type OverlayOptions } from "sharp";
import { tag } from "@/lib/cache-tags";

/*
 * Open Graph cards with Persian text (docs/TECH.md §4.9).
 * next/og (Satori) has no HarfBuzz or bidi and scrambles Persian, so text is set by sharp's
 * text input: libvips → Pango + HarfBuzz + FriBiDi, with the TTF subsets built by
 * scripts/fonts/og.sh. Everything else on the card is one inline SVG rasterised by librsvg.
 * No network access at any point.
 */

const OG_DIR = path.join(process.cwd(), "assets", "og");
const ARIO = path.join(OG_DIR, "Ario-Dots1.ttf");
const ESTEDAD = path.join(OG_DIR, "Estedad-Bold.ttf");

// Fontconfig should only ever see our two files (no silent fallback to a system face). Both
// variables are read once, when Pango first lays out text, so setting them here is early enough;
// the container should still set FONTCONFIG_FILE=/app/assets/og/fonts.conf (TECH.md §4.9).
// PANGOCAIRO_BACKEND=fc is the default on Linux; on macOS it stops Pango using CoreText, which
// ignores `fontfile` and would render a system font.
process.env.FONTCONFIG_FILE ??= path.join(OG_DIR, "fonts.conf");
process.env.PANGOCAIRO_BACKEND ??= "fc";

export const OG_SIZE = { width: 1200, height: 630 } as const;

/* Raw palette (globals.css «روز»). The card is a fixed light scene, like a printed page. */
const C = {
  shir: "#FBF6EC",
  kahgel: "#F1E6D3",
  takhte: "#E8D3AE",
  takhteLight: "#F0E0C2",
  asal: "#C8955A",
  plyDark: "#9C6B3A",
  gerdu: "#33251B",
  gerduNarm: "#6B5545",
  anar: "#B23A26",
  pesteh: "#3E6A4C",
} as const;

/* Layout, in card pixels. Text sits at the inline start (right); Tati's arch at the end (left). */
const TEXT_RIGHT = 1128;
const TEXT_WIDTH = 600;
const SHELF_TOP = 578;
const BAND_TOP = 586;
const TITLE_SIZES = [76, 68, 60, 52, 46] as const;
const TITLE_MAX_HEIGHT = 300;
const TITLE_MAX_CHARS = 90;
const KICKER_SIZES = [30, 26] as const;
const KICKER_GAP = 18;
const MASTHEAD_TOP = 52;
const TEXT_AREA_TOP = 120;

/**
 * Renders a 1200×630 PNG card: kicker (Estedad Bold) over the title (Ario), on shir paper with
 * a plywood shelf, Tati standing in a kahgel arch, and the «چوبز کیدز · choobz.kids» masthead.
 * Cached like content: `tags` should name the collections the title comes from, e.g.
 * `['products', 'product:12']`, so a CMS edit refreshes the card with the page.
 */
export async function renderOgPng(title: string, kicker: string, tags: string[]): Promise<Uint8Array<ArrayBuffer>> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.og, ...tags);
  return composeOgPng(title, kicker);
}

/** `renderOgPng` wrapped as the Response an `opengraph-image.tsx` default export returns. */
export async function ogResponse(title: string, kicker: string, tags: string[]): Promise<Response> {
  const png = await renderOgPng(title, kicker, tags);
  return new Response(png, { headers: { "Content-Type": "image/png" } });
}

/** The uncached renderer (also used by local render checks). */
export async function composeOgPng(title: string, kicker: string): Promise<Uint8Array<ArrayBuffer>> {
  const [brand, kickerText, titleText] = await Promise.all([
    renderText(
      `<span foreground="${C.gerdu}">چوبز کیدز</span><span foreground="${C.gerduNarm}">  ·  choobz.kids</span>`,
      { font: "Estedad Bold 26", fontfile: ESTEDAD, width: TEXT_WIDTH },
    ),
    kicker.trim() ? fitKicker(kicker.trim()) : null,
    fitTitle(title),
  ]);

  // The kicker + title block is centred in the space between the masthead and the shelf.
  const blockHeight = titleText.height + (kickerText ? kickerText.height + KICKER_GAP : 0);
  const free = SHELF_TOP - 24 - TEXT_AREA_TOP - blockHeight;
  let y = Math.round(TEXT_AREA_TOP + Math.max(0, free / 2));
  const layers: OverlayOptions[] = [{ input: brand.data, top: MASTHEAD_TOP, left: TEXT_RIGHT - brand.width }];
  if (kickerText) {
    layers.push({ input: kickerText.data, top: y, left: TEXT_RIGHT - kickerText.width });
    y += kickerText.height + KICKER_GAP;
  }
  layers.push({ input: titleText.data, top: y, left: TEXT_RIGHT - titleText.width });

  const png = await sharp(Buffer.from(sceneSvg()))
    .composite(layers)
    .png({ compressionLevel: 9, palette: true, quality: 95, effort: 8 })
    .toBuffer();
  return new Uint8Array(png);
}

type TextImage = { data: Buffer; width: number; height: number };

type TextOptions = { font: string; fontfile: string; width: number; wrap?: "word" | "word-char" };

async function renderText(markup: string, opts: TextOptions): Promise<TextImage> {
  const { data, info } = await sharp({
    text: {
      text: markup,
      font: opts.font,
      fontfile: opts.fontfile,
      width: opts.width,
      // Pango swaps left/right for right-to-left paragraphs, so 'left' lines up the
      // start (right) edge of every Persian line.
      align: "left",
      wrap: opts.wrap ?? "word",
      rgba: true,
      dpi: 72,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** The kicker is one line: it steps down a size before it is allowed to wrap. */
async function fitKicker(kicker: string): Promise<TextImage> {
  const markup = `<span foreground="${C.pesteh}">${escapeMarkup(kicker)}</span>`;
  let image: TextImage | null = null;
  for (const size of KICKER_SIZES) {
    image = await renderText(markup, { font: `Estedad Bold ${size}`, fontfile: ESTEDAD, width: TEXT_WIDTH });
    if (image.height < size * 2) break;
  }
  return image!;
}

/**
 * Largest title size that fits the column in about three lines. A phrase bound by
 * `keepLatinTogether` cannot wrap, so a size is rejected when the text overflows the column too;
 * if even the smallest size overflows, words are finally allowed to break.
 */
async function fitTitle(title: string): Promise<TextImage> {
  const text = keepLatinTogether(truncateWords(title.trim(), TITLE_MAX_CHARS));
  const markup = `<span foreground="${C.gerdu}">${escapeMarkup(text)}</span>`;
  for (const size of TITLE_SIZES) {
    const image = await renderText(markup, { font: `Ario ${size}`, fontfile: ARIO, width: TEXT_WIDTH });
    if (image.height <= TITLE_MAX_HEIGHT && image.width <= TEXT_WIDTH) return image;
  }
  const smallest = TITLE_SIZES[TITLE_SIZES.length - 1];
  return renderText(markup, { font: `Ario ${smallest}`, fontfile: ARIO, width: TEXT_WIDTH, wrap: "word-char" });
}

function truncateWords(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).trim()}…`;
}

/**
 * Binds a Latin phrase (and its brackets) with no-break spaces. Wrapped inside a right-to-left
 * paragraph, «مثلث پیکلر (Pikler Triangle)» would otherwise split into "Pikler)" / "(Triangle".
 */
function keepLatinTogether(text: string): string {
  return text.replace(/[([]?[A-Za-z0-9][\w.'&-]*(?: [A-Za-z0-9][\w.'&-]*)+[)\]]?/g, (run) => run.replace(/ /g, "\u00A0"));
}

function escapeMarkup(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ------------------------------------------------------------------ */
/* Scene: paper, kahgel arch, Tati on his cart, plywood shelf           */
/* ------------------------------------------------------------------ */

function sceneSvg(): string {
  const { width: W, height: H } = OG_SIZE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="ply" width="${W}" height="10" patternUnits="userSpaceOnUse">
      <rect width="${W}" height="3" y="0" fill="${C.takhteLight}"/>
      <rect width="${W}" height="2" y="3" fill="${C.asal}"/>
      <rect width="${W}" height="3" y="5" fill="${C.takhteLight}"/>
      <rect width="${W}" height="2" y="8" fill="${C.plyDark}"/>
    </pattern>
    <radialGradient id="contact">
      <stop offset="0" stop-color="${C.gerdu}" stop-opacity=".24"/>
      <stop offset="1" stop-color="${C.gerdu}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.shir}"/>
  <path d="M64 ${SHELF_TOP}V330A200 180 0 0 1 464 330V${SHELF_TOP}Z" fill="${C.kahgel}"/>
  <rect y="${SHELF_TOP}" width="${W}" height="${BAND_TOP - SHELF_TOP}" fill="${C.takhte}"/>
  <rect y="${BAND_TOP}" width="${W}" height="${H - BAND_TOP}" fill="url(#ply)"/>
  <rect y="${SHELF_TOP}" width="${W}" height="1.5" fill="${C.plyDark}" opacity=".35"/>
  <ellipse cx="264" cy="${SHELF_TOP + 2}" rx="170" ry="9" fill="url(#contact)"/>
  ${tatiSvg(86, 289, 3.7)}
</svg>`;
}

/**
 * Tati, the duck pull-toy from the logo, facing inline-end (left) as he always travels
 * (DESIGN.md §3.6), drawn on a 96×80 artboard and placed at (x, y) × scale. Natural birch;
 * colour only on the string and the wheel hubs. The string leaves the frame at the top-left,
 * as if a child's hand is pulling it just out of shot.
 */
function tatiSvg(x: number, y: number, scale: number): string {
  const ink = `stroke="${C.gerdu}" stroke-linecap="round" stroke-linejoin="round"`;
  const body =
    "M18 30C12 44 22 54 40 54L70 54C84 54 90 44 88 22C80 30 70 33 58 33C48 33 42 30 38 26Z";
  const wheel = (cx: number, cy: number) => `
    <circle cx="${cx}" cy="${cy}" r="12" fill="${C.takhte}" stroke-width="1.3"/>
    <path d="M${cx + 4.6} ${cy - 4.6}l2.4 -2.4M${cx - 4.6} ${cy - 4.6}l-2.4 -2.4M${cx + 4.6} ${cy + 4.6}l2.4 2.4M${cx - 4.6} ${cy + 4.6}l-2.4 2.4" stroke-width="1.1"/>
    <circle cx="${cx}" cy="${cy}" r="3.6" fill="${C.anar}" stroke-width="1"/>`;
  // Stroke the head + body twice as wide, then cover with their fills: only the outer half of
  // the stroke survives, which outlines the union without a seam at the neck.
  return `<g ${ink} fill="none">
    <path d="M${x + 6 * scale} ${y + 57 * scale}C${x - 30} ${y + 52 * scale} -10 ${y + 40 * scale} -20 ${y + 14 * scale}" stroke="${C.anar}" stroke-width="4.5"/>
    <g transform="translate(${x} ${y}) scale(${scale})">
      <g opacity=".55">
        <circle cx="20" cy="64" r="12" fill="${C.takhte}" stroke-width="1.2"/>
        <circle cx="60" cy="64" r="12" fill="${C.takhte}" stroke-width="1.2"/>
      </g>
      <path d="${body}" stroke-width="2.6"/>
      <circle cx="28" cy="20" r="14" stroke-width="2.6"/>
      <path d="${body}" fill="${C.takhte}" stroke="none"/>
      <circle cx="28" cy="20" r="14" fill="${C.takhte}" stroke="none"/>
      <path d="M50 48C58 50.5 70 50.5 80 45.5M73 29C77.5 31 82 31 86 27.5M22 37C25 44 31 48 38 49.5" stroke="${C.asal}" stroke-width=".9" opacity=".6"/>
      <path d="M18 18C24 13 33 12 39 17" stroke="${C.takhteLight}" stroke-width="2.2" opacity=".9"/>
      <path d="M68 38C62 46 50 46.5 44 41.5" stroke-width="1.2"/>
      <path d="M16 16.5C10 16.5 4.5 19.5 3 22C4.5 24.5 10 27.5 16 27.5Z" fill="${C.asal}" stroke-width="1.2"/>
      <circle cx="24.5" cy="18" r="2.6" fill="${C.gerdu}" stroke="none"/>
      <circle cx="25.4" cy="17.1" r=".9" fill="${C.shir}" stroke="none"/>
      <rect x="6" y="52" width="84" height="9" rx="3" fill="${C.takhteLight}" stroke-width="1.2"/>
      <path d="M8 55H88" stroke="${C.asal}" stroke-width=".9"/>
      <path d="M8 58H88" stroke="${C.plyDark}" stroke-width=".9"/>
      ${wheel(28, 66)}
      ${wheel(68, 66)}
    </g>
  </g>`;
}
