import { toast } from "@/components/layout/Toaster";
import { normalizeFa } from "@/lib/format";
import type { StoryCardTemplate } from "./EngraverIsland";

/*
 * The engraver's live preview (DESIGN.md §1.3 (3), §5.7). Plain DOM code over the server markup
 * of NameEngraver, loaded by EngraverIsland on first focus or pointer.
 *
 * - While she types, the name appears as a faint pencil layout on the plate.
 * - 600 ms after she stops (or on Enter), the laser burns it right to left: the char layer is
 *   revealed by a clip sweep, an ember dot rides the burn front, an ember-hot copy cools a
 *   little behind it, and a wisp of smoke rises. 1.2–1.6 s, once per pause.
 * - Short names stretch along Mikhak's kashida axis (KSHD 100–200) to fill the plate, long ones
 *   shrink; measured after `document.fonts.load()` so the stretch is Mikhak's, not a fallback's.
 * - Reduced motion, «حرکت آرام» and the lite tier: the name appears charred at once.
 * The name never leaves the page: no storage, no request, except the order link she submits.
 */

type Options = { story: StoryCardTemplate | null; handle: string | null; host: string };
type LayerName = "pencil" | "char" | "glow";

const DEBOUNCE_MS = 600;
/** The plate face's viewBox width (NameEngraver's FACE.w) and how much of it a name fills. */
const FACE_W = 414;
const FILL = 0.84;
const FONT = { base: 38, min: 18, max: 46 } as const;
const KSHD = { min: 100, max: 200 } as const;

/* Letters, marks, spaces and ZWNJ only: a name, not markup or digits. */
const NOT_NAME = /[^\p{L}\p{M}‌ ]+/gu;

export function cleanName(value: string): string {
  return normalizeFa(value.replace(NOT_NAME, " "));
}

/** Letters that take a place on the plate (spaces and ZWNJ do not). */
export function letterCount(name: string): number {
  return [...name.replace(/[\s‌]/g, "")].length;
}

function motionAllowed(): boolean {
  const root = document.documentElement;
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    root.dataset.motion !== "reduce" &&
    !("lite" in root.dataset)
  );
}

const inset = (left: number, right: number) => `inset(0 ${(100 - right).toFixed(2)}% 0 ${left.toFixed(2)}%)`;

