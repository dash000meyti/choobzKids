import { connection, type NextRequest } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { media, productAddons, productMedia, productRelations, products, productVariants } from "@/db/schema";
import {
  QUOTE_MAX_REFS,
  quoteRef,
  type CartQuote,
  type QuoteLine,
  type QuoteSuggestion,
} from "@/components/layout/cart/quote";

/*
 * GET /api/cart/quote?ids=12,5:31 — today's name, price and availability for each cart line
 * (`productId` or `productId:variantId`), plus one «کنارش خوب می‌شینه» suggestion (DESIGN.md §4.7).
 * Request-time on purpose: never prerendered, never cached, read straight from SQLite. The cart
 * itself stays in the browser; Phase 2 checkout re-validates every price on the server.
 */

type Ref = { productId: number; variantId: number | null };

const REF_PATTERN = /^(\d{1,9})(?::(\d{1,9}))?$/;

function parseRefs(raw: string | null): Ref[] | null {
  if (!raw) return [];
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length > QUOTE_MAX_REFS) return null;
  const seen = new Set<string>();
  const refs: Ref[] = [];
  for (const part of parts) {
    const match = REF_PATTERN.exec(part);
    if (!match) return null;
    const ref = { productId: Number(match[1]), variantId: match[2] ? Number(match[2]) : null };
    const key = quoteRef(ref.productId, ref.variantId);
    if (!seen.has(key)) {
      seen.add(key);
      refs.push(ref);
    }
  }
  return refs;
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
  });
}

/** First uploaded picture per product (cut-outs and photos), keyed by product id. */
function firstImages(productIds: number[]): Map<number, string> {
  const rows = db
    .select({ productId: productMedia.productId, path: media.path, kind: media.kind })
    .from(productMedia)
    .innerJoin(media, eq(media.id, productMedia.mediaId))
    .where(inArray(productMedia.productId, productIds))
    .orderBy(asc(productMedia.sortOrder))
    .all();
  const images = new Map<number, string>();
  for (const row of rows) {
    if ((row.kind === "cutout" || row.kind === "photo") && !images.has(row.productId)) images.set(row.productId, row.path);
  }
  return images;
}

function suggestionFor(productIds: number[]): QuoteSuggestion | null {
  const relations = db
    .select({ relatedId: productRelations.relatedId, kind: productRelations.kind, sortOrder: productRelations.sortOrder })
    .from(productRelations)
    .where(and(inArray(productRelations.productId, productIds), inArray(productRelations.kind, ["bundle", "related"])))
    .all()
    .filter((r) => !productIds.includes(r.relatedId))
    // Bundle partners first (DESIGN.md §4.7); plain related products only when there is none.
    .sort((a, b) => (a.kind === b.kind ? a.sortOrder - b.sortOrder : a.kind === "bundle" ? -1 : 1));
  if (!relations.length) return null;

  const candidates = db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
      availability: products.availability,
      illustration: products.illustration,
    })
    .from(products)
    .where(and(inArray(products.id, relations.map((r) => r.relatedId)), eq(products.status, "published")))
    .all();
  const pick = relations
    .map((r) => candidates.find((c) => c.id === r.relatedId))
    .find((c) => c && c.availability !== "out_of_stock");
  if (!pick) return null;

  const variantPrices = db
    .select({ price: productVariants.price })
    .from(productVariants)
    .where(eq(productVariants.productId, pick.id))
    .all()
    .map((v) => v.price ?? pick.price);
  return {
    productId: pick.id,
    slug: pick.slug,
    name: pick.name,
    priceToman: variantPrices.length ? Math.min(...variantPrices) : pick.price,
    illustration: pick.illustration,
    imagePath: firstImages([pick.id]).get(pick.id) ?? null,
    hasVariants: variantPrices.length > 0,
  };
}

export async function GET(request: NextRequest) {
  await connection();
  const refs = parseRefs(request.nextUrl.searchParams.get("ids"));
  if (!refs) return json({ error: "ids must be up to 40 comma-separated productId[:variantId] values" }, 400);
  if (!refs.length) return json({ lines: [], missing: [], suggestion: null } satisfies CartQuote);

  const productIds = [...new Set(refs.map((r) => r.productId))];
  const rows = db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
      status: products.status,
      availability: products.availability,
      illustration: products.illustration,
    })
    .from(products)
    .where(inArray(products.id, productIds))
    .all();
  const variants = db
    .select({ id: productVariants.id, productId: productVariants.productId, name: productVariants.name, price: productVariants.price })
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds))
    .all();
  const engraving = db
    .select({ productId: productAddons.productId, price: productAddons.priceToman })
    .from(productAddons)
    .where(
      and(
        inArray(productAddons.productId, productIds),
        eq(productAddons.key, "engraving"),
        eq(productAddons.status, "published"),
      ),
    )
    .all();
  const images = firstImages(productIds);

  const lines: QuoteLine[] = [];
  const missing: string[] = [];
  for (const ref of refs) {
    const product = rows.find((p) => p.id === ref.productId);
    const variant = ref.variantId == null ? null : variants.find((v) => v.id === ref.variantId && v.productId === ref.productId);
    if (!product || (ref.variantId != null && !variant)) {
      missing.push(quoteRef(ref.productId, ref.variantId));
      continue;
    }
    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      slug: product.slug,
      name: product.name,
      variantName: variant?.name ?? null,
      priceToman: variant?.price ?? product.price,
      engravingToman: engraving.find((e) => e.productId === product.id)?.price ?? null,
      availability: product.availability,
      available: product.status === "published" && product.availability !== "out_of_stock",
      illustration: product.illustration,
      imagePath: images.get(product.id) ?? null,
    });
  }

  return json({ lines, missing, suggestion: suggestionFor(productIds) } satisfies CartQuote);
}
