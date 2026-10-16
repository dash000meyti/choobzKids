import { useSyncExternalStore } from "react";
import { toast } from "@/components/layout/Toaster";
import { quoteRef, type CartQuote, type QuoteAvailability } from "./quote";

/*
 * The Phase 1 cart (DESIGN.md §4.7, TECH.md §2.5 rule 3): localStorage only, no server cart and no
 * cookies. One module-level store read through useSyncExternalStore, synced across tabs with the
 * `storage` event. The server snapshot is an empty, not-yet-ready cart, so the prerendered HTML
 * never depends on the visitor; islands read the real cart right after hydration.
 *
 * When storage is blocked (private mode, site data off) the cart lives in memory for this page
 * and the mother is told once (DESIGN.md §11.2 #15). Prices here are display snapshots; the
 * drawer refreshes them from /api/cart/quote and Phase 2 checkout re-validates on the server.
 */

export type CartAddons = {
  /** The child's name to laser-engrave ⚑. */
  engraving?: string;
};

export type CartItem = {
  /** Stable line id: product + variant + add-ons. */
  key: string;
  productId: number;
  variantId: number | null;
  slug: string;
  name: string;
  variantName: string | null;
  /** Toman per unit, add-ons included. */
  priceToman: number;
  /** Manifest drawing key for the line thumb. */
  illustration: string | null;
  /** Upload path (media.path) of a cut-out or photo, when the product has one. */
  imagePath: string | null;
  qty: number;
  addons?: CartAddons;
};

export type CartItemInput = Omit<CartItem, "key" | "qty"> & { qty?: number };

/** What the latest quote said about a line, kept for this page view only. */
export type LineStatus = {
  available: boolean;
  availability: QuoteAvailability;
  /** The price the line had before the quote changed it (DESIGN.md §11.2 #7). */
  previousPriceToman: number | null;
};

export type CartState = {
  items: CartItem[];
  /** Units, not lines («۳ کالا»). */
  count: number;
  /** Toman, available lines only. */
  subtotal: number;
  status: Record<string, LineStatus>;
  /** False until the browser cart has been read (always false on the server). */
  ready: boolean;
  /** False when the browser refuses to store the cart. */
  persistent: boolean;
};

export const CART_STORAGE_KEY = "cz.cart.v1";
export const MAX_LINE_QTY = 20;
const MAX_LINES = 30;
const BLOCKED_MESSAGE = "سبدت فقط تا بستن این صفحه می‌مونه؛ مرورگرت اجازهٔ ذخیره نمی‌ده.";

/** The persisted shape (DESIGN.md §4.7): ids and quantity, plus a display snapshot. */
type StoredLine = {
  productId: number;
  variantId: number | null;
  qty: number;
  addons: CartAddons;
  snap: {
    slug: string;
    name: string;
    variantName: string | null;
    priceToman: number;
    illustration: string | null;
    mediaPath?: string | null;
  };
  addedAt: number;
};

const SERVER_STATE: CartState = { items: [], count: 0, subtotal: 0, status: {}, ready: false, persistent: true };

let state: CartState = SERVER_STATE;
let loaded = false;
let warnedBlocked = false;
/** addedAt per line key, carried through rewrites so the stored order history survives. */
const addedAt = new Map<string, number>();
const listeners = new Set<() => void>();

export function lineKey(productId: number, variantId: number | null, addons?: CartAddons): string {
  const engraving = addons?.engraving?.trim();
  return `${productId}-${variantId ?? 0}${engraving ? `-${engraving}` : ""}`;
}

function clampQty(qty: number): number {
  return Math.min(MAX_LINE_QTY, Math.max(1, Math.round(qty) || 1));
}

function derive(items: CartItem[], status: Record<string, LineStatus>, persistent: boolean): CartState {
  let count = 0;
  let subtotal = 0;
  for (const item of items) {
    count += item.qty;
    if (status[item.key]?.available !== false) subtotal += item.priceToman * item.qty;
  }
  return { items, count, subtotal, status, ready: true, persistent };
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function fromStored(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const line = raw as Partial<StoredLine>;
  const snap = line.snap;
  if (!Number.isInteger(line.productId) || !snap || !isString(snap.slug) || !isString(snap.name)) return null;
  if (typeof snap.priceToman !== "number" || !Number.isFinite(snap.priceToman)) return null;
  const variantId = Number.isInteger(line.variantId) ? (line.variantId as number) : null;
  const engraving = isString(line.addons?.engraving) ? line.addons.engraving : undefined;
  const addons = engraving ? { engraving } : undefined;
  const key = lineKey(line.productId!, variantId, addons);
  if (typeof line.addedAt === "number") addedAt.set(key, line.addedAt);
  return {
    key,
    productId: line.productId!,
    variantId,
    slug: snap.slug,
    name: snap.name,
    variantName: isString(snap.variantName) ? snap.variantName : null,
    priceToman: Math.max(0, snap.priceToman),
    illustration: isString(snap.illustration) ? snap.illustration : null,
    imagePath: isString(snap.mediaPath) ? snap.mediaPath : null,
    qty: clampQty(typeof line.qty === "number" ? line.qty : 1),
    ...(addons ? { addons } : null),
  };
}

function toStored(item: CartItem): StoredLine {
  return {
    productId: item.productId,
    variantId: item.variantId,
    qty: item.qty,
    addons: item.addons ?? {},
    snap: {
      slug: item.slug,
      name: item.name,
      variantName: item.variantName,
      priceToman: item.priceToman,
      illustration: item.illustration,
      mediaPath: item.imagePath,
    },
    addedAt: addedAt.get(item.key) ?? Date.now(),
  };
}

/** Reads the stored cart. Throws when storage itself is unavailable. */
function readStorage(): CartItem[] {
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<string>();
  const items: CartItem[] = [];
  for (const entry of parsed.slice(0, MAX_LINES)) {
    const item = fromStored(entry);
    if (item && !seen.has(item.key)) {
      seen.add(item.key);
      items.push(item);
    }
  }
  return items;
}

function load() {
  loaded = true;
  try {
    state = derive(readStorage(), {}, true);
  } catch {
    state = derive([], {}, false);
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function commit(items: CartItem[], status: Record<string, LineStatus> = state.status) {
  let persistent = state.persistent;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.map(toStored)));
    persistent = true;
  } catch {
    persistent = false;
    if (!warnedBlocked) {
      warnedBlocked = true;
      // After the current toast (usually «… به سبد اضافه شد») has had its moment.
      window.setTimeout(() => toast(BLOCKED_MESSAGE, undefined, "warning"), 4200);
    }
  }
  state = derive(items, status, persistent);
  emit();
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== CART_STORAGE_KEY) return;
  try {
    const items = readStorage();
    state = derive(items, state.status, true);
    emit();
  } catch {
    // Storage went away mid-session; keep the in-memory cart.
  }
}