export function mountEngraver(form: HTMLFormElement, stage: HTMLElement, { story, handle, host }: Options): () => void {
  const field = form.elements.namedItem("engrave");
  if (!(field instanceof HTMLInputElement)) return () => {};
  const input: HTMLInputElement = field;

  const error = document.getElementById(`${input.id}-error`);
  const storyButton = form.querySelector<HTMLButtonElement>("[data-story]");
  const status = form.querySelector<HTMLElement>("[data-status]");
  const max = Number(form.dataset.max) || 14;

  const face = stage.querySelector<HTMLElement>('[data-layer="face"]');
  const ember = stage.querySelector<HTMLElement>('[data-layer="ember"]');
  const smoke = stage.querySelector<HTMLElement>('[data-layer="smoke"]');
  const layers = Object.fromEntries(
    (["pencil", "char", "glow"] as const).map((name) => [name, stage.querySelector<HTMLElement>(`[data-layer="${name}"]`)]),
  ) as Record<LayerName, HTMLElement | null>;
  const texts = Object.values(layers)
    .map((layer) => layer?.querySelector("text"))
    .filter((t): t is SVGTextElement => t instanceof SVGTextElement);
  if (!face || !ember || !smoke || texts.length !== 3) return () => {};

  const example = texts[0].textContent ?? "";
  const family = getComputedStyle(texts[0]).fontFamily;
  let burnt = "";
  let timer: number | undefined;
  let running: Animation[] = [];
  let generation = 0;

  const setState = (state: "draft" | "burning" | "burnt") => {
    stage.dataset.state = state;
  };

  const stop = () => {
    window.clearTimeout(timer);
    for (const a of running) a.cancel();
    running = [];
    generation += 1;
  };

  /** Writes the name into all three layers and fits it to the plate. */
  async function compose(name: string): Promise<boolean> {
    const mine = generation;
    try {
      await document.fonts.load(`600 ${FONT.base}px ${family}`, name);
    } catch {
      // Measure with whatever face is there; the burn still plays.
    }
    if (mine !== generation) return false;

    const set = (size: number, kshd: number) => {
      for (const t of texts) {
        t.textContent = name;
        t.style.fontSize = `${size}px`;
        t.style.fontVariationSettings = `"KSHD" ${Math.round(kshd)}`;
      }
    };
    const target = FACE_W * FILL;
    set(FONT.base, KSHD.min);
    const narrow = texts[0].getComputedTextLength();
    set(FONT.base, KSHD.max);
    const wide = texts[0].getComputedTextLength();

    let size: number = FONT.base;
    let kshd: number = KSHD.max;
    if (narrow >= target) {
      kshd = KSHD.min;
      size = (FONT.base * target) / narrow;
    } else if (wide > target && wide > narrow) {
      kshd = KSHD.min + ((target - narrow) / (wide - narrow)) * (KSHD.max - KSHD.min);
    } else if (wide > 0) {
      size = (FONT.base * target) / wide;
    }
    set(Math.min(FONT.max, Math.max(FONT.min, size)), kshd);
    return true;
  }

  function announce(message: string) {
    if (status) status.textContent = message;
  }

  function showError(on: boolean) {
    if (error) error.hidden = !on;
    if (on) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function reset() {
    stop();
    void compose(example).then(() => setState("burnt"));
    burnt = "";
    if (storyButton) storyButton.hidden = true;
  }

  async function burn(name: string) {
    stop();
    const mine = generation;
    if (!(await compose(name)) || mine !== generation) return;
    burnt = name;

    const done = () => {
      setState("burnt");
      if (storyButton) storyButton.hidden = !story;
      announce(`«${name}» روی پلهٔ برج حک شد.`);
    };
    if (!motionAllowed()) return done();

    // The name's extent on the plate, in % of the face (a little margin for the ember's halo).
    const box = texts[0].getBBox();
    const right = Math.min(100, ((box.x + box.width) / FACE_W) * 100 + 1);
    const left = Math.max(0, (box.x / FACE_W) * 100 - 1);
    const sweep = Math.min(1600, Math.max(1200, 900 + letterCount(name) * 70));
    const lag = sweep * 0.35;
    const total = sweep + lag;
    const at = (t: number) => right - (right - left) * Math.min(1, Math.max(0, t / sweep));
    const width = face!.getBoundingClientRect().width;

    setState("burning");
    const char = layers.char!.animate([{ clipPath: inset(right, 100) }, { clipPath: inset(left, 100) }], {
      duration: sweep,
      easing: "linear",
      fill: "both",
    });
    const glow = layers.glow!.animate(
      [
        { clipPath: inset(right, right), offset: 0 },
        { clipPath: inset(at(lag), right), offset: lag / total },
        { clipPath: inset(left, at(sweep - lag)), offset: sweep / total },
        { clipPath: inset(left, left), offset: 1 },
      ],
      { duration: total, easing: "linear", fill: "both" },
    );
    const dot = ember!.animate(
      [
        { translate: `${(right / 100) * width}px 0`, opacity: 0 },
        { opacity: 1, offset: 0.06 },
        { opacity: 1, offset: 0.94 },
        { translate: `${(left / 100) * width}px 0`, opacity: 0 },
      ],
      { duration: sweep, easing: "linear", fill: "both" },
    );
    smoke!.style.left = `${left}%`;
    smoke!.style.width = `${right - left}%`;
    const wisp = smoke!.animate(
      [
        { opacity: 0, translate: "0 4px", scale: "0.9 0.8" },
        { opacity: 0.6, offset: 0.35 },
        { opacity: 0, translate: "0 -22px", scale: "1.1 1.3" },
      ],
      { duration: 1100, delay: sweep * 0.55, easing: "ease-out", fill: "both" },
    );
    running = [char, glow, dot, wisp];

    try {
      await glow.finished;
      await wisp.finished;
    } catch {
      return; // cancelled by a new keystroke
    }
    if (mine !== generation) return;
    for (const a of running) a.cancel();
    running = [];
    done();
  }

  function onInput() {
    stop();
    const name = cleanName(input.value);
    const tooLong = letterCount(name) > max;
    showError(tooLong);
    if (!name) return reset();
    const mine = generation;
    void compose(name).then((ok) => {
      if (ok && mine === generation) setState("draft");
    });
    if (tooLong) return;
    timer = window.setTimeout(() => void burn(name), DEBOUNCE_MS);
  }

  function onSubmit(event: SubmitEvent) {
    const name = cleanName(input.value);
    const valid = name !== "" && letterCount(name) <= max;
    const ordering = event.submitter instanceof HTMLElement && event.submitter.hasAttribute("data-order");
    if (!ordering || !valid) {
      // Enter in the field burns now; an order needs a name that fits the plate.
      event.preventDefault();
      if (!valid) {
        showError(name !== "");
        input.focus();
      } else if (name !== burnt) {
        void burn(name);
      }
      return;
    }
    input.value = name;
  }

  /* The card is drawn as soon as a finger or pointer goes down on the button, keyed by name. */
  let card: { name: string; blob: Promise<Blob> } | null = null;
  function prepareCard(): Promise<Blob> | null {
    if (!story || !burnt) return null;
    if (card?.name !== burnt) {
      const request = { name: burnt, template: story, handle, host };
      card = { name: burnt, blob: import("./StoryCard").then((m) => m.renderStoryCard(request)) };
      card.blob.catch(() => (card = null));
    }
    return card.blob;
  }

  async function onStory() {
    const blob = prepareCard();
    if (!blob || !storyButton) return;
    const name = burnt;
    storyButton.setAttribute("aria-busy", "true");
    try {
      const [{ shareStoryCard }, png] = await Promise.all([import("./StoryCard"), blob]);
      if ((await shareStoryCard(png, name)) === "downloaded") toast("کارت استوری ذخیره شد", undefined, "check");
    } catch {
      toast("ساختن کارت استوری نشد؛ دوباره امتحان کن.", undefined, "warning");
    } finally {
      storyButton.removeAttribute("aria-busy");
    }
  }

  input.addEventListener("input", onInput);
  form.addEventListener("submit", onSubmit);
  storyButton?.addEventListener("pointerdown", prepareCard);
  storyButton?.addEventListener("click", onStory);
  // She may have typed before this module arrived.
  if (input.value.trim()) onInput();

  return () => {
    stop();
    // Back to the server frame, so nothing is left wired to a module that is gone.
    if (storyButton) storyButton.hidden = true;
    input.removeEventListener("input", onInput);
    form.removeEventListener("submit", onSubmit);
    storyButton?.removeEventListener("pointerdown", prepareCard);
    storyButton?.removeEventListener("click", onStory);
  };
}
