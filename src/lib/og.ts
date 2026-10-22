import "server-only";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import sharp, { type OverlayOptions } from "sharp";
import { tag } from "@/lib/cache-tags";

/*
 * Open Graph cards with Persian text (docs/TECH.md §4.9), in the Studio look (DESIGN-STUDIO.md).
 * next/og (Satori) has no HarfBuzz or bidi and scrambles Persian, so text is set by sharp's
 * text input: libvips → Pango + HarfBuzz + FriBiDi, with the TTF subsets built by
 * scripts/fonts/og.sh. Everything else on the card is one inline SVG rasterised by librsvg.
 * No network access at any point.
 */

const OG_DIR = path.join(process.cwd(), "assets", "og");
const VAZIRMATN = path.join(OG_DIR, "Vazirmatn-Bold.ttf");
const RENDERS = path.join(process.cwd(), "public", "renders");

// Fontconfig should only ever see our files (no silent fallback to a system face). Both
// variables are read once, when Pango first lays out text, so setting them here is early enough;
// the container should still set FONTCONFIG_FILE=/app/assets/og/fonts.conf (TECH.md §4.9).
// PANGOCAIRO_BACKEND=fc is the default on Linux; on macOS it stops Pango using CoreText, which
// ignores `fontfile` and would render a system font.
process.env.FONTCONFIG_FILE ??= path.join(OG_DIR, "fonts.conf");
process.env.PANGOCAIRO_BACKEND ??= "fc";

export const OG_SIZE = { width: 1200, height: 630 } as const;

/* Studio palette (globals.css). The card is a fixed light scene, like a product page. */
const C = {
  page: "#FFFFFF",
  tile: "#F5F5F7",
  ink: "#1D1D1F",
  muted: "#6E6E73",
  eyebrow: "#B64400",
} as const;

/* Layout, in card pixels. Text sits at the inline start (right); the render tile at the end (left). */
const TEXT_RIGHT = 1136;
const TEXT_WIDTH = 540;
const TILE = { x: 40, y: 40, w: 520, h: 550, r: 44 } as const;
const TILE_PAD = 56;
const TITLE_SIZES = [72, 64, 56, 50, 44] as const;
const TITLE_MAX_HEIGHT = 300;
const TITLE_MAX_CHARS = 90;
const KICKER_SIZES = [30, 26] as const;
const KICKER_GAP = 16;
const MASTHEAD_TOP = 64;
const TEXT_AREA_TOP = 120;
const TEXT_AREA_BOTTOM = 566;

/** The default product on cards that have no product of their own. */
export const OG_DEFAULT_RENDER = "learning-tower";

/**
 * Renders a 1200×630 PNG card: kicker (eyebrow colour) over the title (Vazirmatn Bold, ink) on
 * white, the product's studio render on a grey tile, and the «چوبز کیدز · choobz.kids» masthead.
 * Cached like content: `tags` should name the collections the title comes from, e.g.
 * `['products', 'product:12']`, so a CMS edit refreshes the card with the page.
 */
export async function renderOgPng(
  title: string,
  kicker: string,
  tags: string[],
  render: string = OG_DEFAULT_RENDER,
): Promise<Uint8Array<ArrayBuffer>> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.og, ...tags);
  return composeOgPng(title, kicker, render);
}

/** `renderOgPng` wrapped as the Response an `opengraph-image.tsx` default export returns. */
export async function ogResponse(title: string, kicker: string, tags: string[], render?: string | null): Promise<Response> {
  const png = await renderOgPng(title, kicker, tags, render ?? OG_DEFAULT_RENDER);
  return new Response(png, { headers: { "Content-Type": "image/png" } });
}

/** The product render fitted inside the tile, resting on its floor; null when there is none. */
async function renderLayer(key: string): Promise<OverlayOptions | null> {
  const file = path.join(RENDERS, `${path.basename(key)}-hero.webp`);
  try {
    const { data, info } = await sharp(file)
      .resize({ width: TILE.w - TILE_PAD * 2, height: TILE.h - TILE_PAD * 2, fit: "inside" })
      .png()
      .toBuffer({ resolveWithObject: true });
    return {
      input: data,
      left: Math.round(TILE.x + (TILE.w - info.width) / 2),
      top: Math.round(TILE.y + TILE.h - TILE_PAD * 0.75 - info.height),
    };
  } catch {
    return null;
  }
}

/** The uncached renderer (also used by local render checks). */
export async function composeOgPng(title: string, kicker: string, render: string = OG_DEFAULT_RENDER): Promise<Uint8Array<ArrayBuffer>> {
  const [brand, kickerText, titleText, product] = await Promise.all([
    renderText(
      `<span foreground="${C.ink}">چوبز کیدز</span><span foreground="${C.muted}">  ·  choobz.kids</span>`,
      { font: "Vazirmatn Bold 24", fontfile: VAZIRMATN, width: TEXT_WIDTH },
    ),
    kicker.trim() ? fitKicker(kicker.trim()) : null,
    fitTitle(title),
    renderLayer(render),
  ]);

  // The kicker + title block is centred in the space between the masthead and the card's foot.
  const blockHeight = titleText.height + (kickerText ? kickerText.height + KICKER_GAP : 0);
  const free = TEXT_AREA_BOTTOM - TEXT_AREA_TOP - blockHeight;
  let y = Math.round(TEXT_AREA_TOP + Math.max(0, free / 2));
  const layers: OverlayOptions[] = [{ input: brand.data, top: MASTHEAD_TOP, left: TEXT_RIGHT - brand.width }];
  if (product) layers.push(product);
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
  const markup = `<span foreground="${C.eyebrow}">${escapeMarkup(kicker)}</span>`;
  let image: TextImage | null = null;
  for (const size of KICKER_SIZES) {
    image = await renderText(markup, { font: `Vazirmatn Bold ${size}`, fontfile: VAZIRMATN, width: TEXT_WIDTH });
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
  const markup = `<span foreground="${C.ink}">${escapeMarkup(text)}</span>`;
  for (const size of TITLE_SIZES) {
    const image = await renderText(markup, { font: `Vazirmatn Bold ${size}`, fontfile: VAZIRMATN, width: TEXT_WIDTH });
    if (image.height <= TITLE_MAX_HEIGHT && image.width <= TEXT_WIDTH) return image;
  }
  const smallest = TITLE_SIZES[TITLE_SIZES.length - 1];
  return renderText(markup, { font: `Vazirmatn Bold ${smallest}`, fontfile: VAZIRMATN, width: TEXT_WIDTH, wrap: "word-char" });
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
/* Scene: white card with the grey render tile                          */
/* ------------------------------------------------------------------ */

function sceneSvg(): string {
  const { width: W, height: H } = OG_SIZE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.page}"/>
  <rect x="${TILE.x}" y="${TILE.y}" width="${TILE.w}" height="${TILE.h}" rx="${TILE.r}" fill="${C.tile}"/>
</svg>`;
}
