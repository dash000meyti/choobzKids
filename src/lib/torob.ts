import "server-only";
import { createPublicKey, verify, type KeyObject } from "node:crypto";
import type { Dimensions, ProductSpec } from "@/db/schema";
import { formatAgeRange, formatNumber, toFaDigits } from "@/lib/format";
import { absoluteUrl, isoTehran } from "@/lib/seo";
import { mediaUrl } from "@/lib/utils";

/*
 * Torob (ترب) price-comparison integration (SEO.md §6.1): product-page meta tags and the
 * Product API v3 serialiser. Torob works in TOMAN with Latin digits; one entry per product in
 * Phase 1 (the default variant's price). The visible price, these values and the JSON-LD (× 10)
 * all come from the same cached product data.
 */

type Availability = "in_stock" | "out_of_stock" | "preorder" | "made_to_order";

export type TorobPriceInput = {
  id: number;
  name: string;
  /** Toman. */
  price: number;
  compareAtPrice: number | null;
  availability: Availability;
  warrantyMonths: number | null;
  guaranteeText?: string | null;
  torobEnabled?: boolean;
  /** In display order; the first one is the default variant. */
  variants?: { price: number | null }[];
};

const isAvailable = (a: Availability) => a !== "out_of_stock";

function torobPrices(p: TorobPriceInput) {
  const available = isAvailable(p.availability);
  const price = p.variants?.[0]?.price ?? p.price;
  return {
    available,
    // Torob's convention for unavailable items is a zero price [VERIFY with Torob support].
    current: available ? price : 0,
    old: available && p.compareAtPrice && p.compareAtPrice > price ? p.compareAtPrice : null,
  };
}

/** Human text, so Persian digits even when the DB value was typed with Latin ones. */
const guarantee = (p: Pick<TorobPriceInput, "guaranteeText" | "warrantyMonths">) => {
  const text = p.guaranteeText?.trim() || (p.warrantyMonths ? `${p.warrantyMonths} ماه ضمانت کارگاه چوبز` : null);
  return text ? toFaDigits(text) : null;
};

/**
 * `<meta name>` tags for the product page `<head>` — pass as `pageMetadata({ other: torobMeta(p) })`.
 * `product_id` equals the API's `page_unique` and never changes. og:image comes from openGraph.
 */
export function torobMeta(p: TorobPriceInput): Record<string, string> {
  if (p.torobEnabled === false) return {};
  const { available, current, old } = torobPrices(p);
  const meta: Record<string, string> = {
    product_id: String(p.id),
    product_name: p.name,
    product_price: String(current),
    availability: available ? "instock" : "outofstock",
  };
  if (old) meta.product_old_price = String(old);
  const g = guarantee(p);
  if (g) meta.guarantee = g;
  return meta;
}

/* ------------------------------------------------------------------ */
/* Product API v3                                                        */
/* ------------------------------------------------------------------ */

export type TorobApiSource = TorobPriceInput & {
  slug: string;
  subtitle: string | null;
  summary: string;
  categoryName: string;
  /** Original upload paths (relative to UPLOAD_DIR), main image first. */
  imagePaths: string[];
  material: string | null;
  finish: string | null;
  dimensions: Dimensions | null;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  maxLoadKg: number | null;
  specs: ProductSpec[];
  /** ISO strings. */
  publishedAt: string | null;
  updatedAt: string;
};

export type TorobApiProduct = {
  page_unique: string;
  page_url: string;
  title: string;
  subtitle?: string;
  current_price: number;
  old_price?: number;
  availability: boolean;
  category_name: string;
  image_links: string[];
  short_desc?: string;
  spec: Record<string, string>;
  guarantee?: string;
  date_added: string;
  date_updated: string;
};

const clip = (s: string, max: number) => [...s].slice(0, max).join("");

/** Decimal-aware Persian number: 9.5 → «۹٫۵». */
const faNumber = (n: number) => formatNumber(n).replace(".", "٫");

/** Human-readable spec map (Persian digits); the product's own spec rows win on label clashes. */
function torobSpec(p: TorobApiSource): Record<string, string> {
  const spec: Record<string, string> = {};
  if (p.material) spec["جنس"] = p.material;
  if (p.finish) spec["روکش"] = p.finish;
  if (p.dimensions) {
    const { widthCm, depthCm, heightCm } = p.dimensions;
    spec["ابعاد"] = `${faNumber(widthCm)} × ${faNumber(depthCm)} × ${faNumber(heightCm)} سانتی‌متر`;
  }
  const age = formatAgeRange(p.ageMinMonths, p.ageMaxMonths);
  if (age) spec["مناسب برای سن"] = age;
  if (p.maxLoadKg) spec["حداکثر تحمل وزن"] = `${faNumber(p.maxLoadKg)} کیلوگرم`;
  for (const row of p.specs) spec[row.label] = row.value;
  return spec;
}

export function torobProduct(p: TorobApiSource): TorobApiProduct {
  const { available, current, old } = torobPrices(p);
  const g = guarantee(p);
  return {
    page_unique: String(p.id),
    page_url: absoluteUrl(`/product/${p.slug}`),
    title: clip(p.name, 500),
    ...(p.subtitle ? { subtitle: clip(p.subtitle, 500) } : {}),
    current_price: current,
    ...(old ? { old_price: old } : {}),
    availability: available,
    category_name: p.categoryName,
    image_links: p.imagePaths.map((path) => absoluteUrl(mediaUrl(path))),
    ...(p.summary ? { short_desc: clip(p.summary, 500) } : {}),
    spec: torobSpec(p),
    ...(g ? { guarantee: clip(g, 200) } : {}),
    date_added: isoTehran(p.publishedAt ?? p.updatedAt),
    date_updated: isoTehran(p.updatedAt),
  };
}

/* ------------------------------------------------------------------ */
/* Token verification (EdDSA JWT, torob_api_token_guide.md)             */
/* ------------------------------------------------------------------ */

// Published in Torob's token guide (2026-10) [VERIFY on integration day]; TOROB_PUBLIC_KEY overrides it.
const TOROB_PUBLIC_KEY_PEM =
  "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAt6Mu4T0pBORY11W+QeM35UsmLO3vsf+6yKpFDEImFk0=\n-----END PUBLIC KEY-----\n";

let torobKey: KeyObject | null = null;
function publicKey(): KeyObject {
  torobKey ??= createPublicKey(process.env.TOROB_PUBLIC_KEY?.replace(/\\n/g, "\n") || TOROB_PUBLIC_KEY_PEM);
  return torobKey;
}

const decodeJson = (part: string): Record<string, unknown> => JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

/**
 * True when `token` is an Ed25519-signed JWT from Torob, currently valid (nbf ≤ now ≤ exp) and
 * issued for this host (`aud` must equal the request Host header, port included).
 */
export function verifyTorobToken(token: string, host: string, nowSeconds: number): boolean {
  const [header, payload, signature, ...rest] = token.split(".");
  if (!header || !payload || !signature || rest.length) return false;
  try {
    if (decodeJson(header).alg !== "EdDSA") return false;
    const signed = verify(null, Buffer.from(`${header}.${payload}`), publicKey(), Buffer.from(signature, "base64url"));
    if (!signed) return false;
    const claims = decodeJson(payload);
    return (
      claims.aud === host &&
      typeof claims.exp === "number" &&
      typeof claims.nbf === "number" &&
      claims.nbf <= nowSeconds &&
      nowSeconds <= claims.exp
    );
  } catch {
    return false;
  }
}
