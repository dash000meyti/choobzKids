import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, count, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, media, productMedia, products, productVariants } from "@/db/schema";
import { tag } from "@/lib/cache-tags";

/*
 * Shared catalogue reads used by every grid, embed, room and cart surface.
 * Everything returned is plain serialisable data (dates as ISO strings) so it can be passed
 * to client islands — but pass islands only ids and display strings (DESIGN.md §10.2).
 */

export type CardImage = {
  path: string;
  width: number | null;
  height: number | null;
  alt: string;
  dominantColor: string | null;
  kind: string;
};

export type ProductCardData = {
  id: number;
  slug: string;
  name: string;
  subtitle: string | null;
  summary: string;
  /** Toman. The lowest price the customer can pay (cheapest variant or base price). */
  price: number;
  compareAtPrice: number | null;
  availability: "in_stock" | "out_of_stock" | "preorder" | "made_to_order";
  leadTimeDays: number | null;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  skills: string[];
  illustration: string | null;
  isNew: boolean;
  featured: boolean;
  sortOrder: number;
  publishedAt: string | null;
  category: { slug: string; name: string; accent: string | null };
  swatches: { name: string; swatch: string }[];
  variantCount: number;
  /** First product photo/cut-out when one exists; otherwise cards show the manifest drawing. */
  image: CardImage | null;
};

function loadCards(where?: SQL): ProductCardData[] {
  const rows = db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      subtitle: products.subtitle,
      summary: products.summary,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      availability: products.availability,
      leadTimeDays: products.leadTimeDays,
      ageMinMonths: products.ageMinMonths,
      ageMaxMonths: products.ageMaxMonths,
      skills: products.skills,
      illustration: products.illustration,
      isNew: products.isNew,
      featured: products.featured,
      sortOrder: products.sortOrder,
      publishedAt: products.publishedAt,
      categorySlug: categories.slug,
      categoryName: categories.name,
      categoryAccent: categories.accent,
      categorySort: categories.sortOrder,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(where ? and(eq(products.status, "published"), where) : eq(products.status, "published"))
    .orderBy(asc(categories.sortOrder), asc(products.sortOrder), asc(products.id))
    .all();
  if (!rows.length) return [];

  const ids = rows.map((r) => r.id);
  const variants = db
    .select({
      productId: productVariants.productId,
      name: productVariants.name,
      price: productVariants.price,
      swatch: productVariants.swatch,
    })
    .from(productVariants)
    .where(inArray(productVariants.productId, ids))
    .orderBy(asc(productVariants.sortOrder))
    .all();
  const images = db
    .select({
      productId: productMedia.productId,
      path: media.path,
      width: media.width,
      height: media.height,
      alt: media.alt,
      dominantColor: media.dominantColor,
      kind: media.kind,
    })
    .from(productMedia)
    .innerJoin(media, eq(media.id, productMedia.mediaId))
    .where(inArray(productMedia.productId, ids))
    .orderBy(asc(productMedia.sortOrder))
    .all();

  return rows.map((r) => {
    const vs = variants.filter((v) => v.productId === r.id);
    const prices = vs.map((v) => v.price ?? r.price);
    const img = images.find((m) => m.productId === r.id) ?? null;
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      subtitle: r.subtitle,
      summary: r.summary,
      price: prices.length ? Math.min(...prices) : r.price,
      compareAtPrice: r.compareAtPrice,
      availability: r.availability,
      leadTimeDays: r.leadTimeDays,
      ageMinMonths: r.ageMinMonths,
      ageMaxMonths: r.ageMaxMonths,
      skills: r.skills,
      illustration: r.illustration,
      isNew: r.isNew,
      featured: r.featured,
      sortOrder: r.sortOrder,
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
      category: { slug: r.categorySlug, name: r.categoryName, accent: r.categoryAccent },
      swatches: vs.filter((v) => v.swatch).map((v) => ({ name: v.name, swatch: v.swatch! })),
      variantCount: vs.length,
      image: img
        ? { path: img.path, width: img.width, height: img.height, alt: img.alt, dominantColor: img.dominantColor, kind: img.kind }
        : null,
    };
  });
}

/** Every published product, in shop order (category order, then product order). */
export async function listProductCards(): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.products, tag.categories, tag.media);
  return loadCards();
}

/** Cards for specific slugs, returned in the order given (unknown slugs are skipped). */
export async function getProductCardsBySlugs(slugs: string[]): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.products, tag.categories, tag.media);
  if (!slugs.length) return [];
  const cards = loadCards(inArray(products.slug, slugs));
  return slugs.map((s) => cards.find((c) => c.slug === s)).filter((c): c is ProductCardData => !!c);
}

export async function listFeaturedProductCards(limit = 8): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.products, tag.categories, tag.media);
  return loadCards(eq(products.featured, true))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, limit);
}

export type CategorySummary = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  illustration: string | null;
  accent: string | null;
  sortOrder: number;
  productCount: number;
};

/** Categories in shelf order with their published product counts. */
export async function listCategories(): Promise<CategorySummary[]> {
  "use cache";
  cacheLife("content");
  cacheTag(tag.site, tag.categories, tag.products);
  const counts = db
    .select({ categoryId: products.categoryId, n: count() })
    .from(products)
    .where(eq(products.status, "published"))
    .groupBy(products.categoryId)
    .all();
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      tagline: categories.tagline,
      illustration: categories.illustration,
      accent: categories.accent,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder))
    .all()
    .map((c) => ({ ...c, productCount: counts.find((x) => x.categoryId === c.id)?.n ?? 0 }));
}
