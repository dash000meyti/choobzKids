import type { StoryCardTemplate } from "./EngraverIsland";

/*
 * «ذخیره برای استوری» (DESIGN.md §1.3 (3), §5.7): a 1080 × 1920 story card drawn with Canvas 2D,
 * right to left: Tati (the duck pull-toy drawing) waiting at the foot of the learning tower with
 * the name on its top step, the same step up close, and «تاتیِ آیلین، آمادهٔ اولین قدم‌ها» with
 * the brand handle. Shared through the native share sheet when it accepts files, otherwise
 * downloaded. Loaded on tap only.
 *
 * Canvas cannot set font variation axes, so the name is Mikhak at its default width here (the
 * kashida stretch lives only in the page preview): a documented limitation.
 * Fixed light colours: the card is a printed thing and looks the same in «لالایی».
 */

type StoryInput = {
  name: string;
  template: StoryCardTemplate;
  handle: string | null;
  /** Site host for the last line, e.g. "choobz.kids". */
  host: string;
};

export type StoryResult = "shared" | "downloaded" | "cancelled";

const W = 1080;
const H = 1920;
const INK = "#33251B";
const INK_SOFT = "#6B5545";
const PAPER = "#FBF6EC";
const WALL = "#F1E6D3";
const BIRCH = "#E8D3AE";
const BIRCH_LIGHT = "#F0E0C2";
const HONEY = "#C8955A";
const PLY_DARK = "#9C6B3A";
const CHAR = "#2A1A10";
const THREAD = "#B23A26";

const DUCK_SRC = "/illustrations/duck-pull-toy-assembled.svg";

function fontVar(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await img.decode();
  return img;
}

/** Sets `font` at the largest size ≤ `size` that fits `text` in `maxWidth`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, family: string, size: number, maxWidth: number) {
  ctx.font = `${weight} ${size}px ${family}`;
  const width = ctx.measureText(text).width;
  if (width > maxWidth) ctx.font = `${weight} ${Math.floor((size * maxWidth) / width)}px ${family}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** A ply edge: honey and dark veneer lines along its length. */
function strata(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, vertical: boolean) {
  ctx.save();
  ctx.lineWidth = 2;
  [0.25, 0.5, 0.75].forEach((f, i) => {
    ctx.strokeStyle = i === 1 ? PLY_DARK : HONEY;
    ctx.beginPath();
    if (vertical) {
      ctx.moveTo(x + w * f, y);
      ctx.lineTo(x + w * f, y + h);
    } else {
      ctx.moveTo(x, y + h * f);
      ctx.lineTo(x + w, y + h * f);
    }
    ctx.stroke();
  });
  ctx.restore();
}

function contactShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
  g.addColorStop(0, "rgb(51 37 27 / 0.28)");
  g.addColorStop(1, "rgb(51 37 27 / 0)");
  ctx.save();
  ctx.fillStyle = g;
  ctx.scale(1, ry / rx);
  ctx.beginPath();
  ctx.arc(cx, (cy * rx) / ry, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function burnName(ctx: CanvasRenderingContext2D, name: string, family: string, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, name, 600, family, Math.round(h * 0.72), w * 0.84);
  ctx.fillStyle = CHAR;
  ctx.shadowColor = "rgb(156 107 58 / 0.55)";
  ctx.shadowBlur = Math.max(2, h * 0.06);
  ctx.fillText(name, x + w / 2, y + h * 0.53);
  ctx.restore();
}

/** The top step up close: plate between two side-panel edges, under the tread nose. */
function drawPlate(ctx: CanvasRenderingContext2D, name: string, family: string, x: number, y: number, w: number, h: number) {
  const side = h * 0.3;
  const nose = h * 0.3;
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.lineJoin = "round";
  for (const sx of [x - side, x + w]) {
    roundRect(ctx, sx, y - nose - h * 0.25, side, h * 1.75 + nose, 6);
    ctx.fillStyle = BIRCH_LIGHT;
    ctx.fill();
    ctx.stroke();
    strata(ctx, sx, y - nose - h * 0.25, side, h * 1.75 + nose, true);
  }
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = BIRCH;
  ctx.fill();
  ctx.stroke();
  // grain along the plate
  ctx.strokeStyle = "rgb(200 149 90 / 0.4)";
  ctx.lineWidth = 2;
  for (const [a, b, c] of [
    [0.06, 0.62, 0.52],
    [0.14, 0.27, 0.35],
    [0.3, 0.84, 0.86],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x + w * a, y + h * b);
    ctx.quadraticCurveTo(x + w / 2, y + h * ((b + c) / 2 - 0.04), x + w * (1 - a), y + h * c);
    ctx.stroke();
  }
  ctx.fillStyle = "rgb(51 37 27 / 0.12)";
  ctx.fillRect(x, y + 2, w, h * 0.1);
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  roundRect(ctx, x, y - nose, w, nose, 6);
  ctx.fillStyle = BIRCH_LIGHT;
  ctx.fill();
  ctx.stroke();
  strata(ctx, x, y - nose, w, nose, false);
  ctx.restore();
  burnName(ctx, name, family, x, y, w, h);
}