function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): CartState {
  if (!loaded) load();
  return state;
}

const getServerSnapshot = () => SERVER_STATE;

/** The cart for rendering. `ready` is false during prerender and hydration. */
export function useCart(): CartState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** The current cart outside React (event handlers, other islands). */
export function getCart(): CartState {
  return getSnapshot();
}

/**
 * Adds one or more products (a room adds several). Existing lines with the same product,
 * variant and add-ons get their quantity raised and their snapshot refreshed.
 * Returns the number of units added.
 */
export function addItems(input: CartItemInput | readonly CartItemInput[], opts: { qty?: number } = {}): number {
  getSnapshot();
  const list = Array.isArray(input) ? input : [input as CartItemInput];
  const items = [...state.items];
  let added = 0;
  for (const { qty: ownQty, ...entry } of list) {
    const qty = clampQty(ownQty ?? opts.qty ?? 1);
    const engraving = entry.addons?.engraving?.trim();
    const addons = engraving ? { engraving } : undefined;
    const key = lineKey(entry.productId, entry.variantId, addons);
    const index = items.findIndex((i) => i.key === key);
    if (index === -1) {
      if (items.length >= MAX_LINES) continue;
      addedAt.set(key, Date.now());
      items.push({ ...entry, key, qty, addons });
      added += qty;
    } else {
      const current = items[index];
      const next = clampQty(current.qty + qty);
      added += next - current.qty;
      items[index] = { ...current, ...entry, key, addons, qty: next };
    }
  }
  commit(items);
  return added;
}

export function setQty(key: string, qty: number) {
  getSnapshot();
  const next = clampQty(qty);
  if (!state.items.some((i) => i.key === key && i.qty !== next)) return;
  commit(state.items.map((i) => (i.key === key ? { ...i, qty: next } : i)));
}

export type RemovedLine = { item: CartItem; index: number; addedAt: number | undefined };

/** Removes a line and returns what `restoreItem` needs for «برگردون». */
export function removeItem(key: string): RemovedLine | null {
  getSnapshot();
  const index = state.items.findIndex((i) => i.key === key);
  if (index === -1) return null;
  const removed: RemovedLine = { item: state.items[index], index, addedAt: addedAt.get(key) };
  commit(state.items.filter((i) => i.key !== key));
  return removed;
}

export function restoreItem({ item, index, addedAt: at }: RemovedLine) {
  getSnapshot();
  if (state.items.some((i) => i.key === item.key)) return;
  if (at !== undefined) addedAt.set(item.key, at);
  const items = [...state.items];
  items.splice(Math.min(index, items.length), 0, item);
  commit(items);
}

export function clearCart() {
  getSnapshot();
  commit([], {});
}

/**
 * Applies a fresh quote: names and prices follow the catalogue, lines whose product or variant is
 * gone are dropped, and each line remembers its old price while this page is open.
 */
export function applyQuote(quote: CartQuote) {
  getSnapshot();
  const status: Record<string, LineStatus> = {};
  const items: CartItem[] = [];
  const missing = new Set(quote.missing);
  for (const item of state.items) {
    if (missing.has(quoteRef(item.productId, item.variantId))) continue;
    const line = quote.lines.find((l) => l.productId === item.productId && l.variantId === item.variantId);
    if (!line) {
      items.push(item);
      continue;
    }
    const engraving = item.addons?.engraving && line.engravingToman != null ? line.engravingToman : 0;
    const priceToman = line.priceToman + engraving;
    const earlier = state.status[item.key]?.previousPriceToman ?? null;
    status[item.key] = {
      available: line.available,
      availability: line.availability,
      previousPriceToman: priceToman !== item.priceToman ? item.priceToman : earlier,
    };
    items.push({
      ...item,
      slug: line.slug,
      name: line.name,
      variantName: line.variantName,
      priceToman,
      illustration: line.illustration,
      imagePath: line.imagePath,
    });
  }
  commit(items, status);
}
