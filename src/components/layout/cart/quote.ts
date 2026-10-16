/*
 * The contract of GET /api/cart/quote (DESIGN.md §4.7): the drawer sends the lines it holds and
 * gets back today's names, prices and availability, plus one «کنارش خوب می‌شینه» suggestion.
 * Shared by the route handler and the client; prices are Toman.
 */

export type QuoteAvailability = "in_stock" | "out_of_stock" | "preorder" | "made_to_order";

export type QuoteLine = {
  productId: number;
  variantId: number | null;
  slug: string;
  name: string;
  variantName: string | null;
  /** Unit price of the product or variant, without add-ons. */
  priceToman: number;
  /** Price of the name-engraving add-on when the product offers it, else null. */
  engravingToman: number | null;
  availability: QuoteAvailability;
  /** False when the product was unpublished, the variant removed, or it is out of stock. */
  available: boolean;
  illustration: string | null;
  imagePath: string | null;
};

export type QuoteSuggestion = {
  productId: number;
  slug: string;
  name: string;
  priceToman: number;
  illustration: string | null;
  imagePath: string | null;
  /** With variants the suggestion links to the product page instead of adding directly. */
  hasVariants: boolean;
};

export type CartQuote = {
  lines: QuoteLine[];
  /** Requested `productId[:variantId]` refs that no longer exist at all. */
  missing: string[];
  suggestion: QuoteSuggestion | null;
};

export const QUOTE_ENDPOINT = "/api/cart/quote";
/** More refs than any real cart holds; the route rejects longer lists. */
export const QUOTE_MAX_REFS = 40;

/** `productId` or `productId:variantId`, the form the endpoint reads from `?ids=`. */
export function quoteRef(productId: number, variantId: number | null): string {
  return variantId == null ? String(productId) : `${productId}:${variantId}`;
}

function isQuote(value: unknown): value is CartQuote {
  const quote = value as CartQuote | null;
  return !!quote && Array.isArray(quote.lines) && Array.isArray(quote.missing);
}

/** Client helper: asks the endpoint about these lines. Rejects on network, HTTP or shape errors. */
export async function requestQuote(
  lines: readonly { productId: number; variantId: number | null }[],
  signal?: AbortSignal,
): Promise<CartQuote> {
  const ids = lines.map((l) => quoteRef(l.productId, l.variantId)).join(",");
  const response = await fetch(`${QUOTE_ENDPOINT}?ids=${encodeURIComponent(ids)}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`cart quote failed: ${response.status}`);
  const quote: unknown = await response.json();
  if (!isQuote(quote)) throw new Error("cart quote: unexpected response");
  return quote;
}