/** Draws the card. Start it early (on pointer-down) so the share sheet still has the tap's activation. */
export async function renderStoryCard({ name, template, handle, host }: StoryInput): Promise<Blob> {
  const display = fontVar("--ff-display", "serif");
  const body = fontVar("--ff-body", "sans-serif");
  const hand = fontVar("--ff-hand", "sans-serif");
  const title = `تاتیِ ${name}، آمادهٔ اولین قدم‌ها`;

  const [tower, duck] = await Promise.all([
    loadImage(template.src),
    loadImage(DUCK_SRC).catch(() => null),
    document.fonts.load(`400 72px ${display}`, title),
    document.fonts.load(`600 120px ${hand}`, name),
    document.fonts.load(`700 44px ${body}`),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");

  // paper, the kahgel wall, the floor
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const wall = ctx.createLinearGradient(0, 300, 0, 1060);
  wall.addColorStop(0, PAPER);
  wall.addColorStop(0.35, WALL);
  wall.addColorStop(1, WALL);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 300, W, 760);
  ctx.fillStyle = "rgb(51 37 27 / 0.18)";
  ctx.fillRect(60, 1058, W - 120, 3);

  // brand line with Tati's red thread under it
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = `400 56px ${display}`;
  ctx.fillText("چوبز کیدز", W / 2, 262);
  ctx.strokeStyle = THREAD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 + 150, 300);
  ctx.lineTo(W / 2 - 150, 300);
  ctx.stroke();

  // the tower with the name on its step, Tati at its foot
  const towerH = 700;
  const scale = towerH / template.height;
  const towerW = template.width * scale;
  const towerX = W / 2 - towerW / 2 - 70;
  const floor = 1058;
  const towerY = floor - towerH;
  contactShadow(ctx, towerX + towerW * 0.62, floor, towerW * 0.48, 22);
  ctx.drawImage(tower, towerX, towerY, towerW, towerH);
  const [px, py, pw, ph] = template.plate;
  burnName(ctx, name, hand, towerX + px * towerW, towerY + py * towerH, pw * towerW, ph * towerH);
  if (duck) {
    const duckH = 190;
    const duckW = (duck.naturalWidth / duck.naturalHeight) * duckH;
    const duckX = towerX + towerW + 10;
    contactShadow(ctx, duckX + duckW / 2, floor, duckW * 0.5, 14);
    ctx.drawImage(duck, duckX, floor - duckH, duckW, duckH);
  }

  // the step up close
  drawPlate(ctx, name, hand, 110, 1170, W - 220, 150);

  // the line, the handle, the site
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  fitFont(ctx, title, 400, display, 72, W - 140);
  ctx.fillText(title, W / 2, 1500);
  ctx.direction = "ltr";
  if (handle) {
    ctx.font = `700 46px ${body}`;
    ctx.fillText(`@${handle}`, W / 2, 1600);
  }
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 36px ${body}`;
  ctx.fillText(host, W / 2, handle ? 1660 : 1600);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the card"))), "image/png"),
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function shareStoryCard(blob: Blob, name: string): Promise<StoryResult> {
  const filename = "choobz-story.png";
  const file = new File([blob], filename, { type: "image/png" });
  const data: ShareData = { files: [file], title: `تاتیِ ${name}` };
  if (navigator.canShare?.(data)) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // The share sheet refused (e.g. the tap's activation ran out): fall back to a download.
    }
  }
  download(blob, filename);
  return "downloaded";
}
